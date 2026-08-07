import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { logger } from "@/utils/logger";
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
	const isLoggedIn = !!localStorage.getItem("accessToken");

	logger.debug("═══════════════════════════════════════════════════════════");
	logger.debug("🚀 [Router] START RENDER");
	logger.debug("📂 PATH:", window.location.pathname);
	logger.debug(
		"🔑 TOKEN:",
		localStorage.getItem("accessToken") ? "Jest" : "BRAK",
	);
	logger.debug("═══════════════════════════════════════════════════════════");

	if (!isLoggedIn) {
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
						localStorage.getItem("accessToken") ? (
							<Navigate to="/dashboard" replace />
						) : (
							<Login />
						)
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
