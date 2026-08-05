// src/controllers/dashboardController.ts

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
export class DashboardController {
	/**
	 * Pobiera statystyki dla dashboardu
	 */

	async getDashboardStats(req: AuthRequest, res: Response) {
		try {
			const userId = req.user?.id;
			const userEmail = req.user?.email;

			const totalMembers = await prisma.user.count({
				where: { is_active: true },
			});

			const totalProjects = await prisma.project.count({
				where: { is_active: 1 },
			});

			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

			const newGuides = await prisma.guide.count({
				where: {
					is_published: 1,
					created_at: { gte: sevenDaysAgo },
				},
			});

			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

			const announcements = await prisma.notification.count({
				where: {
					created_at: { gte: thirtyDaysAgo },
				},
			});

			// Tutaj możesz dodać statystyki składek
			const currentDate = new Date();
			const currentMonth = currentDate.getMonth() + 1;
			const currentYear = currentDate.getFullYear();

			// Statystyki składek dla zalogowanego użytkownika
			let contributionStats = null;
			if (userId) {
				const userContributions = await prisma.contribution.findMany({
					where: {
						userId: userId,
					},
				});

				const currentMonthPaid = userContributions.some(
					(c) =>
						c.month === currentMonth &&
						c.year === currentYear &&
						c.status === "PAID",
				);

				const totalPaid = userContributions
					.filter((c) => c.status === "PAID")
					.reduce((sum, c) => sum + c.amount, 0);

				contributionStats = {
					currentMonthPaid,
					totalPaid,
					totalContributions: userContributions.length,
				};
			}

			res.json({
				members: totalMembers,
				projects: totalProjects,
				attendance: "92%", // Przykład - pobieraj z bazy
				announcements: announcements,
				newGuides: newGuides,
				contributions: contributionStats,
			});
		} catch (error) {
			logger.error("❌ [Dashboard] Błąd statystyk:", error);
			res.status(500).json({ error: "Nie udało się pobrać statystyk" });
		}
	}

	/**
	 * Pobiera powiadomienia dla użytkownika
	 */
	async getNotifications(req: AuthRequest, res: Response) {
		try {
			const userId = req.user?.id;

			if (!userId) {
				return res.status(401).json({ error: "Nieautoryzowany" });
			}

			const limit = parseInt(req.query.limit as string) || 20;

			const notifications = await prisma.notification.findMany({
				where: { user_id: userId },
				orderBy: { created_at: "desc" },
				take: limit,
			});

			const mappedNotifications = notifications.map((n) => ({
				id: n.id.toString(),
				message: n.message,
				type: n.type as "success" | "info" | "warning",
				time: formatTimeAgo(n.created_at),
				title: n.title,
				read: n.read || false,
				link: n.link,
				createdAt: n.created_at,
			}));

			res.json(mappedNotifications);
		} catch (error) {
			logger.error("❌ [Dashboard] Błąd pobierania powiadomień:", error);
			res.status(500).json({
				error: "Nie udało się pobrać powiadomień",
				details: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	/**
	 * Oznacza powiadomienie jako przeczytane
	 */
	/**
	 * Oznacza powiadomienie jako przeczytane
	 */

	// src/controllers/dashboardController.ts

	// src/controllers/dashboardController.ts

	async getContributionStats(req: AuthRequest, res: Response) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({ error: "Nieautoryzowany" });
			}

			const currentDate = new Date();
			const currentMonth = currentDate.getMonth() + 1;
			const currentYear = currentDate.getFullYear();

			const contributions = await prisma.contribution.findMany({
				where: { userId: userId },
				orderBy: [{ year: "desc" }, { month: "desc" }],
				take: 12,
			});

			if (contributions.length === 0) {
				return res.json({
					hasContributions: false,
					currentMonth: {
						status: "none",
						amount: 0,
						monthName: getMonthName(currentMonth),
						year: currentYear,
						monthsPaid: 0, // ← DODANE
					},
					summary: {
						overdueMonths: 0,
						totalPaid: 0,
						totalContributions: 0,
					},
					history: [],
				});
			}

			const currentMonthContribution = contributions.find(
				(c) => c.month === currentMonth && c.year === currentYear,
			);

			const isPaid = currentMonthContribution?.status === "PAID";
			const amount = currentMonthContribution?.amount || 0;
			const monthsPaid = currentMonthContribution?.monthsPaid || 1; // ← DODANE
			const overdueMonths = contributions.filter(
				(c) => c.status === "PENDING",
			).length;

			res.json({
				hasContributions: true,
				currentMonth: {
					status: isPaid ? "paid" : "pending",
					amount: amount,
					monthName: getMonthName(currentMonth),
					month: currentMonth,
					year: currentYear,
					monthsPaid: monthsPaid, // ← DODANE
				},
				summary: {
					overdueMonths: overdueMonths,
					totalPaid: contributions
						.filter((c) => c.status === "PAID")
						.reduce((sum, c) => sum + c.amount, 0),
					totalContributions: contributions.length,
				},
				history: contributions.slice(0, 6).map((c) => ({
					month: c.month,
					year: c.year,
					monthName: getMonthName(c.month),
					status: c.status,
					amount: c.amount,
					monthsPaid: c.monthsPaid || 1, // ← DODANE
				})),
			});
		} catch (error) {
			logger.error("❌ [Dashboard] Błąd pobierania statystyk składek:", error);
			res.status(500).json({ error: "Nie udało się pobrać statystyk składek" });
		}
	}

	async getUserContributionStats(req: AuthRequest, res: Response) {
		try {
			const { userId } = req.params;
			if (typeof userId !== "string") {
				return res.status(400).json({ error: "Nieprawidłowe userId" });
			}

			const id = parseInt(userId, 10);
			if (isNaN(id)) {
				return res.status(400).json({ error: "Nieprawidłowe ID użytkownika" });
			}

			// Sprawdź czy użytkownik istnieje
			const user = await prisma.user.findUnique({
				where: { id: id },
				select: { id: true, email: true, first_name: true, last_name: true },
			});

			if (!user) {
				return res.status(404).json({ error: "Nie znaleziono użytkownika" });
			}

			const currentDate = new Date();
			const currentMonth = currentDate.getMonth() + 1;
			const currentYear = currentDate.getFullYear();

			// Pobierz składki dla konkretnego użytkownika
			const contributions = await prisma.contribution.findMany({
				where: { userId: id },
				orderBy: [{ year: "desc" }, { month: "desc" }],
				take: 12,
			});

			// Jeśli brak składek
			if (contributions.length === 0) {
				return res.json({
					hasContributions: false,
					currentMonth: {
						status: "none",
						amount: 0,
						monthName: getMonthName(currentMonth),
						year: currentYear,
						monthsPaid: 0,
					},
					summary: {
						overdueMonths: 0,
						totalPaid: 0,
						totalContributions: 0,
					},
					history: [],
				});
			}

			// Znajdź składkę za bieżący miesiąc
			const currentMonthContribution = contributions.find(
				(c) => c.month === currentMonth && c.year === currentYear,
			);

			const isPaid = currentMonthContribution?.status === "PAID";
			const amount = currentMonthContribution?.amount || 0;
			const monthsPaid = currentMonthContribution?.monthsPaid || 1;

			// Policz zaległości (status PENDING)
			const overdueMonths = contributions.filter(
				(c) => c.status === "PENDING",
			).length;

			// Oblicz sumę opłaconych składek
			const totalPaid = contributions
				.filter((c) => c.status === "PAID")
				.reduce((sum, c) => sum + c.amount, 0);

			res.json({
				hasContributions: true,
				currentMonth: {
					status: isPaid ? "paid" : "pending",
					amount: amount,
					monthName: getMonthName(currentMonth),
					month: currentMonth,
					year: currentYear,
					monthsPaid: monthsPaid,
				},
				summary: {
					overdueMonths: overdueMonths,
					totalPaid: totalPaid,
					totalContributions: contributions.length,
				},
				history: contributions.slice(0, 6).map((c) => ({
					month: c.month,
					year: c.year,
					monthName: getMonthName(c.month),
					status: c.status,
					amount: c.amount,
					monthsPaid: c.monthsPaid || 1,
				})),
			});
		} catch (error) {
			logger.error(
				"❌ [Dashboard] Błąd pobierania składek użytkownika:",
				error,
			);
			res.status(500).json({
				error: "Nie udało się pobrać składek użytkownika",
				details: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}
	async markNotificationRead(req: AuthRequest, res: Response) {
		try {
			const userId = req.user?.id;

			// Pobierz id z params i upewnij się że to string
			const idParam = req.params.id;
			const id =
				typeof idParam === "string" ? parseInt(idParam) : parseInt(idParam[0]);

			if (!userId) {
				return res.status(401).json({ error: "Nieautoryzowany" });
			}

			if (isNaN(id)) {
				return res
					.status(400)
					.json({ error: "Nieprawidłowe ID powiadomienia" });
			}

			const notification = await prisma.notification.findFirst({
				where: {
					id: id,
					user_id: userId,
				},
			});

			if (!notification) {
				return res.status(404).json({
					error: "Nie znaleziono powiadomienia",
				});
			}

			const updated = await prisma.notification.update({
				where: { id: id },
				data: {
					read: true,
					updated_at: new Date(),
				},
			});

			res.status(200).json({
				success: true,
				message: "Oznaczono jako przeczytane",
				notification: {
					id: updated.id.toString(),
					read: updated.read,
				},
			});
		} catch (error) {
			logger.error("❌ [Dashboard] Błąd oznaczania:", error);
			res.status(500).json({
				error: "Nie udało się oznaczyć",
				details: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	/**
	 * Oznacza wszystkie powiadomienia jako przeczytane
	 */
	async markAllNotificationsRead(req: AuthRequest, res: Response) {
		try {
			const userId = req.user?.id;

			if (!userId) {
				return res.status(401).json({ error: "Nieautoryzowany" });
			}

			const result = await prisma.notification.updateMany({
				where: {
					user_id: userId,
					read: false,
				},
				data: { read: true },
			});

			res.status(200).json({
				success: true,
				message: "Wszystkie oznaczone jako przeczytane",
				count: result.count,
			});
		} catch (error) {
			logger.error("❌ [Dashboard] Błąd oznaczania wszystkich:", error);
			res.status(500).json({
				error: "Nie udało się oznaczyć wszystkich",
				details: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	/**
	 * Usuwa powiadomienie
	 */
	/**
	 * Usuwa powiadomienie
	 */
	async deleteNotification(req: AuthRequest, res: Response) {
		try {
			const userId = req.user?.id;

			// Pobierz id z params i upewnij się że to string
			const idParam = req.params.id;
			const id =
				typeof idParam === "string" ? parseInt(idParam) : parseInt(idParam[0]);

			if (!userId) {
				return res.status(401).json({ error: "Nieautoryzowany" });
			}

			if (isNaN(id)) {
				return res
					.status(400)
					.json({ error: "Nieprawidłowe ID powiadomienia" });
			}

			const result = await prisma.notification.deleteMany({
				where: { id: id, user_id: userId },
			});

			if (result.count === 0) {
				return res.status(404).json({ error: "Nie znaleziono powiadomienia" });
			}

			res.status(200).json({ message: "Usunięto powiadomienie" });
		} catch (error) {
			logger.error("❌ [Dashboard] Błąd usuwania:", error);
			res.status(500).json({ error: "Nie udało się usunąć" });
		}
	}
}

/**
 * Formatuje datę jako "X czasu temu"
 */
function formatTimeAgo(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMin = Math.floor(diffMs / 60000);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);

	if (diffMin < 1) return "przed chwilą";
	if (diffMin < 60) return `${diffMin} min temu`;
	if (diffHour < 24) return `${diffHour} godz. temu`;
	if (diffDay === 1) return "1 dzień temu";
	if (diffDay < 7) return `${diffDay} dni temu`;
	return date.toLocaleDateString("pl-PL");
}
