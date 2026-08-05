import express from "express";
import cors from "cors";
import { OAuth2Client } from "google-auth-library";
import { PrismaClient } from "@prisma/client";
import { ProjectController } from "./controllers/project.controller";
import { UserController } from "./controllers/user.controller";
import { authMiddleware } from "./middleware/auth.middleware";
import mysql from "mysql2/promise";
import memberRoutes from "./routes/member.routes";
import contributionRoutes from "./routes/contribution.routes";
import { syncContributions } from "./jobs/syncContributions";
import { syncAttendance } from "./jobs/syncAttendance";
import cron from "node-cron";
import dashboardRoutes from "./routes/dashboard.routes";
import { updateLeaveStatus } from "./jobs/updateLeaveStatus";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import multer from "multer";
import { logger } from "./utils/logger";
import { syncMembers } from "./jobs/syncMembers";

updateLeaveStatus();

cron.schedule("0 7,14,21 * * *", async () => {
	// 	logger.debug("🔄 [CRON] Uruchamiam synchronizację frekwencji...");
	try {
		await syncAttendance();
		// 		logger.debug("✅ [CRON] Synchronizacja frekwencji zakończona");
	} catch (error) {
		// 		logger.error("❌ [CRON] Błąd synchronizacji frekwencji:", error);
	}
});

cron.schedule("1 0 * * *", async () => {
	// 	logger.debug("⏰ [CRON] Uruchamiam codzienny job aktualizacji statusów...");
	await updateLeaveStatus();
});
const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);
cron.schedule("0 3 */2 * *", async () => {
	// 	logger.debug(
	// 	"🔄 [CRON] Uruchamiam synchronizację członków z SM_Ewidencja...",
	// );
	await syncMembers();
	// 	logger.debug("✅ [CRON] Synchronizacja członków zakończona");
});
const PUBLIC_ENDPOINTS = [
	"/api/auth/login",
	"/api/auth/google",
	"/api/auth/register",
	"/api/auth/refresh-token",
	"/api/auth/forgot-password",
	"/api/auth/reset-password",
	"/api/health",
	"/api/status",
	"/uploads",
];
const tasksUploadDir = path.join(__dirname, "uploads/tasks");
if (!fs.existsSync(tasksUploadDir)) {
	fs.mkdirSync(tasksUploadDir, { recursive: true });
}

const tasksStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, tasksUploadDir);
	},
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);
		const uniqueName = `${generateId()}${ext}`;
		cb(null, uniqueName);
	},
});

const tasksUpload = multer({
	storage: tasksStorage,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB
	},
});
type LogActionType =
	| "CREATE"
	| "UPDATE"
	| "DELETE"
	| "LOGIN"
	| "LOGOUT"
	| "APPROVE"
	| "REJECT";
type LogCategory =
	| "USER"
	| "TEAM"
	| "LEAVE"
	| "PROJECT"
	| "VACANCY"
	| "TUTORIAL"
	| "SOCIAL_MEDIA"
	| "PERMISSION"
	| "STRUCTURE"
	| "NOTIFICATION"
	| "AUTH";

function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET =
	process.env.JWT_SECRET || "your-secret-key-here-change-in-production";

const prisma = new PrismaClient();

// Dodaj na początku pliku, przed innymi routami
app.get("/api/health", (req, res) => {
	res.status(200).json({
		status: "ok",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	});
});
app.use(
	cors({
		origin: "*",
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true,
		maxAge: 3600,
	}),
);

app.use((_req, res, next) => {
	res.setHeader("X-Frame-Options", "DENY");

	res.setHeader("X-Content-Type-Options", "nosniff");

	res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

	next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/auth/google", async (req, res) => {
	try {
		// 		logger.debug("=== GOOGLE AUTH START ===");
		const { credential } = req.body;

		if (!credential) {
			// 			logger.debug("❌ Brak credential");
			return res.status(401).json({
				error: "Brak tokenu autoryzacyjnego",
			});
		}

		const ticket = await googleClient.verifyIdToken({
			idToken: credential,
			audience: process.env.VITE_GOOGLE_CLIENT_ID,
		});

		const payload = ticket.getPayload();

		if (!payload?.email) {
			return res.status(400).json({
				error: "Nie udało się pobrać danych Google",
			});
		}

		// 		logger.debug("📧 Email z Google:", payload.email);

		const user = await prisma.user.findUnique({
			where: { email: payload.email },
		});

		if (!user) {
			// 			logger.debug(`❌ Użytkownik ${payload.email} nie istnieje w systemie`);
			return res.status(403).json({
				error:
					"To konto Google nie jest zarejestrowane w systemie Siły Młodych. Użyj innego.",
			});
		}

		// 		logger.debug(
		// 	`✅ Znaleziono użytkownika: ${user.first_name} ${user.last_name}`,
		// );

		const token = jwt.sign(
			{
				id: user.id,
				email: user.email,
				role: mapRoleId(user.role_id),
				first_name: user.first_name,
				last_name: user.last_name,
			},
			JWT_SECRET,
			{ expiresIn: "24h" },
		);

		const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
			expiresIn: "7d",
		});

		res.json({
			accessToken: token,
			refreshToken: refreshToken,
			user: {
				id: user.id,
				email: user.email,
				first_name: user.first_name,
				last_name: user.last_name,
				role: mapRoleId(user.role_id),
				team: user.team,
				status: user.status,
			},
			onboardingCompleted: true,
		});
	} catch (error) {
		// 		logger.error("❌ Google OAuth error:", error);
		res.status(500).json({
			error: "Błąd logowania Google",
		});
	}
});

const uploadDir = path.join(__dirname, "uploads/tutorials");
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

function getEntityName(body: any): string | null {
	if (!body) return null;

	if (body.id && body.success) {
		return `Usunięto ${body.id}`;
	}
	if (body.id && body.message && body.message.includes("usunięty")) {
		return body.message;
	}

	if (body.name) return body.name;
	if (body.title) return body.title;
	if (body.first_name && body.last_name)
		return `${body.first_name} ${body.last_name}`;
	if (body.userName) return body.userName;
	if (body.email) return body.email;
	if (body.message) {
		const match = body.message.match(/Urlop (.*?) \(/);
		if (match) return match[1];
		return body.message;
	}

	return null;
}

function getEntityId(body: any): string | null {
	if (!body) return null;
	if (body.id) return body.id.toString();
	if (body.data?.id) return body.data.id.toString();
	if (body.leave?.id) return body.leave.id.toString();
	if (body.user?.id) return body.user.id.toString();
	if (body.team?.id) return body.team.id.toString();
	return null;
}

function getCategoryFromUrl(url: string): LogCategory {
	if (url.includes("/api/admin/teams")) return "TEAM";
	if (url.includes("/api/admin/roles")) return "PERMISSION";
	if (url.includes("/api/admin/team-members")) return "TEAM";
	if (url.includes("/api/leaves")) return "LEAVE";
	if (url.includes("/api/tutorials")) return "TUTORIAL";
	if (url.includes("/api/social")) return "SOCIAL_MEDIA";
	if (url.includes("/api/vacancies")) return "VACANCY";
	if (url.includes("/api/projects")) return "PROJECT";
	if (url.includes("/api/profile")) return "USER";
	if (url.includes("/api/auth/login")) return "AUTH";
	if (url.includes("/api/auth/register")) return "AUTH";
	if (url.includes("/api/ideas")) return "PROJECT";
	return "STRUCTURE";
}

async function logAction(
	req: any,
	actionType: LogActionType,
	category: LogCategory,
	entityId: string | null = null,
	entityName: string | null = null,
	changes: any = null,
	status: string = "success",
	errorMessage: string | null = null,
) {
	try {
		// 		logger.debug(
		// 	`🔍 [logAction] START - ${actionType} ${category} ${entityName || "unknown"}`,
		// );

		if (!prisma.systemLog) {
			// 			logger.warn("⚠️ [logAction] Model systemLog nie istnieje w Prisma!");
			return;
		}

		const userId = req.user?.id || 0;
		const userName =
			req.user?.first_name && req.user?.last_name
				? `${req.user.first_name} ${req.user.last_name}`
				: req.user?.email || "System";
		const userRole = req.user?.role || "unknown";

		// 		logger.debug(
		// 	`🔍 [logAction] Dane: userId=${userId}, userName=${userName}, userRole=${userRole}`,
		// );

		const ipAddress =
			req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null;
		const userAgent = req.headers["user-agent"] || null;

		const data = {
			user_id: userId,
			user_name: userName,
			user_role: userRole,
			action_type: actionType,
			category: category,
			endpoint: req.originalUrl || req.url || "/",
			method: req.method || "UNKNOWN",
			entity_id: entityId,
			entity_name: entityName,
			changes: changes,
			ip_address: typeof ipAddress === "string" ? ipAddress : null,
			user_agent: userAgent,
			status: status,
			error_message: errorMessage,
		};

		// 		logger.debug(
		// 	`🔍 [logAction] Dane do zapisu:`,
		// 	JSON.stringify(data, null, 2),
		// );

		const result = await prisma.systemLog.create({
			data: data,
		});

		// 		logger.debug(`✅ [logAction] Zapisano log ID: ${result.id}`);
	} catch (error) {
		// 		logger.error("❌ [logAction] Błąd zapisu loga:", error);
		// 		logger.error(
		// 	"❌ [logAction] Stack:",
		// 	error instanceof Error ? error.stack : "No stack",
		// );
	}
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);
		const uniqueName = `${generateId()}${ext}`;
		cb(null, uniqueName);
	},
});

const fileFilter = (req: any, file: any, cb: any) => {
	const allowedTypes = [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.ms-powerpoint",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
		"text/plain",
		"text/csv",
		"application/zip",
	];

	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error(`Niedozwolony typ pliku: ${file.mimetype}`), false);
	}
};

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 10 * 1024 * 1024,
		files: 5,
	},
	fileFilter: fileFilter,
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
	"/uploads/tasks",
	express.static(path.join(__dirname, "uploads/tasks")),
);

app.use(async (req: any, res: any, next: any) => {
	const publicPaths = [
		"/api/auth/google",
		"/api/auth/login",
		"/api/auth/register",
		"/api/auth/refresh-token",
	];
	if (publicPaths.some((p) => req.path === p || req.path.startsWith(p))) {
		// logger.debug(
		// 	`🔓 [MIDDLEWARE] Pomijam publiczny endpoint: ${req.method} ${req.path}`,
		// );
		return next();
	}

	// logger.debug(`🔍 [MIDDLEWARE] ${req.method} ${req.originalUrl}`);

	const originalJson = res.json;
	const originalStatus = res.status;
	const originalSend = res.send;

	let statusCode = 200;
	let responseBody: any = null;
	let hasLogged = false;
	let responseSent = false;

	res.status = function (code: number) {
		// logger.debug(`🔍 [MIDDLEWARE] res.status: ${code}`);
		statusCode = code;
		return originalStatus.call(this, code);
	};

	res.json = function (body: any) {
		// logger.debug(`🔍 [MIDDLEWARE] res.json wywołane`);
		// logger.debug(`🔍 [MIDDLEWARE] body:`, body);
		responseBody = body;
		responseSent = true;

		const method = req.method;
		const isWriteOperation = ["POST", "PUT", "DELETE", "PATCH"].includes(
			method,
		);

		// logger.debug(
		// 	`🔍 [MIDDLEWARE] method: ${method}, isWriteOperation: ${isWriteOperation}, hasLogged: ${hasLogged}`,
		// );

		if (isWriteOperation && !hasLogged) {
			hasLogged = true;
			// logger.debug(`🔍 [MIDDLEWARE] LOGUJĘ!`);

			let actionType: LogActionType = "CREATE";
			if (method === "PUT" || method === "PATCH") actionType = "UPDATE";
			if (method === "DELETE") actionType = "DELETE";

			const category = getCategoryFromUrl(req.originalUrl || req.url || "");
			const entityId = getEntityId(responseBody);
			const entityName = getEntityName(responseBody);

			// logger.debug(
			// 	`🔍 [MIDDLEWARE] actionType: ${actionType}, category: ${category}, entityId: ${entityId}, entityName: ${entityName}`,
			// );

			let changes = null;
			if (method === "POST" || method === "PUT" || method === "PATCH") {
				changes = { ...req.body };
				delete changes.password;
				delete changes.password_hash;
				delete changes.token;
			}

			const logStatus = statusCode < 400 ? "success" : "error";
			const errorMessage = statusCode >= 400 ? `Status ${statusCode}` : null;

			// logger.debug(`🔍 [MIDDLEWARE] Wywołuję logAction...`);
			logAction(
				req,
				actionType,
				category,
				entityId || null,
				entityName || "unknown",
				changes,
				logStatus,
				errorMessage,
			).catch((err) => logger.error("❌ [MIDDLEWARE] Błąd logowania:", err));
		}

		return originalJson.call(this, body);
	};

	res.send = function (body: any) {
		// logger.debug(`🔍 [MIDDLEWARE] res.send wywołane`);
		if (!responseSent) {
			responseBody = body;
			responseSent = true;
		}
		return originalSend.call(this, body);
	};

	next();
});

function mapRoleId(roleId: number | null): string {
	const roleMap: Record<number, string> = {
		1: "admin",
		2: "board",
		3: "coordinator",
		4: "member",
	};
	return roleMap[roleId || 4] || "member";
}

function formatTimeAgo(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMin = Math.floor(diffMs / 60000);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);

	if (diffMin < 1) return "przed chwilą";
	if (diffMin < 60) return `${diffMin} min temu`;
	if (diffHour < 24) return `${diffHour} godz. temu`;
	if (diffDay === 1) return "1 dzień temu";
	if (diffDay < 7) return `${diffDay} dni temu`;
	return date.toLocaleDateString("pl-PL");
}

function getIconForTeam(name: string): string {
	const iconMap: Record<string, string> = {
		Zarząd: "UserCog",
		"Filar Projektowy": "Briefcase",
		"Filar Konferencyjny": "Megaphone",
		"Filar Rzeczniczy": "Megaphone",
		"Filar Symulacyjny": "GraduationCap",
		"Komisja Rewizyjna": "Building2",
		"Sąd Koleżeński": "Building2",
	};
	return iconMap[name] || "Users";
}

const projectController = new ProjectController();
const userController = new UserController();

app.post("/api/auth/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ error: "Email i hasło są wymagane" });
		}

		const user = await prisma.user.findUnique({
			where: { email: email },
		});

		if (!user) {
			return res.status(401).json({ error: "Nieprawidłowy email lub hasło" });
		}

		const isPasswordValid = await bcrypt.compare(password, user.password_hash);
		if (!isPasswordValid) {
			return res.status(401).json({ error: "Nieprawidłowy email lub hasło" });
		}

		const token = jwt.sign(
			{
				id: user.id,
				email: user.email,
				role: mapRoleId(user.role_id),
				first_name: user.first_name,
				last_name: user.last_name,
			},
			JWT_SECRET,
			{ expiresIn: "24h" },
		);

		const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
			expiresIn: "7d",
		});

		res.json({
			accessToken: token,
			refreshToken: refreshToken,
			user: {
				id: user.id,
				email: user.email,
				first_name: user.first_name,
				last_name: user.last_name,
				role: mapRoleId(user.role_id),
				team: user.team,
				status: user.status,
			},
			onboardingCompleted: true,
		});
	} catch (error) {
		// 		logger.error("❌ Błąd logowania:", error);
		res.status(500).json({ error: "Wystąpił błąd podczas logowania" });
	}
});

app.post("/api/auth/register", async (req, res) => {
	try {
		const { email, password, first_name, last_name, username } = req.body;

		if (!email || !password || !first_name || !last_name) {
			return res.status(400).json({ error: "Wszystkie pola są wymagane" });
		}

		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [{ email: email }, { username: username }],
			},
		});

		if (existingUser) {
			return res
				.status(400)
				.json({ error: "Użytkownik o podanym email lub nazwie już istnieje" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = await prisma.user.create({
			data: {
				username: username || email.split("@")[0],
				email: email,
				password_hash: hashedPassword,
				first_name: first_name,
				last_name: last_name,
				role_id: 4,
				status: "active",
				is_active: true,
			},
		});

		res.status(201).json({
			message: "Użytkownik utworzony pomyślnie",
			user: {
				id: user.id,
				email: user.email,
				first_name: user.first_name,
				last_name: user.last_name,
				role: mapRoleId(user.role_id),
			},
		});
	} catch (error) {
		// 		logger.error("❌ Błąd rejestracji:", error);
		res.status(500).json({ error: "Wystąpił błąd podczas rejestracji" });
	}
});

app.get(
	"/api/auth/onboarding-status",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({ error: "Brak autoryzacji" });
			}

			// logger.debug(`🔍 Sprawdzam onboarding dla użytkownika ${userId}`);
			// logger.debug(`👤 Rola użytkownika: ${req.user?.role}`);

			if (req.user?.role === "admin") {
				// 				logger.debug(`👑 Admin ${userId} - pomijam onboarding, zwracam true`);
				return res.json({ completed: true });
			}

			const onboarding = await prisma.onboarding_data.findFirst({
				where: { user_id: userId },
				orderBy: { created_at: "desc" },
			});

			if (!onboarding) {
				// 				logger.debug(`📋 Użytkownik ${userId} NIE ma onboardingu`);
				return res.json({ completed: false });
			}

			const isCompleted = !!onboarding.completed;

			// 			logger.debug(`📋 Użytkownik ${userId} - completed: ${isCompleted}`);
			// 			logger.debug(`   - wartość w bazie: ${onboarding.completed}`);
			// 			logger.debug(`   - typ: ${typeof onboarding.completed}`);

			res.json({ completed: isCompleted });
		} catch (error) {
			// 			logger.error("❌ Błąd sprawdzania onboardingu:", error);
			res.json({ completed: false });
		}
	},
);

app.get("/api/ideas", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;

		const ideas = await prisma.idea.findMany({
			where: { is_active: true },
			include: {
				votes: true,
			},
			orderBy: { created_at: "desc" },
		});

		const mappedIdeas = ideas.map((idea: any) => {
			const upvotes = idea.votes.filter(
				(v: any) => v.vote_type === "up",
			).length;
			const downvotes = idea.votes.filter(
				(v: any) => v.vote_type === "down",
			).length;

			const userVote = userId
				? idea.votes.find((v: any) => v.user_id === userId)
				: null;

			return {
				id: idea.id.toString(),
				title: idea.title,
				description: idea.description,
				pillar: idea.pillar,
				author_id: idea.author_id,
				author_name: idea.author_name,
				status: idea.status,
				upvotes: upvotes,
				downvotes: downvotes,
				votes: upvotes - downvotes,
				created_at: idea.created_at,
				updated_at: idea.updated_at,
				user_vote: userVote ? userVote.vote_type : null,
			};
		});

		res.json(mappedIdeas);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania pomysłów:", error);
		res.status(500).json({ error: "Nie udało się pobrać pomysłów" });
	}
});

app.post("/api/ideas", authMiddleware, async (req: any, res) => {
	try {
		const { title, description, pillar, authorId, authorName } = req.body;
		const userId = req.user?.id;

		// 		logger.debug("📥 Otrzymano pomysł:", {
		// 	title,
		// 	description,
		// 	pillar,
		// 	authorId,
		// 	authorName,
		// });

		if (!title || !description || !pillar) {
			return res.status(400).json({ error: "Wszystkie pola są wymagane" });
		}

		const idea = await prisma.idea.create({
			data: {
				title,
				description,
				pillar,
				author_id: parseInt(authorId) || userId,
				author_name:
					authorName ||
					req.user?.first_name + " " + req.user?.last_name ||
					"Nieznany",
				status: "pending",
				is_active: true,
			},
		});

		// 		logger.debug("✅ Utworzono pomysł w bazie:", idea);

		try {
			await prisma.ideaVote.create({
				data: {
					idea_id: idea.id,
					user_id: parseInt(authorId) || userId,
					vote_type: "up",
				},
			});
			// 			logger.debug(`⬆️ Automatyczny głos UP od autora (user ${userId})`);
		} catch (voteError) {
			// 			logger.warn("⚠️ Nie udało się dodać automatycznego głosu:", voteError);
		}

		const voteCounts = await getVoteCounts(idea.id);

		res.status(201).json({
			id: idea.id.toString(),
			title: idea.title,
			description: idea.description,
			pillar: idea.pillar,
			author_id: idea.author_id,
			author_name: idea.author_name,
			status: idea.status,
			votes: voteCounts.total || 0,
			upvotes: voteCounts.upvotes || 0,
			downvotes: voteCounts.downvotes || 0,
			created_at: idea.created_at,
			updated_at: idea.updated_at,
			user_vote: "up",
		});
	} catch (error) {
		// 		logger.error("❌ Błąd dodawania pomysłu:", error);
		res.status(500).json({
			error: "Nie udało się dodać pomysłu",
			details: error instanceof Error ? error.message : "Nieznany błąd",
		});
	}
});
// server.ts - dodaj endpoint do pobierania plików z zadań
// server.ts - dodaj gdzieś przed app.listen()
app.get("/uploads/tasks/:filename", authMiddleware, async (req: any, res) => {
	try {
		// 🔥 DEKODUJ NAZWĘ PLIKU
		const filename = decodeURIComponent(req.params.filename);
		const filePath = path.join(__dirname, "uploads/tasks", filename);

		console.log("📁 [DOWNLOAD] Szukam pliku:", filePath);

		if (!fs.existsSync(filePath)) {
			// 🔥 SPRÓBUJ Z NAPRAWIONĄ NAZWĄ (usuń znaki specjalne)
			const cleanFilename = filename
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "");
			const cleanPath = path.join(__dirname, "uploads/tasks", cleanFilename);

			if (fs.existsSync(cleanPath)) {
				return res.sendFile(cleanPath);
			}

			console.log("❌ [DOWNLOAD] Plik nie istnieje:", filePath);
			return res.status(404).json({ error: "Nie znaleziono pliku" });
		}

		const mimeType = getMimeType(filename);

		// 🔥 USTAW POPRAWNE NAGŁÓWKI
		res.setHeader("Content-Type", mimeType);
		res.setHeader(
			"Content-Disposition",
			`attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
		);

		res.sendFile(filePath);
	} catch (error) {
		console.error("❌ [DOWNLOAD] Błąd:", error);
		res.status(500).json({ error: "Nie udało się pobrać pliku" });
	}
});
app.post("/api/ideas/:id/vote", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const userId = req.user?.id;
		const { type } = req.body;

		if (!userId) {
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		const idea = await prisma.idea.findUnique({
			where: { id: parseInt(id) },
		});

		if (!idea) {
			return res.status(404).json({ error: "Nie znaleziono pomysłu" });
		}

		if (idea.author_id === userId) {
			return res.status(403).json({
				error: "Nie możesz głosować na swój własny pomysł",
				votes: await getVoteCounts(parseInt(id)),
			});
		}

		const existingVote = await prisma.ideaVote.findUnique({
			where: {
				idea_id_user_id: {
					idea_id: parseInt(id),
					user_id: userId,
				},
			},
		});

		if (existingVote && existingVote.vote_type === type) {
			return res.json({
				message: "Już zagłosowałeś w ten sposób",
				votes: await getVoteCounts(parseInt(id)),
			});
		}

		if (existingVote) {
			await prisma.ideaVote.delete({
				where: {
					idea_id_user_id: {
						idea_id: parseInt(id),
						user_id: userId,
					},
				},
			});
		}

		await prisma.ideaVote.create({
			data: {
				idea_id: parseInt(id),
				user_id: userId,
				vote_type: type,
			},
		});

		const voteCounts = await getVoteCounts(parseInt(id));

		res.json({
			id: idea.id.toString(),
			votes: voteCounts,
		});
	} catch (error) {
		// 		logger.error("❌ Błąd głosowania:", error);
		res.status(500).json({
			error: "Nie udało się zagłosować",
			details: error instanceof Error ? error.message : "Nieznany błąd",
		});
	}
});

async function getVoteCounts(ideaId: number) {
	const votes = await prisma.ideaVote.findMany({
		where: { idea_id: ideaId },
	});

	const upvotes = votes.filter((v: any) => v.vote_type === "up").length;
	const downvotes = votes.filter((v: any) => v.vote_type === "down").length;

	return {
		upvotes: upvotes,
		downvotes: downvotes,
		total: upvotes - downvotes,
	};
}

app.put("/api/ideas/:id/status", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;
		const userRole = req.user?.role;

		if (userRole !== "admin" && userRole !== "coordinator") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		const idea = await prisma.idea.update({
			where: { id: parseInt(id) },
			data: { status },
		});

		res.json(idea);
	} catch (error) {
		// 		logger.error("❌ Błąd zmiany statusu:", error);
		res.status(500).json({ error: "Nie udało się zmienić statusu" });
	}
});

app.get("/api/ideas/:id", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;

		const idea = await prisma.idea.findUnique({
			where: { id: parseInt(id) },
			include: {
				votes: true,
			},
		});

		if (!idea) {
			return res.status(404).json({ error: "Nie znaleziono pomysłu" });
		}

		const upvotes = idea.votes.filter((v: any) => v.vote_type === "up").length;
		const downvotes = idea.votes.filter(
			(v: any) => v.vote_type === "down",
		).length;

		res.json({
			id: idea.id.toString(),
			title: idea.title,
			description: idea.description,
			pillar: idea.pillar,
			author_id: idea.author_id,
			author_name: idea.author_name,
			status: idea.status,
			upvotes: upvotes,
			downvotes: downvotes,
			votes: upvotes - downvotes,
			created_at: idea.created_at,
		});
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania pomysłu:", error);
		res.status(500).json({ error: "Nie udało się pobrać pomysłu" });
	}
});

app.get("/api/members", authMiddleware, async (req: any, res) => {
	try {
		const users = await prisma.user.findMany({
			where: {
				is_active: true,
			},
			include: {
				team_members: {
					include: {
						team: true,
					},
				},
				onboarding_data: { orderBy: { created_at: "desc" }, take: 1 },
				leaves: {
					where: {
						status: "approved",
					},
					select: {
						start_date: true,
						end_date: true,
						scope: true,
						affected_teams: true,
					},
				},
			},
		});

		const mappedUsers = users.map((user: any) => {
			const onboarding = user.onboarding_data?.[0] || {};

			const teams = user.team_members
				.map((tm: any) => tm.team?.name)
				.filter(Boolean);

			const teamString = teams.length > 0 ? teams.join(", ") : "Brak zespołu";

			// ============================================================
			// 🔥 POBRANIE FILARÓW Z POLA `pillars`
			// ============================================================
			const pillarList = user.pillars
				? user.pillars.split(", ").filter(Boolean)
				: [];
			const pillarString = pillarList.length > 0 ? pillarList.join(", ") : null;

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const activeLeave = user.leaves?.find((leave: any) => {
				const start = new Date(leave.start_date);
				const end = new Date(leave.end_date);
				start.setHours(0, 0, 0, 0);
				end.setHours(0, 0, 0, 0);
				return start <= today && end >= today;
			});

			return {
				id: user.id.toString(),
				first_name: user.first_name,
				last_name: user.last_name,
				email: user.email,
				phone: user.phone,
				province: user.province,
				status: user.status || "active",
				team: teamString,
				team_id: teams.length > 0 ? teams.join("-") : "",
				pillars: pillarString, // ← FILARY z SM_Frekwencja
				functional_role: user.functional_role || "Członek",
				join_date:
					user.join_date?.toISOString().split("T")[0] ||
					user.created_at.toISOString().split("T")[0],
				vacation: activeLeave
					? {
							startDate: activeLeave.start_date.toISOString().split("T")[0],
							endDate: activeLeave.end_date.toISOString().split("T")[0],
							type: activeLeave.scope === "team" ? "team" : "organization",
							teamId: activeLeave.affected_teams || undefined,
						}
					: null,
				onboarding_data: onboarding,
			};
		});

		res.json(mappedUsers);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania członków:", error);
		res.status(500).json({ error: "Nie udało się pobrać członków" });
	}
});

app.get("/api/projects", authMiddleware, projectController.getAllProjects);
app.get("/api/projects/:id", authMiddleware, projectController.getProjectById);
app.post("/api/projects", authMiddleware, projectController.createProject);
app.put("/api/projects/:id", authMiddleware, projectController.updateProject);
app.delete(
	"/api/projects/:id",
	authMiddleware,
	projectController.deleteProject,
);

app.get("/api/users", authMiddleware, userController.getAllUsers);

app.get("/api/teams", authMiddleware, async (req: any, res) => {
	try {
		const teams = await prisma.team.findMany({
			where: {
				status: "active",
			},
			select: {
				id: true,
				name: true,
			},
			orderBy: {
				name: "asc",
			},
		});

		res.json(teams);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania zespołów:", error);
		res.status(500).json({ error: "Nie udało się pobrać zespołów" });
	}
});

app.post("/api/teams", authMiddleware, async (req: any, res) => {
	try {
		const { name, role, description, icon, status, parent_id, email } =
			req.body;

		if (!name) {
			return res.status(400).json({ error: "Nazwa zespołu jest wymagana" });
		}

		// 		logger.debug("📥 Tworzenie zespołu - dane:", {
		// 	name,
		// 	role,
		// 	description,
		// 	icon,
		// 	status,
		// 	parent_id,
		// 	email,
		// });

		const team = await prisma.team.create({
			data: {
				name: name,
				role: role || "Zespół",
				description: description || null,
				icon: icon || "Users",
				status: status || "active",
				parent_id: parent_id ? parseInt(parent_id) : null,
				email: email || null,
			},
		});

		// 		logger.debug("✅ Utworzono zespół:", team);

		res.status(201).json(team);
	} catch (error) {
		// 		logger.error("❌ Błąd tworzenia zespołu:", error);
		res.status(500).json({ error: "Nie udało się utworzyć zespołu" });
	}
});

app.get("/api/dashboard/stats", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		const userEmail = req.user?.email;

		const totalMembers = await prisma.user.count({
			where: { is_active: true },
		});

		const totalProjects = await prisma.project.count({
			where: { is_active: 1 },
		});

		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const newGuides = await prisma.guide.count({
			where: {
				is_published: 1,
				created_at: { gte: sevenDaysAgo },
			},
		});

		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const announcements = await prisma.notification.count({
			where: {
				created_at: { gte: thirtyDaysAgo },
			},
		});

		let attendance = "0%";
		if (userEmail) {
			try {
				const connection = await mysql.createConnection({
					host: process.env.FREKWENCJA_DB_HOST || "57.128.253.89",
					user: process.env.FREKWENCJA_DB_USER || "czarnecki",
					password: process.env.FREKWENCJA_DB_PASSWORD || "",
					database: process.env.FREKWENCJA_DB_NAME || "SM_Frekwencja",
					port: 3306,
				});

				const [rows] = await connection.execute(
					`
					SELECT
						ROUND(
							SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)
							/
							COUNT(a.id)
							* 100,
							2
						) AS attendance_percentage
					FROM att_members m
					LEFT JOIN att_attendance a ON a.member_id = m.id
					WHERE m.email = ?
					GROUP BY m.id, m.email
					`,
					[userEmail],
				);

				await connection.end();

				const result = rows as Array<{ attendance_percentage: number }>;
				if (result.length > 0 && result[0].attendance_percentage !== null) {
					const value = Number(result[0].attendance_percentage);
					if (!isNaN(value)) {
						attendance = `${value.toFixed(1)}%`;
					}
				}
			} catch (dbError) {
				// 				logger.error("❌ Błąd pobierania frekwencji z SM_Frekwencja:", dbError);

				try {
					const user = await prisma.user.findUnique({
						where: { id: parseInt(userId) },
						select: { attendance_percentage: true },
					});
					if (
						user?.attendance_percentage !== null &&
						user?.attendance_percentage !== undefined
					) {
						attendance = `${Number(user.attendance_percentage).toFixed(1)}%`;
					}
				} catch (fallbackError) {
					// 					logger.error("❌ Błąd fallback frekwencji:", fallbackError);
				}
			}
		}

		res.json({
			members: totalMembers,
			projects: totalProjects,
			attendance: attendance,
			announcements: announcements,
			newGuides: newGuides,
		});
	} catch (error) {
		// 		logger.error("❌ Błąd statystyk:", error);
		res.status(500).json({ error: "Nie udało się pobrać statystyk" });
	}
});
app.get(
	"/api/dashboard/notifications/unread-count",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({ error: "Brak autoryzacji" });
			}

			const count = await prisma.notification.count({
				where: {
					user_id: userId,
					read: false,
				},
			});

			res.json({ count });
		} catch (error) {
			// 			logger.error("❌ Błąd liczenia nieprzeczytanych:", error);
			res.status(500).json({ error: "Nie udało się pobrać liczby" });
		}
	},
);
app.get(
	"/api/dashboard/notifications",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userId = req.user?.id;

			if (!userId) {
				return res.status(401).json({ error: "Brak autoryzacji" });
			}

			const limit = parseInt(req.query.limit as string) || 20;

			const notifications = await prisma.notification.findMany({
				where: { user_id: userId },
				orderBy: { created_at: "desc" },
				take: limit,
			});

			// 			logger.debug(
			// 	`📨 Znaleziono ${notifications.length} powiadomień dla użytkownika ${userId}`,
			// );

			const mappedNotifications = notifications.map((n: any) => ({
				id: n.id.toString(),
				message: n.message,
				type: n.type as "success" | "info" | "warning",
				time: formatTimeAgo(n.created_at),
				title: n.title,
				read: n.read || false,
				link: n.link,
				createdAt: n.created_at,
			}));

			res.json(mappedNotifications);
		} catch (error) {
			// 			logger.error("❌ Błąd pobierania powiadomień:", error);
			res.status(500).json({
				error: "Nie udało się pobrać powiadomień",
				details: error instanceof Error ? error.message : "Unknown error",
			});
		}
	},
);

app.put(
	"/api/dashboard/notifications/:id/read",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userId = req.user?.id;
			const id = parseInt(req.params.id);

			if (!userId) {
				return res.status(401).json({ error: "Brak autoryzacji" });
			}

			// 			logger.debug(
			// 	`📨 Oznaczanie powiadomienia ${id} jako przeczytane dla użytkownika ${userId}`,
			// );

			const notification = await prisma.notification.findFirst({
				where: {
					id: id,
					user_id: userId,
				},
			});

			if (!notification) {
				// // 				logger.debug(
				// 					`❌ Powiadomienie ${id} nie istnieje lub nie należy do użytkownika ${userId}`,
				// 				);
				return res.status(404).json({
					error: "Nie znaleziono powiadomienia",
					details: `Powiadomienie ${id} nie istnieje lub nie należy do Ciebie`,
				});
			}

			const updated = await prisma.notification.update({
				where: { id: id },
				data: {
					read: true,
					updated_at: new Date(),
				},
			});

			// 			logger.debug(`✅ Powiadomienie ${id} oznaczone jako przeczytane`);

			res.status(200).json({
				success: true,
				message: "Oznaczono jako przeczytane",
				notification: {
					id: updated.id.toString(),
					read: updated.read,
				},
			});
		} catch (error) {
			// 			logger.error("❌ Błąd oznaczania:", error);
			res.status(500).json({
				error: "Nie udało się oznaczyć",
				details: error instanceof Error ? error.message : "Unknown error",
			});
		}
	},
);

app.put(
	"/api/dashboard/notifications/read-all",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({ error: "Brak autoryzacji" });
			}

			// 			logger.debug(
			// 	`📨 Oznaczanie wszystkich powiadomień jako przeczytane dla użytkownika ${userId}`,
			// );

			const result = await prisma.notification.updateMany({
				where: {
					user_id: userId,
					read: false,
				},
				data: { read: true },
			});

			// 			logger.debug(`✅ Oznaczono ${result.count} powiadomień jako przeczytane`);

			res.status(200).json({
				success: true,
				message: "Wszystkie oznaczone jako przeczytane",
				count: result.count,
			});
		} catch (error) {
			// 			logger.error("❌ Błąd oznaczania wszystkich:", error);
			res.status(500).json({
				error: "Nie udało się oznaczyć wszystkich",
				details: error instanceof Error ? error.message : "Unknown error",
			});
		}
	},
);

app.get("/api/tutorials", authMiddleware, async (req: any, res) => {
	try {
		const tutorials = await prisma.guide.findMany({
			where: { is_published: 1 },
			orderBy: { created_at: "desc" },
		});

		const mappedTutorials = tutorials.map((t: any) => {
			let attachments = [];
			let functionalRoles = [];

			try {
				if (t.attachments && typeof t.attachments === "string") {
					attachments = JSON.parse(t.attachments);
				} else if (t.attachments && typeof t.attachments === "object") {
					attachments = t.attachments;
				}
			} catch (e) {
				// 				logger.warn(
				// 	`⚠️ Nie udało się sparsować attachments dla tutorial ${t.id}:`,
				// 	e,
				// );
				attachments = [];
			}

			try {
				if (t.functional_roles && typeof t.functional_roles === "string") {
					functionalRoles = JSON.parse(t.functional_roles);
				} else if (
					t.functional_roles &&
					typeof t.functional_roles === "object"
				) {
					functionalRoles = t.functional_roles;
				}
			} catch (e) {
				// 				logger.warn(
				// 	`⚠️ Nie udało się sparsować functional_roles dla tutorial ${t.id}:`,
				// 	e,
				// );
				functionalRoles = [];
			}

			return {
				id: t.id.toString(),
				title: t.title,
				description: t.description,
				category: t.category || "new_member",
				access: t.access || "all",
				author: "Admin",
				createdAt: t.created_at.toISOString().split("T")[0],
				updatedAt: t.updated_at.toISOString().split("T")[0],
				content: t.content || "",
				attachments: attachments,
				functionalRoles: functionalRoles,
				isNew: false,
				isUpdated: false,
			};
		});

		res.json(mappedTutorials);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania poradników:", error);
		res.status(500).json({ error: "Nie udało się pobrać poradników" });
	}
});

app.post(
	"/api/tutorials",
	authMiddleware,
	upload.array("files", 5),
	async (req: any, res) => {
		try {
			// 			logger.debug("📥 POST /tutorials");
			// 			logger.debug("📁 Pliki:", req.files?.length || 0);

			let tutorialData;
			try {
				tutorialData = JSON.parse(req.body.data);
			} catch (e) {
				tutorialData = req.body;
			}

			const { title, description, category, access, content, functionalRoles } =
				tutorialData;

			if (!title) {
				return res.status(400).json({ error: "Tytuł jest wymagany" });
			}

			const attachments: any[] = [];
			const files = req.files as Express.Multer.File[];
			if (files && files.length > 0) {
				for (const file of files) {
					attachments.push({
						id: generateId(),
						name: Buffer.from(file.originalname, "latin1").toString("utf8"),
						url: `/uploads/tutorials/${file.filename}`,
						size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
						mimeType: file.mimetype,
					});
				}
			}

			const tutorial = await prisma.guide.create({
				data: {
					title: title,
					description: description || null,
					category: category || "new_member",
					access: access || "all",
					author_id: req.user?.id ? parseInt(req.user.id) : null,
					content: content || null,
					attachments:
						attachments.length > 0 ? JSON.stringify(attachments) : null,
					functional_roles: functionalRoles
						? JSON.stringify(functionalRoles)
						: null,
					is_published: 1,
				},
			});

			res.status(201).json({
				id: tutorial.id.toString(),
				title: tutorial.title,
				description: tutorial.description,
				category: tutorial.category || "new_member",
				access: tutorial.access || "all",
				author: "Admin",
				createdAt: tutorial.created_at.toISOString().split("T")[0],
				updatedAt: tutorial.updated_at.toISOString().split("T")[0],
				content: tutorial.content || "",
				attachments: attachments,
				functionalRoles: functionalRoles || [],
				isNew: true,
				isUpdated: false,
			});
		} catch (error) {
			// 			logger.error("❌ Błąd tworzenia poradnika:", error);

			const files = req.files as Express.Multer.File[];
			if (files) {
				for (const file of files) {
					const filePath = path.join(uploadDir, file.filename);
					if (fs.existsSync(filePath)) {
						fs.unlinkSync(filePath);
					}
				}
			}

			res.status(500).json({ error: "Nie udało się utworzyć poradnika" });
		}
	},
);

app.get("/api/applications", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		const userRole = req.user?.role;

		let whereCondition = {};
		if (userRole === "admin" || userRole === "coordinator") {
			whereCondition = {};
		} else {
			whereCondition = { user_id: userId };
		}

		// 		logger.debug(
		// 	"📥 Pobieranie zgłoszeń dla użytkownika:",
		// 	userId,
		// 	"rola:",
		// 	userRole,
		// );

		const applications = await prisma.vacancyApplication.findMany({
			where: whereCondition,
			include: {
				user: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
						email: true,
					},
				},
				vacancy: {
					select: {
						id: true,
						title: true,
						team: true,
					},
				},
				answers: {
					include: {
						question: {
							select: {
								id: true,
								question: true,
								type: true,
							},
						},
					},
				},
			},
			orderBy: {
				created_at: "desc",
			},
		});

		// 		logger.debug(`✅ Znaleziono ${applications.length} zgłoszeń`);

		const mappedApplications = applications.map((app: any) => {
			const answers: Record<string, string> = {};

			if (app.answers && Array.isArray(app.answers)) {
				app.answers.forEach((answer: any) => {
					const questionId = answer.question_id?.toString();
					if (questionId) {
						answers[questionId] = answer.answer || "";
					}
				});
			}

			return {
				id: app.id.toString(),
				vacancyId: app.vacancy_id.toString(),
				userId: app.user_id.toString(),
				userName: app.user
					? `${app.user.first_name || ""} ${app.user.last_name || ""}`.trim() ||
						"Nieznany"
					: "Nieznany",
				userEmail: app.user?.email || "",
				message: app.message || "",
				appliedAt: app.created_at
					? new Date(app.created_at).toISOString().split("T")[0]
					: new Date().toISOString().split("T")[0],
				status: app.status || "pending",
				answers: answers,
				vacancyTitle: app.vacancy?.title,
				vacancyTeam: app.vacancy?.team,
			};
		});

		res.json(mappedApplications);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania zgłoszeń:", error);
		res.status(500).json({
			error: "Nie udało się pobrać zgłoszeń",
			details: error instanceof Error ? error.message : "Nieznany błąd",
		});
	}
});

app.post("/api/vacancies/:id/notify", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const { applicantName, applicantEmail } = req.body;

		const vacancy = await prisma.vacancy.findUnique({
			where: { id: parseInt(id) },
			include: {
				contact_person: {
					select: {
						email: true,
						first_name: true,
						last_name: true,
					},
				},
			},
		});

		if (!vacancy) {
			return res.status(404).json({ error: "Nie znaleziono wakatu" });
		}

		const contactEmail = vacancy.contact_person?.email;
		if (!contactEmail) {
			// 			logger.warn("⚠️ Brak emaila kontaktowego dla wakatu:", vacancy.id);
			return res.json({ message: "Brak emaila kontaktowego" });
		}

		// 		logger.debug(`
		//   📧 Powiadomienie email:
		//   Do: ${contactEmail}
		//   Temat: Nowe zgłoszenie na stanowisko "${vacancy.title}"
		//   Wiadomość: ${applicantName} (${applicantEmail}) zgłosił/a się na stanowisko.
		// `);

		res.json({ message: "Powiadomienie wysłane" });
	} catch (error) {
		// 		logger.error("❌ Błąd wysyłki powiadomienia:", error);
		res.status(500).json({ error: "Nie udało się wysłać powiadomienia" });
	}
});

app.get(
	"/api/vacancies/:id/applications",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { id } = req.params;
			const userRole = req.user?.role;

			if (userRole !== "admin" && userRole !== "coordinator") {
				return res.status(403).json({ error: "Brak uprawnień" });
			}

			const applications = await prisma.vacancyApplication.findMany({
				where: {
					vacancy_id: parseInt(id),
				},
				include: {
					user: {
						select: {
							id: true,
							first_name: true,
							last_name: true,
							email: true,
						},
					},
					answers: {
						include: {
							question: true,
						},
					},
				},
				orderBy: {
					created_at: "desc",
				},
			});

			const mappedApplications = applications.map((app: any) => {
				const answers: Record<string, string> = {};

				if (app.answers && app.answers.length > 0) {
					app.answers.forEach((answer: any) => {
						const questionId =
							answer.question_id?.toString() || answer.id?.toString();
						if (questionId) {
							answers[questionId] = answer.answer || "";
						}
					});
				}

				return {
					id: app.id.toString(),
					vacancyId: app.vacancy_id.toString(),
					userId: app.user_id.toString(),
					userName: app.user
						? `${app.user.first_name || ""} ${app.user.last_name || ""}`.trim() ||
							"Nieznany"
						: "Nieznany",
					userEmail: app.user?.email || "",
					message: app.message || "",
					appliedAt: app.applied_at
						? new Date(app.applied_at).toISOString().split("T")[0]
						: new Date().toISOString().split("T")[0],
					status: app.status || "pending",
					answers: answers,
				};
			});

			res.json(mappedApplications);
		} catch (error) {
			// 			logger.error("❌ Błąd pobierania zgłoszeń dla wakatu:", error);
			res.status(500).json({ error: "Nie udało się pobrać zgłoszeń" });
		}
	},
);

app.put(
	"/api/applications/:id/status",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { id } = req.params;
			const { status } = req.body;
			const userRole = req.user?.role;

			if (userRole !== "admin" && userRole !== "coordinator") {
				return res.status(403).json({ error: "Brak uprawnień" });
			}

			if (!["pending", "reviewed", "accepted", "rejected"].includes(status)) {
				return res.status(400).json({ error: "Nieprawidłowy status" });
			}

			const application = await prisma.vacancyApplication.update({
				where: { id: parseInt(id) },
				data: {
					status: status,
				},
			});

			res.json({
				id: application.id.toString(),
				status: application.status,
			});
		} catch (error) {
			// 			logger.error("❌ Błąd aktualizacji statusu zgłoszenia:", error);
			res.status(500).json({ error: "Nie udało się zaktualizować statusu" });
		}
	},
);

app.put(
	"/api/tutorials/:id",
	authMiddleware,
	upload.array("files", 5),
	async (req: any, res) => {
		try {
			const id = parseInt(req.params.id);
			// 			logger.debug(`📥 PUT /tutorials/${id}`);
			// 			logger.debug("📁 Pliki:", req.files?.length || 0);

			let tutorialData;
			try {
				tutorialData = JSON.parse(req.body.data);
			} catch (e) {
				tutorialData = req.body;
			}

			const {
				title,
				description,
				category,
				access,
				content,
				attachments: existingAttachments,
				functionalRoles,
			} = tutorialData;

			const newAttachments: any[] = [];
			const files = req.files as Express.Multer.File[];
			if (files && files.length > 0) {
				for (const file of files) {
					newAttachments.push({
						id: generateId(),
						name: Buffer.from(file.originalname, "latin1").toString("utf8"),
						url: `/uploads/tutorials/${file.filename}`,
						size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
						mimeType: file.mimetype,
					});
				}
			}

			const allAttachments = [
				...(existingAttachments || []),
				...newAttachments,
			];

			const tutorial = await prisma.guide.update({
				where: { id },
				data: {
					title: title || "Bez tytułu",
					description: description || null,
					category: category || "new_member",
					access: access || "all",
					content: content || null,
					attachments:
						allAttachments.length > 0 ? JSON.stringify(allAttachments) : null,
					functional_roles: functionalRoles
						? JSON.stringify(functionalRoles)
						: null,
					updated_at: new Date(),
				},
			});

			res.json({
				id: tutorial.id.toString(),
				title: tutorial.title,
				description: tutorial.description,
				category: tutorial.category || "new_member",
				access: tutorial.access || "all",
				author: "Admin",
				createdAt: tutorial.created_at.toISOString().split("T")[0],
				updatedAt: tutorial.updated_at.toISOString().split("T")[0],
				content: tutorial.content || "",
				attachments: allAttachments,
				functionalRoles: functionalRoles || [],
				isNew: false,
				isUpdated: true,
			});
		} catch (error) {
			// 			logger.error("❌ Błąd aktualizacji poradnika:", error);

			const files = req.files as Express.Multer.File[];
			if (files) {
				for (const file of files) {
					const filePath = path.join(uploadDir, file.filename);
					if (fs.existsSync(filePath)) {
						fs.unlinkSync(filePath);
					}
				}
			}

			res.status(500).json({ error: "Nie udało się zaktualizować poradnika" });
		}
	},
);

app.delete("/api/tutorials/:id", authMiddleware, async (req: any, res) => {
	try {
		const id = parseInt(req.params.id);

		const tutorial = await prisma.guide.findUnique({
			where: { id },
		});

		if (tutorial && tutorial.attachments) {
			const attachments = JSON.parse(tutorial.attachments);
			for (const att of attachments) {
				const filePath = path.join(__dirname, att.url);
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			}
		}

		await prisma.guide.update({
			where: { id },
			data: { is_published: 0 },
		});

		res.status(204).send();
	} catch (error) {
		// 		logger.error("❌ Błąd usuwania poradnika:", error);
		res.status(500).json({ error: "Nie udało się usunąć poradnika" });
	}
});

app.delete(
	"/api/tutorials/attachments/:id",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { id } = req.params;
			const tutorialId = parseInt(req.query.tutorialId as string);

			// 			logger.debug(`🗑️ Usuwanie załącznika: ${id} z poradnika: ${tutorialId}`);

			const tutorial = await prisma.guide.findUnique({
				where: { id: tutorialId },
			});

			if (!tutorial || !tutorial.attachments) {
				return res
					.status(404)
					.json({ error: "Nie znaleziono poradnika lub załączników" });
			}

			let attachments = JSON.parse(tutorial.attachments);
			const attachmentToRemove = attachments.find((a: any) => a.id === id);

			if (attachmentToRemove) {
				const filePath = path.join(__dirname, attachmentToRemove.url);
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}

				attachments = attachments.filter((a: any) => a.id !== id);

				await prisma.guide.update({
					where: { id: tutorialId },
					data: {
						attachments:
							attachments.length > 0 ? JSON.stringify(attachments) : null,
					},
				});
			}

			res.json({ success: true });
		} catch (error) {
			// 			logger.error("❌ Błąd usuwania załącznika:", error);
			res.status(500).json({ error: "Nie udało się usunąć załącznika" });
		}
	},
);

app.get("/api/uploads/tutorials/:filename", async (req: any, res) => {
	try {
		const { filename } = req.params;
		const filePath = path.join(uploadDir, filename);

		if (!fs.existsSync(filePath)) {
			return res.status(404).json({ error: "Nie znaleziono pliku" });
		}

		const mimeType = getMimeType(filename);
		res.setHeader("Content-Type", mimeType);
		const encodedFileName = encodeURIComponent(filename);
		res.setHeader(
			"Content-Disposition",
			`attachment; filename*=UTF-8''${encodedFileName}`,
		);
		res.sendFile(filePath);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania pliku:", error);
		res.status(500).json({ error: "Nie udało się pobrać pliku" });
	}
});

function getMimeType(filename: string): string {
	const ext = path.extname(filename).toLowerCase();
	const mimeTypes: Record<string, string> = {
		".pdf": "application/pdf",
		".doc": "application/msword",
		".docx":
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		".xls": "application/vnd.ms-excel",
		".xlsx":
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		".ppt": "application/vnd.ms-powerpoint",
		".pptx":
			"application/vnd.openxmlformats-officedocument.presentationml.presentation",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".png": "image/png",
		".gif": "image/gif",
		".webp": "image/webp",
		".txt": "text/plain",
		".csv": "text/csv",
		".zip": "application/zip",
		".rar": "application/x-rar-compressed",
	};
	return mimeTypes[ext] || "application/octet-stream";
}

app.get("/api/vacancies", authMiddleware, async (req: any, res) => {
	try {
		const vacancies = await prisma.vacancy.findMany({
			where: {
				is_active: true,
			},
			include: {
				contact_person: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
						email: true,
						phone: true,
					},
				},
				attachments: true,
				questions: true,
				applications: {
					include: {
						user: {
							select: {
								id: true,
								first_name: true,
								last_name: true,
								email: true,
							},
						},
						answers: true,
					},
				},
			},
			orderBy: {
				created_at: "desc",
			},
		});

		res.json(vacancies);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania wakatów:", error);
		res.status(500).json({ error: "Nie udało się pobrać wakatów" });
	}
});

app.post("/api/vacancies", authMiddleware, async (req: any, res) => {
	try {
		const {
			title,
			icon,
			description,
			responsibilities,
			requirements,
			nice_to_have,
			team,
			team_id,
			pillar,
			contact_person_id,
			status,
			recruitment_type,
			recruitment_deadline,
			recruitment_form_url,
			recruitment_messenger_contact,
			questions,
		} = req.body;

		if (!title || !description) {
			return res.status(400).json({
				error: "Tytuł i opis są wymagane",
			});
		}

		const vacancy = await prisma.vacancy.create({
			data: {
				title,
				icon: icon || "Briefcase",
				description,
				responsibilities: JSON.stringify(responsibilities || []),
				requirements: JSON.stringify(requirements || []),
				nice_to_have: JSON.stringify(nice_to_have || []),
				team,
				team_id: team_id || "",
				pillar: pillar || "",
				contact_person_id: contact_person_id || null,
				status: status || "active",
				recruitment_type: recruitment_type || "internal",
				recruitment_deadline: recruitment_deadline
					? new Date(recruitment_deadline)
					: null,
				recruitment_form_url: recruitment_form_url || null,
				recruitment_messenger_contact: recruitment_messenger_contact || null,
				is_active: true,
			},
		});

		if (questions && questions.length > 0) {
			await prisma.vacancyQuestion.createMany({
				data: questions.map((q: any) => ({
					vacancy_id: vacancy.id,
					question: q.question,
					type: q.type || "text",
					required: q.required || false,
					options: q.options ? JSON.stringify(q.options) : null,
					order: q.order || 0,
				})),
			});
		}

		res.status(201).json(vacancy);
	} catch (error) {
		// 		logger.error("❌ Błąd tworzenia wakatu:", error);
		res.status(500).json({ error: "Nie udało się utworzyć wakatu" });
	}
});

app.put("/api/vacancies/:id", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const {
			title,
			icon,
			description,
			responsibilities,
			requirements,
			nice_to_have,
			team,
			team_id,
			pillar,
			contact_person_id,
			status,
			recruitment_type,
			recruitment_deadline,
			recruitment_form_url,
			recruitment_messenger_contact,
			questions,
		} = req.body;

		const vacancy = await prisma.vacancy.update({
			where: { id: parseInt(id) },
			data: {
				title,
				icon,
				description,
				responsibilities: JSON.stringify(responsibilities || []),
				requirements: JSON.stringify(requirements || []),
				nice_to_have: JSON.stringify(nice_to_have || []),
				team,
				team_id,
				pillar,
				contact_person_id,
				status,
				recruitment_type,
				recruitment_deadline: recruitment_deadline
					? new Date(recruitment_deadline)
					: null,
				recruitment_form_url,
				recruitment_messenger_contact,
				updated_at: new Date(),
			},
		});

		if (questions) {
			await prisma.vacancyQuestion.deleteMany({
				where: { vacancy_id: parseInt(id) },
			});
			await prisma.vacancyQuestion.createMany({
				data: questions.map((q: any) => ({
					vacancy_id: parseInt(id),
					question: q.question,
					type: q.type || "text",
					required: q.required || false,
					options: q.options ? JSON.stringify(q.options) : null,
					order: q.order || 0,
				})),
			});
		}

		res.json(vacancy);
	} catch (error) {
		// 		logger.error("❌ Błąd aktualizacji wakatu:", error);
		res.status(500).json({ error: "Nie udało się zaktualizować wakatu" });
	}
});

app.delete("/api/vacancies/:id", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;

		await prisma.vacancy.update({
			where: { id: parseInt(id) },
			data: { is_active: false },
		});

		res.status(204).send();
	} catch (error) {
		// 		logger.error("❌ Błąd usuwania wakatu:", error);
		res.status(500).json({ error: "Nie udało się usunąć wakatu" });
	}
});

app.post("/api/vacancies/:id/apply", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const userId = req.user?.id;
		const { message, answers } = req.body;

		if (!userId) {
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		const vacancy = await prisma.vacancy.findUnique({
			where: {
				id: parseInt(id),
				is_active: true,
			},
		});

		if (!vacancy) {
			return res.status(404).json({ error: "Nie znaleziono wakatu" });
		}

		const existingApplication = await prisma.vacancyApplication.findFirst({
			where: {
				vacancy_id: parseInt(id),
				user_id: userId,
			},
		});

		if (existingApplication) {
			return res.status(400).json({
				error: "Już zgłosiłeś się na to stanowisko",
			});
		}

		const application = await prisma.vacancyApplication.create({
			data: {
				vacancy_id: parseInt(id),
				user_id: userId,
				message: message || null,
				status: "pending",
			},
		});

		if (answers && Object.keys(answers).length > 0) {
			const questions = await prisma.vacancyQuestion.findMany({
				where: {
					vacancy_id: parseInt(id),
				},
				select: {
					id: true,
				},
			});

			const questionIds = questions.map((q: { id: number }) => q.id);

			const validAnswers = Object.entries(answers)
				.filter(([questionId]) => questionIds.includes(parseInt(questionId)))
				.map(([questionId, answer]) => ({
					application_id: application.id,
					question_id: parseInt(questionId),
					answer: answer as string,
				}));

			if (validAnswers.length > 0) {
				await prisma.vacancyAnswer.createMany({
					data: validAnswers,
				});
			}
		}

		res.status(201).json({
			id: application.id.toString(),
			vacancyId: application.vacancy_id.toString(),
			userId: application.user_id.toString(),
			message: application.message,
			status: application.status,
			appliedAt: new Date().toISOString().split("T")[0],
		});
	} catch (error) {
		// 		logger.error("❌ Błąd zgłaszania na wakat:", error);
		res.status(500).json({
			error: "Nie udało się zgłosić na wakat",
			details: error instanceof Error ? error.message : "Nieznany błąd",
		});
	}
});

app.get(
	"/api/vacancies/:id/check-application",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { id } = req.params;
			const userId = req.user?.id;

			if (!userId) {
				return res.status(401).json({ error: "Brak autoryzacji" });
			}

			const application = await prisma.vacancyApplication.findFirst({
				where: {
					vacancy_id: parseInt(id),
					user_id: userId,
				},
			});

			res.json({
				hasApplied: !!application,
				applicationId: application?.id?.toString() || null,
			});
		} catch (error) {
			// 			logger.error("❌ Błąd sprawdzania zgłoszenia:", error);
			res.status(500).json({ error: "Nie udało się sprawdzić zgłoszenia" });
		}
	},
);

app.delete(
	"/api/dashboard/notifications/:id",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userId = req.user?.id;
			const id = parseInt(req.params.id);

			if (!userId) {
				return res.status(401).json({ error: "Brak autoryzacji" });
			}

			const result = await prisma.notification.deleteMany({
				where: { id: id, user_id: userId },
			});

			if (result.count === 0) {
				return res.status(404).json({ error: "Nie znaleziono powiadomienia" });
			}

			res.status(200).json({ message: "Usunięto powiadomienie" });
		} catch (error) {
			// 			logger.error("❌ Błąd usuwania:", error);
			res.status(500).json({ error: "Nie udało się usunąć" });
		}
	},
);

app.get("/api/structure", authMiddleware, async (req: any, res) => {
	try {
		// 		logger.debug("📥 [STRUCTURE] Pobieranie struktury...");

		const teams = await prisma.team.findMany({
			select: {
				id: true,
				name: true,
				description: true,
				parent_id: true,
				email: true,
			},
		});

		const teamMembers = await prisma.teamMember.findMany({
			select: {
				id: true,
				team_id: true,
				user_id: true,
				role: true,
				is_leader: true,
				created_at: true,
				team: {
					select: {
						id: true,
						name: true,
					},
				},
				user: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
						email: true,
						phone: true,
						province: true,
						functional_role: true,
					},
				},
			},
		});

		const FILAR_NAMES = [
			"Filar Projektowy",
			"Filar Konferencyjny",
			"Filar Rzeczniczy",
			"Filar Symulacyjny",
		];

		const ALL_MEMBERS_TEAMS = [
			"Zarząd",
			"Siła Młodych",
			"Komisja Rewizyjna",
			"Sąd Koleżeński",
			"Social Media",
		];

		const peopleByTeam: Record<number, any[]> = {};

		teamMembers.forEach((tm: any) => {
			if (!peopleByTeam[tm.team_id]) {
				peopleByTeam[tm.team_id] = [];
			}

			const teamName = tm.team?.name || "";

			let shouldShow = true;

			if (ALL_MEMBERS_TEAMS.includes(teamName)) {
				shouldShow = true;
			} else if (FILAR_NAMES.includes(teamName)) {
				shouldShow = tm.is_leader === true;
			}

			if (shouldShow) {
				peopleByTeam[tm.team_id].push({
					id: tm.user.id.toString(),
					firstName: tm.user.first_name,
					lastName: tm.user.last_name,
					role: tm.role || tm.user.functional_role || "Członek",
					email: tm.user.email || "",
					phone: tm.user.phone || undefined,
					province: tm.user.province || undefined,
					is_leader: tm.is_leader || false,
				});
			}
		});

		const teamMap: Record<number, any> = {};
		teams.forEach((team: any) => {
			const sortedPeople = (peopleByTeam[team.id] || []).sort(
				(a: any, b: any) => {
					if (a.is_leader && !b.is_leader) return -1;
					if (!a.is_leader && b.is_leader) return 1;
					return a.lastName.localeCompare(b.lastName);
				},
			);

			teamMap[team.id] = {
				id: `team-${team.id}`,
				name: team.name,
				role:
					team.name === "Siła Młodych" ? "Struktura organizacyjna" : "Zespół",
				icon: getIconForTeam(team.name),
				description: team.description || "",
				status: "active",
				email: team.email || null,
				children: [],
				people: sortedPeople,
			};
		});

		const rootTeams: any[] = [];
		teams.forEach((team: any) => {
			const node = teamMap[team.id];
			if (team.parent_id && teamMap[team.parent_id]) {
				teamMap[team.parent_id].children.push(node);
			} else {
				rootTeams.push(node);
			}
		});

		const mainTeam = rootTeams.find((t) => t.name === "Siła Młodych");

		let structure;
		if (mainTeam) {
			structure = mainTeam;
		} else {
			structure = {
				id: "organization",
				name: "Siła Młodych",
				role: "Struktura organizacyjna",
				icon: "Users",
				description: "Organizacja młodzieżowa",
				status: "active",
				children: rootTeams,
				people: [],
			};
		}

		res.json(structure);
	} catch (error) {
		// 		logger.error("❌ [STRUCTURE] Błąd:", error);
		res.status(500).json({ error: "Nie udało się pobrać struktury" });
	}
});
app.use("/api", memberRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/dashboard", dashboardRoutes);
// src/server.ts - /api/profile (około linii 1450-1480)

app.get("/api/profile", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		// 		logger.debug(`📥 Pobieranie profilu dla użytkownika: ${userId}`);

		if (!userId) {
			// 			logger.debug("❌ Brak userId w req.user");
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
			include: {
				roles: true,
				team_members: {
					include: { team: true },
					// 🔥 DODAJ - filtruj tylko członkostwa w filarach
					where: {
						team: {
							name: { contains: "Filar" },
						},
					},
				},
				onboarding_data: { orderBy: { created_at: "desc" }, take: 1 },
			},
		});

		if (!user) {
			// 			logger.debug(`❌ Użytkownik ${userId} nie znaleziony`);
			return res.status(404).json({ error: "Użytkownik nie znaleziony" });
		}

		// 		logger.debug(`✅ Profil pobrany dla: ${user.first_name} ${user.last_name}`);

		// ============================================================
		// 🔥 FILARY Z POLA `pillars` (Z SM_Frekwencja)
		// ============================================================
		const pillarList = user.pillars
			? user.pillars.split(", ").filter(Boolean)
			: [];
		const pillar = pillarList.length > 0 ? pillarList[0] : null;

		// ============================================================
		// 🔥 FILARY, W KTÓRYCH UŻYTKOWNIK JEST KOORDYNATOREM
		// ============================================================
		const coordinatorPillars = user.team_members
			.filter(
				(tm: any) => tm.is_leader === true && tm.team?.name?.includes("Filar"),
			)
			.map((tm: any) => tm.team?.name?.replace("Filar ", ""))
			.filter(Boolean);

		// 		logger.debug(`🏷️ Filary użytkownika: ${pillarList.join(", ")}`);
		// 		logger.debug(`👑 Koordynator w filarach: ${coordinatorPillars.join(", ")}`);

		// Tylko dla zespołu (team) - używaj team_members
		const teams = user.team_members
			.map((tm: any) => tm.team?.name)
			.filter(Boolean);
		const teamString =
			teams.length > 0 ? teams.join(", ") : user.team || "Brak zespołu";

		const onboarding = user.onboarding_data?.[0] || {};

		const profile = {
			id: user.id.toString(),
			firstName: user.first_name,
			lastName: user.last_name,
			role: mapRoleId(user.role_id),
			function: user.functional_role || "Członek",
			team: teamString,
			pillar: pillar,
			pillars: pillarList,
			// ============================================================
			// 🔥 DODAJ - filary w których użytkownik jest koordynatorem
			// ============================================================
			coordinatorPillars: coordinatorPillars,
			province: user.province || "Brak danych",
			status: user.status || "active",
			email: user.email || "",
			phone: user.phone || undefined,
			joinDate:
				user.join_date?.toISOString().split("T")[0] ||
				user.created_at.toISOString().split("T")[0],
			currentTasks: [],
			projects: [],
			developmentAreas: onboarding.development_areas
				? JSON.parse(onboarding.development_areas)
				: [],
			skills: onboarding.skills ? JSON.parse(onboarding.skills) : [],
			availability: onboarding.availability || "Nie ustawiono",
			description: onboarding.description || "",
			contacts: {
				salaContacts: onboarding.sala_contacts
					? JSON.parse(onboarding.sala_contacts)
					: [],
				mpContacts: onboarding.mp_contacts
					? JSON.parse(onboarding.mp_contacts)
					: [],
				institutionContacts: onboarding.institution_contacts
					? JSON.parse(onboarding.institution_contacts)
					: [],
				otherContacts: onboarding.other_contacts
					? JSON.parse(onboarding.other_contacts)
					: [],
			},
			contributionInfo: { arrears: 0, status: "paid" },
			leave: { isOnLeave: false, history: [] },
		};

		res.json(profile);
	} catch (error) {
		// 		logger.error("❌ Błąd profilu:", error);
		res.status(500).json({ error: "Nie udało się pobrać profilu" });
	}
});

app.get("/api/leaves", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		const userRole = req.user?.role;
		const userTeam = req.user?.team;

		const leaves = await prisma.leave.findMany({
			include: {
				user: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
						email: true,
						team: true,
						team_members: {
							include: {
								team: true,
							},
						},
					},
				},
				comments: {
					include: {
						author: {
							select: {
								id: true,
								first_name: true,
								last_name: true,
							},
						},
					},
				},
			},
			orderBy: {
				created_at: "desc",
			},
		});

		const mappedLeaves = leaves
			.map((leave: any) => {
				const user = leave.user;
				const userName = user
					? `${user.first_name || ""} ${user.last_name || ""}`.trim()
					: "Nieznany";

				let canView = false;
				if (userRole === "board" || userRole === "admin") {
					canView = true;
				} else if (userRole === "coordinator") {
					canView =
						user?.team === userTeam ||
						leave.affected_teams?.includes(userTeam) ||
						userId === leave.user_id;
				} else {
					canView = userId === leave.user_id;
				}

				if (!canView) return null;

				const teams =
					user?.team_members?.map((tm: any) => tm.team?.name).filter(Boolean) ||
					[];

				const userTeamName =
					teams.length > 0 ? teams.join(", ") : user?.team || "Brak zespołu";

				return {
					id: leave.id.toString(),
					userId: leave.user_id.toString(),
					userName: userName,
					userTeam: userTeamName,
					type: leave.type || "vacation",
					scope: leave.scope || "all",
					affectedTeams: leave.affected_teams
						? JSON.parse(leave.affected_teams)
						: [],
					startDate: leave.start_date.toISOString().split("T")[0],
					endDate: leave.end_date.toISOString().split("T")[0],
					reason: leave.reason || "",
					reasonVisibility: leave.reason_visibility || "private",
					status: leave.status || "pending",
					createdAt: leave.created_at.toISOString(),
					approvedBy: leave.approved_by || undefined,
					approvedAt: leave.approved_at?.toISOString(),
					attachments: leave.attachments ? JSON.parse(leave.attachments) : [],
					comments:
						leave.comments?.map((c: any) => ({
							id: c.id.toString(),
							author: c.author
								? `${c.author.first_name || ""} ${c.author.last_name || ""}`.trim()
								: "Nieznany",
							content: c.content,
							createdAt: c.created_at.toISOString(),
						})) || [],
				};
			})
			.filter(Boolean);

		res.json(mappedLeaves);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania urlopów:", error);
		res.status(500).json({ error: "Nie udało się pobrać urlopów" });
	}
});

app.post("/api/leaves", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Brak autoryzacji" });

		// 		logger.debug("📥 OTRZYMANE DANE:", req.body);

		const {
			type,
			scope,
			affectedTeams,
			startDate,
			endDate,
			reason,
			reasonVisibility,
			attachments,
		} = req.body;

		if (!startDate || !endDate) {
			return res
				.status(400)
				.json({ error: "Data rozpoczęcia i zakończenia są wymagane" });
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				first_name: true,
				last_name: true,
				team: true,
				team_members: {
					include: {
						team: true,
					},
				},
			},
		});

		const teams =
			user?.team_members?.map((tm: any) => tm.team?.name).filter(Boolean) || [];
		const userTeam =
			teams.length > 0 ? teams.join(", ") : user?.team || "Brak zespołu";

		const leave = await prisma.leave.create({
			data: {
				user_id: userId,
				type: type || "vacation",
				scope: scope || "all",
				affected_teams: affectedTeams ? JSON.stringify(affectedTeams) : null,
				start_date: new Date(startDate),
				end_date: new Date(endDate),
				reason: reason || "",
				reason_visibility: reasonVisibility || "private",
				status: "pending",
				attachments: attachments ? JSON.stringify(attachments) : null,
			},
		});

		const userName = user
			? `${user.first_name || ""} ${user.last_name || ""}`.trim()
			: "Nieznany";

		const boardMember = await prisma.user.findFirst({
			where: {
				role_id: 2,
			},
			select: { id: true },
			orderBy: { id: "asc" },
		});

		if (boardMember) {
			const existing = await prisma.notification.findFirst({
				where: {
					user_id: boardMember.id,
					message: `Użytkownik ${userName} zgłosił urlop od ${new Date(startDate).toLocaleDateString("pl-PL")} do ${new Date(endDate).toLocaleDateString("pl-PL")}`,
					created_at: {
						gte: new Date(Date.now() - 60000),
					},
				},
			});

			if (!existing) {
				await prisma.notification.create({
					data: {
						user_id: boardMember.id,
						title: "Nowy wniosek urlopowy",
						message: `Użytkownik ${userName} zgłosił urlop od ${new Date(startDate).toLocaleDateString("pl-PL")} do ${new Date(endDate).toLocaleDateString("pl-PL")}`,
						type: "info",
						read: false,
						link: `/leave`,
						target: "board",
						created_at: new Date(),
					},
				});
			}
		}

		// 		logger.debug("✅ UTOWORZONO URLOP:", leave);
		// 		logger.debug(`📨 Wysłano powiadomienia do Admina i Zarządu`);

		res.status(201).json({
			id: leave.id.toString(),
			userId: leave.user_id.toString(),
			userName: userName,
			userTeam: userTeam,
			type: leave.type,
			scope: leave.scope,
			affectedTeams: leave.affected_teams
				? JSON.parse(leave.affected_teams)
				: [],
			startDate: leave.start_date.toISOString().split("T")[0],
			endDate: leave.end_date.toISOString().split("T")[0],
			reason: leave.reason || "",
			reasonVisibility: leave.reason_visibility,
			status: leave.status,
			createdAt: leave.created_at.toISOString(),
			approvedBy: leave.approved_by || undefined,
			approvedAt: leave.approved_at?.toISOString(),
			attachments: leave.attachments ? JSON.parse(leave.attachments) : [],
			comments: [],
		});
	} catch (error) {
		// 		logger.error("❌ Błąd tworzenia wniosku:", error);
		res.status(500).json({ error: "Nie udało się utworzyć wniosku" });
	}
});

app.put("/api/leaves/:id", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		const userRole = req.user?.role;
		const leaveId = parseInt(req.params.id);

		if (!userId) return res.status(401).json({ error: "Brak autoryzacji" });

		const existingLeave = await prisma.leave.findUnique({
			where: { id: leaveId },
			include: { user: true },
		});

		if (!existingLeave) {
			return res.status(404).json({ error: "Nie znaleziono wniosku" });
		}

		const canApprove =
			userRole === "admin" || userRole === "board" || userRole === "zarząd";

		if (!canApprove) {
			return res.status(403).json({
				error:
					"Tylko Admin lub Zarząd może zatwierdzać lub odrzucać wnioski urlopowe",
			});
		}

		const currentUser = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				first_name: true,
				last_name: true,
			},
		});

		const {
			type,
			scope,
			affectedTeams,
			startDate,
			endDate,
			reason,
			reasonVisibility,
			attachments,
			status,
		} = req.body;

		if (status && (status === "approved" || status === "rejected")) {
			if (!canApprove) {
				return res.status(403).json({
					error: "Tylko Admin lub Zarząd może zatwierdzać lub odrzucać wnioski",
				});
			}
		}

		const leave = await prisma.leave.update({
			where: { id: leaveId },
			data: {
				type: type || existingLeave.type,
				scope: scope || existingLeave.scope,
				affected_teams: affectedTeams
					? JSON.stringify(affectedTeams)
					: existingLeave.affected_teams,
				start_date: startDate ? new Date(startDate) : existingLeave.start_date,
				end_date: endDate ? new Date(endDate) : existingLeave.end_date,
				reason: reason !== undefined ? reason : existingLeave.reason,
				reason_visibility: reasonVisibility || existingLeave.reason_visibility,
				attachments: attachments
					? JSON.stringify(attachments)
					: existingLeave.attachments,
				status: status || existingLeave.status,
				...(status === "approved" || status === "rejected"
					? {
							approved_by:
								`${currentUser?.first_name || ""} ${currentUser?.last_name || ""}`.trim() ||
								"Nieznany",
							approved_at: new Date(),
						}
					: {}),
			},
		});

		if (status && (status === "approved" || status === "rejected")) {
			const statusText = status === "approved" ? "zaakceptowany" : "odrzucony";
			const userName =
				`${currentUser?.first_name || ""} ${currentUser?.last_name || ""}`.trim() ||
				"Nieznany";

			await prisma.notification.create({
				data: {
					user_id: existingLeave.user_id,
					title:
						status === "approved"
							? "Wniosek zaakceptowany"
							: "Wniosek odrzucony",
					message: `Twój wniosek urlopowy został ${statusText} przez ${userName}`,
					type: status === "approved" ? "success" : "warning",
					read: false,
					link: `/leave`,
					target: "all",
					created_at: new Date(),
				},
			});
		}

		res.json(leave);
	} catch (error) {
		// 		logger.error("❌ Błąd aktualizacji wniosku:", error);
		res.status(500).json({ error: "Nie udało się zaktualizować wniosku" });
	}
});

app.delete("/api/leaves/:id", authMiddleware, async (req: any, res) => {
	// 	logger.debug(`🔍 [DELETE LEAVE] START - ID: ${req.params.id}`);
	try {
		const userId = req.user?.id;
		const userRole = req.user?.role;
		const leaveId = parseInt(req.params.id);

		// 		logger.debug(
		// 	`🔍 [DELETE LEAVE] userId: ${userId}, userRole: ${userRole}, leaveId: ${leaveId}`,
		// );

		const existingLeave = await prisma.leave.findUnique({
			where: { id: leaveId },
			include: { user: true },
		});

		// 		logger.debug(`🔍 [DELETE LEAVE] existingLeave:`, existingLeave);

		if (!existingLeave) {
			// 			logger.debug(`🔍 [DELETE LEAVE] Nie znaleziono wniosku`);
			return res.status(404).json({ error: "Nie znaleziono wniosku" });
		}

		if (userRole !== "admin" && existingLeave.user_id !== userId) {
			// 			logger.debug(`🔍 [DELETE LEAVE] Brak uprawnień`);
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		await prisma.leave.delete({
			where: { id: leaveId },
		});

		// 		logger.debug(`🔍 [DELETE LEAVE] Usunięto z bazy`);

		res.status(200).json({
			success: true,
			message: "Wniosek urlopowy usunięty",
			id: leaveId,
		});
	} catch (error) {
		// 		logger.error(`🔍 [DELETE LEAVE] BŁĄD:`, error);

		res.status(500).json({
			error: "Nie udało się usunąć wniosku",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

app.get("/api/leaves/status", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Brak autoryzacji" });

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const activeLeave = await prisma.leave.findFirst({
			where: {
				user_id: userId,
				status: "approved",
				start_date: { lte: today },
				end_date: { gte: today },
			},
		});

		res.json({
			onLeave: !!activeLeave,
			endDate: activeLeave?.end_date?.toISOString().split("T")[0],
		});
	} catch (error) {
		// 		logger.error("❌ Błąd sprawdzania statusu urlopu:", error);
		res.status(500).json({ error: "Nie udało się sprawdzić statusu urlopu" });
	}
});

app.get("/api/leaves/status/:userId", authMiddleware, async (req: any, res) => {
	try {
		const userId = parseInt(req.params.userId);
		if (!userId) return res.status(400).json({ error: "Brak ID użytkownika" });

		const currentUserRole = req.user?.role;
		if (currentUserRole !== "admin" && currentUserRole !== "coordinator") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const activeLeave = await prisma.leave.findFirst({
			where: {
				user_id: userId,
				status: "approved",
				start_date: { lte: today },
				end_date: { gte: today },
			},
		});

		res.json({
			onLeave: !!activeLeave,
			endDate: activeLeave?.end_date?.toISOString().split("T")[0],
		});
	} catch (error) {
		// 		logger.error("❌ Błąd sprawdzania statusu urlopu:", error);
		res.status(500).json({ error: "Nie udało się sprawdzić statusu urlopu" });
	}
});

app.put("/api/profile", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Brak autoryzacji" });

		const {
			firstName,
			lastName,
			province,
			description,
			skills,
			developmentAreas,
			availability,
			phone,
		} = req.body;

		await prisma.user.update({
			where: { id: userId },
			data: { first_name: firstName, last_name: lastName, province, phone },
		});

		const existing = await prisma.onboarding_data.findFirst({
			where: { user_id: userId },
			orderBy: { created_at: "desc" },
		});

		if (existing) {
			await prisma.onboarding_data.update({
				where: { id: existing.id },
				data: {
					description,
					skills: JSON.stringify(skills),
					development_areas: JSON.stringify(developmentAreas),
					availability,
				},
			});
		}

		res.json({ success: true, message: "Profil zaktualizowany" });
	} catch (error) {
		// 		logger.error("❌ Błąd aktualizacji:", error);
		res.status(500).json({ error: "Nie udało się zaktualizować profilu" });
	}
});

app.post("/api/profile/skills", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		const { skill } = req.body;

		const onboarding = await prisma.onboarding_data.findFirst({
			where: { user_id: userId },
			orderBy: { created_at: "desc" },
		});
		const skills = onboarding?.skills ? JSON.parse(onboarding.skills) : [];
		if (!skills.includes(skill)) skills.push(skill);

		await prisma.onboarding_data.update({
			where: { id: onboarding!.id },
			data: { skills: JSON.stringify(skills) },
		});

		res.json({ success: true, skills });
	} catch (error) {
		// 		logger.error("❌ Błąd:", error);
		res.status(500).json({ error: "Nie udało się dodać umiejętności" });
	}
});

app.delete(
	"/api/profile/skills/:skill",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userId = req.user?.id;
			const skillToRemove = decodeURIComponent(req.params.skill);

			const onboarding = await prisma.onboarding_data.findFirst({
				where: { user_id: userId },
				orderBy: { created_at: "desc" },
			});
			const skills = onboarding?.skills ? JSON.parse(onboarding.skills) : [];
			const updatedSkills = skills.filter((s: string) => s !== skillToRemove);

			await prisma.onboarding_data.update({
				where: { id: onboarding!.id },
				data: { skills: JSON.stringify(updatedSkills) },
			});

			res.json({ success: true, skills: updatedSkills });
		} catch (error) {
			// 			logger.error("❌ Błąd:", error);
			res.status(500).json({ error: "Nie udało się usunąć umiejętności" });
		}
	},
);

app.use(
	(
		err: any,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		// 		logger.error("❌ Błąd:", err);

		// Sprawdź czy to błąd multer
		if (err instanceof multer.MulterError) {
			if (err.message.includes("File too large")) {
				return res
					.status(400)
					.json({ error: "Plik jest za duży. Maksymalny rozmiar: 10MB" });
			}
			if (err.message.includes("too many files")) {
				return res.status(400).json({ error: "Maksymalnie 5 plików na raz" });
			}
			if (err.message.includes("Unexpected field")) {
				return res
					.status(400)
					.json({ error: "Nieoczekiwany plik. Sprawdź nazwę pola (files)" });
			}
			return res.status(400).json({ error: err.message });
		}

		if (err.message && err.message.includes("Niedozwolony typ pliku")) {
			return res.status(400).json({ error: err.message });
		}

		// 🔥 POPRAWNY HANDLER BŁĘDÓW - BEZPIECZNIEJSZY
		try {
			if (typeof res.status === "function") {
				res
					.status(500)
					.json({ error: err.message || "Wewnętrzny błąd serwera" });
			} else {
				// Jeśli res.status nie jest funkcją, użyj alternatywnego sposobu
				res.statusCode = 500;
				res.setHeader("Content-Type", "application/json");
				res.end(
					JSON.stringify({ error: err.message || "Wewnętrzny błąd serwera" }),
				);
			}
		} catch (e) {
			// Ostateczna deska ratunku
			try {
				res.statusCode = 500;
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify({ error: "Wewnętrzny błąd serwera" }));
			} catch (finalError) {
				console.error("💀 Krytyczny błąd w handlerze błędów:", finalError);
				// Nawet to nie działa - nic więcej nie możemy zrobić
			}
		}
	},
);

app.get("/api/social/members", authMiddleware, async (req: any, res) => {
	try {
		const members = await prisma.socialMediaMember.findMany({
			include: {
				user: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
						email: true,
						phone: true,
						province: true,
						team: true,
						functional_role: true,
						status: true,
					},
				},
			},
		});

		const formattedMembers = members.map((m: any) => ({
			id: m.id.toString(),
			user_id: m.user_id.toString(),
			firstName: m.user.first_name,
			lastName: m.user.last_name,
			role: m.role,
			email: m.user.email,
			phone: m.user.phone || "",
			province: m.user.province || "",
			team: m.user.team || "",
			joinDate: m.created_at.toISOString().split("T")[0],
			status: m.user.status,
		}));

		res.json(formattedMembers);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania członków social media:", error);
		res.status(500).json({ error: "Nie udało się pobrać członków" });
	}
});

app.get("/api/social/creators", authMiddleware, async (req: any, res) => {
	try {
		const creators = await prisma.socialMediaCreator.findMany({
			include: {
				user: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
						email: true,
						phone: true,
						province: true,
						team: true,
					},
				},
			},
		});

		const formattedCreators = creators.map((c: any) => ({
			id: c.id.toString(),
			user_id: c.user_id.toString(),
			firstName: c.user.first_name,
			lastName: c.user.last_name,
			email: c.user.email,
			phone: c.user.phone || "",
			province: c.user.province || "",
			team: c.user.team || "",
			availability: c.availability || "",
			experience: c.experience || "none",
			topics: c.topics ? JSON.parse(c.topics) : [],
			active: c.is_active,
		}));

		res.json(formattedCreators);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania twórców:", error);
		res.status(500).json({
			error: "Nie udało się pobrać twórców",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

app.post("/api/social/creators", authMiddleware, async (req: any, res) => {
	try {
		const { user_id, availability, experience, topics } = req.body;

		const user = await prisma.user.findUnique({
			where: { id: parseInt(user_id) },
		});

		if (!user) {
			return res.status(404).json({ error: "Użytkownik nie istnieje" });
		}

		const existingCreator = await prisma.socialMediaCreator.findUnique({
			where: { user_id: parseInt(user_id) },
		});

		if (existingCreator) {
			return res.status(400).json({ error: "Ten użytkownik już jest twórcą" });
		}

		const creator = await prisma.socialMediaCreator.create({
			data: {
				user_id: parseInt(user_id),
				availability: availability,
				experience: experience || "none",
				topics: JSON.stringify(topics || []),
				is_active: true,
			},
			include: {
				user: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
						email: true,
						phone: true,
						province: true,
						team: true,
					},
				},
			},
		});

		const formattedCreator = {
			id: creator.id.toString(),
			user_id: creator.user_id.toString(),
			firstName: creator.user.first_name,
			lastName: creator.user.last_name,
			email: creator.user.email,
			phone: creator.user.phone || "",
			province: creator.user.province || "",
			team: creator.user.team || "",
			availability: creator.availability || "",
			experience: creator.experience || "none",
			topics: creator.topics || [],
			active: true,
		};

		res.status(201).json(formattedCreator);
	} catch (error) {
		// 		logger.error("❌ Błąd dodawania twórcy:", error);
		res.status(500).json({ error: "Nie udało się dodać twórcy" });
	}
});

app.get("/api/social/publications", authMiddleware, async (req: any, res) => {
	try {
		const publications = await prisma.publication.findMany({
			include: {
				responsible: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
					},
				},
			},
			orderBy: {
				created_at: "desc",
			},
		});

		const formattedPublications = publications.map((p: any) => ({
			id: p.id.toString(),
			title: p.title,
			platform: p.platform,
			type: p.type,
			responsible: p.responsible
				? `${p.responsible.first_name} ${p.responsible.last_name}`
				: "Nieprzypisany",
			dueDate: p.due_date.toISOString().split("T")[0],
			status: p.status,
			description: p.description || "",
			createdAt: p.created_at.toISOString(),
		}));

		res.json(formattedPublications);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania publikacji:", error);
		res.status(500).json({ error: "Nie udało się pobrać publikacji" });
	}
});

app.get("/api/social/materials", authMiddleware, async (req: any, res) => {
	try {
		const materials = await prisma.material.findMany({
			include: {
				responsible: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
					},
				},
			},
			orderBy: {
				created_at: "desc",
			},
		});

		const formattedMaterials = materials.map((m: any) => ({
			id: m.id.toString(),
			name: m.name,
			description: m.description || "",
			responsible: m.responsible
				? `${m.responsible.first_name} ${m.responsible.last_name}`
				: "Nieprzypisany",
			deadline: m.deadline.toISOString().split("T")[0],
			priority: m.priority,
			stage: m.stage,
			createdAt: m.created_at.toISOString(),
		}));

		res.json(formattedMaterials);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania materiałów:", error);
		res.status(500).json({ error: "Nie udało się pobrać materiałów" });
	}
});

app.get("/api/social/tasks", authMiddleware, async (req: any, res) => {
	try {
		const tasks = await prisma.socialTask.findMany({
			include: {
				responsible: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
					},
				},
			},
			orderBy: {
				created_at: "desc",
			},
		});

		const formattedTasks = tasks.map((t: any) => ({
			id: t.id.toString(),
			name: t.name,
			description: t.description || "",
			responsible: t.responsible
				? `${t.responsible.first_name} ${t.responsible.last_name}`
				: "Nieprzypisany",
			deadline: t.deadline.toISOString().split("T")[0],
			status: t.status,
			createdAt: t.created_at.toISOString(),
		}));

		res.json(formattedTasks);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania zadań:", error);
		res.status(500).json({ error: "Nie udało się pobrać zadań" });
	}
});

app.get("/api/social/contacts", authMiddleware, async (req: any, res) => {
	try {
		const contacts = await prisma.mediaContact.findMany({
			include: {
				responsible: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
					},
				},
			},
			orderBy: {
				created_at: "desc",
			},
		});

		const formattedContacts = contacts.map((c: any) => ({
			id: c.id.toString(),
			name: c.name,
			channel: c.channel,
			responsible: c.responsible
				? `${c.responsible.first_name} ${c.responsible.last_name}`
				: "Nieprzypisany",
			email: c.email || "",
			phone: c.phone || "",
			notes: c.notes || "",
			createdAt: c.created_at.toISOString(),
		}));

		res.json(formattedContacts);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania kontaktów:", error);
		res.status(500).json({ error: "Nie udało się pobrać kontaktów" });
	}
});

app.post("/api/social/members", authMiddleware, async (req: any, res) => {
	try {
		const { user_id, role } = req.body;

		if (!user_id || !role) {
			return res.status(400).json({ error: "user_id i role są wymagane" });
		}

		const user = await prisma.user.findUnique({
			where: { id: parseInt(user_id) },
		});

		if (!user) {
			return res.status(404).json({ error: "Użytkownik nie istnieje" });
		}

		const existing = await prisma.socialMediaMember.findUnique({
			where: { user_id: parseInt(user_id) },
		});

		if (existing) {
			return res
				.status(400)
				.json({ error: "Użytkownik już jest członkiem social media" });
		}

		const member = await prisma.socialMediaMember.create({
			data: {
				user_id: parseInt(user_id),
				role: role,
				is_active: true,
			},
			include: {
				user: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
						email: true,
						phone: true,
						province: true,
						team: true,
					},
				},
			},
		});

		const formattedMember = {
			id: member.id.toString(),
			user_id: member.user_id.toString(),
			firstName: member.user.first_name,
			lastName: member.user.last_name,
			role: member.role,
			email: member.user.email,
			phone: member.user.phone || "",
			province: member.user.province || "",
			team: member.user.team || "",
			joinDate: member.created_at.toISOString().split("T")[0],
			active: member.is_active,
		};

		res.status(201).json(formattedMember);
	} catch (error) {
		// 		logger.error("❌ Błąd dodawania członka:", error);
		res.status(500).json({ error: "Nie udało się dodać członka" });
	}
});

app.post("/api/social/publications", authMiddleware, async (req: any, res) => {
	try {
		const {
			title,
			platform,
			type,
			responsible_id,
			due_date,
			status,
			description,
		} = req.body;

		if (!title || !platform || !type || !responsible_id || !due_date) {
			return res
				.status(400)
				.json({ error: "Wszystkie wymagane pola muszą być wypełnione" });
		}

		const publication = await prisma.publication.create({
			data: {
				title,
				platform,
				type,
				responsible_id: parseInt(responsible_id),
				due_date: new Date(due_date),
				status: status || "idea",
				description: description || "",
			},
			include: {
				responsible: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
					},
				},
			},
		});

		const formattedPublication = {
			id: publication.id.toString(),
			title: publication.title,
			platform: publication.platform,
			type: publication.type,
			responsible: publication.responsible
				? `${publication.responsible.first_name} ${publication.responsible.last_name}`
				: "Nieprzypisany",
			dueDate: publication.due_date.toISOString().split("T")[0],
			status: publication.status,
			description: publication.description || "",
			createdAt: publication.created_at.toISOString(),
		};

		res.status(201).json(formattedPublication);
	} catch (error) {
		// 		logger.error("❌ Błąd dodawania publikacji:", error);
		res.status(500).json({ error: "Nie udało się dodać publikacji" });
	}
});

app.put(
	"/api/social/publications/:id",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { id } = req.params;
			const {
				title,
				platform,
				type,
				responsible_id,
				due_date,
				status,
				description,
			} = req.body;

			const publication = await prisma.publication.update({
				where: { id: parseInt(id) },
				data: {
					title,
					platform,
					type,
					responsible_id: parseInt(responsible_id),
					due_date: new Date(due_date),
					status,
					description: description || "",
				},
				include: {
					responsible: {
						select: {
							id: true,
							first_name: true,
							last_name: true,
						},
					},
				},
			});

			const formattedPublication = {
				id: publication.id.toString(),
				title: publication.title,
				platform: publication.platform,
				type: publication.type,
				responsible: publication.responsible
					? `${publication.responsible.first_name} ${publication.responsible.last_name}`
					: "Nieprzypisany",
				dueDate: publication.due_date.toISOString().split("T")[0],
				status: publication.status,
				description: publication.description || "",
				createdAt: publication.created_at.toISOString(),
			};

			res.json(formattedPublication);
		} catch (error) {
			// 			logger.error("❌ Błąd aktualizacji publikacji:", error);
			res.status(500).json({ error: "Nie udało się zaktualizować publikacji" });
		}
	},
);

app.delete(
	"/api/social/publications/:id",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { id } = req.params;
			await prisma.publication.delete({
				where: { id: parseInt(id) },
			});
			res.status(204).send();
		} catch (error) {
			// 			logger.error("❌ Błąd usuwania publikacji:", error);
			res.status(500).json({ error: "Nie udało się usunąć publikacji" });
		}
	},
);

app.post("/api/onboarding/save", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		// 		logger.debug(
		// 	`📝 [ONBOARDING] Zapisywanie danych dla użytkownika ${userId}`,
		// );
		// 		logger.debug("📝 [ONBOARDING] Dane:", req.body);

		const {
			firstName,
			lastName,
			email,
			phone,
			province,
			joinDate,
			isTrial,
			developmentAreas,
			skills,
			experience,
			availability,
			description,
			salaContacts,
			mpContacts,
			institutionContacts,
			otherContacts,
			pillarIds,
		} = req.body;

		const existing = await prisma.onboarding_data.findFirst({
			where: { user_id: userId },
			orderBy: { created_at: "desc" },
		});

		// 🔥 ZADEKLARUJ onboarding TUTAJ (przed if/else)
		let onboarding: any = null;

		const data = {
			first_name: firstName || "",
			last_name: lastName || "",
			email: email || "",
			phone: phone || null,
			province: province || "",
			development_areas: JSON.stringify(developmentAreas || []),
			skills: JSON.stringify(skills || []),
			experience: experience || "none",
			availability: availability || "",
			description: description || "",
			sala_contacts: JSON.stringify(salaContacts || []),
			mp_contacts: JSON.stringify(mpContacts || []),
			institution_contacts: JSON.stringify(institutionContacts || []),
			other_contacts: JSON.stringify(otherContacts || []),
			completed: true,
		};

		if (existing) {
			onboarding = await prisma.onboarding_data.update({
				where: { id: existing.id },
				data: {
					...data,
					updated_at: new Date(),
				},
			});
			// 			logger.debug(
			// 	`✅ [ONBOARDING] Zaktualizowano onboarding dla użytkownika ${userId}`,
			// );
		} else {
			onboarding = await prisma.onboarding_data.create({
				data: {
					user_id: userId,
					...data,
					created_at: new Date(),
				},
			});
			// 			logger.debug(
			// 	`✅ [ONBOARDING] Utworzono onboarding dla użytkownika ${userId}`,
			// );
		}

		// Aktualizacja danych użytkownika
		await prisma.user.update({
			where: { id: userId },
			data: {
				first_name: firstName,
				last_name: lastName,
				email: email,
				phone: phone || null,
				province: province || null,
				join_date: joinDate ? new Date(joinDate) : null,
				is_trial: isTrial || false,
			},
		});

		// 		logger.debug(`✅ [ONBOARDING] Zaktualizowano dane użytkownika ${userId}`);

		// ============================================================
		// 🔥 AKTUALIZACJA FILARÓW
		// ============================================================
		if (pillarIds && Array.isArray(pillarIds) && pillarIds.length > 0) {
			// 			logger.debug(
			// 	`📋 [ONBOARDING] Dodawanie użytkownika ${userId} do filarów:`,
			// 	pillarIds,
			// );

			// 1. Pobierz nazwy filarów
			const teams = await prisma.team.findMany({
				where: {
					id: { in: pillarIds },
				},
				select: { id: true, name: true },
			});

			const pillarNames = teams
				.map((t: any) => t.name.replace("Filar ", ""))
				.join(", ");

			// 			logger.debug(`📋 [ONBOARDING] Nazwy filarów: ${pillarNames}`);

			// 2. ZAKTUALIZUJ pole pillars w tabeli users
			await prisma.user.update({
				where: { id: userId },
				data: {
					pillars: pillarNames,
				},
			});

			// 			logger.debug(
			// 	`✅ [ONBOARDING] Zaktualizowano pole pillars dla użytkownika ${userId}: ${pillarNames}`,
			// );

			// 3. Pobierz obecne członkostwa użytkownika w filarach
			const currentMemberships = await prisma.teamMember.findMany({
				where: {
					user_id: userId,
					team: {
						name: { contains: "Filar" },
					},
				},
				select: { team_id: true },
			});

			const currentTeamIds = currentMemberships.map((m: any) => m.team_id);
			const newTeamIds = pillarIds;

			// 4. Usuń te, których nie ma w nowej liście
			const toRemove = currentTeamIds.filter(
				(id: number) => !newTeamIds.includes(id),
			);

			if (toRemove.length > 0) {
				await prisma.teamMember.deleteMany({
					where: {
						user_id: userId,
						team_id: { in: toRemove },
					},
				});
				// 				logger.debug(
				// 	`🗑️ [ONBOARDING] Usunięto z filarów: ${toRemove.join(", ")}`,
				// );
			}

			// 5. Dodaj nowe członkostwa
			const existingMemberships = await prisma.teamMember.findMany({
				where: {
					user_id: userId,
					team_id: { in: newTeamIds },
				},
				select: { team_id: true },
			});

			const existingMembershipIds = existingMemberships.map(
				(m: any) => m.team_id,
			);
			const toAdd = newTeamIds.filter(
				(id: number) => !existingMembershipIds.includes(id),
			);

			if (toAdd.length > 0) {
				await prisma.teamMember.createMany({
					data: toAdd.map((teamId: number) => ({
						user_id: userId,
						team_id: teamId,
						role: "Członek",
						is_leader: false,
					})),
				});
				// 				logger.debug(
				// 	`✅ [ONBOARDING] Dodano ${toAdd.length} rekordów do team_members`,
				// );
			}
		} else {
			// Jeśli użytkownik odznaczył wszystkie filary - wyczyść pole pillars
			await prisma.user.update({
				where: { id: userId },
				data: {
					pillars: null,
				},
			});
			// 			logger.debug(
			// 	`✅ [ONBOARDING] Wyczyszczono pole pillars dla użytkownika ${userId}`,
			// );

			// Usuń wszystkie członkostwa w filarach
			await prisma.teamMember.deleteMany({
				where: {
					user_id: userId,
					team: {
						name: { contains: "Filar" },
					},
				},
			});
			// 			logger.debug(
			// 	`🗑️ [ONBOARDING] Usunięto wszystkie członkostwa w filarach dla użytkownika ${userId}`,
			// );
		}

		// Powiadomienie
		try {
			const fullName = `${firstName || ""} ${lastName || ""}`.trim();

			const existingNotification = await prisma.notification.findFirst({
				where: {
					user_id: userId,
					title: "Witaj w panelu członka Siły Młodych!",
					created_at: {
						gte: new Date(Date.now() - 60000),
					},
				},
			});

			if (!existingNotification) {
				await prisma.notification.create({
					data: {
						user_id: userId,
						title: "Witaj w panelu członka Siły Młodych!",
						message: `Witaj w panelu członka Siły Młodych. Miłego korzystania!`,
						type: "success",
						read: false,
						link: "/dashboard",
						target: "user",
						created_at: new Date(),
					},
				});
				// 				logger.debug(
				// 	`✅ [ONBOARDING] Utworzono powiadomienie dla użytkownika ${userId}`,
				// );
			}
		} catch (notificationError) {
			// 			logger.error(
			// 	"⚠️ [ONBOARDING] Błąd tworzenia powiadomienia:",
			// 	notificationError,
			// );
		}

		res.status(200).json({
			success: true,
			message: "Dane onboardingu zapisane",
			onboardingId: onboarding?.id || null,
		});
	} catch (error) {
		// 		logger.error("❌ [ONBOARDING] Błąd zapisu:", error);
		// 		logger.error(
		// 	"❌ [ONBOARDING] Szczegóły:",
		// 	error instanceof Error ? error.stack : "",
		// );
		res.status(500).json({
			error: "Nie udało się zapisać danych onboardingu",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

app.get("/api/social/members/check", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		const member = await prisma.socialMediaMember.findFirst({
			where: { user_id: userId },
		});

		res.json({ isMember: !!member });
	} catch (error) {
		// 		logger.error("❌ Błąd sprawdzania członkostwa social media:", error);
		res.status(500).json({ error: "Błąd serwera" });
	}
});

app.post("/api/social/materials", authMiddleware, async (req: any, res) => {
	try {
		const { name, description, responsible_id, deadline, priority, stage } =
			req.body;

		if (!name || !responsible_id || !deadline) {
			return res
				.status(400)
				.json({ error: "Nazwa, osoba odpowiedzialna i termin są wymagane" });
		}

		const material = await prisma.material.create({
			data: {
				name,
				description: description || "",
				responsible_id: parseInt(responsible_id),
				deadline: new Date(deadline),
				priority: priority || "medium",
				stage: stage || "ideas",
			},
			include: {
				responsible: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
					},
				},
			},
		});

		const formattedMaterial = {
			id: material.id.toString(),
			name: material.name,
			description: material.description || "",
			responsible: material.responsible
				? `${material.responsible.first_name} ${material.responsible.last_name}`
				: "Nieprzypisany",
			deadline: material.deadline.toISOString().split("T")[0],
			priority: material.priority,
			stage: material.stage,
			createdAt: material.created_at.toISOString(),
		};

		res.status(201).json(formattedMaterial);
	} catch (error) {
		// 		logger.error("❌ Błąd dodawania materiału:", error);
		res.status(500).json({ error: "Nie udało się dodać materiału" });
	}
});

app.put("/api/social/materials/:id", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const { name, description, responsible_id, deadline, priority, stage } =
			req.body;

		if (!name || !responsible_id || !deadline) {
			return res
				.status(400)
				.json({ error: "Nazwa, osoba odpowiedzialna i termin są wymagane" });
		}

		const material = await prisma.material.update({
			where: { id: parseInt(id) },
			data: {
				name,
				description: description || "",
				responsible_id: parseInt(responsible_id),
				deadline: new Date(deadline),
				priority: priority || "medium",
				stage: stage || "ideas",
			},
			include: {
				responsible: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
					},
				},
			},
		});

		const formattedMaterial = {
			id: material.id.toString(),
			name: material.name,
			description: material.description || "",
			responsible: material.responsible
				? `${material.responsible.first_name} ${material.responsible.last_name}`
				: "Nieprzypisany",
			deadline: material.deadline.toISOString().split("T")[0],
			priority: material.priority,
			stage: material.stage,
			createdAt: material.created_at.toISOString(),
		};

		res.json(formattedMaterial);
	} catch (error) {
		// 		logger.error("❌ Błąd aktualizacji materiału:", error);
		res.status(500).json({ error: "Nie udało się zaktualizować materiału" });
	}
});

app.delete(
	"/api/social/materials/:id",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { id } = req.params;
			await prisma.material.delete({
				where: { id: parseInt(id) },
			});
			res.status(204).send();
		} catch (error) {
			// 			logger.error("❌ Błąd usuwania materiału:", error);
			res.status(500).json({ error: "Nie udało się usunąć materiału" });
		}
	},
);

app.post("/api/social/tasks", authMiddleware, async (req: any, res) => {
	try {
		const { name, description, responsible_id, deadline, status } = req.body;

		if (!name || !responsible_id || !deadline) {
			return res
				.status(400)
				.json({ error: "Nazwa, osoba odpowiedzialna i termin są wymagane" });
		}

		const task = await prisma.socialTask.create({
			data: {
				name,
				description: description || "",
				responsible_id: parseInt(responsible_id),
				deadline: new Date(deadline),
				status: status || "pending",
			},
			include: {
				responsible: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
					},
				},
			},
		});

		const formattedTask = {
			id: task.id.toString(),
			name: task.name,
			description: task.description || "",
			responsible: task.responsible
				? `${task.responsible.first_name} ${task.responsible.last_name}`
				: "Nieprzypisany",
			deadline: task.deadline.toISOString().split("T")[0],
			status: task.status,
			createdAt: task.created_at.toISOString(),
		};

		res.status(201).json(formattedTask);
	} catch (error) {
		// 		logger.error("❌ Błąd dodawania zadania:", error);
		res.status(500).json({ error: "Nie udało się dodać zadania" });
	}
});

app.put("/api/social/tasks/:id", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const { name, description, responsible_id, deadline, status } = req.body;

		const task = await prisma.socialTask.update({
			where: { id: parseInt(id) },
			data: {
				name,
				description: description || "",
				responsible_id: parseInt(responsible_id),
				deadline: new Date(deadline),
				status,
			},
			include: {
				responsible: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
					},
				},
			},
		});

		const formattedTask = {
			id: task.id.toString(),
			name: task.name,
			description: task.description || "",
			responsible: task.responsible
				? `${task.responsible.first_name} ${task.responsible.last_name}`
				: "Nieprzypisany",
			deadline: task.deadline.toISOString().split("T")[0],
			status: task.status,
			createdAt: task.created_at.toISOString(),
		};

		res.json(formattedTask);
	} catch (error) {
		// 		logger.error("❌ Błąd aktualizacji zadania:", error);
		res.status(500).json({ error: "Nie udało się zaktualizować zadania" });
	}
});

app.delete("/api/social/tasks/:id", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		await prisma.socialTask.delete({
			where: { id: parseInt(id) },
		});
		res.status(204).send();
	} catch (error) {
		// 		logger.error("❌ Błąd usuwania zadania:", error);
		res.status(500).json({ error: "Nie udało się usunąć zadania" });
	}
});

app.post("/api/social/contacts", authMiddleware, async (req: any, res) => {
	try {
		const { name, channel, responsible_id, email, phone, notes } = req.body;

		if (!name || !channel || !responsible_id) {
			return res
				.status(400)
				.json({ error: "Nazwa, kanał i osoba odpowiedzialna są wymagane" });
		}

		const contact = await prisma.mediaContact.create({
			data: {
				name,
				channel,
				responsible_id: parseInt(responsible_id),
				email: email || "",
				phone: phone || "",
				notes: notes || "",
			},
			include: {
				responsible: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
					},
				},
			},
		});

		const formattedContact = {
			id: contact.id.toString(),
			name: contact.name,
			channel: contact.channel,
			responsible: contact.responsible
				? `${contact.responsible.first_name} ${contact.responsible.last_name}`
				: "Nieprzypisany",
			email: contact.email || "",
			phone: contact.phone || "",
			notes: contact.notes || "",
			createdAt: contact.created_at.toISOString(),
		};

		res.status(201).json(formattedContact);
	} catch (error) {
		// 		logger.error("❌ Błąd dodawania kontaktu:", error);
		res.status(500).json({ error: "Nie udało się dodać kontaktu" });
	}
});

app.put("/api/social/contacts/:id", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const { name, channel, responsible_id, email, phone, notes } = req.body;

		const contact = await prisma.mediaContact.update({
			where: { id: parseInt(id) },
			data: {
				name,
				channel,
				responsible_id: parseInt(responsible_id),
				email: email || "",
				phone: phone || "",
				notes: notes || "",
			},
			include: {
				responsible: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
					},
				},
			},
		});

		const formattedContact = {
			id: contact.id.toString(),
			name: contact.name,
			channel: contact.channel,
			responsible: contact.responsible
				? `${contact.responsible.first_name} ${contact.responsible.last_name}`
				: "Nieprzypisany",
			email: contact.email || "",
			phone: contact.phone || "",
			notes: contact.notes || "",
			createdAt: contact.created_at.toISOString(),
		};

		res.json(formattedContact);
	} catch (error) {
		// 		logger.error("❌ Błąd aktualizacji kontaktu:", error);
		res.status(500).json({ error: "Nie udało się zaktualizować kontaktu" });
	}
});

app.delete(
	"/api/social/contacts/:id",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { id } = req.params;
			await prisma.mediaContact.delete({
				where: { id: parseInt(id) },
			});
			res.status(204).send();
		} catch (error) {
			// 			logger.error("❌ Błąd usuwania kontaktu:", error);
			res.status(500).json({ error: "Nie udało się usunąć kontaktu" });
		}
	},
);

function getDefaultPermissions(role: string): string[] {
	const defaults: Record<string, string[]> = {
		admin: [
			"canViewAllLeaves",
			"canApproveLeaves",
			"canRejectLeaves",
			"canEditAllLeaves",
			"canDeleteAllLeaves",
			"canViewAllUsers",
			"canEditUsers",
			"canDeleteUsers",
			"canManageProjects",
			"canManageVacancies",
			"canEditVacancies",
			"canDeleteVacancies",
			"canCreateVacancies",
			"canViewVacancies",
			"canApplyVacancies",
			"canViewApplications",
			"canEditApplications",
			"canManageGuides",
			"canViewAllNotifications",
			"canManageTeams",
			"canViewStructure",
			"canEditProfile",
		],
		board: [
			"canViewAllLeaves",
			"canApproveLeaves",
			"canRejectLeaves",
			"canViewAllUsers",
			"canManageProjects",
			"canManageVacancies",
			"canEditVacancies",
			"canCreateVacancies",
			"canViewVacancies",
			"canApplyVacancies",
			"canViewApplications",
			"canEditApplications",
			"canViewAllNotifications",
			"canViewStructure",
			"canEditProfile",
		],
		zarząd: [
			"canViewAllLeaves",
			"canApproveLeaves",
			"canRejectLeaves",
			"canViewAllUsers",
			"canManageProjects",
			"canManageVacancies",
			"canEditVacancies",
			"canCreateVacancies",
			"canViewVacancies",
			"canApplyVacancies",
			"canViewApplications",
			"canEditApplications",
			"canViewAllNotifications",
			"canViewStructure",
			"canEditProfile",
		],
		coordinator: [
			"canManageProjects",
			"canViewVacancies",
			"canApplyVacancies",
			"canViewApplications",
			"canViewStructure",
			"canEditProfile",
		],
		member: [
			"canViewVacancies",
			"canApplyVacancies",
			"canViewApplications",
			"canViewStructure",
			"canEditProfile",
		],
	};
	return defaults[role] || [];
}

app.get(
	"/api/admin/permissions/:role",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { role } = req.params;

			const roleData = await prisma.roles.findFirst({
				where: {
					name: role,
				},
				select: {
					id: true,
					name: true,
					permissions: true,
				},
			});

			if (!roleData) {
				const defaultPermissions = getDefaultPermissions(role);
				return res.json({
					role,
					permissions: defaultPermissions,
					fromDefault: true,
				});
			}

			let permissions: string[] = [];
			try {
				permissions =
					typeof roleData.permissions === "string"
						? JSON.parse(roleData.permissions)
						: roleData.permissions || [];
			} catch (e) {
				permissions = [];
			}

			res.json({
				role: roleData.name,
				permissions,
				fromDefault: false,
			});
		} catch (error) {
			// 			logger.error("❌ Błąd pobierania uprawnień:", error);

			const defaultPermissions = getDefaultPermissions(req.params.role);
			res.json({
				role: req.params.role,
				permissions: defaultPermissions,
				fromDefault: true,
			});
		}
	},
);

app.get("/api/admin/roles", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;

		if (userRole !== "admin") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		const roles = await prisma.roles.findMany({
			select: {
				id: true,
				name: true,
				description: true,
				permissions: true,
			},
			orderBy: {
				id: "asc",
			},
		});

		const formattedRoles = roles.map((r: any) => {
			let permissions: string[] = [];
			try {
				permissions =
					typeof r.permissions === "string"
						? JSON.parse(r.permissions)
						: r.permissions || [];
			} catch (e) {
				permissions = [];
			}
			return {
				id: r.id.toString(),
				name: r.name,
				description: r.description || "",
				permissions,
			};
		});

		res.json(formattedRoles);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania ról:", error);
		res.status(500).json({ error: "Nie udało się pobrać ról" });
	}
});

app.put(
	"/api/admin/roles/:id/permissions",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userRole = req.user?.role;
			const roleId = parseInt(req.params.id);
			const { permissions } = req.body;

			if (userRole !== "admin") {
				return res.status(403).json({ error: "Brak uprawnień" });
			}

			const existing = await prisma.roles.findUnique({
				where: { id: roleId },
			});

			if (!existing) {
				return res.status(404).json({ error: "Rola nie istnieje" });
			}

			const updated = await prisma.roles.update({
				where: { id: roleId },
				data: {
					permissions: JSON.stringify(permissions),
					updated_at: new Date(),
				},
				select: {
					id: true,
					name: true,
					description: true,
					permissions: true,
				},
			});

			let parsedPermissions: string[] = [];
			try {
				parsedPermissions =
					typeof updated.permissions === "string"
						? JSON.parse(updated.permissions)
						: updated.permissions || [];
			} catch (e) {
				parsedPermissions = [];
			}

			res.json({
				success: true,
				message: "Uprawnienia zaktualizowane",
				role: {
					id: updated.id.toString(),
					name: updated.name,
					description: updated.description,
					permissions: parsedPermissions,
				},
			});
		} catch (error) {
			// 			logger.error("❌ Błąd aktualizacji uprawnień:", error);
			res.status(500).json({ error: "Nie udało się zaktualizować uprawnień" });
		}
	},
);

app.post("/api/admin/roles", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;
		const { name, description, permissions } = req.body;

		if (userRole !== "admin") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		if (!name) {
			return res.status(400).json({ error: "Nazwa roli jest wymagana" });
		}

		const existing = await prisma.roles.findFirst({
			where: { name },
		});

		if (existing) {
			return res.status(400).json({ error: "Rola o tej nazwie już istnieje" });
		}

		const newRole = await prisma.roles.create({
			data: {
				name,
				description: description || "",
				permissions: JSON.stringify(permissions || []),
				created_at: new Date(),
			},
			select: {
				id: true,
				name: true,
				description: true,
				permissions: true,
			},
		});

		let parsedPermissions: string[] = [];
		try {
			parsedPermissions =
				typeof newRole.permissions === "string"
					? JSON.parse(newRole.permissions)
					: newRole.permissions || [];
		} catch (e) {
			parsedPermissions = [];
		}

		res.status(201).json({
			success: true,
			message: "Rola utworzona",
			role: {
				id: newRole.id.toString(),
				name: newRole.name,
				description: newRole.description,
				permissions: parsedPermissions,
			},
		});
	} catch (error) {
		// 		logger.error("❌ Błąd tworzenia roli:", error);
		res.status(500).json({ error: "Nie udało się utworzyć roli" });
	}
});

app.delete("/api/admin/roles/:id", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;
		const roleId = parseInt(req.params.id);

		if (userRole !== "admin") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		const existing = await prisma.roles.findUnique({
			where: { id: roleId },
		});

		if (!existing) {
			return res.status(404).json({ error: "Rola nie istnieje" });
		}

		if (existing.name === "admin") {
			return res.status(400).json({ error: "Nie można usunąć roli admin" });
		}

		await prisma.roles.delete({
			where: { id: roleId },
		});

		res.json({
			success: true,
			message: "Rola usunięta",
		});
	} catch (error) {
		// 		logger.error("❌ Błąd usuwania roli:", error);
		res.status(500).json({ error: "Nie udało się usunąć roli" });
	}
});

app.get("/api/admin/teams", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;

		if (userRole !== "admin") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		const teams = await prisma.team.findMany({
			where: {
				status: "active",
			},
			include: {
				members: {
					include: {
						user: {
							select: {
								id: true,
								first_name: true,
								last_name: true,
								email: true,
								functional_role: true,
								province: true,
							},
						},
					},
				},
			},
			orderBy: {
				name: "asc",
			},
		});

		const formattedTeams = teams.map((team: any) => ({
			id: team.id.toString(),
			name: team.name,
			description: team.description || "",
			role: team.role || "Zespół",
			icon: team.icon || "Users",
			status: team.status || "active",
			parent_id: team.parent_id?.toString() || null,
			email: team.email || null,
			created_at: team.created_at,
			members: team.members.map((m: any) => ({
				id: m.id.toString(),
				user_id: m.user_id.toString(),
				team_id: m.team_id.toString(),
				first_name: m.user.first_name,
				last_name: m.user.last_name,
				email: m.user.email,
				functional_role: m.user.functional_role || "",
				province: m.user.province || "",
				role_in_team: m.role || "Członek",
				is_leader: m.is_leader || false,
			})),
		}));

		res.json(formattedTeams);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania zespołów:", error);
		res.status(500).json({ error: "Nie udało się pobrać zespołów" });
	}
});

app.put("/api/admin/teams/:id", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;
		const teamId = parseInt(req.params.id);

		if (userRole !== "admin") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		const { name, description, role, icon, email, parent_id, status } =
			req.body;

		const team = await prisma.team.update({
			where: { id: teamId },
			data: {
				name: name || undefined,
				description: description !== undefined ? description : undefined,
				role: role || undefined,
				icon: icon || undefined,
				email: email !== undefined ? email : undefined,
				parent_id: parent_id ? parseInt(parent_id) : null,
				status: status || undefined,
			},
		});

		res.json({
			id: team.id.toString(),
			name: team.name,
			description: team.description || "",
			role: team.role || "Zespół",
			icon: team.icon || "Users",
			status: team.status,
			email: team.email,
			parent_id: team.parent_id?.toString() || null,
		});
	} catch (error) {
		// 		logger.error("❌ Błąd edycji zespołu:", error);
		res.status(500).json({ error: "Nie udało się edytować zespołu" });
	}
});

app.post("/api/admin/teams", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;

		if (userRole !== "admin") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		const { name, description, role, icon, email, parent_id } = req.body;

		if (!name) {
			return res.status(400).json({ error: "Nazwa zespołu jest wymagana" });
		}

		const team = await prisma.team.create({
			data: {
				name,
				description: description || "",
				role: role || "Zespół",
				icon: icon || "Users",
				status: "active",
				email: email || null,
				parent_id: parent_id ? parseInt(parent_id) : null,
			},
		});

		res.status(201).json({
			id: team.id.toString(),
			name: team.name,
			description: team.description || "",
			role: team.role || "Zespół",
			icon: team.icon || "Users",
			status: team.status,
			email: team.email,
			parent_id: team.parent_id?.toString() || null,
			created_at: team.created_at,
			members: [],
		});
	} catch (error) {
		// 		logger.error("❌ Błąd tworzenia zespołu:", error);
		res.status(500).json({ error: "Nie udało się utworzyć zespołu" });
	}
});

app.delete("/api/admin/teams/:id", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;
		const teamId = parseInt(req.params.id);

		if (userRole !== "admin") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		const team = await prisma.team.findUnique({
			where: { id: teamId },
		});

		if (!team) {
			return res.status(404).json({ error: "Zespół nie istnieje" });
		}

		await prisma.team.update({
			where: { id: teamId },
			data: { status: "inactive" },
		});

		res.json({ success: true, message: "Zespół usunięty" });
	} catch (error) {
		// 		logger.error("❌ Błąd usuwania zespołu:", error);
		res.status(500).json({ error: "Nie udało się usunąć zespołu" });
	}
});

app.post("/api/admin/team-members", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;

		if (userRole !== "admin") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		const { team_id, user_id, role, is_leader } = req.body;

		if (!team_id || !user_id) {
			return res.status(400).json({ error: "team_id i user_id są wymagane" });
		}

		const user = await prisma.user.findUnique({
			where: { id: parseInt(user_id) },
		});

		if (!user) {
			return res.status(404).json({ error: "Użytkownik nie istnieje" });
		}

		const team = await prisma.team.findUnique({
			where: { id: parseInt(team_id) },
		});

		if (!team) {
			return res.status(404).json({ error: "Zespół nie istnieje" });
		}

		const existing = await prisma.teamMember.findFirst({
			where: {
				team_id: parseInt(team_id),
				user_id: parseInt(user_id),
			},
		});

		if (existing) {
			return res
				.status(400)
				.json({ error: "Użytkownik już jest w tym zespole" });
		}

		const teamMember = await prisma.teamMember.create({
			data: {
				team_id: parseInt(team_id),
				user_id: parseInt(user_id),
				role: role || "Członek",
				is_leader: is_leader || false,
			},
			include: {
				user: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
						email: true,
						functional_role: true,
						province: true,
					},
				},
			},
		});

		res.status(201).json({
			id: teamMember.id.toString(),
			team_id: teamMember.team_id.toString(),
			user_id: teamMember.user_id.toString(),
			first_name: teamMember.user.first_name,
			last_name: teamMember.user.last_name,
			email: teamMember.user.email,
			functional_role: teamMember.user.functional_role || "",
			province: teamMember.user.province || "",
			role_in_team: teamMember.role || "Członek",
			is_leader: teamMember.is_leader || false,
		});
	} catch (error) {
		// 		logger.error("❌ Błąd dodawania członka do zespołu:", error);
		res.status(500).json({ error: "Nie udało się dodać członka do zespołu" });
	}
});

app.delete(
	"/api/admin/team-members/:id",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userRole = req.user?.role;
			const memberId = parseInt(req.params.id);

			if (userRole !== "admin") {
				return res.status(403).json({ error: "Brak uprawnień" });
			}

			const teamMember = await prisma.teamMember.findUnique({
				where: { id: memberId },
			});

			if (!teamMember) {
				return res
					.status(404)
					.json({ error: "Nie znaleziono członka w zespole" });
			}

			await prisma.teamMember.delete({
				where: { id: memberId },
			});

			res.json({ success: true, message: "Usunięto członka z zespołu" });
		} catch (error) {
			// 			logger.error("❌ Błąd usuwania członka z zespołu:", error);
			res.status(500).json({ error: "Nie udało się usunąć członka z zespołu" });
		}
	},
);

app.put(
	"/api/admin/team-members/:id",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userRole = req.user?.role;
			const memberId = parseInt(req.params.id);

			if (userRole !== "admin") {
				return res.status(403).json({ error: "Brak uprawnień" });
			}

			const { role, is_leader } = req.body;

			const teamMember = await prisma.teamMember.update({
				where: { id: memberId },
				data: {
					role: role || undefined,
					is_leader: is_leader !== undefined ? is_leader : undefined,
				},
				include: {
					user: {
						select: {
							id: true,
							first_name: true,
							last_name: true,
							email: true,
							functional_role: true,
							province: true,
						},
					},
				},
			});

			res.json({
				id: teamMember.id.toString(),
				team_id: teamMember.team_id.toString(),
				user_id: teamMember.user_id.toString(),
				first_name: teamMember.user.first_name,
				last_name: teamMember.user.last_name,
				email: teamMember.user.email,
				functional_role: teamMember.user.functional_role || "",
				province: teamMember.user.province || "",
				role_in_team: teamMember.role || "Członek",
				is_leader: teamMember.is_leader || false,
			});
		} catch (error) {
			// 			logger.error("❌ Błąd zmiany roli członka:", error);
			res.status(500).json({ error: "Nie udało się zmienić roli" });
		}
	},
);
app.get("/api/tasks/:id", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const taskId = parseInt(id);
		if (isNaN(taskId)) {
			return res.status(400).json({ error: "Nieprawidłowe ID zadania" });
		}

		const task = await prisma.task.findUnique({
			where: { id: taskId },
			include: {
				assignedTo: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
						email: true,
					},
				},
				createdBy: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
						email: true,
					},
				},
				project: {
					select: {
						id: true,
						name: true,
						pillar: true,
					},
				},
				comments: {
					include: {
						user: {
							select: {
								id: true,
								first_name: true,
								last_name: true,
							},
						},
					},
				},
			},
		});

		if (!task) {
			return res.status(404).json({ error: "Nie znaleziono zadania" });
		}

		res.json(task);
	} catch (error) {
		logger.error("❌ Błąd pobierania zadania:", error);
		res.status(500).json({ error: "Nie udało się pobrać zadania" });
	}
});
app.get("/api/tasks", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		const userRole = req.user?.role;

		let whereCondition: any = {};

		if (
			userRole !== "admin" &&
			userRole !== "board" &&
			userRole !== "coordinator"
		) {
			whereCondition = { assigned_to: userId };
		}

		const tasks = await prisma.task.findMany({
			where: whereCondition,
			include: {
				assignedTo: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
						email: true,
					},
				},
				createdBy: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
						email: true,
					},
				},
				project: {
					select: {
						id: true,
						name: true,
						pillar: true,
					},
				},
				comments: {
					include: {
						user: {
							select: {
								id: true,
								first_name: true,
								last_name: true,
							},
						},
					},
				},
			},
			orderBy: {
				created_at: "desc",
			},
		});

		const mappedTasks = tasks.map((task: any) => ({
			id: task.id.toString(),
			title: task.title,
			description: task.description,
			status: task.status || "todo",
			priority: task.priority || "medium",
			assignedTo: task.assigned_to?.toString() || "",
			assignedToName: task.assignedTo
				? `${task.assignedTo.first_name || ""} ${task.assignedTo.last_name || ""}`.trim()
				: "Nieprzypisany",
			createdBy: task.created_by?.toString() || "",
			createdByName: task.createdBy
				? `${task.createdBy.first_name || ""} ${task.createdBy.last_name || ""}`.trim()
				: "Nieznany",
			projectId: task.project_id?.toString() || null,
			projectName: task.project?.name || null,
			projectPillar: task.project?.pillar || null,
			dueDate: task.due_date?.toISOString() || "",
			createdAt: task.created_at.toISOString(),
			updatedAt: task.updated_at.toISOString(),
			tags: task.tags ? JSON.parse(task.tags) : [],
			requiresFeedback: task.requires_feedback || false,
			feedbackType: task.feedback_type || "text",
			feedbackText: task.feedback_text || null,
			feedbackFile: task.feedback_file || null,
			feedbackFileName: task.feedback_file_name || null,
			feedbackFileSize: task.feedback_file_size || null,
			feedbackFileType: task.feedback_file_type || null,
			feedbackSubmittedAt: task.feedback_submitted_at?.toISOString() || null,
			attachments: task.attachments ? JSON.parse(task.attachments) : [],
			comments:
				task.comments?.map((c: any) => ({
					id: c.id.toString(),
					userId: c.user_id.toString(),
					userName: c.user
						? `${c.user.first_name || ""} ${c.user.last_name || ""}`.trim()
						: "Nieznany",
					content: c.content,
					createdAt: c.created_at.toISOString(),
				})) || [],
		}));

		res.json(mappedTasks);
	} catch (error) {
		logger.error("❌ Błąd pobierania zadań:", error);
		res.status(500).json({ error: "Nie udało się pobrać zadań" });
	}
});

// POST /api/tasks - utwórz nowe zadanie
app.post("/api/tasks", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		const {
			title,
			description,
			status,
			priority,
			assignedTo,
			assignedUsers, // 🔥 DODAJ - ODBIERZ Z REQUESTU
			projectId,
			dueDate,
			tags,
			requiresFeedback,
			feedbackType,
		} = req.body;

		if (!title || !description || !assignedTo || !dueDate) {
			return res
				.status(400)
				.json({ error: "Wszystkie wymagane pola muszą być wypełnione" });
		}

		const task = await prisma.task.create({
			data: {
				title,
				description,
				status: status || "todo",
				priority: priority || "medium",
				assigned_to: parseInt(assignedTo),
				assigned_users: assignedUsers ? JSON.stringify(assignedUsers) : null, // 🔥 DODAJ
				created_by: parseInt(userId),
				project_id: projectId ? parseInt(projectId) : null,
				due_date: new Date(dueDate),
				tags: tags ? JSON.stringify(tags) : null,
				requires_feedback: requiresFeedback || false,
				feedback_type: feedbackType || "text",
			},
		});

		res.status(201).json({
			id: task.id.toString(),
			title: task.title,
			description: task.description,
			status: task.status,
			priority: task.priority,
			assignedTo: task.assigned_to.toString(),
			createdBy: task.created_by.toString(),
			projectId: task.project_id?.toString() || null,
			dueDate: task.due_date.toISOString(),
			createdAt: task.created_at.toISOString(),
			updatedAt: task.updated_at.toISOString(),
			tags: task.tags ? JSON.parse(task.tags) : [],
			requiresFeedback: task.requires_feedback || false,
			feedbackType: task.feedback_type || "text",
		});
	} catch (error) {
		logger.error("❌ Błąd tworzenia zadania:", error);
		res.status(500).json({ error: "Nie udało się utworzyć zadania" });
	}
});

app.put("/api/tasks/:id", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const userId = req.user?.id;
		const userRole = req.user?.role;
		const {
			title,
			description,
			status,
			priority,
			assignedTo,
			assignedUsers, // 🔥 DODAJ
			projectId,
			dueDate,
			tags,
			requiresFeedback,
			feedbackType,
		} = req.body;

		console.log("📥 [BACKEND] PUT /api/tasks/", id);
		console.log("📥 [BACKEND] Nowy status:", status);

		const taskId = parseInt(id);
		if (isNaN(taskId)) {
			return res.status(400).json({ error: "Nieprawidłowe ID zadania" });
		}

		const existingTask = await prisma.task.findUnique({
			where: { id: taskId },
		});

		if (!existingTask) {
			return res.status(404).json({ error: "Nie znaleziono zadania" });
		}

		console.log("📥 [BACKEND] Obecny status:", existingTask.status);

		const canEdit =
			userRole === "admin" ||
			userRole === "board" ||
			userRole === "coordinator" ||
			existingTask.assigned_to === parseInt(userId);

		if (!canEdit) {
			return res
				.status(403)
				.json({ error: "Brak uprawnień do edycji tego zadania" });
		}

		// 🔥 PEŁNA LOGIKA AKTUALIZACJI
		const task = await prisma.task.update({
			where: { id: taskId },
			data: {
				title: title || existingTask.title,
				description: description || existingTask.description,
				status: status || existingTask.status,
				priority: priority || existingTask.priority,
				assigned_to: assignedTo
					? parseInt(assignedTo)
					: existingTask.assigned_to,
				assigned_users:
					assignedUsers !== undefined
						? JSON.stringify(assignedUsers)
						: existingTask.assigned_users,
				project_id:
					projectId !== undefined
						? projectId
							? parseInt(projectId)
							: null
						: existingTask.project_id,
				due_date: dueDate ? new Date(dueDate) : existingTask.due_date,
				tags: tags ? JSON.stringify(tags) : existingTask.tags,
				requires_feedback:
					requiresFeedback !== undefined
						? requiresFeedback
						: existingTask.requires_feedback,
				feedback_type: feedbackType || existingTask.feedback_type,
				updated_at: new Date(),
			},
		});

		console.log(
			"✅ [BACKEND] Zaktualizowano zadanie:",
			task.id,
			"→",
			task.status,
		);

		res.json({
			id: task.id.toString(),
			title: task.title,
			description: task.description,
			status: task.status,
			priority: task.priority,
			assignedTo: task.assigned_to.toString(),
			createdBy: task.created_by.toString(),
			projectId: task.project_id?.toString() || null,
			dueDate: task.due_date.toISOString(),
			createdAt: task.created_at.toISOString(),
			updatedAt: task.updated_at.toISOString(),
			tags: task.tags ? JSON.parse(task.tags) : [],
			requiresFeedback: task.requires_feedback || false,
			feedbackType: task.feedback_type || "text",
		});
	} catch (error) {
		console.error("❌ [BACKEND] Błąd aktualizacji zadania:", error);
		res.status(500).json({ error: "Nie udało się zaktualizować zadania" });
	}
});
// POST /api/tasks/:id/feedback - dodaj odpowiedź zwrotną (z plikiem)
app.post(
	"/api/tasks/:id/feedback",
	authMiddleware,
	tasksUpload.single("file"), // 🔥 OBSŁUGA PLIKU
	async (req: any, res) => {
		try {
			const { id } = req.params;
			const userId = req.user?.id;
			const { feedbackText } = req.body;
			const file = req.file;

			console.log("📥 [FEEDBACK] Zadanie ID:", id);
			console.log("📥 [FEEDBACK] Typ:", file ? "plik" : "tekst");

			const task = await prisma.task.findUnique({
				where: { id: parseInt(id) },
			});

			if (!task) {
				return res.status(404).json({ error: "Nie znaleziono zadania" });
			}

			// Sprawdź czy użytkownik jest przypisany do zadania
			if (task.assigned_to !== parseInt(userId)) {
				return res.status(403).json({
					error: "Tylko osoba przypisana może dodać odpowiedź",
				});
			}

			// Sprawdź czy zadanie wymaga odpowiedzi
			if (!task.requires_feedback) {
				return res.status(400).json({
					error: "To zadanie nie wymaga odpowiedzi zwrotnej",
				});
			}

			// Sprawdź czy odpowiedź już została dodana
			if (task.feedback_submitted_at) {
				return res.status(400).json({
					error: "Odpowiedź zwrotna została już dodana",
				});
			}

			const updateData: any = {
				feedback_submitted_at: new Date(),
			};

			// Obsługa odpowiedzi tekstowej
			if (task.feedback_type === "text") {
				if (!feedbackText || !feedbackText.trim()) {
					return res.status(400).json({
						error: "Odpowiedź tekstowa jest wymagana",
					});
				}
				updateData.feedback_text = feedbackText.trim();
			}
			// Obsługa odpowiedzi w formie pliku
			else if (task.feedback_type === "file") {
				if (!file) {
					return res.status(400).json({
						error: "Plik z odpowiedzią jest wymagany",
					});
				}
				updateData.feedback_file = `/uploads/tasks/${file.filename}`;
				updateData.feedback_file_name = Buffer.from(
					file.originalname,
					"latin1",
				).toString("utf8");
				updateData.feedback_file_size = file.size;
				updateData.feedback_file_type = file.mimetype;
			}

			const updatedTask = await prisma.task.update({
				where: { id: parseInt(id) },
				data: updateData,
			});

			console.log("✅ [FEEDBACK] Odpowiedź dodana dla zadania:", id);

			res.json({
				success: true,
				message: "Odpowiedź zwrotna została dodana",
				feedbackText: updatedTask.feedback_text,
				feedbackFile: updatedTask.feedback_file,
				feedbackFileName: updatedTask.feedback_file_name,
				feedbackSubmittedAt: updatedTask.feedback_submitted_at?.toISOString(),
			});
		} catch (error) {
			console.error("❌ [FEEDBACK] Błąd:", error);

			// Jeśli był upload i jest błąd, usuń plik
			if (req.file) {
				const filePath = path.join(tasksUploadDir, req.file.filename);
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			}

			res.status(500).json({
				error: "Nie udało się dodać odpowiedzi zwrotnej",
				details: error instanceof Error ? error.message : "Unknown error",
			});
		}
	},
);
// DELETE /api/tasks/:id - usuń zadanie
app.delete("/api/tasks/:id", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const userRole = req.user?.role;

		const taskId = parseInt(id);
		if (isNaN(taskId)) {
			return res.status(400).json({ error: "Nieprawidłowe ID zadania" });
		}

		if (
			userRole !== "admin" &&
			userRole !== "board" &&
			userRole !== "coordinator"
		) {
			return res
				.status(403)
				.json({ error: "Brak uprawnień do usuwania zadań" });
		}

		await prisma.task.delete({
			where: { id: taskId },
		});

		res.status(204).send();
	} catch (error) {
		logger.error("❌ Błąd usuwania zadania:", error);
		res.status(500).json({ error: "Nie udało się usunąć zadania" });
	}
});
app.get("/api/admin/available-users", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;

		if (userRole !== "admin") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		const users = await prisma.user.findMany({
			where: {
				is_active: true,

				role_id: { not: 1 },
			},
			select: {
				id: true,
				first_name: true,
				last_name: true,
				email: true,
				functional_role: true,
				province: true,
				team_members: {
					select: {
						team_id: true,
					},
				},
			},
			orderBy: {
				first_name: "asc",
			},
		});

		const formattedUsers = users.map((user: any) => ({
			id: user.id.toString(),
			first_name: user.first_name,
			last_name: user.last_name,
			email: user.email,
			functional_role: user.functional_role || "",
			province: user.province || "",
			team_ids: user.team_members.map((tm: any) => tm.team_id.toString()),
		}));

		res.json(formattedUsers);
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania użytkowników:", error);
		res.status(500).json({ error: "Nie udało się pobrać użytkowników" });
	}
});

app.get("/api/admin/logs", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;

		if (userRole !== "admin") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 15;
		const search = (req.query.search as string) || "";
		const category = (req.query.category as string) || "";
		const action = (req.query.action as string) || "";
		const status = (req.query.status as string) || "";

		const skip = (page - 1) * limit;

		const where: any = {};

		if (category && category !== "all") {
			where.category = category;
		}
		if (action && action !== "all") {
			where.action_type = action;
		}
		if (status && status !== "all") {
			where.status = status;
		}
		if (search) {
			where.OR = [
				{ user_name: { contains: search } },
				{ entity_name: { contains: search } },
				{ endpoint: { contains: search } },
				{ user_email: { contains: search } },
			];
		}

		const logs = await prisma.systemLog.findMany({
			where,
			orderBy: { created_at: "desc" },
			skip,
			take: limit,
		});

		const total = await prisma.systemLog.count({ where });

		res.json({
			logs: logs.map((log: any) => ({
				...log,
				id: log.id.toString(),
			})),
			total,
			page,
			totalPages: Math.ceil(total / limit),
			limit,
		});
	} catch (error) {
		// 		logger.error("❌ Błąd pobierania logów:", error);
		res.status(500).json({ error: "Nie udało się pobrać logów" });
	}
});
cron.schedule("0 1,17 * * *", async () => {
	// 	logger.debug("🔄 [CRON] Uruchamiam synchronizację składek...");
	try {
		await syncContributions();
		// 		logger.debug("✅ [CRON] Synchronizacja składek zakończona");
	} catch (error) {
		// 		logger.error("❌ [CRON] Błąd synchronizacji składek:", error);
	}
});

// Opcjonalnie: uruchom przy starcie
setTimeout(async () => {
	// 	logger.debug(
	// 	"🔄 [STARTUP] Uruchamiam synchronizację składek przy starcie...",
	// );
	try {
		await syncContributions();
		// 		logger.debug("✅ [STARTUP] Synchronizacja składek zakończona");
	} catch (error) {
		// 		logger.error("❌ [STARTUP] Błąd synchronizacji składek:", error);
	}
}, 15000);
setTimeout(async () => {
	// 	logger.debug(
	// 	"🔄 [STARTUP] Uruchamiam synchronizację frekwencji przy starcie...",
	// );
	try {
		await syncAttendance();
		// 		logger.debug("✅ [STARTUP] Synchronizacja frekwencji zakończona");
	} catch (error) {
		// 		logger.error("❌ [STARTUP] Błąd synchronizacji frekwencji:", error);
	}
}, 10000);
setTimeout(async () => {
	// 	logger.debug(
	// 	"🔄 [STARTUP] Uruchamiam synchronizację członków przy starcie serwera...",
	// );
	try {
		await syncMembers();
		// 		logger.debug("✅ [STARTUP] Synchronizacja członków zakończona");
	} catch (error) {
		// 		logger.error("❌ [STARTUP] Błąd synchronizacji:", error);
	}
}, 5000);
// server.ts - dodaj przed app.listen()
// Na backendzie:
app.post(
	"/api/notifications/task-created",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { userId, taskId, taskTitle, createdBy } = req.body;

			// 🔥 OBSŁUGA TABLICY
			const userIds = Array.isArray(userId) ? userId : [userId];

			for (const uid of userIds) {
				await prisma.notification.create({
					data: {
						user_id: parseInt(uid),
						title: "Nowe zadanie",
						message: `${createdBy} przypisał/a Ci zadanie: "${taskTitle}"`,
						type: "info",
						read: false,
						link: `/tasks/${taskId}`,
						target: "user",
						created_at: new Date(),
					},
				});
			}

			res.json({ success: true, count: userIds.length });
		} catch (error) {
			console.error("❌ Błąd tworzenia powiadomień:", error);
			res.status(500).json({ error: "Nie udało się utworzyć powiadomień" });
		}
	},
);

// server.ts - dodaj przed app.listen()
app.post("/api/tasks/recurring", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		const {
			title,
			description,
			status,
			priority,
			assignedTo,
			assignedUsers,
			projectId,
			dueDate,
			tags,
			requiresFeedback,
			feedbackType,
			recurrencePattern,
			recurrenceEndDate,
			assignedType,
			assignedGroup,
		} = req.body;

		// Stwórz zadanie główne
		const parentTask = await prisma.task.create({
			data: {
				title,
				description,
				status: status || "todo",
				priority: priority || "medium",
				assigned_to: parseInt(assignedTo),
				created_by: parseInt(userId),
				project_id: projectId ? parseInt(projectId) : null,
				due_date: new Date(dueDate),
				tags: tags ? JSON.stringify(tags) : null,
				requires_feedback: requiresFeedback || false,
				feedback_type: feedbackType || "text",
				assigned_type: assignedType || "user",
				assigned_group: assignedGroup || null,
				is_recurring: true,
				recurrence_pattern: recurrencePattern || "weekly",
				recurrence_end_date: new Date(recurrenceEndDate),
			},
		});

		// Generuj zadania potomne
		const childTasks = [];
		const startDate = new Date(dueDate);
		const endDate = new Date(recurrenceEndDate);
		let currentDate = new Date(startDate);
		let count = 0;

		while (currentDate <= endDate && count < 100) {
			// max 100 zadań
			count++;
			// Przesuń datę o odpowiedni interwał
			if (recurrencePattern === "daily") {
				currentDate.setDate(currentDate.getDate() + 1);
			} else if (recurrencePattern === "weekly") {
				currentDate.setDate(currentDate.getDate() + 7);
			} else if (recurrencePattern === "monthly") {
				currentDate.setMonth(currentDate.getMonth() + 1);
			}

			if (currentDate > endDate) break;

			const childTask = await prisma.task.create({
				data: {
					title: `${title} (${currentDate.toLocaleDateString("pl-PL")})`,
					description,
					status: "todo",
					priority: priority || "medium",
					assigned_to: parseInt(assignedTo),
					created_by: parseInt(userId),
					project_id: projectId ? parseInt(projectId) : null,
					due_date: new Date(currentDate),
					tags: tags ? JSON.stringify(tags) : null,
					requires_feedback: requiresFeedback || false,
					feedback_type: feedbackType || "text",
					assigned_type: assignedType || "user",
					assigned_group: assignedGroup || null,
					parent_task_id: parentTask.id,
					is_recurring: false,
				},
			});
			childTasks.push(childTask);
		}

		res.status(201).json({
			parent: parentTask,
			children: childTasks,
			count: childTasks.length,
		});
	} catch (error) {
		console.error("❌ Błąd tworzenia zadania cyklicznego:", error);
		res
			.status(500)
			.json({ error: "Nie udało się utworzyć zadania cyklicznego" });
	}
});

// server.ts - dodaj przed app.listen()

// GET /api/tasks/:taskId/comments
app.get(
	"/api/tasks/:taskId/comments",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { taskId } = req.params;

			const comments = await prisma.taskComment.findMany({
				where: { task_id: parseInt(taskId) },
				include: {
					user: {
						select: {
							id: true,
							first_name: true,
							last_name: true,
							email: true,
						},
					},
				},
				orderBy: { created_at: "asc" },
			});

			res.json(
				comments.map((c) => ({
					id: c.id.toString(),
					taskId: c.task_id.toString(),
					userId: c.user_id.toString(),
					userName: c.user
						? `${c.user.first_name || ""} ${c.user.last_name || ""}`.trim()
						: "Nieznany",
					content: c.content,
					createdAt: c.created_at.toISOString(),
				})),
			);
		} catch (error) {
			console.error("❌ Błąd pobierania komentarzy:", error);
			res.status(500).json({ error: "Nie udało się pobrać komentarzy" });
		}
	},
);

// POST /api/tasks/:taskId/comments
app.post(
	"/api/tasks/:taskId/comments",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { taskId } = req.params;
			const userId = req.user?.id;
			const { content } = req.body;

			if (!content || !content.trim()) {
				return res.status(400).json({ error: "Komentarz nie może być pusty" });
			}

			const comment = await prisma.taskComment.create({
				data: {
					task_id: parseInt(taskId),
					user_id: parseInt(userId),
					content: content.trim(),
				},
				include: {
					user: {
						select: {
							id: true,
							first_name: true,
							last_name: true,
							email: true,
						},
					},
				},
			});

			res.status(201).json({
				id: comment.id.toString(),
				taskId: comment.task_id.toString(),
				userId: comment.user_id.toString(),
				userName: comment.user
					? `${comment.user.first_name || ""} ${comment.user.last_name || ""}`.trim()
					: "Nieznany",
				content: comment.content,
				createdAt: comment.created_at.toISOString(),
			});
		} catch (error) {
			console.error("❌ Błąd dodawania komentarza:", error);
			res.status(500).json({ error: "Nie udało się dodać komentarza" });
		}
	},
);

// DELETE /api/comments/:id
app.delete("/api/comments/:id", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const userId = req.user?.id;
		const userRole = req.user?.role;

		const comment = await prisma.taskComment.findUnique({
			where: { id: parseInt(id) },
		});

		if (!comment) {
			return res.status(404).json({ error: "Nie znaleziono komentarza" });
		}

		const canDelete =
			userRole === "admin" ||
			userRole === "board" ||
			comment.user_id === parseInt(userId);

		if (!canDelete) {
			return res
				.status(403)
				.json({ error: "Brak uprawnień do usunięcia komentarza" });
		}

		await prisma.taskComment.delete({
			where: { id: parseInt(id) },
		});

		res.status(204).send();
	} catch (error) {
		console.error("❌ Błąd usuwania komentarza:", error);
		res.status(500).json({ error: "Nie udało się usunąć komentarza" });
	}
});
// ============================================================
// 🆕 ENDPOINT: Sprawdza czy użytkownik jest liderem (koordynatorem)
// ============================================================
app.get(
	"/api/user/is-coordinator",
	authMiddleware,
	async (req: any, res: any) => {
		try {
			const userId = req.user?.id;

			if (!userId) {
				return res.status(401).json({ error: "Brak autoryzacji" });
			}

			// 			logger.debug(`🔍 Sprawdzanie czy użytkownik ${userId} jest liderem...`);

			// Sprawdź czy użytkownik jest liderem w jakimkolwiek zespole
			const teamMember = await prisma.teamMember.findFirst({
				where: {
					user_id: parseInt(userId),
					is_leader: true,
				},
				include: {
					team: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			});

			if (teamMember) {
				// 				logger.debug(
				// 	`✅ Użytkownik ${userId} jest liderem w zespole: ${teamMember.team?.name}`,
				// );

				// Pobierz wszystkie zespoły gdzie jest liderem
				const allLeaderTeams = await prisma.teamMember.findMany({
					where: {
						user_id: parseInt(userId),
						is_leader: true,
					},
					include: {
						team: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				});

				// 🔥 POPRAWA: Dodajemy typ dla parametru 'tm'
				const leaderTeams = allLeaderTeams
					.filter((tm: any) => tm.team?.name?.includes("Filar"))
					.map((tm: any) => ({
						id: tm.team_id,
						name: tm.team?.name?.replace("Filar ", "") || tm.team?.name,
						fullName: tm.team?.name,
					}));

				return res.json({
					isCoordinator: true,
					isLeader: true,
					leaderTeams: leaderTeams,
					allLeaderTeams: allLeaderTeams.map((tm: any) => ({
						id: tm.team_id,
						name: tm.team?.name,
					})),
				});
			}

			// Sprawdź czy użytkownik ma rolę admin - admin też ma uprawnienia
			const user = await prisma.user.findUnique({
				where: { id: parseInt(userId) },
				select: { role_id: true },
			});

			if (user?.role_id === 1) {
				// admin
				// 				logger.debug(`👑 Użytkownik ${userId} jest administratorem`);
				return res.json({
					isCoordinator: true,
					isLeader: true,
					isAdmin: true,
					leaderTeams: [],
					allLeaderTeams: [],
				});
			}

			// 			logger.debug(`❌ Użytkownik ${userId} NIE jest liderem`);
			res.json({
				isCoordinator: false,
				isLeader: false,
				leaderTeams: [],
				allLeaderTeams: [],
			});
		} catch (error) {
			// 			logger.error("❌ Błąd sprawdzania lidera:", error);
			res.status(500).json({
				error: "Nie udało się sprawdzić uprawnień",
				details: error instanceof Error ? error.message : "Unknown error",
			});
		}
	},
);

app.listen(port, () => {});
