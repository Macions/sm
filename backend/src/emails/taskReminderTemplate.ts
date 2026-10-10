// src/emails/taskReminderTemplate.ts
import { layout } from "./layout";
import {
bellIcon,
calendarIcon,
flagIcon,
userIcon,
messageIcon,
clockIcon,
} from "./icons";

type Priority = "low" | "medium" | "high" | "urgent";

export interface TaskReminderParams {
userName: string;
taskTitle: string;
taskDescription: string | null;
dueDate: string | null;
priority: Priority;
creatorName: string | null;
message: string | null;
taskUrl: string;
}

const PRIORITY_LABELS: Record<Priority, string> = {
low: "Niski",
medium: "Średni",
high: "Wysoki",
urgent: "Krytyczny",
};

const PRIORITY_COLORS: Record<Priority, string> = {
low: "#6b7280",
medium: "#2563eb",
high: "#d97706",
urgent: "#dc2626",
};

export function taskReminderTemplate({
userName,
taskTitle,
taskDescription,
dueDate,
priority,
creatorName,
message,
taskUrl,
}: TaskReminderParams): string {
const formattedDue = dueDate
? new Date(dueDate).toLocaleString("pl-PL", {
day: "2-digit",
month: "long",
year: "numeric",
hour: "2-digit",
minute: "2-digit",
})
: "brak terminu";

const priorityLabel = PRIORITY_LABELS[priority] ?? priority;
const priorityColor = PRIORITY_COLORS[priority] ?? "#6b7280";
const isOverdue = !!dueDate && new Date(dueDate) < new Date();

const bell = bellIcon({ size: 18, color: "#46169D" });
const calendar = calendarIcon({ size: 15, color: "#6b7280" });
const flag = flagIcon({ size: 15, color: "#6b7280" });
const user = userIcon({ size: 15, color: "#6b7280" });
const msgIcon = messageIcon({ size: 15, color: "#5b21b6" });
const clock = clockIcon({ size: 12, color: "#9ca3af" });

const bodyHtml = `
    <p style="margin:0 0 6px 0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#46169D;">
      ${bell}
      <span style="margin-left:8px;">Przypomnienie</span>
    </p>

    <p style="margin:14px 0 16px 0;color:#374151;">
      Cześć <strong>${userName}</strong>,
    </p>

    <p style="margin:0 0 20px 0;color:#4b5563;">
      Przypominamy o zadaniu, które wciąż czeka na Twoje działanie.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
           style="background:#f9fafb;border-left:4px solid #46169D;border-radius:8px;margin:20px 0;">
      <tr>
        <td style="padding:20px;">
          <h2 style="margin:0 0 12px 0;font-size:17px;font-weight:700;color:#111827;line-height:1.35;">
            ${taskTitle}
          </h2>

          ${
taskDescription
? `<p style="margin:0 0 16px 0;color:#4b5563;font-size:14px;line-height:1.55;">${taskDescription}</p>`
: ""
}

          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">
            <tr>
              <td style="padding:0 10px 8px 0;width:18px;vertical-align:middle;">${calendar}</td>
              <td style="padding:0 0 8px 0;font-size:13px;${
isOverdue ? "color:#dc2626;font-weight:600;" : "color:#374151;"
}">
                <strong style="color:#6b7280;font-weight:600;">Termin:</strong>
                ${formattedDue}${isOverdue ? " (po terminie!)" : ""}
              </td>
            </tr>
            <tr>
              <td style="padding:0 10px 8px 0;width:18px;vertical-align:middle;">${flag}</td>
              <td style="padding:0 0 8px 0;font-size:13px;color:#374151;">
                <strong style="color:#6b7280;font-weight:600;">Priorytet:</strong>
                <span style="display:inline-block;padding:2px 9px;border-radius:11px;color:#ffffff;font-size:11px;font-weight:600;background:${priorityColor};margin-left:4px;">
                  ${priorityLabel}
                </span>
              </td>
            </tr>
            ${
creatorName
? `<tr>
                      <td style="padding:0 10px 0 0;width:18px;vertical-align:middle;">${user}</td>
                      <td style="padding:0;font-size:13px;color:#374151;">
                        <strong style="color:#6b7280;font-weight:600;">Zlecił:</strong>
                        ${creatorName}
                      </td>
                    </tr>`
: ""
}
          </table>
        </td>
      </tr>
    </table>

    ${
message
? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
           style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;margin:20px 0;">
      <tr>
        <td style="padding:16px;font-size:14px;color:#4c1d95;line-height:1.55;">
          <strong style="display:block;margin-bottom:8px;color:#5b21b6;">
            ${msgIcon}
            <span style="margin-left:6px;">Wiadomość od zlecającego</span>
          </strong>
          <div style="margin-top:6px;">${message}</div>
        </td>
      </tr>
    </table>`
: ""
}

    <p style="margin:24px 0 0 0;color:#9ca3af;font-size:12px;line-height:1.5;">
      ${clock}
      <span style="margin-left:6px;">Jeśli już wykonałeś to zadanie, zignoruj tę wiadomość.</span>
    </p>
  `;

return layout({
title: "Przypomnienie o zadaniu",
subtitle: "Masz zadanie, które czeka na Twoje działanie.",
preheader: `Przypomnienie: ${taskTitle}${isOverdue ? " (po terminie!)" : ""}`,
bodyHtml,
ctaText: "Otwórz zadanie",
ctaUrl: taskUrl,
footerNote: "System zarządzania zadaniami Siły Młodych.",
});
}
