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
import { logger } from "@/utils/logger";

function AppRoutes() {
	const [isLoading, setIsLoading] = useState(true);
	const [onboardingCompleted, setOnboardingCompleted] = useState(false);

	const savedOnboarding =
		localStorage.getItem("onboardingCompleted") === "true";
	if (savedOnboarding !== onboardingCompleted && !isLoading) {
		logger.debug(
			`🔄 [Router] SYNC - localStorage: ${savedOnboarding}, stan: ${onboardingCompleted} -> aktualizuję`,
		);
		setOnboardingCompleted(savedOnboarding);
	}

	logger.debug("═══════════════════════════════════════════════════════════");
	logger.debug("═══════════════════════════════════════════════════════════");
	logger.debug("🚀 [Router] START RENDER");
	logger.debug("📂 PATH:", window.location.pathname);
	logger.debug("🌍 ORIGIN:", window.location.origin);
	logger.debug("📦 STORAGE KEYS:", Object.keys(localStorage));
	logger.debug(
		"🔑 TOKEN RAW:",
		localStorage.getItem("accessToken")
			? "Jest (długość: " + localStorage.getItem("accessToken")?.length + ")"
			: "BRAK",
	);
	logger.debug("👤 USER RAW:", localStorage.getItem("user"));
	logger.debug(
		"📋 ONBOARDING STATUS Z LOCALSTORAGE:",
		localStorage.getItem("onboardingCompleted"),
	);
	logger.debug("═══════════════════════════════════════════════════════════");

	const isLoggedIn = !!localStorage.getItem("accessToken");

	useEffect(() => {
		logger.debug(
			"🔄 [Router] useEffect - WYKONUJE SIĘ (isLoggedIn:",
			isLoggedIn,
			")",
		);

		const checkOnboardingStatus = async () => {
			logger.debug("🔍 [Router] checkOnboardingStatus - ROZPOCZĘCIE");

			const savedOnboarding =
				localStorage.getItem("onboardingCompleted") === "true";
			logger.debug(
				`📋 [Router] SYNC - localStorage onboardingCompleted = ${savedOnboarding}`,
			);

			if (savedOnboarding) {
				logger.debug(
					"✅ [Router] SYNC - ustawiam onboardingCompleted = true z localStorage",
				);
				setOnboardingCompleted(true);
			} else {
				logger.debug("ℹ️ [Router] SYNC - ustawiam onboardingCompleted = false");
				setOnboardingCompleted(false);
			}

			let finalOnboardingStatus = savedOnboarding;

			try {
				const token = localStorage.getItem("accessToken");
				logger.debug(
					"🔑 [Router] Token w localStorage:",
					token ? "Jest (długość: " + token.length + ")" : "BRAK",
				);

				if (!token) {
					logger.debug("❌ [Router] BRAK TOKENA - ustawiam isLoading=false");
					setIsLoading(false);
					return;
				}

				const userStr = localStorage.getItem("user");
				logger.debug("👤 [Router] userStr z localStorage:", userStr);

				let userRole = "";
				let userEmail = "";
				let userData = null;

				if (userStr) {
					try {
						userData = JSON.parse(userStr);
						logger.debug("📋 [Router] Sparsowany user:", userData);
						userRole = userData.role || "";
						userEmail = userData.email || "";
						logger.debug(
							`📋 [Router] userRole: "${userRole}", userEmail: "${userEmail}"`,
						);
					} catch (e) {
						logger.error("❌ [Router] Błąd parsowania user:", e);
					}
				} else {
					logger.debug("⚠️ [Router] Brak user w localStorage");
				}

				if (
					userRole === "admin" ||
					userEmail === "maksym.marczak@silamlodych.pl"
				) {
					logger.debug(
						`👑 [Router] Wykryto admina lub Maksyma (role: ${userRole}, email: ${userEmail}) - pomijam onboarding`,
					);
					finalOnboardingStatus = true;
					localStorage.setItem("onboardingCompleted", "true");
					logger.debug(
						"💾 [Router] Zapisano onboardingCompleted = true w localStorage",
					);
					setOnboardingCompleted(true);
					setIsLoading(false);
					logger.debug("✅ [Router] isLoading = false (admin/Maksym)");
					return;
				}

				logger.debug("🔍 [Router] Sprawdzam onboarding przez API...");

				logger.debug(
					"📡 [Router] Wysyłanie zapytania do /api/auth/onboarding-status",
				);
				const response = await fetch("/api/auth/onboarding-status", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				logger.debug("📡 [Router] Status odpowiedzi API:", response.status);

				if (response.ok) {
					const data = await response.json();
					logger.debug("📋 [Router] Pełna odpowiedź API:", data);
					logger.debug(
						`📋 [Router] data.completed = ${data.completed} (typ: ${typeof data.completed})`,
					);

					const completed = data.completed === true;
					logger.debug(`📊 [Router] completed = ${completed}`);
					finalOnboardingStatus = completed;
					localStorage.setItem(
						"onboardingCompleted",
						completed ? "true" : "false",
					);
					logger.debug(
						`💾 [Router] Zapisano onboardingCompleted = ${completed ? "true" : "false"} w localStorage`,
					);
				} else {
					logger.error(`❌ [Router] Błąd API: status ${response.status}`);
					const errorText = await response.text();
					logger.error(`❌ [Router] Błąd API treść:`, errorText);

					logger.debug("⚠️ [Router] Używam fallback localStorage");
					const fallback =
						localStorage.getItem("onboardingCompleted") === "true";
					logger.debug(`📋 [Router] Fallback z localStorage: ${fallback}`);
					finalOnboardingStatus = fallback;
				}

				logger.debug(
					`🎯 [Router] USTAWIAM onboardingCompleted = ${finalOnboardingStatus}`,
				);
				setOnboardingCompleted(finalOnboardingStatus);
			} catch (error) {
				logger.error("❌ [Router] Błąd sprawdzania onboardingu:", error);
				logger.debug("⚠️ [Router] Używam fallback localStorage (catch)");
				const fallback = localStorage.getItem("onboardingCompleted") === "true";
				logger.debug(`📋 [Router] Fallback z localStorage: ${fallback}`);
				finalOnboardingStatus = fallback;
				setOnboardingCompleted(fallback);
			} finally {
				setIsLoading(false);
				logger.debug(
					`✅ [Router] isLoading = false (final) - onboardingCompleted = ${finalOnboardingStatus}`,
				);
				logger.debug(
					"═══════════════════════════════════════════════════════════",
				);
			}
		};

		checkOnboardingStatus();
	}, [isLoggedIn]);

	useEffect(() => {
		logger.debug(
			`🔄 [Router] useEffect2 - isLoading: ${isLoading}, onboardingCompleted: ${onboardingCompleted}`,
		);

		if (!isLoading && onboardingCompleted) {
			const loggedIn = !!localStorage.getItem("accessToken");
			logger.debug(`📋 [Router] useEffect2 - isLoggedIn: ${loggedIn}`);

			if (loggedIn) {
				const currentPath = window.location.pathname;
				logger.debug(`📋 [Router] useEffect2 - currentPath: ${currentPath}`);

				const isOnboardingPath =
					currentPath.includes("/onboarding") ||
					currentPath === "/sm/" ||
					currentPath === "/";

				logger.debug(
					`📋 [Router] useEffect2 - isOnboardingPath: ${isOnboardingPath}`,
				);

				if (isOnboardingPath) {
					logger.debug(
						"✅ [Router] Onboarding ukończony - przekierowuję do dashboard",
					);
					logger.debug("🔄 [Router] window.location.href = /dashboard");
					(window as any).goTo("/dashboard");
				} else {
					logger.debug(
						`📌 [Router] Jesteśmy na ${currentPath} - nie przekierowuję`,
					);
				}
			}
		} else {
			logger.debug(
				`📌 [Router] useEffect2 - brak przekierowania (isLoading: ${isLoading}, onboardingCompleted: ${onboardingCompleted})`,
			);
		}
	}, [isLoading, onboardingCompleted]);

	const handleOnboardingComplete = (data: any) => {
		logger.debug(
			"📝 [Router] handleOnboardingComplete - zapisuję dane onboardingu",
		);
		logger.debug("📋 [Router] Dane onboardingu:", data);

		localStorage.setItem("onboardingData", JSON.stringify(data));
		localStorage.setItem("onboardingCompleted", "true");
		setOnboardingCompleted(true);

		logger.debug(
			"💾 [Router] Zapisano onboardingData i onboardingCompleted = true",
		);
		logger.debug(
			"✅ [Router] setOnboardingCompleted(true) - przekierowanie nastąpi",
		);
	};

	logger.debug("═══════════════════════════════════════════════════════════");
	logger.debug("📊 [Router] ZMIENNE PRZED RENDEREM:");
	logger.debug(`📊 isLoading: ${isLoading}`);
	logger.debug(`📊 onboardingCompleted: ${onboardingCompleted}`);
	logger.debug(`📊 isLoggedIn: ${isLoggedIn}`);
	logger.debug(`📊 currentPath: ${window.location.pathname}`);
	logger.debug(
		"🔐 Token w routerze:",
		localStorage.getItem("accessToken") ? "Jest" : "BRAK",
	);
	logger.debug("👤 User w routerze:", localStorage.getItem("user"));
	logger.debug("✅ Czy zalogowany:", isLoggedIn);
	logger.debug("═══════════════════════════════════════════════════════════");

	if (isLoading) {
		logger.debug("⏳ [Router] RENDER: Ładowanie...");
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
				}}
			>
				<div
					style={{
						width: "40px",
						height: "40px",
						border: "3px solid #e5e7eb",
						borderTopColor: "#4A6FE8",
						borderRadius: "50%",
						animation: "spin 0.8s linear infinite",
					}}
				/>
			</div>
		);
	}

	if (!isLoggedIn) {
		logger.debug("🔐 [Router] RENDER: NIEZALOGOWANY -> /login");
		return (
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="*" element={<Navigate to="/login" replace />} />
			</Routes>
		);
	}

	if (isLoggedIn && !onboardingCompleted) {
		const currentPath = window.location.pathname;
		logger.debug(
			`⚠️ [Router] RENDER: ZALOGOWANY + ONBOARDING NIEUKOŃCZONY (path: ${currentPath})`,
		);

		if (
			currentPath === "/onboarding" ||
			currentPath === "/sm/onboarding" ||
			currentPath.includes("/onboarding")
		) {
			logger.debug(
				"📌 [Router] RENDER: Jesteśmy już na onboarding - wyświetlam formularz",
			);
			return (
				<Routes>
					<Route
						path="/onboarding"
						element={<Onboarding onComplete={handleOnboardingComplete} />}
					/>
					<Route
						path="/sm/onboarding"
						element={<Navigate to="/onboarding" replace />}
					/>
					<Route path="*" element={<Navigate to="/onboarding" replace />} />
				</Routes>
			);
		}

		logger.debug("⚠️ [Router] RENDER: Przekierowuję do /onboarding");
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

	logger.debug(
		"✅ [Router] RENDER: ZALOGOWANY + ONBOARDING UKOŃCZONY -> Dashboard",
	);
	return (
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
