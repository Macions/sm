type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const LOG_LEVEL =
	process.env.LOG_LEVEL ||
	(process.env.NODE_ENV === "development" ? "debug" : "error");

class Logger {
	private level = LOG_LEVEL as LogLevel;

	private shouldLog(level: LogLevel) {
		const levels = ["debug", "info", "warn", "error", "silent"];

		return (
			levels.indexOf(level) >= levels.indexOf(this.level) &&
			this.level !== "silent"
		);
	}

	debug(...args: any[]) {
		if (this.shouldLog("debug")) {
			console.debug(...args);
		}
	}

	info(...args: any[]) {
		if (this.shouldLog("info")) {
			console.info(...args);
		}
	}

	warn(...args: any[]) {
		if (this.shouldLog("warn")) {
			console.warn(...args);
		}
	}

	error(...args: any[]) {
		if (this.shouldLog("error")) {
			console.error(...args);
		}
	}
}

export const logger = new Logger();
