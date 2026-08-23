

import { PrismaClient } from "@prisma/client";
import mysql from "mysql2/promise";
import { logger } from "../utils/logger";



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

	logger.info("🔄 [CONTRIBUTIONS] Rozpoczynam synchronizację składek...");
	const startTime = Date.now();

	let connection: mysql.Connection | null = null;

	try {

		logger.info("📡 [CONTRIBUTIONS] Próba połączenia z SM_Skladki...");


		connection = await mysql.createConnection(CONTRIBUTIONS_DB_CONFIG);

		logger.info("✅ [CONTRIBUTIONS] Połączono z SM_Skladki");

		const currentDate = new Date();
		const currentMonth = currentDate.getMonth() + 1;
		const currentYear = currentDate.getFullYear();






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




		logger.info(
			`👥 [CONTRIBUTIONS] Znaleziono ${membersData.length} aktywnych członków`,
		);

		let paidCount = 0;
		let pendingCount = 0;
		let skippedCount = 0;
		let errorCount = 0;


		for (const member of membersData) {
			try {

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


				const existingContribution = await prisma.contribution.findFirst({
					where: {
						userId: user.id,
						month: currentMonth,
						year: currentYear,
					},
				});

				if (isPaid && member.amount) {

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
								amount: amountFloat, 
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



					logger.debug(
						`✅ [CONTRIBUTIONS] ${member.full_name}: opłacono ${amountFloat} zł`,
					);
				} else {

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




if (require.main === module) {


	syncContributions()
		.then(() => {


			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ [DIRECT] Błąd synchronizacji:", error);
			process.exit(1);
		});
}
