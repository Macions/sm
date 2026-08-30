import { useEffect } from "react";
import { checkUserVersion } from "@/utils/api";

export const useUserVersionCheck = () => {
	useEffect(() => {
		const checkVersion = async () => {
			await checkUserVersion();
		};

		checkVersion();

		const interval = setInterval(checkVersion, 30000);

		return () => clearInterval(interval);
	}, []);
};
