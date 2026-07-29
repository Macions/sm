


import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import mysql from "mysql2/promise";

const prisma = new PrismaClient();





console.log("📋 [SYNC] Ładowanie konfiguracji z .env...");
console.log("📋 [SYNC] EWIDENCJA_DB_HOST:", process.env.EWIDENCJA_DB_HOST);
console.log("📋 [SYNC] EWIDENCJA_DB_USER:", process.env.EWIDENCJA_DB_USER);


const externalDb = mysql.createPool({
	host: process.env.EWIDENCJA_DB_HOST || "57.128.253.89",
	user: process.env.EWIDENCJA_DB_USER || "czarnecki",
	password: process.env.EWIDENCJA_DB_PASSWORD || "N7#vQ4!xLp9@Tw2K",
	database: process.env.EWIDENCJA_DB_NAME || "SM_Ewidencja",
	waitForConnections: true,
	connectionLimit: 10,
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

	console.log(
		`⚠️ [SYNC] Nieznany status: "${statusText}" - traktuję jako trial`,
	);
	return { status: "trial", isTrial: true, isActive: true, shouldSkip: false };
}





export async function syncMembers() {
	console.log("🔄 [SYNC] Rozpoczynam synchronizację członków...");
	const startTime = Date.now();

	try {
		console.log("📥 [SYNC] Pobieranie danych z SM_Ewidencja.members...");

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

		console.log(`📥 [SYNC] Pobrano ${rows.length} rekordów z zewnętrznej bazy`);

		if (rows.length === 0) {
			console.log("⚠️ [SYNC] Brak danych do synchronizacji");
			return;
		}


		const statusStats: Record<string, number> = {};
		for (const member of rows) {
			const status = member.status || "unknown";
			statusStats[status] = (statusStats[status] || 0) + 1;
		}
		console.log("📊 [SYNC] Statystyki statusów w SM_Ewidencja:");
		Object.entries(statusStats).forEach(([status, count]) => {
			console.log(`   ${status}: ${count}`);
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
			},
		});

		const existingEmails = new Map(
			existingUsers.filter((u) => u.email).map((u) => [u.email as string, u]),
		);

		console.log(
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
					console.log(
						`⚠️ [SYNC] Duplikat emaila: ${generatedEmail} (${member.firstname} ${member.lastname}) - pomijam`,
					);
					continue;
				}
				usedEmails.add(generatedEmail);

				const mapped = mapStatus(member.status || "");

				if (mapped.shouldSkip) {
					skippedRezygnacja++;
					console.log(
						`⏭️ [SYNC] Pominięto (rezygnacja): ${generatedEmail} (${member.status})`,
					);
					continue;
				}

				const existing = existingEmails.get(generatedEmail);

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
				};

				if (existing) {
					const hasChanges =
						existing.first_name !== userData.first_name ||
						existing.last_name !== userData.last_name ||
						existing.status !== userData.status ||
						existing.phone !== userData.phone ||
						existing.is_trial !== userData.is_trial;

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
							},
						});
						updated++;
						console.log(
							`🔄 [SYNC] Zaktualizowano: ${generatedEmail} | status: ${member.status} -> ${userData.status} | trial: ${userData.is_trial}`,
						);
					} else {
						skipped++;
					}
				} else {
					await prisma.user.create({
						data: userData,
					});
					added++;
					console.log(
						`✅ [SYNC] Dodano: ${generatedEmail} (${userData.first_name} ${userData.last_name}) | status: ${userData.status} | trial: ${userData.is_trial}`,
					);
				}
			} catch (error) {
				console.error(
					`❌ [SYNC] Błąd przetwarzania ${member.firstname} ${member.lastname}:`,
					error,
				);
			}
		}

		const duration = Date.now() - startTime;
		console.log(`✅ [SYNC] Zakończono w ${duration}ms`);
		console.log(`📊 [SYNC] Podsumowanie:`);
		console.log(`   +${added} dodanych`);
		console.log(`   🔄${updated} zaktualizowanych`);
		console.log(`   ⏭️${skipped} bez zmian`);
		console.log(`   ⏭️${skippedRezygnacja} pominiętych (rezygnacja)`);
		if (duplicateEmails > 0) {
			console.log(`   ⚠️${duplicateEmails} pominiętych (duplikaty emaili)`);
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
			console.error("❌ [SYNC] Błąd zapisu logu:", logError);
		}
	} catch (error) {
		console.error("❌ [SYNC] Błąd synchronizacji:", error);
	}
}

export async function runSync() {
	try {
		await syncMembers();
		console.log("✅ [SYNC] Synchronizacja zakończona pomyślnie");
	} catch (error) {
		console.error("❌ [SYNC] Krytyczny błąd synchronizacji:", error);
	}
}

if (require.main === module) {
	runSync()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error(error);
			process.exit(1);
		});
}
