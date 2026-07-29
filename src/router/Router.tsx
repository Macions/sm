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
import { useState, useEffect } from "react";

function AppRoutes() {
	const [isLoading, setIsLoading] = useState(true);
	const [onboardingCompleted, setOnboardingCompleted] = useState(false);
	// ⭐⭐⭐ DODAJ TUTAJ - SYNC Z LOCALSTORAGE PRZY KAŻDYM RENDERZE ⭐⭐⭐
	const savedOnboarding = localStorage.getItem("onboardingCompleted") === "true";
	if (savedOnboarding !== onboardingCompleted && !isLoading) {
		console.log(`🔄 [Router] SYNC - localStorage: ${savedOnboarding}, stan: ${onboardingCompleted} -> aktualizuję`);
		setOnboardingCompleted(savedOnboarding);
	}

	console.log("═══════════════════════════════════════════════════════════");
	console.log("═══════════════════════════════════════════════════════════");
	console.log("🚀 [Router] START RENDER");
	console.log("📂 PATH:", window.location.pathname);
	console.log("🌍 ORIGIN:", window.location.origin);
	console.log("📦 STORAGE KEYS:", Object.keys(localStorage));
	console.log("🔑 TOKEN RAW:", localStorage.getItem("accessToken") ? "Jest (długość: " + localStorage.getItem("accessToken")?.length + ")" : "BRAK");
	console.log("👤 USER RAW:", localStorage.getItem("user"));
	console.log("📋 ONBOARDING STATUS Z LOCALSTORAGE:", localStorage.getItem("onboardingCompleted"));
	console.log("═══════════════════════════════════════════════════════════");

	const isLoggedIn = !!localStorage.getItem("accessToken");

	// ⭐⭐⭐ SPRAWDZANIE STATUSU ONBOARDINGU ⭐⭐⭐
	useEffect(() => {
		console.log("🔄 [Router] useEffect - WYKONUJE SIĘ (isLoggedIn:", isLoggedIn, ")");

		const checkOnboardingStatus = async () => {
			console.log("🔍 [Router] checkOnboardingStatus - ROZPOCZĘCIE");

			// ⭐⭐⭐ SYNC Z LOCALSTORAGE NA POCZĄTKU ⭐⭐⭐
			const savedOnboarding = localStorage.getItem("onboardingCompleted") === "true";
			console.log(`📋 [Router] SYNC - localStorage onboardingCompleted = ${savedOnboarding}`);

			if (savedOnboarding) {
				console.log("✅ [Router] SYNC - ustawiam onboardingCompleted = true z localStorage");
				setOnboardingCompleted(true);
			} else {
				console.log("ℹ️ [Router] SYNC - ustawiam onboardingCompleted = false");
				setOnboardingCompleted(false);
			}

			// ⭐⭐⭐ ZMIENNA NA ZEWNĄTRZ TRY ⭐⭐⭐
			let finalOnboardingStatus = savedOnboarding;

			try {
				const token = localStorage.getItem("accessToken");
				console.log("🔑 [Router] Token w localStorage:", token ? "Jest (długość: " + token.length + ")" : "BRAK");

				if (!token) {
					console.log("❌ [Router] BRAK TOKENA - ustawiam isLoading=false");
					setIsLoading(false);
					return;
				}

				// ⭐ SPRAWDŹ ROLĘ I EMAIL UŻYTKOWNIKA ⭐
				const userStr = localStorage.getItem("user");
				console.log("👤 [Router] userStr z localStorage:", userStr);

				let userRole = "";
				let userEmail = "";
				let userData = null;

				if (userStr) {
					try {
						userData = JSON.parse(userStr);
						console.log("📋 [Router] Sparsowany user:", userData);
						userRole = userData.role || "";
						userEmail = userData.email || "";
						console.log(`📋 [Router] userRole: "${userRole}", userEmail: "${userEmail}"`);
					} catch (e) {
						console.error("❌ [Router] Błąd parsowania user:", e);
					}
				} else {
					console.log("⚠️ [Router] Brak user w localStorage");
				}

				// ⭐ ADMIN LUB MAKSYM - POMIŃ ONBOARDING ⭐
				if (userRole === "admin" || userEmail === "maksym.marczak@silamlodych.pl") {
					console.log(`👑 [Router] Wykryto admina lub Maksyma (role: ${userRole}, email: ${userEmail}) - pomijam onboarding`);
					finalOnboardingStatus = true;
					localStorage.setItem("onboardingCompleted", "true");
					console.log("💾 [Router] Zapisano onboardingCompleted = true w localStorage");
					setOnboardingCompleted(true);
					setIsLoading(false);
					console.log("✅ [Router] isLoading = false (admin/Maksym)");
					return;
				}

				// ⭐⭐⭐ ZAWSZE SPRAWDZAJ PRZEZ API ⭐⭐⭐
				console.log("🔍 [Router] Sprawdzam onboarding przez API...");

				console.log("📡 [Router] Wysyłanie zapytania do /api/auth/onboarding-status");
				const response = await fetch("/api/auth/onboarding-status", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				console.log("📡 [Router] Status odpowiedzi API:", response.status);

				if (response.ok) {
					const data = await response.json();
					console.log("📋 [Router] Pełna odpowiedź API:", data);
					console.log(`📋 [Router] data.completed = ${data.completed} (typ: ${typeof data.completed})`);

					const completed = data.completed === true;
					console.log(`📊 [Router] completed = ${completed}`);
					finalOnboardingStatus = completed;
					localStorage.setItem("onboardingCompleted", completed ? "true" : "false");
					console.log(`💾 [Router] Zapisano onboardingCompleted = ${completed ? "true" : "false"} w localStorage`);
				} else {
					console.error(`❌ [Router] Błąd API: status ${response.status}`);
					const errorText = await response.text();
					console.error(`❌ [Router] Błąd API treść:`, errorText);

					console.log("⚠️ [Router] Używam fallback localStorage");
					const fallback = localStorage.getItem("onboardingCompleted") === "true";
					console.log(`📋 [Router] Fallback z localStorage: ${fallback}`);
					finalOnboardingStatus = fallback;
				}

				// ⭐⭐⭐ USTAW STAN NA KONIEC ⭐⭐⭐
				console.log(`🎯 [Router] USTAWIAM onboardingCompleted = ${finalOnboardingStatus}`);
				setOnboardingCompleted(finalOnboardingStatus);

			} catch (error) {
				console.error("❌ [Router] Błąd sprawdzania onboardingu:", error);
				console.log("⚠️ [Router] Używam fallback localStorage (catch)");
				const fallback = localStorage.getItem("onboardingCompleted") === "true";
				console.log(`📋 [Router] Fallback z localStorage: ${fallback}`);
				finalOnboardingStatus = fallback;
				setOnboardingCompleted(fallback);
			} finally {
				setIsLoading(false);
				console.log(`✅ [Router] isLoading = false (final) - onboardingCompleted = ${finalOnboardingStatus}`);
				console.log("═══════════════════════════════════════════════════════════");
			}
		};

		checkOnboardingStatus();
	}, [isLoggedIn]); // ⭐⭐⭐ DODANA ZALEŻNOŚĆ - WYKONUJE SIĘ GDY LOGOWANIE SIĘ ZMIENI ⭐⭐⭐

	// ⭐ DODATKOWE SPRAWDZENIE - gdy status się zmieni
	useEffect(() => {
		console.log(`🔄 [Router] useEffect2 - isLoading: ${isLoading}, onboardingCompleted: ${onboardingCompleted}`);

		if (!isLoading && onboardingCompleted) {
			const loggedIn = !!localStorage.getItem("accessToken");
			console.log(`📋 [Router] useEffect2 - isLoggedIn: ${loggedIn}`);

			if (loggedIn) {
				const currentPath = window.location.pathname;
				console.log(`📋 [Router] useEffect2 - currentPath: ${currentPath}`);

				const isOnboardingPath = currentPath.includes('/onboarding') ||
					currentPath === '/sm/' ||
					currentPath === '/';

				console.log(`📋 [Router] useEffect2 - isOnboardingPath: ${isOnboardingPath}`);

				if (isOnboardingPath) {
					console.log("✅ [Router] Onboarding ukończony - przekierowuję do dashboard");
					console.log("🔄 [Router] window.location.href = /dashboard");
					window.location.href = "/dashboard";
				} else {
					console.log(`📌 [Router] Jesteśmy na ${currentPath} - nie przekierowuję`);
				}
			}
		} else {
			console.log(`📌 [Router] useEffect2 - brak przekierowania (isLoading: ${isLoading}, onboardingCompleted: ${onboardingCompleted})`);
		}
	}, [isLoading, onboardingCompleted]);

	const handleOnboardingComplete = (data: any) => {
		console.log("📝 [Router] handleOnboardingComplete - zapisuję dane onboardingu");
		console.log("📋 [Router] Dane onboardingu:", data);

		localStorage.setItem("onboardingData", JSON.stringify(data));
		localStorage.setItem("onboardingCompleted", "true");
		setOnboardingCompleted(true);

		console.log("💾 [Router] Zapisano onboardingData i onboardingCompleted = true");
		console.log("✅ [Router] setOnboardingCompleted(true) - przekierowanie nastąpi");
	};

	console.log("═══════════════════════════════════════════════════════════");
	console.log("📊 [Router] ZMIENNE PRZED RENDEREM:");
	console.log(`📊 isLoading: ${isLoading}`);
	console.log(`📊 onboardingCompleted: ${onboardingCompleted}`);
	console.log(`📊 isLoggedIn: ${isLoggedIn}`);
	console.log(`📊 currentPath: ${window.location.pathname}`);
	console.log("🔐 Token w routerze:", localStorage.getItem("accessToken") ? "Jest" : "BRAK");
	console.log("👤 User w routerze:", localStorage.getItem("user"));
	console.log("✅ Czy zalogowany:", isLoggedIn);
	console.log("═══════════════════════════════════════════════════════════");

	if (isLoading) {
		console.log("⏳ [Router] RENDER: Ładowanie...");
		return (
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '100vh',
			}}>
				<div style={{
					width: '40px',
					height: '40px',
					border: '3px solid #e5e7eb',
					borderTopColor: '#4A6FE8',
					borderRadius: '50%',
					animation: 'spin 0.8s linear infinite',
				}} />
			</div>
		);
	}

	if (!isLoggedIn) {
		console.log("🔐 [Router] RENDER: NIEZALOGOWANY -> /login");
		return (
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="*" element={<Navigate to="/login" replace />} />
			</Routes>
		);
	}

	if (isLoggedIn && !onboardingCompleted) {
		const currentPath = window.location.pathname;
		console.log(`⚠️ [Router] RENDER: ZALOGOWANY + ONBOARDING NIEUKOŃCZONY (path: ${currentPath})`);

		// ⭐ JAK JESTEŚMY JUŻ NA /onboarding - NIE PRZEKIEROWUJ ⭐
		if (currentPath === "/onboarding" || currentPath === "/sm/onboarding" || currentPath.includes("/onboarding")) {
			console.log("📌 [Router] RENDER: Jesteśmy już na onboarding - wyświetlam formularz");
			return (
				<Routes>
					<Route
						path="/onboarding"
						element={<Onboarding onComplete={handleOnboardingComplete} />}
					/>
					<Route path="/sm/onboarding" element={<Navigate to="/onboarding" replace />} />
					<Route path="*" element={<Navigate to="/onboarding" replace />} />
				</Routes>
			);
		}

		console.log("⚠️ [Router] RENDER: Przekierowuję do /onboarding");
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

	console.log("✅ [Router] RENDER: ZALOGOWANY + ONBOARDING UKOŃCZONY -> Dashboard");
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