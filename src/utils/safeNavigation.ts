import { logger } from "@/utils/logger";
export const safeNavigate = (to: string, navigate: any) => {
	const dangerous = ["javascript:", "data:", "vbscript:"];
	if (dangerous.some((p) => to.toLowerCase().startsWith(p))) {
		logger.warn("❌ Niebezpieczne przekierowanie zablokowane:", to);
		return;
	}
	const sanitized = to.replace(/([^:])\/\/+/g, "$1/");
	navigate(sanitized);
};
