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
		// logger.debug("📥 [SYNC] Pobieranie danych z SM_Ewidencja.members...");

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
		// 🔥 KROK 1: USUŃ UŻYTKOWNIKÓW Z REZYGNACJĄ
		// ============================================================
		const [resignedMembers] = (await externalDb.query(`
			SELECT 
				id,
				firstname,
				lastname,
				email,
				status
			FROM members
			WHERE LOWER(status) LIKE '%rezygnacja%'
		`)) as any[];

		if (resignedMembers.length > 0) {
			logger.debug(
				`👥 [SYNC] Znaleziono ${resignedMembers.length} użytkowników z rezygnacją do usunięcia`,
			);

			let deletedCount = 0;
			for (const resigned of resignedMembers) {
				const email = generateEmail(resigned.firstname, resigned.lastname);

				const existingUser = await prisma.user.findUnique({
					where: { email: email },
					select: { id: true, email: true, first_name: true, last_name: true },
				});

				if (existingUser) {
					try {
						await prisma.$transaction([
							prisma.onboarding_data.deleteMany({
								where: { user_id: existingUser.id },
							}),
							prisma.teamMember.deleteMany({
								where: { user_id: existingUser.id },
							}),
							prisma.contribution.deleteMany({
								where: { userId: existingUser.id },
							}),
							prisma.notification.deleteMany({
								where: { user_id: existingUser.id },
							}),
							prisma.user.delete({
								where: { id: existingUser.id },
							}),
						]);

						deletedCount++;
						logger.debug(
							`🗑️ [SYNC] Usunięto użytkownika z rezygnacją: ${email}`,
						);
					} catch (deleteError) {
						logger.error(`❌ [SYNC] Błąd usuwania ${email}:`, deleteError);
					}
				}
			}
			logger.debug(
				`🗑️ [SYNC] Usunięto ${deletedCount} użytkowników z rezygnacją`,
			);
		}

		// ============================================================
		// 🔥 KROK 2: POBIERANIE FILARÓW Z SM_Frekwencja
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
		// 🔥 POBIERANIE KOORDYNATORÓW Z SM_Frekwencja
		// ============================================================
		// Pobierz liderów filarów (koordynatorów)
		const coordinatorMap = new Map<string, string[]>();

		// ============================================================
		// 🔥 POBIERANIE ZESPOŁÓW (TEAMS) Z GŁÓWNEJ BAZY
		// ============================================================
		// Pobierz istniejące zespoły (filarów)
		const teams = await prisma.team.findMany({
			where: {
				name: {
					in: ALLOWED_PILLARS.map((p) => `Filar ${p}`),
				},
			},
			select: {
				id: true,
				name: true,
			},
		});

		const teamMap = new Map<string, number>();
		for (const team of teams) {
			teamMap.set(team.name, team.id);
		}

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
				team: true,
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
		let teamMembersAdded = 0;
		let teamMembersUpdated = 0;

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
				// 🔥 SPRAWDŹ CZY UŻYTKOWNIK JEST KOORDYNATOREM
				// ============================================================
				const isCoordinator = false;
				const coordinatorPillars: string[] = [];

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
					role_id: 4,
					join_date: member.created_at ? new Date(member.created_at) : null,
					password_hash: "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890",
					functional_role: "Członek",
					pillars: pillarString,
					team: null, // 🔥 DODAJ - synchronizacja NIE nadpisuje team
				};

				let userId: number;

				if (existing) {
					// 🔥 SPRAWDŹ CZY UŻYTKOWNIK MA JUŻ USTAWIONY STATUS W GŁÓWNEJ BAZIE
					// Jeśli ma status (nie jest pusty) - NIE ZMIENIAJ GO
					const hasExistingStatus = existing.status && existing.status !== "";

					// Przygotuj dane do aktualizacji
					// Przygotuj dane do aktualizacji
					const dataToUpdate: any = {
						first_name: userData.first_name,
						last_name: userData.last_name,
						phone: userData.phone,
						is_active: userData.is_active,
						functional_role: userData.functional_role,
						pillars: userData.pillars,
						team: userData.team, // 🔥 DODAJ
						role_id: userData.role_id,
					};

					// NIE ZMIENIAJ STATUSU jeśli użytkownik ma już jakiś status w głównej bazie
					if (!hasExistingStatus) {
						dataToUpdate.status = userData.status;
						dataToUpdate.is_trial = userData.is_trial;
					} else {
						// Zachowaj istniejący status
						dataToUpdate.status = existing.status;
						dataToUpdate.is_trial = existing.is_trial;
					}

					// Sprawdź czy są zmiany
					// Sprawdź czy są zmiany
					const hasChanges =
						existing.first_name !== dataToUpdate.first_name ||
						existing.last_name !== dataToUpdate.last_name ||
						existing.phone !== dataToUpdate.phone ||
						existing.pillars !== dataToUpdate.pillars ||
						existing.team !== dataToUpdate.team || // 🔥 DODAJ
						existing.functional_role !== dataToUpdate.functional_role ||
						(!hasExistingStatus && existing.status !== dataToUpdate.status) ||
						(!hasExistingStatus && existing.is_trial !== dataToUpdate.is_trial);
					if (hasChanges) {
						const updatedUser = await prisma.user.update({
							where: { id: existing.id },
							data: dataToUpdate,
						});
						userId = updatedUser.id;
						updated++;

						const statusMsg = hasExistingStatus
							? `⏭️ status niezmieniony (zachowano: ${existing.status})`
							: `status: ${member.status} -> ${userData.status}`;

						logger.debug(
							`🔄 [SYNC] Zaktualizowano: ${generatedEmail} | ${statusMsg} | filary: ${userData.pillars || "brak"}`,
						);
					} else {
						userId = existing.id;
						skipped++;
					}
				} else {
					const newUser = await prisma.user.create({
						data: userData,
					});
					userId = newUser.id;
					added++;
					logger.debug(
						`✅ [SYNC] Dodano: ${generatedEmail} (${userData.first_name} ${userData.last_name}) | status: ${userData.status} | filary: ${userData.pillars || "brak"} | koordynator: ${isCoordinator}`,
					);
				}

				// ============================================================
				// 🔥 SYNCHRONIZACJA TEAM_MEMBERS - DLA FILARÓW
				// ============================================================
				if (pillarNames.length > 0) {
					// Pobierz istniejące członkostwa w filarach dla tego użytkownika
					const existingTeamMembers = await prisma.teamMember.findMany({
						where: {
							user_id: userId,
							team: {
								name: {
									in: ALLOWED_PILLARS.map((p) => `Filar ${p}`),
								},
							},
						},
						include: {
							team: true,
						},
					});

					const existingTeamIds = new Set(
						existingTeamMembers.map((tm: any) => tm.team_id),
					);

					// Dla każdego filaru użytkownika
					for (const pillarName of pillarNames) {
						const teamName = `Filar ${pillarName}`;
						const teamId = teamMap.get(teamName);

						if (!teamId) {
							logger.warn(
								`⚠️ [SYNC] Nie znaleziono zespołu dla filaru: ${teamName}`,
							);
							continue;
						}

						// Sprawdź czy już istnieje członkostwo
						const existingMember = existingTeamMembers.find(
							(tm: any) => tm.team_id === teamId,
						);

						if (existingMember) {
							// Już istnieje - nic nie rób
							existingTeamIds.delete(teamId);
						} else {
							await prisma.teamMember.create({
								data: {
									user_id: userId,
									team_id: teamId,
									role: "Członek",
									is_leader: false,
								},
							});

							teamMembersAdded++;
							logger.debug(
								`➕ [TEAM] Dodano członkostwo: ${generatedEmail} -> ${teamName}`,
							);
						}
					}

					for (const teamId of existingTeamIds) {
						await prisma.teamMember.deleteMany({
							where: {
								user_id: userId,
								team_id: teamId,
							},
						});
						logger.debug(
							`🗑️ [TEAM] Usunięto członkostwo: ${generatedEmail} z filaru ID: ${teamId}`,
						);
					}
				} else {
					// Jeśli użytkownik nie ma żadnych filarów - usuń wszystkie członkostwa w filarach
					await prisma.teamMember.deleteMany({
						where: {
							user_id: userId,
							team: {
								name: {
									in: ALLOWED_PILLARS.map((p) => `Filar ${p}`),
								},
							},
						},
					});
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
		logger.debug(`   ➕${teamMembersAdded} dodanych członkostw w filarach`);
		logger.debug(`   🔄${teamMembersUpdated} zaktualizowanych członkostw`);
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
						teamMembersAdded,
						teamMembersUpdated,
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
