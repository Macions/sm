"use strict";
// A:\sm system\sm\backend\src\routes\onboarding.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const onboarding_controller_1 = require("../controllers/onboarding.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const onboardingController = new onboarding_controller_1.OnboardingController();
// Wszystkie trasy wymagają autoryzacji
router.use(auth_middleware_1.authMiddleware);
router.post("/save", onboardingController.saveOnboardingData.bind(onboardingController));
router.get("/data", onboardingController.getOnboardingData.bind(onboardingController));
router.get("/status", onboardingController.checkOnboardingStatus.bind(onboardingController));
exports.default = router;
