// scripts/testGoogleSmtp.js
import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: "smtp.gmail.com",
	port: 465,
	secure: true,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

await transporter.verify();
console.log("✅ SMTP Google Workspace działa");

const info = await transporter.sendMail({
	from: process.env.MAIL_FROM,
	to: "test-8d9o6pxxi@srv1.mail-tester.com", // ← Twój prywatny mail do testu
	subject: "Test SMTP – Siła Młodych",
	text: "Jeśli to czytasz, SMTP działa poprawnie.",
});

console.log("Wysłano:", info.messageId, "→", info.accepted);
