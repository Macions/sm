// backend/src/jobs/syncAttendance.ts

import { PrismaClient } from "@prisma/client";
import mysql from "mysql2/promise";

const prisma = new PrismaClient();

// Konfiguracja zewnętrznej bazy SM_Ewidencja
const EXTERNAL_DB_CONFIG = {
	host: process.env.EXTERNAL_DB_HOST || "57.128.253.89",
	user: process.env.EXTERNAL_DB_USER || "czarnecki",
	password: process.env.EXTERNAL_DB_PASSWORD || "",
	database: process.env.EXTERNAL_DB_NAME || "SM_Ewidencja",
	port: parseInt(process.env.EXTERNAL_DB_PORT || "3306"),
};

export async function syncAttendance() {
	console.log("🔄 [ATTENDANCE] Rozpoczynam synchronizację frekwencji...");
	const startTime = Date.now();

	let connection: mysql.Connection | null = null;

	try {
		// 1. Połączenie z zewnętrzną bazą
		console.log("📡 [ATTENDANCE] Łączenie z SM_Ewidencja...");
		connection = await mysql.createConnection(EXTERNAL_DB_CONFIG);
		console.log("✅ [ATTENDANCE] Połączono z SM_Ewidencja");

		// 2. Pobranie frekwencji z zewnętrznej bazy
		console.log("📊 [ATTENDANCE] Pobieranie frekwencji...");
		const [rows] = await connection.execute(`
            SELECT
                am.email,
                ROUND(
                    SUM(CASE WHEN aa.status = 'present' THEN 1 ELSE 0 END)
                    /
                    COUNT(aa.id)
                    * 100,
                    2
                ) AS attendance_percentage
            FROM att_members am
            LEFT JOIN att_attendance aa
                ON aa.member_id = am.id
            GROUP BY am.id, am.email
            HAVING attendance_percentage IS NOT NULL
        `);

		const attendanceData = rows as Array<{
			email: string;
			attendance_percentage: number;
		}>;
		console.log(
			`📊 [ATTENDANCE] Pobrano ${attendanceData.length} rekordów frekwencji`,
		);

		if (attendanceData.length === 0) {
			console.log("⚠️ [ATTENDANCE] Brak danych do synchronizacji");
			return;
		}

		// 3. Aktualizacja frekwencji w głównej bazie
		console.log("🔄 [ATTENDANCE] Aktualizacja frekwencji użytkowników...");
		let updatedCount = 0;
		let skippedCount = 0;

		for (const record of attendanceData) {
			try {
				// Sprawdź czy użytkownik istnieje
				const user = await prisma.user.findUnique({
					where: { email: record.email },
					select: { id: true },
				});

				if (!user) {
					skippedCount++;
					continue;
				}

				// Aktualizuj frekwencję
				await prisma.user.update({
					where: { email: record.email },
					data: {
						attendance_percentage: record.attendance_percentage,
					},
				});

				updatedCount++;
			} catch (error) {
				console.error(
					`❌ [ATTENDANCE] Błąd aktualizacji dla ${record.email}:`,
					error,
				);
				skippedCount++;
			}
		}

		const duration = Date.now() - startTime;
		console.log(`✅ [ATTENDANCE] Zakończono w ${duration}ms`);
		console.log(`📊 [ATTENDANCE] Podsumowanie:`);
		console.log(`   ✅ Zaktualizowano: ${updatedCount} użytkowników`);
		console.log(
			`   ⏭️ Pominięto: ${skippedCount} (nie znaleziono w głównej bazie)`,
		);
	} catch (error) {
		console.error("❌ [ATTENDANCE] Błąd synchronizacji:", error);
		throw error;
	} finally {
		if (connection) {
			await connection.end();
			console.log("🔌 [ATTENDANCE] Zamknięto połączenie z SM_Ewidencja");
		}
		await prisma.$disconnect();
	}
}
