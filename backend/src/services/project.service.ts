import { PrismaClient } from '@prisma/client';

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
}

export class ProjectService {
    async getAllProjects(): Promise<ProjectResponse[]> {
        try {
            const projects = await prisma.project.findMany({
                orderBy: { createdAt: "desc" },
            });

            console.log('✅ Znaleziono projektów:', projects.length);
            return projects.map(p => this.toResponse(p));
        } catch (error) {
            console.error('❌ Błąd pobierania projektów:', error);
            throw new Error('Nie udało się pobrać projektów');
        }
    }

    async getProjectById(id: string): Promise<ProjectResponse | null> {
        try {
            const project = await prisma.project.findUnique({ where: { id } });
            return project ? this.toResponse(project) : null;
        } catch (error) {
            console.error('❌ Błąd pobierania projektu:', error);
            throw new Error('Nie udało się pobrać projektu');
        }
    }

    async getProjectsByPillar(pillar: string): Promise<ProjectResponse[]> {
        const projects = await prisma.project.findMany({
            where: { pillar },
            orderBy: { createdAt: "desc" },
        });
        return projects.map(p => this.toResponse(p));
    }

    async getProjectsByStatus(status: string): Promise<ProjectResponse[]> {
        const projects = await prisma.project.findMany({
            where: { status },
            orderBy: { createdAt: "desc" },
        });
        return projects.map(p => this.toResponse(p));
    }

    async createProject(data: any): Promise<ProjectResponse> {
        try {
            const createData: any = {
                name: data.name,
                description: data.description || null,
                pillar: data.pillar || null,
                coordinatorId: data.coordinator_id ?? undefined,
                team: data.team || null,
                status: data.status || 'planning',
            };

            // Dodajemy datę tylko jeśli jest
            if (data.estimated_end) {
                createData.estimatedCompletion = new Date(data.estimated_end);
            }

            const project = await prisma.project.create({
                data: createData
            });

            return this.toResponse(project);
        } catch (error) {
            console.error('❌ Błąd tworzenia projektu:', error);
            throw new Error('Nie udało się utworzyć projektu');
        }
    }

    async updateProject(id: string, data: any): Promise<ProjectResponse> {
        try {
            const updateData: any = {
                name: data.name,
                description: data.description || null,
                pillar: data.pillar || null,
                coordinatorId: data.coordinator_id ?? undefined,
                team: data.team || null,
                status: data.status || 'planning',
            };

            // Dodajemy datę tylko jeśli jest
            if (data.estimated_end) {
                updateData.estimatedCompletion = new Date(data.estimated_end);
            }

            const project = await prisma.project.update({
                where: { id },
                data: updateData
            });

            return this.toResponse(project);
        } catch (error) {
            console.error('❌ Błąd aktualizacji projektu:', error);
            throw new Error('Nie udało się zaktualizować projektu');
        }
    }

    async deleteProject(id: string): Promise<void> {
        try {
            await prisma.project.delete({ where: { id } });
        } catch (error) {
            console.error('❌ Błąd usuwania projektu:', error);
            throw new Error('Nie udało się usunąć projektu');
        }
    }

    private toResponse(p: any): ProjectResponse {
        return {
            id: p.id,
            name: p.name,
            description: p.description,
            pillar: p.pillar,
            coordinator_id: p.coordinatorId,
            team: p.team,
            status: p.status,
            estimated_end: p.estimatedCompletion
                ? p.estimatedCompletion.toISOString().split('T')[0]
                : null,
            created_at: p.createdAt.toISOString().split('T')[0],
            updated_at: p.updatedAt.toISOString().split('T')[0],
        };
    }
}