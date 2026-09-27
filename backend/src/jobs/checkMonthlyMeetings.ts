import { PrismaClient } from "@prisma/client";
import mysql from "mysql2/promise";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

// ─── Konfiguracja ───
const MIN_MEETINGS_PER_MONTH = 2;

// Mapa: nazwa filaru w bazie → nazwa w SM (jeśli różne)
const PILLAR_LABEL_MAP: Record<string, string> = {
	Projektowy: "Filar Projektowy",
	Konferencyjny: "Filar Konferencyjny",
	Rzeczniczy: "Filar Rzeczniczy",
	Symulacyjny: "Filar Symulacyjny",
	OSOM: "Projekt OSOM",
	"Forum Młodych": "Projekt Forum Młodych",
};

async function getFrekwencjaConnection() {
	return mysql.createConnection({
		host: process.env.FREKWENCJA_DB_HOST || "57.128.253.89",
		user: process.env.FREKWENCJA_DB_USER || "czarnecki",
		password: process.env.FREKWENCJA_DB_PASSWORD || "",
		database: process.env.FREKWENCJA_DB_NAME || "SM_Frekwencja",
		port: parseInt(process.env.FREKWENCJA_DB_PORT || "3306"),
	});
}

export async function checkMonthlyMeetings() {
	logger.info("[CHECK-MEETINGS] Start sprawdzania spotkań filarów...");

	const now = new Date();
	// Sprawdzamy POPRZEDNI miesiąc (bo bieżący jeszcze się nie skończył)
	const targetDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const year = targetDate.getFullYear();
	const month = targetDate.getMonth() + 1; // 1-12

	const monthName = targetDate.toLocaleDateString("pl-PL", {
		month: "long",
		year: "numeric",
	});

	logger.info(`[CHECK-MEETINGS] Sprawdzam miesiąc: ${year}-${month}`);

	let connection;
	try {
		connection = await getFrekwencjaConnection();

		// 1. Pobierz wszystkie filary (bez "Wszyscy")
		const [pillarRows] = await connection.execute(
			`SELECT id, name FROM att_pillars WHERE name <> 'Wszyscy'`,
		);

		const pillars = pillarRows as Array<{ id: number; name: string }>;

		// 2. Dla każdego filaru policz spotkania w danym miesiącu
		const results: Array<{
			pillarId: number;
			pillarName: string;
			meetingsCount: number;
		}> = [];

		for (const pillar of pillars) {
			const [meetingRows] = await connection.execute(
				`
				SELECT COUNT(*) AS count
				FROM att_meetings
				WHERE pillar_id = ?
					AND YEAR(meeting_date) = ?
					AND MONTH(meeting_date) = ?
				`,
				[pillar.id, year, month],
			);

			const count = Number((meetingRows as any[])[0]?.count ?? 0);
			results.push({
				pillarId: pillar.id,
				pillarName: pillar.name,
				meetingsCount: count,
			});
		}

		logger.info(`[CHECK-MEETINGS] Wyniki: ${JSON.stringify(results, null, 2)}`);

		// 3. Dla filarów z < MIN → wyślij powiadomienia
		const badPillars = results.filter(
			(r) => r.meetingsCount < MIN_MEETINGS_PER_MONTH,
		);

		if (badPillars.length === 0) {
			logger.info(
				"[CHECK-MEETINGS] Wszystkie filary mają wymaganą liczbę spotkań.",
			);
			return { checked: results.length, alerts: 0 };
		}

		logger.warn(
			`[CHECK-MEETINGS] ${badPillars.length} filarów ma za mało spotkań.`,
		);

		let alertsSent = 0;

		for (const badPillar of badPillars) {
			const pillarLabel =
				PILLAR_LABEL_MAP[badPillar.pillarName] ||
				`Filar ${badPillar.pillarName}`;

			const msg = `Filar "${pillarLabel}" miał w ${monthName} tylko ${badPillar.meetingsCount} ${badPillar.meetingsCount === 1 ? "spotkanie" : "spotkania"} (wymagane minimum: ${MIN_MEETINGS_PER_MONTH}).`;

			// 3a. Znajdź liderów tego filaru w SM
			const pillarFullName = pillarLabel; // np. "Filar Projektowy"

			const leaders = await prisma.teamMember.findMany({
				where: {
					is_leader: true,
					team: {
						name: pillarFullName,
					},
				},
				select: { user_id: true },
			});

			const leaderIds = leaders.map((l) => l.user_id);

			// 3b. Znajdź adminów i board (role_id 1, 2)
			const admins = await prisma.user.findMany({
				where: {
					is_active: true,
					role_id: { in: [1, 2] },
				},
				select: { id: true },
			});

			const adminIds = admins.map((a) => a.id);

			// Połącz i usuń duplikaty
			const allRecipients = Array.from(new Set([...leaderIds, ...adminIds]));

			if (allRecipients.length === 0) {
				logger.warn(
					`[CHECK-MEETINGS] Brak odbiorców dla filaru ${pillarLabel}`,
				);
				continue;
			}

			// 3c. Wyślij powiadomienia
			await prisma.notification.createMany({
				data: allRecipients.map((uid) => ({
					user_id: uid,
					title: "Za mało spotkań w filarze",
					message: msg,
					type: "warning",
					read: false,
					link: `/myTeam`,
					target: "user",
					created_at: new Date(),
				})),
			});

			alertsSent += allRecipients.length;
			logger.info(
				`[CHECK-MEETINGS] Wysłano alert dla ${pillarLabel} do ${allRecipients.length} osób.`,
			);
		}

		logger.info(`[CHECK-MEETINGS] Zakończono. Alertów wysłano: ${alertsSent}`);

		return {
			checked: results.length,
			alerts: alertsSent,
			badPillars: badPillars.length,
		};
	} catch (error) {
		logger.error("[CHECK-MEETINGS] Błąd:", error);
		throw error;
	} finally {
		if (connection) await connection.end();
	}
}
