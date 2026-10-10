// src/routes/systemIdeas.routes.ts
import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
	authMiddleware,
	type AuthRequest,
} from "../middleware/auth.middleware";
import { logger } from "../utils/logger";

const router = Router();
const prisma = new PrismaClient();

const STATUSES = [
	"pending",
	"planned",
	"in_progress",
	"done",
	"rejected",
] as const;
type IdeaStatus = (typeof STATUSES)[number];

const STATUS_LABELS: Record<IdeaStatus, string> = {
	pending: "Oczekuje",
	planned: "W planach",
	in_progress: "W trakcie",
	done: "Wykonany",
	rejected: "Odrzucony",
};

function isAdminOrBoard(role?: string) {
	return role === "admin" || role === "board" || role === "Zarząd";
}

/* ─── GET /system-ideas ─── */
router.get(
	"/system-ideas",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const user = req.user;
			if (!user?.id) return res.status(401).json({ error: "Brak autoryzacji" });

			const where = isAdminOrBoard(user.role) ? {} : { author_id: user.id };

			const ideas = await prisma.systemIdea.findMany({
				where,
				orderBy: { created_at: "desc" },
				include: {
					author: {
						select: { id: true, first_name: true, last_name: true },
					},
				},
			});

			res.json({
				ideas: ideas.map((i) => ({
					id: i.id.toString(),
					title: i.title,
					description: i.description,
					category: i.category,
					status: i.status,
					statusLabel: STATUS_LABELS[i.status as IdeaStatus] ?? i.status,
					adminNote: i.admin_note,
					createdAt: i.created_at.toISOString(),
					updatedAt: i.updated_at.toISOString(),
					reviewedAt: i.reviewed_at?.toISOString() ?? null,
					completedAt: i.completed_at?.toISOString() ?? null,
					author: {
						id: i.author.id.toString(),
						firstName: i.author.first_name,
						lastName: i.author.last_name,
					},
				})),
				total: ideas.length,
				canManage: isAdminOrBoard(user.role),
			});
		} catch (error) {
			logger.error("[SYSTEM-IDEAS] Błąd listy:", error);
			res.status(500).json({ error: "Nie udało się pobrać pomysłów" });
		}
	},
);

/* ─── POST /system-ideas ─── */
router.post(
	"/system-ideas",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const user = req.user;
			if (!user?.id) return res.status(401).json({ error: "Brak autoryzacji" });

			const { title, description, category } = req.body ?? {};

			if (!title?.trim() || !description?.trim()) {
				return res.status(400).json({ error: "Tytuł i opis są wymagane" });
			}

			const idea = await prisma.systemIdea.create({
				data: {
					title,
					description,
					category: category || null,
					author_id: user.id,
					status: "pending",
				},
				include: {
					author: {
						select: { id: true, first_name: true, last_name: true },
					},
				},
			});

			try {
				const admins = await prisma.user.findMany({
					where: { role_id: { in: [1, 2] }, is_active: true },
					select: { id: true },
				});

				if (admins.length > 0) {
					await prisma.notification.createMany({
						data: admins.map((a) => ({
							user_id: a.id,
							title: "Nowy pomysł na rozwój strony",
							message: `${user.first_name ?? ""} ${user.last_name ?? ""} dodał pomysł: "${idea.title}"`,
							type: "info",
							read: false,
							link: `/ideas`,
							target: "board",
							created_at: new Date(),
						})),
					});
				}
			} catch (e) {
				logger.warn("[SYSTEM-IDEAS] Błąd powiadomień:", e);
			}

			res.status(201).json({
				id: idea.id.toString(),
				title: idea.title,
				description: idea.description,
				category: idea.category,
				status: idea.status,
				statusLabel: STATUS_LABELS[idea.status as IdeaStatus] ?? idea.status,
				createdAt: idea.created_at.toISOString(),
				updatedAt: idea.updated_at.toISOString(),
				author: {
					id: idea.author.id.toString(),
					firstName: idea.author.first_name,
					lastName: idea.author.last_name,
				},
			});
		} catch (error) {
			logger.error("[SYSTEM-IDEAS] Błąd tworzenia:", error);
			res.status(500).json({ error: "Nie udało się dodać pomysłu" });
		}
	},
);

/* ─── PUT /system-ideas/:id ─── */
router.put(
	"/system-ideas/:id",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const user = req.user;
			if (!user?.id) return res.status(401).json({ error: "Brak autoryzacji" });

			const id = parseInt(String(req.params.id));
			if (isNaN(id)) return res.status(400).json({ error: "Złe ID" });

			const idea = await prisma.systemIdea.findUnique({ where: { id } });
			if (!idea) return res.status(404).json({ error: "Nie znaleziono" });

			const isOwner = idea.author_id === user.id;
			const isManager = isAdminOrBoard(user.role);

			if (!isOwner && !isManager) {
				return res.status(403).json({ error: "Brak uprawnień" });
			}

			const { title, description, category, status, adminNote } =
				req.body ?? {};

			const updateData: any = {};
			if (title !== undefined) updateData.title = title.trim();
			if (description !== undefined)
				updateData.description = description.trim();
			if (category !== undefined)
				updateData.category = category?.trim() || null;

			if (isManager) {
				if (status !== undefined) {
					if (!STATUSES.includes(status)) {
						return res.status(400).json({ error: "Nieprawidłowy status" });
					}
					updateData.status = status;
					updateData.reviewed_by = user.id;
					updateData.reviewed_at = new Date();
					updateData.completed_at = status === "done" ? new Date() : null;
					updateData.completed_by = status === "done" ? user.id : null;
				}
				if (adminNote !== undefined) updateData.admin_note = adminNote;
			}

			const updated = await prisma.systemIdea.update({
				where: { id },
				data: updateData,
				include: {
					author: {
						select: { id: true, first_name: true, last_name: true },
					},
				},
			});

			res.json({
				id: updated.id.toString(),
				title: updated.title,
				description: updated.description,
				category: updated.category,
				status: updated.status,
				statusLabel:
					STATUS_LABELS[updated.status as IdeaStatus] ?? updated.status,
				adminNote: updated.admin_note,
				createdAt: updated.created_at.toISOString(),
				updatedAt: updated.updated_at.toISOString(),
				reviewedAt: updated.reviewed_at?.toISOString() ?? null,
				completedAt: updated.completed_at?.toISOString() ?? null,
				author: {
					id: updated.author.id.toString(),
					firstName: updated.author.first_name,
					lastName: updated.author.last_name,
				},
			});
		} catch (error) {
			logger.error("[SYSTEM-IDEAS] Błąd edycji:", error);
			res.status(500).json({ error: "Nie udało się zapisać" });
		}
	},
);

/* ─── PATCH /system-ideas/:id/status ─── */
router.patch(
	"/system-ideas/:id/status",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const user = req.user;
			if (!user?.id) return res.status(401).json({ error: "Brak autoryzacji" });
			if (!isAdminOrBoard(user.role)) {
				return res.status(403).json({ error: "Brak uprawnień" });
			}

			const id = parseInt(String(req.params.id));
			if (isNaN(id)) return res.status(400).json({ error: "Złe ID" });

			const { status } = req.body ?? {};
			if (!STATUSES.includes(status)) {
				return res.status(400).json({ error: "Nieprawidłowy status" });
			}

			const updated = await prisma.systemIdea.update({
				where: { id },
				data: {
					status,
					reviewed_by: user.id,
					reviewed_at: new Date(),
					completed_at: status === "done" ? new Date() : null,
					completed_by: status === "done" ? user.id : null,
				},
				include: {
					author: {
						select: { id: true, first_name: true, last_name: true },
					},
				},
			});

			res.json({
				id: updated.id.toString(),
				title: updated.title,
				description: updated.description,
				category: updated.category,
				status: updated.status,
				statusLabel:
					STATUS_LABELS[updated.status as IdeaStatus] ?? updated.status,
				adminNote: updated.admin_note,
				createdAt: updated.created_at.toISOString(),
				updatedAt: updated.updated_at.toISOString(),
				reviewedAt: updated.reviewed_at?.toISOString() ?? null,
				completedAt: updated.completed_at?.toISOString() ?? null,
				author: {
					id: updated.author.id.toString(),
					firstName: updated.author.first_name,
					lastName: updated.author.last_name,
				},
			});
		} catch (error) {
			logger.error("[SYSTEM-IDEAS] Błąd statusu:", error);
			res.status(500).json({ error: "Nie udało się zmienić statusu" });
		}
	},
);

/* ─── DELETE /system-ideas/:id ─── */
router.delete(
	"/system-ideas/:id",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const user = req.user;
			if (!user?.id) return res.status(401).json({ error: "Brak autoryzacji" });

			const id = parseInt(String(req.params.id));
			const idea = await prisma.systemIdea.findUnique({ where: { id } });
			if (!idea) return res.status(404).json({ error: "Nie znaleziono" });

			const isOwner = idea.author_id === user.id;
			const isManager = isAdminOrBoard(user.role);

			if (!isManager) {
				if (!isOwner) {
					return res.status(403).json({ error: "Brak uprawnień" });
				}
				if (idea.status !== "pending") {
					return res.status(400).json({
						error: "Nie można usunąć pomysłu, który jest już w analizie",
					});
				}
			}

			await prisma.systemIdea.delete({ where: { id } });
			res.json({ success: true });
		} catch (error) {
			logger.error("[SYSTEM-IDEAS] Błąd usuwania:", error);
			res.status(500).json({ error: "Nie udało się usunąć" });
		}
	},
);

export default router;