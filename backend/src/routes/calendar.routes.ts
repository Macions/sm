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
			? "https://panel.silamlodych.pl/api/calendar/callback" // ✅ PRZEZ NGINX, BEZ PORTU
			: "http://localhost:3000/api/calendar/callback"),
);
router.use((req, res, next) => {
	console.log("🔍 [CALENDAR] Ścieżka:", req.path);
	// Pomijamy autoryzację dla callback i auth
	if (
		req.path === "/callback" ||
		req.path === "/auth" ||
		req.path === "/api/calendar/callback" ||
		req.path === "/api/calendar/auth" ||
		req.path.includes("callback") ||
		req.path.includes("auth")
	) {
		console.log(`🔓 [CALENDAR] Pomijam autoryzację dla: ${req.path}`);
		return next();
	}
	next();
});

router.get("/status", authMiddleware, async (req: any, res) => {
	// ← DODAJ authMiddleware
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
router.get("/events", authMiddleware, async (req: any, res) => {
	try {
		const userId = req.user?.id;
		console.log("📅 [EVENTS] Pobieranie dla użytkownika:", userId);

		if (!userId) {
			return res.status(401).json({ error: "Brak autoryzacji" });
		}

		// Pobierz token z bazy
		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
			select: { google_calendar_token: true },
		});

		console.log("📅 [EVENTS] Token w bazie:", !!user?.google_calendar_token);

		if (!user?.google_calendar_token) {
			return res.status(401).json({
				error: "Brak autoryzacji Google Calendar",
				needAuth: true,
			});
		}

		const tokenData = JSON.parse(user.google_calendar_token);
		console.log("📅 [EVENTS] Token parsed:", !!tokenData);

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

		console.log(
			"📅 [EVENTS] Zakres dat:",
			startDate.toISOString(),
			"do",
			endDate.toISOString(),
		);

		const response = await calendar.events.list({
			calendarId: "primary",
			timeMin: startDate.toISOString(),
			timeMax: endDate.toISOString(),
			maxResults: 100,
			singleEvents: true,
			orderBy: "startTime",
		});

		console.log(
			"📅 [EVENTS] Znaleziono eventów:",
			response.data.items?.length || 0,
		);
		res.json(response.data.items || []);
	} catch (error) {
		console.error("❌ [EVENTS] Błąd:", error);
		res.status(500).json({
			error: "Nie udało się pobrać wydarzeń",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

// ============================================================
// 📌 ENDPOINT: Synchronizuj zadanie z Google Calendar
// ============================================================
router.post("/sync", authMiddleware, async (req: any, res) => {
	// ← DODAJ authMiddleware
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
router.get("/auth", async (req: any, res) => {
	// ← USUŃ authMiddleware!
	try {
		// Pobierz userId z tokena RĘCZNIE
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
				console.error("❌ [AUTH] Błąd weryfikacji:", e);
			}
		}

		if (!userId) {
			console.log("⚠️ [AUTH] Brak userId - używam 1");
			userId = "1";
		}

		console.log("🔐 [AUTH] Użytkownik ID:", userId);

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
		console.error("❌ [AUTH] Błąd:", error);
		res.status(500).json({ error: "Nie udało się wygenerować URL" });
	}
});

// ✅ CALLBACK NIE MOŻE MIEĆ authMiddleware!
router.get("/callback", async (req: any, res) => {
	// ← BEZ authMiddleware!
	try {
		const { code, state } = req.query;

		console.log("=========================================");
		console.log("📥 [CALLBACK] Otrzymano code:", code ? "✅" : "❌");
		console.log("📥 [CALLBACK] Code:", code?.substring(0, 20) + "...");
		console.log("📥 [CALLBACK] State:", state);
		console.log("=========================================");

		if (!code) {
			console.log("❌ [CALLBACK] Brak code");
			return res.redirect(`${process.env.FRONTEND_URL}/calendar?auth=error`);
		}

		// DEKODUJ STATE
		let userId = null;
		if (state) {
			try {
				const stateObj = JSON.parse(state as string);
				userId = stateObj.userId || stateObj.user_id;
				console.log("✅ [CALLBACK] userId z state:", userId);
			} catch (e) {
				console.error("❌ [CALLBACK] Błąd parsowania state:", e);
			}
		}

		// Jeśli brak userId - użyj domyślnego
		if (!userId) {
			console.log("⚠️ [CALLBACK] Brak userId - używam domyślnego (1)");
			userId = "1";
		}

		// Wymień code na token
		console.log("🔐 [CALLBACK] Wymiana kodu na token...");
		const { tokens } = await oauth2Client.getToken(code as string);
		console.log("✅ [CALLBACK] Otrzymano token:", {
			hasAccessToken: !!tokens.access_token,
			hasRefreshToken: !!tokens.refresh_token,
		});

		// Znajdź użytkownika
		const user = await prisma.user.findUnique({
			where: { id: parseInt(userId) },
		});

		if (!user) {
			console.error(`❌ [CALLBACK] Użytkownik ${userId} nie istnieje!`);
			// Spróbuj znaleźć po emailu
			const firstUser = await prisma.user.findFirst();
			if (firstUser) {
				console.log(
					`👉 [CALLBACK] Używam pierwszego użytkownika: ${firstUser.id}`,
				);
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

		// Zapisz token
		console.log(`💾 [CALLBACK] Zapisuję token dla: ${user.email}`);
		await prisma.user.update({
			where: { id: parseInt(userId) },
			data: {
				google_calendar_token: JSON.stringify(tokens),
			},
		});
		console.log(`✅ [CALLBACK] Token zapisany!`);

		res.redirect(`${process.env.FRONTEND_URL}/calendar?auth=success`);
	} catch (error) {
		console.error("❌ [CALLBACK] Błąd:", error);
		res.redirect(`${process.env.FRONTEND_URL}/calendar?auth=error`);
	}
});

export default router;
