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

api.interceptors.request.use(
	(config) => {
		return config;
	},
	(error) => Promise.reject(error),
);

api.interceptors.response.use(
	(response) => {
		const apiVersion = response.headers["x-api-version"];
		if (apiVersion && apiVersion !== API_VERSION) {
			logger.warn("Nowa wersja API - wylogowywanie...");
			localStorage.removeItem("user");
			window.location.href = "/login";
			return Promise.reject(new Error("Nowa wersja API"));
		}
		return response;
	},
	async (error) => {
		const originalRequest = error.config;

		if (error.response?.status === 401) {
			logger.warn("401 - Brak autoryzacji, wylogowywanie...");
			localStorage.removeItem("user");
			window.location.href = "/login";
			return Promise.reject(error);
		}

		if (error.response?.status === 403) {
			logger.warn("403 - Brak uprawnień, wylogowywanie...");
			localStorage.removeItem("user");
			window.location.href = "/login";
			return Promise.reject(error);
		}

		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;
			try {
				const response = await axios.post(`${API_URL}/api/auth/refresh`, {});
				const { accessToken } = response.data;
				originalRequest.headers.Authorization = `Bearer ${accessToken}`;
				return api(originalRequest);
			} catch (refreshError) {
				logger.error("Błąd odświeżania tokenu:", refreshError);
				localStorage.removeItem("user");
				window.location.href = "/login";
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

export const checkUserVersion = async () => {
	try {
		const response = await api.get("/api/user/version");

		if (response.status === 200) {
			const data = response.data;
			const savedVersion = localStorage.getItem("userVersion");

			if (savedVersion && data.version !== savedVersion) {
				logger.warn("Zmiana wersji użytkownika - wylogowywanie...");
				localStorage.removeItem("user");
				window.location.href = "/login";
				return;
			}

			localStorage.setItem("userVersion", data.version);
		}
	} catch (error) {
		logger.error("Błąd sprawdzania wersji:", error);
	}
};

export default api;