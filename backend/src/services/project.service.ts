// backend/src/services/project.service.ts
import { PrismaClient } from "@prisma/client";

// ✅ NIE importuj typu Project - zdefiniuj go samodzielnie lub użyj Prisma.ProjectGetPayload
type Project = {
	id: number;
	name: string;
	description: string | null;
	pillar: string | null;
	coordinator_id: number | null;
	team: string | null;
	status: string | null;
	estimated_end: Date | null;
	created_at: Date;
	updated_at: Date;
	is_active: number; // ✅ DODANE
};

const prisma = new PrismaClient();

export interface ProjectResponse {
	id: string;
	name: string;
	description: string | null;
	pillar: string | null;
	coordinator_id: string | null;
	team: string | null;
	status: string | null;
	estimated_end: string | null;
	created_at: string;
	updated_at: string;
	is_active: number; // ✅ DODANE
}

export class ProjectService {
	async getAllProjects(): Promise<ProjectResponse[]> {
		try {
			const projects = await prisma.project.findMany({
				where: { is_active: 1 },
				orderBy: { created_at: "desc" },
			});

			console.log("✅ Znaleziono aktywnych projektów:", projects.length);
			return projects.map((p: any) => this.toResponse(p)); // ✅ Użyj "any"
		} catch (error) {
			console.error("❌ Błąd pobierania projektów:", error);
			throw new Error("Nie udało się pobrać projektów");
		}
	}

	async getProjectById(id: string): Promise<ProjectResponse | null> {
		try {
			const project = await prisma.project.findUnique({
				where: { id: parseInt(id) },
			});
			return project ? this.toResponse(project) : null;
		} catch (error) {
			console.error("❌ Błąd pobierania projektu:", error);
			throw new Error("Nie udało się pobrać projektu");
		}
	}

	async getProjectsByPillar(pillar: string): Promise<ProjectResponse[]> {
		try {
			const projects = await prisma.project.findMany({
				where: { pillar },
				orderBy: { created_at: "desc" },
			});
			return projects.map((p: any) => this.toResponse(p)); // ✅ Użyj "any"
		} catch (error) {
			console.error("❌ Błąd pobierania projektów dla filaru:", error);
			throw new Error("Nie udało się pobrać projektów dla filaru");
		}
	}

	async getProjectsByStatus(status: string): Promise<ProjectResponse[]> {
		try {
			const projects = await prisma.project.findMany({
				where: { status },
				orderBy: { created_at: "desc" },
			});
			return projects.map((p: any) => this.toResponse(p)); // ✅ Użyj "any"
		} catch (error) {
			console.error("❌ Błąd pobierania projektów dla statusu:", error);
			throw new Error("Nie udało się pobrać projektów dla statusu");
		}
	}

	async createProject(data: any): Promise<ProjectResponse> {
		try {
			const createData: any = {
				name: data.name,
				description: data.description || null,
				pillar: data.pillar || null,
				coordinator_id: data.coordinator_id ?? null,
				team: data.team || null,
				status: data.status || "planning",
				is_active: 1,
			};

			if (data.estimated_end) {
				createData.estimated_end = new Date(data.estimated_end);
			}

			const project = await prisma.project.create({
				data: createData,
			});

			return this.toResponse(project);
		} catch (error) {
			console.error("❌ Błąd tworzenia projektu:", error);
			throw new Error("Nie udało się utworzyć projektu");
		}
	}

	async updateProject(id: string, data: any): Promise<ProjectResponse> {
		try {
			const updateData: any = {
				name: data.name,
				description: data.description || null,
				pillar: data.pillar || null,
				coordinator_id: data.coordinator_id ?? null,
				team: data.team || null,
				status: data.status || "planning",
			};

			if (data.estimated_end) {
				updateData.estimated_end = new Date(data.estimated_end);
			}

			const project = await prisma.project.update({
				where: { id: parseInt(id) },
				data: updateData,
			});

			return this.toResponse(project);
		} catch (error) {
			console.error("❌ Błąd aktualizacji projektu:", error);
			throw new Error("Nie udało się zaktualizować projektu");
		}
	}

	async deleteProject(id: string): Promise<void> {
		try {
			await prisma.project.update({
				where: { id: parseInt(id) },
				data: { is_active: 0 },
			});
			console.log(`✅ Projekt ${id} został dezaktywowany`);
		} catch (error) {
			console.error("❌ Błąd dezaktywacji projektu:", error);
			throw new Error("Nie udało się dezaktywować projektu");
		}
	}

	private toResponse(p: any): ProjectResponse { // ✅ Użyj "any"
		return {
			id: p.id.toString(),
			name: p.name,
			description: p.description,
			pillar: p.pillar,
			coordinator_id: p.coordinator_id ? p.coordinator_id.toString() : null,
			team: p.team,
			status: p.status,
			estimated_end: p.estimated_end
				? p.estimated_end.toISOString().split("T")[0]
				: null,
			created_at: p.created_at.toISOString().split("T")[0],
			updated_at: p.updated_at.toISOString().split("T")[0],
			is_active: p.is_active,
		};
	}
}