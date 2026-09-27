// src/lib/mailer.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST || "smtp.gmail.com",
	port: Number(process.env.SMTP_PORT || 465),
	secure: process.env.SMTP_SECURE === "true",
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
	pool: true,
	maxConnections: 3,
	maxMessages: 100,
});

export async function verifyMailer() {
	try {
		await transporter.verify();
		console.log("✅ Google Workspace SMTP gotowy do wysyłki");
	} catch (err) {
		console.error("❌ Błąd SMTP:", err instanceof Error ? err.message : err);
	}
}

export default transporter;
