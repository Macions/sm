import React, { useState } from "react";
import styles from "./Login.module.css";

const Login: React.FC = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	
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

			// Zapisz tokeny
			localStorage.setItem("accessToken", data.accessToken);
			localStorage.setItem("refreshToken", data.refreshToken);
			localStorage.setItem("user", JSON.stringify(data.user));

			console.log("🔑 accessToken zapisany");
			console.log("👤 user:", localStorage.getItem("user"));

			// ===== SPRAWDŹ STATUS ONBOARDINGU =====
			try {
				const token = localStorage.getItem("accessToken");
				const onboardingResponse = await fetch("/api/auth/onboarding-status", {
					method: "GET",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (onboardingResponse.ok) {
					const onboardingData = await onboardingResponse.json();
					console.log("📋 Status onboardingu:", onboardingData);

					if (onboardingData.completed) {
						console.log("➡️ Przekierowanie do Dashboard");
						localStorage.setItem("onboardingCompleted", "true");
						window.location.href = "/dashboard";

					} else {
						console.log("➡️ Przekierowanie do Onboarding");
						localStorage.removeItem("onboardingCompleted");
						window.location.href = "/onboarding";

					}
				} else {
					// Jeśli odpowiedź nie jest OK, i tak przejdź do dashboardu
					console.warn(
						"⚠️ Błąd sprawdzania onboardingu, przechodzę do dashboardu",
					);
					localStorage.setItem("onboardingCompleted", "true");
					navigate("/dashboard");
				}
			} catch (onboardingError) {
				console.error("❌ Błąd sprawdzania onboardingu:", onboardingError);
				// W przypadku błędu - przejdź do dashboardu (bezpieczniej)
				localStorage.setItem("onboardingCompleted", "true");
				navigate("/dashboard");
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
							src="src/assets/images/sm-logo.png"
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
