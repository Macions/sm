// src/controllers/project.controller.ts
import { Request, Response } from "express";
import { ProjectService } from "../services/project.service";
import { AuthRequest } from "../middleware/auth.middleware";

const projectService = new ProjectService();

export class ProjectController {
	async getAllProjects(req: Request, res: Response) {
		try {
			const projects = await projectService.getAllProjects();
			res.json(projects);
		} catch (error) {
			console.error("Błąd pobierania projektów:", error);
			res.status(500).json({
				error: "Nie udało się pobrać listy projektów",
			});
		}
	}

	async getProjectById(req: Request<{ id: string }>, res: Response) {
		try {
			const idParam = req.params.id;
			// ✅ Konwersja na number
			const id = typeof idParam === "string" ? parseInt(idParam, 10) : NaN;

			if (isNaN(id)) {
				return res.status(400).json({ error: "Nieprawidłowy identyfikator" });
			}

			const project = await projectService.getProjectById(id.toString());
			if (!project) {
				return res.status(404).json({ error: "Projekt nie znaleziony" });
			}

			res.json(project);
		} catch (error) {
			console.error(`Błąd pobierania projektu:`, error);
			res.status(500).json({ error: "Nie udało się pobrać projektu" });
		}
	}

	async createProject(req: AuthRequest, res: Response) {
		try {
			const {
				name,
				description,
				pillar,
				coordinator_id,
				team,
				status,
				estimated_end,
			} = req.body;

			if (!name) {
				return res.status(400).json({ error: "Nazwa projektu jest wymagana" });
			}

			const project = await projectService.createProject({
				name,
				description: description || null,
				pillar: pillar || null,
				coordinator_id: coordinator_id ? parseInt(coordinator_id, 10) : null,
				team: team || null,
				status: status || "planning",
				estimated_end: estimated_end || null,
			});

			res.status(201).json(project);
		} catch (error) {
			console.error("Błąd tworzenia projektu:", error);
			res.status(500).json({ error: "Nie udało się utworzyć projektu" });
		}
	}

	async updateProject(req: AuthRequest, res: Response) {
		try {
			const idParam = req.params.id;
			// ✅ Konwersja na number
			const id = typeof idParam === "string" ? parseInt(idParam, 10) : NaN;

			if (isNaN(id)) {
				return res.status(400).json({ error: "Nieprawidłowy identyfikator" });
			}

			const {
				name,
				description,
				pillar,
				coordinator_id,
				team,
				status,
				estimated_end,
			} = req.body;

			const project = await projectService.updateProject(id.toString(), {
				name,
				description: description || null,
				pillar: pillar || null,
				coordinator_id: coordinator_id ? parseInt(coordinator_id, 10) : null,
				team: team || null,
				status: status || "planning",
				estimated_end: estimated_end || null,
			});

			res.json(project);
		} catch (error) {
			console.error(`Błąd aktualizacji projektu:`, error);
			res.status(500).json({ error: "Nie udało się zaktualizować projektu" });
		}
	}

	async deleteProject(req: AuthRequest, res: Response) {
		try {
			const idParam = req.params.id;
			const id = typeof idParam === "string" ? parseInt(idParam, 10) : NaN;

			if (isNaN(id)) {
				return res.status(400).json({ error: "Nieprawidłowy identyfikator" });
			}

			await projectService.deleteProject(id.toString());
			res.status(204).send();
		} catch (error) {
			console.error(`❌ Błąd usuwania projektu:`, error);
			res.status(500).json({ error: "Nie udało się usunąć projektu" });
		}
	}

	async getProjectsByPillar(req: Request, res: Response) {
		try {
			const pillarParam = req.params.pillar;
			const pillar =
				typeof pillarParam === "string"
					? pillarParam
					: Array.isArray(pillarParam)
						? pillarParam[0]
						: undefined;

			if (!pillar) {
				return res.status(400).json({ error: "Brak nazwy filaru" });
			}

			const projects = await projectService.getProjectsByPillar(pillar);
			res.json(projects);
		} catch (error) {
			console.error(`Błąd pobierania projektów dla filaru:`, error);
			res.status(500).json({ error: "Nie udało się pobrać projektów" });
		}
	}

	async getProjectsByStatus(req: Request, res: Response) {
		try {
			const statusParam = req.params.status;
			const status =
				typeof statusParam === "string"
					? statusParam
					: Array.isArray(statusParam)
						? statusParam[0]
						: undefined;

			if (!status) {
				return res.status(400).json({ error: "Brak statusu" });
			}

			const projects = await projectService.getProjectsByStatus(status);
			res.json(projects);
		} catch (error) {
			console.error(`Błąd pobierania projektów dla statusu:`, error);
			res.status(500).json({ error: "Nie udało się pobrać projektów" });
		}
	}
}
