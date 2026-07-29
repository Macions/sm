// frontend/src/pages/Login.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

const Login: React.FC = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const navigate = useNavigate();

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

		console.log("🚀 Próba logowania");
		console.log("Email:", email);

		try {
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

			console.log("📡 Status odpowiedzi:", response.status);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Błąd logowania");
			}

			console.log("✅ Logowanie poprawne");

			// ⭐ ZAPISZ TOKENY ⭐
			localStorage.setItem("accessToken", data.accessToken);
			localStorage.setItem("refreshToken", data.refreshToken);
			localStorage.setItem("user", JSON.stringify(data.user));

			console.log("🔑 accessToken zapisany");
			console.log("👤 user:", localStorage.getItem("user"));

			// ⭐⭐⭐ SPRAWDŹ STATUS ONBOARDINGU ⭐⭐⭐
			try {
				const token = localStorage.getItem("accessToken");
				console.log("🔍 Sprawdzam status onboardingu...");

				const onboardingResponse = await fetch("/api/auth/onboarding-status", {
					method: "GET",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				console.log("📡 Status onboardingu:", onboardingResponse.status);

				let onboardingCompleted = false;

				if (onboardingResponse.ok) {
					const onboardingData = await onboardingResponse.json();
					console.log("📋 Status onboardingu:", onboardingData);
					onboardingCompleted = onboardingData.completed === true;
				} else {
					console.warn("⚠️ Błąd sprawdzania onboardingu (", onboardingResponse.status, ")");
					// ⭐ FALLBACK - SPRAWDŹ CZY UŻYTKOWNIK MA JUŻ ONBOARDING W BAZIE
					// Zakładamy że jeśli użytkownik istnieje i ma dane - onboarding jest zrobiony
					onboardingCompleted = true;
				}

				// ⭐⭐⭐ ZAPISZ W LOCALSTORAGE PRZED PRZEKIEROWANIEM ⭐⭐⭐
				localStorage.setItem("onboardingCompleted", onboardingCompleted ? "true" : "false");

				// ⭐⭐⭐ PRZEKIERUJ ⭐⭐⭐
				if (onboardingCompleted) {
					console.log("✅ Onboarding ukończony - przechodzę do dashboard");
					(window as any).goTo("/dashboard");
				} else {
					console.log("⚠️ Onboarding NIEUKOŃCZONY - przechodzę do onboarding");
					(window as any).goTo("/onboarding");
				}
			} catch (onboardingError) {
				console.error("❌ Błąd sprawdzania onboardingu:", onboardingError);
				// ⭐ W PRZYPADKU BŁĘDU - SPRAWDŹ LOCALSTORAGE LUB ZAKŁADAJ ŻE JEST UKOŃCZONY
				const saved = localStorage.getItem("onboardingCompleted") === "true";
				if (saved) {
					(window as any).goTo("/dashboard");
				} else {
					// Jeśli nie ma zapisanego - zakładamy że onboarding jest zrobiony (dla istniejących użytkowników)
					localStorage.setItem("onboardingCompleted", "true");
					(window as any).goTo("/dashboard");
				}
			}
		} catch (error) {
			console.error("❌ Błąd logowania:", error);
			setError(
				error instanceof Error
					? error.message
					: "Wystąpił błąd podczas logowania",
			);
		} finally {
			setLoading(false);
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