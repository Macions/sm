// backend/src/jobs/syncAttendance.ts

import { PrismaClient } from "@prisma/client";
import mysql from "mysql2/promise";

const prisma = new PrismaClient();

// ⭐ KONFIGURACJA BAZY FREKWENCJA
const FREKWENCJA_DB_CONFIG = {
	host: process.env.FREKWENCJA_DB_HOST || "57.128.253.89",
	user: process.env.FREKWENCJA_DB_USER || "czarnecki",
	password: process.env.FREKWENCJA_DB_PASSWORD || "",
	database: process.env.FREKWENCJA_DB_NAME || "SM_Frekwencja",
	port: 3306,
};

export async function syncAttendance() {
	console.log("🔄 [ATTENDANCE] Rozpoczynam synchronizację frekwencji...");
	const startTime = Date.now();

	let connection: mysql.Connection | null = null;

	try {
		console.log("📡 [ATTENDANCE] Łączenie z SM_Frekwencja...");
		connection = await mysql.createConnection(FREKWENCJA_DB_CONFIG);
		console.log("✅ [ATTENDANCE] Połączono z SM_Frekwencja");

		// ⭐ SPRAWDŹ TABELE W BAZIE FREKWENCJA
		const [tables] = await connection.execute("SHOW TABLES");
		console.log("📋 [ATTENDANCE] Tabele w SM_Frekwencja:", tables);

		// ⭐ POBIERZ FREKWENCJĘ (dostosuj nazwy tabel)
		// backend/src/jobs/syncAttendance.ts

		// ZMIEŃ NAZWY TABEL na rzeczywiste z bazy SM_Frekwencja:
		const [rows] = await connection.execute(`
    SELECT
        m.email,
        ROUND(
            SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)
            /
            COUNT(a.id)
            * 100,
            2
        ) AS attendance_percentage
    FROM att_members m  -- ⭐ ZMIENIONE na att_members
    LEFT JOIN att_attendance a  -- ⭐ ZMIENIONE na att_attendance
        ON a.member_id = m.id
    GROUP BY m.id, m.email
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

		// ⭐ AKTUALIZACJA W GŁÓWNEJ BAZIE (przez Prisma)
		console.log("🔄 [ATTENDANCE] Aktualizacja frekwencji użytkowników...");
		let updatedCount = 0;
		let skippedCount = 0;

		for (const record of attendanceData) {
			try {
				const user = await prisma.user.findUnique({
					where: { email: record.email },
					select: { id: true },
				});

				if (!user) {
					skippedCount++;
					continue;
				}

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
			console.log("🔌 [ATTENDANCE] Zamknięto połączenie z SM_Frekwencja");
		}
		await prisma.$disconnect();
	}
}
