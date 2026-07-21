// backend/src/controllers/project.controller.ts
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
                error: "Nie udało się pobrać listy projektów"
            });
        }
    }

    async getProjectById(req: Request<{ id: string }>, res: Response) {
        try {
            // Pobierz id i upewnij się, że to string
            const idParam = req.params.id;
            const id = Array.isArray(idParam) ? idParam[0] : idParam;

            if (!id) {
                return res.status(400).json({
                    error: "Brak identyfikatora projektu"
                });
            }

            const project = await projectService.getProjectById(id);

            if (!project) {
                return res.status(404).json({
                    error: "Projekt nie znaleziony"
                });
            }

            res.json(project);
        } catch (error) {
            console.error(`Błąd pobierania projektu ${req.params.id}:`, error);
            res.status(500).json({
                error: "Nie udało się pobrać projektu"
            });
        }
    }

    async createProject(req: AuthRequest, res: Response) {
        try {
            const { name, description, pillar, status, estimatedCompletion, team, coordinator } = req.body;

            // Walidacja
            if (!name || !description || !pillar || !status || !estimatedCompletion || !coordinator) {
                return res.status(400).json({
                    error: "Brak wymaganych pól: name, description, pillar, status, estimatedCompletion, coordinator"
                });
            }

            // Sprawdź czy użytkownik ma uprawnienia (admin lub coordinator)
            if (req.user?.role !== 'admin' && req.user?.role !== 'coordinator') {
                return res.status(403).json({
                    error: "Brak uprawnień do tworzenia projektów"
                });
            }

            const project = await projectService.createProject({
                name,
                description,
                pillar,
                status,
                estimatedCompletion,
                team: team || [],
                coordinator: coordinator || req.user.email
            });

            res.status(201).json(project);
        } catch (error) {
            console.error("Błąd tworzenia projektu:", error);
            res.status(500).json({
                error: "Nie udało się utworzyć projektu"
            });
        }
    }

    async updateProject(req: AuthRequest, res: Response) {
        try {
            // Pobierz id i upewnij się, że to string
            const idParam = req.params.id;
            const id = Array.isArray(idParam) ? idParam[0] : idParam;

            if (!id) {
                return res.status(400).json({
                    error: "Brak identyfikatora projektu"
                });
            }

            const { name, description, pillar, status, estimatedCompletion, team, coordinator } = req.body;

            const existingProject = await projectService.getProjectById(id);
            if (!existingProject) {
                return res.status(404).json({
                    error: "Projekt nie znaleziony"
                });
            }

            // Sprawdź uprawnienia
            if (req.user?.role !== 'admin' && req.user?.role !== 'coordinator') {
                return res.status(403).json({
                    error: "Brak uprawnień do edycji projektów"
                });
            }

            const project = await projectService.updateProject(id, {
                name,
                description,
                pillar,
                status,
                estimatedCompletion,
                team,
                coordinator
            });

            res.json(project);
        } catch (error) {
            console.error(`Błąd aktualizacji projektu ${req.params.id}:`, error);
            res.status(500).json({
                error: "Nie udało się zaktualizować projektu"
            });
        }
    }

    async deleteProject(req: AuthRequest, res: Response) {
        try {
            // Pobierz id i upewnij się, że to string
            const idParam = req.params.id;
            const id = Array.isArray(idParam) ? idParam[0] : idParam;

            if (!id) {
                return res.status(400).json({
                    error: "Brak identyfikatora projektu"
                });
            }

            const existingProject = await projectService.getProjectById(id);
            if (!existingProject) {
                return res.status(404).json({
                    error: "Projekt nie znaleziony"
                });
            }

            // Sprawdź uprawnienia
            if (req.user?.role !== 'admin' && req.user?.role !== 'coordinator') {
                return res.status(403).json({
                    error: "Brak uprawnień do usuwania projektów"
                });
            }

            await projectService.deleteProject(id);
            res.status(204).send();
        } catch (error) {
            console.error(`Błąd usuwania projektu ${req.params.id}:`, error);
            res.status(500).json({
                error: "Nie udało się usunąć projektu"
            });
        }
    }

    async getProjectsByPillar(req: Request<{ pillar: string }>, res: Response) {
        try {
            // Pobierz pillar i upewnij się, że to string
            const pillarParam = req.params.pillar;
            const pillar = Array.isArray(pillarParam) ? pillarParam[0] : pillarParam;

            if (!pillar) {
                return res.status(400).json({
                    error: "Brak nazwy filaru"
                });
            }

            const projects = await projectService.getProjectsByPillar(pillar);
            res.json(projects);
        } catch (error) {
            console.error(`Błąd pobierania projektów dla filaru ${req.params.pillar}:`, error);
            res.status(500).json({
                error: "Nie udało się pobrać projektów"
            });
        }
    }

    async getProjectsByStatus(req: Request<{ status: string }>, res: Response) {
        try {
            // Pobierz status i upewnij się, że to string
            const statusParam = req.params.status;
            const status = Array.isArray(statusParam) ? statusParam[0] : statusParam;

            if (!status) {
                return res.status(400).json({
                    error: "Brak statusu"
                });
            }

            const projects = await projectService.getProjectsByStatus(status);
            res.json(projects);
        } catch (error) {
            console.error(`Błąd pobierania projektów dla statusu ${req.params.status}:`, error);
            res.status(500).json({
                error: "Nie udało się pobrać projektów"
            });
        }
    }
}