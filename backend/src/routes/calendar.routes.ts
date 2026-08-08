import express from "express";
import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth.middleware";
const router = express.Router();
const prisma = new PrismaClient();

const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_CLIENT_ID,
	process.env.GOOGLE_CLIENT_SECRET,
	process.env.GOOGLE_REDIRECT_URI ||
		"http://localhost:3000/api/calendar/callback",
);

router.get("/status", async (req: any, res) => {
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
		console.error("❌ Błąd sprawdzania statusu:", error);
		res.status(500).json({ error: "Błąd serwera" });
	}
});

// ============================================================
// 📌 ENDPOINT: Pobierz eventy z Google Calendar
// ============================================================
router.get("/events", async (req: any, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		// Pobierz token z bazy
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

		// Pobierz eventy z ostatnich 30 dni i następnych 30 dni
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

		res.json(response.data.items || []);
	} catch (error) {
		console.error("❌ Błąd pobierania eventów z Google:", error);
		res.status(500).json({
			error: "Nie udało się pobrać wydarzeń",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

// ============================================================
// 📌 ENDPOINT: Synchronizuj zadanie z Google Calendar
// ============================================================
router.post("/sync", async (req: any, res) => {
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

		// Pobierz zadanie
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

		// Utwórz event w Google Calendar
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
				).toISOString(), // 1h później
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
		console.error("❌ Błąd synchronizacji z Google:", error);
		res.status(500).json({
			error: "Nie udało się zsynchronizować",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

// ============================================================
// 📌 ENDPOINT: Rozpocznij autoryzację Google Calendar
// ============================================================
router.get("/auth", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		console.log("🔐 [AUTH] Użytkownik ID:", userId);

		// 🔥 DODAJ WSZYSTKIE PARAMETRY
		const authUrl = oauth2Client.generateAuthUrl({
			access_type: "offline",
			response_type: "code", // ← TO BYŁO POMINIĘTE!
			scope: [
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/userinfo.profile",
				"https://www.googleapis.com/auth/calendar.events",
				"https://www.googleapis.com/auth/calendar.readonly",
			],
			include_granted_scopes: true,
			state: JSON.stringify({ userId: userId }),
			redirect_uri:
				process.env.GOOGLE_REDIRECT_URI ||
				"http://localhost:3000/api/calendar/callback",
		});

		console.log("🔐 [AUTH] Wygenerowano URL");
		res.json({ authUrl });
	} catch (error) {
		console.error("❌ Błąd generowania URL autoryzacji:", error);
		res
			.status(500)
			.json({ error: "Nie udało się wygenerować URL autoryzacji" });
	}
});

router.get("/callback", async (req: any, res) => {
	try {
		const { code, state } = req.query;

		console.log("📥 [CALLBACK] Otrzymano code:", code ? "✅" : "❌");
		console.log("📥 [CALLBACK] Otrzymano state:", state ? "✅" : "❌");
		console.log("📥 [CALLBACK] State raw:", state);

		if (!code) {
			console.log("❌ [CALLBACK] Brak code");
			return res.redirect(`${process.env.FRONTEND_URL}/calendar?auth=error`);
		}

		// Dekoduj state
		let userId = null;
		if (state) {
			try {
				const stateObj = JSON.parse(state as string);
				userId = stateObj.userId;
				console.log("✅ [CALLBACK] userId z state:", userId);
			} catch (e) {
				console.error("❌ [CALLBACK] Błąd parsowania state:", e);
				// Spróbuj z base64
				try {
					const decoded = JSON.parse(
						Buffer.from(state as string, "base64").toString(),
					);
					userId = decoded.userId;
					console.log("✅ [CALLBACK] userId z state (base64):", userId);
				} catch (e2) {
					console.error("❌ [CALLBACK] Błąd parsowania state (base64):", e2);
				}
			}
		}

		console.log("🔐 [CALLBACK] Wymiana kodu na token...");
		const { tokens } = await oauth2Client.getToken(code as string);
		console.log("✅ [CALLBACK] Otrzymano token");

		if (userId) {
			console.log("💾 [CALLBACK] Zapisuję token dla użytkownika:", userId);

			// Sprawdź czy użytkownik istnieje
			const user = await prisma.user.findUnique({
				where: { id: parseInt(userId) },
			});

			if (!user) {
				console.error("❌ [CALLBACK] Użytkownik nie istnieje:", userId);
				return res.redirect(`${process.env.FRONTEND_URL}/calendar?auth=error`);
			}

			// Zapisz token
			await prisma.user.update({
				where: { id: parseInt(userId) },
				data: {
					google_calendar_token: JSON.stringify(tokens),
				},
			});
			console.log("✅ [CALLBACK] Token zapisany dla użytkownika:", user.email);
		} else {
			console.log("⚠️ [CALLBACK] Brak userId - nie zapisuję tokena");
		}

		res.redirect(`${process.env.FRONTEND_URL}/calendar?auth=success`);
	} catch (error) {
		console.error("❌ [CALLBACK] Błąd:", error);
		res.redirect(`${process.env.FRONTEND_URL}/calendar?auth=error`);
	}
});

export default router;
