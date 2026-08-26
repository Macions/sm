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

	// 🔥 SPRAWDZANIE TRYBU SERWISOWEGO
	useEffect(() => {
		const checkMaintenance = () => {
			// 🔥 NA PRODUKCJI UŻYWAJ TYLKO LOCALSTORAGE
			const maintenanceFromStorage = localStorage.getItem('maintenance') === 'true';

			// Dla lokalnego dev - sprawdź też env
			const maintenanceFromEnv = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

			// Na produkcji używaj localStorage, na dev używaj env jako fallback
			const isProduction = import.meta.env.PROD === true;
			const maintenance = isProduction
				? maintenanceFromStorage  // Na produkcji TYLKO localStorage
				: maintenanceFromStorage || maintenanceFromEnv; // Na dev oba

			setIsMaintenance(maintenance);

			console.log("🔧 [Maintenance] isProduction:", isProduction);
			console.log("🔧 [Maintenance] localStorage:", maintenanceFromStorage);
			console.log("🔧 [Maintenance] wynik:", maintenance);
		};

		checkMaintenance();

		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'maintenance') {
				checkMaintenance();
			}
		};
		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, []);

	useEffect(() => {
		const verifyToken = async () => {
			const token = localStorage.getItem("accessToken");
			if (!token) {
				logger.debug("🔐 [Auth] Brak tokena");
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
				logger.warn("❌ [Auth] Token wygasł lub jest nieprawidłowy", error?.response?.status);
				localStorage.removeItem("accessToken");
				localStorage.removeItem("refreshToken");
				setIsAuthenticated(false);
			} finally {
				setIsLoading(false);
			}
		};
		verifyToken();
	}, []);

	// Nasłuchuj zmian tokena w innych kartach
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "accessToken") {
				if (!e.newValue) {
					setIsAuthenticated(false);
				} else {
					setIsLoading(true);
					const verifyNewToken = async () => {
						try {
							await api.get("/auth/me");
							setIsAuthenticated(true);
						} catch {
							localStorage.removeItem("accessToken");
							setIsAuthenticated(false);
						} finally {
							setIsLoading(false);
						}
					};
					verifyNewToken();
				}
			}
		};

		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, []);

	if (isLoading) return <LoadingSpinner />;

	// 🔥 JEŚLI TRYB SERWISOWY - POKAŻ STRONĘ MAINTENANCE
	if (isMaintenance) {
		console.log("🔧 [Router] Tryb serwisowy - wyświetlam stronę Maintenance");
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