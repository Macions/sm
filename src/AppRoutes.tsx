import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import Onboarding from "@/pages/Onboarding/Onboarding";
import { logger } from "@/utils/logger";
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
const Maintenance = lazy(() => import("@/pages/Maintenance/Maintenance"));
import NotFound from "@/pages/404";

const LoadingSpinner = () => (
	<div
		style={{
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			height: "100vh",
			background: "#f8f9fa",
		}}
	>
		<div
			style={{
				width: "48px",
				height: "48px",
				border: "4px solid #e5e7eb",
				borderTopColor: "#4A6FE8",
				borderRadius: "50%",
				animation: "spin 0.8s linear infinite",
			}}
		/>
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
	const [isMaintenance, setIsMaintenance] = useState(false);

	useEffect(() => {
		const checkMaintenance = () => {
			const maintenance = false;
			setIsMaintenance(maintenance);
		};

		checkMaintenance();

		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "maintenance") {
				checkMaintenance();
			}
		};
		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, []);

	useEffect(() => {
		const verifyToken = async () => {
			const user = localStorage.getItem("user");
			if (!user) {
				logger.debug("🔐 [Auth] Brak użytkownika");
				setIsAuthenticated(false);
				setIsLoading(false);
				return;
			}

			try {
				logger.debug("🔐 [Auth] Weryfikacja tokena...");
				await api.get("/auth/me");
				logger.debug("✅ [Auth] Token ważny");
				setIsAuthenticated(true);
			} catch (error: any) {
				logger.warn(
					"❌ [Auth] Token wygasł lub jest nieprawidłowy",
					error?.response?.status,
				);
				localStorage.removeItem("user");
				setIsAuthenticated(false);
			} finally {
				setIsLoading(false);
			}
		};
		verifyToken();
	}, []);

	if (isLoading) return <LoadingSpinner />;

	if (isMaintenance) {
		return (
			<Suspense fallback={<LoadingSpinner />}>
				<Routes>
					<Route path="*" element={<Maintenance />} />
				</Routes>
			</Suspense>
		);
	}

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
				<Route
					path="/onboarding"
					element={<Onboarding onComplete={() => { }} />}
				/>
				<Route path="/404" element={<NotFound />} />
				<Route path="*" element={<NotFound />} />
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