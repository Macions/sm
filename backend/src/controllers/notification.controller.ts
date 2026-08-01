import { Response } from 'express';
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export class NotificationController {
	async getNotifications(req: AuthRequest, res: Response) {
		try {
			const userId = req.user?.id;
			const limit = parseInt(req.query.limit as string) || 20;

			const notifications = await prisma.notification.findMany({
				where: { user_id: userId },
				orderBy: { created_at: "desc" },
				take: limit,
			});

			res.json(notifications);
		} catch (error) {
			logger.error("❌ Błąd pobierania powiadomień:", error);
			res.status(500).json({ error: "Nie udało się pobrać powiadomień" });
		}
	}

	async markAsRead(req: AuthRequest, res: Response) {
		try {
			const id = parseInt(String(req.params.id));
			const userId = req.user?.id;

			await prisma.notification.updateMany({
				where: {
					id: id,
					user_id: userId,
				},
				data: { read: true },
			});

			res.status(200).json({ message: "Oznaczono jako przeczytane" });
		} catch (error) {
			logger.error("❌ Błąd oznaczania:", error);
			res.status(500).json({ error: "Nie udało się oznaczyć" });
		}
	}

	async markAllAsRead(req: AuthRequest, res: Response) {
		try {
			const userId = req.user?.id;

			await prisma.notification.updateMany({
				where: {
					user_id: userId,
					read: false,
				},
				data: { read: true },
			});

			res.status(200).json({ message: "Wszystkie oznaczone jako przeczytane" });
		} catch (error) {
			logger.error("❌ Błąd oznaczania wszystkich:", error);
			res.status(500).json({ error: "Nie udało się oznaczyć wszystkich" });
		}
	}

	async deleteNotification(req: AuthRequest, res: Response) {
		try {
			const id = parseInt(String(req.params.id));
			const userId = req.user?.id;

			await prisma.notification.deleteMany({
				where: {
					id: id,
					user_id: userId,
				},
			});

			res.status(200).json({ message: "Usunięto powiadomienie" });
		} catch (error) {
			logger.error("❌ Błąd usuwania:", error);
			res.status(500).json({ error: "Nie udało się usunąć" });
		}
	}
}
