type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

type LogArgs = unknown[];

const isDevelopment = import.meta.env.DEV;

const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
	silent: 4,
};

const configuredLevel: LogLevel = isDevelopment ? "debug" : "silent";

class Logger {
	private level: LogLevel = configuredLevel;

	private canLog(level: LogLevel): boolean {
		return (
			LOG_LEVELS[level] >= LOG_LEVELS[this.level] && this.level !== "silent"
		);
	}

	// 🔥 POPRAWA - używaj console bezpośrednio, nie wywołuj loggera
	private output(level: LogLevel, ...args: LogArgs) {
		if (!this.canLog(level)) return;

		const prefix = `[${level.toUpperCase()}]`;

		switch (level) {
			case "debug":
				console.debug(prefix, ...args);
				break;
			case "info":
				console.info(prefix, ...args); // ✅ było logger.info
				break;
			case "warn":
				console.warn(prefix, ...args); // ✅ było logger.warn
				break;
			case "error":
				console.error(prefix, ...args); // ✅ było logger.error
				break;
		}
	}

	debug(...args: LogArgs) {
		this.output("debug", ...args);
	}

	info(...args: LogArgs) {
		this.output("info", ...args);
	}

	warn(...args: LogArgs) {
		this.output("warn", ...args);
	}

	error(...args: LogArgs) {
		this.output("error", ...args);
	}

	api = {
		request: (endpoint: string, data?: unknown) => {
			this.debug("🌐 API Request:", endpoint, data);
		},
		response: (endpoint: string, data?: unknown) => {
			this.debug("✅ API Response:", endpoint, data);
		},
		error: (endpoint: string, error: unknown) => {
			this.error("❌ API Error:", endpoint, error);
		},
	};

	group = {
		start(label: string) {
			if (isDevelopment) {
				console.group(label);
			}
		},
		end() {
			if (isDevelopment) {
				console.groupEnd();
			}
		},
	};
}

export const logger = new Logger();
