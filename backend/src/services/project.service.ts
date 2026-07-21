// backend/src/services/project.service.ts
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Typ dla projektu z bazy danych
type ProjectFromDB = {
    id: string;
    name: string;
    description: string;
    pillar: string;
    coordinator_id: number;
    team: string;
    status: string;
    estimated_end: Date;
    created_at: Date;
    updated_at: Date;
};

// Typ dla projektu zwracanego do frontendu
type ProjectResponse = {
    id: string;
    name: string;
    description: string;
    pillar: string;
    coordinator: string;
    team: string[];
    status: string;
    estimatedCompletion: Date;
    createdAt: Date;
    updatedAt: Date;
};

// Funkcja pomocnicza do konwersji
const convertProject = (project: ProjectFromDB): ProjectResponse => ({
    id: project.id,
    name: project.name,
    description: project.description,
    pillar: project.pillar,
    coordinator: String(project.coordinator_id),
    team: project.team ? JSON.parse(project.team) : [],
    status: project.status,
    estimatedCompletion: project.estimated_end,
    createdAt: project.created_at,
    updatedAt: project.updated_at
});

export class ProjectService {
    async getAllProjects(): Promise<ProjectResponse[]> {
        try {
            const projects = await prisma.project.findMany({
                orderBy: {
                    created_at: 'desc' // <-- ZMIEŃ NA created_at
                }
            });
            return projects.map((p: ProjectFromDB) => convertProject(p));
        } catch (error) {
            console.error('Błąd pobierania projektów:', error);
            throw new Error('Nie udało się pobrać projektów');
        }
    }

    async getProjectById(id: string): Promise<ProjectResponse | null> {
        try {
            const project = await prisma.project.findUnique({
                where: { id }
            });
            if (project) {
                return convertProject(project as ProjectFromDB);
            }
            return null;
        } catch (error) {
            console.error(`Błąd pobierania projektu ${id}:`, error);
            throw new Error('Nie udało się pobrać projektu');
        }
    }

    async createProject(data: {
        name: string;
        description: string;
        pillar: string;
        status: string;
        estimatedCompletion: string;
        team: string[];
        coordinator: string;
    }): Promise<ProjectResponse> {
        try {
            const project = await prisma.project.create({
                data: {
                    name: data.name,
                    description: data.description,
                    pillar: data.pillar,
                    coordinator_id: parseInt(data.coordinator) || 1,
                    team: JSON.stringify(data.team),
                    status: data.status,
                    estimated_end: new Date(data.estimatedCompletion),
                }
            });
            return convertProject(project as ProjectFromDB);
        } catch (error) {
            console.error('Błąd tworzenia projektu:', error);
            throw new Error('Nie udało się utworzyć projektu');
        }
    }

    async updateProject(id: string, data: {
        name?: string;
        description?: string;
        pillar?: string;
        status?: string;
        estimatedCompletion?: string;
        team?: string[];
        coordinator?: string;
    }): Promise<ProjectResponse> {
        try {
            const updateData: any = {};
            if (data.name !== undefined) updateData.name = data.name;
            if (data.description !== undefined) updateData.description = data.description;
            if (data.pillar !== undefined) updateData.pillar = data.pillar;
            if (data.status !== undefined) updateData.status = data.status;
            if (data.estimatedCompletion !== undefined) {
                updateData.estimated_end = new Date(data.estimatedCompletion);
            }
            if (data.team !== undefined) updateData.team = JSON.stringify(data.team);
            if (data.coordinator !== undefined) {
                updateData.coordinator_id = parseInt(data.coordinator) || 1;
            }

            const project = await prisma.project.update({
                where: { id },
                data: updateData
            });
            return convertProject(project as ProjectFromDB);
        } catch (error) {
            console.error(`Błąd aktualizacji projektu ${id}:`, error);
            throw new Error('Nie udało się zaktualizować projektu');
        }
    }

    async deleteProject(id: string): Promise<boolean> {
        try {
            await prisma.project.delete({
                where: { id }
            });
            return true;
        } catch (error) {
            console.error(`Błąd usuwania projektu ${id}:`, error);
            throw new Error('Nie udało się usunąć projektu');
        }
    }

    async getProjectsByPillar(pillar: string): Promise<ProjectResponse[]> {
        try {
            const projects = await prisma.project.findMany({
                where: { pillar },
                orderBy: {
                    created_at: 'desc' // <-- ZMIEŃ NA created_at
                }
            });
            return projects.map((p: ProjectFromDB) => convertProject(p));
        } catch (error) {
            console.error(`Błąd pobierania projektów dla filaru ${pillar}:`, error);
            throw new Error('Nie udało się pobrać projektów');
        }
    }

    async getProjectsByStatus(status: string): Promise<ProjectResponse[]> {
        try {
            const projects = await prisma.project.findMany({
                where: { status },
                orderBy: {
                    created_at: 'desc' // <-- ZMIEŃ NA created_at
                }
            });
            return projects.map((p: ProjectFromDB) => convertProject(p));
        } catch (error) {
            console.error(`Błąd pobierania projektów dla statusu ${status}:`, error);
            throw new Error('Nie udało się pobrać projektów');
        }
    }
}