import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar/Sidebar";
import Header from "../components/layout/Header/Header";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout() {
	const location = useLocation();
	const navigate = useNavigate();
	const [activeNav, setActiveNav] = useState("dashboard");
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // ⬅️ STAN ZWIJANIA

	// Ustawianie aktywnego elementu na podstawie URL
	useEffect(() => {
		const path = location.pathname.replace("/", "") || "dashboard";
		setActiveNav(path);
	}, [location]);
	const handleNavSelect = (key: string) => {
		setActiveNav(key);
		navigate(`/${key}`); // ⬅️ PRZEKIEROWANIE
	};
	// ⬅️ FUNKCJA PRZEŁĄCZANIA SIDEBARU
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

	return (
		<div
			className={`${styles.layout} ${sidebarCollapsed ? styles.layoutCollapsed : ""}`}
		>
			<Sidebar
				activeKey={activeNav}
				onSelect={handleNavSelect}
				collapsed={sidebarCollapsed} // ⬅️ PRZEKAZUJEMY STAN
			/>
			<main className={styles.main}>
				<Header
					title={getPageTitle()}
					userRole="ADMIN"
					userName="Maciej Kowalski"
					collapsed={sidebarCollapsed}
					onMenuClick={toggleSidebar} // ⬅️ PRZEKAZUJEMY FUNKCJĘ
				/>
				<Outlet />
			</main>
		</div>
	);
}
