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
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [activeNav, setActiveNav] = useState("dashboard");
	const [isSocialMember, setIsSocialMember] = useState(false);
	const [loading, setLoading] = useState(true);
	const [userData, setUserData] = useState<any>(null);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [globalSearchQuery, setGlobalSearchQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [searchResults, setSearchResults] = useState([]);

	useEffect(() => {
		const checkSocialMediaAccess = async () => {
			try {
				const user = localStorage.getItem("user");
				if (!user) {
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
						const socialCheck = await fetch("/api/social/members/check");

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

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
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

	const handleGlobalSearch = async (query: string) => {
		setGlobalSearchQuery(query);

		if (!query || query.length < 2) {
			setSearchResults([]);
			setIsSearching(false);
			return;
		}

		setIsSearching(true);

		try {
			const response = await fetch(
				`/api/search?q=${encodeURIComponent(query)}`,
				{
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (response.ok) {
				const data = await response.json();
				setSearchResults(data.results || []);
			}
		} catch (error) {
			logger.error("Błąd wyszukiwania:", error);
		} finally {
			setIsSearching(false);
		}
	};

	return (
		<div className={styles.layout}>
			<div className={styles.content}>
				<Sidebar
					activeKey={activeNav}
					onSelect={handleNavSelect}
					collapsed={sidebarCollapsed}
					isSocialMember={isSocialMember}
					userRole={userData?.role || null}
					onToggleCollapse={toggleSidebar}
					pageTitle={getPageTitle()}
					isMobileMenuOpen={isMobileMenuOpen}
					onMobileMenuToggle={toggleMobileMenu}
				/>

				<div className={styles.mainWrapper}>
					<Header
						title={getPageTitle()}
						onMenuClick={toggleSidebar}
						collapsed={sidebarCollapsed}
						onMobileMenuToggle={toggleMobileMenu}
						isMobileMenuOpen={isMobileMenuOpen}
						userRole={userData?.role || null}
						onSearch={handleGlobalSearch}
						searchQuery={globalSearchQuery}
						isSearching={isSearching}
						searchResults={searchResults}
					/>
					<main className={styles.main}>
						<Outlet />
					</main>
				</div>
			</div>
		</div>
	);
}