// @ts-nocheck
// backend/test-mail.ts
import "dotenv/config";
import nodemailer from "nodemailer";
import { inactiveReminderTemplate } from "./src/emails/inactiveReminderTemplate";

async function main() {
	console.log("=== TEST MAILA — Siła Młodych ===\n");

	// 1. Sprawdź zmienne środowiskowe
	console.log("1. Sprawdzam zmienne środowiskowe:");
	const env = {
		SMTP_HOST: process.env.SMTP_HOST,
		SMTP_PORT: process.env.SMTP_PORT,
		SMTP_USER: process.env.SMTP_USER,
		SMTP_PASS: process.env.SMTP_PASS
			? `***${process.env.SMTP_PASS.slice(-3)}` // maskuj hasło
			: "(brak)",
		SMTP_FROM: process.env.SMTP_FROM,
		SMTP_SECURE: process.env.SMTP_SECURE,
		APP_URL: process.env.APP_URL,
	};

	for (const [k, v] of Object.entries(env)) {
		console.log(`   ${k} = ${v ?? "(brak)"}`);
	}

	if (
		!process.env.SMTP_HOST ||
		!process.env.SMTP_USER ||
		!process.env.SMTP_PASS
	) {
		console.error(
			"\n❌ Brakuje SMTP_HOST / SMTP_USER / SMTP_PASS w .env. Uzupełnij i spróbuj ponownie.",
		);
		process.exit(1);
	}

	// 2. Utwórz transporter
	console.log("\n2. Tworzę transporter SMTP...");
	const port = Number(process.env.SMTP_PORT ?? 587);
	const secure = process.env.SMTP_SECURE === "true" || port === 465;

	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port,
		secure,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
		logger: true, // logi SMTP w konsoli
		debug: true,
	});

	// 3. Sprawdź połączenie
	console.log("\n3. Weryfikuję połączenie z SMTP...");
	try {
		await transporter.verify();
		console.log("   ✅ SMTP odpowiada poprawnie");
	} catch (err) {
		console.error("   ❌ SMTP nie odpowiada:", err);
		process.exit(1);
	}

	// 4. Przygotuj maila
	const TO = "maciej.czarnecki@silamlodych.pl";
	const html = inactiveReminderTemplate({
		userName: "Maciej",
		loginUrl: `${process.env.APP_URL ?? "https://panel.silamlodych.pl"}/login`,
		adminName: "Zarząd Siły Młodych",
		message:
			"To jest wiadomość testowa — jeśli ją widzisz, mailer działa poprawnie. 🎉",
	});

	// 5. Wyślij
	console.log(`\n4. Wysyłam maila do: ${TO}...`);
	try {
		const info = await transporter.sendMail({
			from:
				process.env.SMTP_FROM ?? `"Siła Młodych" <${process.env.SMTP_USER}>`,
			to: TO,
			subject: "👋 [TEST] Zapraszamy do panelu Siły Młodych",
			html,
		});

		console.log("\n   ✅ Mail wysłany!");
		console.log("   Message ID:", info.messageId);
		console.log("   Response:", info.response);
		console.log("   Accepted:", info.accepted);
		console.log("   Rejected:", info.rejected);
	} catch (err) {
		console.error("\n   ❌ Błąd wysyłki:", err);
		process.exit(1);
	}

	console.log("\n=== KONIEC ===\n");
	console.log(`Sprawdź skrzynkę: ${TO} (i folder SPAM)`);
}

main().catch((err) => {
	console.error("\n❌ Nieoczekiwany błąd:", err);
	process.exit(1);
});
