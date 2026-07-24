// backend/src/jobs/updateLeaveStatus.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function updateLeaveStatus() {
	try {
		console.log("🔄 [JOB] Sprawdzanie statusów urlopowych...");

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		// 1. Znajdź wszystkich użytkowników, którzy mają zatwierdzone urlopy
		const usersOnLeave = await prisma.user.findMany({
			where: {
				leaves: {
					some: {
						status: "approved",
						start_date: { lte: today },
						end_date: { gte: today },
					},
				},
			},
			select: {
				id: true,
				first_name: true,
				last_name: true,
				status: true,
			},
		});

		// 2. Znajdź użytkowników, którzy NIE mają urlopu dzisiaj
		const usersNotOnLeave = await prisma.user.findMany({
			where: {
				AND: [
					{
						leaves: {
							none: {
								status: "approved",
								start_date: { lte: today },
								end_date: { gte: today },
							},
						},
					},
					{
						status: "vacation", // tylko ci, którzy mają status urlop
					},
				],
			},
			select: {
				id: true,
				first_name: true,
				last_name: true,
				status: true,
			},
		});

		// 3. Aktualizuj status na "vacation" dla użytkowników na urlopie
		for (const user of usersOnLeave) {
			if (user.status !== "vacation") {
				await prisma.user.update({
					where: { id: user.id },
					data: { status: "vacation" },
				});
				console.log(
					`✅ ${user.first_name} ${user.last_name} - ustawiono status: vacation`,
				);
			}
		}

		// 4. Przywróć status "active" dla użytkowników, którzy wrócili z urlopu
		for (const user of usersNotOnLeave) {
			await prisma.user.update({
				where: { id: user.id },
				data: { status: "active" },
			});
			console.log(
				`✅ ${user.first_name} ${user.last_name} - przywrócono status: active`,
			);
		}

		console.log(
			`📊 [JOB] Zakończono: ${usersOnLeave.length} na urlopie, ${usersNotOnLeave.length} wróciło`,
		);
	} catch (error) {
		console.error("❌ [JOB] Błąd aktualizacji statusów:", error);
	}
}
