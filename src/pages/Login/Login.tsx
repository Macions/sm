import React, { useState } from "react";
import styles from "./Login.module.css";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const navigate = useNavigate();
	// const [remember, setRemember] = useState(false);

	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour >= 22 || hour < 6) {
			return "Fioletowej nocy!";
		}
		return "Fioletowego dnia!";
	};
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const response = await fetch("http://localhost:3000/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username,
					password,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				localStorage.setItem("token", data.token);

				localStorage.setItem("user", JSON.stringify(data.user));

				// tutaj później przekierowanie
				navigate("/dashboard");
			} else {
				alert(data.message);
			}
		} catch (error) {
			console.error(error);

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
									type="text"
									placeholder="Nazwa użytkownika"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
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
