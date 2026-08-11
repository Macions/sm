import { logger } from "./logger";

export const handleApiError = (error: any) => {
    const message = error?.response?.data?.message || error?.message || "Wystąpił błąd";
    logger.error("❌ Błąd API:", message);
    
    if (error?.response?.status === 401) {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
    }
    
    return { message, status: error?.response?.status };
};
