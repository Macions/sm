// backend/src/server.ts
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { ProjectController } from "./controllers/project.controller";
import { UserController } from "./controllers/user.controller";
import { authMiddleware } from "./middleware/auth.middleware";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET =
	process.env.JWT_SECRET || "your-secret-key-here-change-in-production";

const prisma = new PrismaClient();

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors());
app.use(express.json());

// ============================================================
// FUNKCJE POMOCNICZE - PRZED ENDPOINTAMI!
// ============================================================
function mapRoleId(roleId: number): string {
	const roleMap: Record<number, string> = {
		1: "admin",
		2: "coordinator",
		3: "coordinator",
		4: "member",
	};
	return roleMap[roleId] || "member";
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
// ✅ ENDPOINTY PUBLICZNE (BEZ autoryzacji)
// ============================================================

// LOGOWANIE
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
// ✅ ENDPOINTY ZABEZPIECZONE (Z authMiddleware)
// ============================================================

// SPRAWDZANIE ONBOARDINGU
app.get(
	"/api/auth/onboarding-status",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({ error: "Brak autoryzacji" });
			}
			res.json({ completed: true });
		} catch (error) {
			console.error("❌ Błąd sprawdzania onboardingu:", error);
			res
				.status(500)
				.json({ error: "Nie udało się sprawdzić statusu onboardingu" });
		}
	},
);

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

// PROFIL
app.get("/api/profile", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				first_name: true,
				last_name: true,
				role_id: true,
				team: true,
				username: true,
				status: true,
				join_date: true,
				is_trial: true,
				created_at: true,
			},
		});

		if (!user) {
			return res.status(404).json({ error: "Użytkownik nie znaleziony" });
		}

		res.json({
			id: user.id,
			email: user.email,
			first_name: user.first_name,
			last_name: user.last_name,
			role: mapRoleId(user.role_id),
			team: user.team,
			username: user.username,
			status: user.status || "active",
			joinDate: user.join_date,
			isTrial: user.is_trial || false,
			createdAt: user.created_at,
		});
	} catch (error) {
		console.error("❌ Błąd profilu:", error);
		res.status(500).json({ error: "Nie udało się pobrać profilu" });
	}
});

// STATYSTYKI
app.get("/api/dashboard/stats", authMiddleware, async (req: any, res) => {
	try {
		const totalMembers = await prisma.user.count({
			where: { is_active: 1 },
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
			if (!userId) {
				return res.status(401).json({ error: "Brak autoryzacji" });
			}

			const limit = parseInt(req.query.limit as string) || 4;

			const notifications = await prisma.notification.findMany({
				where: { user_id: userId },
				orderBy: { created_at: "desc" },
				take: limit,
			});

			const mappedNotifications = notifications.map((n) => ({
				id: n.id.toString(),
				message: n.message,
				type: n.type as "success" | "info" | "warning",
				time: formatTimeAgo(n.created_at),
				title: n.title,
				read: n.read,
				link: n.link,
			}));

			res.json(mappedNotifications);
		} catch (error) {
			console.error("❌ Błąd pobierania powiadomień:", error);
			res.status(500).json({ error: "Nie udało się pobrać powiadomień" });
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

			const result = await prisma.notification.updateMany({
				where: { id: id, user_id: userId },
				data: { read: true },
			});

			if (result.count === 0) {
				return res.status(404).json({ error: "Nie znaleziono powiadomienia" });
			}

			res.status(200).json({ message: "Oznaczono jako przeczytane" });
		} catch (error) {
			console.error("❌ Błąd oznaczania:", error);
			res.status(500).json({ error: "Nie udało się oznaczyć" });
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

			await prisma.notification.updateMany({
				where: { user_id: userId, read: false },
				data: { read: true },
			});

			res.status(200).json({ message: "Wszystkie oznaczone jako przeczytane" });
		} catch (error) {
			console.error("❌ Błąd oznaczania wszystkich:", error);
			res.status(500).json({ error: "Nie udało się oznaczyć wszystkich" });
		}
	},
);

// backend/src/server.ts - ZASTĄP endpoint GET /api/tutorials

app.get("/api/tutorials", authMiddleware, async (req: any, res) => {
	try {
		const tutorials = await prisma.guide.findMany({
			orderBy: { created_at: "desc" },
		});

		// Mapuj dane na format oczekiwany przez frontend
		const mappedTutorials = tutorials.map((t: any) => ({
			id: t.id.toString(),
			title: t.title,
			description: t.description,
			category: t.category || "new_member",
			access: t.access || "all",
			author: "Admin", // Możesz pobrać z relacji author
			createdAt: t.created_at.toISOString().split("T")[0],
			updatedAt: t.updated_at.toISOString().split("T")[0],
			content: t.content || "",
			attachments: t.attachments || [],
			functionalRoles: t.functional_roles || [],
			isNew: false,
			isUpdated: false,
		}));

		res.json(mappedTutorials);
	} catch (error) {
		console.error("❌ Błąd pobierania poradników:", error);
		res.status(500).json({ error: "Nie udało się pobrać poradników" });
	}
});

// backend/src/server.ts - ZASTĄP endpoint POST /api/tutorials

// backend/src/server.ts - ZASTĄP endpoint POST /api/tutorials

// backend/src/server.ts - ZASTĄP endpoint POST /api/tutorials

// backend/src/server.ts - DODAJ NA KOŃCU, PRZED app.listen()

// ============================================================
// ✅ ENDPOINTY PORADNIKÓW - POST (NA KOŃCU)
// ============================================================

app.post("/api/tutorials", authMiddleware, async (req: any, res) => {
	console.log("🚨🚨🚨 POST /api/tutorials - ZAPYTANIE OTRZYMANE! 🚨🚨🚨");
	console.log("Body:", req.body);

	try {
		const { title, description, category, access, author, content } = req.body;

		if (!title) {
			return res.status(400).json({ error: "Tytuł jest wymagany" });
		}

		const tutorial = await prisma.guide.create({
			data: {
				title: title,
				description: description || null,
				category: category || "new_member",
				access: access || "all",
				author_id: req.user?.id || 1,
				content: content || null,
			},
		});

		console.log("✅ Utworzono:", tutorial.title);

		res.status(201).json({
			id: tutorial.id.toString(),
			title: tutorial.title,
			description: tutorial.description,
			category: tutorial.category || "new_member",
			access: tutorial.access || "all",
			author: author || "Admin",
			createdAt: tutorial.created_at.toISOString().split("T")[0],
			updatedAt: tutorial.updated_at.toISOString().split("T")[0],
			content: tutorial.content || "",
			attachments: [],
			functionalRoles: [],
			isNew: true,
			isUpdated: false,
		});
	} catch (error) {
		console.error("❌ Błąd:", error);
		res.status(500).json({ error: "Nie udało się utworzyć poradnika" });
	}
});

// backend/src/server.ts - ZASTĄP endpoint PUT /api/tutorials/:id

app.put("/api/tutorials/:id", authMiddleware, async (req: any, res) => {
	try {
		const id = parseInt(req.params.id);
		const {
			title,
			description,
			category,
			access,
			author,
			content,
			attachments,
			functionalRoles,
		} = req.body;

		const tutorial = await prisma.guide.update({
			where: { id },
			data: {
				title: title || "Bez tytułu",
				description: description || null,
				category: category || "new_member",
				access: access || "all",
				content: content || null,
				attachments: attachments || [],
				functional_roles: functionalRoles || [],
			},
		});

		console.log(`✅ Poradnik "${tutorial.title}" został zaktualizowany`);

		res.json({
			id: tutorial.id.toString(),
			title: tutorial.title,
			description: tutorial.description,
			category: tutorial.category || "new_member",
			access: tutorial.access || "all",
			author: author || "Admin",
			createdAt: tutorial.created_at.toISOString().split("T")[0],
			updatedAt: tutorial.updated_at.toISOString().split("T")[0],
			content: tutorial.content || "",
			attachments: attachments || [],
			functionalRoles: functionalRoles || [],
			isNew: false,
			isUpdated: true,
		});
	} catch (error) {
		console.error("❌ Błąd aktualizacji poradnika:", error);
		res.status(500).json({ error: "Nie udało się zaktualizować poradnika" });
	}
});

// Usuń poradnik (soft delete)
app.delete("/api/tutorials/:id", authMiddleware, async (req: any, res) => {
	try {
		const id = parseInt(req.params.id);
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
// backend/src/server.ts - ZASTĄP endpoint /api/structure tym:

// backend/src/server.ts - ZASTĄP endpoint /api/structure tym:

// backend/src/server.ts - ZASTĄP fragment dotyczący struktury:

// backend/src/server.ts - ZASTĄP endpoint /api/structure tym:

// backend/src/server.ts - endpoint /api/structure

// backend/src/server.ts - ZASTĄP endpoint /api/structure tym:

app.get("/api/structure", authMiddleware, async (req: any, res) => {
	try {
		console.log("📥 [STRUCTURE] Pobieranie struktury...");

		// 1. Pobierz wszystkie zespoły
		const teams = await prisma.team.findMany({
			select: {
				id: true,
				name: true,
				description: true,
				parent_id: true,
			},
		});
		console.log(
			`📥 [STRUCTURE] Znaleziono ${teams.length} zespołów:`,
			teams.map((t) => t.name),
		);

		// 2. Pobierz wszystkich członków
		const teamMembers = await prisma.teamMember.findMany({
			select: {
				id: true,
				team_id: true,
				user_id: true,
				role: true,
				is_leader: true,
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
		console.log(
			`📥 [STRUCTURE] Znaleziono ${teamMembers.length} członków zespołów`,
		);

		// 3. Zbuduj mapę osób
		const peopleByTeam: Record<number, any[]> = {};
		teamMembers.forEach((tm: any) => {
			if (!peopleByTeam[tm.team_id]) {
				peopleByTeam[tm.team_id] = [];
			}
			peopleByTeam[tm.team_id].push({
				id: tm.user.id.toString(),
				firstName: tm.user.first_name,
				lastName: tm.user.last_name,
				role: tm.role || tm.user.functional_role || "Członek",
				email: tm.user.email || "",
				phone: tm.user.phone || undefined,
				province: tm.user.province || undefined,
				is_leader: tm.is_leader === 1,
			});
		});
		console.log("📥 [STRUCTURE] Mapy osób utworzone");

		// 4. Zbuduj drzewo
		// 4. Zbuduj drzewo
		const teamMap: Record<number, any> = {};
		teams.forEach((team: any) => {
			// ✅ SORTUJ OSOBY W ZESPOLE - liderzy na górze!
			const sortedPeople = (peopleByTeam[team.id] || []).sort(
				(a: any, b: any) => {
					// 1. Najpierw liderzy (is_leader = 1)
					if (a.is_leader && !b.is_leader) return -1;
					if (!a.is_leader && b.is_leader) return 1;
					// 2. Potem alfabetycznie po nazwisku
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
				children: [],
				people: sortedPeople, // ✅ UŻYJ POSORTOWANEJ LISTY
			};
		});
		console.log("📥 [STRUCTURE] Mapa zespołów utworzona");

		// 5. Znajdź korzenie
		const rootTeams: any[] = [];
		teams.forEach((team: any) => {
			const node = teamMap[team.id];
			if (team.parent_id && teamMap[team.parent_id]) {
				teamMap[team.parent_id].children.push(node);
			} else {
				rootTeams.push(node);
			}
		});
		console.log(
			`📥 [STRUCTURE] Znaleziono ${rootTeams.length} korzeni:`,
			rootTeams.map((t) => t.name),
		);

		// 6. Znajdź "Siła Młodych" jako root
		const mainTeam = rootTeams.find((t) => t.name === "Siła Młodych");

		let structure;
		if (mainTeam) {
			console.log("📥 [STRUCTURE] Używam 'Siła Młodych' jako root");
			structure = mainTeam;
		} else {
			console.log("📥 [STRUCTURE] Tworzę sztuczny root 'Siła Młodych'");
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

		console.log("📥 [STRUCTURE] ✅ Struktura gotowa, wysyłam...");
		res.json(structure);
	} catch (error) {
		console.error("❌ [STRUCTURE] Błąd:", error);
		res.status(500).json({ error: "Nie udało się pobrać struktury" });
	}
});

// Funkcja pomocnicza do wyboru ikony

// ============================================================
// START SERWERA
// ============================================================
app.listen(port, () => {
	console.log(`🚀 Serwer działa na porcie ${port}`);
});
