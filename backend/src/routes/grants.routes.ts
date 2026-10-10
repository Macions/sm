// src/routes/grants.routes.ts
import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
	authMiddleware,
	type AuthRequest,
} from "../middleware/auth.middleware";
import { logger } from "../utils/logger";

const router = Router();
const prisma = new PrismaClient();

/**
 * Dokładna nazwa zespołu grantowego w tabeli `teams`.
 * Jeśli w bazie nazywa się inaczej — zmień tutaj.
 */
const GRANT_TEAM_NAME = "Zespół grantowy";

const GRANT_CATEGORIES = ["upcoming", "current", "archived"] as const;
const GRANT_WORK_STATUSES = [
	"analyzed",
	"in_preparation",
	"submitted",
	"accepted",
	"rejected",
	"no_application",
] as const;
const RECRUITMENT_STATUSES = ["preparing", "open", "closed"] as const;

type GrantCategory = (typeof GRANT_CATEGORIES)[number];
type GrantWorkStatus = (typeof GRANT_WORK_STATUSES)[number];
type RecruitmentStatus = (typeof RECRUITMENT_STATUSES)[number];

async function isGrantTeamMember(userId: number): Promise<boolean> {
	const row = await prisma.teamMember.findFirst({
		where: {
			user_id: userId,
			team: { name: GRANT_TEAM_NAME },
		},
		select: { id: true },
	});
	return !!row;
}

function userSelect() {
	return {
		id: true,
		first_name: true,
		last_name: true,
		email: true,
		functional_role: true,
	} as const;
}

function mapRecruitment(r: any) {
	return {
		id: r.id.toString(),
		grantId: r.grant_id.toString(),
		projectTitle: r.project_title,
		projectDescription: r.project_description,
		responsibilities: r.responsibilities,
		requiredSkills: r.required_skills,
		deadline: r.deadline?.toISOString() ?? null,
		formUrl: r.form_url,
		status: r.status,
		createdBy: r.created_by_user
			? {
					id: r.created_by_user.id.toString(),
					firstName: r.created_by_user.first_name,
					lastName: r.created_by_user.last_name,
				}
			: null,
		createdAt: r.created_at.toISOString(),
		updatedAt: r.updated_at.toISOString(),
	};
}

function mapGrant(g: any) {
	return {
		id: g.id.toString(),
		name: g.name,
		description: g.description,
		category: g.category,
		workStatus: g.work_status,
		amountMin: g.amount_min != null ? Number(g.amount_min) : null,
		amountMax: g.amount_max != null ? Number(g.amount_max) : null,
		submissionDeadline: g.submission_deadline?.toISOString() ?? null,
		projectStartDate: g.project_start_date?.toISOString() ?? null,
		projectEndDate: g.project_end_date?.toISOString() ?? null,
		websiteUrl: g.website_url,
		regulationsUrl: g.regulations_url,
		applicationFormUrl: g.application_form_url,
		thematicArea: g.thematic_area,
		requirements: g.requirements,
		ownContribution: g.own_contribution,
		eligibleCosts: g.eligible_costs,
		targetGroup: g.target_group,
		eligibleApplicants: g.eligible_applicants,
		requiredPartners: g.required_partners,
		requiredDocuments: g.required_documents,
		projectResults: g.project_results,
		responsibleUser: g.responsible_user
			? {
					id: g.responsible_user.id.toString(),
					firstName: g.responsible_user.first_name,
					lastName: g.responsible_user.last_name,
					email: g.responsible_user.email,
				}
			: null,
		lastVerifiedAt: g.last_verified_at?.toISOString() ?? null,
		lastVerifiedBy: g.last_verified_by_user
			? {
					id: g.last_verified_by_user.id.toString(),
					firstName: g.last_verified_by_user.first_name,
					lastName: g.last_verified_by_user.last_name,
				}
			: null,
		createdBy: {
			id: g.created_by_user.id.toString(),
			firstName: g.created_by_user.first_name,
			lastName: g.created_by_user.last_name,
		},
		createdAt: g.created_at.toISOString(),
		updatedAt: g.updated_at.toISOString(),
		recruitments: Array.isArray(g.recruitments)
			? g.recruitments.map(mapRecruitment)
			: undefined,
	};
}

/* GET /grant-team/check */
router.get(
	"/grant-team/check",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const user = req.user;
			if (!user?.id) return res.status(401).json({ error: "Brak autoryzacji" });
			const isMember = await isGrantTeamMember(user.id);
			res.json({ isMember });
		} catch (error) {
			logger.error("[GRANT-TEAM-CHECK] Błąd:", error);
			res.status(500).json({ error: "Błąd serwera" });
		}
	},
);

/* GET /grant-team/members */
router.get(
	"/grant-team/members",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const team = await prisma.team.findFirst({
				where: { name: GRANT_TEAM_NAME },
				include: {
					members: {
						include: { user: { select: userSelect() } },
					},
				},
			});
			if (!team) return res.json({ members: [] });
			res.json({
				teamId: team.id.toString(),
				teamName: team.name,
				members: team.members.map((m) => ({
					id: m.user.id.toString(),
					firstName: m.user.first_name,
					lastName: m.user.last_name,
					email: m.user.email,
					functionalRole: m.user.functional_role,
					roleInTeam: m.role,
					isLeader: m.is_leader || false,
				})),
			});
		} catch (error) {
			logger.error("[GRANT-TEAM-MEMBERS] Błąd:", error);
			res.status(500).json({ error: "Nie udało się pobrać członków zespołu" });
		}
	},
);

/* GET /grants */
router.get(
	"/grants",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const user = req.user;
			if (!user?.id) return res.status(401).json({ error: "Brak autoryzacji" });

			const { category, workStatus, thematicArea, search, hasRecruitment } =
				req.query as Record<string, string | undefined>;

			const where: any = {};
			if (category && GRANT_CATEGORIES.includes(category as GrantCategory)) {
				where.category = category;
			}
			if (
				workStatus &&
				GRANT_WORK_STATUSES.includes(workStatus as GrantWorkStatus)
			) {
				where.work_status = workStatus;
			}
			if (thematicArea) where.thematic_area = thematicArea;
			if (search) {
				where.OR = [
					{ name: { contains: search } },
					{ description: { contains: search } },
				];
			}

			const grants = await prisma.grant.findMany({
				where,
				orderBy: [{ submission_deadline: "asc" }, { created_at: "desc" }],
				include: {
					responsible_user: { select: userSelect() },
					last_verified_by_user: { select: userSelect() },
					created_by_user: { select: userSelect() },
					recruitments: {
						where: hasRecruitment === "open" ? { status: "open" } : undefined,
						orderBy: { created_at: "desc" },
						include: {
							created_by_user: { select: userSelect() },
						},
					},
				},
			});

			const isMember = await isGrantTeamMember(user.id);

			res.json({
				grants: grants.map(mapGrant),
				total: grants.length,
				canManage: isMember,
			});
		} catch (error) {
			logger.error("[GRANTS-LIST] Błąd:", error);
			res.status(500).json({ error: "Nie udało się pobrać grantów" });
		}
	},
);

/* GET /grants/:id */
router.get(
	"/grants/:id",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const user = req.user;
			if (!user?.id) return res.status(401).json({ error: "Brak autoryzacji" });
			const id = parseInt(String(req.params.id));
			if (isNaN(id)) return res.status(400).json({ error: "Złe ID" });

			const grant = await prisma.grant.findUnique({
				where: { id },
				include: {
					responsible_user: { select: userSelect() },
					last_verified_by_user: { select: userSelect() },
					created_by_user: { select: userSelect() },
					recruitments: {
						orderBy: { created_at: "desc" },
						include: {
							created_by_user: { select: userSelect() },
						},
					},
				},
			});

			if (!grant)
				return res.status(404).json({ error: "Nie znaleziono grantu" });
			const isMember = await isGrantTeamMember(user.id);
			res.json({ grant: mapGrant(grant), canManage: isMember });
		} catch (error) {
			logger.error("[GRANTS-DETAIL] Błąd:", error);
			res.status(500).json({ error: "Nie udało się pobrać grantu" });
		}
	},
);

/* POST /grants */
router.post(
	"/grants",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const user = req.user;
			if (!user?.id) return res.status(401).json({ error: "Brak autoryzacji" });
			if (!(await isGrantTeamMember(user.id))) {
				return res.status(403).json({
					error: "Tylko członkowie zespołu grantowego mogą dodawać granty",
				});
			}

			const b = req.body ?? {};
			if (!b.name?.trim()) {
				return res.status(400).json({ error: "Nazwa grantu jest wymagana" });
			}
			if (
				b.category &&
				!GRANT_CATEGORIES.includes(b.category as GrantCategory)
			) {
				return res.status(400).json({ error: "Nieprawidłowa kategoria" });
			}
			if (
				b.workStatus &&
				!GRANT_WORK_STATUSES.includes(b.workStatus as GrantWorkStatus)
			) {
				return res.status(400).json({ error: "Nieprawidłowy status pracy" });
			}

			const created = await prisma.grant.create({
				data: {
					name: b.name.trim(),
					description: b.description?.trim() || null,
					category: b.category || "current",
					work_status: b.workStatus || "analyzed",
					amount_min:
						b.amountMin != null && b.amountMin !== ""
							? Number(b.amountMin)
							: null,
					amount_max:
						b.amountMax != null && b.amountMax !== ""
							? Number(b.amountMax)
							: null,
					submission_deadline: b.submissionDeadline
						? new Date(b.submissionDeadline)
						: null,
					project_start_date: b.projectStartDate
						? new Date(b.projectStartDate)
						: null,
					project_end_date: b.projectEndDate
						? new Date(b.projectEndDate)
						: null,
					website_url: b.websiteUrl?.trim() || null,
					regulations_url: b.regulationsUrl?.trim() || null,
					application_form_url: b.applicationFormUrl?.trim() || null,
					thematic_area: b.thematicArea?.trim() || null,
					requirements: b.requirements?.trim() || null,
					own_contribution: b.ownContribution?.trim() || null,
					eligible_costs: b.eligibleCosts?.trim() || null,
					target_group: b.targetGroup?.trim() || null,
					eligible_applicants: b.eligibleApplicants?.trim() || null,
					required_partners: b.requiredPartners?.trim() || null,
					required_documents: b.requiredDocuments?.trim() || null,
					project_results: b.projectResults?.trim() || null,
					responsible_user_id: b.responsibleUserId
						? parseInt(String(b.responsibleUserId))
						: null,
					created_by: user.id,
				},
				include: {
					responsible_user: { select: userSelect() },
					last_verified_by_user: { select: userSelect() },
					created_by_user: { select: userSelect() },
					recruitments: {
						include: { created_by_user: { select: userSelect() } },
					},
				},
			});

			res.status(201).json({ grant: mapGrant(created) });
		} catch (error) {
			logger.error("[GRANTS-CREATE] Błąd:", error);
			res.status(500).json({ error: "Nie udało się dodać grantu" });
		}
	},
);

/* PUT /grants/:id */
router.put(
	"/grants/:id",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const user = req.user;
			if (!user?.id) return res.status(401).json({ error: "Brak autoryzacji" });
			if (!(await isGrantTeamMember(user.id))) {
				return res.status(403).json({
					error: "Tylko członkowie zespołu grantowego mogą edytować granty",
				});
			}

			const id = parseInt(String(req.params.id));
			if (isNaN(id)) return res.status(400).json({ error: "Złe ID" });

			const existing = await prisma.grant.findUnique({ where: { id } });
			if (!existing)
				return res.status(404).json({ error: "Nie znaleziono grantu" });

			const b = req.body ?? {};
			const data: any = {};
			if (b.name !== undefined) data.name = b.name.trim();
			if (b.description !== undefined)
				data.description = b.description?.trim() || null;
			if (b.category !== undefined) {
				if (!GRANT_CATEGORIES.includes(b.category as GrantCategory)) {
					return res.status(400).json({ error: "Nieprawidłowa kategoria" });
				}
				data.category = b.category;
			}
			if (b.workStatus !== undefined) {
				if (!GRANT_WORK_STATUSES.includes(b.workStatus as GrantWorkStatus)) {
					return res.status(400).json({ error: "Nieprawidłowy status pracy" });
				}
				data.work_status = b.workStatus;
			}
			if (b.amountMin !== undefined)
				data.amount_min =
					b.amountMin != null && b.amountMin !== ""
						? Number(b.amountMin)
						: null;
			if (b.amountMax !== undefined)
				data.amount_max =
					b.amountMax != null && b.amountMax !== ""
						? Number(b.amountMax)
						: null;
			if (b.submissionDeadline !== undefined)
				data.submission_deadline = b.submissionDeadline
					? new Date(b.submissionDeadline)
					: null;
			if (b.projectStartDate !== undefined)
				data.project_start_date = b.projectStartDate
					? new Date(b.projectStartDate)
					: null;
			if (b.projectEndDate !== undefined)
				data.project_end_date = b.projectEndDate
					? new Date(b.projectEndDate)
					: null;
			if (b.websiteUrl !== undefined)
				data.website_url = b.websiteUrl?.trim() || null;
			if (b.regulationsUrl !== undefined)
				data.regulations_url = b.regulationsUrl?.trim() || null;
			if (b.applicationFormUrl !== undefined)
				data.application_form_url = b.applicationFormUrl?.trim() || null;
			if (b.thematicArea !== undefined)
				data.thematic_area = b.thematicArea?.trim() || null;
			if (b.requirements !== undefined)
				data.requirements = b.requirements?.trim() || null;
			if (b.ownContribution !== undefined)
				data.own_contribution = b.ownContribution?.trim() || null;
			if (b.eligibleCosts !== undefined)
				data.eligible_costs = b.eligibleCosts?.trim() || null;
			if (b.targetGroup !== undefined)
				data.target_group = b.targetGroup?.trim() || null;
			if (b.eligibleApplicants !== undefined)
				data.eligible_applicants = b.eligibleApplicants?.trim() || null;
			if (b.requiredPartners !== undefined)
				data.required_partners = b.requiredPartners?.trim() || null;
			if (b.requiredDocuments !== undefined)
				data.required_documents = b.requiredDocuments?.trim() || null;
			if (b.projectResults !== undefined)
				data.project_results = b.projectResults?.trim() || null;
			if (b.responsibleUserId !== undefined)
				data.responsible_user_id = b.responsibleUserId
					? parseInt(String(b.responsibleUserId))
					: null;
			if (b.markVerified === true) {
				data.last_verified_at = new Date();
				data.last_verified_by = user.id;
			}

			const updated = await prisma.grant.update({
				where: { id },
				data,
				include: {
					responsible_user: { select: userSelect() },
					last_verified_by_user: { select: userSelect() },
					created_by_user: { select: userSelect() },
					recruitments: {
						include: { created_by_user: { select: userSelect() } },
					},
				},
			});

			res.json({ grant: mapGrant(updated) });
		} catch (error) {
			logger.error("[GRANTS-UPDATE] Błąd:", error);
			res.status(500).json({ error: "Nie udało się zapisać grantu" });
		}
	},
);

/* DELETE /grants/:id */
router.delete(
	"/grants/:id",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const user = req.user;
			if (!user?.id) return res.status(401).json({ error: "Brak autoryzacji" });
			if (!(await isGrantTeamMember(user.id))) {
				return res.status(403).json({
					error: "Tylko członkowie zespołu grantowego mogą usuwać granty",
				});
			}
			const id = parseInt(String(req.params.id));
			if (isNaN(id)) return res.status(400).json({ error: "Złe ID" });
			await prisma.grant.delete({ where: { id } });
			res.json({ success: true });
		} catch (error) {
			logger.error("[GRANTS-DELETE] Błąd:", error);
			res.status(500).json({ error: "Nie udało się usunąć grantu" });
		}
	},
);

/* POST /grants/:grantId/recruitments */
router.post(
	"/grants/:grantId/recruitments",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const user = req.user;
			if (!user?.id) return res.status(401).json({ error: "Brak autoryzacji" });
			if (!(await isGrantTeamMember(user.id))) {
				return res.status(403).json({
					error: "Tylko członkowie zespołu grantowego mogą dodawać rekrutacje",
				});
			}
			const grantId = parseInt(String(req.params.grantId));
			if (isNaN(grantId))
				return res.status(400).json({ error: "Złe ID grantu" });

			const b = req.body ?? {};
			if (!b.projectTitle?.trim()) {
				return res.status(400).json({ error: "Nazwa projektu jest wymagana" });
			}
			if (
				b.status &&
				!RECRUITMENT_STATUSES.includes(b.status as RecruitmentStatus)
			) {
				return res.status(400).json({ error: "Nieprawidłowy status" });
			}

			const grant = await prisma.grant.findUnique({ where: { id: grantId } });
			if (!grant) return res.status(404).json({ error: "Grant nie istnieje" });

			const created = await prisma.grantRecruitment.create({
				data: {
					grant_id: grantId,
					project_title: b.projectTitle.trim(),
					project_description: b.projectDescription?.trim() || null,
					responsibilities: b.responsibilities?.trim() || null,
					required_skills: b.requiredSkills?.trim() || null,
					deadline: b.deadline ? new Date(b.deadline) : null,
					form_url: b.formUrl?.trim() || null,
					status: b.status || "preparing",
					created_by: user.id,
				},
				include: { created_by_user: { select: userSelect() } },
			});

			res.status(201).json({ recruitment: mapRecruitment(created) });
		} catch (error) {
			logger.error("[RECRUITMENTS-CREATE] Błąd:", error);
			res.status(500).json({ error: "Nie udało się dodać rekrutacji" });
		}
	},
);

/* PUT /grants/:grantId/recruitments/:id */
router.put(
	"/grants/:grantId/recruitments/:id",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const user = req.user;
			if (!user?.id) return res.status(401).json({ error: "Brak autoryzacji" });
			if (!(await isGrantTeamMember(user.id))) {
				return res.status(403).json({
					error: "Tylko członkowie zespołu grantowego mogą edytować rekrutacje",
				});
			}
			const id = parseInt(String(req.params.id));
			if (isNaN(id)) return res.status(400).json({ error: "Złe ID" });

			const b = req.body ?? {};
			const data: any = {};
			if (b.projectTitle !== undefined)
				data.project_title = b.projectTitle.trim();
			if (b.projectDescription !== undefined)
				data.project_description = b.projectDescription?.trim() || null;
			if (b.responsibilities !== undefined)
				data.responsibilities = b.responsibilities?.trim() || null;
			if (b.requiredSkills !== undefined)
				data.required_skills = b.requiredSkills?.trim() || null;
			if (b.deadline !== undefined)
				data.deadline = b.deadline ? new Date(b.deadline) : null;
			if (b.formUrl !== undefined) data.form_url = b.formUrl?.trim() || null;
			if (b.status !== undefined) {
				if (!RECRUITMENT_STATUSES.includes(b.status as RecruitmentStatus)) {
					return res.status(400).json({ error: "Nieprawidłowy status" });
				}
				data.status = b.status;
			}

			const updated = await prisma.grantRecruitment.update({
				where: { id },
				data,
				include: { created_by_user: { select: userSelect() } },
			});

			res.json({ recruitment: mapRecruitment(updated) });
		} catch (error) {
			logger.error("[RECRUITMENTS-UPDATE] Błąd:", error);
			res.status(500).json({ error: "Nie udało się zapisać rekrutacji" });
		}
	},
);

/* DELETE /grants/:grantId/recruitments/:id */
router.delete(
	"/grants/:grantId/recruitments/:id",
	authMiddleware,
	async (req: AuthRequest, res: Response) => {
		try {
			const user = req.user;
			if (!user?.id) return res.status(401).json({ error: "Brak autoryzacji" });
			if (!(await isGrantTeamMember(user.id))) {
				return res.status(403).json({
					error: "Tylko członkowie zespołu grantowego mogą usuwać rekrutacje",
				});
			}
			const id = parseInt(String(req.params.id));
			if (isNaN(id)) return res.status(400).json({ error: "Złe ID" });
			await prisma.grantRecruitment.delete({ where: { id } });
			res.json({ success: true });
		} catch (error) {
			logger.error("[RECRUITMENTS-DELETE] Błąd:", error);
			res.status(500).json({ error: "Nie udało się usunąć rekrutacji" });
		}
	},
);

export default router;
