import express from "express";
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth.middleware";
import * as jwt from "jsonwebtoken";
const router = express.Router();
const prisma = new PrismaClient();

const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.GOOGLE_REDIRECT_URI ||
		(process.env.NODE_ENV === "production"
			? "https://panel.silamlodych.pl/api/calendar/callback"
			: "http://localhost:3000/api/calendar/callback"),
);
router.use((req, res, next) => {
	if (
		req.path === "/callback" ||
		req.path === "/auth" ||
		req.path === "/api/calendar/callback" ||
		req.path === "/api/calendar/auth" ||
		req.path.includes("callback") ||
		req.path.includes("auth")
	) {
		return next();
	}
	next();
});

router.get("/status", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
			select: { google_calendar_token: true },
		});

		res.json({
			authenticated: !!user?.google_calendar_token,
		});
	} catch (error) {
		console.error(" Błąd sprawdzania statusu:", error);
		res.status(500).json({ error: "Błąd serwera" });
	}
});

router.get("/events", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;

		if (!userId) {
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
			select: { google_calendar_token: true },
		});

		if (!user?.google_calendar_token) {
			return res.status(401).json({
				error: "Brak autoryzacji Google Calendar",
				needAuth: true,
			});
		}

		const tokenData = JSON.parse(user.google_calendar_token);

		oauth2Client.setCredentials({
			access_token: tokenData.access_token,
			refresh_token: tokenData.refresh_token,
		});

		const calendar = google.calendar({ version: "v3", auth: oauth2Client });

		const now = new Date();
		const startDate = new Date(now);
		startDate.setDate(startDate.getDate() - 30);
		const endDate = new Date(now);
		endDate.setDate(endDate.getDate() + 30);

		const response = await calendar.events.list({
			calendarId: "primary",
			timeMin: startDate.toISOString(),
			timeMax: endDate.toISOString(),
			maxResults: 100,
			singleEvents: true,
			orderBy: "startTime",
		});

		const events = response.data.items || [];

		// Pobierz zgłoszone nieobecności tego użytkownika
		const absences = await prisma.eventAbsence.findMany({
			where: {
				user_id: parseInt(userId),
			},
			select: { event_id: true },
		});

		const absenceIds = new Set(absences.map((a) => a.event_id));

		// Wzbogać eventy o pole absenceReported
		const enrichedEvents = events.map((ev) => ({
			...ev,
			absenceReported: absenceIds.has(ev.id || ""),
		}));

		res.json(enrichedEvents);
	} catch (error) {
		console.error(" [EVENTS] Błąd:", error);
		res.status(500).json({
			error: "Nie udało się pobrać wydarzeń",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
});
// Zgłoś nieobecność na wydarzeniu Google Calendar
router.post(
	"/events/:eventId/absence",
	authMiddleware,
	async (req: any, res) => {
		try {
			const userId = req.user?.id;
			const { eventId } = req.params;
			const { eventTitle, eventDate } = req.body;

			if (!userId) {
				return res.status(401).json({ message: "Brak autoryzacji" });
			}

			if (!eventId || !eventDate) {
				return res.status(400).json({ message: "Brak ID wydarzenia lub daty" });
			}

			// Walidacja 24h
			const eventDateTime = new Date(eventDate);
			const diffHours =
				(eventDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

			if (diffHours < 24) {
				return res.status(400).json({
					message: "Nieobecność można zgłosić minimum 24h przed wydarzeniem",
				});
			}

			// Sprawdź czy już zgłoszono
			const existing = await prisma.eventAbsence.findUnique({
				where: {
					unique_event_user_absence: {
						event_id: eventId,
						user_id: parseInt(userId),
					},
				},
			});

			if (existing) {
				return res
					.status(400)
					.json({ message: "Nieobecność została już zgłoszona" });
			}

			// Utwórz zgłoszenie
			const absence = await prisma.eventAbsence.create({
				data: {
					event_id: eventId,
					user_id: parseInt(userId),
					event_title: eventTitle || "Bez tytułu",
					event_date: eventDateTime,
					source: "google",
					status: "pending",
				},
			});

			// Powiadomienie do admina
			try {
				const admin = await prisma.user.findFirst({
					where: { role_id: 1 },
					select: { id: true },
				});

				if (admin) {
					await prisma.notification.create({
						data: {
							user_id: admin.id,
							title: "Zgłoszono nieobecność",
							message: `${req.user?.first_name || ""} ${req.user?.last_name || ""} zgłosił(a) nieobecność na: "${eventTitle || "Bez tytułu"}"`,
							type: "info",
							read: false,
							link: "/calendar",
							target: "admin",
							created_at: new Date(),
						},
					});
				}
			} catch (notifError) {
				console.error("[NOTIF] Błąd:", notifError);
			}

			res.json({
				success: true,
				message: "Nieobecność zgłoszona pomyślnie",
				absence: {
					id: absence.id,
					eventId: absence.event_id,
					status: absence.status,
					reportedAt: absence.reported_at,
				},
			});
		} catch (error) {
			console.error("[EVENT ABSENCE] Błąd:", error);
			res.status(500).json({
				message: "Wystąpił błąd podczas zgłaszania nieobecności",
				details: error instanceof Error ? error.message : "Unknown error",
			});
		}
	},
);

// Pobierz moje zgłoszone nieobecności (opcjonalnie do debugowania)
router.get("/absences/my", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ message: "Brak autoryzacji" });
		}

		const absences = await prisma.eventAbsence.findMany({
			where: { user_id: parseInt(userId) },
			orderBy: { reported_at: "desc" },
		});

		res.json(absences);
	} catch (error) {
		console.error("[ABSENCES] Błąd:", error);
		res.status(500).json({ message: "Błąd serwera" });
	}
});
router.post("/sync", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		const { taskId } = req.body;

		if (!userId || !taskId) {
			return res.status(400).json({ error: "Brak wymaganych danych" });
		}

		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
			select: { google_calendar_token: true },
		});

		if (!user?.google_calendar_token) {
			return res.status(401).json({
				error: "Brak autoryzacji Google Calendar",
				needAuth: true,
			});
		}

		const task = await prisma.task.findUnique({
			where: { id: parseInt(taskId) },
		});

		if (!task) {
			return res.status(404).json({ error: "Nie znaleziono zadania" });
		}

		const tokenData = JSON.parse(user.google_calendar_token);
		oauth2Client.setCredentials({
			access_token: tokenData.access_token,
			refresh_token: tokenData.refresh_token,
		});

		const calendar = google.calendar({ version: "v3", auth: oauth2Client });

		const event = {
			summary: task.title,
			description: task.description || "Zadanie z Siły Młodych",
			start: {
				dateTime: task.due_date.toISOString(),
				timeZone: "Europe/Warsaw",
			},
			end: {
				dateTime: new Date(
					new Date(task.due_date).getTime() + 3600000,
				).toISOString(),
				timeZone: "Europe/Warsaw",
			},
		};

		const response = await calendar.events.insert({
			calendarId: "primary",
			requestBody: event,
		});

		res.json({
			success: true,
			eventUrl: response.data.htmlLink,
			eventId: response.data.id,
		});
	} catch (error) {
		console.error(" Błąd synchronizacji z Google:", error);
		res.status(500).json({
			error: "Nie udało się zsynchronizować",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

router.get("/auth", async (req: any, res) => {
	try {
		let userId = null;
		const authHeader = req.headers.authorization;
		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.split(" ")[1];
			try {
				const decoded = jwt.verify(
					token,
					process.env.JWT_SECRET || "your-secret-key",
				);
				if (typeof decoded !== "string" && decoded && "id" in decoded) {
					userId = decoded.id as string;
				}
			} catch (e) {
				console.error(" [AUTH] Błąd weryfikacji:", e);
			}
		}

		if (!userId) {
			userId = "1";
		}

		const stateData = JSON.stringify({ userId: userId });
		const authUrl = oauth2Client.generateAuthUrl({
			access_type: "offline",
			scope: [
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/userinfo.profile",
				"https://www.googleapis.com/auth/calendar.events",
				"https://www.googleapis.com/auth/calendar.readonly",
			],
			include_granted_scopes: true,
			state: stateData,
			redirect_uri:
				process.env.GOOGLE_REDIRECT_URI ||
				"http://localhost:3000/api/calendar/callback",
		});

		res.json({ authUrl });
	} catch (error) {
		console.error(" [AUTH] Błąd:", error);
		res.status(500).json({ error: "Nie udało się wygenerować URL" });
	}
});

router.get("/callback", async (req: any, res) => {
	try {
		const { code, state } = req.query;

		if (!code) {
			return res.redirect(`${process.env.FRONTEND_URL}/calendar?auth=error`);
		}

		let userId = null;
		if (state) {
			try {
				const stateObj = JSON.parse(state as string);
				userId = stateObj.userId || stateObj.user_id;
			} catch (e) {
				console.error(" [CALLBACK] Błąd parsowania state:", e);
			}
		}

		if (!userId) {
			userId = "1";
		}

		const { tokens } = await oauth2Client.getToken(code as string);

		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
		});

		if (!user) {
			console.error(` [CALLBACK] Użytkownik ${userId} nie istnieje!`);

			const firstUser = await prisma.user.findFirst();
			if (firstUser) {
				await prisma.user.update({
					where: { id: firstUser.id },
					data: {
						google_calendar_token: JSON.stringify(tokens),
					},
				});
				return res.redirect(
					`${process.env.FRONTEND_URL}/calendar?auth=success`,
				);
			}
			return res.redirect(`${process.env.FRONTEND_URL}/calendar?auth=error`);
		}

		await prisma.user.update({
			where: { id: parseInt(userId) },
			data: {
				google_calendar_token: JSON.stringify(tokens),
			},
		});

		res.redirect(`${process.env.FRONTEND_URL}/calendar?auth=success`);
	} catch (error) {
		console.error(" [CALLBACK] Błąd:", error);
		res.redirect(`${process.env.FRONTEND_URL}/calendar?auth=error`);
	}
});

export default router;
