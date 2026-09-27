// src/emails/templates.ts
import { layout } from "./layout";
import { p, detailsCard, badge, callout, ul, hr } from "./components";

const APP_URL = process.env.APP_URL || "https://panel.silamlodych.pl";

export interface EmailTemplate {
	subject: string;
	html: string;
}

/* ---------- NOWE ZADANIE ---------- */
export interface NewTaskParams {
	memberName: string;
	taskTitle: string;
	taskDescription?: string;
	taskPriority?: string;
	taskDueDate?: string;
	taskUrl?: string;
}

export function newTaskEmail(params: NewTaskParams): EmailTemplate {
	const {
		memberName,
		taskTitle,
		taskDescription,
		taskPriority,
		taskDueDate,
		taskUrl,
	} = params;

	return {
		subject: `Nowe zadanie: ${taskTitle}`,
		html: layout({
			preheader: `Masz nowe zadanie: "${taskTitle}".`,
			title: "Masz nowe zadanie",
			subtitle: `Cześć ${memberName}, przypisano Ci nowe zadanie w systemie.`,
			bodyHtml: `
        ${detailsCard([
					{ label: "Zadanie", value: `<strong>${taskTitle}</strong>` },
					taskPriority
						? { label: "Priorytet", value: badge(taskPriority, "brand") }
						: null,
					taskDueDate ? { label: "Termin", value: taskDueDate } : null,
					taskDescription ? { label: "Opis", value: taskDescription } : null,
				])}
      `,
			ctaText: "Zobacz zadanie",
			ctaUrl: taskUrl || `${APP_URL}/tasks`,
		}),
	};
}

/* ---------- NOWY WAKAT ---------- */
export interface NewVacancyParams {
	memberName: string;
	vacancyTitle: string;
	vacancyDescription?: string;
	vacancyPillar?: string;
	vacancyUrl?: string;
}

export function newVacancyEmail(params: NewVacancyParams): EmailTemplate {
	const {
		memberName,
		vacancyTitle,
		vacancyDescription,
		vacancyPillar,
		vacancyUrl,
	} = params;

	return {
		subject: `Nowy wakat: ${vacancyTitle}`,
		html: layout({
			preheader: `Pojawił się nowy wakat: ${vacancyTitle}.`,
			title: "Nowy wakat",
			subtitle: `Cześć ${memberName}, pojawił się nowy wakat, który może Cię zainteresować.`,
			bodyHtml: `
        ${detailsCard([
					{ label: "Stanowisko", value: `<strong>${vacancyTitle}</strong>` },
					vacancyPillar ? { label: "Filar", value: vacancyPillar } : null,
					vacancyDescription
						? { label: "Opis", value: vacancyDescription }
						: null,
				])}
      `,
			ctaText: "Zobacz szczegóły",
			ctaUrl: vacancyUrl || `${APP_URL}/vacancies`,
		}),
	};
}

/* ---------- RESET HASŁA ---------- */
export interface PasswordResetParams {
	memberName: string;
	resetUrl: string;
}

export function passwordResetEmail(params: PasswordResetParams): EmailTemplate {
	const { memberName, resetUrl } = params;

	return {
		subject: "Reset hasła – Siła Młodych",
		html: layout({
			preheader: "Link do ustawienia nowego hasła (wygasa po 60 min).",
			title: "Reset hasła",
			subtitle: `Cześć ${memberName}, otrzymaliśmy prośbę o reset hasła do Twojego konta.`,
			bodyHtml: `
        ${p("Kliknij przycisk poniżej, aby ustawić nowe hasło.")}
        ${callout(
					"Link wygasa po 60 minutach. Jeśli to nie Ty – zignoruj tę wiadomość.",
					"info",
				)}
      `,
			ctaText: "Ustaw nowe hasło",
			ctaUrl: resetUrl,
		}),
	};
}

/* ---------- POWITANIE ---------- */
export interface WelcomeParams {
	memberName: string;
	loginUrl?: string;
}

export function welcomeEmail(params: WelcomeParams): EmailTemplate {
	const { memberName, loginUrl } = params;

	return {
		subject: "Witaj w Siła Młodych!",
		html: layout({
			preheader: "Twoje konto w systemie jest gotowe.",
			title: "Witaj w systemie",
			subtitle: `Cześć ${memberName}, Twoje konto w systemie członka Siły Młodych zostało utworzone.`,
			bodyHtml: `
        ${p("Możesz się już zalogować i zobaczyć swoje zadania, filary oraz wydarzenia.")}
        ${callout("Przy pierwszym logowaniu zalecamy zmianę hasła.", "info")}
      `,
			ctaText: "Zaloguj się",
			ctaUrl: loginUrl || `${APP_URL}/login`,
		}),
	};
}

/* ---------- PRZYPOMNIENIE O ZADANIU ---------- */
export interface TaskReminderParams {
	memberName: string;
	taskTitle: string;
	taskDueDate: string;
	taskUrl?: string;
}

export function taskReminderEmail(params: TaskReminderParams): EmailTemplate {
	const { memberName, taskTitle, taskDueDate, taskUrl } = params;

	return {
		subject: `Przypomnienie: ${taskTitle}`,
		html: layout({
			preheader: `Zadanie "${taskTitle}" mija ${taskDueDate}.`,
			title: "Zbliża się termin zadania",
			subtitle: `Cześć ${memberName}, przypominamy o zadaniu, którego termin mija wkrótce.`,
			bodyHtml: `
        ${detailsCard([
					{ label: "Zadanie", value: `<strong>${taskTitle}</strong>` },
					{ label: "Termin", value: taskDueDate },
				])}
      `,
			ctaText: "Otwórz zadanie",
			ctaUrl: taskUrl || `${APP_URL}/tasks`,
		}),
	};
}

/* ---------- ZMIANA STATUSU ---------- */
export interface TaskStatusChangedParams {
	memberName: string;
	taskTitle: string;
	oldStatus: string;
	newStatus: string;
	taskUrl?: string;
}

export function taskStatusChangedEmail(
	params: TaskStatusChangedParams,
): EmailTemplate {
	const { memberName, taskTitle, oldStatus, newStatus, taskUrl } = params;

	return {
		subject: `Zmiana statusu: ${taskTitle}`,
		html: layout({
			preheader: `Status zadania "${taskTitle}" zmienił się na ${newStatus}.`,
			title: "Zmiana statusu zadania",
			subtitle: `Cześć ${memberName}, status zadania, którego jesteś przypisany, został zaktualizowany.`,
			bodyHtml: `
        ${detailsCard([
					{ label: "Zadanie", value: `<strong>${taskTitle}</strong>` },
					{ label: "Było", value: badge(oldStatus, "outline") },
					{ label: "Jest", value: badge(newStatus, "brand") },
				])}
      `,
			ctaText: "Zobacz zadanie",
			ctaUrl: taskUrl || `${APP_URL}/tasks`,
		}),
	};
}

/* ---------- TYGODNIOWE PODSUMOWANIE ---------- */
export interface WeeklyDigestParams {
	memberName: string;
	tasksCount: number;
	tasksList: { title: string; dueDate: string }[];
	upcomingEvents: { title: string; date: string }[];
	panelUrl?: string;
}

export function weeklyDigestEmail(params: WeeklyDigestParams): EmailTemplate {
	const { memberName, tasksCount, tasksList, upcomingEvents, panelUrl } =
		params;

	return {
		subject: "Twoje podsumowanie tygodnia – Siła Młodych",
		html: layout({
			preheader: `Masz ${tasksCount} zadań i ${upcomingEvents.length} nadchodzących wydarzeń.`,
			title: "Podsumowanie tygodnia",
			subtitle: `Cześć ${memberName}, oto krótkie podsumowanie Twojej aktywności w systemie.`,
			bodyHtml: `
        ${detailsCard([
					{
						label: "Zadania",
						value: `<strong>${tasksCount}</strong> aktywnych`,
					},
					{
						label: "Wydarzenia",
						value: `<strong>${upcomingEvents.length}</strong> nadchodzących`,
					},
				])}

        ${
					tasksList && tasksList.length
						? `
          <p style="margin:20px 0 8px 0;font-size:13px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.4px;">
            Twoje zadania
          </p>
          ${ul(tasksList.map((t) => `<strong>${t.title}</strong> – termin: ${t.dueDate}`))}
        `
						: ""
				}

        ${
					upcomingEvents && upcomingEvents.length
						? `
          ${hr()}
          <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.4px;">
            Nadchodzące wydarzenia
          </p>
          ${ul(upcomingEvents.map((e) => `<strong>${e.title}</strong> – ${e.date}`))}
        `
						: ""
				}
      `,
			ctaText: "Otwórz panel",
			ctaUrl: panelUrl || APP_URL,
		}),
	};
}

/* ---------- ZBIORCZY EXPORT ---------- */
export const templates = {
	newTask: newTaskEmail,
	newVacancy: newVacancyEmail,
	passwordReset: passwordResetEmail,
	welcome: welcomeEmail,
	taskReminder: taskReminderEmail,
	taskStatusChanged: taskStatusChangedEmail,
	weeklyDigest: weeklyDigestEmail,
	leaveDecision: leaveDecisionEmail, // ← dodaj
} as const;

export type TemplateName = keyof typeof templates;
/* ---------- DECYZJA O URLOPIE ---------- */
export interface LeaveDecisionParams {
	memberName: string;
	startDate: string;
	endDate: string;
	status: "approved" | "rejected" | "cancelled";
	reviewerName: string;
	comment?: string;
}

export function leaveDecisionEmail(params: LeaveDecisionParams): EmailTemplate {
	const { memberName, startDate, endDate, status, reviewerName, comment } =
		params;

	const config = {
		approved: {
			subject: "Wniosek urlopowy zaakceptowany",
			title: "Wniosek zaakceptowany",
			subtitle: `Cześć ${memberName}, Twój wniosek urlopowy został zaakceptowany przez ${reviewerName}.`,
			badgeText: "ZAAKCEPTOWANY",
			badgeVariant: "brand" as const,
		},
		rejected: {
			subject: "Wniosek urlopowy odrzucony",
			title: "Wniosek odrzucony",
			subtitle: `Cześć ${memberName}, Twój wniosek urlopowy został odrzucony przez ${reviewerName}.`,
			badgeText: "ODRZUCONY",
			badgeVariant: "outline" as const,
		},
		cancelled: {
			subject: "Wniosek urlopowy anulowany",
			title: "Wniosek anulowany",
			subtitle: `Cześć ${memberName}, Twój wniosek urlopowy został anulowany przez ${reviewerName}.`,
			badgeText: "ANULOWANY",
			badgeVariant: "neutral" as const,
		},
	}[status];

	return {
		subject: config.subject,
		html: layout({
			preheader: `${config.title}: ${startDate} – ${endDate}`,
			title: config.title,
			subtitle: config.subtitle,
			bodyHtml: `
        ${detailsCard([
					{ label: "Od", value: startDate },
					{ label: "Do", value: endDate },
					{
						label: "Status",
						value: badge(config.badgeText, config.badgeVariant),
					},
					comment ? { label: "Komentarz", value: comment } : null,
				])}
      `,
			ctaText: "Zobacz w panelu",
			ctaUrl: `${APP_URL}/leaves`,
		}),
	};
}
