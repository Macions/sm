// backend/src/server.ts
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { ProjectController } from "./controllers/project.controller";
import { UserController } from "./controllers/user.controller";
import { authMiddleware } from "./middleware/auth.middleware";
import memberRoutes from "./routes/member.routes";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import multer from "multer";

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
		1: "admin",
		2: "coordinator",
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
			if (!userId) {
				return res.status(401).json({ error: "Brak autoryzacji" });
			}

			const limit = parseInt(req.query.limit as string) || 4;

			const notifications = await prisma.notification.findMany({
				where: { user_id: userId },
				orderBy: { created_at: "desc" },
				take: limit,
			});

			const mappedNotifications = notifications.map((n: any) => ({
				id: n.id.toString(),
				message: n.message,
				type: n.type as "success" | "info" | "warning",
				time: formatTimeAgo(n.created_at),
				title: n.title,
				read: n.read || false,
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
app.get("/api/applications", authMiddleware, async (req: any, res) => {
	try {
		const userRole = req.user?.role;

		// Tylko admin i koordynator mogą widzieć wszystkie zgłoszenia
		if (userRole !== "admin" && userRole !== "coordinator") {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		console.log("📥 Pobieranie zgłoszeń...");

		const applications = await prisma.vacancyApplication.findMany({
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
			// Zbuduj obiekt odpowiedzi
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
		// Zwróć szczegółowy błąd
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
app.post("/api/vacancies/:id/apply", authMiddleware, async (req: any, res) => {
	try {
		const { id } = req.params;
		const userId = req.user?.id;
		const { message, answers } = req.body;

		if (!userId) {
			return res.status(401).json({ error: "Brak autoryzacji" });
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

		const application = await prisma.vacancyApplication.create({
			data: {
				vacancy_id: parseInt(id),
				user_id: userId,
				message: message || null,
				status: "pending",
			},
		});

		// Dodaj odpowiedzi na pytania
		if (answers && Object.keys(answers).length > 0) {
			await prisma.vacancyAnswer.createMany({
				data: Object.entries(answers).map(([questionId, answer]) => ({
					application_id: application.id,
					question_id: parseInt(questionId),
					answer: answer as string,
				})),
			});
		}

		res.status(201).json(application);
	} catch (error) {
		console.error("❌ Błąd zgłaszania na wakat:", error);
		res.status(500).json({ error: "Nie udało się zgłosić na wakat" });
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

		const teamMembers = await prisma.teamMember.findMany({
			select: {
				id: true,
				team_id: true,
				user_id: true,
				roles: true,
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
				is_leader: tm.is_leader || false,
			});
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
		console.error("❌ [STRUCTURE] Błąd:", error);
		res.status(500).json({ error: "Nie udało się pobrać struktury" });
	}
});
app.use("/api", memberRoutes);
// ============================================================
// PROFIL UŻYTKOWNIKA
// ============================================================

// 📥 GET - pobierz profil użytkownika (swój lub innego)
app.get("/api/profile", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Brak autoryzacji" });

		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
			include: { roles: true, team_members: { include: { team: true } }, onboarding_data: { orderBy: { created_at: "desc" }, take: 1 } },
		});

		if (!user) return res.status(404).json({ error: "Użytkownik nie znaleziony" });

		// Mapowanie danych
		const teams = user.team_members.map((tm: any) => tm.team?.name).filter(Boolean);
		const onboarding = user.onboarding_data?.[0] || {};

		const profile = {
			id: user.id.toString(),
			firstName: user.first_name,
			lastName: user.last_name,
			function: user.functional_role || "Członek",
			team: teams.length > 0 ? teams.join(", ") : (user.team || "Brak zespołu"),
			province: user.province || "Brak danych",
			status: user.status || "active",
			email: user.email || "",
			phone: user.phone || undefined,
			joinDate: user.join_date?.toISOString().split("T")[0] || user.created_at.toISOString().split("T")[0],
			currentTasks: [],
			projects: [],
			developmentAreas: onboarding.development_areas ? JSON.parse(onboarding.development_areas) : [],
			skills: onboarding.skills ? JSON.parse(onboarding.skills) : [],
			availability: onboarding.availability || "Uzgodnij z koordynatorem",
			description: onboarding.description || "",
			contacts: {
				salaContacts: onboarding.sala_contacts ? JSON.parse(onboarding.sala_contacts) : [],
				mpContacts: onboarding.mp_contacts ? JSON.parse(onboarding.mp_contacts) : [],
				institutionContacts: onboarding.institution_contacts ? JSON.parse(onboarding.institution_contacts) : [],
				otherContacts: onboarding.other_contacts ? JSON.parse(onboarding.other_contacts) : [],
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

		// Pobierz urlopy z bazy
		const leaves = await prisma.leave.findMany({
			include: {
				user: {
					select: {
						id: true,
						first_name: true,
						last_name: true,
						email: true,
						team: true,
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

		// Mapuj dane
		const mappedLeaves = leaves.map((leave: any) => {
			const user = leave.user;
			const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Nieznany';

			// Sprawdź czy użytkownik może zobaczyć ten urlop
			let canView = false;
			if (userRole === 'admin') {
				canView = true;
			} else if (userRole === 'coordinator') {
				// Koordynator widzi urlopy swojego zespołu
				canView = user?.team === userTeam || leave.affected_teams?.includes(userTeam) || userId === leave.user_id;
			} else {
				canView = userId === leave.user_id;
			}

			if (!canView) return null;

			return {
				id: leave.id.toString(),
				userId: leave.user_id.toString(),
				userName: userName,
				userTeam: user?.team || "Brak zespołu",
				type: leave.type || "vacation",
				scope: leave.scope || "all",
				affectedTeams: leave.affected_teams ? JSON.parse(leave.affected_teams) : [],
				startDate: leave.start_date.toISOString().split("T")[0],
				endDate: leave.end_date.toISOString().split("T")[0],
				reason: leave.reason || "",
				reasonVisibility: leave.reason_visibility || "private",
				status: leave.status || "pending",
				createdAt: leave.created_at.toISOString(),
				approvedBy: leave.approved_by || undefined,
				approvedAt: leave.approved_at?.toISOString(),
				attachments: leave.attachments ? JSON.parse(leave.attachments) : [],
				comments: leave.comments?.map((c: any) => ({
					id: c.id.toString(),
					author: c.author ? `${c.author.first_name || ''} ${c.author.last_name || ''}`.trim() : 'Nieznany',
					content: c.content,
					createdAt: c.created_at.toISOString(),
				})) || [],
			};
		}).filter(Boolean); // Usuń null-e (urlopy, których nie może zobaczyć)

		res.json(mappedLeaves);
	} catch (error) {
		console.error("❌ Błąd pobierania urlopów:", error);
		res.status(500).json({ error: "Nie udało się pobrać urlopów" });
	}
});

// 📤 POST - utwórz nowy wniosek urlopowy
// 📤 POST - utwórz nowy wniosek urlopowy
app.post("/api/leaves", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) return res.status(401).json({ error: "Brak autoryzacji" });

		console.log("📥 OTRZYMANE DANE:", req.body); // ⭐ LOG

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
			return res.status(400).json({ error: "Data rozpoczęcia i zakończenia są wymagane" });
		}

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

		console.log("✅ UTOWORZONO URLOP:", leave); // ⭐ LOG

		// ⭐ ZWRÓĆ DANE W FORMACIE OCZEKIWANYM PRZEZ FRONTEND
		const userName = req.user ? `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 'Nieznany' : 'Nieznany';
		const userTeam = req.user?.team || "Brak zespołu";

		res.status(201).json({
			id: leave.id.toString(),
			userId: leave.user_id.toString(),
			userName: userName,
			userTeam: userTeam,
			type: leave.type,
			scope: leave.scope,
			affectedTeams: leave.affected_teams ? JSON.parse(leave.affected_teams) : [],
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
app.put("/api/leaves/:id", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		const userRole = req.user?.role;
		const leaveId = parseInt(req.params.id);

		if (!userId) return res.status(401).json({ error: "Brak autoryzacji" });

		const existingLeave = await prisma.leave.findUnique({
			where: { id: leaveId },
		});

		if (!existingLeave) {
			return res.status(404).json({ error: "Nie znaleziono wniosku" });
		}

		// Sprawdź uprawnienia - tylko admin, koordynator lub autor wniosku
		if (userRole !== "admin" && userRole !== "coordinator" && existingLeave.user_id !== userId) {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		// Nie można edytować zatwierdzonego lub odrzuconego wniosku (chyba że admin)
		if (existingLeave.status !== "pending" && userRole !== "admin") {
			return res.status(400).json({ error: "Nie można edytować już rozpatrzonego wniosku" });
		}

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

		const leave = await prisma.leave.update({
			where: { id: leaveId },
			data: {
				type: type || existingLeave.type,
				scope: scope || existingLeave.scope,
				affected_teams: affectedTeams ? JSON.stringify(affectedTeams) : existingLeave.affected_teams,
				start_date: startDate ? new Date(startDate) : existingLeave.start_date,
				end_date: endDate ? new Date(endDate) : existingLeave.end_date,
				reason: reason !== undefined ? reason : existingLeave.reason,
				reason_visibility: reasonVisibility || existingLeave.reason_visibility,
				attachments: attachments ? JSON.stringify(attachments) : existingLeave.attachments,
				status: status || existingLeave.status,
				...(status === "approved" || status === "rejected" ? {
					approved_by: req.user.first_name + " " + req.user.last_name,
					approved_at: new Date(),
				} : {}),
			},
		});

		res.json(leave);
	} catch (error) {
		console.error("❌ Błąd aktualizacji wniosku:", error);
		res.status(500).json({ error: "Nie udało się zaktualizować wniosku" });
	}
});

// 🗑️ DELETE - usuń wniosek urlopowy
app.delete("/api/leaves/:id", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		const userRole = req.user?.role;
		const leaveId = parseInt(req.params.id);

		const existingLeave = await prisma.leave.findUnique({
			where: { id: leaveId },
		});

		if (!existingLeave) {
			return res.status(404).json({ error: "Nie znaleziono wniosku" });
		}

		// Sprawdź uprawnienia
		if (userRole !== "admin" && existingLeave.user_id !== userId) {
			return res.status(403).json({ error: "Brak uprawnień" });
		}

		await prisma.leave.delete({
			where: { id: leaveId },
		});

		res.status(204).send();
	} catch (error) {
		console.error("❌ Błąd usuwania wniosku:", error);
		res.status(500).json({ error: "Nie udało się usunąć wniosku" });
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

		const { firstName, lastName, province, description, skills, developmentAreas, availability, phone } = req.body;

		await prisma.user.update({
			where: { id: userId },
			data: { first_name: firstName, last_name: lastName, province, phone },
		});

		const existing = await prisma.onboarding_data.findFirst({ where: { user_id: userId }, orderBy: { created_at: "desc" } });

		if (existing) {
			await prisma.onboarding_data.update({
				where: { id: existing.id },
				data: { description, skills: JSON.stringify(skills), development_areas: JSON.stringify(developmentAreas), availability },
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

		const onboarding = await prisma.onboarding_data.findFirst({ where: { user_id: userId }, orderBy: { created_at: "desc" } });
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
app.delete("/api/profile/skills/:skill", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		const skillToRemove = decodeURIComponent(req.params.skill);

		const onboarding = await prisma.onboarding_data.findFirst({ where: { user_id: userId }, orderBy: { created_at: "desc" } });
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
});
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
