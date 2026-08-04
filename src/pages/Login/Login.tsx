// frontend/src/pages/Login.tsx

import React, { useState } from "react";
import { safeNavigate } from "@/utils/safeNavigation";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import styles from "./Login.module.css";
import { logger } from "@/utils/logger";

const Login: React.FC = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const navigate = useNavigate();
	const { refetch } = useUser();  // ← DODAJ

	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour >= 22 || hour < 6) {
			return "Fioletowej nocy!";
		}
		return "Fioletowego dnia!";
	};

	const handleGoogleSuccess = async (credentialResponse: any) => {
		logger.debug("🚀 === ROZPOCZĘCIE LOGOWANIA PRZEZ GOOGLE ===");
		logger.debug("Pełny credentialResponse:", credentialResponse);
		logger.debug("credential:", credentialResponse?.credential);
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/auth/google", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					credential: credentialResponse.credential,
				}),
			});

			logger.debug("📡 Status odpowiedzi google login:", response.status);

			const data = await response.json();

			if (!response.ok) {
				logger.debug("❌ Błąd logowania przez Google:", data);

				throw new Error(data.error || "Błąd logowania przez Google");
			}

			logger.debug("✅ Logowanie przez Google poprawne");

			localStorage.setItem("accessToken", data.accessToken);
			localStorage.setItem("refreshToken", data.refreshToken);
			localStorage.setItem("user", JSON.stringify(data.user));

			// 🔥 DODAJ - odśwież dane usera z profilu
			await refetch();

			await checkOnboardingStatus();
		} catch (error) {
			logger.debug("❌ BŁĄD logowania przez Google:", error);
			setError(
				error instanceof Error
					? error.message
					: "Wystąpił błąd podczas logowania przez Google",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleError = () => {
		logger.debug("❌ Błąd logowania przez Google");
		setError("Nie udało się zalogować przez Google. Spróbuj ponownie.");
	};

	const checkOnboardingStatus = async () => {
		logger.debug("🔍 === ROZPOCZĘCIE SPRAWDZANIA ONBOARDINGU ===");

		try {
			const token = localStorage.getItem("accessToken");
			logger.debug(
				"🔑 Token do sprawdzenia onboardingu:",
				token ? "Jest (długość: " + token.length + ")" : "BRAK",
			);

			const onboardingResponse = await fetch("/api/auth/onboarding-status", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			logger.debug(
				"📡 Status odpowiedzi onboarding-status:",
				onboardingResponse.status,
			);

			let onboardingCompleted = false;

			if (onboardingResponse.ok) {
				const rawResponse = await onboardingResponse.json();
				logger.debug("📋 Pełna odpowiedź API onboarding-status:", rawResponse);
				onboardingCompleted = rawResponse.completed === true;
			} else {
				logger.debug(
					`⚠️ Błąd sprawdzania onboardingu (${onboardingResponse.status})`,
				);
				onboardingCompleted = false;
			}

			localStorage.setItem(
				"onboardingCompleted",
				onboardingCompleted ? "true" : "false",
			);
			logger.debug(
				`💾 Zapisano w localStorage onboardingCompleted = ${onboardingCompleted ? "true" : "false"}`,
			);

			if (onboardingCompleted) {
				safeNavigate("/dashboard", navigate);
			} else {
				safeNavigate("/onboarding", navigate);
			}
		} catch (onboardingError) {
			logger.debug("❌ BŁĄD podczas sprawdzania onboardingu:", onboardingError);
			localStorage.setItem("onboardingCompleted", "false");
			safeNavigate("/onboarding", navigate);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		logger.debug("🚀 === ROZPOCZĘCIE PROCESU LOGOWANIA ===");

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

			logger.debug("📡 Status odpowiedzi login:", response.status);

			const data = await response.json();

			if (!response.ok) {
				logger.debug("❌ Błąd logowania:", data);
				throw new Error(data.error || "Błąd logowania");
			}

			logger.debug("✅ Logowanie poprawne");

			localStorage.setItem("accessToken", data.accessToken);
			localStorage.setItem("refreshToken", data.refreshToken);
			localStorage.setItem("user", JSON.stringify(data.user));

			// 🔥 DODAJ - odśwież dane usera z profilu
			await refetch();

			await checkOnboardingStatus();
		} catch (error) {
			logger.debug("❌ BŁĄD logowania:", error);
			setError(
				error instanceof Error
					? error.message
					: "Wystąpił błąd podczas logowania",
			);
		} finally {
			setLoading(false);
			logger.debug("⏱️ Proces logowania zakończony");
		}
	};
	logger.debug("GOOGLE CLIENT ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
	return (
		<div className={styles.loginContainer}>
			<div className={styles.loginCard}>
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

				<div className={styles.rightPanel}>
					<div className={styles.formContainer}>
						<h2>Zaloguj się</h2>

						<p className={styles.createAccount}>
							Nie masz konta w domenie Siły Młodych?{" "}
							<span className={styles.link}>Skontaktuj się z zespołem IT</span>
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

						<div className={styles.divider}>
							<span>lub</span>
						</div>

						<div className={styles.googleButtonWrapper}>
							<GoogleLogin
								onSuccess={handleGoogleSuccess}
								onError={handleGoogleError}
								theme="outline"
								size="large"
								text="signin_with"
								shape="rectangular"
								logo_alignment="left"
								type="standard"
								useOneTap={false}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
