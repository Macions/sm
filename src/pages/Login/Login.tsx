// frontend/src/pages/Login.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

const Login: React.FC = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	// const [debugLogs, setDebugLogs] = useState<string[]>([]);

	const navigate = useNavigate();

	// Funkcja do dodawania logów z timestamp
	// const console.log = (message: string, data?: any) => {
	// 	const timestamp = new Date().toISOString();
	// 	const logEntry = data
	// 		? `[${timestamp}] ${message}: ${JSON.stringify(data, null, 2)}`
	// 		: `[${timestamp}] ${message}`;
	// 	console.log(logEntry);
	// 	setDebugLogs(prev => [...prev, logEntry]);
	// };

	// Funkcja do eksportu logów do pliku
	// const exportLogs = () => {
	// 	if (debugLogs.length === 0) {
	// 		alert("Brak logów do wyeksportowania");
	// 		return;
	// 	}

	// 	const logText = debugLogs.join("\n");
	// 	const blob = new Blob([logText], { type: "text/plain" });
	// 	const url = URL.createObjectURL(blob);
	// 	const a = document.createElement("a");
	// 	a.href = url;
	// 	a.download = `onboarding-debug-${new Date().toISOString()}.txt`;
	// 	a.click();
	// 	URL.revokeObjectURL(url);

	// 	console.log("📁 Logi wyeksportowane do pliku");
	// };

	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour >= 22 || hour < 6) {
			return "Fioletowej nocy!";
		}
		return "Fioletowego dnia!";
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		console.log("🚀 === ROZPOCZĘCIE PROCESU LOGOWANIA ===");
		console.log("📧 Email:", email);

		try {
			console.log("📡 Wysyłanie zapytania do /api/auth/login");

			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email,
					password,
				}),
			});

			console.log("📡 Status odpowiedzi login:", response.status);

			const data = await response.json();

			if (!response.ok) {
				console.log("❌ Błąd logowania:", data);
				throw new Error(data.error || "Błąd logowania");
			}

			console.log("✅ Logowanie poprawne");
			console.log("📦 Dane odpowiedzi:", {
				hasAccessToken: !!data.accessToken,
				hasRefreshToken: !!data.refreshToken,
				user: data.user
			});

			// ⭐ ZAPISZ TOKENY ⭐
			localStorage.setItem("accessToken", data.accessToken);
			localStorage.setItem("refreshToken", data.refreshToken);
			localStorage.setItem("user", JSON.stringify(data.user));

			console.log("💾 Tokeny zapisane w localStorage");
			console.log("👤 User zapisany:", data.user);

			// ⭐⭐⭐ SPRAWDŹ STATUS ONBOARDINGU ⭐⭐⭐
			console.log("🔍 === ROZPOCZĘCIE SPRAWDZANIA ONBOARDINGU ===");

			try {
				const token = localStorage.getItem("accessToken");
				console.log("🔑 Token do sprawdzenia onboardingu:", token ? "Jest (długość: " + token.length + ")" : "BRAK");

				console.log("📡 Wysyłanie zapytania do /api/auth/onboarding-status");

				const onboardingResponse = await fetch("/api/auth/onboarding-status", {
					method: "GET",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				console.log("📡 Status odpowiedzi onboarding-status:", onboardingResponse.status);

				let onboardingCompleted = false;
				let rawResponse = null;

				if (onboardingResponse.ok) {
					rawResponse = await onboardingResponse.json();
					console.log("📋 Pełna odpowiedź API onboarding-status:", rawResponse);
					onboardingCompleted = rawResponse.completed === true;
					console.log(`📊 onboardingCompleted = ${onboardingCompleted} (typ: ${typeof onboardingCompleted})`);
				} else {
					const errorText = await onboardingResponse.text();
					console.log(`⚠️ Błąd sprawdzania onboardingu (${onboardingResponse.status}):`, errorText);
					console.log("⚠️ Ustawiam onboardingCompleted = false (domyślnie)");
					onboardingCompleted = false;
				}

				// ⭐⭐⭐ ZAPISZ W LOCALSTORAGE ⭐⭐⭐
				localStorage.setItem("onboardingCompleted", onboardingCompleted ? "true" : "false");
				console.log(`💾 Zapisano w localStorage onboardingCompleted = ${onboardingCompleted ? "true" : "false"}`);

				// ⭐⭐⭐ SPRAWDŹ CO JEST W LOCALSTORAGE ⭐⭐⭐
				const savedToken = localStorage.getItem("accessToken");
				const savedUser = localStorage.getItem("user");
				const savedOnboarding = localStorage.getItem("onboardingCompleted");
				console.log("📦 Stan localStorage po zapisie:", {
					accessToken: savedToken ? `Jest (długość: ${savedToken.length})` : "BRAK",
					user: savedUser ? JSON.parse(savedUser) : "BRAK",
					onboardingCompleted: savedOnboarding
				});

				// ⭐⭐⭐ PRZEKIEROWANIE - TERAZ BEZ RZECZYWISTEGO PRZEKIEROWANIA ⭐⭐⭐
				console.log("🎯 === DECYZJA O PRZEKIEROWANIU ===");
				console.log(`🎯 onboardingCompleted = ${onboardingCompleted}`);

				if (onboardingCompleted) {
					// console.log("✅ Onboarding UKOŃCZONY - docelowo: /dashboard");
					// console.log("🔄 [DEBUG] Przekierowanie NASTĄPIŁOBY do /dashboard");
					// ⭐ ODKOMENTUJ DLA TESTOWANIA Z RZECZYWISTYM PRZEKIEROWANIEM ⭐
					navigate("/dashboard");
				} else {
					// console.log("⚠️ Onboarding NIEUKOŃCZONY - docelowo: /onboarding");
					// console.log("🔄 [DEBUG] Przekierowanie NASTĄPIŁOBY do /onboarding");
					// ⭐ ODKOMENTUJ DLA TESTOWANIA Z RZECZYWISTYM PRZEKIEROWANIEM ⭐
					navigate("/onboarding");
				}

				console.log("📋 === PODSUMOWANIE ===");
				console.log("1. Login: ✅ Pomyślny");
				console.log(`2. Onboarding status: ${onboardingCompleted ? "UKOŃCZONY" : "NIEUKOŃCZONY"}`);
				console.log(`3. localStorage onboardingCompleted: ${localStorage.getItem("onboardingCompleted")}`);
				console.log(`4. Docelowa ścieżka: ${onboardingCompleted ? "/dashboard" : "/onboarding"}`);
				console.log("📋 === KONIEC PROCESU ===");

			} catch (onboardingError) {
				console.log("❌ BŁĄD podczas sprawdzania onboardingu:", onboardingError);
				console.log("⚠️ Ustawiam onboardingCompleted = false (fallback)");
				localStorage.setItem("onboardingCompleted", "false");
				console.log("💾 Zapisano onboardingCompleted = false w localStorage");
				console.log("🔄 [DEBUG] Przekierowanie NASTĄPIŁOBY do /onboarding (fallback)");
				// ⭐ ODKOMENTUJ DLA TESTOWANIA Z RZECZYWISTYM PRZEKIEROWANIEM ⭐
				// navigate("/onboarding");
			}

		} catch (error) {
			console.log("❌ BŁĄD logowania:", error);
			setError(
				error instanceof Error
					? error.message
					: "Wystąpił błąd podczas logowania",
			);
		} finally {
			setLoading(false);
			console.log("⏱️ Proces logowania zakończony");
		}
	};

	return (
		<div className={styles.loginContainer}>
			<div className={styles.loginCard}>
				{/* Lewa strona */}
				<div className={styles.leftPanel}>
					<div className={styles.illustration}>
						<img
							src="/sm/assets/images/sm-logo.png"
							alt="Siła Młodych logo"
							className={styles.clipboardImg}
						/>
					</div>

					<div className={styles.welcomeText}>
						<h1>Drogi członku Siły Młodych!</h1>
						<p>
							Przedstawiamy Ci system, który pomoże Ci działać w Sile Młodych!
							<br />
							Sprawdzisz tu m.in. swój filar, frekwencję, członków zarządu i
							komisji oraz złożysz wniosek urlopowy.
							<br />
							<br />
							<strong>{getGreeting()}</strong>
						</p>
					</div>
				</div>

				{/* Prawa strona */}
				<div className={styles.rightPanel}>
					<div className={styles.formContainer}>
						<h2>Zaloguj się</h2>

						<p className={styles.createAccount}>
							Nie masz konta?{" "}
							<span className={styles.link}>
								Skontaktuj się z administratorem
							</span>
						</p>

						{error && <div className={styles.errorMessage}>{error}</div>}

						<form onSubmit={handleSubmit}>
							<div className={styles.inputGroup}>
								<input
									type="email"
									placeholder="Email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={loading}
								/>
							</div>

							<div className={styles.inputGroup}>
								<input
									type="password"
									placeholder="Hasło"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									disabled={loading}
								/>
							</div>

							<div className={styles.formOptions}>
								<a href="#" className={styles.forgot}>
									Zapomniałeś hasła?
								</a>
							</div>

							<button
								type="submit"
								className={styles.signInBtn}
								disabled={loading}
							>
								{loading ? "Logowanie..." : "Zaloguj się"}
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;