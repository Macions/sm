

import { Router } from "express";
import { ContributionController } from "../controllers/contribution.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const controller = new ContributionController();


router.get(
	"/stats",
	authMiddleware,
	controller.getMyContributionStats.bind(controller),
);


router.get(
	"/history/:userId",
	authMiddleware,
	controller.getContributionHistory.bind(controller),
);


router.get(
	"/current/:userId",
	authMiddleware,
	controller.getCurrentContribution.bind(controller),
);


router.get(
	"/overdue",
	authMiddleware,
	controller.getOverdueContributions.bind(controller),
);


router.post(
	"/sync",
	authMiddleware,
	controller.syncContributionsManual.bind(controller),
);


router.get(
	"/",
	authMiddleware,
	controller.getUserContributions.bind(controller),
);


router.get(
	"/user/:userId",
	authMiddleware,
	controller.getUserContributions.bind(controller),
);


router.get(
	"/all",
	authMiddleware,
	controller.getAllContributionsSummary.bind(controller),
);


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