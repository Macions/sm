import { useState } from "react";
import {
	Users,
	FolderKanban,
	Clock,
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
// ⬇️ IMPORT LOGO
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

// ---------------------------------------------------------------------------
// Dane
// ---------------------------------------------------------------------------

const NOTIFICATIONS: Notification[] = [
	{
		id: "1",
		message:
			"Koordynator projektu 'Forum Dyskusyjne Młodych' dodał aktualizację",
		type: "info",
		time: "5 min temu",
	},
	{
		id: "2",
		message: "Twoja prośba urlopowa została zaakceptowana",
		type: "success",
		time: "2 godz. temu",
	},
	{
		id: "3",
		message: "Dodano nowy poradnik: 'Jak skutecznie zarządzać zespołem'",
		type: "info",
		time: "5 godz. temu",
	},
	{
		id: "4",
		message: "Przypomnienie: Spotkanie zarządu w piątek o 18:00",
		type: "warning",
		time: "1 dzień temu",
	},
];

// ---------------------------------------------------------------------------
// Komponent
// ---------------------------------------------------------------------------

export default function Dashboard() {
	// Symulowane dane użytkownika (później z context/auth)
	const user = {
		name: "Maciej",
		role: "Główny administrator",
		team: "Zarząd",
		status: "Aktywny", // "Aktywny" | "Urlop" | "Okres próbny"
	};

	// Statystyki
	const stats = [
		{
			id: "members",
			label: "Członkowie SM",
			value: "124",
			icon: <Users size={24} />,
			color: "#4A6FE8",
			bgColor: "#EFEBFD",
		},
		{
			id: "projects",
			label: "Aktywne projekty",
			value: "18",
			icon: <FolderKanban size={24} />,
			color: "#2ECC71",
			bgColor: "#ECFDF5",
		},
		{
			id: "tasks",
			label: "Twoje zadania",
			value: "5",
			subtext: "oczekujących",
			icon: <Clock size={24} />,
			color: "#F5A623",
			bgColor: "#FFFBEB",
		},
		{
			id: "announcements",
			label: "Ogłoszenia",
			value: "3",
			subtext: "nowe",
			icon: <Megaphone size={24} />,
			color: "#E84AA9",
			bgColor: "#FDF2F8",
		},
		{
			id: "guides",
			label: "Nowe poradniki",
			value: "2",
			subtext: "aktualizacje",
			icon: <BookOpen size={24} />,
			color: "#17C3B2",
			bgColor: "#F0FDFA",
		},
	];

	// Szybkie akcje
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
							Dzień dobry, {user.name}! 👋
						</h1>
						<div className={styles.welcomeCard__info}>
							<span className={styles.welcomeCard__role}>{user.role}</span>
							<span className={styles.welcomeCard__divider}>•</span>
							<span className={styles.welcomeCard__team}>{user.team}</span>
							<span className={styles.welcomeCard__divider}>•</span>
							<span
								className={styles.welcomeCard__status}
								style={{ color: getStatusColor(user.status) }}
							>
								<span
									className={styles.welcomeCard__statusDot}
									style={{ background: getStatusColor(user.status) }}
								/>
								{user.status}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Karty statystyk */}
			<div className={styles.stats}>
				{stats.map((stat) => (
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
						{NOTIFICATIONS.map((notification) => (
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
						))}
					</div>
				</div>

				{/* Szybkie akcje */}
				<div className={styles.quickActions}>
					<h2 className={styles.sectionTitle}>⚡ Szybkie akcje</h2>
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
