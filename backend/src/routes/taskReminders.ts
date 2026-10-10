// src/routes/taskReminders.ts
import { Router, Response } from "express";
import {
	authMiddleware,
	type AuthRequest,
} from "../middleware/auth.middleware";
import { sendTaskReminder } from "../services/taskReminderService";
import { logger } from "../utils/logger";

const router = Router();

router.post(
	"/api/tasks/:id/remind",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const taskId = Number(req.params.id);
			if (!Number.isFinite(taskId)) {
				return res.status(400).json({ error: "Nieprawidłowe ID zadania" });
			}

			const { userIds, message } = (req.body ?? {}) as {
				userIds?: number[];
				message?: string;
			};

			if (!req.user?.id) {
				return res.status(401).json({ error: "Brak autoryzacji" });
			}

			const result = await sendTaskReminder({
				taskId,
				senderId: req.user.id,
				userIds,
				message,
			});

			res.json({
				success: true,
				sent: result.sent,
				failed: result.failed,
				recipients: result.recipients,
			});
		} catch (err) {
			logger.error("task remind error:", err);
			const message = err instanceof Error ? err.message : "Błąd serwera";
			res.status(500).json({ error: message });
		}
	},
);

export default router;
