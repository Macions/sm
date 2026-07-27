// backend/src/jobs/updateLeaveStatus.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function updateLeaveStatus() {
	try {
		console.log("🔄 [JOB] Sprawdzanie statusów urlopowych...");

		const now = new Date();
		const today = new Date(
			Date.UTC(
				now.getFullYear(),
				now.getMonth(),
				now.getDate()
			)
		);

		console.log("📅 TODAY:", today.toISOString());

		// 1. Znajdź wszystkich użytkowników, którzy mają zatwierdzone urlopy DZISIAJ
		const usersOnLeave = await prisma.user.findMany({
			where: {
				leaves: {
					some: {
						status: "approved",
						start_date: {
							lte: today,
						},
						end_date: {
							gte: today,
						},
					},
				},
			},
			select: {
				id: true,
				first_name: true,
				last_name: true,
				status: true,
				previous_status: true,
			},
		});

		console.log("👥 Użytkownicy aktualnie na urlopie:");
		console.table(usersOnLeave);

		// 2. Znajdź użytkowników, którzy NIE mają urlopu dzisiaj (ale mają status vacation)
		const usersNotOnLeave = await prisma.user.findMany({
			where: {
				AND: [
					{
						leaves: {
							none: {
								status: "approved",
								start_date: {
									lte: today,
								},
								end_date: {
									gte: today,
								},
							},
						},
					},
					{
						status: "vacation",
					},
				],
			},
			select: {
				id: true,
				first_name: true,
				last_name: true,
				status: true,
				previous_status: true,
			},
		});

		console.log("🔙 Użytkownicy wracający z urlopu:");
		console.table(usersNotOnLeave);

		// 3. Ustaw status na vacation i ZAPISZ poprzedni status
		for (const user of usersOnLeave) {
			if (user.status !== "vacation") {
				const updatedUser = await prisma.user.update({
					where: {
						id: user.id,
					},
					data: {
						previous_status: user.status, // ⭐ ZAPISZ POPRZEDNI STATUS
						status: "vacation",
					},
				});

				console.log(
					`✅ ${updatedUser.first_name} ${updatedUser.last_name}: ${user.status} -> vacation (zapisano poprzedni: ${user.status})`,
				);
			} else {
				console.log(
					`ℹ️ ${user.first_name} ${user.last_name} już ma status vacation (poprzedni: ${user.previous_status || 'brak'})`,
				);
			}
		}

		// 4. Przywróć poprzedni status (nie zawsze active!)
		for (const user of usersNotOnLeave) {
			// ⭐ UŻYJ poprzedniego statusu, jeśli istnieje, inaczej active
			const previousStatus = user.previous_status || "active";

			const updatedUser = await prisma.user.update({
				where: {
					id: user.id,
				},
				data: {
					status: previousStatus,
					previous_status: null, // ⭐ WYCZYŚĆ PO PRZYWRÓCENIU
				},
			});

			console.log(
				`✅ ${updatedUser.first_name} ${updatedUser.last_name}: vacation -> ${previousStatus} (przywrócono)`,
			);
		}

		console.log(
			`📊 [JOB] Zakończono: ${usersOnLeave.length} na urlopie, ${usersNotOnLeave.length} wróciło`,
		);

	} catch (error) {
		console.error("❌ [JOB] Błąd aktualizacji statusów:", error);
	}
}