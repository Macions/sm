// src/hooks/useUserVersionCheck.ts
import { useEffect } from "react";
import { checkUserVersion } from "@/utils/api";

export const useUserVersionCheck = () => {
	useEffect(() => {
		const checkVersion = async () => {
			await checkUserVersion();
		};

		// Sprawdź od razu
		checkVersion();

		// Sprawdzaj co 30 sekund
		const interval = setInterval(checkVersion, 30000);

		return () => clearInterval(interval);
	}, []);
};
