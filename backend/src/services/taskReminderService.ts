// src/services/taskReminderService.ts
import { PrismaClient } from "@prisma/client";
import { sendMail } from "../lib/sendMail";
import { taskReminderTemplate } from "../emails/taskReminderTemplate";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

export interface SendReminderOptions {
	taskId: number;
	senderId: number;
	userIds?: number[]; // jeśli puste — wszyscy przypisani ze statusem != done
	message?: string;
}

export interface SendReminderResult {
	sent: number;
	failed: number;
	recipients: {
		id: number;
		name: string;
		email: string;
	}[];
}

export async function sendTaskReminder(
	options: SendReminderOptions,
): Promise<SendReminderResult> {
	const { taskId, senderId, userIds, message } = options;

	// 1. Pobierz zadanie + autora
	const task = await prisma.task.findUnique({
		where: { id: taskId },
		include: {
			createdBy: {
				select: { first_name: true, last_name: true },
			},
		},
	});

	if (!task) {
		throw new Error("Zadanie nie istnieje");
	}

	// 2. Pobierz przypisanych, którzy nie ukończyli
	//    Najpierw z TaskAssignee (multi-user), potem fallback na assigned_to
	const assigneesFromTaskAssignee = await prisma.taskAssignee.findMany({
		where: {
			task_id: taskId,
			status: { not: "done" },
			...(userIds && userIds.length > 0 ? { user_id: { in: userIds } } : {}),
		},
		include: {
			user: {
				select: {
					id: true,
					first_name: true,
					last_name: true,
					email: true,
				},
			},
		},
	});

	let recipients = assigneesFromTaskAssignee
		.map((a) => a.user)
		.filter((u): u is NonNullable<typeof u> => !!u && !!u.email);

	// Fallback: pojedynczy assigned_to
	if (recipients.length === 0 && task.assigned_to) {
		const single = await prisma.user.findUnique({
			where: { id: task.assigned_to },
			select: {
				id: true,
				first_name: true,
				last_name: true,
				email: true,
			},
		});
		if (single && single.email) {
			recipients = [single];
		}
	}

	if (recipients.length === 0) {
		throw new Error(
			"Brak przypisanych osób, do których można wysłać przypomnienie",
		);
	}

	// 3. Wyślij maile
	const baseUrl = process.env.APP_URL ?? "http://localhost:5173";
	const taskUrl = `${baseUrl}/tasks?task=${task.id}`;

	const creatorName = task.createdBy
		? `${task.createdBy.first_name} ${task.createdBy.last_name}`.trim()
		: "";

	const results = await Promise.allSettled(
		recipients.map((user) =>
			sendMail({
				to: user.email!,
				subject: `⏰ Przypomnienie: ${task.title}`,
				html: taskReminderTemplate({
					userName: user.first_name,
					taskTitle: task.title,
					taskDescription: task.description,
					dueDate: task.due_date.toISOString(),
					priority: task.priority,
					creatorName,
					message: message ?? null,
					taskUrl,
				}),
			}),
		),
	);

	const sent = results.filter((r) => r.status === "fulfilled").length;
	const failed = results.length - sent;

	// 4. Log w SystemLog
	try {
		await prisma.systemLog.create({
			data: {
				user_id: senderId,
				user_name: "", // uzupełnij jeśli chcesz — albo dociągnij sender
				user_role: "",
				action_type: "UPDATE",
				category: "PROJECT",
				endpoint: `/api/tasks/${taskId}/remind`,
				method: "POST",
				entity_id: String(taskId),
				entity_name: task.title,
				changes: JSON.stringify({
					action: "send_reminder",
					sent,
					failed,
					recipientIds: recipients.map((r) => r.id),
				}),
				status: "success",
			},
		});
	} catch (logErr) {
		logger.warn("Nie udało się zapisać logu:", logErr);
	}

	return {
		sent,
		failed,
		recipients: recipients.map((r) => ({
			id: r.id,
			name: `${r.first_name} ${r.last_name}`.trim(),
			email: r.email!,
		})),
	};
}
