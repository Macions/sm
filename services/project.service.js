"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
// backend/src/services/project.service.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ProjectService {
    async getAllProjects() {
        try {
            const projects = await prisma.project.findMany({
                where: { is_active: 1 },
                orderBy: { created_at: "desc" },
            });
            console.log("✅ Znaleziono aktywnych projektów:", projects.length);
            return projects.map((p) => this.toResponse(p)); // ✅ Użyj "any"
        }
        catch (error) {
            console.error("❌ Błąd pobierania projektów:", error);
            throw new Error("Nie udało się pobrać projektów");
        }
    }
    async getProjectById(id) {
        try {
            const project = await prisma.project.findUnique({
                where: { id: parseInt(id) },
            });
            return project ? this.toResponse(project) : null;
        }
        catch (error) {
            console.error("❌ Błąd pobierania projektu:", error);
            throw new Error("Nie udało się pobrać projektu");
        }
    }
    async getProjectsByPillar(pillar) {
        try {
            const projects = await prisma.project.findMany({
                where: { pillar },
                orderBy: { created_at: "desc" },
            });
            return projects.map((p) => this.toResponse(p)); // ✅ Użyj "any"
        }
        catch (error) {
            console.error("❌ Błąd pobierania projektów dla filaru:", error);
            throw new Error("Nie udało się pobrać projektów dla filaru");
        }
    }
    async getProjectsByStatus(status) {
        try {
            const projects = await prisma.project.findMany({
                where: { status },
                orderBy: { created_at: "desc" },
            });
            return projects.map((p) => this.toResponse(p)); // ✅ Użyj "any"
        }
        catch (error) {
            console.error("❌ Błąd pobierania projektów dla statusu:", error);
            throw new Error("Nie udało się pobrać projektów dla statusu");
        }
    }
    async createProject(data) {
        try {
            const createData = {
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
        }
        catch (error) {
            console.error("❌ Błąd tworzenia projektu:", error);
            throw new Error("Nie udało się utworzyć projektu");
        }
    }
    async updateProject(id, data) {
        try {
            const updateData = {
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
        }
        catch (error) {
            console.error("❌ Błąd aktualizacji projektu:", error);
            throw new Error("Nie udało się zaktualizować projektu");
        }
    }
    async deleteProject(id) {
        try {
            await prisma.project.update({
                where: { id: parseInt(id) },
                data: { is_active: 0 },
            });
            console.log(`✅ Projekt ${id} został dezaktywowany`);
        }
        catch (error) {
            console.error("❌ Błąd dezaktywacji projektu:", error);
            throw new Error("Nie udało się dezaktywować projektu");
        }
    }
    toResponse(p) {
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
exports.ProjectService = ProjectService;
