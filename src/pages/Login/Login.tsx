// frontend/src/pages/Login.tsx

import React, { useState } from "react";
import { useUser } from "@/context/UserContext";
import { useGoogleLogin } from "@react-oauth/google"; // ✅ TYLKO useGoogleLogin
import styles from "./Login.module.css";
import { logger } from "@/utils/logger";

const Login: React.FC = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { refetch } = useUser();

	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour >= 22 || hour < 6) {
			return "Fioletowej nocy!";
		}
		return "Fioletowego dnia!";
	};

	const checkOnboardingStatus = async () => {
		// 🔥 NAJPROSTSZE ROZWIĄZANIE - ZAWSZE IDŹ DO DASHBOARD
		console.log("✅ Logowanie udane! Przekierowuję na dashboard...");
		window.location.href = "/dashboard"; // ← BEZPOŚREDNIE PRZEKIEROWANIE
	};

	// ✅ LOGOWANIE PRZEZ GOOGLE Z DOSTĘPEM DO KALENDARZA
	// frontend/src/pages/Login.tsx

	const loginWithCalendar = useGoogleLogin({
		onSuccess: async (tokenResponse) => {
			logger.debug("✅ Logowanie z zakresami kalendarza - sukces!");
			setLoading(true);
			setError(null);
			console.log("Access Token:", tokenResponse.access_token);

			try {
				// ✅ ZMIEŃ NA /api/auth/google-token
				const response = await fetch("/api/auth/google-token", {
					// ← TU ZMIANA!
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						accessToken: tokenResponse.access_token, // ← TU ZMIANA NA accessToken
					}),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || "Błąd logowania przez Google");
				}

				localStorage.setItem("accessToken", data.accessToken);
				localStorage.setItem("refreshToken", data.refreshToken);
				localStorage.setItem("user", JSON.stringify(data.user));

				logger.debug("🔑 Token zapisany w localStorage");

				await refetch();
				await checkOnboardingStatus();
			} catch (error) {
				logger.error("❌ Błąd logowania:", error);
				setError(
					error instanceof Error
						? error.message
						: "Wystąpił błąd podczas logowania",
				);
			} finally {
				setLoading(false);
			}
		},
		onError: (error) => {
			logger.error("❌ Błąd logowania Google:", error);
			setError(
				"Nie udało się zalogować z dostępem do kalendarza. Spróbuj ponownie.",
			);
		},
		scope: [
			"email",
			"profile",
			"https://www.googleapis.com/auth/calendar.events",
			"https://www.googleapis.com/auth/calendar.readonly",
		].join(" "),
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

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

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Błąd logowania");
			}

			localStorage.setItem("accessToken", data.accessToken);
			localStorage.setItem("refreshToken", data.refreshToken);
			localStorage.setItem("user", JSON.stringify(data.user));

			await refetch();
			await checkOnboardingStatus();
		} catch (error) {
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
				<div className={styles.leftPanel}>
					<div className={styles.illustration}>
						<img
							src="/assets/images/sm-logo.png"
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

				<div className={styles.rightPanel}>
					<div className={styles.formContainer}>
						<h2>Zaloguj się</h2>

						<p className={styles.createAccount}>
							Nie masz konta w domenie Siły Młodych?{" "}
							<span className={styles.link}>Skontaktuj się z zespołem IT</span>
						</p>

						{error && <div className={styles.errorMessage}>{error}</div>}

						<form onSubmit={handleSubmit} hidden>
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

							<div className={styles.formOptions} hidden>
								<a href="#" className={styles.forgot} hidden>
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

						{/* <div className={styles.divider} hidden>
							<span hidden>lub</span>
						</div> */}

						{/* ✅ PRZYCISK LOGOWANIA PRZEZ GOOGLE Z DOSTĘPEM DO KALENDARZA */}
						<div className={styles.calendarScopeWrapper}>
							<button
								onClick={() => loginWithCalendar()}
								className={styles.googleBtn}
								disabled={loading}
							>
								<img
									src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
									alt="Google"
									className={styles.googleIcon}
								/>
								Zaloguj przez Google z dostępem do kalendarza
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
