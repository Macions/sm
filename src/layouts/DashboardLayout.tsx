// frontend/src/layouts/DashboardLayout.tsx

import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar/Sidebar";
import Header from "../components/layout/Header/Header";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout() {
	const location = useLocation();
	const navigate = useNavigate();
	const [activeNav, setActiveNav] = useState("dashboard");
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [isSocialMember, setIsSocialMember] = useState(false);
	const [loading, setLoading] = useState(true);
	const [currentUser, setCurrentUser] = useState<any>(null);

	// ⭐ TYLKO JEDEN useEffect
	useEffect(() => {
		const checkSocialMediaAccess = async () => {
			try {
				const token = localStorage.getItem("accessToken");
				if (!token) {
					setLoading(false);
					return;
				}

				// Pobierz profil
				const response = await fetch("/api/profile", {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (response.ok) {
					const userData = await response.json();
					setCurrentUser(userData);

					// ⭐ SPRAWDŹ UPRAWNIENIA
					// Admin zawsze ma dostęp do wszystkiego
					if (userData.role === "admin") {
						setIsSocialMember(true);
					}
					// Sprawdź czy użytkownik jest w social_media_members
					else if (userData.isSocialMember === true) {
						setIsSocialMember(true);
					}
					// Jeśli nie ma pola isSocialMember - sprawdź przez osobny endpoint
					else {
						try {
							const socialCheck = await fetch("/api/social/members/check", {
								headers: { Authorization: `Bearer ${token}` },
							});
							setIsSocialMember(socialCheck.ok);
						} catch {
							setIsSocialMember(false);
						}
					}
				}
			} catch (error) {
				console.error("❌ Błąd sprawdzania uprawnień:", error);
				setIsSocialMember(false);
			} finally {
				setLoading(false);
			}
		};

		checkSocialMediaAccess();
	}, []);

	// Ustawianie aktywnego elementu na podstawie URL
	useEffect(() => {
		const path = location.pathname.replace("/", "") || "dashboard";
		setActiveNav(path);
	}, [location]);

	const handleNavSelect = (key: string) => {
		setActiveNav(key);
		navigate(`/${key}`);
	};

	const toggleSidebar = () => {
		setSidebarCollapsed(!sidebarCollapsed);
	};

	const getPageTitle = () => {
		switch (activeNav) {
			case "projects":
				return "Aktualne projekty";
			case "members":
				return "Członkowie SM";
			case "profile":
				return "Mój profil";
			case "guides":
				return "Poradniki";
			case "vacancies":
				return "Aktualne wakaty";
			case "structure":
				return "Struktura SM";
			case "leave":
				return "Urlop";
			case "social":
				return "Social Media";
			case "admin":
				return "Administracja";
			default:
				return "Panel główny";
		}
	};

	if (loading) {
		return <div className={styles.loading}>Ładowanie...</div>;
	}

	return (
		<div
			className={`${styles.layout} ${sidebarCollapsed ? styles.layoutCollapsed : ""}`}
		>
			<Sidebar
				activeKey={activeNav}
				onSelect={handleNavSelect}
				collapsed={sidebarCollapsed}
				isSocialMember={isSocialMember}
				userRole={currentUser?.role} // ⭐ PRZEKAŻ ROLĘ
			/>
			<main className={styles.main}>
				<Header
					title={getPageTitle()}
					userRole="ADMIN"
					userName="Maciej Kowalski"
					collapsed={sidebarCollapsed}
					onMenuClick={toggleSidebar}
				/>
				<Outlet />
			</main>
		</div>
	);
}
