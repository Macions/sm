

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




		logger.debug("📥 [SYNC] Pobieranie filarów z SM_Frekwencja...");

		const [memberPillars] = (await frekwencjaDb.query(`
            SELECT 
                mp.member_id,
                p.name as pillar_name
            FROM att_member_pillars mp
            INNER JOIN att_pillars p ON p.id = mp.pillar_id
        `)) as any[];

		const pillarMap = new Map<number, string[]>();
		for (const row of memberPillars) {
			if (ALLOWED_PILLARS.includes(row.pillar_name)) {
				if (!pillarMap.has(row.member_id)) {
					pillarMap.set(row.member_id, []);
				}
				pillarMap.get(row.member_id)!.push(row.pillar_name);
			}
		}

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
				role_id: true,  
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
		const teamMembersUpdated = 0;
		let pillarsPreserved = 0; 

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




				const memberId = emailToMemberId.get(generatedEmail);
				let pillarNames: string[] = [];

				if (memberId && pillarMap.has(memberId)) {
					pillarNames = pillarMap.get(memberId) || [];
				}

				const pillarString =
					pillarNames.length > 0 ? pillarNames.join(", ") : null;




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
					team: null,
				};

				let userId: number;

				if (existing) {

					const hasExistingStatus = existing.status && existing.status !== "";



					const hasExistingPillars = existing.pillars && existing.pillars !== "" && existing.pillars !== null;

					const hasExistingFunctionalRole = existing.functional_role && existing.functional_role !== "";
					const dataToUpdate: any = {
						first_name: userData.first_name,
						last_name: userData.last_name,
						phone: userData.phone,
						is_active: userData.is_active,
						team: userData.team,
					};



					const hasExistingRole = existing.role_id && existing.role_id !== 4;

					if (hasExistingRole) {

						dataToUpdate.role_id = existing.role_id;
					} else {

						dataToUpdate.role_id = userData.role_id;
					}


					if (hasExistingFunctionalRole) {
						dataToUpdate.functional_role = existing.functional_role;
					} else {
						dataToUpdate.functional_role = userData.functional_role;
					}



					if (existing.pillars !== undefined) {

						dataToUpdate.pillars = existing.pillars;
						if (existing.pillars && existing.pillars !== "") {
							pillarsPreserved++;
							logger.debug(
								`🔒 [SYNC] Zachowano istniejące filary użytkownika ${generatedEmail}: ${existing.pillars}`
							);
						} else {
							logger.debug(
								`⏭️ [SYNC] Użytkownik ${generatedEmail} nie ma filarów - pozostawiam puste`
							);
						}
					} else {

						dataToUpdate.pillars = userData.pillars;
					}


					if (!hasExistingStatus) {
						dataToUpdate.status = userData.status;
						dataToUpdate.is_trial = userData.is_trial;
					} else {
						dataToUpdate.status = existing.status;
						dataToUpdate.is_trial = existing.is_trial;
					}


					const hasChanges =
						existing.first_name !== dataToUpdate.first_name ||
						existing.last_name !== dataToUpdate.last_name ||
						existing.phone !== dataToUpdate.phone ||
						(hasExistingFunctionalRole ? existing.functional_role !== dataToUpdate.functional_role : false) ||
						(!hasExistingPillars && existing.pillars !== dataToUpdate.pillars) ||
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

						const pillarsMsg = hasExistingPillars
							? `🔒 filary zachowane: ${existing.pillars}`
							: `filary: ${userData.pillars || "brak"}`;

						const functionalRoleMsg = hasExistingFunctionalRole
							? `🔒 funkcjonalna rola zachowana: ${existing.functional_role}`
							: `funkcjonalna rola: ${userData.functional_role}`;

						logger.debug(
							`🔄 [SYNC] Zaktualizowano: ${generatedEmail} | ${statusMsg} | ${pillarsMsg} | ${functionalRoleMsg}`,
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
						`✅ [SYNC] Dodano: ${generatedEmail} (${userData.first_name} ${userData.last_name}) | status: ${userData.status} | filary: ${userData.pillars || "brak"}`,
					);
				}




				if (pillarNames.length > 0) {
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

					for (const pillarName of pillarNames) {
						const teamName = `Filar ${pillarName}`;
						const teamId = teamMap.get(teamName);

						if (!teamId) {
							logger.warn(
								`⚠️ [SYNC] Nie znaleziono zespołu dla filaru: ${teamName}`,
							);
							continue;
						}

						const existingMember = existingTeamMembers.find(
							(tm: any) => tm.team_id === teamId,
						);

						if (existingMember) {
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
		logger.debug(`   🔒${pillarsPreserved} zachowanych filarów (nie nadpisano)`); 
		if (duplicateEmails > 0) {
			logger.debug(`   ⚠️${duplicateEmails} pominiętych (duplikaty emaili)`);
		}

		try {
			await prisma.systemLog.create({
				data: {
					user_id: 0,
					user_name: "Synchronizacja członków",
					user_role: "system",
					action_type: "UPDATE",
					category: "USER",
					endpoint: "/api/admin/sync-members",
					method: "SYNC",
					entity_name: `Synchronizacja członków: +${added} dodanych, ${updated} zaktualizowanych, ${skipped} bez zmian, ${skippedRezygnacja} pominiętych, ${pillarsPreserved} zachowanych filarów`,
					changes: {
						added,
						updated,
						skipped,
						skippedRezygnacja,
						duplicateEmails,
						teamMembersAdded,
						teamMembersUpdated,
						pillarsPreserved, 
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