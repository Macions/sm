import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // <-- DODAJ
import styles from "./Login.module.css";

const Login: React.FC = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const navigate = useNavigate(); // <-- DODAJ

	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour >= 22 || hour < 6) {
			return "Fioletowej nocy!";
		}
		return "Fioletowego dnia!";
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		console.log("🚀 Próba logowania");
		console.log("Email:", email);

		try {
			const response = await fetch("http://localhost:3000/api/auth/login", {
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

			console.log("📦 Dane z backendu:", data);

			if (response.ok) {
				console.log("✅ Logowanie poprawne");

				localStorage.setItem("accessToken", data.accessToken);
				localStorage.setItem("refreshToken", data.refreshToken);
				localStorage.setItem("user", JSON.stringify(data.user));

				console.log(
					"🔑 accessToken zapisany:",
					localStorage.getItem("accessToken"),
				);
				console.log("👤 user:", localStorage.getItem("user"));

				// ===== SPRAWDŹ STATUS ONBOARDINGU =====
				try {
					const token = localStorage.getItem("accessToken");
					const onboardingResponse = await fetch(
						"http://localhost:3000/api/onboarding/status",
						{
							method: "GET",
							headers: {
								Authorization: `Bearer ${token}`,
								"Content-Type": "application/json",
							},
						},
					);

					const onboardingData = await onboardingResponse.json();
					console.log("📋 Status onboardingu:", onboardingData);

					if (onboardingData.completed) {
						console.log("➡️ Dashboard");

						localStorage.setItem("onboardingCompleted", "true");
						window.location.href = "/dashboard";
					} else {
						console.log("➡️ Onboarding");

						localStorage.removeItem("onboardingCompleted");
						window.location.href = "/onboarding";
					}
				} catch (onboardingError) {
					console.error("❌ Błąd sprawdzania onboardingu:", onboardingError);
					// Jeśli błąd, przekieruj na onboarding (bezpieczniej)
					navigate("/onboarding");
				}
			} else {
				console.log("❌ Błąd logowania:", data.message);
				alert(data.message);
			}
		} catch (error) {
			console.error("🔥 Błąd fetch:", error);
			alert("Błąd połączenia z serwerem");
		}
	};

	return (
		<div className={styles.loginContainer}>
			<div className={styles.loginCard}>
				{/* Lewa strona */}
				<div className={styles.leftPanel}>
					<div className={styles.illustration}>
						<img
							src="src\assets\images\sm-logo.png"
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

					{/* <div className={styles.dots}>
                        <span className={`${styles.dot} ${styles.active}`}></span>
                        <span className={styles.dot}></span>
                        <span className={styles.dot}></span>
                    </div> */}
				</div>

				{/* Prawa strona */}
				<div className={styles.rightPanel}>
					<div className={styles.formContainer}>
						<h2>Zaloguj się</h2>

						<p className={styles.createAccount}>
							Nie masz konta?{" "}
							<span className={styles.link}>
								Skontaktuj się z --------- --------
							</span>
						</p>

						<form onSubmit={handleSubmit}>
							<div className={styles.inputGroup}>
								<input
									type="email"
									placeholder="Email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
							</div>

							<div className={styles.inputGroup}>
								<input
									type="password"
									placeholder="Hasło"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
							</div>

							<div className={styles.formOptions}>
								{/* <label className={styles.remember}>
                                    <input
                                        type="checkbox"
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                    />
                                    Zapamiętaj hasło
                                </label> */}
								<a href="#" className={styles.forgot}>
									Zapomniałeś hasła?
								</a>
							</div>

							<button type="submit" className={styles.signInBtn}>
								Zaloguj się
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
