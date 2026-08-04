import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export class UserController {
	async getAllUsers(req: Request, res: Response) {
		try {
			// Użyj raw SQL zamiast Prisma
			const users = await prisma.$queryRaw`
				SELECT 
					id, 
					email, 
					first_name, 
					last_name, 
					username, 
					role_id, 
					team, 
					status,
					functional_role,
					phone,
					province,
					pillars
				FROM users 
				WHERE is_active = 1
				ORDER BY first_name ASC
			`;

			const mappedUsers = (users as any[]).map((user: any) => ({
				id: user.id.toString(),
				name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Nieznany',
				email: user.email || '',
				role: mapRoleId(user.role_id),
				team: user.team || null,
				status: user.status || "active",
				functional_role: user.functional_role || "Członek",
				phone: user.phone || "",
				province: user.province || "",
				pillar: null,
				pillars: user.pillars ? user.pillars.split(",").map((p: string) => p.trim()).filter(Boolean) : [],
			}));

			res.json(mappedUsers);
		} catch (error) {
			logger.error("❌ Błąd pobierania użytkowników:", error);
			res.status(500).json({
				error: "Nie udało się pobrać użytkowników",
				details: error instanceof Error ? error.message : "Unknown error"
			});
		}
	}

	async getUserById(req: Request, res: Response) {
		try {
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
				name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Nieznany',
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
				pillar: null,
				pillars: [],
			});
		} catch (error) {
			logger.error("❌ Błąd pobierania użytkownika:", error);
			res.status(500).json({ error: "Nie udało się pobrać użytkownika" });
		}
	}

	async updateUser(req: Request, res: Response) {
		try {
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

			const existingUser = await prisma.user.findUnique({
				where: { id },
			});

			if (!existingUser) {
				return res.status(404).json({ error: "Użytkownik nie znaleziony" });
			}

			// 🔥 POPRAWIONE - is_active jako boolean
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
					is_active: is_active !== undefined ? Boolean(is_active) : undefined,
				},
			});

			res.json({
				...updatedUser,
				role: mapRoleId(updatedUser.role_id),
			});
		} catch (error) {
			logger.error("❌ Błąd aktualizacji użytkownika:", error);
			res
				.status(500)
				.json({ error: "Nie udało się zaktualizować użytkownika" });
		}
	}

	async deleteUser(req: Request, res: Response) {
		try {
			const id = parseInt(req.params.id as string);

			if (isNaN(id)) {
				return res.status(400).json({ error: "Nieprawidłowe ID użytkownika" });
			}

			// 🔥 POPRAWIONE - is_active jako boolean false
			await prisma.user.update({
				where: { id },
				data: { is_active: false },
			});

			res.json({ message: "Użytkownik został dezaktywowany" });
		} catch (error) {
			logger.error("❌ Błąd usuwania użytkownika:", error);
			res.status(500).json({ error: "Nie udało się usunąć użytkownika" });
		}
	}
}

function mapRoleId(roleId: number | null): "admin" | "coordinator" | "member" {
	const roleMap: Record<number, "admin" | "coordinator" | "member"> = {
		1: "admin",
		2: "coordinator",
		3: "coordinator",
		4: "member",
	};
	return roleMap[roleId || 4] || "member";
}