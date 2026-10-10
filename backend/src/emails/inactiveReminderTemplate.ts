// src/emails/inactiveReminderTemplate.ts
import { layout } from "./layout";
import { bellIcon, checkIcon, mailIcon, sparklesIcon } from "./icons";

export interface InactiveReminderParams {
	userName: string;
	loginUrl: string;
	activationSteps?: string[];
	adminName?: string;
	message?: string | null;
}

export function inactiveReminderTemplate({
	userName,
	loginUrl,
	activationSteps = [
		"Otwórz panel Siły Młodych",
		"Zaloguj się przez Google",
		"Zapoznaj się z poradnikami dla nowych członków",
	],
	adminName = "Zarząd Siły Młodych",
	message = null,
}: InactiveReminderParams): string {
	const bell = bellIcon({ size: 18, color: "#46169D" });
	const mail = mailIcon({ size: 15, color: "#5b21b6" });
	const check = checkIcon({ size: 13, color: "#46169D" });
	const sparkles = sparklesIcon({ size: 14, color: "#46169D" });

	const stepsHtml = activationSteps
		.map(
			(step, i) => `
      <tr>
        <td style="padding:0 10px 10px 0;width:18px;vertical-align:top;">${check}</td>
        <td style="padding:0 0 10px 0;font-size:14px;color:#374151;line-height:1.55;">
          <strong style="color:#111827;">${i + 1}.</strong> ${step}
        </td>
      </tr>`,
		)
		.join("");

	const bodyHtml = `
    <p style="margin:0 0 6px 0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#46169D;">
      ${bell}
      <span style="margin-left:8px;">Zaproszenie do panelu</span>
    </p>

    <p style="margin:14px 0 16px 0;color:#374151;">
      Cześć <strong>${userName || "Członku"}</strong>,
    </p>

    <p style="margin:0 0 20px 0;color:#4b5563;">
      Zauważyliśmy, że jeszcze nie korzystasz z naszego panelu.
    </p>

    ${
			message
				? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
           style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;margin:20px 0;">
      <tr>
        <td style="padding:16px;font-size:14px;color:#4c1d95;line-height:1.55;">
          <strong style="display:block;margin-bottom:8px;color:#5b21b6;">
            ${mail}<span style="margin-left:6px;">Wiadomość od ${adminName}</span>
          </strong>
          <div style="margin-top:6px;">${message}</div>
        </td>
      </tr>
    </table>`
				: ""
		}

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
           style="background:#f9fafb;border-left:4px solid #46169D;border-radius:8px;margin:20px 0;">
      <tr>
        <td style="padding:20px;">
          <h2 style="margin:0 0 14px 0;font-size:15px;font-weight:700;color:#111827;">
            ${sparkles}<span style="margin-left:6px;">Jak zacząć?</span>
          </h2>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            ${stepsHtml}
          </table>
        </td>
      </tr>
    </table>
  `;

	return layout({
		title: "Zapraszamy do panelu Siły Młodych",
		subtitle: "Twoje konto czeka na pierwsze logowanie.",
		preheader: "Zaproszenie do panelu Siły Młodych.",
		bodyHtml,
		ctaText: "Zaloguj się do panelu",
		ctaUrl: loginUrl,
		footerNote: "Wiadomość wysłana automatycznie.",
	});
}
