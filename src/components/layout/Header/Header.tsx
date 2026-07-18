import {
	Search,
	MessageCircle,
	Bell,
	PanelLeftClose,
	PanelLeftOpen,
} from "lucide-react";
import styles from "./Header.module.css";

interface HeaderProps {
	title: string;
	onMenuClick?: () => void;
	collapsed: boolean;
	userRole?: "MEMBER" | "COORDINATOR" | "SOCIAL_MEDIA" | "ADMIN" | "BOARD";
	userName?: string;
}

export default function Header({
	title,
	onMenuClick,
	collapsed,
	userRole = "ADMIN",
	userName = "Maciej Kowalski",
}: HeaderProps) {
	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase();
	};

	const getRoleLabel = (role: string) => {
		switch (role) {
			case "ADMIN":
				return "Główny administrator";
			case "BOARD":
				return "Zarząd";
			case "COORDINATOR":
				return "Koordynator";
			case "SOCIAL_MEDIA":
				return "Social Media";
			default:
				return "Członek SM";
		}
	};

	return (
		<div className={styles.topbar}>
			<button
				className={styles.topbar__menu}
				onClick={onMenuClick}
				aria-label="Menu"
			>
				{collapsed ? <PanelLeftOpen size={22} /> : <PanelLeftClose size={22} />}
			</button>

			<h1 className={styles.topbar__title}>{title}</h1>

			<div className={styles.topbar__search}>
				<Search size={16} />

				<input
					type="text"
					placeholder="Szukaj członków, projektów, poradników..."
				/>
			</div>

			<div className={styles.topbar__actions}>
				<button className={styles.iconBtn}>
					<MessageCircle size={18} />
					<span className={styles.iconBtn__badge}>5</span>
				</button>

				<button className={styles.iconBtn}>
					<Bell size={18} />
					<span className={styles.iconBtn__badge}>12</span>
				</button>

				{/* <div className={styles.user}>
					<div className={styles.avatar}>{getInitials(userName)}</div>

					<div className={styles.userInfo}>
						<span className={styles.userName}>{userName}</span>

						<span className={styles.userRole}>{getRoleLabel(userRole)}</span>
					</div>
				</div> */}
			</div>
		</div>
	);
}
