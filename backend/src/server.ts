// backend/src/server.ts
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { ProjectController } from "./controllers/project.controller";
import { UserController } from "./controllers/user.controller";
import { authMiddleware } from "./middleware/auth.middleware";
import memberRoutes from "./routes/member.routes";
import cron from "node-cron";
import { updateLeaveStatus } from "./jobs/updateLeaveStatus";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import multer from "multer";
import { syncMembers } from "./jobs/syncMembers";

updateLeaveStatus();
cron.schedule("1 0 * * *", async () => {
	console.log("⏰ [CRON] Uruchamiam codzienny job aktualizacji statusów...");
	await updateLeaveStatus();
});

cron.schedule("0 3 */2 * *", async () => {
	console.log("🔄 [CRON] Uruchamiam synchronizację członków z SM_Ewidencja...");
	await syncMembers();
	console.log("✅ [CRON] Synchronizacja członków zakończona");
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
// ⭐ ZASTĄP UUID PROSTSZYM GENERATOREM
function generateId(): string {
	return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET =
	process.env.JWT_SECRET || "your-secret-key-here-change-in-production";

const prisma = new PrismaClient() as any;

// ============================================================
// ⭐ KONFIGURACJA MULTER DO OBSŁUGI PLIKÓW
// ============================================================

const uploadDir = path.join(__dirname, "uploads/tutorials");
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}
// ============================================================
// ⭐ MIDDLEWARE DO AUTOMATYCZNEGO LOGOWANIA
// ============================================================

// Dodaj to w server.ts po definicji prisma i przed endpointami

// Funkcja do wyciągania nazwy encji z odpowiedzi
// Funkcja do wyciągania nazwy encji z odpowiedzi
function getEntityName(body: any): string | null {
	if (!body) return null;

	// ⭐ DLA ODPOWIEDZI DELETE
	if (body.id && body.success) {
		return `Usunięto ${body.id}`;
	}
	if (body.id && body.message && body.message.includes("usunięty")) {
		return body.message;
	}

	// Standardowe pola
	if (body.name) return body.name;
	if (body.title) return body.title;
	if (body.first_name && body.last_name)
		return `${body.first_name} ${body.last_name}`;
	if (body.userName) return body.userName;
	if (body.email) return body.email;
	if (body.message) {
		// Spróbuj wyciągnąć nazwę z message
		const match = body.message.match(/Urlop (.*?) \(/);
		if (match) return match[1];
		return body.message;
	}

	return null;
}

// Funkcja do wyciągania ID encji z odpowiedzi
function getEntityId(body: any): string | null {
	if (!body) return null;
	if (body.id) return body.id.toString();
	if (body.data?.id) return body.data.id.toString();
	if (body.leave?.id) return body.leave.id.toString();
	if (body.user?.id) return body.user.id.toString();
	if (body.team?.id) return body.team.id.toString();
	return null;
}
// Funkcja do określania kategorii na podstawie URL
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
// ============================================================
// ⭐ FUNKCJA DO LOGOWANIA AKCJI
// ============================================================

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
		console.log(
			`🔍 [logAction] START - ${actionType} ${category} ${entityName || "unknown"}`,
		);

		// ⭐ SPRAWDŹ CZY PRISMA MA MODEL systemLog
		if (!prisma.systemLog) {
			console.warn("⚠️ [logAction] Model systemLog nie istnieje w Prisma!");
			return;
		}

		const userId = req.user?.id || 0;
		const userName =
			req.user?.first_name && req.user?.last_name
				? `${req.user.first_name} ${req.user.last_name}`
				: req.user?.email || "System";
		const userRole = req.user?.role || "unknown";

		console.log(
			`🔍 [logAction] Dane: userId=${userId}, userName=${userName}, userRole=${userRole}`,
		);

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

		console.log(
			`🔍 [logAction] Dane do zapisu:`,
			JSON.stringify(data, null, 2),
		);

		const result = await prisma.systemLog.create({
			data: data,
		});

		console.log(`✅ [logAction] Zapisano log ID: ${result.id}`);
	} catch (error) {
		console.error("❌ [logAction] Błąd zapisu loga:", error);
		console.error(
			"❌ [logAction] Stack:",
			error instanceof Error ? error.stack : "No stack",
		);
	}
}

// ⭐ MIDDLEWARE - AUTOMATYCZNIE LOGUJE WSZYSTKIE OPERACJE

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
		fileSize: 10 * 1024 * 1024, // 10MB
		files: 5,
	},
	fileFilter: fileFilter,
});

// ============================================================
// ⭐ MIDDLEWARE - AUTOMATYCZNIE LOGUJE WSZYSTKIE OPERACJE ZAPISU
// ============================================================

app.use(async (req: any, res: any, next: any) => {
	console.log(`🔍 [MIDDLEWARE] ${req.method} ${req.originalUrl}`);

	const originalJson = res.json;
	const originalStatus = res.status;
	const originalSend = res.send;
	const originalEnd = res.end;

	let statusCode = 200;
	let responseBody: any = null;
	let hasLogged = false;
	let responseSent = false;

	res.status = function (code: number) {
		console.log(`🔍 [MIDDLEWARE] res.status: ${code}`);
		statusCode = code;
		return originalStatus.call(this, code);
	};

	res.json = function (body: any) {
		console.log(`🔍 [MIDDLEWARE] res.json wywołane`);
		console.log(`🔍 [MIDDLEWARE] body:`, body);
		responseBody = body;
		responseSent = true;

		const method = req.method;
		const isWriteOperation = ["POST", "PUT", "DELETE", "PATCH"].includes(
			method,
		);

		console.log(
			`🔍 [MIDDLEWARE] method: ${method}, isWriteOperation: ${isWriteOperation}, hasLogged: ${hasLogged}`,
		);

		if (isWriteOperation && !hasLogged) {
			hasLogged = true;
			console.log(`🔍 [MIDDLEWARE] LOGUJĘ!`);

			let actionType: LogActionType = "CREATE";
			if (method === "PUT" || method === "PATCH") actionType = "UPDATE";
			if (method === "DELETE") actionType = "DELETE";

			const category = getCategoryFromUrl(req.originalUrl || req.url || "");
			const entityId = getEntityId(responseBody);
			const entityName = getEntityName(responseBody);

			console.log(
				`🔍 [MIDDLEWARE] actionType: ${actionType}, category: ${category}, entityId: ${entityId}, entityName: ${entityName}`,
			);

			let changes = null;
			if (method === "POST" || method === "PUT" || method === "PATCH") {
				changes = { ...req.body };
				delete changes.password;
				delete changes.password_hash;
				delete changes.token;
			}

			const logStatus = statusCode < 400 ? "success" : "error";
			const errorMessage = statusCode >= 400 ? `Status ${statusCode}` : null;

			console.log(`🔍 [MIDDLEWARE] Wywołuję logAction...`);
			logAction(
				req,
				actionType,
				category,
				entityId || null,
				entityName || "unknown",
				changes,
				logStatus,
				errorMessage,
			).catch((err) => console.error("❌ [MIDDLEWARE] Błąd logowania:", err));
		}

		return originalJson.call(this, body);
	};

	// ⭐ DODAJ OBSŁUGĘ res.send
	res.send = function (body: any) {
		console.log(`🔍 [MIDDLEWARE] res.send wywołane`);
		if (!responseSent) {
			responseBody = body;
			responseSent = true;
			// ... podobna logika jak w res.json
		}
		return originalSend.call(this, body);
	};

	next();
});
// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⭐ STATYCZNE PLIKI (do pobierania załączników)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================================================
// FUNKCJE POMOCNICZE
// ============================================================
function mapRoleId(roleId: number | null): string {
	const roleMap: Record<number, string> = {
		1: "admin", // ✅ admin
		2: "board", // zarząd
		3: "coordinator", // koordynator
		4: "member", // ✅ member
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

// ============================================================
// KONTROLERY
// ============================================================
const projectController = new ProjectController();
const userController = new UserController();

// ============================================================
// LOGOWANIE
// ============================================================
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
		console.error("❌ Błąd logowania:", error);
		res.status(500).json({ error: "Wystąpił błąd podczas logowania" });
	}
});

// REJESTRACJA
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
				is_active: 1,
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
		console.error("❌ Błąd rejestracji:", error);
		res.status(500).json({ error: "Wystąpił błąd podczas rejestracji" });
	}
});

// ============================================================
// ENDPOINTY ZABEZPIECZONE
// ============================================================

// SPRAWDZANIE ONBOARDINGU
// backend/src/server.ts

app.get(
	"/api/auth/onboarding-status",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({ error: "Brak autoryzacji" });
			}

			console.log(`🔍 Sprawdzam onboarding dla użytkownika ${userId}`);
			console.log(`👤 Rola użytkownika: ${req.user?.role}`);

			// ⭐ ADMIN POBIERA ONBOARDING
			if (req.user?.role === "admin") {
				console.log(`👑 Admin ${userId} - pomijam onboarding, zwracam true`);
				return res.json({ completed: true });
			}

			const onboarding = await prisma.onboarding_data.findFirst({
				where: { user_id: userId },
				orderBy: { created_at: "desc" },
			});

			if (!onboarding) {
				console.log(`📋 Użytkownik ${userId} NIE ma onboardingu`);
				return res.json({ completed: false });
			}

			const isCompleted = !!onboarding.completed;

			console.log(`📋 Użytkownik ${userId} - completed: ${isCompleted}`);
			console.log(`   - wartość w bazie: ${onboarding.completed}`);
			console.log(`   - typ: ${typeof onboarding.completed}`);

			res.json({ completed: isCompleted });

		} catch (error) {
			console.error("❌ Błąd sprawdzania onboardingu:", error);
			res.json({ completed: false });
		}
	},
);
// ============================================================
// POMYSŁY (IDEAS)
// ============================================================

// 📥 GET - pobierz wszystkie pomysły
// 📥 GET - pobierz wszystkie pomysły z głosami
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
		console.error("❌ Błąd pobierania pomysłów:", error);
		res.status(500).json({ error: "Nie udało się pobrać pomysłów" });
	}
});

// 📤 POST - dodaj pomysł
// 📤 POST - dodaj pomysł
// 📤 POST - dodaj pomysł
app.post("/api/ideas", authMiddleware, async (req: any, res) => {
	try {
		const { title, description, pillar, authorId, authorName } = req.body;
		const userId = req.user?.id;

		console.log("📥 Otrzymano pomysł:", {
			title,
			description,
			pillar,
			authorId,
			authorName,
		});

		if (!title || !description || !pillar) {
			return res.status(400).json({ error: "Wszystkie pola są wymagane" });
		}

		// ✅ UTWÓRZ POMYSŁ
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

		console.log("✅ Utworzono pomysł w bazie:", idea);

		// ✅ AUTOMATYCZNIE DODAJ GŁOS UP OD AUTORA
		try {
			await prisma.ideaVote.create({
				data: {
					idea_id: idea.id,
					user_id: parseInt(authorId) || userId,
					vote_type: "up",
				},
			});
			console.log(`⬆️ Automatyczny głos UP od autora (user ${userId})`);
		} catch (voteError) {
			// Jeśli już jest głos (np. duplikat) - pomiń
			console.warn("⚠️ Nie udało się dodać automatycznego głosu:", voteError);
		}

		// ✅ Pobierz liczbę głosów
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
			user_vote: "up", // ✅ Autor ma głos UP
		});
	} catch (error) {
		console.error("❌ Błąd dodawania pomysłu:", error);
		res.status(500).json({
			error: "Nie udało się dodać pomysłu",
			details: error instanceof Error ? error.message : "Nieznany błąd",
		});
	}
});

// 📤 POST - głosuj na pomysł
// 📤 POST - głosuj na pomysł
// 📤 POST - głosuj na pomysł
// 📤 POST - głosuj na pomysł
app.post("/api/ideas/:id/vote", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const userId = req.user?.id;
		const { type } = req.body;

		if (!userId) {
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		// ✅ SPRAWDŹ CZY UŻYTKOWNIK JEST AUTOREM
		const idea = await prisma.idea.findUnique({
			where: { id: parseInt(id) },
		});

		if (!idea) {
			return res.status(404).json({ error: "Nie znaleziono pomysłu" });
		}

		// ✅ BLOKADA: Autor nie może głosować na swój pomysł
		if (idea.author_id === userId) {
			return res.status(403).json({
				error: "Nie możesz głosować na swój własny pomysł",
				votes: await getVoteCounts(parseInt(id)),
			});
		}

		// ✅ Sprawdź czy już głosował
		const existingVote = await prisma.ideaVote.findUnique({
			where: {
				idea_id_user_id: {
					idea_id: parseInt(id),
					user_id: userId,
				},
			},
		});

		// Jeśli głosował na ten sam typ - NIC NIE RÓB
		if (existingVote && existingVote.vote_type === type) {
			return res.json({
				message: "Już zagłosowałeś w ten sposób",
				votes: await getVoteCounts(parseInt(id)),
			});
		}

		// Jeśli głosował na przeciwny typ - usuń stary
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

		// Dodaj nowy głos
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
		console.error("❌ Błąd głosowania:", error);
		res.status(500).json({
			error: "Nie udało się zagłosować",
			details: error instanceof Error ? error.message : "Nieznany błąd",
		});
	}
});

// ✅ FUNKCJA POMOCNICZA
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

// 📝 PUT - zmień status pomysłu
app.put("/api/ideas/:id/status", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;
		const userRole = req.user?.role;

		// Tylko admin lub koordynator może zmieniać status
		if (userRole !== "admin" && userRole !== "coordinator") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		const idea = await prisma.idea.update({
			where: { id: parseInt(id) },
			data: { status },
		});

		res.json(idea);
	} catch (error) {
		console.error("❌ Błąd zmiany statusu:", error);
		res.status(500).json({ error: "Nie udało się zmienić statusu" });
	}
});
// ============================================================
// CZŁONKOWIE (MEMBERS)
// ============================================================
// 📥 GET - pobierz pojedynczy pomysł (opcjonalnie)
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
		console.error("❌ Błąd pobierania pomysłu:", error);
		res.status(500).json({ error: "Nie udało się pobrać pomysłu" });
	}
});
// 📥 GET - pobierz wszystkich członków
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

			// ✅ Pobierz zespoły z team_members
			const teams = user.team_members
				.map((tm: any) => tm.team?.name)
				.filter(Boolean);

			const teamString = teams.length > 0 ? teams.join(", ") : "Brak zespołu";

			// Znajdź aktualny urlop
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
				team: teamString, // ✅ Zespoły z team_members
				team_id: teams.length > 0 ? teams.join("-") : "",
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
		console.error("❌ Błąd pobierania członków:", error);
		res.status(500).json({ error: "Nie udało się pobrać członków" });
	}
});
// PROJEKTY
app.get("/api/projects", authMiddleware, projectController.getAllProjects);
app.get("/api/projects/:id", authMiddleware, projectController.getProjectById);
app.post("/api/projects", authMiddleware, projectController.createProject);
app.put("/api/projects/:id", authMiddleware, projectController.updateProject);
app.delete(
	"/api/projects/:id",
	authMiddleware,
	projectController.deleteProject,
);

// UŻYTKOWNICY
app.get("/api/users", authMiddleware, userController.getAllUsers);

// 📥 GET - pobierz wszystkie zespoły
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
		console.error("❌ Błąd pobierania zespołów:", error);
		res.status(500).json({ error: "Nie udało się pobrać zespołów" });
	}
});
// 📤 POST - utwórz nowy zespół
app.post("/api/teams", authMiddleware, async (req: any, res) => {
	try {
		const { name, role, description, icon, status, parent_id, email } =
			req.body;

		if (!name) {
			return res.status(400).json({ error: "Nazwa zespołu jest wymagana" });
		}

		console.log("📥 Tworzenie zespołu - dane:", {
			name,
			role,
			description,
			icon,
			status,
			parent_id,
			email,
		}); // ⭐ DODAJ LOG

		const team = await prisma.team.create({
			data: {
				name: name,
				role: role || "Zespół",
				description: description || null,
				icon: icon || "Users",
				status: status || "active",
				parent_id: parent_id ? parseInt(parent_id) : null, // ✅ POPRAWIONE
				email: email || null,
			},
		});

		console.log("✅ Utworzono zespół:", team); // ⭐ DODAJ LOG

		res.status(201).json(team);
	} catch (error) {
		console.error("❌ Błąd tworzenia zespołu:", error);
		res.status(500).json({ error: "Nie udało się utworzyć zespołu" });
	}
});
// STATYSTYKI
app.get("/api/dashboard/stats", authMiddleware, async (req: any, res) => {
	try {
		const totalMembers = await prisma.user.count({
			where: {
				is_active: true,
			},
		});
		const totalProjects = await prisma.project.count({
			where: { is_active: 1 },
		});

		res.json({
			members: totalMembers,
			projects: totalProjects,
			attendance: "95%",
			announcements: 0,
			newGuides: 0,
		});
	} catch (error) {
		console.error("❌ Błąd statystyk:", error);
		res.status(500).json({ error: "Nie udało się pobrać statystyk" });
	}
});

// POWIADOMIENIA - POBIERANIE
app.get(
	"/api/dashboard/notifications",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userId = req.user?.id;
			const userRole = req.user?.role;

			if (!userId) {
				return res.status(401).json({ error: "Brak autoryzacji" });
			}

			const limit = parseInt(req.query.limit as string) || 20;

			// ✅ WSZYSCY użytkownicy (w tym admin) widzą TYLKO swoje powiadomienia
			const notifications = await prisma.notification.findMany({
				where: { user_id: userId }, // ⭐ TYLKO DLA ZALOGOWANEGO UŻYTKOWNIKA
				orderBy: { created_at: "desc" },
				take: limit,
			});

			console.log(
				`📨 Znaleziono ${notifications.length} powiadomień dla użytkownika ${userId}`,
			);

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
			console.error("❌ Błąd pobierania powiadomień:", error);
			res.status(500).json({
				error: "Nie udało się pobrać powiadomień",
				details: error instanceof Error ? error.message : "Unknown error",
			});
		}
	},
);

// POWIADOMIENIA - OZNACZ JAKO PRZECZYTANE
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

			console.log(
				`📨 Oznaczanie powiadomienia ${id} jako przeczytane dla użytkownika ${userId}`,
			);

			// ⭐ SPRAWDŹ CZY POWIADOMIENIE ISTNIEJE I NALEŻY DO UŻYTKOWNIKA
			const notification = await prisma.notification.findFirst({
				where: {
					id: id,
					user_id: userId, // ⭐ TYLKO POWIADOMIENIA UŻYTKOWNIKA
				},
			});

			if (!notification) {
				console.log(
					`❌ Powiadomienie ${id} nie istnieje lub nie należy do użytkownika ${userId}`,
				);
				return res.status(404).json({
					error: "Nie znaleziono powiadomienia",
					details: `Powiadomienie ${id} nie istnieje lub nie należy do Ciebie`,
				});
			}

			// ⭐ ZAKTUALIZUJ
			const updated = await prisma.notification.update({
				where: { id: id },
				data: {
					read: true,
					updated_at: new Date(),
				},
			});

			console.log(`✅ Powiadomienie ${id} oznaczone jako przeczytane`);

			res.status(200).json({
				success: true,
				message: "Oznaczono jako przeczytane",
				notification: {
					id: updated.id.toString(),
					read: updated.read,
				},
			});
		} catch (error) {
			console.error("❌ Błąd oznaczania:", error);
			res.status(500).json({
				error: "Nie udało się oznaczyć",
				details: error instanceof Error ? error.message : "Unknown error",
			});
		}
	},
);

// POWIADOMIENIA - OZNACZ WSZYSTKIE
app.put(
	"/api/dashboard/notifications/read-all",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({ error: "Brak autoryzacji" });
			}

			console.log(
				`📨 Oznaczanie wszystkich powiadomień jako przeczytane dla użytkownika ${userId}`,
			);

			// ⭐ TYLKO DLA ZALOGOWANEGO UŻYTKOWNIKA
			const result = await prisma.notification.updateMany({
				where: {
					user_id: userId,
					read: false,
				},
				data: { read: true },
			});

			console.log(`✅ Oznaczono ${result.count} powiadomień jako przeczytane`);

			res.status(200).json({
				success: true,
				message: "Wszystkie oznaczone jako przeczytane",
				count: result.count,
			});
		} catch (error) {
			console.error("❌ Błąd oznaczania wszystkich:", error);
			res.status(500).json({
				error: "Nie udało się oznaczyć wszystkich",
				details: error instanceof Error ? error.message : "Unknown error",
			});
		}
	},
);
// ============================================================
// ⭐ PORADNIKI - Z OBSŁUGĄ PLIKÓW
// ============================================================

// 📥 GET - pobierz wszystkie poradniki
// 📥 GET - pobierz wszystkie poradniki
app.get("/api/tutorials", authMiddleware, async (req: any, res) => {
	try {
		const tutorials = await prisma.guide.findMany({
			where: { is_published: 1 },
			orderBy: { created_at: "desc" },
		});

		const mappedTutorials = tutorials.map((t: any) => {
			// Bezpieczne parsowanie JSON - sprawdź czy to string
			let attachments = [];
			let functionalRoles = [];

			try {
				if (t.attachments && typeof t.attachments === "string") {
					attachments = JSON.parse(t.attachments);
				} else if (t.attachments && typeof t.attachments === "object") {
					attachments = t.attachments; // już jest obiektem
				}
			} catch (e) {
				console.warn(
					`⚠️ Nie udało się sparsować attachments dla tutorial ${t.id}:`,
					e,
				);
				attachments = [];
			}

			try {
				if (t.functional_roles && typeof t.functional_roles === "string") {
					functionalRoles = JSON.parse(t.functional_roles);
				} else if (
					t.functional_roles &&
					typeof t.functional_roles === "object"
				) {
					functionalRoles = t.functional_roles; // już jest obiektem
				}
			} catch (e) {
				console.warn(
					`⚠️ Nie udało się sparsować functional_roles dla tutorial ${t.id}:`,
					e,
				);
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
		console.error("❌ Błąd pobierania poradników:", error);
		res.status(500).json({ error: "Nie udało się pobrać poradników" });
	}
});

// 📤 POST - utwórz poradnik z plikami
app.post(
	"/api/tutorials",
	authMiddleware,
	upload.array("files", 5),
	async (req: any, res) => {
		try {
			console.log("📥 POST /tutorials");
			console.log("📁 Pliki:", req.files?.length || 0);

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

			// Zapisz załączniki
			const attachments: any[] = [];
			const files = req.files as Express.Multer.File[];
			if (files && files.length > 0) {
				for (const file of files) {
					attachments.push({
						id: generateId(),
						name: Buffer.from(file.originalname, "latin1").toString("utf8"), // <-- POPRAWKA
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
			console.error("❌ Błąd tworzenia poradnika:", error);

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
// ============================================================
// APLIKACJE (APPLICATIONS) - DODAJ TEN ENDPOINT
// ============================================================

// ============================================================
// APLIKACJE (APPLICATIONS)
// ============================================================

// 📥 GET - pobierz wszystkie zgłoszenia na wakaty
// 📥 GET - pobierz zgłoszenia na wakaty
app.get("/api/applications", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		const userRole = req.user?.role;

		// ✅ ZWYKŁY UŻYTKOWNIK widzi tylko swoje zgłoszenia
		let whereCondition = {};
		if (userRole === "admin" || userRole === "coordinator") {
			// Admin i koordynator widzą wszystkie
			whereCondition = {};
		} else {
			// Zwykły użytkownik widzi tylko swoje
			whereCondition = { user_id: userId };
		}

		console.log(
			"📥 Pobieranie zgłoszeń dla użytkownika:",
			userId,
			"rola:",
			userRole,
		);

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

		console.log(`✅ Znaleziono ${applications.length} zgłoszeń`);

		// Mapuj dane
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
		console.error("❌ Błąd pobierania zgłoszeń:", error);
		res.status(500).json({
			error: "Nie udało się pobrać zgłoszeń",
			details: error instanceof Error ? error.message : "Nieznany błąd",
		});
	}
});
// ============================================================
// POWIADOMIENIA EMAIL O ZGŁOSZENIU
// ============================================================

app.post("/api/vacancies/:id/notify", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const { applicantName, applicantEmail } = req.body;

		// Pobierz wakat i osobę kontaktową
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
			console.warn("⚠️ Brak emaila kontaktowego dla wakatu:", vacancy.id);
			return res.json({ message: "Brak emaila kontaktowego" });
		}

		// Tutaj możesz dodać wysyłkę emaila przez nodemailer lub inny serwis
		console.log(`
      📧 Powiadomienie email:
      Do: ${contactEmail}
      Temat: Nowe zgłoszenie na stanowisko "${vacancy.title}"
      Wiadomość: ${applicantName} (${applicantEmail}) zgłosił/a się na stanowisko.
    `);

		// Symulacja wysyłki
		// await sendEmail({
		//   to: contactEmail,
		//   subject: `Nowe zgłoszenie na stanowisko "${vacancy.title}"`,
		//   html: `
		//     <h1>Nowe zgłoszenie</h1>
		//     <p>${applicantName} zgłosił/a się na stanowisko "${vacancy.title}".</p>
		//     <p>Email: ${applicantEmail}</p>
		//   `,
		// });

		res.json({ message: "Powiadomienie wysłane" });
	} catch (error) {
		console.error("❌ Błąd wysyłki powiadomienia:", error);
		res.status(500).json({ error: "Nie udało się wysłać powiadomienia" });
	}
});
// 📥 GET - pobierz zgłoszenia na konkretny wakat
app.get(
	"/api/vacancies/:id/applications",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { id } = req.params;
			const userId = req.user?.id;
			const userRole = req.user?.role;

			// Sprawdź czy użytkownik ma dostęp (admin lub koordynator)
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
					applied_at: "desc",
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
			console.error("❌ Błąd pobierania zgłoszeń dla wakatu:", error);
			res.status(500).json({ error: "Nie udało się pobrać zgłoszeń" });
		}
	},
);

// 📝 PUT - zaktualizuj status zgłoszenia
app.put(
	"/api/applications/:id/status",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { id } = req.params;
			const { status } = req.body;
			const userRole = req.user?.role;

			// Tylko admin i koordynator mogą zmieniać status
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
					updated_at: new Date(),
				},
			});

			res.json({
				id: application.id.toString(),
				status: application.status,
			});
		} catch (error) {
			console.error("❌ Błąd aktualizacji statusu zgłoszenia:", error);
			res.status(500).json({ error: "Nie udało się zaktualizować statusu" });
		}
	},
);
// 📝 PUT - aktualizuj poradnik z plikami
app.put(
	"/api/tutorials/:id",
	authMiddleware,
	upload.array("files", 5),
	async (req: any, res) => {
		try {
			const id = parseInt(req.params.id);
			console.log(`📥 PUT /tutorials/${id}`);
			console.log("📁 Pliki:", req.files?.length || 0);

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

			// Zapisz nowe pliki
			const newAttachments: any[] = [];
			const files = req.files as Express.Multer.File[];
			if (files && files.length > 0) {
				for (const file of files) {
					newAttachments.push({
						id: generateId(),
						name: Buffer.from(file.originalname, "latin1").toString("utf8"), // <-- POPRAWKA
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
			console.error("❌ Błąd aktualizacji poradnika:", error);

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

// 🗑️ DELETE - usuń poradnik (razem z plikami)
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
		console.error("❌ Błąd usuwania poradnika:", error);
		res.status(500).json({ error: "Nie udało się usunąć poradnika" });
	}
});

// 🗑️ DELETE - usuń pojedynczy załącznik
app.delete(
	"/api/tutorials/attachments/:id",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { id } = req.params;
			const tutorialId = parseInt(req.query.tutorialId as string);

			console.log(`🗑️ Usuwanie załącznika: ${id} z poradnika: ${tutorialId}`);

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
			console.error("❌ Błąd usuwania załącznika:", error);
			res.status(500).json({ error: "Nie udało się usunąć załącznika" });
		}
	},
);

// 📥 GET - pobierz plik
// 📥 GET - pobierz plik
app.get("/api/uploads/tutorials/:filename", async (req: any, res) => {
	try {
		const { filename } = req.params;
		const filePath = path.join(uploadDir, filename);

		if (!fs.existsSync(filePath)) {
			return res.status(404).json({ error: "Nie znaleziono pliku" });
		}

		// ⭐ DODAJ POPRAWNE NAGŁÓWKI
		const mimeType = getMimeType(filename);
		res.setHeader("Content-Type", mimeType);
		const encodedFileName = encodeURIComponent(filename);
		res.setHeader(
			"Content-Disposition",
			`attachment; filename*=UTF-8''${encodedFileName}`,
		);
		res.sendFile(filePath);
	} catch (error) {
		console.error("❌ Błąd pobierania pliku:", error);
		res.status(500).json({ error: "Nie udało się pobrać pliku" });
	}
});

// ⭐ DODAJ FUNKCJĘ DO OKREŚLANIA TYPU MIME
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
// ============================================================
// WAKATY (VACANCIES)
// ============================================================

// 📥 GET - pobierz wszystkie wakaty
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
		console.error("❌ Błąd pobierania wakatów:", error);
		res.status(500).json({ error: "Nie udało się pobrać wakatów" });
	}
});

// 📤 POST - utwórz nowy wakat
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

		// Dodaj pytania jeśli są
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
		console.error("❌ Błąd tworzenia wakatu:", error);
		res.status(500).json({ error: "Nie udało się utworzyć wakatu" });
	}
});

// 📝 PUT - aktualizuj wakat
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

		// Aktualizuj pytania (usuń stare i dodaj nowe)
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
		console.error("❌ Błąd aktualizacji wakatu:", error);
		res.status(500).json({ error: "Nie udało się zaktualizować wakatu" });
	}
});

// 🗑️ DELETE - usuń wakat (soft delete)
app.delete("/api/vacancies/:id", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;

		await prisma.vacancy.update({
			where: { id: parseInt(id) },
			data: { is_active: false },
		});

		res.status(204).send();
	} catch (error) {
		console.error("❌ Błąd usuwania wakatu:", error);
		res.status(500).json({ error: "Nie udało się usunąć wakatu" });
	}
});

// 📤 POST - zgłoś się na wakat
// 📤 POST - zgłoś się na wakat
app.post("/api/vacancies/:id/apply", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const userId = req.user?.id;
		const { message, answers } = req.body;

		if (!userId) {
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		// Sprawdź czy wakat istnieje i jest aktywny
		const vacancy = await prisma.vacancy.findUnique({
			where: {
				id: parseInt(id),
				is_active: true,
			},
		});

		if (!vacancy) {
			return res.status(404).json({ error: "Nie znaleziono wakatu" });
		}

		// Sprawdź czy już się zgłoszono
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

		// 🔥 UTWÓRZ ZGŁOSZENIE
		const application = await prisma.vacancyApplication.create({
			data: {
				vacancy_id: parseInt(id),
				user_id: userId,
				message: message || null,
				status: "pending",
			},
		});

		// 🔥 DODAJ ODPOWIEDZI NA PYTANIA (jeśli są)
		if (answers && Object.keys(answers).length > 0) {
			// Pobierz pytania dla tego wakatu, żeby sprawdzić które istnieją
			const questions = await prisma.vacancyQuestion.findMany({
				where: {
					vacancy_id: parseInt(id),
				},
				select: {
					id: true,
				},
			});

			const questionIds = questions.map((q: { id: number }) => q.id);

			// Filtruj odpowiedzi tylko dla istniejących pytań
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

		// 🔥 ZWROCĘ ODPOWIEDŹ
		res.status(201).json({
			id: application.id.toString(),
			vacancyId: application.vacancy_id.toString(),
			userId: application.user_id.toString(),
			message: application.message,
			status: application.status,
			appliedAt: new Date().toISOString().split("T")[0],
		});
	} catch (error) {
		console.error("❌ Błąd zgłaszania na wakat:", error);
		res.status(500).json({
			error: "Nie udało się zgłosić na wakat",
			details: error instanceof Error ? error.message : "Nieznany błąd",
		});
	}
});
// 📥 GET - sprawdź czy użytkownik już zgłosił się na wakat
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
			console.error("❌ Błąd sprawdzania zgłoszenia:", error);
			res.status(500).json({ error: "Nie udało się sprawdzić zgłoszenia" });
		}
	},
);
// POWIADOMIENIA - USUŃ
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
			console.error("❌ Błąd usuwania:", error);
			res.status(500).json({ error: "Nie udało się usunąć" });
		}
	},
);

// STRUKTURA
// STRUKTURA
// STRUKTURA
app.get("/api/structure", authMiddleware, async (req: any, res) => {
	try {
		console.log("📥 [STRUCTURE] Pobieranie struktury...");

		const teams = await prisma.team.findMany({
			select: {
				id: true,
				name: true,
				description: true,
				parent_id: true,
				email: true,
			},
		});

		// ✅ Pobierz wszystkich członków zespołów
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

		// ⭐ LISTA NAZW FILARÓW (dla których pokazujemy TYLKO liderów)
		const FILAR_NAMES = [
			"Filar Projektowy",
			"Filar Konferencyjny",
			"Filar Rzeczniczy",
			"Filar Symulacyjny",
		];

		// ⭐ LISTA NAZW ZESPOŁÓW, KTÓRE POKAZUJEMY WSZYSTKICH (niezależnie od is_leader)
		const ALL_MEMBERS_TEAMS = [
			"Zarząd",
			"Siła Młodych",
			"Komisja Rewizyjna",
			"Sąd Koleżeński",
			"Social Media",
		];

		// Grupowanie osób po team_id
		const peopleByTeam: Record<number, any[]> = {};

		teamMembers.forEach((tm: any) => {
			if (!peopleByTeam[tm.team_id]) {
				peopleByTeam[tm.team_id] = [];
			}

			const teamName = tm.team?.name || "";

			// ⭐ LOGIKA FILTROWANIA:
			// 1. Jeśli zespół jest w ALL_MEMBERS_TEAMS → pokaż WSZYSTKICH
			// 2. Jeśli zespół jest w FILAR_NAMES → pokaż TYLKO liderów (is_leader = true)
			// 3. Dla reszty → pokaż WSZYSTKICH (domyślnie)

			let shouldShow = true;

			if (ALL_MEMBERS_TEAMS.includes(teamName)) {
				// Wszyscy członkowie (niezależnie od is_leader)
				shouldShow = true;
			} else if (FILAR_NAMES.includes(teamName)) {
				// Tylko liderzy (is_leader = 1)
				shouldShow = tm.is_leader === true;
			}
			// Dla reszty - wszyscy (domyślnie)

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

		// Budowanie mapy zespołów
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

		// Budowanie drzewa
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
		console.error("❌ [STRUCTURE] Błąd:", error);
		res.status(500).json({ error: "Nie udało się pobrać struktury" });
	}
});
app.use("/api", memberRoutes);
// ============================================================
// PROFIL UŻYTKOWNIKA
// ============================================================

// 📥 GET - pobierz profil użytkownika (swój lub innego)
// 📥 GET - pobierz profil użytkownika (swój lub innego)
// 📥 GET - pobierz profil użytkownika (swój lub innego)
app.get("/api/profile", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		console.log(`📥 Pobieranie profilu dla użytkownika: ${userId}`);

		if (!userId) {
			console.log("❌ Brak userId w req.user");
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
			include: {
				roles: true,
				team_members: { include: { team: true } },
				onboarding_data: { orderBy: { created_at: "desc" }, take: 1 },
			},
		});

		if (!user) {
			console.log(`❌ Użytkownik ${userId} nie znaleziony`);
			return res.status(404).json({ error: "Użytkownik nie znaleziony" });
		}

		console.log(`✅ Profil pobrany dla: ${user.first_name} ${user.last_name}`);

		// Mapowanie danych
		const teams = user.team_members
			.map((tm: any) => tm.team?.name)
			.filter(Boolean);
		const onboarding = user.onboarding_data?.[0] || {};

		// ✅ FILARY - wszystkie
		const pillars = teams.filter((t: string) => t.includes("Filar"));
		const pillar = pillars.length > 0 ? pillars[0] : null;

		console.log("🏷️ TEAMS:", teams); // ✅ DODAJ LOG
		console.log("🏷️ PILLARS:", pillars); // ✅ DODAJ LOG

		const profile = {
			id: user.id.toString(),
			firstName: user.first_name,
			lastName: user.last_name,
			role: mapRoleId(user.role_id),
			function: user.functional_role || "Członek",
			team: teams.length > 0 ? teams.join(", ") : user.team || "Brak zespołu",
			pillar: pillar, // pierwszy filar
			pillars: pillars, // ✅ WSZYSTKIE FILARY - TO MUSI BYĆ!
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
		console.error("❌ Błąd profilu:", error);
		res.status(500).json({ error: "Nie udało się pobrać profilu" });
	}
});
// ============================================================
// URLOPY (LEAVE)
// ============================================================

// 📥 GET - pobierz wszystkie urlopy
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

				// ✅ ZARZĄD widzi WSZYSTKIE wnioski
				// ✅ ADMIN widzi WSZYSTKIE wnioski (tylko podgląd)
				// ✅ KOORDYNATOR widzi tylko swój zespół
				let canView = false;
				if (userRole === "board" || userRole === "admin") {
					canView = true; // Zarząd i Admin widzą wszystko
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
					teams.length > 0 ? teams.join(", ") : user?.team || "Brak zespołu"; // ← zmieniona nazwa

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
		console.error("❌ Błąd pobierania urlopów:", error);
		res.status(500).json({ error: "Nie udało się pobrać urlopów" });
	}
});

// 📤 POST - utwórz nowy wniosek urlopowy
// 📤 POST - utwórz nowy wniosek urlopowy
// 📤 POST - utwórz nowy wniosek urlopowy

app.post("/api/leaves", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Brak autoryzacji" });

		console.log("📥 OTRZYMANE DANE:", req.body);

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

		// 1. Pobierz dane użytkownika
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				first_name: true,
				last_name: true,
				team: true,
				team_members: {
					// ✅ DODAJ
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

		// 2. Utwórz wniosek urlopowy
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

		// ✅✅✅ 3. UTWÓRZ POWIADOMIENIE ✅✅✅
		const userName = user
			? `${user.first_name || ""} ${user.last_name || ""}`.trim()
			: "Nieznany";

		// 1. Znajdź admina (user_id = 63)
		const admin = await prisma.user.findUnique({
			where: { id: 63 }, // admin_system
			select: { id: true },
		});

		// 2. Znajdź zarząd (user_id = 1 - Maciej, ale on ma teraz role_id = 4)
		// LUB znajdź pierwszego użytkownika z role_id = 2
		const boardMember = await prisma.user.findFirst({
			where: {
				role_id: 2, // board (zarząd)
			},
			select: { id: true },
			orderBy: { id: "asc" },
		});

		// 4. Utwórz powiadomienie dla ZARZĄDU z target: "board"
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
						target: "board", // ✅ TARGET: board
						created_at: new Date(),
					},
				});
			}
		}

		console.log("✅ UTOWORZONO URLOP:", leave);
		console.log(`📨 Wysłano powiadomienia do Admina i Zarządu`);
		// 5. Zwróć odpowiedź
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
		console.error("❌ Błąd tworzenia wniosku:", error);
		res.status(500).json({ error: "Nie udało się utworzyć wniosku" });
	}
});
// 📝 PUT - aktualizuj wniosek urlopowy
// 📝 PUT - aktualizuj wniosek urlopowy
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

		// ✅✅✅ ADMIN + ZARZĄD MOŻE ZATWIERDZAĆ/ODRZUCAĆ ✅✅✅
		const canApprove =
			userRole === "admin" || userRole === "board" || userRole === "zarząd";

		if (!canApprove) {
			return res.status(403).json({
				error:
					"Tylko Admin lub Zarząd może zatwierdzać lub odrzucać wnioski urlopowe",
			});
		}

		// ✅ Pobierz dane aktualnego użytkownika
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

		// ✅ ADMIN + ZARZĄD MOŻE ZMIENIAĆ STATUS
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
						// ✅ UŻYJ currentUser zamiast req.user
						approved_by:
							`${currentUser?.first_name || ""} ${currentUser?.last_name || ""}`.trim() ||
							"Nieznany",
						approved_at: new Date(),
					}
					: {}),
			},
		});

		// Powiadomienie o zmianie statusu
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
		console.error("❌ Błąd aktualizacji wniosku:", error);
		res.status(500).json({ error: "Nie udało się zaktualizować wniosku" });
	}
});

// 🗑️ DELETE - usuń wniosek urlopowy
app.delete("/api/leaves/:id", authMiddleware, async (req: any, res) => {
	console.log(`🔍 [DELETE LEAVE] START - ID: ${req.params.id}`);
	try {
		const userId = req.user?.id;
		const userRole = req.user?.role;
		const leaveId = parseInt(req.params.id);

		console.log(
			`🔍 [DELETE LEAVE] userId: ${userId}, userRole: ${userRole}, leaveId: ${leaveId}`,
		);

		const existingLeave = await prisma.leave.findUnique({
			where: { id: leaveId },
			include: { user: true },
		});

		console.log(`🔍 [DELETE LEAVE] existingLeave:`, existingLeave);

		if (!existingLeave) {
			console.log(`🔍 [DELETE LEAVE] Nie znaleziono wniosku`);
			return res.status(404).json({ error: "Nie znaleziono wniosku" });
		}

		// Sprawdź uprawnienia
		if (userRole !== "admin" && existingLeave.user_id !== userId) {
			console.log(`🔍 [DELETE LEAVE] Brak uprawnień`);
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		// Usuń wniosek
		await prisma.leave.delete({
			where: { id: leaveId },
		});

		console.log(`🔍 [DELETE LEAVE] Usunięto z bazy`);

		// ✅ Middleware automatycznie zaloguje DELETE
		// Ponieważ używamy res.json() z sukcesem
		res.status(200).json({
			success: true,
			message: "Wniosek urlopowy usunięty",
			id: leaveId,
		});
	} catch (error) {
		console.error(`🔍 [DELETE LEAVE] BŁĄD:`, error);

		// ❌ W przypadku błędu - middleware też zaloguje jako error
		// ponieważ status będzie >= 400
		res.status(500).json({
			error: "Nie udało się usunąć wniosku",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

// 📥 GET - pobierz status urlopu dla danego użytkownika (czy jest na urlopie)
// 1. GET - sprawdź swój status urlopu (bez parametru)
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
		console.error("❌ Błąd sprawdzania statusu urlopu:", error);
		res.status(500).json({ error: "Nie udało się sprawdzić statusu urlopu" });
	}
});

// 2. GET - sprawdź status urlopu innego użytkownika (z parametrem)
app.get("/api/leaves/status/:userId", authMiddleware, async (req: any, res) => {
	try {
		const userId = parseInt(req.params.userId);
		if (!userId) return res.status(400).json({ error: "Brak ID użytkownika" });

		// Sprawdź czy użytkownik ma prawo widzieć status innego użytkownika
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
		console.error("❌ Błąd sprawdzania statusu urlopu:", error);
		res.status(500).json({ error: "Nie udało się sprawdzić statusu urlopu" });
	}
});
// 📝 PUT - aktualizuj profil
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
		console.error("❌ Błąd aktualizacji:", error);
		res.status(500).json({ error: "Nie udało się zaktualizować profilu" });
	}
});

// 📤 POST - dodaj umiejętność
app.post("/api/profile/skills", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		const { skill } = req.body;

		const onboarding = await prisma.onboarding_data.findFirst({
			where: { user_id: userId },
			orderBy: { created_at: "desc" },
		});
		let skills = onboarding?.skills ? JSON.parse(onboarding.skills) : [];
		if (!skills.includes(skill)) skills.push(skill);

		await prisma.onboarding_data.update({
			where: { id: onboarding!.id },
			data: { skills: JSON.stringify(skills) },
		});

		res.json({ success: true, skills });
	} catch (error) {
		console.error("❌ Błąd:", error);
		res.status(500).json({ error: "Nie udało się dodać umiejętności" });
	}
});

// 🗑️ DELETE - usuń umiejętność
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
			let skills = onboarding?.skills ? JSON.parse(onboarding.skills) : [];
			skills = skills.filter((s: string) => s !== skillToRemove);

			await prisma.onboarding_data.update({
				where: { id: onboarding!.id },
				data: { skills: JSON.stringify(skills) },
			});

			res.json({ success: true, skills });
		} catch (error) {
			console.error("❌ Błąd:", error);
			res.status(500).json({ error: "Nie udało się usunąć umiejętności" });
		}
	},
);
// ============================================================
// ⭐ OBSŁUGA BŁĘDÓW MULTER
// ============================================================
app.use(
	(
		err: any,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		console.error("❌ Błąd:", err);

		if (err instanceof multer.MulterError) {
			// Użyj err.message zamiast err.code
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

		res.status(500).json({ error: err.message || "Wewnętrzny błąd serwera" });
	},
);
// ============================================================
// SOCIAL MEDIA - API
// ============================================================

// ---------------------- MEMBERS ----------------------
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
						status: true, // ⭐ DODAJ STATUS Z TABELI users
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
			status: m.user.status, // ⭐ STATUS Z TABELI users (active, trial, mentor, vacation)
			// ❌ USUŃ active: m.is_active - to jest niepotrzebne
		}));

		res.json(formattedMembers);
	} catch (error) {
		console.error("❌ Błąd pobierania członków social media:", error);
		res.status(500).json({ error: "Nie udało się pobrać członków" });
	}
});
// W pliku backend (np. socialMediaRoutes.ts lub server.ts)

// GET - pobierz wszystkich twórców
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
			topics: c.topics ? JSON.parse(c.topics) : [], // ⭐ TO JEST KLUCZOWE!
			active: c.is_active,
		}));

		res.json(formattedCreators);
	} catch (error) {
		console.error("❌ Błąd pobierania twórców:", error);
		res.status(500).json({
			error: "Nie udało się pobrać twórców",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

// POST - dodaj nowego twórcę
app.post("/api/social/creators", authMiddleware, async (req: any, res) => {
	try {
		const { user_id, availability, experience, topics } = req.body;

		// Sprawdź czy użytkownik istnieje
		const user = await prisma.user.findUnique({
			where: { id: parseInt(user_id) },
		});

		if (!user) {
			return res.status(404).json({ error: "Użytkownik nie istnieje" });
		}

		// Sprawdź czy już jest twórcą
		const existingCreator = await prisma.socialMediaCreator.findUnique({
			where: { user_id: parseInt(user_id) },
		});

		if (existingCreator) {
			return res.status(400).json({ error: "Ten użytkownik już jest twórcą" });
		}

		// Utwórz nowego twórcę
		const creator = await prisma.socialMediaCreator.create({
			data: {
				user_id: parseInt(user_id),
				availability: availability,
				experience: experience || "none",
				topics: JSON.stringify(topics || []), // ⭐ ZAMIEŃ NA JSON STRING
				is_active: true, // ⭐ DODAJ - model tego wymaga
				// ❌ USUŃ created_at i updated_at - Prisma ustawi je automatycznie
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
		console.error("❌ Błąd dodawania twórcy:", error);
		res.status(500).json({ error: "Nie udało się dodać twórcy" });
	}
});

// ---------------------- PUBLICATIONS ----------------------
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
		console.error("❌ Błąd pobierania publikacji:", error);
		res.status(500).json({ error: "Nie udało się pobrać publikacji" });
	}
});

// ---------------------- MATERIALS ----------------------
app.get("/api/social/materials", authMiddleware, async (req: any, res) => {
	try {
		const materials = await prisma.material.findMany({
			// ⭐ UŻYJ "material" z małej
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
		console.error("❌ Błąd pobierania materiałów:", error);
		res.status(500).json({ error: "Nie udało się pobrać materiałów" });
	}
});

// ---------------------- TASKS ----------------------
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
		console.error("❌ Błąd pobierania zadań:", error);
		res.status(500).json({ error: "Nie udało się pobrać zadań" });
	}
});

// ---------------------- CONTACTS ----------------------
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
		console.error("❌ Błąd pobierania kontaktów:", error);
		res.status(500).json({ error: "Nie udało się pobrać kontaktów" });
	}
});

// ============================================================
// SOCIAL MEDIA - CRUD OPERATIONS
// ============================================================

// ---------------------- MEMBERS ----------------------
// POST - Dodaj członka
app.post("/api/social/members", authMiddleware, async (req: any, res) => {
	try {
		const { user_id, role } = req.body;

		if (!user_id || !role) {
			return res.status(400).json({ error: "user_id i role są wymagane" });
		}

		// Sprawdź czy użytkownik istnieje
		const user = await prisma.user.findUnique({
			where: { id: parseInt(user_id) },
		});

		if (!user) {
			return res.status(404).json({ error: "Użytkownik nie istnieje" });
		}

		// Sprawdź czy już jest członkiem
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
		console.error("❌ Błąd dodawania członka:", error);
		res.status(500).json({ error: "Nie udało się dodać członka" });
	}
});

// ---------------------- PUBLICATIONS ----------------------
// POST - Dodaj publikację
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
		console.error("❌ Błąd dodawania publikacji:", error);
		res.status(500).json({ error: "Nie udało się dodać publikacji" });
	}
});

// PUT - Aktualizuj publikację
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
			console.error("❌ Błąd aktualizacji publikacji:", error);
			res.status(500).json({ error: "Nie udało się zaktualizować publikacji" });
		}
	},
);

// DELETE - Usuń publikację
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
			console.error("❌ Błąd usuwania publikacji:", error);
			res.status(500).json({ error: "Nie udało się usunąć publikacji" });
		}
	},
);
// backend/src/server.ts - DODAJ TEN ENDPOINT

// ============================================================
// ONBOARDING - ZAPIS DANYCH
// ============================================================

// ============================================================
// ONBOARDING - ZAPIS DANYCH
// ============================================================

app.post("/api/onboarding/save", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		console.log(`📝 [ONBOARDING] Zapisywanie danych dla użytkownika ${userId}`);
		console.log("📝 [ONBOARDING] Dane:", req.body);

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

		console.log("🔍 [ONBOARDING] pillarIds:", pillarIds);
		console.log("🔍 [ONBOARDING] typeof pillarIds:", typeof pillarIds);
		console.log("🔍 [ONBOARDING] Array.isArray(pillarIds):", Array.isArray(pillarIds));

		// ⭐ SPRAWDŹ CZY JUŻ ISTNIEJE ⭐
		const existing = await prisma.onboarding_data.findFirst({
			where: { user_id: userId },
			orderBy: { created_at: "desc" },
		});

		let onboarding;

		// ⭐ PRZYGOTUJ DANE ⭐
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
			// ⭐ AKTUALIZUJ ⭐
			onboarding = await prisma.onboarding_data.update({
				where: { id: existing.id },
				data: {
					...data,
					updated_at: new Date(),
				},
			});
			console.log(
				`✅ [ONBOARDING] Zaktualizowano onboarding dla użytkownika ${userId}`,
			);
		} else {
			// ⭐ UTWÓRZ NOWY ⭐
			onboarding = await prisma.onboarding_data.create({
				data: {
					user_id: userId,
					...data,
					created_at: new Date(),
				},
			});
			console.log(
				`✅ [ONBOARDING] Utworzono onboarding dla użytkownika ${userId}`,
			);
		}

		// ⭐ ZAKTUALIZUJ RÓWNIEŻ DANE UŻYTKOWNIKA ⭐
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

		console.log(`✅ [ONBOARDING] Zaktualizowano dane użytkownika ${userId}`);

		// ⭐⭐⭐ ZAPIS DO TEAM_MEMBERS ⭐⭐⭐
		if (pillarIds && Array.isArray(pillarIds) && pillarIds.length > 0) {
			console.log(`📋 [ONBOARDING] Dodawanie użytkownika ${userId} do filarów:`, pillarIds);

			// SPRAWDŹ CZY TEAM ID ISTNIEJĄ
			const existingTeams = await prisma.team.findMany({
				where: {
					id: { in: pillarIds }
				},
				select: { id: true }
			});
			const existingTeamIds = existingTeams.map((t: any) => t.id);
			console.log("🔍 [ONBOARDING] Istniejące team ID:", existingTeamIds);

			// FILTRUJ TYLKO ISTNIEJĄCE
			const validPillarIds = pillarIds.filter((id: number) => existingTeamIds.includes(id));
			console.log("🔍 [ONBOARDING] Valid pillarIds:", validPillarIds);

			if (validPillarIds.length > 0) {
				// Pobierz istniejące członkostwa użytkownika
				const existingMemberships = await prisma.teamMember.findMany({
					where: {
						user_id: userId,
						team_id: { in: validPillarIds },
					},
					select: { team_id: true },
				});

				const existingMembershipIds = existingMemberships.map((m: any) => m.team_id);
				console.log("🔍 [ONBOARDING] Istniejące członkostwa:", existingMembershipIds);

				// Dodaj tylko te, których jeszcze nie ma
				const toAdd = validPillarIds.filter((id: number) => !existingMembershipIds.includes(id));
				console.log("🔍 [ONBOARDING] Do dodania:", toAdd);

				if (toAdd.length > 0) {
					const result = await prisma.teamMember.createMany({
						data: toAdd.map((teamId: number) => ({
							user_id: userId,
							team_id: teamId,
							role: "Członek",
							is_leader: false,
						})),
					});
					console.log(`✅ [ONBOARDING] Dodano ${result.count} rekordów do team_members`);
				} else {
					console.log(`⏭️ [ONBOARDING] Użytkownik ${userId} już jest we wszystkich wybranych filarach`);
				}
			} else {
				console.log(`⚠️ [ONBOARDING] Żadne z podanych ID nie istnieje w tabeli teams`);
			}
		} else {
			console.log(`⚠️ [ONBOARDING] Brak pillarIds lub nieprawidłowy format:`, pillarIds);
		}

		// ============================================================
		// ✅✅✅ UTWÓRZ POWIADOMIENIE POWITALNE DLA UŻYTKOWNIKA ✅✅✅
		// ============================================================
		try {
			const fullName = `${firstName || ""} ${lastName || ""}`.trim();

			console.log(`📨 [ONBOARDING] Tworzenie powiadomienia dla ${fullName}...`);

			// Sprawdź czy powiadomienie już istnieje (unikamy duplikatów)
			const existingNotification = await prisma.notification.findFirst({
				where: {
					user_id: userId,
					title: "🎉 Witaj w panelu członka Siły Młodych!",
					created_at: {
						gte: new Date(Date.now() - 60000), // ostatnia minuta
					},
				},
			});

			if (existingNotification) {
				console.log(
					`⏭️ [ONBOARDING] Powiadomienie już istnieje dla użytkownika ${userId}`,
				);
			} else {
				// Utwórz powiadomienie
				const notification = await prisma.notification.create({
					data: {
						user_id: userId,
						title: "🎉 Witaj w panelu członka Siły Młodych!",
						message: `Witaj w panelu członka Siły Młodych. Miłego korzystania! ${fullName}`,
						type: "success",
						read: false,
						link: "/dashboard",
						target: "user",
						created_at: new Date(),
					},
				});

				console.log(
					`✅ [ONBOARDING] Utworzono powiadomienie ID: ${notification.id} dla użytkownika ${userId}`,
				);
			}
		} catch (notificationError) {
			// ⚠️ NIE BLOKUJ PROCESU - powiadomienie to tylko dodatek
			console.error(
				"⚠️ [ONBOARDING] Błąd tworzenia powiadomienia:",
				notificationError,
			);
			// Kontynuuj - nie przerywamy zapisu onboardingu
		}
		// ============================================================

		res.status(200).json({
			success: true,
			message: "Dane onboardingu zapisane",
			onboardingId: onboarding.id,
		});
	} catch (error) {
		console.error("❌ [ONBOARDING] Błąd zapisu:", error);
		console.error(
			"❌ [ONBOARDING] Szczegóły:",
			error instanceof Error ? error.stack : "",
		);
		res.status(500).json({
			error: "Nie udało się zapisać danych onboardingu",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
});
// backend/src/server.ts
app.get("/api/social/members/check", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		const member = await prisma.socialMediaMember.findFirst({
			where: { user_id: userId }
		});

		res.json({ isMember: !!member });
	} catch (error) {
		console.error("❌ Błąd sprawdzania członkostwa social media:", error);
		res.status(500).json({ error: "Błąd serwera" });
	}
});

// ---------------------- MATERIALS ----------------------
// POST - Dodaj materiał
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
		console.error("❌ Błąd dodawania materiału:", error);
		res.status(500).json({ error: "Nie udało się dodać materiału" });
	}
});

// PUT - Aktualizuj materiał
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
		console.error("❌ Błąd aktualizacji materiału:", error);
		res.status(500).json({ error: "Nie udało się zaktualizować materiału" });
	}
});

// DELETE - Usuń materiał
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
			console.error("❌ Błąd usuwania materiału:", error);
			res.status(500).json({ error: "Nie udało się usunąć materiału" });
		}
	},
);

// ---------------------- TASKS ----------------------
// POST - Dodaj zadanie
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
		console.error("❌ Błąd dodawania zadania:", error);
		res.status(500).json({ error: "Nie udało się dodać zadania" });
	}
});

// PUT - Aktualizuj zadanie
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
		console.error("❌ Błąd aktualizacji zadania:", error);
		res.status(500).json({ error: "Nie udało się zaktualizować zadania" });
	}
});

// DELETE - Usuń zadanie
app.delete("/api/social/tasks/:id", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		await prisma.socialTask.delete({
			where: { id: parseInt(id) },
		});
		res.status(204).send();
	} catch (error) {
		console.error("❌ Błąd usuwania zadania:", error);
		res.status(500).json({ error: "Nie udało się usunąć zadania" });
	}
});

// ---------------------- CONTACTS ----------------------
// POST - Dodaj kontakt
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
		console.error("❌ Błąd dodawania kontaktu:", error);
		res.status(500).json({ error: "Nie udało się dodać kontaktu" });
	}
});

// PUT - Aktualizuj kontakt
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
		console.error("❌ Błąd aktualizacji kontaktu:", error);
		res.status(500).json({ error: "Nie udało się zaktualizować kontaktu" });
	}
});

// DELETE - Usuń kontakt
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
			console.error("❌ Błąd usuwania kontaktu:", error);
			res.status(500).json({ error: "Nie udało się usunąć kontaktu" });
		}
	},
);

// ============================================================
// FUNKCJA POMOCNICZA - domyślne uprawnienia
// ============================================================

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

// ============================================================
// ADMIN - ZARZĄDZANIE UPRAWNIENIAMI (z bazą danych)
// ============================================================

// 📥 GET - pobierz uprawnienia dla konkretnej roli
app.get(
	"/api/admin/permissions/:role",
	authMiddleware,
	async (req: any, res) => {
		try {
			const { role } = req.params;

			// Pobierz rolę z bazy
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
				// Jeśli rola nie istnieje w bazie, użyj domyślnych
				const defaultPermissions = getDefaultPermissions(role);
				return res.json({
					role,
					permissions: defaultPermissions,
					fromDefault: true,
				});
			}

			// Parsuj permissions z JSON
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
			console.error("❌ Błąd pobierania uprawnień:", error);
			// Fallback do domyślnych
			const defaultPermissions = getDefaultPermissions(req.params.role);
			res.json({
				role: req.params.role,
				permissions: defaultPermissions,
				fromDefault: true,
			});
		}
	},
);

// 📥 GET - pobierz wszystkie role z uprawnieniami (dla admina)
app.get("/api/admin/roles", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;

		// Tylko admin może pobierać wszystkie role
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

		// Przetwórz dane
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
		console.error("❌ Błąd pobierania ról:", error);
		res.status(500).json({ error: "Nie udało się pobrać ról" });
	}
});

// 📝 PUT - zaktualizuj uprawnienia roli
app.put(
	"/api/admin/roles/:id/permissions",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userRole = req.user?.role;
			const roleId = parseInt(req.params.id);
			const { permissions } = req.body;

			// Tylko admin może zarządzać uprawnieniami
			if (userRole !== "admin") {
				return res.status(403).json({ error: "Brak uprawnień" });
			}

			// Sprawdź czy rola istnieje
			const existing = await prisma.roles.findUnique({
				where: { id: roleId },
			});

			if (!existing) {
				return res.status(404).json({ error: "Rola nie istnieje" });
			}

			// Zaktualizuj uprawnienia
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

			// Parsuj permissions z JSON
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
			console.error("❌ Błąd aktualizacji uprawnień:", error);
			res.status(500).json({ error: "Nie udało się zaktualizować uprawnień" });
		}
	},
);

// 📤 POST - utwórz nową rolę (dla admina)
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

		// Sprawdź czy rola już istnieje
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
		console.error("❌ Błąd tworzenia roli:", error);
		res.status(500).json({ error: "Nie udało się utworzyć roli" });
	}
});

// 🗑️ DELETE - usuń rolę (dla admina)
app.delete("/api/admin/roles/:id", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;
		const roleId = parseInt(req.params.id);

		if (userRole !== "admin") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		// Sprawdź czy rola istnieje
		const existing = await prisma.roles.findUnique({
			where: { id: roleId },
		});

		if (!existing) {
			return res.status(404).json({ error: "Rola nie istnieje" });
		}

		// Nie pozwól usunąć admina
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
		console.error("❌ Błąd usuwania roli:", error);
		res.status(500).json({ error: "Nie udało się usunąć roli" });
	}
});
// ============================================================
// ADMIN - ZARZĄDZANIE ZESPOŁAMI I CZŁONKAMI
// ============================================================

// 📥 GET - pobierz wszystkie zespoły z członkami (dla admina)
app.get("/api/admin/teams", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;

		// Tylko admin
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
		console.error("❌ Błąd pobierania zespołów:", error);
		res.status(500).json({ error: "Nie udało się pobrać zespołów" });
	}
});

// 📝 PUT - edytuj zespół
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
		console.error("❌ Błąd edycji zespołu:", error);
		res.status(500).json({ error: "Nie udało się edytować zespołu" });
	}
});
// 📤 POST - dodaj nowy zespół
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
		console.error("❌ Błąd tworzenia zespołu:", error);
		res.status(500).json({ error: "Nie udało się utworzyć zespołu" });
	}
});
// 🗑️ DELETE - usuń zespół (soft delete)
app.delete("/api/admin/teams/:id", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;
		const teamId = parseInt(req.params.id);

		if (userRole !== "admin") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		// Sprawdź czy zespół istnieje
		const team = await prisma.team.findUnique({
			where: { id: teamId },
		});

		if (!team) {
			return res.status(404).json({ error: "Zespół nie istnieje" });
		}

		// Soft delete - zmień status na inactive
		await prisma.team.update({
			where: { id: teamId },
			data: { status: "inactive" },
		});

		res.json({ success: true, message: "Zespół usunięty" });
	} catch (error) {
		console.error("❌ Błąd usuwania zespołu:", error);
		res.status(500).json({ error: "Nie udało się usunąć zespołu" });
	}
});

// 📤 POST - dodaj członka do zespołu
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

		// Sprawdź czy użytkownik istnieje
		const user = await prisma.user.findUnique({
			where: { id: parseInt(user_id) },
		});

		if (!user) {
			return res.status(404).json({ error: "Użytkownik nie istnieje" });
		}

		// Sprawdź czy zespół istnieje
		const team = await prisma.team.findUnique({
			where: { id: parseInt(team_id) },
		});

		if (!team) {
			return res.status(404).json({ error: "Zespół nie istnieje" });
		}

		// Sprawdź czy już jest w zespole
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
		console.error("❌ Błąd dodawania członka do zespołu:", error);
		res.status(500).json({ error: "Nie udało się dodać członka do zespołu" });
	}
});

// 🗑️ DELETE - usuń członka z zespołu
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
			console.error("❌ Błąd usuwania członka z zespołu:", error);
			res.status(500).json({ error: "Nie udało się usunąć członka z zespołu" });
		}
	},
);

// 📝 PUT - zmień rolę członka w zespole
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
			console.error("❌ Błąd zmiany roli członka:", error);
			res.status(500).json({ error: "Nie udało się zmienić roli" });
		}
	},
);

// 📥 GET - pobierz wszystkich użytkowników (bez admina) do dodawania do zespołów
app.get("/api/admin/available-users", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;

		if (userRole !== "admin") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		const users = await prisma.user.findMany({
			where: {
				is_active: true,
				// Pomijamy admina (user z role_id = 1)
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
		console.error("❌ Błąd pobierania użytkowników:", error);
		res.status(500).json({ error: "Nie udało się pobrać użytkowników" });
	}
});
// ============================================================
// ADMIN - LOGI SYSTEMOWE
// ============================================================

// 📥 GET - pobierz logi z paginacją
app.get("/api/admin/logs", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;

		// Tylko admin może przeglądać logi
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

		// Buduj warunki where
		let where: any = {};

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

		// Pobierz logi
		const logs = await prisma.systemLog.findMany({
			where,
			orderBy: { created_at: "desc" },
			skip,
			take: limit,
		});

		// Policz total
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
		console.error("❌ Błąd pobierania logów:", error);
		res.status(500).json({ error: "Nie udało się pobrać logów" });
	}
});
// ============================================================
// START SERWERA
// ============================================================
app.listen(port, () => {
	console.log(`🚀 Serwer działa na porcie ${port}`);
	console.log(`📁 Katalog uploadów: ${uploadDir}`);
	console.log(
		`📋 Dostępne modele:`,
		Object.keys(prisma).filter((key: string) => !key.startsWith("_")),
	);
});
setTimeout(async () => {
	console.log(
		"🔄 [STARTUP] Uruchamiam synchronizację członków przy starcie serwera...",
	);
	try {
		await syncMembers();
		console.log("✅ [STARTUP] Synchronizacja członków zakończona");
	} catch (error) {
		console.error("❌ [STARTUP] Błąd synchronizacji:", error);
	}
}, 5000);

// ============================================================
// START SERWERA
// ============================================================
app.listen(port, () => {
	console.log(`🚀 Serwer działa na porcie ${port}`);
	console.log(`📁 Katalog uploadów: ${uploadDir}`);
	console.log(
		`📋 Dostępne modele:`,
		Object.keys(prisma).filter((key: string) => !key.startsWith("_")),
	);
});
