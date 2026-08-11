import axios from "axios";
import { logger } from "@/utils/logger";

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "/api",
	headers: {
		"Content-Type": "application/json",
	},
});

// Interceptor request - dodaje token
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("accessToken");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

// Interceptor response - obsługa błędów 401
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			logger.warn("🔐 Token wygasł lub jest nieprawidłowy");

			// Usuń stary token
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refreshToken"); // jeśli używasz refresh token

			// Przekieruj do logowania jeśli nie jesteśmy już na /login
			if (window.location.pathname !== "/login") {
				window.location.href = "/login";
			}
		}
		return Promise.reject(error);
	},
);

export default api;
