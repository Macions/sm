import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Users,
	FolderKanban,
	CalendarCheck,
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
	link?: string;
	roles?: string[];
};

type DashboardStats = {
	members: number;
	projects: number;
	attendance: string;
	announcements: number;
	newGuides: number;
};

type User = {
    id: string | number;
    firstName: string;
    lastName?: string;
    first_name?: string;    // ✅ DODANE
    last_name?: string;     // ✅ DODANE
    role: string;
    team: string;
    status: string;
    username?: string;
    email?: string;
    joinDate?: string;
    isTrial?: boolean;
    createdAt?: string;
};

// ---------------------------------------------------------------------------
// Komponent
// ---------------------------------------------------------------------------

export default function Dashboard() {
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [notifications, setNotifications] = useState<Notification[]>([]);

	// ===== POBIERANIE DANYCH Z BACKENDU =====
	// ===== POBIERANIE DANYCH Z BACKENDU =====
	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoading(true);
				setError(null);

				// Pobierz token
				const token = localStorage.getItem("accessToken");
				console.log("🔑 Token:", token ? "Jest" : "Brak");

				// Pobierz dane użytkownika
				const userRes = await fetch("/api/profile", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});
				if (!userRes.ok) {
					console.error("❌ Błąd profile:", userRes.status, userRes.statusText);
					throw new Error("Nie udało się pobrać danych użytkownika");
				}
				const userData = await userRes.json();
				console.log("📊 Profil z API:", userData);

				// ✅ PRAWIDŁOWE MAPOWANIE - używamy pól z API
				setUser({
					id: userData.id,
					firstName: userData.first_name || "Użytkowniku", // ✅ first_name z API
					lastName: userData.last_name || "",
					first_name: userData.first_name,
					last_name: userData.last_name,
					role: userData.role || "member",
					team: userData.team || "—", // ✅ team z API
					status: userData.status || "active", // ✅ Jeśli API zwraca status
					username: userData.username,
					email: userData.email,
					// ✅ Jeśli nie masz joinDate w API, użyj created_at lub dzisiejszej daty
					joinDate:
						userData.joinDate ||
						userData.created_at ||
						new Date().toISOString(),
					isTrial: userData.isTrial || false,
					createdAt: userData.created_at,
				});

				// Pobierz statystyki
				const statsRes = await fetch("/api/dashboard/stats", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});
				if (!statsRes.ok) {
					console.error("❌ Błąd stats:", statsRes.status, statsRes.statusText);
					throw new Error("Nie udało się pobrać statystyk");
				}
				const statsData = await statsRes.json();
				setStats(statsData);

				// Pobierz powiadomienia
				const notifRes = await fetch("/api/dashboard/notifications?limit=4", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});
				if (!notifRes.ok) {
					console.error(
						"❌ Błąd notifications:",
						notifRes.status,
						notifRes.statusText,
					);
					throw new Error("Nie udało się pobrać powiadomień");
				}
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

	const quickActions: QuickAction[] = [
		{
			id: "projects",
			label: "Projekty",
			icon: <FolderKanban size={18} />,
			color: "#4A6FE8",
			link: "/projects",
			roles: ["member"],
		},
		{
			id: "add-project",
			label: "Dodaj projekt",
			icon: <Plus size={18} />,
			color: "#4A6FE8",
			link: "/projects",
			roles: ["admin", "coordinator"],
		},
		{
			id: "leave-request",
			label: "Zgłoś urlop",
			icon: <CalendarPlus size={18} />,
			color: "#2ECC71",
			link: "/leave/",
			roles: ["admin", "coordinator", "member"],
		},
		{
			id: "search-member",
			label: "Wyszukaj członka",
			icon: <Search size={18} />,
			color: "#F5A623",
			link: "/members",
			roles: ["admin", "coordinator", "member"],
		},
		{
			id: "browse-guides",
			label: "Przeglądaj poradniki",
			icon: <BookMarked size={18} />,
			color: "#E84AA9",
			link: "/guides",
			roles: ["admin", "coordinator", "member"],
		},
	];

	// ===== FUNKCJE POMOCNICZE =====
	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour >= 4 && hour < 21) return "Dzień dobry";
		return "Dobry wieczór";
	};
	// ===== OBLICZANIE STAŻU =====
	const getMembershipDuration = (
		joinDate: string | null | undefined,
		isTrial: boolean,
	): string | null => {
		if (!joinDate || isTrial) return null;

		const start = new Date(joinDate);
		const now = new Date();

		let years = now.getFullYear() - start.getFullYear();
		let months = now.getMonth() - start.getMonth();

		if (months < 0) {
			years--;
			months += 12;
		}

		const days = Math.floor(
			(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
		);

		if (years > 0) {
			const yearText = years === 1 ? "rok" : years < 5 ? "lata" : "lat";
			if (months > 0) {
				const monthText = months === 1 ? "miesiąc" : "miesięcy";
				return `${years} ${yearText}, ${months} ${monthText}`;
			}
			return `${years} ${yearText}`;
		}
		if (months > 0) {
			const monthText = months === 1 ? "miesiąc" : "miesięcy";
			return `${months} ${monthText}`;
		}
		if (days > 0) {
			const dayText = days === 1 ? "dzień" : "dni";
			return `${days} ${dayText}`;
		}
		return "Dziś dołączyłeś! 🎉";
	};

	// ===== TŁUMACZENIE STATUSU =====
	const translateStatus = (status: string): string => {
		const statusMap: Record<string, string> = {
			active: "Aktywny",
			trial: "Okres próbny",
			mentor: "Mentor",
			vacation: "Urlop",
		};
		return statusMap[status?.toLowerCase()] || status || "—";
	};

	const getStatusColor = (status: string) => {
		const translated = translateStatus(status);
		switch (translated) {
			case "Aktywny":
				return "#2ECC71";
			case "Urlop":
				return "#F5A623";
			case "Okres próbny":
				return "#ff8989";
			default:
				return "#6B7280";
		}
	};
	// ===== TŁUMACZENIE ROLI =====
	const translateRole = (role: string): string => {
		const roleMap: Record<string, string> = {
			admin: "Administrator",
			board: "Zarząd",
			coordinator: "Koordynator",
			member: "Członek",
			mentor: "Mentor",
		};
		return roleMap[role?.toLowerCase()] || role || "—";
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
	const membershipDuration = getMembershipDuration(
		user?.joinDate || null,
		user?.isTrial || false,
	);

	// ===== STATYSTYKI =====
	// ===== STATYSTYKI =====
	const statsData = stats
		? [
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
				// ===== ZAMIAST OGŁOSZEŃ - "JESTEŚ Z NAMI" =====
				...(membershipDuration
					? [
							{
								id: "membership",
								label: "Jesteś z nami",
								value: membershipDuration,
								icon: <CalendarCheck size={24} />,
								color: "#4A6FE8",
								bgColor: "#EFEBFD",
							},
						]
					: []),
				{
					id: "guides",
					label: "Nowe poradniki",
					value: stats.newGuides.toString(),
					subtext: "aktualizacje",
					icon: <BookOpen size={24} />,
					color: "#17C3B2",
					bgColor: "#F0FDFA",
				},
			]
		: [];

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
							{getGreeting()}, {user?.firstName || "Użytkowniku"}!
						</h1>
						<div className={styles.welcomeCard__info}>
							<span className={styles.welcomeCard__role}>
								{translateRole(user?.role || "—")}{" "}
							</span>
							<span className={styles.welcomeCard__divider}>•</span>
							<span className={styles.welcomeCard__team}>
								{user?.team || "—"}
							</span>
							<span className={styles.welcomeCard__divider}>•</span>
							<span
								className={styles.welcomeCard__status}
								style={{ color: getStatusColor(user?.status || "") }}
							>
								<span
									className={styles.welcomeCard__statusDot}
									style={{ background: getStatusColor(user?.status || "") }}
								/>
								{translateStatus(user?.status || "—")}
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
						{quickActions
							.filter((action) => {
								if (!user?.role || !action.roles) return true;
								return action.roles.includes(user.role);
							})
							.map((action) => (
								<button
									key={action.id}
									className={styles.quickAction}
									onClick={() => {
										if (action.link) {
											navigate(action.link);
										} else {
											console.log(`Akcja: ${action.label}`);
										}
									}}
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
