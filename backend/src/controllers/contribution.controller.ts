// src/controllers/contribution.controller.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
import mysql from "mysql2/promise";

const prisma = new PrismaClient();
interface PaymentRow {
	Legitymacja: number;
	pay_from: Date | null;
	suspended_until: Date | null;
	payment_status: 'paid' | 'pending';
	amount: number | null;
	payment_date: Date | null;
	total_payments: number;
	total_paid: number;
}

interface HistoryRow {
	month: number;
	year: number;
	amount: number;
	payment_date: Date;
	assigned_months: number;
	status: 'paid' | 'pending';
	description: string;
}
// Rozszerzenie Request o user (dla auth middleware)
interface AuthRequest extends Request {
	user?: {
		id: number;
		email: string;
		role: string;
		first_name?: string;
		last_name?: string;
	};
}

const CONTRIBUTIONS_DB_CONFIG = {
	host: process.env.CONTRIBUTIONS_DB_HOST || "57.128.253.89",
	user: process.env.CONTRIBUTIONS_DB_USER || "czarnecki",
	password: process.env.CONTRIBUTIONS_DB_PASSWORD || "",
	database: process.env.CONTRIBUTIONS_DB_NAME || "SM",
	port: 3306,
};

export class ContributionController {
	/**
	 * Pobiera statystyki składek dla zalogowanego użytkownika
	 */
	async getMyContributionStats(req: AuthRequest, res: Response) {
		try {
			const userId = req.user?.id;

			if (!userId) {
				return res.status(401).json({ error: "Nieautoryzowany" });
			}

			const currentDate = new Date();
			const currentMonth = currentDate.getMonth() + 1;
			const currentYear = currentDate.getFullYear();

			// Pobierz wszystkie składki użytkownika
			const contributions = await prisma.contribution.findMany({
				where: {
					userId: userId,
				},
				orderBy: [{ year: "desc" }, { month: "desc" }],
			});

			// Znajdź składkę na bieżący miesiąc
			const currentMonthContribution = contributions.find(
				(c) => c.month === currentMonth && c.year === currentYear,
			);

			// Oblicz statystyki
			const totalPaid = contributions
				.filter((c) => c.status === "PAID")
				.reduce((sum, c) => sum + c.amount, 0);

			const totalPending = contributions.filter(
				(c) => c.status === "PENDING",
			).length;

			const totalPaidCount = contributions.filter(
				(c) => c.status === "PAID",
			).length;

			// Historia ostatnich 12 miesięcy
			const last12Months = [];
			for (let i = 0; i < 12; i++) {
				const date = new Date();
				date.setMonth(date.getMonth() - i);
				const month = date.getMonth() + 1;
				const year = date.getFullYear();

				const contribution = contributions.find(
					(c) => c.month === month && c.year === year,
				);

				last12Months.push({
					month,
					year,
					monthName: getMonthName(month),
					status: contribution?.status || "PENDING",
					amount: contribution?.amount || 0,
					paidAt: contribution?.paidAt || null,
				});
			}

			const stats = {
				currentMonth: {
					month: currentMonth,
					year: currentYear,
					monthName: getMonthName(currentMonth),
					status: currentMonthContribution?.status || "PENDING",
					amount: currentMonthContribution?.amount || 0,
					isPaid: currentMonthContribution?.status === "PAID",
					paidAt: currentMonthContribution?.paidAt || null,
				},
				summary: {
					totalPaid: totalPaid,
					totalPaidCount: totalPaidCount,
					totalPending: totalPending,
					totalContributions: contributions.length,
				},
				history: last12Months,
			};

			res.json(stats);
		} catch (error) {
			logger.error("❌ [Contribution] Błąd pobierania statystyk:", error);
			res.status(500).json({ error: "Nie udało się pobrać statystyk składek" });
		}
	}

	/**
	 * Pobiera wszystkich użytkowników z zaległymi składkami (dla admina)
	 */
	async getOverdueContributions(req: AuthRequest, res: Response) {
		try {
			// Tylko admin/zarząd może to zobaczyć
			if (req.user?.role !== "admin" && req.user?.role !== "board") {
				return res.status(403).json({ error: "Brak uprawnień" });
			}

			const currentDate = new Date();
			const currentMonth = currentDate.getMonth() + 1;
			const currentYear = currentDate.getFullYear();

			const overdueUsers = await prisma.user.findMany({
				where: {
					status: {
						in: ["active", "trial", "mentor"],
					},
					contributions: {
						some: {
							month: currentMonth,
							year: currentYear,
							status: "PENDING",
						},
					},
				},
				select: {
					id: true,
					first_name: true,
					last_name: true,
					email: true,
					team: true,
					status: true,
					contributions: {
						where: {
							month: currentMonth,
							year: currentYear,
						},
						select: {
							amount: true,
							status: true,
							month: true,
							year: true,
						},
					},
				},
			});

			res.json({
				count: overdueUsers.length,
				users: overdueUsers,
			});
		} catch (error) {
			logger.error("❌ [Contribution] Błąd pobierania zaległych:", error);
			res.status(500).json({ error: "Nie udało się pobrać zaległych składek" });
		}
	}

	/**
	 * Ręczna synchronizacja składek (dla admina)
	 */
	async syncContributionsManual(req: AuthRequest, res: Response) {
		try {
			// Tylko admin/zarząd może uruchomić ręczną synchronizację
			if (req.user?.role !== "admin" && req.user?.role !== "board") {
				return res.status(403).json({ error: "Brak uprawnień" });
			}

			const { syncContributions } =
				await import("../jobs/syncContributions.js");

			// Uruchom synchronizację w tle
			syncContributions()
				.then(() => {
					logger.info("✅ [Manual] Synchronizacja składek zakończona");
				})
				.catch((error: Error) => {
					logger.error("❌ [Manual] Błąd synchronizacji składek:", error);
				});

			res.json({
				message: "Synchronizacja składek rozpoczęta",
				status: "processing",
			});
		} catch (error) {
			logger.error("❌ [Contribution] Błąd ręcznej synchronizacji:", error);
			res.status(500).json({ error: "Nie udało się uruchomić synchronizacji" });
		}
	}

	/**
	 * Pobiera składki dla wszystkich użytkowników (dla listy członków)
	 */
	async getAllContributionsSummary(req: AuthRequest, res: Response) {
		try {
			// Tylko admin/board może to zobaczyć
			if (req.user?.role !== "admin" && req.user?.role !== "board") {
				return res.status(403).json({ error: "Brak uprawnień" });
			}

			const currentDate = new Date();
			const currentMonth = currentDate.getMonth() + 1;
			const currentYear = currentDate.getFullYear();

			// Pobierz wszystkie składki za bieżący miesiąc
			const contributions = await prisma.contribution.findMany({
				where: {
					month: currentMonth,
					year: currentYear,
				},
				select: {
					userId: true,
					status: true,
					amount: true,
				},
			});

			// Stwórz mapę userId -> status
			const contributionMap = new Map();
			contributions.forEach((c) => {
				contributionMap.set(c.userId, {
					status: c.status,
					amount: c.amount,
				});
			});

			res.json({
				month: currentMonth,
				year: currentYear,
				contributions: Object.fromEntries(contributionMap),
			});
		} catch (error) {
			logger.error(
				"❌ [Contribution] Błąd pobierania wszystkich składek:",
				error,
			);
			res.status(500).json({ error: "Nie udało się pobrać składek" });
		}
	}

	/**
	 * Pobiera wszystkie składki użytkownika
	 */
	async getUserContributions(req: AuthRequest, res: Response) {
		try {
			// Pobierz userId z params lub z zalogowanego użytkownika
			const paramUserId = req.params.userId;
			let targetUserId: number | undefined;

			if (paramUserId) {
				const userIdStr = Array.isArray(paramUserId) ? paramUserId[0] : (paramUserId as string);

				targetUserId = parseInt(userIdStr);

				if (isNaN(targetUserId)) {
					return res
						.status(400)
						.json({ error: "Nieprawidłowe ID użytkownika" });
				}
			} else {
				targetUserId = req.user?.id;
			}

			if (!targetUserId) {
				return res.status(401).json({ error: "Nieautoryzowany" });
			}

			// Jeśli ktoś próbuje pobrać cudze składki, sprawdź uprawnienia
			if (paramUserId && req.user?.id !== targetUserId) {
				if (req.user?.role !== "admin" && req.user?.role !== "board") {
					return res.status(403).json({ error: "Brak uprawnień" });
				}
			}

			const contributions = await prisma.contribution.findMany({
				where: {
					userId: targetUserId,
				},
				orderBy: [{ year: "desc" }, { month: "desc" }],
			});

			res.json(contributions);
		} catch (error) {
			logger.error("❌ [Contribution] Błąd pobierania składek:", error);
			res.status(500).json({ error: "Nie udało się pobrać składek" });
		}
	}

	/**
	 * Dodaje ręcznie składkę (dla admina)
	 */
	async addContribution(req: AuthRequest, res: Response) {
		try {
			if (req.user?.role !== "admin" && req.user?.role !== "board") {
				return res.status(403).json({ error: "Brak uprawnień" });
			}

			const { userId, amount, month, year, paidAt, status } = req.body;

			if (!userId || !amount || !month || !year) {
				return res.status(400).json({ error: "Brak wymaganych pól" });
			}

			// 🔥 PRZENIEŚ DEKLARACJĘ NA POCZĄTEK - PRZED UŻYCIEM
			const userIdStr = Array.isArray(userId) ? userId[0] : userId;

			const user = await prisma.user.findUnique({
				where: { id: parseInt(userIdStr) }, // <-- TERAZ DZIAŁA
			});

			if (!user) {
				return res.status(404).json({ error: "Użytkownik nie istnieje" });
			}

			const existing = await prisma.contribution.findFirst({
				where: {
					userId: parseInt(userIdStr), // <-- UŻYJ userIdStr
					month,
					year,
				},
			});

			if (existing) {
				return res
					.status(400)
					.json({ error: "Składka za ten miesiąc już istnieje" });
			}

			const contribution = await prisma.contribution.create({
				data: {
					userId: parseInt(userIdStr), // <-- UŻYJ userIdStr
					amount,
					month,
					year,
					paidAt: paidAt ? new Date(paidAt) : new Date(),
					status: status || "PAID",
				},
			});

			await prisma.user.update({
				where: { id: parseInt(userIdStr) }, // <-- UŻYJ userIdStr
				data: {
					contributionStatus: "PAID",
					lastContributionPaidAt: paidAt ? new Date(paidAt) : new Date(),
				},
			});

			logger.info(
				`✅ [Contribution] Dodano składkę dla ${user.email} - ${amount} zł`,
			);
			res.status(201).json(contribution);
		} catch (error) {
			logger.error("❌ [Contribution] Błąd dodawania składki:", error);
			res.status(500).json({ error: "Nie udało się dodać składki" });
		}
	}

	/**
	 * Aktualizuje składkę (dla admina)
	 */
	async updateContribution(req: AuthRequest, res: Response) {
		try {
			if (req.user?.role !== "admin" && req.user?.role !== "board") {
				return res.status(403).json({ error: "Brak uprawnień" });
			}

			const { id } = req.params;
			const idStr = Array.isArray(id) ? id[0] : id;
			const { amount, status, paidAt } = req.body;

			const contribution = await prisma.contribution.update({
				where: { id: idStr },

				data: {
					amount: amount || undefined,
					status: status || undefined,
					paidAt: paidAt ? new Date(paidAt) : undefined,
				},
			});

			if (status === "PAID") {
				await prisma.user.update({
					where: { id: contribution.userId },
					data: {
						contributionStatus: "PAID",
						lastContributionPaidAt: paidAt ? new Date(paidAt) : new Date(),
					},
				});
			}

			logger.info(`✅ [Contribution] Zaktualizowano składkę ${id}`);
			res.json(contribution);
		} catch (error) {
			logger.error("❌ [Contribution] Błąd aktualizacji składki:", error);
			res.status(500).json({ error: "Nie udało się zaktualizować składki" });
		}
	}

	/**
	 * Usuwa składkę (dla admina)
	 */
	async deleteContribution(req: AuthRequest, res: Response) {
		try {
			if (req.user?.role !== "admin" && req.user?.role !== "board") {
				return res.status(403).json({ error: "Brak uprawnień" });
			}

			const { id } = req.params;
			const idStr = Array.isArray(id) ? id[0] : id;
			await prisma.contribution.delete({
				where: { id: idStr },
			});

			logger.info(`✅ [Contribution] Usunięto składkę ${id}`);
			res.json({ message: "Składka usunięta" });
		} catch (error) {
			logger.error("❌ [Contribution] Błąd usuwania składki:", error);
			res.status(500).json({ error: "Nie udało się usunąć składki" });
		}
	}

	/**
	 * Pobiera historię składek użytkownika z bazy SM
	 * GET /api/contributions/history/:userId
	 */
	async getContributionHistory(req: AuthRequest, res: Response) {
		try {
			let userId = req.params.userId;
			const currentUserId = req.user?.id;

			// 🔥 OBSŁUGA "me" - ZAMIEŃ NA ID ZALOGOWANEGO UŻYTKOWNIKA
			if (userId === "me") {
				if (!currentUserId) {
					return res.status(401).json({ error: "Nieautoryzowany" });
				}
				userId = currentUserId.toString();
			}

			if (!userId) {
				return res.status(400).json({ error: "Brak ID użytkownika" });
			}

			// Sprawdź uprawnienia - używamy `role` z req.user zamiast zapytania do bazy
			const userIdStr = Array.isArray(userId) ? userId[0] : userId;
			const isAuthorized =
				req.user?.role === "admin" ||
				req.user?.role === "board" ||
				parseInt(userIdStr) === currentUserId;

			if (!isAuthorized) {
				return res.status(403).json({
					error: "Brak uprawnień do przeglądania historii składek"
				});
			}

			const user = await prisma.user.findUnique({
				where: { id: parseInt(userIdStr) },
				select: {
					id: true,
					email: true,
					first_name: true,
					last_name: true
				}
			});

			if (!user) {
				return res.status(404).json({ error: "Użytkownik nie istnieje" });
			}

			const connection = await mysql.createConnection(CONTRIBUTIONS_DB_CONFIG);

			// Pobierz historię składek z ostatnich 12 miesięcy
			const [rows] = await connection.execute(`
                SELECT 
                    MONTH(payment_date) as month,
                    YEAR(payment_date) as year,
                    amount,
                    payment_date,
                    assigned_months,
                    CASE 
                        WHEN amount > 0 AND amount IS NOT NULL THEN 'paid'
                        ELSE 'pending'
                    END as status,
                    'Składka członkowska' as description
                FROM payments p
                WHERE p.member_legitymacja = (
                    SELECT Legitymacja 
                    FROM members 
                    WHERE email = ?
                )
                AND p.blacklisted = 0
                AND YEAR(payment_date) >= YEAR(CURRENT_DATE) - 1
                ORDER BY payment_date DESC
                LIMIT 24
            `, [user.email]);

			await connection.end();

			// rows to tablica, sprawdzamy jej długość
			const historyData = Array.isArray(rows) ? (rows as HistoryRow[]) : [];

			// Jeśli brak historii, spróbuj pobrać datę aktywacji
			if (historyData.length === 0) {
				const connection2 = await mysql.createConnection(CONTRIBUTIONS_DB_CONFIG);
				const [memberRows] = await connection2.execute(`
                    SELECT 
                        MONTH(pay_from) as month,
                        YEAR(pay_from) as year,
                        0 as amount,
                        'pending' as status,
                        'Aktywacja członkostwa' as description
                    FROM members
                    WHERE email = ?
                `, [user.email]);
				await connection2.end();

				const memberData = Array.isArray(memberRows) ? memberRows : [];

				return res.status(200).json({
					history: memberData,
					total: memberData.length,
					userId: user.id,
					userEmail: user.email,
					userName: `${user.first_name} ${user.last_name}`
				});
			}

			return res.status(200).json({
				history: historyData,
				total: historyData.length,
				userId: user.id,
				userEmail: user.email,
				userName: `${user.first_name} ${user.last_name}`
			});

		} catch (error) {
			logger.error("❌ Błąd pobierania historii składek:", error);
			return res.status(500).json({
				error: "Nie udało się pobrać historii składek"
			});
		}
	}

	/**
	 * Pobiera aktualny stan składki użytkownika z bazy SM
	 * GET /api/contributions/current/:userId
	 */
	async getCurrentContribution(req: AuthRequest, res: Response) {
		try {
			let userId = req.params.userId;
			const currentUserId = req.user?.id;

			// 🔥 OBSŁUGA "me" - ZAMIEŃ NA ID ZALOGOWANEGO UŻYTKOWNIKA
			if (userId === "me") {
				if (!currentUserId) {
					return res.status(401).json({ error: "Nieautoryzowany" });
				}
				userId = currentUserId.toString();
			}

			if (!userId) {
				return res.status(400).json({ error: "Brak ID użytkownika" });
			}

			// Sprawdź uprawnienia - używamy `role` z req.user
			const userIdStr = Array.isArray(userId) ? userId[0] : userId;
			const isAuthorized =
				req.user?.role === "admin" ||
				req.user?.role === "board" ||
				parseInt(userIdStr) === currentUserId;

			if (!isAuthorized) {
				return res.status(403).json({
					error: "Brak uprawnień do przeglądania danych składek"
				});
			}
			const user = await prisma.user.findUnique({
				where: { id: parseInt(userIdStr) },
				select: {
					id: true,
					email: true,
					first_name: true,
					last_name: true
				}
			});

			if (!user) {
				return res.status(404).json({ error: "Użytkownik nie istnieje" });
			}

			const currentDate = new Date();
			const currentMonth = currentDate.getMonth() + 1;
			const currentYear = currentDate.getFullYear();

			const connection = await mysql.createConnection(CONTRIBUTIONS_DB_CONFIG);

			const [rows] = await connection.execute(`
                SELECT 
                    m.Legitymacja,
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
                        SELECT COUNT(*) 
                        FROM payments p 
                        WHERE p.member_legitymacja = m.Legitymacja 
                            AND p.blacklisted = 0
                    ) as total_payments,
                    (
                        SELECT SUM(amount) 
                        FROM payments p 
                        WHERE p.member_legitymacja = m.Legitymacja 
                            AND p.blacklisted = 0
                    ) as total_paid
                FROM members m
                WHERE m.email = ?
            `, [user.email]);

			await connection.end();

			// rows to tablica, bierzemy pierwszy element
			const data = Array.isArray(rows) && rows.length > 0 ? (rows[0] as PaymentRow) : null;

			// Oblicz zaległości
			let overdueMonths = 0;
			if (data && data.payment_status === 'pending') {
				const connection2 = await mysql.createConnection(CONTRIBUTIONS_DB_CONFIG);
				const [overdueRows] = await connection2.execute(`
                    SELECT COUNT(*) as count
                    FROM (
                        SELECT 
                            DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL n MONTH), '%Y-%m-01') as month_start
                        FROM (
                            SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 
                            UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 
                            UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11
                        ) numbers
                        WHERE n > 0
                    ) months
                    WHERE NOT EXISTS (
                        SELECT 1 
                        FROM payments p 
                        WHERE p.member_legitymacja = ? 
                            AND p.payment_date >= months.month_start
                            AND p.payment_date < DATE_ADD(months.month_start, INTERVAL 1 MONTH)
                            AND p.blacklisted = 0
                    )
                `, [data.Legitymacja]);
				await connection2.end();

				const overdueData = Array.isArray(overdueRows) && overdueRows.length > 0 ? (overdueRows[0] as any) : null;
				overdueMonths = overdueData?.count || 0;
			}

			return res.status(200).json({
				userId: user.id,
				currentMonth: currentMonth,
				currentYear: currentYear,
				status: data?.payment_status || 'pending',
				amount: data?.amount || 0,
				paymentDate: data?.payment_date || null,
				payFrom: data?.pay_from || null,
				suspendedUntil: data?.suspended_until || null,
				totalPayments: data?.total_payments || 0,
				totalPaid: data?.total_paid || 0,
				overdueMonths: overdueMonths,
				isOverdue: overdueMonths > 0,
				memberName: `${user.first_name} ${user.last_name}`,
				memberEmail: user.email,
			});

		} catch (error) {
			logger.error("❌ Błąd pobierania aktualnej składki:", error);
			return res.status(500).json({
				error: "Nie udało się pobrać danych składki"
			});
		}
	}
}

function getMonthName(month: number): string {
	const months = [
		"Styczeń",
		"Luty",
		"Marzec",
		"Kwiecień",
		"Maj",
		"Czerwiec",
		"Lipiec",
		"Sierpień",
		"Wrzesień",
		"Październik",
		"Listopad",
		"Grudzień",
	];
	return months[month - 1] || month.toString();
}