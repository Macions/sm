// A:\sm system\sm\backend\src\services\structure.service.ts

import pool from "../config/db";

export interface Person {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
    phone?: string;
    province?: string;
    avatar?: string;
}

export interface TeamNode {
    id: string;
    name: string;
    role: string;
    icon: string;
    description: string;
    status: "active" | "inactive";
    email?: string;
    children: TeamNode[];
    people: Person[];
}

export class StructureService {
    async getFullStructure(): Promise<TeamNode> {
        try {
            // Pobierz wszystkie zespoły
            const [teams]: any = await pool.query(`
                SELECT 
                    id, 
                    name, 
                    role, 
                    description, 
                    icon, 
                    status, 
                    parent_id,
                    email
                FROM teams 
                ORDER BY parent_id, id
            `);

            // Pobierz wszystkich członków z ich danymi
            const [members]: any = await pool.query(`
                SELECT 
                    tm.team_id,
                    tm.role as member_role,
                    tm.is_leader,
                    u.id as user_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone,
                    u.province,
                    u.avatar
                FROM team_members tm
                JOIN users u ON tm.user_id = u.id
                WHERE u.is_active = 1
                ORDER BY tm.is_leader DESC, u.last_name
            `);

            // Stwórz mapę zespołów
            const teamMap: Record<number, any> = {};
            const teamChildren: Record<number, number[]> = {};

            teams.forEach((team: any) => {
                teamMap[team.id] = {
                    id: team.id.toString(),
                    name: team.name,
                    role: team.role,
                    icon: team.icon || 'Users',
                    description: team.description || '',
                    status: team.status || 'active',
                    email: team.email || undefined,
                    children: [],
                    people: []
                };

                const parentId = team.parent_id || 0;
                if (!teamChildren[parentId]) {
                    teamChildren[parentId] = [];
                }
                teamChildren[parentId].push(team.id);
            });

            // Dodaj członków do zespołów
            members.forEach((member: any) => {
                if (teamMap[member.team_id]) {
                    teamMap[member.team_id].people.push({
                        id: member.user_id.toString(),
                        firstName: member.first_name,
                        lastName: member.last_name,
                        role: member.member_role,
                        email: member.email,
                        phone: member.phone || undefined,
                        province: member.province || undefined,
                        avatar: member.avatar || undefined
                    });
                }
            });

            // Zbuduj drzewo
            const buildTree = (parentId: number): TeamNode[] => {
                const childIds = teamChildren[parentId] || [];
                return childIds.map((id: number) => {
                    const node = teamMap[id];
                    node.children = buildTree(id);
                    return node;
                });
            };

            // Zwróć główny węzeł (organizacja)
            const root = teamMap[1];
            if (root) {
                root.children = buildTree(1);
                return root;
            }

            // Fallback - jeśli nie ma roota
            return {
                id: "organization",
                name: "Siła Młodych",
                role: "Struktura organizacyjna",
                icon: "Users",
                description: "Organizacja młodzieżowa",
                status: "active",
                children: buildTree(0),
                people: []
            };
        } catch (error) {
            console.error("Błąd pobierania struktury:", error);
            throw error;
        }
    }

    async getTeamById(teamId: number): Promise<TeamNode | null> {
        try {
            const [teams]: any = await pool.query(`
                SELECT 
                    id, 
                    name, 
                    role, 
                    description, 
                    icon, 
                    status, 
                    parent_id,
                    email
                FROM teams 
                WHERE id = ?
            `, [teamId]);

            if (teams.length === 0) return null;

            const team = teams[0];

            const [members]: any = await pool.query(`
                SELECT 
                    tm.role as member_role,
                    tm.is_leader,
                    u.id as user_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone,
                    u.province,
                    u.avatar
                FROM team_members tm
                JOIN users u ON tm.user_id = u.id
                WHERE tm.team_id = ? AND u.is_active = 1
                ORDER BY tm.is_leader DESC, u.last_name
            `, [teamId]);

            const people = members.map((member: any) => ({
                id: member.user_id.toString(),
                firstName: member.first_name,
                lastName: member.last_name,
                role: member.member_role,
                email: member.email,
                phone: member.phone || undefined,
                province: member.province || undefined,
                avatar: member.avatar || undefined
            }));

            return {
                id: team.id.toString(),
                name: team.name,
                role: team.role,
                icon: team.icon || 'Users',
                description: team.description || '',
                status: team.status || 'active',
                email: team.email || undefined,
                children: [],
                people: people
            };
        } catch (error) {
            console.error("Błąd pobierania zespołu:", error);
            throw error;
        }
    }
}