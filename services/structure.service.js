"use strict";
// A:\sm system\sm\backend\src\services\structure.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructureService = void 0;
const db_1 = __importDefault(require("../config/db"));
class StructureService {
    async getFullStructure() {
        try {
            // Pobierz wszystkie zespoły
            const [teams] = await db_1.default.query(`
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
            const [members] = await db_1.default.query(`
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
            const teamMap = {};
            const teamChildren = {};
            teams.forEach((team) => {
                teamMap[team.id] = {
                    id: team.id.toString(),
                    name: team.name,
                    role: team.role,
                    icon: team.icon || 'Users',
                    description: team.description || '',
                    status: team.status || 'active',
                    email: team.email || null,
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
            members.forEach((member) => {
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
            const buildTree = (parentId) => {
                const childIds = teamChildren[parentId] || [];
                return childIds.map((id) => {
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
        }
        catch (error) {
            console.error("Błąd pobierania struktury:", error);
            throw error;
        }
    }
    async getTeamById(teamId) {
        try {
            const [teams] = await db_1.default.query(`
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
            if (teams.length === 0)
                return null;
            const team = teams[0];
            const [members] = await db_1.default.query(`
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
            const people = members.map((member) => ({
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
        }
        catch (error) {
            console.error("Błąd pobierania zespołu:", error);
            throw error;
        }
    }
}
exports.StructureService = StructureService;
