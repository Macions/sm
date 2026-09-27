// src/lib/mailQueue.ts
import { sendMail, type SendMailOptions } from "./sendMail";
import { logger } from "../utils/logger";

const queue: SendMailOptions[] = [];
let running = false;

// Gmail: max ~20/min, bezpiecznie 1.5s między mailami
const DELAY_MS = 1500;

export function enqueueMail(job: SendMailOptions) {
	queue.push(job);
	processQueue();
}

async function processQueue() {
	if (running) return;
	running = true;

	while (queue.length > 0) {
		const job = queue.shift();
		if (!job) continue;

		try {
			await sendMail(job);
			logger.info(`✉️  Mail wysłany → ${job.to} | ${job.subject}`);
		} catch (err) {
			logger.error(`❌ Błąd wysyłki do ${job.to}:`, err);
		}

		await new Promise((r) => setTimeout(r, DELAY_MS));
	}

	running = false;
}
