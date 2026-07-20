import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Structure from "../pages/Structure/Structure";
import Projects from "../pages/Projects/Projects";
import Tutorials from "../pages/Tutorials/Tutorials";
import Members from "../pages/Members/Members";
import Vacancies from "../pages/Vacancies/Vacancies";
import Leave from "../pages/Leave/Leave";
import SocialMedia from "../pages/SocialMedia/SocialMedia";
import Admin from "../pages/Admin/Admin";
import Onboarding from "../pages/Onboarding/Onboarding";
import Profile from "../pages/Profile/Profile";

function AppRoutes() {
	const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
		return localStorage.getItem("onboardingCompleted") === "true";
	});

	const handleOnboardingComplete = (data: any) => {
		// Zapisz dane onboarding w localStorage
		localStorage.setItem("onboardingData", JSON.stringify(data));
		localStorage.setItem("onboardingCompleted", "true");
		setOnboardingCompleted(true);
	};

	// Sprawdź czy użytkownik jest zalogowany (dla przykładu - w rzeczywistej apce użyj AuthContext)
	const isLoggedIn = true; // ZMIEŃ NA PRAWDZIWĄ LOGIKĘ

	// Jeśli użytkownik jest zalogowany i onboarding nie jest ukończony
	if (isLoggedIn && !onboardingCompleted) {
		return (
			<Routes>
				<Route
					path="/onboarding"
					element={<Onboarding onComplete={handleOnboardingComplete} />}
				/>
				<Route path="*" element={<Navigate to="/onboarding" replace />} />
			</Routes>
		);
	}

	return (
		<Routes>
			<Route path="/login" element={<Login />} />

			<Route element={<DashboardLayout />}>
				<Route path="/" element={<Dashboard />} />
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/structure" element={<Structure />} />
				<Route path="/projects" element={<Projects />} />
				<Route path="/guides" element={<Tutorials />} />
				<Route path="/members" element={<Members title="Członkowie" />} />
				<Route path="/vacancies" element={<Vacancies title="Wakaty" />} />
				<Route
					path="/onboarding"
					element={<Navigate to="/dashboard" replace />}
				/>
				<Route path="/profile" element={<Profile title="Mój profil" />} />
				<Route path="/leave" element={<Leave title="Urlop" />} />
				<Route path="/social" element={<SocialMedia title="Social Media" />} />
				<Route path="/admin" element={<Admin title="Administracja" />} />
			</Route>
		</Routes>
	);
}

export default AppRoutes;