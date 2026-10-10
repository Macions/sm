// src/jobs/notifyInactiveUsers.ts
import { PrismaClient } from "@prisma/client";
import { enqueueMail } from "../lib/mailQueue";
import { inactiveReminderTemplate } from "../emails/inactiveReminderTemplate";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

/** Ile dni minimum musi minąć od ostatniego maila, żeby wysłać kolejny */
const RESEND_COOLDOWN_DAYS = 5;

/** Limit na jedną turę, żeby nie zapchać SMTP */
const BATCH_SIZE = 100;

export interface NotifyInactiveResult {
	checked: number;
	eligible: number;
	sent: number;
	failed: number;
	skippedRecent: number;
	skippedNoEmail: number;
	recipients: Array<{ id: number; email: string; name: string }>;
}

export async function notifyInactiveUsers(): Promise<NotifyInactiveResult> {
	logger.info("[INACTIVE-NOTIFY] Start sprawdzania nieaktywnych...");

	const cooldownDate = new Date(
		Date.now() - RESEND_COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
	);

	// 1. Pobierz wszystkich aktywnych userów z emailem
	const users = await prisma.user.findMany({
		where: {
			is_active: true,
			email: { not: null },
		},
		select: {
			id: true,
			first_name: true,
			last_name: true,
			email: true,
		},
	});

	logger.info(`[INACTIVE-NOTIFY] Aktywnych userów: ${users.length}`);

	// 2. Kto ma ukończony onboarding
	const onboardingDone = await prisma.onboarding_data.findMany({
		where: { completed: true },
		select: { user_id: true },
		distinct: ["user_id"],
	});
	const completedOnboardingIds = new Set(onboardingDone.map((o) => o.user_id));

	// 3. Kto kiedykolwiek się zalogował
	const loginLogs = await prisma.systemLog.findMany({
		where: {
			action_type: "LOGIN",
			status: "success",
		},
		select: { user_id: true },
		distinct: ["user_id"],
	});
	const loggedInIds = new Set(loginLogs.map((l) => l.user_id));

	// 4. Kto DOSTAŁ już maila w ostatnich 5 dniach (na podstawie SystemLog)
	const recentNotifies = await prisma.systemLog.findMany({
		where: {
			action_type: "NOTIFY",
			category: "USER",
			created_at: { gte: cooldownDate },
		},
		select: { entity_id: true },
	});
	const recentlyNotifiedIds = new Set(
		recentNotifies
			.map((n) => (n.entity_id ? parseInt(n.entity_id) : null))
			.filter((id): id is number => id !== null && !isNaN(id)),
	);

	// 5. Filtruj kandydatów:
	//    - brak onboardingu
	//    - brak logowania
	//    - brak maila w ostatnich 5 dniach
	const candidates = users.filter(
		(u) => !completedOnboardingIds.has(u.id) && !loggedInIds.has(u.id),
	);

	const eligible = candidates.filter((u) => !recentlyNotifiedIds.has(u.id));
	const skippedRecent = candidates.length - eligible.length;

	logger.info(
		`[INACTIVE-NOTIFY] Kandydatów: ${candidates.length}, do wysyłki: ${eligible.length} (pominięto ${skippedRecent} z cooldownu)`,
	);

	if (eligible.length === 0) {
		return {
			checked: users.length,
			eligible: 0,
			sent: 0,
			failed: 0,
			skippedRecent,
			skippedNoEmail: 0,
			recipients: [],
		};
	}

	// 6. Wyślij w batchach
	const baseUrl = process.env.APP_URL || "https://panel.silamlodych.pl";
	const loginUrl = `${baseUrl}/login`;

	let sent = 0;
	let failed = 0;
	let skippedNoEmail = 0;
	const recipients: Array<{ id: number; email: string; name: string }> = [];

	const batch = eligible.slice(0, BATCH_SIZE);

	for (const user of batch) {
		if (!user.email) {
			skippedNoEmail++;
			continue;
		}

		try {
			const { subject, html } = {
				subject: "👋 Zapraszamy do panelu Siły Młodych",
				html: inactiveReminderTemplate({
					userName: user.first_name || "Członku",
					loginUrl,
					adminName: "Zarząd Siły Młodych",
				}),
			};

			enqueueMail({ to: user.email, subject, html });

			// Log do SystemLog — służy też jako znacznik "kiedy ostatnio wysłano"
			await prisma.systemLog.create({
				data: {
					user_id: 0, // system
					user_name: "System (cron)",
					user_role: "system",
					action_type: "NOTIFY",
					category: "USER",
					endpoint: "/jobs/notifyInactiveUsers",
					method: "CRON",
					entity_id: String(user.id),
					entity_name: `Przypomnienie o logowaniu: ${user.first_name} ${user.last_name}`,
					changes: JSON.stringify({
						email: user.email,
						reason: "no_login_no_onboarding",
					}),
					status: "success",
				},
			});

			sent++;
			recipients.push({
				id: user.id,
				email: user.email,
				name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
			});
		} catch (err) {
			failed++;
			logger.error(`[INACTIVE-NOTIFY] Błąd wysyłki do ${user.email}:`, err);
		}
	}

	logger.info(
		`[INACTIVE-NOTIFY] Koniec. Wysłano: ${sent}, Błędy: ${failed}, Bez emaila: ${skippedNoEmail}`,
	);

	return {
		checked: users.length,
		eligible: eligible.length,
		sent,
		failed,
		skippedRecent,
		skippedNoEmail,
		recipients,
	};
}
