import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import api from "@/api/axios";

const DashboardLayout = lazy(() => import("@/layouts/DashboardLayout"));
const Login = lazy(() => import("@/pages/Login/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard/Dashboard"));
const Admin = lazy(() => import("@/pages/Admin/Admin"));
const Structure = lazy(() => import("@/pages/Structure/Structure"));
const Projects = lazy(() => import("@/pages/Projects/Projects"));
const Tutorials = lazy(() => import("@/pages/Tutorials/Tutorials"));
const Members = lazy(() => import("@/pages/Members/Members"));
const Vacancies = lazy(() => import("@/pages/Vacancies/Vacancies"));
const Leave = lazy(() => import("@/pages/Leave/Leave"));
const SocialMedia = lazy(() => import("@/pages/SocialMedia/SocialMedia"));
const Profile = lazy(() => import("@/pages/Profile/Profile"));
const Calendar = lazy(() => import("@/pages/Calendar/Calendar"));
const Tasks = lazy(() => import("@/pages/Tasks/Tasks"));

const LoadingSpinner = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa'
    }}>
        <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#4A6FE8',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

function AppRoutes() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }
            try {
                const response = await api.get("/auth/me");

                console.log("✅ Token ważny:", response.data);
                setIsAuthenticated(true);
            } catch (error) {
                console.error("❌ Błąd weryfikacji:", error);
                localStorage.removeItem("accessToken");
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };
        verifyToken();
    }, []);

    if (isLoading) return <LoadingSpinner />;

    if (!isAuthenticated) {
        return (
            <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Suspense>
        );
    }

    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                <Route element={<DashboardLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/structure" element={<Structure />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/guides" element={<Tutorials />} />
                    <Route path="/members" element={<Members />} />
                    <Route path="/vacancies" element={<Vacancies />} />
                    <Route path="/leave" element={<Leave />} />
                    <Route path="/social" element={<SocialMedia />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/tasks" element={<Tasks />} />
                </Route>
            </Routes>
        </Suspense>
    );
}

export default AppRoutes;