import { PrismaClient } from "@prisma/client";
import mysql from "mysql2/promise";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

const PAYMENTS_DB_CONFIG = {
	host: process.env.PAYMENTS_DB_HOST || "57.128.253.89",
	user: process.env.PAYMENTS_DB_USER || "czarnecki",
	password: process.env.PAYMENTS_DB_PASSWORD || "N7#vQ4!xLp9@Tw2K",
	database: process.env.PAYMENTS_DB_NAME || "SM_Skladki",
	port: 3306,
};

interface MemberPaymentData {
	id: number;
	fullName: string;
	email: string;
	payFrom: Date;
	monthsShouldPay: number;
	paymentCount: number;
	monthsArrears: number;
	totalPaid: number;
	avgPayment: number;
	lastPaymentDate?: Date;
	paymentStatus: "paid" | "arrears" | "high_arrears" | "no_payments";
	suspendedUntil?: Date;
	suspendedMonths?: string;
}

interface PaymentSummary {
	totalMembers: number;
	totalArrears: number;
	totalPaid: number;
	averageArrears: number;
}

export async function syncPayments() {
	logger.debug("🔄 [PAYMENTS] Rozpoczynam synchronizację składek...");
	const startTime = Date.now();

	let connection: mysql.Connection | null = null;

	try {
		logger.debug("📡 [PAYMENTS] Łączenie z bazą składek...");
		connection = await mysql.createConnection(PAYMENTS_DB_CONFIG);
		logger.debug("✅ [PAYMENTS] Połączono z bazą składek");

		const [rows] = await connection.execute(`
			SELECT 
				m.id,
				m.full_name AS fullName,
				m.email,
				m.pay_from AS payFrom,
				m.suspended_until AS suspendedUntil,
				m.suspended_months AS suspendedMonths,
				TIMESTAMPDIFF(MONTH, m.pay_from, CURDATE()) AS monthsShouldPay,
				COUNT(p.id) AS paymentCount,
				TIMESTAMPDIFF(MONTH, m.pay_from, CURDATE()) - COUNT(p.id) AS monthsArrears,
				COALESCE(SUM(p.amount), 0) AS totalPaid,
				COALESCE(AVG(p.amount), 0) AS avgPayment,
				MAX(p.payment_date) AS lastPaymentDate,
				CASE 
					WHEN TIMESTAMPDIFF(MONTH, m.pay_from, CURDATE()) - COUNT(p.id) > 3 THEN 'high_arrears'
					WHEN TIMESTAMPDIFF(MONTH, m.pay_from, CURDATE()) - COUNT(p.id) > 0 THEN 'arrears'
					WHEN COUNT(p.id) = 0 THEN 'no_payments'
					ELSE 'paid'
				END AS paymentStatus
			FROM 
				members m
			LEFT JOIN 
				payments p ON m.id = p.member_id
			WHERE 
				m.pay_from IS NOT NULL
			GROUP BY 
				m.id, m.full_name, m.email, m.pay_from, 
				m.suspended_until, m.suspended_months
			ORDER BY 
				monthsArrears DESC
		`);

		const paymentData = rows as MemberPaymentData[];
		logger.debug(
			`📊 [PAYMENTS] Pobrano ${paymentData.length} rekordów składek`,
		);

		if (paymentData.length === 0) {
			logger.debug("⚠️ [PAYMENTS] Brak danych do synchronizacji");
			return;
		}

		const summary: PaymentSummary = {
			totalMembers: paymentData.length,
			totalArrears: paymentData.reduce(
				(sum, m) => sum + Math.max(0, m.monthsArrears),
				0,
			),
			totalPaid: paymentData.reduce((sum, m) => sum + m.totalPaid, 0),
			averageArrears:
				paymentData.reduce((sum, m) => sum + Math.max(0, m.monthsArrears), 0) /
					paymentData.length || 0,
		};

		logger.debug(`📊 [PAYMENTS] Podsumowanie:`, summary);

		logger.debug("🔄 [PAYMENTS] Zapisywanie danych w głównej bazie...");

		let updatedCount = 0;
		let createdCount = 0;
		let skippedCount = 0;

		for (const record of paymentData) {
			try {
				const user = await prisma.user.findUnique({
					where: { email: record.email },
					select: { id: true },
				});

				if (!user) {
					skippedCount++;
					continue;
				}

				const existingPayment = await prisma.payment.findUnique({
					where: { userId: user.id },
				});

				if (existingPayment) {
					await prisma.payment.update({
						where: { userId: user.id },
						data: {
							monthsShouldPay: record.monthsShouldPay,
							paymentCount: record.paymentCount,
							monthsArrears: record.monthsArrears,
							totalPaid: record.totalPaid,
							avgPayment: record.avgPayment,
							lastPaymentDate: record.lastPaymentDate,
							paymentStatus: record.paymentStatus,
							suspendedUntil: record.suspendedUntil,
							suspendedMonths: record.suspendedMonths,
							updatedAt: new Date(),
						},
					});
					updatedCount++;
				} else {
					await prisma.payment.create({
						data: {
							userId: user.id,
							monthsShouldPay: record.monthsShouldPay,
							paymentCount: record.paymentCount,
							monthsArrears: record.monthsArrears,
							totalPaid: record.totalPaid,
							avgPayment: record.avgPayment,
							lastPaymentDate: record.lastPaymentDate,
							paymentStatus: record.paymentStatus,
							suspendedUntil: record.suspendedUntil,
							suspendedMonths: record.suspendedMonths,
						},
					});
					createdCount++;
				}
			} catch (error) {
				logger.error(`❌ [PAYMENTS] Błąd zapisu dla ${record.email}:`, error);
				skippedCount++;
			}
		}

		const duration = Date.now() - startTime;
		logger.debug(`✅ [PAYMENTS] Zakończono w ${duration}ms`);
		logger.debug(`📊 [PAYMENTS] Podsumowanie:`);
		logger.debug(`   ✅ Zaktualizowano: ${updatedCount} użytkowników`);
		logger.debug(`   🆕 Utworzono: ${createdCount} użytkowników`);
		logger.debug(
			`   ⏭️ Pominięto: ${skippedCount} (nie znaleziono w głównej bazie)`,
		);

		return {
			members: paymentData,
			summary: summary,
		};
	} catch (error) {
		logger.error("❌ [PAYMENTS] Błąd synchronizacji:", error);
		throw error;
	} finally {
		if (connection) {
			await connection.end();
			logger.debug("🔌 [PAYMENTS] Zamknięto połączenie z bazą składek");
		}
		await prisma.$disconnect();
	}
}