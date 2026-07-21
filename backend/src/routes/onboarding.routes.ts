// A:\sm system\sm\backend\src\routes\onboarding.routes.ts

import { Router } from "express";
import { OnboardingController } from "../controllers/onboarding.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const onboardingController = new OnboardingController();

// Wszystkie trasy wymagają autoryzacji
router.use(authMiddleware);

router.post(
	"/save",
	onboardingController.saveOnboardingData.bind(onboardingController),
);
router.get(
	"/data",
	onboardingController.getOnboardingData.bind(onboardingController),
);
router.get(
	"/status",
	onboardingController.checkOnboardingStatus.bind(onboardingController),
);

export default router;
