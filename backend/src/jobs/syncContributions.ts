// src/jobs/syncContributions.ts

import { PrismaClient } from "@prisma/client";
import mysql from "mysql2/promise";
import { logger } from "../utils/logger";

// Dodaj na samym początku, przed wszystkim
console.log("🚀 [START] Uruchamianie syncContributions...");
logger.info("🚀 [START] Uruchamianie syncContributions...");

const prisma = new PrismaClient();

const CONTRIBUTIONS_DB_CONFIG = {
	host: process.env.CONTRIBUTIONS_DB_HOST || "57.128.253.89",
	user: process.env.CONTRIBUTIONS_DB_USER || "czarnecki",
	password: process.env.CONTRIBUTIONS_DB_PASSWORD || "",
	database: process.env.CONTRIBUTIONS_DB_NAME || "SM",
	port: 3306,
};

export async function syncContributions() {
	console.log("🔄 [CONTRIBUTIONS] Rozpoczynam synchronizację składek...");
	logger.info("🔄 [CONTRIBUTIONS] Rozpoczynam synchronizację składek...");
	const startTime = Date.now();

	let connection: mysql.Connection | null = null;

	try {
		console.log("📡 [CONTRIBUTIONS] Próba połączenia z SM_Skladki...");
		logger.info("📡 [CONTRIBUTIONS] Próba połączenia z SM_Skladki...");

		// TYLKO JEDNO POŁĄCZENIE - usunąłem duplikat
		connection = await mysql.createConnection(CONTRIBUTIONS_DB_CONFIG);
		console.log("✅ [CONTRIBUTIONS] Połączono z SM_Skladki");
		logger.info("✅ [CONTRIBUTIONS] Połączono z SM_Skladki");

		const currentDate = new Date();
		const currentMonth = currentDate.getMonth() + 1;
		const currentYear = currentDate.getFullYear();

		console.log(
			`📅 [CONTRIBUTIONS] Sprawdzam składki za: ${currentMonth}/${currentYear}`,
		);

		// Pobierz wszystkich członków z statusem płatności
		const [members] = await connection.execute(`
            SELECT 
                m.Legitymacja,
                m.full_name,
                m.email,
                m.pay_from,
                m.suspended_until,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 
                        FROM payments p 
                        WHERE p.member_legitymacja = m.Legitymacja 
                            AND p.payment_date >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
                            AND p.payment_date <= LAST_DAY(CURRENT_DATE())
                            AND p.blacklisted = 0
                    ) THEN 'paid'
                    ELSE 'pending'
                END as payment_status,
                (
                    SELECT amount 
                    FROM payments p 
                    WHERE p.member_legitymacja = m.Legitymacja 
                        AND p.payment_date >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
                        AND p.payment_date <= LAST_DAY(CURRENT_DATE())
                        AND p.blacklisted = 0
                    ORDER BY p.payment_date DESC 
                    LIMIT 1
                ) as amount,
                (
                    SELECT payment_date 
                    FROM payments p 
                    WHERE p.member_legitymacja = m.Legitymacja 
                        AND p.payment_date >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
                        AND p.payment_date <= LAST_DAY(CURRENT_DATE())
                        AND p.blacklisted = 0
                    ORDER BY p.payment_date DESC 
                    LIMIT 1
                ) as payment_date,
                (
                    SELECT assigned_months 
                    FROM payments p 
                    WHERE p.member_legitymacja = m.Legitymacja 
                        AND p.payment_date >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01')
                        AND p.payment_date <= LAST_DAY(CURRENT_DATE())
                        AND p.blacklisted = 0
                    ORDER BY p.payment_date DESC 
                    LIMIT 1
                ) as assigned_months,
                (
                    SELECT COUNT(*) 
                    FROM payments p 
                    WHERE p.member_legitymacja = m.Legitymacja 
                        AND p.blacklisted = 0
                ) as total_payments,
                (
                    SELECT MAX(payment_date) 
                    FROM payments p 
                    WHERE p.member_legitymacja = m.Legitymacja 
                        AND p.blacklisted = 0
                ) as last_payment_date
            FROM members m
            WHERE (m.suspended_until IS NULL OR m.suspended_until < CURRENT_DATE())
                AND m.Legitymacja IS NOT NULL
            ORDER BY m.full_name
        `);

		const membersData = members as Array<{
			Legitymacja: number;
			full_name: string;
			email: string;
			pay_from: Date;
			suspended_until: Date | null;
			payment_status: string;
			amount: number | null;
			payment_date: Date | null;
			assigned_months: number | null;
			total_payments: number;
			last_payment_date: Date | null;
		}>;

		console.log(
			`👥 [CONTRIBUTIONS] Znaleziono ${membersData.length} aktywnych członków`,
		);
		logger.info(
			`👥 [CONTRIBUTIONS] Znaleziono ${membersData.length} aktywnych członków`,
		);

		let paidCount = 0;
		let pendingCount = 0;
		let skippedCount = 0;
		let errorCount = 0;

		// Synchronizuj każdego członka
		for (const member of membersData) {
			try {
				// Znajdź użytkownika w głównej bazie po emailu
				const user = await prisma.user.findUnique({
					where: { email: member.email },
					select: {
						id: true,
						email: true,
						first_name: true,
						last_name: true,
					},
				});

				if (!user) {
					logger.warn(
						`⚠️ [CONTRIBUTIONS] Nie znaleziono użytkownika: ${member.email}`,
					);
					skippedCount++;
					continue;
				}

				const isPaid = member.payment_status === "paid";

				// Sprawdź czy istnieje rekord składki w głównej bazie
				const existingContribution = await prisma.contribution.findFirst({
					where: {
						userId: user.id,
						month: currentMonth,
						year: currentYear,
					},
				});

				if (isPaid && member.amount) {
					// ✅ OPŁACONE - KONWERSJA NA FLOAT
					const amountFloat = parseFloat(member.amount.toString());

					if (existingContribution) {
						await prisma.contribution.update({
							where: { id: existingContribution.id },
							data: {
								amount: amountFloat,
								paidAt: member.payment_date || new Date(),
								status: "PAID",
								updatedAt: new Date(),
								monthsPaid: member.assigned_months || 1,
							},
						});
					} else {
						await prisma.contribution.create({
							data: {
								userId: user.id,
								amount: amountFloat, // <-- TU BYŁ BŁĄD! POPRAWIONE
								month: currentMonth,
								year: currentYear,
								paidAt: member.payment_date || new Date(),
								status: "PAID",
								monthsPaid: member.assigned_months || 1,
							},
						});
					}

					await prisma.user.update({
						where: { id: user.id },
						data: {
							lastContributionPaidAt: member.payment_date || new Date(),
							contributionStatus: "PAID",
							contributionOverdueMonths: 0,
						},
					});

					paidCount++;
					console.log(
						`✅ [CONTRIBUTIONS] ${member.full_name}: opłacono ${amountFloat} zł`,
					);
					logger.debug(
						`✅ [CONTRIBUTIONS] ${member.full_name}: opłacono ${amountFloat} zł`,
					);
				} else {
					// ❌ NIEOPŁACONE
					if (existingContribution) {
						await prisma.contribution.update({
							where: { id: existingContribution.id },
							data: {
								status: "PENDING",
								amount: 0,
								monthsPaid: 0,
							},
						});
					} else {
						await prisma.contribution.create({
							data: {
								userId: user.id,
								amount: 0,
								month: currentMonth,
								year: currentYear,
								status: "PENDING",
								monthsPaid: 0,
							},
						});
					}

					await prisma.user.update({
						where: { id: user.id },
						data: {
							contributionStatus: "PENDING",
						},
					});

					// Wyślij powiadomienie (tylko jeśli nie ma zawieszenia)
					if (
						!member.suspended_until ||
						new Date(member.suspended_until) < new Date()
					) {
						await checkAndSendNotification(
							user.id,
							member.full_name,
							currentMonth,
							currentYear,
						);
					}

					pendingCount++;
					// logger.debug(`⚠️ [CONTRIBUTIONS] ${member.full_name}: nieopłacone`);
				}
			} catch (error) {
				console.error(
					`❌ [CONTRIBUTIONS] Błąd dla ${member.full_name}:`,
					error,
				);
				logger.error(`❌ [CONTRIBUTIONS] Błąd dla ${member.full_name}:`, error);
				errorCount++;
			}
		}

		const duration = Date.now() - startTime;
		console.log(`✅ [CONTRIBUTIONS] Zakończono w ${duration}ms`);
		console.log(`📊 [CONTRIBUTIONS] Podsumowanie:`);
		console.log(`   ✅ Opłacone: ${paidCount} użytkowników`);
		console.log(`   ❌ Nieopłacone: ${pendingCount} użytkowników`);
		console.log(
			`   ⏭️ Pominięto: ${skippedCount} (nie znaleziono w głównej bazie)`,
		);
		console.log(`   ❌ Błędów: ${errorCount}`);

		logger.info(`✅ [CONTRIBUTIONS] Zakończono w ${duration}ms`);
		logger.info(`📊 [CONTRIBUTIONS] Podsumowanie:`);
		logger.info(`   ✅ Opłacone: ${paidCount} użytkowników`);
		logger.info(`   ❌ Nieopłacone: ${pendingCount} użytkowników`);
		logger.info(
			`   ⏭️ Pominięto: ${skippedCount} (nie znaleziono w głównej bazie)`,
		);
		logger.info(`   ❌ Błędów: ${errorCount}`);
	} catch (error) {
		console.error("❌ [CONTRIBUTIONS] Błąd synchronizacji:", error);
		logger.error("❌ [CONTRIBUTIONS] Błąd synchronizacji:", error);
		throw error;
	} finally {
		if (connection) {
			await connection.end();
			console.log("🔌 [CONTRIBUTIONS] Zamknięto połączenie z SM_Skladki");
			logger.info("🔌 [CONTRIBUTIONS] Zamknięto połączenie z SM_Skladki");
		}
		await prisma.$disconnect();
	}
}

async function checkAndSendNotification(
	userId: number,
	fullName: string,
	month: number,
	year: number,
) {
	try {
		const existingNotification = await prisma.notification.findFirst({
			where: {
				user_id: userId,
				message: {
					contains: `zaległą składkę za ${getMonthName(month)}`,
				},
				created_at: {
					gte: new Date(year, month - 1, 1),
				},
			},
		});

		if (!existingNotification) {
			await prisma.notification.create({
				data: {
					user_id: userId,
					type: "warning",
					title: "Zaległa składka",
					message: `Masz zaległą składkę za ${getMonthName(month)} ${year}. Opłać ją jak najszybciej.`,
					read: false,
					link: "/profile",
					target: "user",
				},
			});
			console.log(`📨 [CONTRIBUTIONS] Wysłano powiadomienie dla ${fullName}`);
			logger.debug(`📨 [CONTRIBUTIONS] Wysłano powiadomienie dla ${fullName}`);
		}
	} catch (error) {
		console.error(`❌ [CONTRIBUTIONS] Błąd wysyłania powiadomienia:`, error);
		logger.error(`❌ [CONTRIBUTIONS] Błąd wysyłania powiadomienia:`, error);
	}
}

function getMonthName(
	month: number,
	form: "nominative" | "genitive" = "genitive",
): string {
	const months = {
		nominative: [
			"styczeń",
			"luty",
			"marzec",
			"kwiecień",
			"maj",
			"czerwiec",
			"lipiec",
			"sierpień",
			"wrzesień",
			"październik",
			"listopad",
			"grudzień",
		],
		genitive: [
			"stycznia",
			"lutego",
			"marca",
			"kwietnia",
			"maja",
			"czerwca",
			"lipca",
			"sierpnia",
			"września",
			"października",
			"listopada",
			"grudnia",
		],
	};

	return months[form][month - 1] || month.toString();
}
// ============================================================
// URUCHOMIENIE BEZPOŚREDNIE - DODAJ NA KONIEC PLIKU!
// ============================================================

if (require.main === module) {
	console.log("🚀 [DIRECT] Wywołanie syncContributions()...");

	syncContributions()
		.then(() => {
			console.log("✅ [DIRECT] Synchronizacja zakończona pomyślnie");
			// TYLKO TUTAJ UŻYJ process.exit() - gdy uruchamiasz bezpośrednio
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ [DIRECT] Błąd synchronizacji:", error);
			process.exit(1);
		});
}
