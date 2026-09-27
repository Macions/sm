// scripts/testEmail.ts
import "dotenv/config";
import nodemailer from "nodemailer";
import { newTaskEmail } from "../src/emails/templates";

const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 465,
	secure: true,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

async function main() {
	const { subject, html } = newTaskEmail({
		memberName: "Maciej",
		taskTitle: "Przygotować prezentację na spotkanie zarządu",
		taskDescription:
			"Slajdy na spotkanie w przyszłym tygodniu. Skupić się na wynikach kwartału.",
		taskPriority: "wysoki",
		taskDueDate: "15 października 2026",
		taskUrl: "https://panel.silamlodych.pl/tasks/123",
	});

	const info = await transporter.sendMail({
		from: process.env.MAIL_FROM,
		to: "maciej.czarnecki@silamlodych.pl",
		subject,
		html,
	});

	console.log("✅ Wysłano:", info.messageId);
}

main().catch((err) => {
	console.error("❌ Błąd:", err);
	process.exit(1);
});
