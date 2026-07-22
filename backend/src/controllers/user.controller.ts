// backend/src/controllers/user.controller.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
type ProjectPillar = "project" | "conference" | "advocacy" | "simulation";
export class UserController {
	async getAllUsers(req: Request, res: Response) {
		try {
			const users = await prisma.user.findMany({
				select: {
					id: true,
					email: true,
					first_name: true,
					last_name: true,
					username: true,
					role_id: true,
					team: true,
					status: true,
				},
			});

			// Mapuj na format oczekiwany przez frontend
			const mappedUsers = users.map((user) => ({
				id: user.id.toString(),
				name: `${user.first_name} ${user.last_name}`,
				email: user.email,
				role: mapRoleId(user.role_id), // Konwersja role_id na nazwę roli
				pillar: mapTeamToPillar(user.team), // Konwersja team na pillar
			}));

			res.json(mappedUsers);
		} catch (error) {
			console.error("❌ Błąd pobierania użytkowników:", error);
			res.status(500).json({ error: "Nie udało się pobrać użytkowników" });
		}
	}
}

// Funkcja pomocnicza do mapowania role_id na nazwę roli
function mapRoleId(roleId: number): "admin" | "coordinator" | "member" {
	const roleMap: Record<number, "admin" | "coordinator" | "member"> = {
		1: "admin",
		2: "coordinator", // ✅ role_id=2 to coordinator
		3: "coordinator", // ✅ role_id=3 to coordinator
		4: "member", // ✅ role_id=4 to member
	};
	return roleMap[roleId] || "member";
}

// Funkcja pomocnicza do mapowania team na pillar
// backend/src/controllers/user.controller.ts
function mapTeamToPillar(team: string | null): ProjectPillar | null {
	if (!team) return null;

	// ✅ "Zarząd" nie jest filarem - zwracamy null
	if (team === "Zarząd") return null;

	const pillarMap: Record<string, ProjectPillar> = {
		"Filar Projektowy": "project",
		"Filar Konferencyjny": "conference",
		"Filar Konferencji i Debat": "conference",
		"Filar Rzeczniczy": "advocacy",
		"Filar Symulacyjny": "simulation",
	};
	return pillarMap[team] || null;
}
