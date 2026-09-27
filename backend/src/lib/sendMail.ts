// src/lib/sendMail.ts
import transporter from "./mailer";

export interface SendMailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
	replyTo?: string;
	attachments?: any[];
}

export async function sendMail({
	to,
	subject,
	html,
	text,
	replyTo,
	attachments,
}: SendMailOptions) {
	const info = await transporter.sendMail({
		from: process.env.MAIL_FROM || "Siła Młodych <system@silamlodych.pl>",
		to,
		subject,
		html,
		text:
			text ||
			html
				.replace(/<[^>]+>/g, " ")
				.replace(/\s+/g, " ")
				.trim(),
		replyTo: replyTo || process.env.MAIL_REPLY_TO,
		attachments,
		headers: {
			"X-Mailer": "SilaMlodych-System",
		},
	});

	return info;
}
