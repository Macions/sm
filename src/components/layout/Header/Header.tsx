import { useState, useRef, useEffect } from "react";
import {
	Search,
	Bell,
	PanelLeftClose,
	PanelLeftOpen,
	X,
	Check,
	Clock,
	CheckCircle,
	AlertCircle,
	ChevronDown,
} from "lucide-react";
import styles from "./Header.module.css";

interface HeaderProps {
	title: string;
	onMenuClick?: () => void;
	collapsed: boolean;
	userRole?: "MEMBER" | "COORDINATOR" | "SOCIAL_MEDIA" | "ADMIN" | "BOARD";
	userName?: string;
	userId?: string;
}

// ---------------------------------------------------------------------------
// TYPY POWIADOMIEŃ
// ---------------------------------------------------------------------------

type NotificationType = "info" | "success" | "warning" | "error";
type NotificationTarget = "all" | "member" | "coordinator" | "admin" | "board" | "social_media";

interface Notification {
	id: string;
	title: string;
	message: string;
	type: NotificationType;
	read: boolean;
	target: NotificationTarget[];
	userId?: string; // Jeśli powiadomienie jest dla konkretnego użytkownika
	link?: string;
	icon?: React.ReactNode;
	createdAt: Date;
}

// ---------------------------------------------------------------------------
// DANE PRZYKŁADOWE - POWIADOMIENIA
// ---------------------------------------------------------------------------

const MOCK_NOTIFICATIONS: Notification[] = [
	{
		id: "1",
		title: "Nowy członek dołączył",
		message: "Anna Nowak dołączyła do Filaru Projektowego",
		type: "success",

		read: false,
		target: ["admin", "coordinator"],
		link: "/members",
		createdAt: new Date(Date.now() - 2 * 60 * 1000),
	},
	{
		id: "2",
		title: "Wniosek urlopowy zatwierdzony",
		message: "Twój wniosek urlopowy został zatwierdzony",
		type: "success",

		read: false,
		target: ["all"],
		userId: "1",
		link: "/leave",
		createdAt: new Date(Date.now() - 15 * 60 * 1000),
	},
	{
		id: "3",
		title: "Nowy poradnik dla koordynatorów",
		message: "Dodano nowy poradnik dotyczący zarządzania zespołem",
		type: "info",

		read: true,
		target: ["coordinator", "admin"],
		link: "/guides",
		createdAt: new Date(Date.now() - 60 * 60 * 1000),
	},
	{
		id: "4",
		title: "Projekt zatwierdzony",
		message: "Projekt 'Letnia Akademia Liderów' został zatwierdzony",
		type: "success",

		read: true,
		target: ["admin", "board"],
		link: "/projects",
		createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
	},
	{
		id: "5",
		title: "Ostrzeżenie o składce",
		message: "Twoja składka członkowska jest zaległa od 30 dni",
		type: "warning",

		read: true,
		target: ["all"],
		userId: "1",
		link: "/profile",
		createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
	},
	{
		id: "6",
		title: "Nowy wniosek urlopowy",
		message: "Maja Kądziela złożyła wniosek urlopowy do akceptacji",
		type: "info",

		read: true,
		target: ["coordinator", "admin"],
		link: "/leave",
		createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
	},
	{
		id: "7",
		title: "Spotkanie zarządu",
		message: "Przypomnienie: spotkanie zarządu jutro o 10:00",
		type: "info",

		read: true,
		target: ["board", "admin"],
		link: "/dashboard",
		createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
	},
	{
		id: "8",
		title: "Nowy projekt w filarze",
		message: "Filar Projektowy rozpoczął nowy projekt 'Innowacje 2026'",
		type: "info",

		read: true,
		target: ["all"],
		link: "/projects",
		createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
	},
	{
		id: "9",
		title: "Zmiana w regulaminie",
		message: "Zaktualizowano regulamin organizacji - zapoznaj się z zmianami",
		type: "info",

		read: true,
		target: ["all"],
		link: "/guides",
		createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000),
	},
	{
		id: "10",
		title: "Nowy członek w zespole",
		message: "Piotr Nowak dołączył do Filaru Rzeczniczego",
		type: "success",

		read: false,
		target: ["coordinator", "admin"],
		link: "/members",
		createdAt: new Date(Date.now() - 125 * 60 * 60 * 1000),
	},
	{
		id: "11",
		title: "Przypomnienie o szkoleniu",
		message: "Jutro o 14:00 odbędzie się szkolenie z zarządzania projektami",
		type: "warning",

		read: true,
		target: ["all"],
		link: "/dashboard",
		createdAt: new Date(Date.now() - 144 * 60 * 60 * 1000),
	},
	{
		id: "12",
		title: "Wniosek urlopowy odrzucony",
		message: "Twój wniosek urlopowy na okres 01.08-07.08 został odrzucony",
		type: "error",

		read: false,
		target: ["all"],
		userId: "1",
		link: "/leave",
		createdAt: new Date(Date.now() - 150 * 60 * 60 * 1000),
	},
	{
		id: "13",
		title: "Nowa wersja statutu",
		message: "Opublikowano nową wersję statutu organizacji do zapoznania",
		type: "info",

		read: true,
		target: ["all"],
		link: "/guides",
		createdAt: new Date(Date.now() - 168 * 60 * 60 * 1000),
	},
	{
		id: "14",
		title: "Głosowanie w sprawie projektu",
		message: "Rozpoczęto głosowanie nad projektem 'Debata Młodych 2026'",
		type: "info",

		read: true,
		target: ["board", "admin"],
		link: "/projects",
		createdAt: new Date(Date.now() - 192 * 60 * 60 * 1000),
	},
	{
		id: "15",
		title: "Nowy koordynator",
		message: "Maja Melerska została nowym koordynatorem Social Media",
		type: "success",

		read: true,
		target: ["admin", "board"],
		link: "/members",
		createdAt: new Date(Date.now() - 196 * 60 * 60 * 1000),
	},
	{
		id: "16",
		title: "Zaległość składkowa",
		message: "Twoja składka członkowska jest zaległa od 45 dni - prosimy o uregulowanie",
		type: "error",

		read: true,
		target: ["all"],
		userId: "1",
		link: "/profile",
		createdAt: new Date(Date.now() - 216 * 60 * 60 * 1000),
	},
	{
		id: "17",
		title: "Webinar o rzecznictwie",
		message: "Zapraszamy na webinar o rzecznictwie w organizacjach pozarządowych",
		type: "info",

		read: false,
		target: ["all"],
		link: "/dashboard",
		createdAt: new Date(Date.now() - 240 * 60 * 60 * 1000),
	},
	{
		id: "18",
		title: "Nowe możliwości współpracy",
		message: "Nawiązano współpracę z Fundacją Rozwoju Młodzieży",
		type: "success",

		read: true,
		target: ["admin", "board"],
		link: "/dashboard",
		createdAt: new Date(Date.now() - 245 * 60 * 60 * 1000),
	},
	{
		id: "19",
		title: "Aktualizacja systemu",
		message: "System zostanie zaktualizowany w nocy z 15 na 16 sierpnia",
		type: "warning",

		read: true,
		target: ["all"],
		createdAt: new Date(Date.now() - 264 * 60 * 60 * 1000),
	},
	{
		id: "20",
		title: "Nowi członkowie w filarach",
		message: "Do organizacji dołączyło 5 nowych członków w tym tygodniu",
		type: "success",

		read: true,
		target: ["admin", "coordinator"],
		link: "/members",
		createdAt: new Date(Date.now() - 288 * 60 * 60 * 1000),
	},
	{
		id: "21",
		title: "Zakończenie projektu",
		message: "Projekt 'Letnia Akademia Liderów' został zakończony sukcesem",
		type: "success",

		read: true,
		target: ["all"],
		link: "/projects",
		createdAt: new Date(Date.now() - 312 * 60 * 60 * 1000),
	},
	{
		id: "22",
		title: "Ankieta satysfakcji",
		message: "Zapraszamy do wypełnienia ankiety satysfakcji z działalności SM",
		type: "info",
		read: true,
		target: ["all"],
		link: "/dashboard",
		createdAt: new Date(Date.now() - 336 * 60 * 60 * 1000),
	},
];

export default function Header({
	title,
	onMenuClick,
	collapsed,
	userRole = "MEMBER",
	userId = "1",
}: HeaderProps) {
	const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
	const [visibleCount, setVisibleCount] = useState(15);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const userRoleMap: Record<string, NotificationTarget> = {
		MEMBER: "member",
		COORDINATOR: "coordinator",
		ADMIN: "admin",
		BOARD: "board",
		SOCIAL_MEDIA: "social_media",
	};

	const currentUserTarget = userRoleMap[userRole] || "member";
	// Funkcja do formatowania czasu
	const formatTime = (createdAt: Date): string => {
		const now = new Date();
		const diffMs = now.getTime() - createdAt.getTime();
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHour = Math.floor(diffMin / 60);
		const diffDay = Math.floor(diffHour / 24);

		if (diffSec < 60) {
			return "przed chwilą";
		} else if (diffMin < 60) {
			return `${diffMin} min temu`;
		} else if (diffHour < 24) {
			return `${diffHour} godz. temu`;
		} else if (diffDay === 1) {
			return "1 dzień temu";
		} else if (diffDay < 7) {
			return `${diffDay} dni temu`;
		} else if (diffDay < 30) {
			const weeks = Math.floor(diffDay / 7);
			return `${weeks} ${weeks === 1 ? "tydzień" : "tygodnie"} temu`;
		} else {
			const months = Math.floor(diffDay / 30);
			return `${months} ${months === 1 ? "miesiąc" : "miesięcy"} temu`;
		}
	};
	// Filtruj powiadomienia - tylko te dla aktualnego użytkownika
	const getFilteredNotifications = () => {
		const now = new Date();
		const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

		return notifications
			.filter((n) => {
				// Sprawdź czy powiadomienie jest dla tego użytkownika
				const isTargeted = n.target.includes("all") || n.target.includes(currentUserTarget);
				const isUserSpecific = !n.userId || n.userId === userId;

				// Usuń przeczytane starsze niż 2 dni
				if (n.read && n.createdAt < twoDaysAgo) {
					return false;
				}

				return isTargeted && isUserSpecific;
			})
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
	};

	const filteredNotifications = getFilteredNotifications();
	const unreadCount = filteredNotifications.filter((n) => !n.read).length;
	const displayedNotifications = filteredNotifications.slice(0, visibleCount);
	const hasMore = filteredNotifications.length > visibleCount;

	// Zamknij dropdown gdy klikniesz poza nim
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsNotificationsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const toggleNotifications = () => {
		setIsNotificationsOpen(!isNotificationsOpen);
	};

	const markAsRead = (id: string) => {
		setNotifications((prev) =>
			prev.map((n) =>
				n.id === id ? { ...n, read: true } : n
			)
		);
	};

	const markAllAsRead = () => {
		setNotifications((prev) =>
			prev.map((n) => {
				// Oznacz jako przeczytane tylko te, które są widoczne dla użytkownika
				const isTargeted = n.target.includes("all") || n.target.includes(currentUserTarget);
				const isUserSpecific = !n.userId || n.userId === userId;
				if (isTargeted && isUserSpecific) {
					return { ...n, read: true };
				}
				return n;
			})
		);
	};

	const deleteNotification = (id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
	};

	const loadMore = () => {
		setVisibleCount((prev) => prev + 15);
	};

	const handleNotificationClick = (notification: Notification) => {
		markAsRead(notification.id);
		setIsNotificationsOpen(false);
		if (notification.link) {
			// Tutaj możesz dodać nawigację
			console.log("Navigate to:", notification.link);
		}
	};

	const getTypeIcon = (type: NotificationType) => {
		switch (type) {
			case "success":
				return <CheckCircle size={16} color="#10b981" />;
			case "warning":
				return <AlertCircle size={16} color="#f59e0b" />;
			case "error":
				return <AlertCircle size={16} color="#ef4444" />;
			default:
				return <Bell size={16} color="#3b82f6" />;
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
				<div className={styles.notificationsWrapper} ref={dropdownRef}>
					<button
						className={styles.iconBtn}
						onClick={toggleNotifications}
						aria-label="Powiadomienia"
					>
						<Bell size={18} />
						{unreadCount > 0 && (
							<span className={styles.iconBtn__badge}>{unreadCount}</span>
						)}
					</button>

					{/* Dropdown powiadomień */}
					{isNotificationsOpen && (
						<div className={styles.notificationsDropdown}>
							<div className={styles.notificationsDropdown__header}>
								<span className={styles.notificationsDropdown__title}>
									Powiadomienia
								</span>
								<div className={styles.notificationsDropdown__actions}>
									{unreadCount > 0 && (
										<button
											className={styles.notificationsDropdown__markAll}
											onClick={markAllAsRead}
										>
											<Check size={14} />
											Oznacz wszystkie
										</button>
									)}
									<button
										className={styles.notificationsDropdown__close}
										onClick={() => setIsNotificationsOpen(false)}
									>
										<X size={16} />
									</button>
								</div>
							</div>

							<div className={styles.notificationsDropdown__list}>
								{filteredNotifications.length === 0 ? (
									<div className={styles.notificationsDropdown__empty}>
										<Bell size={32} />
										<span>Brak powiadomień</span>
									</div>
								) : (
									<>
										{displayedNotifications.map((notification) => (
											<div
												key={notification.id}
												className={`${styles.notification} ${!notification.read ? styles.notification__unread : ""}`}
												onClick={() => handleNotificationClick(notification)}
											>
												<div className={styles.notification__icon}>
													{notification.icon || getTypeIcon(notification.type)}
												</div>
												<div className={styles.notification__content}>
													<div className={styles.notification__header}>
														<span className={styles.notification__title}>
															{notification.title}
														</span>
														<button
															className={styles.notification__delete}
															onClick={(e) => {
																e.stopPropagation();
																deleteNotification(notification.id);
															}}
															aria-label="Usuń powiadomienie"
														>
															<X size={12} />
														</button>
													</div>
													<p className={styles.notification__message}>
														{notification.message}
													</p>
													<div className={styles.notification__footer}>
														<span className={styles.notification__time}>
															<Clock size={12} />
															{formatTime(notification.createdAt)}
														</span>
														{!notification.read && (
															<span className={styles.notification__unreadDot}>
																Nowe
															</span>
														)}
														{notification.link && (
															<span className={styles.notification__linkHint}>
																Kliknij aby przejść
															</span>
														)}
													</div>
												</div>
											</div>
										))}

										{hasMore && (
											<button
												className={styles.notificationsDropdown__loadMore}
												onClick={loadMore}
											>
												<ChevronDown size={16} />
												Pokaż więcej ({filteredNotifications.length - visibleCount} pozostałych)
											</button>
										)}
									</>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}