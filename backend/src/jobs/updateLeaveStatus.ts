import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
const prisma = new PrismaClient();

export async function updateLeaveStatus() {
	try {
		logger.debug("🔄 [JOB] Sprawdzanie statusów urlopowych...");

		const now = new Date();
		const today = new Date(
			Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
		);

		logger.debug("📅 TODAY:", today.toISOString());

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

		logger.debug("👥 Użytkownicy aktualnie na urlopie:");
		console.table(usersOnLeave);

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

		logger.debug("🔙 Użytkownicy wracający z urlopu:");
		console.table(usersNotOnLeave);

		for (const user of usersOnLeave) {
			if (user.status !== "vacation") {
				const updatedUser = await prisma.user.update({
					where: {
						id: user.id,
					},
					data: {
						previous_status: user.status,
						status: "vacation",
					},
				});

				logger.debug(
					`✅ ${updatedUser.first_name} ${updatedUser.last_name}: ${user.status} -> vacation (zapisano poprzedni: ${user.status})`,
				);
			} else {
				logger.debug(
					`ℹ️ ${user.first_name} ${user.last_name} już ma status vacation (poprzedni: ${user.previous_status || "brak"})`,
				);
			}
		}

		for (const user of usersNotOnLeave) {
			const previousStatus = user.previous_status || "active";

			const updatedUser = await prisma.user.update({
				where: {
					id: user.id,
				},
				data: {
					status: previousStatus,
					previous_status: null,
				},
			});

			logger.debug(
				`✅ ${updatedUser.first_name} ${updatedUser.last_name}: vacation -> ${previousStatus} (przywrócono)`,
			);
		}

		logger.debug(
			`📊 [JOB] Zakończono: ${usersOnLeave.length} na urlopie, ${usersNotOnLeave.length} wróciło`,
		);
	} catch (error) {
		logger.error("❌ [JOB] Błąd aktualizacji statusów:", error);
	}
}
