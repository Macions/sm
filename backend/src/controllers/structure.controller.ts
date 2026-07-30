import { Request, Response } from "express";
import { StructureService } from "../services/structure.service";
import { logger } from "../utils/logger";

const structureService = new StructureService();

export class StructureController {
	async getFullStructure(req: Request, res: Response) {
		try {
			const structure = await structureService.getFullStructure();
			res.json(structure);
		} catch (error) {
			logger.error("Błąd pobierania struktury:", error);
			res.status(500).json({
				error: "Nie udało się pobrać struktury organizacyjnej",
			});
		}
	}

	async getTeamById(req: Request, res: Response) {
		try {
			const idParam = req.params.id;

			const idString = Array.isArray(idParam) ? idParam[0] : idParam;

			if (!idString) {
				return res.status(400).json({
					error: "Brak identyfikatora zespołu",
				});
			}

			const id = parseInt(idString, 10);

			if (isNaN(id)) {
				return res.status(400).json({
					error: "Nieprawidłowy identyfikator zespołu",
				});
			}

			const team = await structureService.getTeamById(id);

			if (!team) {
				return res.status(404).json({
					error: "Zespół nie znaleziony",
				});
			}

			res.json(team);
		} catch (error) {
			logger.error("Błąd pobierania zespołu:", error);
			res.status(500).json({
				error: "Nie udało się pobrać zespołu",
			});
		}
	}
}
