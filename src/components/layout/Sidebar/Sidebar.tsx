import { NAV_ITEMS } from "../../../data/navigation";
import styles from "./Sidebar.module.css";
import {
	LogOut,
	Home,
	FolderKanban,
	Users,
	BookOpen,
	Briefcase,
	FolderTree,
	CalendarCheck,
	Megaphone,
	Shield,
	User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SidebarProps {
	activeKey: string;
	onSelect: (key: string) => void;
	collapsed?: boolean;
	isSocialMember?: boolean;
	userRole?: string;
	onToggleCollapse?: () => void;
}

export default function Sidebar({
	activeKey,
	onSelect,
	collapsed = false,
	isSocialMember = false,
	userRole,
}: SidebarProps) {
	const navigate = useNavigate();
	const isAdminOrBoard =
		userRole === "admin" || userRole === "board" || userRole === "zarząd";

	const iconMap: Record<string, any> = {
		dashboard: Home,
		projects: FolderKanban,
		members: Users,
		guides: BookOpen,
		vacancies: Briefcase,
		structure: FolderTree,
		leave: CalendarCheck,
		social: Megaphone,
		admin: Shield,
		profile: User,
	};

	const filteredNavItems = NAV_ITEMS.filter((item) => {
		if (item.key === "social") {
			return isSocialMember;
		}
		if (item.key === "admin") {
			return isAdminOrBoard;
		}
		return true;
	});

const handleLogout = () => {
    // Wyczyść localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    
    // Przekieruj na login
    window.location.href = "/login";
};
	const handleMobileNav = (key: string) => {
		onSelect(key);
	};

	return (
		<>
			<aside
				className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
			>
				<div
					className={`${styles.logo} ${collapsed ? styles.logoCollapsed : ""}`}
				>
					<div className={styles.logo__mark}>SM</div>
					<span
						className={`${styles.logo__text} ${collapsed ? styles.logo__textHidden : ""}`}
					>
						Siła Młodych
					</span>
				</div>

				<nav className={styles.nav}>
					{filteredNavItems.map(({ key, label, icon: Icon }) => (
						<button
							key={key}
							className={`${styles.nav__item} ${activeKey === key ? styles.active : ""} ${collapsed ? styles.nav__itemCollapsed : ""}`}
							onClick={() => onSelect(key)}
							title={collapsed ? label : ""}
						>
							<Icon size={18} />
							<span
								className={`${styles.nav__label} ${collapsed ? styles.nav__labelHidden : ""}`}
							>
								{label}
							</span>
						</button>
					))}
				</nav>

				<div className={styles.logout}>
					<button
						className={`${styles.nav__item} ${collapsed ? styles.nav__itemCollapsed : ""}`}
						onClick={handleLogout}
						title={collapsed ? "Wyloguj" : ""}
					>
						<LogOut size={18} />
						<span
							className={`${styles.nav__label} ${collapsed ? styles.nav__labelHidden : ""}`}
						>
							Wyloguj
						</span>
					</button>
				</div>

				<div
					className={`${styles.footer} ${collapsed ? styles.footerCollapsed : ""}`}
				>
					{collapsed ? (
						<>
							<span className={styles.footer__line}>SM</span>
							<span className={styles.footer__line}>© 2026</span>
						</>
					) : (
						<>
							<span className={styles.footer__line}>Siła Młodych</span>
							<span className={styles.footer__line}>
								© 2026 Wszelkie prawa zastrzeżone
							</span>
						</>
					)}
				</div>
			</aside>

			<nav className={styles.mobileBottomNav}>
				{filteredNavItems.map(({ key, icon: Icon }) => {
					const MobileIcon = iconMap[key] || Icon;
					return (
						<button
							key={key}
							className={`${styles.mobileNav__item} ${activeKey === key ? styles.active : ""}`}
							onClick={() => handleMobileNav(key)}
							aria-label={key}
						>
							<MobileIcon size={24} />
							<span className={styles.mobileNav__label}>
								{NAV_ITEMS.find((item) => item.key === key)?.label || key}
							</span>
						</button>
					);
				})}

				<button
					className={`${styles.mobileNav__item} ${styles.logoutBtn}`}
					onClick={handleLogout}
					aria-label="Wyloguj"
				>
					<LogOut size={24} />
					<span className={styles.mobileNav__label}>Wyloguj</span>
				</button>
			</nav>
		</>
	);
}
