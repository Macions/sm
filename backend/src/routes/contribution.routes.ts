// src/routes/contribution.routes.ts

import { Router } from "express";
import { ContributionController } from "../controllers/contribution.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const controller = new ContributionController();

// Statystyki składek dla zalogowanego użytkownika
router.get(
	"/stats",
	authMiddleware,
	controller.getMyContributionStats.bind(controller),
);

// 🔥 HISTORIA SKŁADEK Z BAZY SM
router.get(
	"/history/:userId",
	authMiddleware,
	controller.getContributionHistory.bind(controller),
);

// 🔥 AKTUALNY STAN SKŁADKI Z BAZY SM
router.get(
	"/current/:userId",
	authMiddleware,
	controller.getCurrentContribution.bind(controller),
);

// Zaległe składki (dla admina)
router.get(
	"/overdue",
	authMiddleware,
	controller.getOverdueContributions.bind(controller),
);

// Ręczna synchronizacja (dla admina)
router.post(
	"/sync",
	authMiddleware,
	controller.syncContributionsManual.bind(controller),
);

// Pobierz wszystkie składki zalogowanego użytkownika
router.get(
	"/",
	authMiddleware,
	controller.getUserContributions.bind(controller),
);

// Pobierz składki konkretnego użytkownika (dla admina)
router.get(
	"/user/:userId",
	authMiddleware,
	controller.getUserContributions.bind(controller),
);

// Pobierz wszystkie składki (podsumowanie dla admina)
router.get(
	"/all",
	authMiddleware,
	controller.getAllContributionsSummary.bind(controller),
);

// CRUD dla składek
router.post("/", authMiddleware, controller.addContribution.bind(controller));
router.put(
	"/:id",
	authMiddleware,
	controller.updateContribution.bind(controller),
);
router.delete(
	"/:id",
	authMiddleware,
	controller.deleteContribution.bind(controller),
);

export default router;