import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { logger } from "@/utils/logger";
import api from "@/api/axios";
import Tasks from "../pages/Tasks/Tasks";

const DashboardLayout = lazy(() => import("../layouts/DashboardLayout"));
const Login = lazy(() => import("../pages/Login/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const Structure = lazy(() => import("../pages/Structure/Structure"));
const Projects = lazy(() => import("../pages/Projects/Projects"));
const Tutorials = lazy(() => import("../pages/Tutorials/Tutorials"));
const Members = lazy(() => import("../pages/Members/Members"));
const Vacancies = lazy(() => import("../pages/Vacancies/Vacancies"));
const Leave = lazy(() => import("../pages/Leave/Leave"));
const SocialMedia = lazy(() => import("../pages/SocialMedia/SocialMedia"));
const Admin = lazy(() => import("../pages/Admin/Admin"));
const Onboarding = lazy(() => import("../pages/Onboarding/Onboarding"));
const Profile = lazy(() => import("../pages/Profile/Profile"));
const Calendar = lazy(() => import("../pages/Calendar/Calendar"));

const Loading = () => (
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
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "16px",
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
			<span style={{ color: "#6B7280", fontSize: "0.9rem" }}>Ładowanie...</span>
		</div>
	</div>
);

function AppRoutes() {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
	const [isLoading, setIsLoading] = useState(true);

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
				// Spróbuj wywołać endpoint chroniony - np. pobierz profil
				await api.get("/auth/me"); // lub inny endpoint weryfikacyjny
				logger.debug("✅ [Auth] Token ważny");
				setIsAuthenticated(true);
			} catch (error: any) {
				logger.warn(
					"❌ [Auth] Token wygasł lub jest nieprawidłowy",
					error?.response?.status,
				);
				localStorage.removeItem("accessToken");
				localStorage.removeItem("refreshToken"); // jeśli używasz
				setIsAuthenticated(false);
			} finally {
				setIsLoading(false);
			}
		};

		verifyToken();
	}, []);

	// Nasłuchuj zmian tokena w innych kartach przeglądarki
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "accessToken") {
				if (!e.newValue) {
					logger.debug("🔐 [Auth] Token usunięty w innej karcie");
					setIsAuthenticated(false);
				} else {
					// Token został dodany w innej karcie - sprawdź czy jest ważny
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

	// Jeśli sprawdzamy autentykację - pokaż loading
	if (isLoading) {
		return <Loading />;
	}

	logger.debug("═══════════════════════════════════════════════════════════");
	logger.debug("🚀 [Router] START RENDER");
	logger.debug("📂 PATH:", window.location.pathname);
	logger.debug(
		"🔑 TOKEN:",
		localStorage.getItem("accessToken") ? "Jest" : "BRAK",
	);
	logger.debug("✅ AUTH:", isAuthenticated ? "ZALOGOWANY" : "NIEZALOGOWANY");
	logger.debug("═══════════════════════════════════════════════════════════");

	if (!isAuthenticated) {
		logger.debug("🔐 [Router] NIEZALOGOWANY -> /login");
		return (
			<Suspense fallback={<Loading />}>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="*" element={<Navigate to="/login" replace />} />
				</Routes>
			</Suspense>
		);
	}

	logger.debug("✅ [Router] ZALOGOWANY -> Dashboard");
	return (
		<Suspense fallback={<Loading />}>
			<Routes>
				<Route
					path="/login"
					element={
						isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
					}
				/>
				<Route
					path="/onboarding"
					element={<Onboarding onComplete={() => {}} />}
				/>
				<Route element={<DashboardLayout />}>
					<Route path="/" element={<Dashboard />} />
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/structure" element={<Structure />} />
					<Route path="/projects" element={<Projects />} />
					<Route path="/guides" element={<Tutorials />} />
					<Route path="/members" element={<Members title="Członkowie" />} />
					<Route path="/vacancies" element={<Vacancies title="Wakaty" />} />
					<Route path="/profile" element={<Profile title="Mój profil" />} />
					<Route path="/leave" element={<Leave title="Urlop" />} />
					<Route
						path="/social"
						element={<SocialMedia title="Social Media" />}
					/>
					<Route path="/admin" element={<Admin title="Administracja" />} />
					<Route path="/tasks" element={<Tasks />} />
					<Route path="/calendar" element={<Calendar />} />
				</Route>
			</Routes>
		</Suspense>
	);
}

export default AppRoutes;