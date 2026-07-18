import { NAV_ITEMS } from "../../../data/navigation";
import styles from "./Sidebar.module.css";
import { LogOut } from "lucide-react";

interface SidebarProps {
	activeKey: string;
	onSelect: (key: string) => void;
	collapsed?: boolean; // ⬅️ DODAJEMY PROP
}

export default function Sidebar({
	activeKey,
	onSelect,
	collapsed = false, // ⬅️ DOMYŚLNIE ROZWINIĘTE
}: SidebarProps) {
	return (
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
				{NAV_ITEMS.map(({ key, label, icon: Icon }) => (
					<button
						key={key}
						className={`${styles.nav__item} ${activeKey === key ? styles.active : ""} ${collapsed ? styles.nav__itemCollapsed : ""}`}
						onClick={() => onSelect(key)}
						title={collapsed ? label : ""} // ⬅️ Tooltip gdy zwinięte
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
					onClick={() => {
						console.log("Wylogowanie");
					}}
					title={collapsed ? "Wyloguj" : ""}
				>
					<LogOut size={18} />

					<span
						className={`${styles.nav__label} ${
							collapsed ? styles.nav__labelHidden : ""
						}`}
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
						<span className={styles.footer__line}>© 2026 Wszelkie prawa zastrzeżone</span>
					</>
				)}
			</div>
		</aside>
	);
}
