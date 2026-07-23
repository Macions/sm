// backend/src/controllers/user.controller.ts
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

// ✅ Użyj "as any" aby ominąć problem z typami
const prisma = new PrismaClient() as any;

type ProjectPillar = "project" | "conference" | "advocacy" | "simulation";

export class UserController {
	// Pobierz wszystkich użytkowników
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

			const mappedUsers = users.map((user: any) => ({
				id: user.id.toString(),
				name: `${user.first_name} ${user.last_name}`,
				email: user.email,
				role: mapRoleId(user.role_id),
				pillar: mapTeamToPillar(user.team),
			}));

			res.json(mappedUsers);
		} catch (error) {
			console.error("❌ Błąd pobierania użytkowników:", error);
			res.status(500).json({ error: "Nie udało się pobrać użytkowników" });
		}
	}

	// Pobierz użytkownika po ID
	async getUserById(req: Request, res: Response) {
		try {
			// ✅ Poprawne pobranie ID z params
			const id = parseInt(req.params.id as string);

			if (isNaN(id)) {
				return res.status(400).json({ error: "Nieprawidłowe ID użytkownika" });
			}

			const user = await prisma.user.findUnique({
				where: { id },
				select: {
					id: true,
					email: true,
					first_name: true,
					last_name: true,
					username: true,
					role_id: true,
					team: true,
					status: true,
					province: true,
					phone: true,
					functional_role: true,
					join_date: true,
					is_active: true,
					created_at: true,
				},
			});

			if (!user) {
				return res.status(404).json({ error: "Użytkownik nie znaleziony" });
			}

			res.json({
				id: user.id.toString(),
				name: `${user.first_name} ${user.last_name}`,
				email: user.email,
				username: user.username,
				role: mapRoleId(user.role_id),
				role_id: user.role_id,
				team: user.team,
				status: user.status,
				province: user.province,
				phone: user.phone,
				functional_role: user.functional_role,
				join_date: user.join_date,
				is_active: user.is_active,
				created_at: user.created_at,
			});
		} catch (error) {
			console.error("❌ Błąd pobierania użytkownika:", error);
			res.status(500).json({ error: "Nie udało się pobrać użytkownika" });
		}
	}

	// Aktualizuj użytkownika
	async updateUser(req: Request, res: Response) {
		try {
			// ✅ Poprawne pobranie ID z params
			const id = parseInt(req.params.id as string);

			if (isNaN(id)) {
				return res.status(400).json({ error: "Nieprawidłowe ID użytkownika" });
			}

			const {
				username,
				email,
				first_name,
				last_name,
				role_id,
				team,
				status,
				province,
				phone,
				functional_role,
				is_active,
			} = req.body;

			// Sprawdź czy użytkownik istnieje
			const existingUser = await prisma.user.findUnique({
				where: { id },
			});

			if (!existingUser) {
				return res.status(404).json({ error: "Użytkownik nie znaleziony" });
			}

			const updatedUser = await prisma.user.update({
				where: { id },
				data: {
					username: username || undefined,
					email: email || undefined,
					first_name: first_name || undefined,
					last_name: last_name || undefined,
					role_id: role_id ?? undefined,
					team: team || undefined,
					status: status || undefined,
					province: province || undefined,
					phone: phone || undefined,
					functional_role: functional_role || undefined,
					is_active: is_active !== undefined ? is_active : undefined,
				},
			});

			res.json({
				...updatedUser,
				role: mapRoleId(updatedUser.role_id),
			});
		} catch (error) {
			console.error("❌ Błąd aktualizacji użytkownika:", error);
			res.status(500).json({ error: "Nie udało się zaktualizować użytkownika" });
		}
	}

	// Usuń użytkownika (soft delete)
	async deleteUser(req: Request, res: Response) {
		try {
			// ✅ Poprawne pobranie ID z params
			const id = parseInt(req.params.id as string);

			if (isNaN(id)) {
				return res.status(400).json({ error: "Nieprawidłowe ID użytkownika" });
			}

			await prisma.user.update({
				where: { id },
				data: { is_active: 0 },
			});

			res.json({ message: "Użytkownik został dezaktywowany" });
		} catch (error) {
			console.error("❌ Błąd usuwania użytkownika:", error);
			res.status(500).json({ error: "Nie udało się usunąć użytkownika" });
		}
	}
}

// ✅ Funkcja pomocnicza do mapowania role_id na nazwę roli
function mapRoleId(roleId: number | null): "admin" | "coordinator" | "member" {
	const roleMap: Record<number, "admin" | "coordinator" | "member"> = {
		1: "admin",
		2: "coordinator",
		3: "coordinator",
		4: "member",
	};
	return roleMap[roleId || 4] || "member";
}

// ✅ Funkcja pomocnicza do mapowania team na pillar
function mapTeamToPillar(team: string | null): ProjectPillar | null {
	if (!team) return null;

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