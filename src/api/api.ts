import axios from "axios";
import { logger } from "@/utils/logger";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_VERSION = "1.0.0";

const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
		"X-API-Version": API_VERSION,
	},
	timeout: 30000,
});

// Interceptor dla requestów
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

// Interceptor dla response - WYLOGOWYWANIE
api.interceptors.response.use(
	(response) => {
		// Sprawdź czy API zwraca nową wersję
		const apiVersion = response.headers["x-api-version"];
		if (apiVersion && apiVersion !== API_VERSION) {
			logger.warn("Nowa wersja API - wylogowywanie...");
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refreshToken");
			localStorage.removeItem("user");
			localStorage.removeItem("userVersion");
			window.location.href = "/login";
			return Promise.reject(new Error("Nowa wersja API"));
		}
		return response;
	},
	async (error) => {
		const originalRequest = error.config;

		// 401 - Nieautoryzowany
		if (error.response?.status === 401) {
			logger.warn("401 - Brak autoryzacji, wylogowywanie...");
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refreshToken");
			localStorage.removeItem("user");
			localStorage.removeItem("userVersion");
			window.location.href = "/login";
			return Promise.reject(error);
		}

		// 403 - Zabronione (zmiana roli/uprawnień)
		if (error.response?.status === 403) {
			logger.warn("403 - Brak uprawnień, wylogowywanie...");
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refreshToken");
			localStorage.removeItem("user");
			localStorage.removeItem("userVersion");
			window.location.href = "/login";
			return Promise.reject(error);
		}

		// Obsługa odświeżania tokenu (opcjonalnie)
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;
			try {
				const refreshToken = localStorage.getItem("refreshToken");
				if (!refreshToken) {
					throw new Error("Brak refresh token");
				}

				const response = await axios.post(`${API_URL}/api/auth/refresh`, {
					refreshToken,
				});

				const { accessToken } = response.data;
				localStorage.setItem("accessToken", accessToken);

				originalRequest.headers.Authorization = `Bearer ${accessToken}`;
				return api(originalRequest);
			} catch (refreshError) {
				logger.error("Błąd odświeżania tokenu:", refreshError);
				localStorage.removeItem("accessToken");
				localStorage.removeItem("refreshToken");
				localStorage.removeItem("user");
				localStorage.removeItem("userVersion");
				window.location.href = "/login";
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

// Funkcja do sprawdzania wersji użytkownika
export const checkUserVersion = async () => {
	try {
		const token = localStorage.getItem("accessToken");
		if (!token) return;

		const response = await api.get("/api/user/version");

		if (response.status === 200) {
			const data = response.data;
			const savedVersion = localStorage.getItem("userVersion");

			if (savedVersion && data.version !== savedVersion) {
				logger.warn("Zmiana wersji użytkownika - wylogowywanie...");
				localStorage.removeItem("accessToken");
				localStorage.removeItem("refreshToken");
				localStorage.removeItem("user");
				localStorage.removeItem("userVersion");
				window.location.href = "/login";
				return;
			}

			localStorage.setItem("userVersion", data.version);
		}
	} catch (error) {
		// Ignoruj błędy sprawdzania wersji
		logger.error("Błąd sprawdzania wersji:", error);
	}
};

export default api;
