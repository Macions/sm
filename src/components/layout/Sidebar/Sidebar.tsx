import { NAV_ITEMS } from "../../../data/navigation";
import styles from "./Sidebar.module.css";
import { LogOut, X } from "lucide-react";

interface SidebarProps {
	activeKey: string;
	onSelect: (key: string) => void;
	collapsed?: boolean;
	isSocialMember?: boolean;
	userRole?: string;
	onToggleCollapse?: () => void;
	pageTitle?: string;
	isMobileMenuOpen?: boolean;
	onMobileMenuToggle?: () => void;
}

export default function Sidebar({
	activeKey,
	onSelect,
	collapsed = false,
	isSocialMember = false,
	userRole,
	isMobileMenuOpen = false,
	onMobileMenuToggle,
}: SidebarProps) {
	const isAdminOrBoard =
		userRole === "admin" || userRole === "board" || userRole === "zarząd";

	const filteredNavItems = NAV_ITEMS.filter((item) => {
		if (item.key === "social") {
			return isSocialMember || isAdminOrBoard;
		}
		if (item.key === "admin") {
			return isAdminOrBoard;
		}
		return true;
	});

	const handleLogout = () => {
		localStorage.removeItem("accessToken");
		localStorage.removeItem("user");
		localStorage.removeItem("refreshToken");
		window.location.href = "/login";
	};

	const handleMobileNav = (key: string) => {
		onSelect(key);
		if (onMobileMenuToggle) onMobileMenuToggle();
	};

	return (
		<>
			{/* 👇 WYSYWANE MENU MOBILNE */}
			<div
				className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""
					}`}
				style={{
					display: isMobileMenuOpen ? 'flex' : 'none',
				}}
			>
				<div className={styles.mobileMenuHeader}>
					<div className={styles.mobileMenuHeaderLeft}>
						<div className={styles.logo__mark}>SM</div>
						<span className={styles.logo__text}>Siła Młodych</span>
					</div>
					<button
						className={styles.mobileMenuClose}
						onClick={onMobileMenuToggle}
						aria-label="Zamknij menu"
					>
						<X size={24} />
					</button>
				</div>

				{/* 👇 DODAJ KONTENER ZE SCROLL */}
				<div className={styles.mobileNavWrapper}>
					<nav className={styles.mobileNav}>
						{filteredNavItems.map(({ key, label, icon: Icon }) => (
							<button
								key={key}
								className={`${styles.mobileNav__item} ${activeKey === key ? styles.active : ""
									}`}
								onClick={() => handleMobileNav(key)}
							>
								<Icon size={20} />
								<span className={styles.mobileNav__label}>{label}</span>
							</button>
						))}
					</nav>
				</div>

				<div className={styles.mobileLogout}>
					<button className={styles.mobileNav__item} onClick={handleLogout}>
						<LogOut size={20} />
						<span className={styles.mobileNav__label}>Wyloguj</span>
					</button>
				</div>
			</div>

			{/* 👇 OVERLAY */}
			{isMobileMenuOpen && (
				<div
					className={styles.overlay}
					onClick={onMobileMenuToggle}
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0,0,0,0.5)',
						zIndex: 998,
					}}
				/>
			)}

			{/* 👇 SIDEBAR (DESKTOP) */}
			<aside
				className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""
					}`}
			>
				<div
					className={`${styles.logo} ${collapsed ? styles.logoCollapsed : ""
						}`}
				>
					<div className={styles.logo__mark}>SM</div>
					<span
						className={`${styles.logo__text} ${collapsed ? styles.logo__textHidden : ""
							}`}
					>
						Siła Młodych
					</span>
				</div>

				<nav className={styles.nav}>
					{filteredNavItems.map(({ key, label, icon: Icon }) => (
						<button
							key={key}
							className={`${styles.nav__item} ${activeKey === key ? styles.active : ""
								} ${collapsed ? styles.nav__itemCollapsed : ""}`}
							onClick={() => onSelect(key)}
							title={collapsed ? label : ""}
						>
							<Icon size={18} />
							<span
								className={`${styles.nav__label} ${collapsed ? styles.nav__labelHidden : ""
									}`}
							>
								{label}
							</span>
						</button>
					))}
				</nav>

				<div className={styles.logout}>
					<button
						className={`${styles.nav__item} ${collapsed ? styles.nav__itemCollapsed : ""
							}`}
						onClick={handleLogout}
						title={collapsed ? "Wyloguj" : ""}
					>
						<LogOut size={18} />
						<span
							className={`${styles.nav__label} ${collapsed ? styles.nav__labelHidden : ""
								}`}
						>
							Wyloguj
						</span>
					</button>
				</div>

				<div
					className={`${styles.footer} ${collapsed ? styles.footerCollapsed : ""
						}`}
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
		</>
	);
}