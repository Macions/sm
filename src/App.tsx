// src/App.tsx
import AppRoutes from "./AppRoutes";  // ← ZMIEŃ NA AppRoutes
import { logger } from "@/utils/logger";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function App() {
    const navigate = useNavigate();

    useEffect(() => {
        (window as any).__navigate = navigate;
        logger.debug("🔧 [App] Navigation initialized");
    }, [navigate]);

    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: "#333",
                        color: "#fff",
                        padding: "16px",
                        borderRadius: "8px",
                    },
                    success: {
                        style: {
                            background: "#22c55e",
                            color: "#fff",
                        },
                    },
                    error: {
                        style: {
                            background: "#ef4444",
                            color: "#fff",
                        },
                    },
                }}
            />
            <AppRoutes />  {/* ← ZMIEŃ Router NA AppRoutes */}
        </>
    );
}

export default App;