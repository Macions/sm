import { useState, useEffect } from "react";
import { logger } from "@/utils/logger";
import { safeNavigate } from "@/utils/safeNavigation";
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
	const [userData, setUserData] = useState<any>(null);

	useEffect(() => {
		const checkSocialMediaAccess = async () => {
			try {
				const token = localStorage.getItem("accessToken");
				if (!token) {
					setLoading(false);
					return;
				}

				let hasSocialAccess = false;

				const userDataStr = localStorage.getItem("user");
				const userData = userDataStr ? JSON.parse(userDataStr) : null;
				setUserData(userData);

				if (userData?.role === "admin") {
					hasSocialAccess = true;
					logger.debug("✅ Admin - dostęp do Social Media");
				} else {
					try {
						logger.debug("🔍 Sprawdzam przez /api/social/members/check...");
						const socialCheck = await fetch("/api/social/members/check", {
							headers: { Authorization: `Bearer ${token}` },
						});

						if (socialCheck.ok) {
							const checkData = await socialCheck.json();
							logger.debug("📊 Wynik check:", checkData);

							hasSocialAccess =
								checkData.isMember === true ||
								checkData.isSocialMember === true;
							logger.debug(`📊 hasSocialAccess: ${hasSocialAccess}`);
						} else {
							logger.debug(
								`❌ /api/social/members/check zwrócił ${socialCheck.status}`,
							);
							hasSocialAccess = false;
						}
					} catch (error) {
						logger.error("❌ Błąd sprawdzania:", error);
						hasSocialAccess = false;
					}
				}

				logger.debug(
					`🎯 Ostateczny wynik: hasSocialAccess = ${hasSocialAccess}`,
				);
				setIsSocialMember(hasSocialAccess);
			} catch (error) {
				logger.error("❌ Błąd:", error);
				setIsSocialMember(false);
			} finally {
				setLoading(false);
			}
		};

		checkSocialMediaAccess();
	}, []);

	useEffect(() => {
		const path = location.pathname.replace("/", "") || "dashboard";
		setActiveNav(path);
	}, [location]);

	const handleNavSelect = (key: string) => {
		setActiveNav(key);
		safeNavigate(`/${key}`, navigate);
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
			case "tasks":
				return "Zadania";
			case "calendar":
				return "Kalendarz";
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
		return (
			<div className={styles.loadingContainer}>
				<div className={styles.loading__spinner}></div>
			</div>
		);
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
				userRole={userData?.role || null}
			/>
			<main className={styles.main}>
				<Header
					title={getPageTitle()}
					userRole={userData?.role || null}
					userName={userData?.firstName + " " + userData?.lastName || "Użytkownik"}
					collapsed={sidebarCollapsed}
					onMenuClick={toggleSidebar}
				/>
				<Outlet />
			</main>
		</div>
	);
}
