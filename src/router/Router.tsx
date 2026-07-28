import { Routes, Route, Navigate } from "react-router-dom";
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
import { useState, useEffect } from "react"; // ⬅️ DODAJ

function AppRoutes() {
	const [isLoading, setIsLoading] = useState(true);
	const [onboardingCompleted, setOnboardingCompleted] = useState(false);

	console.log("PATH:", window.location.pathname);
	console.log("🌍 ORIGIN:", window.location.origin);
	console.log("📦 STORAGE:", Object.keys(localStorage));
	console.log("🔑 TOKEN RAW:", localStorage.getItem("accessToken"));

	// ⭐⭐⭐ SPRAWDŹ STATUS ONBOARDINGU PRZEZ API ⭐⭐⭐
	useEffect(() => {
		const checkOnboardingStatus = async () => {
			try {
				const token = localStorage.getItem("accessToken");
				if (!token) {
					setIsLoading(false);
					return;
				}

				console.log("🔍 [Router] Sprawdzam onboarding przez API...");

				const response = await fetch("/api/auth/onboarding-status", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (response.ok) {
					const data = await response.json();
					console.log("📋 [Router] Status onboardingu:", data);

					// ⭐ UZYWAJ API A NIE LOCALSTORAGE! ⭐
					setOnboardingCompleted(data.completed === true);

					// Zapisz w localStorage dla szybkiego dostępu (ale API jest źródłem prawdy)
					localStorage.setItem("onboardingCompleted", data.completed ? "true" : "false");
				} else {
					console.error("❌ [Router] Błąd API:", response.status);
					setOnboardingCompleted(false);
				}
			} catch (error) {
				console.error("❌ [Router] Błąd sprawdzania onboardingu:", error);
				setOnboardingCompleted(false);
			} finally {
				setIsLoading(false);
			}
		};

		checkOnboardingStatus();
	}, []);

	const handleOnboardingComplete = (data: any) => {
		// Zapisz dane onboarding w localStorage
		localStorage.setItem("onboardingData", JSON.stringify(data));
		localStorage.setItem("onboardingCompleted", "true");
		setOnboardingCompleted(true); // ⬅️ AKTUALIZUJ STAN
	};

	// Sprawdź czy użytkownik jest zalogowany
	const isLoggedIn = !!localStorage.getItem("accessToken");
	console.log("🔐 Token w routerze:", localStorage.getItem("accessToken"));
	console.log("👤 User w routerze:", localStorage.getItem("user"));
	console.log("✅ Czy zalogowany:", isLoggedIn);

	// ⭐ CZEKAJ AŻ ZAŁADUJE SIĘ STATUS ⭐
	if (isLoading) {
		return (
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100vh',
				fontSize: '18px',
				color: '#4A6FE8'
			}}>
				Ładowanie...
			</div>
		);
	}

	if (!isLoggedIn) {
		return (
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="*" element={<Navigate to="/login" replace />} />
			</Routes>
		);
	}

	// ⭐ TERAZ UŻYWA PRAWDZIWEGO STATUSU Z API ⭐
	if (isLoggedIn && !onboardingCompleted) {
		console.log("⚠️ [Router] Onboarding NIEUKOŃCZONY - przekierowuję do /onboarding");
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

	console.log("✅ [Router] Onboarding UKOŃCZONY - wyświetlam dashboard");
	return (
		<Routes>
			<Route path="/login" element={<Navigate to="/dashboard" replace />} />

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