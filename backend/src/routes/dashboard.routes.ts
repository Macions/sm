// src/routes/dashboard.routes.ts

import { Router } from "express";
import { DashboardController } from "../controllers/dashboardController";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const controller = new DashboardController();

router.get(
	"/stats",
	authMiddleware,
	controller.getDashboardStats.bind(controller),
);
router.get(
	"/notifications",
	authMiddleware,
	controller.getNotifications.bind(controller),
);
router.get(
	"/contributions",
	authMiddleware,
	controller.getContributionStats.bind(controller),
); // <-- DODAJ
router.put(
	"/notifications/:id/read",
	authMiddleware,
	controller.markNotificationRead.bind(controller),
);
router.put(
	"/notifications/read-all",
	authMiddleware,
	controller.markAllNotificationsRead.bind(controller),
);
router.delete(
	"/notifications/:id",
	authMiddleware,
	controller.deleteNotification.bind(controller),
);

export default router;
