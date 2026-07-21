// A:\sm system\sm\backend\src\controllers\onboarding.controller.ts

import { Request, Response } from "express";
import { OnboardingService } from "../services/onboarding.service";

const onboardingService = new OnboardingService();

export class OnboardingController {
	async saveOnboardingData(req: Request, res: Response) {
		try {
			const userId = (req as any).user?.id;
			const data = req.body;

			// Walidacja
			if (!data.firstName || !data.lastName || !data.email || !data.province) {
				return res.status(400).json({
					error: "Imię, nazwisko, email i województwo są wymagane",
				});
			}

			if (!data.developmentAreas || data.developmentAreas.length === 0) {
				return res.status(400).json({
					error: "Wybierz przynajmniej jeden obszar rozwoju",
				});
			}

			await onboardingService.saveOnboardingData(userId, data);

			res.status(201).json({
				message: "Dane onboardingowe zostały zapisane",
				completed: true,
			});
		} catch (error) {
			console.error("Error in saveOnboardingData:", error);
			res.status(500).json({
				error: "Nie udało się zapisać danych onboardingowych",
			});
		}
	}

	async getOnboardingData(req: Request, res: Response) {
		try {
			const userId = (req as any).user?.id;
			const data = await onboardingService.getOnboardingData(userId);

			if (!data) {
				return res.status(404).json({
					error: "Nie znaleziono danych onboardingowych",
				});
			}

			res.json(data);
		} catch (error) {
			console.error("Error in getOnboardingData:", error);
			res.status(500).json({
				error: "Nie udało się pobrać danych onboardingowych",
			});
		}
	}

	async checkOnboardingStatus(req: Request, res: Response) {
		try {
			const userId = (req as any).user?.id;
			const completed =
				await onboardingService.checkOnboardingCompleted(userId);

			res.json({ completed });
		} catch (error) {
			console.error("Error in checkOnboardingStatus:", error);
			res.status(500).json({
				error: "Nie udało się sprawdzić statusu onboardingu",
			});
		}
	}
}
