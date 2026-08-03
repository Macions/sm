// src/controllers/contribution.controller.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

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
					first_name: true, // <-- POPRAWIONE
					last_name: true, // <-- POPRAWIONE
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
	 * Pobiera wszystkie składki użytkownika
	 */
	/**
	 * Pobiera wszystkie składki użytkownika
	 */
	async getUserContributions(req: AuthRequest, res: Response) {
		try {
			// Pobierz userId z params lub z zalogowanego użytkownika
			const paramUserId = req.params.userId;
			let targetUserId: number | undefined;

			if (paramUserId) {
				// Jeśli userId jest tablicą, weź pierwszy element
				const userIdStr = Array.isArray(paramUserId)
					? paramUserId[0]
					: paramUserId;
				targetUserId = parseInt(userIdStr);

				// Sprawdź czy to poprawna liczba
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
					userId: targetUserId, // teraz to jest number
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

			const user = await prisma.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				return res.status(404).json({ error: "Użytkownik nie istnieje" });
			}

			const existing = await prisma.contribution.findFirst({
				where: {
					userId,
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
					userId,
					amount,
					month,
					year,
					paidAt: paidAt ? new Date(paidAt) : new Date(),
					status: status || "PAID",
				},
			});

			await prisma.user.update({
				where: { id: userId },
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
			const { amount, status, paidAt } = req.body;

			const contribution = await prisma.contribution.update({
				where: { id: typeof id === "string" ? id : id.toString() },
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

			await prisma.contribution.delete({
				where: { id: typeof id === "string" ? id : id.toString() },
			});

			logger.info(`✅ [Contribution] Usunięto składkę ${id}`);
			res.json({ message: "Składka usunięta" });
		} catch (error) {
			logger.error("❌ [Contribution] Błąd usuwania składki:", error);
			res.status(500).json({ error: "Nie udało się usunąć składki" });
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
