// src/api/axios.ts
import axios from "axios";
import { logger } from "@/utils/logger";

// ✅ NA SZTYWNO - DLA PRODUKCJI
const API_URL = ''; 
const api = axios.create({
    baseURL: API_URL,
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
            localStorage.removeItem("refreshToken");

            // Przekieruj do logowania jeśli nie jesteśmy już na /login
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    },
);

export default api;