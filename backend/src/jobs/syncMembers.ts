// src/jobs/syncMembers.ts

import dotenv from "dotenv";
dotenv.config();
import { logger } from "../utils/logger";
import { PrismaClient } from "@prisma/client";
import mysql from "mysql2/promise";

const prisma = new PrismaClient();

logger.debug("📋 [SYNC] Ładowanie konfiguracji z .env...");
logger.debug("📋 [SYNC] EWIDENCJA_DB_HOST:", process.env.EWIDENCJA_DB_HOST);
logger.debug("📋 [SYNC] EWIDENCJA_DB_USER:", process.env.EWIDENCJA_DB_USER);
const ALLOWED_PILLARS = [
	"Konferencyjny",
	"Rzeczniczy",
	"Symulacyjny",
	"Projektowy",
];
const externalDb = mysql.createPool({
	host: process.env.EWIDENCJA_DB_HOST || "57.128.253.89",
	user: process.env.EWIDENCJA_DB_USER || "czarnecki",
	password: process.env.EWIDENCJA_DB_PASSWORD || "N7#vQ4!xLp9@Tw2K",
	database: process.env.EWIDENCJA_DB_NAME || "SM_Ewidencja",
	waitForConnections: true,
	connectionLimit: 10,
});

// ============================================================
// 🔥 POŁĄCZENIE Z SM_Frekwencja DLA FILARÓW
// ============================================================
const frekwencjaDb = mysql.createPool({
	host: process.env.FREKWENCJA_DB_HOST || "57.128.253.89",
	user: process.env.FREKWENCJA_DB_USER || "czarnecki",
	password: process.env.FREKWENCJA_DB_PASSWORD || "N7#vQ4!xLp9@Tw2K",
	database: process.env.FREKWENCJA_DB_NAME || "SM_Frekwencja",
	waitForConnections: true,
	connectionLimit: 5,
});

function generateEmail(firstname: string, lastname: string): string {
	let firstName = firstname?.trim() || "";
	if (firstName.includes(" ")) {
		firstName = firstName.split(" ")[0];
	}

	const lastName = lastname?.trim() || "";

	const first = firstName.toLowerCase();
	const last = lastName.toLowerCase();

	const polishMap: Record<string, string> = {
		ą: "a",
		ć: "c",
		ę: "e",
		ł: "l",
		ń: "n",
		ó: "o",
		ś: "s",
		ź: "z",
		ż: "z",
		Ą: "a",
		Ć: "c",
		Ę: "e",
		Ł: "l",
		Ń: "n",
		Ó: "o",
		Ś: "s",
		Ź: "z",
		Ż: "z",
	};

	const removePolish = (text: string) => {
		return text.replace(
			/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g,
			(match) => polishMap[match] || match,
		);
	};

	const cleanFirst = removePolish(first);
	const cleanLast = removePolish(last);

	let email = `${cleanFirst}.${cleanLast}@silamlodych.pl`;

	email = email.replace(/[^a-z0-9.@_-]/g, "");

	return email;
}

function mapStatus(statusText: string): {
	status: string;
	isTrial: boolean;
	isActive: boolean;
	shouldSkip: boolean;
} {
	const normalized = statusText?.toLowerCase().trim() || "";

	if (normalized.includes("rezygnacja")) {
		return { status: "", isTrial: false, isActive: false, shouldSkip: true };
	}

	if (
		normalized.includes("członek zwyczajny") ||
		normalized.includes("czlonek zwyczajny")
	) {
		return {
			status: "active",
			isTrial: false,
			isActive: true,
			shouldSkip: false,
		};
	}

	if (normalized.includes("pozytywnie po okresie")) {
		return {
			status: "active",
			isTrial: false,
			isActive: true,
			shouldSkip: false,
		};
	}

	if (
		normalized.includes("okres wstępny") ||
		normalized.includes("okres wstepny")
	) {
		return {
			status: "trial",
			isTrial: true,
			isActive: true,
			shouldSkip: false,
		};
	}

	if (normalized.includes("nie po okresie")) {
		return {
			status: "trial",
			isTrial: true,
			isActive: true,
			shouldSkip: false,
		};
	}

	logger.debug(
		`⚠️ [SYNC] Nieznany status: "${statusText}" - traktuję jako trial`,
	);
	return { status: "trial", isTrial: true, isActive: true, shouldSkip: false };
}

export async function syncMembers() {
	logger.debug("🔄 [SYNC] Rozpoczynam synchronizację członków...");
	const startTime = Date.now();

	try {
		logger.debug("📥 [SYNC] Pobieranie danych z SM_Ewidencja.members...");

		const [rows] = (await externalDb.query(`
            SELECT 
                id,
                firstname,
                lastname,
                email,
                phone,
                status,
                created_at,
                updated_at
            FROM members
            WHERE firstname IS NOT NULL 
              AND firstname != ''
              AND lastname IS NOT NULL 
              AND lastname != ''
        `)) as any[];

		logger.debug(
			`📥 [SYNC] Pobrano ${rows.length} rekordów z zewnętrznej bazy`,
		);

		if (rows.length === 0) {
			logger.debug("⚠️ [SYNC] Brak danych do synchronizacji");
			return;
		}

		// ============================================================
		// 🔥 POBIERANIE FILARÓW Z SM_Frekwencja
		// ============================================================
		logger.debug("📥 [SYNC] Pobieranie filarów z SM_Frekwencja...");

		// Pobierz filary dla członków z att_member_pillars
		const [memberPillars] = (await frekwencjaDb.query(`
    SELECT 
        mp.member_id,
        p.name as pillar_name
    FROM att_member_pillars mp
    INNER JOIN att_pillars p ON p.id = mp.pillar_id
`)) as any[];

		// Stwórz mapę filarów dla każdego członka - TYLKO DOZWOLONE
		const pillarMap = new Map<number, string[]>();
		for (const row of memberPillars) {
			// 🔥 SPRAWDŹ CZY FILAR JEST NA LIŚCIE DOZWOLONYCH
			if (ALLOWED_PILLARS.includes(row.pillar_name)) {
				if (!pillarMap.has(row.member_id)) {
					pillarMap.set(row.member_id, []);
				}
				pillarMap.get(row.member_id)!.push(row.pillar_name);
			}
		}

		// Pobierz mapowanie email -> member_id z att_members
		const [attMembers] = (await frekwencjaDb.query(`
            SELECT id, email FROM att_members
        `)) as any[];

		const emailToMemberId = new Map<string, number>();
		for (const m of attMembers) {
			if (m.email) {
				emailToMemberId.set(m.email, m.id);
			}
		}

		logger.debug(
			`📊 [SYNC] Pobrano filary dla ${pillarMap.size} członków z SM_Frekwencja`,
		);

		// ============================================================
		// STATYSTYKI STATUSÓW
		// ============================================================
		const statusStats: Record<string, number> = {};
		for (const member of rows) {
			const status = member.status || "unknown";
			statusStats[status] = (statusStats[status] || 0) + 1;
		}
		logger.debug("📊 [SYNC] Statystyki statusów w SM_Ewidencja:");
		Object.entries(statusStats).forEach(([status, count]) => {
			logger.debug(`   ${status}: ${count}`);
		});

		const existingUsers = await prisma.user.findMany({
			where: {
				email: {
					not: null,
				},
			},
			select: {
				id: true,
				email: true,
				first_name: true,
				last_name: true,
				status: true,
				phone: true,
				is_trial: true,
				pillars: true,
				functional_role: true,
			},
		});

		const existingEmails = new Map(
			existingUsers.filter((u) => u.email).map((u) => [u.email as string, u]),
		);

		logger.debug(
			`📊 [SYNC] W głównej bazie: ${existingUsers.length} użytkowników`,
		);

		let added = 0;
		let updated = 0;
		let skipped = 0;
		let skippedRezygnacja = 0;
		let duplicateEmails = 0;

		const usedEmails = new Set<string>();

		for (const member of rows) {
			try {
				const generatedEmail = generateEmail(member.firstname, member.lastname);

				if (usedEmails.has(generatedEmail)) {
					duplicateEmails++;
					logger.debug(
						`⚠️ [SYNC] Duplikat emaila: ${generatedEmail} (${member.firstname} ${member.lastname}) - pomijam`,
					);
					continue;
				}
				usedEmails.add(generatedEmail);

				const mapped = mapStatus(member.status || "");

				if (mapped.shouldSkip) {
					skippedRezygnacja++;
					logger.debug(
						`⏭️ [SYNC] Pominięto (rezygnacja): ${generatedEmail} (${member.status})`,
					);
					continue;
				}

				const existing = existingEmails.get(generatedEmail);

				// ============================================================
				// 🔥 POBIERZ FILARY DLA TEGO CZŁONKA
				// ============================================================
				const memberId = emailToMemberId.get(generatedEmail);
				let pillarNames: string[] = [];

				if (memberId && pillarMap.has(memberId)) {
					pillarNames = pillarMap.get(memberId) || [];
				}

				const pillarString =
					pillarNames.length > 0 ? pillarNames.join(", ") : null;

				// ============================================================
				// 🔥 DANE UŻYTKOWNIKA Z FILARAMI I ROLĄ
				// ============================================================
				const userData = {
					username: generatedEmail.split("@")[0] || generatedEmail,
					email: generatedEmail,
					first_name: member.firstname?.trim() || "",
					last_name: member.lastname?.trim() || "",
					phone: member.phone?.trim() || null,
					status: mapped.status,
					is_active: mapped.isActive,
					is_trial: mapped.isTrial,
					role_id: 4, // member
					join_date: member.created_at ? new Date(member.created_at) : null,
					password_hash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
					functional_role: "Członek", // ← DOMYŚLNA ROLA
					pillars: pillarString, // ← FILARY
				};

				if (existing) {
					// Sprawdź czy zmieniły się dane (łącznie z filarami)
					const hasChanges =
						existing.first_name !== userData.first_name ||
						existing.last_name !== userData.last_name ||
						existing.status !== userData.status ||
						existing.phone !== userData.phone ||
						existing.is_trial !== userData.is_trial ||
						existing.pillars !== userData.pillars ||
						existing.functional_role !== userData.functional_role;

					if (hasChanges) {
						await prisma.user.update({
							where: { id: existing.id },
							data: {
								first_name: userData.first_name,
								last_name: userData.last_name,
								status: userData.status,
								phone: userData.phone,
								is_active: userData.is_active,
								is_trial: userData.is_trial,
								functional_role: userData.functional_role,
								pillars: userData.pillars,
							},
						});
						updated++;
						logger.debug(
							`🔄 [SYNC] Zaktualizowano: ${generatedEmail} | status: ${member.status} -> ${userData.status} | filary: ${userData.pillars || "brak"}`,
						);
					} else {
						skipped++;
					}
				} else {
					await prisma.user.create({
						data: userData,
					});
					added++;
					logger.debug(
						`✅ [SYNC] Dodano: ${generatedEmail} (${userData.first_name} ${userData.last_name}) | status: ${userData.status} | filary: ${userData.pillars || "brak"}`,
					);
				}
			} catch (error) {
				logger.error(
					`❌ [SYNC] Błąd przetwarzania ${member.firstname} ${member.lastname}:`,
					error,
				);
			}
		}

		const duration = Date.now() - startTime;
		logger.debug(`✅ [SYNC] Zakończono w ${duration}ms`);
		logger.debug(`📊 [SYNC] Podsumowanie:`);
		logger.debug(`   +${added} dodanych`);
		logger.debug(`   🔄${updated} zaktualizowanych`);
		logger.debug(`   ⏭️${skipped} bez zmian`);
		logger.debug(`   ⏭️${skippedRezygnacja} pominiętych (rezygnacja)`);
		if (duplicateEmails > 0) {
			logger.debug(`   ⚠️${duplicateEmails} pominiętych (duplikaty emaili)`);
		}

		try {
			await prisma.systemLog.create({
				data: {
					user_id: 0,
					user_name: "System",
					user_role: "system",
					action_type: "UPDATE",
					category: "USER",
					endpoint: "/api/admin/sync-members",
					method: "SYNC",
					entity_name: `Synchronizacja członków: +${added} dodanych, ${updated} zaktualizowanych, ${skipped} bez zmian, ${skippedRezygnacja} pominiętych`,
					changes: {
						added,
						updated,
						skipped,
						skippedRezygnacja,
						duplicateEmails,
						duration,
						timestamp: new Date().toISOString(),
					},
					status: "success",
				},
			});
		} catch (logError) {
			logger.error("❌ [SYNC] Błąd zapisu logu:", logError);
		}
	} catch (error) {
		logger.error("❌ [SYNC] Błąd synchronizacji:", error);
	}
}

export async function runSync() {
	try {
		await syncMembers();
		logger.debug("✅ [SYNC] Synchronizacja zakończona pomyślnie");
	} catch (error) {
		logger.error("❌ [SYNC] Krytyczny błąd synchronizacji:", error);
	}
}

if (require.main === module) {
	runSync()
		.then(() => process.exit(0))
		.catch((error) => {
			logger.error(error);
			process.exit(1);
		});
}
