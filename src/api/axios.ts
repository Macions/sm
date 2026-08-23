
import axios from "axios";
import { logger } from "@/utils/logger";


const API_URL = ''; 
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});


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


api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            logger.warn("🔐 Token wygasł lub jest nieprawidłowy");


            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");


            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    },
);

export default api;