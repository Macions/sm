// frontend/src/pages/Login.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
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


	const handleGoogleSuccess = async (credentialResponse: any) => {
		console.log("🚀 === ROZPOCZĘCIE LOGOWANIA PRZEZ GOOGLE ===");
		console.log("Pełny credentialResponse:", credentialResponse);
		console.log("credential:", credentialResponse?.credential);
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

			console.log("📡 Status odpowiedzi google login:", response.status);

			const data = await response.json();

			if (!response.ok) {
				console.log("❌ Błąd logowania przez Google:", data);

				throw new Error(data.error || "Błąd logowania przez Google");
			}

			console.log("✅ Logowanie przez Google poprawne");


			localStorage.setItem("accessToken", data.accessToken);
			localStorage.setItem("refreshToken", data.refreshToken);
			localStorage.setItem("user", JSON.stringify(data.user));

			console.log("💾 Tokeny zapisane w localStorage");


			await checkOnboardingStatus();
		} catch (error) {
			console.log("❌ BŁĄD logowania przez Google:", error);
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
		console.log("❌ Błąd logowania przez Google");
		setError("Nie udało się zalogować przez Google. Spróbuj ponownie.");
	};


	const checkOnboardingStatus = async () => {
		console.log("🔍 === ROZPOCZĘCIE SPRAWDZANIA ONBOARDINGU ===");

		try {
			const token = localStorage.getItem("accessToken");
			console.log(
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

			console.log(
				"📡 Status odpowiedzi onboarding-status:",
				onboardingResponse.status,
			);

			let onboardingCompleted = false;

			if (onboardingResponse.ok) {
				const rawResponse = await onboardingResponse.json();
				console.log("📋 Pełna odpowiedź API onboarding-status:", rawResponse);
				onboardingCompleted = rawResponse.completed === true;
			} else {
				console.log(
					`⚠️ Błąd sprawdzania onboardingu (${onboardingResponse.status})`,
				);
				onboardingCompleted = false;
			}


			localStorage.setItem(
				"onboardingCompleted",
				onboardingCompleted ? "true" : "false",
			);
			console.log(
				`💾 Zapisano w localStorage onboardingCompleted = ${onboardingCompleted ? "true" : "false"}`,
			);


			if (onboardingCompleted) {
				navigate("/dashboard");
			} else {
				navigate("/onboarding");
			}
		} catch (onboardingError) {
			console.log("❌ BŁĄD podczas sprawdzania onboardingu:", onboardingError);
			localStorage.setItem("onboardingCompleted", "false");
			navigate("/onboarding");
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		console.log("🚀 === ROZPOCZĘCIE PROCESU LOGOWANIA ===");

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

			console.log("📡 Status odpowiedzi login:", response.status);

			const data = await response.json();

			if (!response.ok) {
				console.log("❌ Błąd logowania:", data);
				throw new Error(data.error || "Błąd logowania");
			}

			console.log("✅ Logowanie poprawne");


			localStorage.setItem("accessToken", data.accessToken);
			localStorage.setItem("refreshToken", data.refreshToken);
			localStorage.setItem("user", JSON.stringify(data.user));

			console.log("💾 Tokeny zapisane w localStorage");


			await checkOnboardingStatus();
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
	console.log("GOOGLE CLIENT ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
	return (
		<div className={styles.loginContainer}>
			<div className={styles.loginCard}>
				{}
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

				{}
				<div className={styles.rightPanel}>
					<div className={styles.formContainer}>
						<h2>Zaloguj się</h2>

						<p className={styles.createAccount}>
							Nie masz konta w domenie Siły Młodych?{" "}
							<span className={styles.link}>
								Skontaktuj się z zespołem IT
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

						{}
						<div className={styles.divider}>
							<span>lub</span>
						</div>

						{}
						<div className={styles.googleButtonWrapper}>
							<GoogleLogin
								onSuccess={handleGoogleSuccess}
								onError={handleGoogleError}

								theme="outline"
								size="large"
								text="signin_with"
								shape="rectangular"
								logo_alignment="left"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
