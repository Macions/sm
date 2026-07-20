import { useState, useEffect } from "react";
import {
	Users,
	FolderKanban,
	CalendarCheck,
	Megaphone,
	BookOpen,
	Plus,
	CalendarPlus,
	Search,
	BookMarked,
	Bell,
	CheckCircle,
	AlertCircle,
} from "lucide-react";
import styles from "./Dashboard.module.css";
import logo from "../../assets/images/sm-logo.png";

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

type Notification = {
	id: string;
	message: string;
	type: "success" | "info" | "warning";
	time: string;
};

type QuickAction = {
	id: string;
	label: string;
	icon: React.ReactNode;
	color: string;
	onClick: () => void;
};

type DashboardStats = {
	members: number;
	projects: number;
	attendance: string;
	announcements: number;
	newGuides: number;
};

type User = {
	id: string;
	name: string;
	role: string;
	team: string;
	status: string;
};

// ---------------------------------------------------------------------------
// Komponent
// ---------------------------------------------------------------------------

export default function Dashboard() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [notifications, setNotifications] = useState<Notification[]>([]);

	// ===== POBIERANIE DANYCH Z BACKENDU =====
	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoading(true);
				setError(null);

				// Pobierz dane użytkownika
				const userRes = await fetch("/api/user/profile");
				if (!userRes.ok) throw new Error("Nie udało się pobrać danych użytkownika");
				const userData = await userRes.json();
				setUser(userData);

				// Pobierz statystyki
				const statsRes = await fetch("/api/dashboard/stats");
				if (!statsRes.ok) throw new Error("Nie udało się pobrać statystyk");
				const statsData = await statsRes.json();
				setStats(statsData);

				// Pobierz powiadomienia
				const notifRes = await fetch("/api/notifications/recent?limit=4");
				if (!notifRes.ok) throw new Error("Nie udało się pobrać powiadomień");
				const notifData = await notifRes.json();
				setNotifications(notifData);

			} catch (err) {
				console.error("Błąd ładowania dashboardu:", err);
				setError(err instanceof Error ? err.message : "Wystąpił błąd");
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, []);

	// ===== SZYBKIE AKCJE =====
	const quickActions: QuickAction[] = [
		{
			id: "add-project",
			label: "Dodaj projekt",
			icon: <Plus size={18} />,
			color: "#4A6FE8",
			onClick: () => console.log("Dodaj projekt"),
		},
		{
			id: "leave-request",
			label: "Zgłoś urlop",
			icon: <CalendarPlus size={18} />,
			color: "#2ECC71",
			onClick: () => console.log("Zgłoś urlop"),
		},
		{
			id: "search-member",
			label: "Wyszukaj członka",
			icon: <Search size={18} />,
			color: "#F5A623",
			onClick: () => console.log("Wyszukaj członka"),
		},
		{
			id: "browse-guides",
			label: "Przeglądaj poradniki",
			icon: <BookMarked size={18} />,
			color: "#E84AA9",
			onClick: () => console.log("Przeglądaj poradniki"),
		},
	];

	// ===== FUNKCJE POMOCNICZE =====
	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour >= 4 && hour < 18) return "Dzień dobry";
		return "Dobry wieczór";
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Aktywny":
				return "#2ECC71";
			case "Urlop":
				return "#F5A623";
			case "Okres próbny":
				return "#E84AA9";
			default:
				return "#6B7280";
		}
	};

	const getNotificationIcon = (type: string) => {
		switch (type) {
			case "success":
				return <CheckCircle size={16} color="#2ECC71" />;
			case "warning":
				return <AlertCircle size={16} color="#F5A623" />;
			default:
				return <Bell size={16} color="#4A6FE8" />;
		}
	};

	// ===== ŁADOWANIE =====
	if (loading) {
		return (
			<div className={styles.dashboard}>
				<div className={styles.loading}>
					<div className={styles.loading__spinner}></div>
					<p>Ładowanie dashboardu...</p>
				</div>
			</div>
		);
	}

	// ===== BŁĄD =====
	if (error) {
		return (
			<div className={styles.dashboard}>
				<div className={styles.error}>
					<AlertCircle size={48} color="#EF4444" />
					<h2>Wystąpił błąd</h2>
					<p>{error}</p>
					<button onClick={() => window.location.reload()}>
						Spróbuj ponownie
					</button>
				</div>
			</div>
		);
	}

	// ===== STATYSTYKI =====
	const statsData = stats ? [
		{
			id: "members",
			label: "Członkowie SM",
			value: stats.members.toString(),
			icon: <Users size={24} />,
			color: "#4A6FE8",
			bgColor: "#EFEBFD",
		},
		{
			id: "projects",
			label: "Aktywne projekty",
			value: stats.projects.toString(),
			icon: <FolderKanban size={24} />,
			color: "#2ECC71",
			bgColor: "#ECFDF5",
		},
		{
			id: "attendance",
			label: "Twoja frekwencja",
			value: stats.attendance,
			icon: <CalendarCheck size={24} />,
			color: "#10B981",
			bgColor: "#ECFDF5",
		},
		{
			id: "announcements",
			label: "Ogłoszenia",
			value: stats.announcements.toString(),
			subtext: "nowe",
			icon: <Megaphone size={24} />,
			color: "#E84AA9",
			bgColor: "#FDF2F8",
		},
		{
			id: "guides",
			label: "Nowe poradniki",
			value: stats.newGuides.toString(),
			subtext: "aktualizacje",
			icon: <BookOpen size={24} />,
			color: "#17C3B2",
			bgColor: "#F0FDFA",
		},
	] : [];

	return (
		<>
			{/* Karta powitalna z logo */}
			<div className={styles.welcomeCard}>
				<div className={styles.welcomeCard__content}>
					<img
						src={logo}
						alt="Siła Młodych logo"
						className={styles.welcomeCard__logo}
					/>
					<div className={styles.welcomeCard__text}>
						<h1 className={styles.welcomeCard__title}>
							{getGreeting()}, {user?.name || "Użytkowniku"}!
						</h1>
						<div className={styles.welcomeCard__info}>
							<span className={styles.welcomeCard__role}>{user?.role || "—"}</span>
							<span className={styles.welcomeCard__divider}>•</span>
							<span className={styles.welcomeCard__team}>{user?.team || "—"}</span>
							<span className={styles.welcomeCard__divider}>•</span>
							<span
								className={styles.welcomeCard__status}
								style={{ color: getStatusColor(user?.status || "") }}
							>
								<span
									className={styles.welcomeCard__statusDot}
									style={{ background: getStatusColor(user?.status || "") }}
								/>
								{user?.status || "—"}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Karty statystyk */}
			<div className={styles.stats}>
				{statsData.map((stat) => (
					<div key={stat.id} className={styles.statCard}>
						<div
							className={styles.statCard__icon}
							style={{
								background: stat.bgColor,
								color: stat.color,
							}}
						>
							{stat.icon}
						</div>
						<div className={styles.statCard__content}>
							<p className={styles.statCard__label}>{stat.label}</p>
							<div className={styles.statCard__valueWrapper}>
								<span className={styles.statCard__value}>{stat.value}</span>
								{stat.subtext && (
									<span className={styles.statCard__subtext}>
										{stat.subtext}
									</span>
								)}
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Sekcja powiadomień i szybkich akcji */}
			<div className={styles.bottomSection}>
				{/* Powiadomienia */}
				<div className={styles.notifications}>
					<h2 className={styles.sectionTitle}>
						<Bell size={20} />
						Powiadomienia
					</h2>
					<div className={styles.notifications__list}>
						{notifications.length === 0 ? (
							<div className={styles.notifications__empty}>
								<p>Brak nowych powiadomień</p>
							</div>
						) : (
							notifications.map((notification) => (
								<div key={notification.id} className={styles.notification}>
									<div className={styles.notification__icon}>
										{getNotificationIcon(notification.type)}
									</div>
									<div className={styles.notification__content}>
										<p className={styles.notification__message}>
											{notification.message}
										</p>
										<span className={styles.notification__time}>
											{notification.time}
										</span>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Szybkie akcje */}
				<div className={styles.quickActions}>
					<h2 className={styles.sectionTitle}>Szybkie akcje</h2>
					<div className={styles.quickActions__grid}>
						{quickActions.map((action) => (
							<button
								key={action.id}
								className={styles.quickAction}
								onClick={action.onClick}
							>
								<span
									className={styles.quickAction__icon}
									style={{
										background: `${action.color}15`,
										color: action.color,
									}}
								>
									{action.icon}
								</span>
								<span className={styles.quickAction__label}>
									{action.label}
								</span>
							</button>
						))}
					</div>
				</div>
			</div>
		</>
	);
}