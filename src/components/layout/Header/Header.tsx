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

interface Notification {
	id: string;
	title: string;
	message: string;
	type: NotificationType;
	read: boolean;
	link?: string;
	createdAt: Date;
}

// ---------------------------------------------------------------------------
// KOMPONENT
// ---------------------------------------------------------------------------

export default function Header({
	title,
	onMenuClick,
	collapsed,
	userRole = "MEMBER",
	userId = "1",
}: HeaderProps) {
	const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(false);
	const [visibleCount, setVisibleCount] = useState(15);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// ===== POBIERANIE POWIADOMIEŃ Z BACKENDU =====
	const fetchNotifications = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("accessToken");

			const response = await fetch("/api/dashboard/notifications?limit=20", {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Błąd pobierania powiadomień");
			}

			const data = await response.json();
			setNotifications(data);
		} catch (error) {
			console.error("Błąd ładowania powiadomień:", error);
		} finally {
			setLoading(false);
		}
	};

	// ===== OZNACZANIE JAKO PRZECZYTANE =====
	const markAsRead = async (id: string) => {
		try {
			const token = localStorage.getItem("accessToken");

			await fetch(`/api/dashboard/notifications/${id}/read`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			// Aktualizuj lokalny stan
			setNotifications((prev) =>
				prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
			);
		} catch (error) {
			console.error("Błąd oznaczania jako przeczytane:", error);
		}
	};

	// ===== OZNACZANIE WSZYSTKICH JAKO PRZECZYTANE =====
	const markAllAsRead = async () => {
		try {
			const token = localStorage.getItem("accessToken");

			await fetch("/api/dashboard/notifications/read-all", {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
		} catch (error) {
			console.error("Błąd oznaczania wszystkich:", error);
		}
	};

	// ===== USUWANIE POWIADOMIENIA =====
	const deleteNotification = async (id: string) => {
		try {
			const token = localStorage.getItem("accessToken");

			await fetch(`/api/dashboard/notifications/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			setNotifications((prev) => prev.filter((n) => n.id !== id));
		} catch (error) {
			console.error("Błąd usuwania powiadomienia:", error);
		}
	};

	// ===== ŁADOWANIE PRZY STARCIE =====
	useEffect(() => {
		fetchNotifications();
	}, []);

	// ===== RESZTA KODU (formatTime, filtrowanie, itd.) =====
	// ===== RESZTA KODU (formatTime, filtrowanie, itd.) =====
	const formatTime = (createdAt: Date | string | undefined): string => {
		if (!createdAt) return "przed chwilą";

		const date =
			typeof createdAt === "string" ? new Date(createdAt) : createdAt;

		if (isNaN(date.getTime())) return "przed chwilą";

		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHour = Math.floor(diffMin / 60);
		const diffDay = Math.floor(diffHour / 24);

		if (diffSec < 60) return "przed chwilą";
		if (diffMin < 60) return `${diffMin} min temu`;
		if (diffHour < 24) return `${diffHour} godz. temu`;
		if (diffDay === 1) return "1 dzień temu";
		if (diffDay < 7) return `${diffDay} dni temu`;
		if (diffDay < 30) {
			const weeks = Math.floor(diffDay / 7);
			return `${weeks} ${weeks === 1 ? "tydzień" : "tygodnie"} temu`;
		}
		const months = Math.floor(diffDay / 30);
		return `${months} ${months === 1 ? "miesiąc" : "miesięcy"} temu`;
	};

	const filteredNotifications = notifications;
	const unreadCount = filteredNotifications.filter((n) => !n.read).length;
	const displayedNotifications = filteredNotifications.slice(0, visibleCount);
	const hasMore = filteredNotifications.length > visibleCount;

	// Zamknij dropdown gdy klikniesz poza nim
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsNotificationsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const toggleNotifications = () => {
		setIsNotificationsOpen(!isNotificationsOpen);
		if (!isNotificationsOpen) {
			fetchNotifications(); // Odśwież przy otwarciu
		}
	};

	const loadMore = () => {
		setVisibleCount((prev) => prev + 15);
	};

	const handleNotificationClick = (notification: Notification) => {
		if (!notification.read) {
			markAsRead(notification.id);
		}
		setIsNotificationsOpen(false);
		if (notification.link) {
			window.location.href = notification.link;
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
													{getTypeIcon(notification.type)}
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
												Pokaż więcej (
												{filteredNotifications.length - visibleCount}{" "}
												pozostałych)
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
