import { logger } from "@/utils/logger";
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
	Menu,
	Users,
	Briefcase,
	GraduationCap,
	Building2,
	Megaphone,
} from "lucide-react";
import styles from "./Header.module.css";

export interface SearchResult {
	id: string;
	type:
	| "member"
	| "project"
	| "guide"
	| "task"
	| "vacancy"
	| "structure"
	| "social";
	title: string;
	subtitle?: string;
	description?: string;
	link: string;
}

interface HeaderProps {
	title: string;
	onMenuClick?: () => void;
	collapsed: boolean;
	hideNotifications?: boolean;
	userRole?: "MEMBER" | "COORDINATOR" | "SOCIAL_MEDIA" | "ADMIN" | "BOARD";
	userName?: string;
	userId?: string;
	onMobileMenuToggle?: () => void;
	isMobileMenuOpen?: boolean;
	onSearch?: (query: string) => void;
	searchQuery?: string;
	isSearching?: boolean;
	searchResults?: any[];
}

type NotificationType = "info" | "success" | "warning" | "error";

interface Notification {
	id: string;
	title: string;
	message: string;
	type: NotificationType;
	read: boolean;
	link?: string;
	createdAt: Date;
	time?: string;
}

export default function Header({
	title,
	onMenuClick,
	collapsed,
	hideNotifications = false,
	onMobileMenuToggle,
	isMobileMenuOpen = false,
	onSearch,
	searchQuery = "",
	isSearching = false,
	searchResults = [],
}: HeaderProps) {
	const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [_loading, setLoading] = useState(false);
	const [visibleCount, setVisibleCount] = useState(15);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
	const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const isFetching = useRef(false);
	const [isSearchFocused, setIsSearchFocused] = useState(false);

	const fetchNotifications = async () => {
		if (isFetching.current) return;

		try {
			isFetching.current = true;
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
			logger.debug("📊 Powiadomienia w Header:", data);

			setNotifications(data);

			const unread = data.filter((n: Notification) => !n.read).length;
			setUnreadCount(unread);
		} catch (error) {
			logger.error("Błąd ładowania powiadomień:", error);
		} finally {
			setLoading(false);
			isFetching.current = false;
		}
	};

	const fetchUnreadCount = async () => {
		if (isFetching.current) return;

		try {
			isFetching.current = true;
			const token = localStorage.getItem("accessToken");
			const response = await fetch(
				"/api/dashboard/notifications/unread-count",
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			if (response.ok) {
				const data = await response.json();
				setUnreadCount(data.count);
			}
		} catch (error) {
			logger.error("Błąd pobierania licznika:", error);
		} finally {
			isFetching.current = false;
		}
	};

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

			setNotifications((prev) =>
				prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
			);

			setUnreadCount((prev) => Math.max(0, prev - 1));
		} catch (error) {
			logger.error("Błąd oznaczania jako przeczytane:", error);
		}
	};

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
			setUnreadCount(0);
		} catch (error) {
			logger.error("Błąd oznaczania wszystkich:", error);
		}
	};

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
			logger.error("Błąd usuwania powiadomienia:", error);
		}
	};

	const filteredNotifications = notifications;
	const displayedNotifications = filteredNotifications.slice(0, visibleCount);
	const hasMore = filteredNotifications.length > visibleCount;

	useEffect(() => {
		fetchNotifications();

		const interval = setInterval(() => {
			fetchUnreadCount();
		}, 30000);

		return () => {
			clearInterval(interval);
			isFetching.current = false;
		};
	}, []);

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
			fetchNotifications();
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
			(window as any).goTo(notification.link);
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

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setLocalSearchQuery(value);

		if (searchTimeout.current) {
			clearTimeout(searchTimeout.current);
		}

		if (value.length >= 2) {
			searchTimeout.current = setTimeout(() => {
				if (onSearch) {
					onSearch(value);
				}
			}, 300);
		} else if (value.length === 0) {
			if (onSearch) {
				onSearch("");
			}
		}
	};

	const handleSearchClear = () => {
		setLocalSearchQuery("");
		if (onSearch) {
			onSearch("");
		}
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	return (
		<div className={styles.topbar}>

			<div className={styles.topbar__left}>
				<button
					className={styles.topbar__menu}
					onClick={onMenuClick}
					aria-label="Zwiń sidebar"
				>
					{collapsed ? (
						<PanelLeftOpen size={22} />
					) : (
						<PanelLeftClose size={22} />
					)}
				</button>

				<button
					className={`${styles.topbar__burger} ${isMobileMenuOpen ? styles.topbar__burgerHidden : ""
						}`}
					onClick={onMobileMenuToggle}
					aria-label="Menu mobilne"
				>
					<Menu size={24} />
				</button>
			</div>

			<h1 className={styles.topbar__title}>{title}</h1>


			<div className={styles.topbar__search}>
				<Search size={16} />
				<input
					ref={inputRef}
					type="text"
					placeholder="Szukaj członków, projektów, poradników... (Ctrl+K)"
					value={localSearchQuery}
					onChange={handleSearchChange}
					onFocus={() => setIsSearchFocused(true)}
					onBlur={() => {
						setTimeout(() => setIsSearchFocused(false), 200);
					}}
				/>
				{isSearching && (
					<div className={styles.searchLoader}>
						<div className={styles.spinner}></div>
					</div>
				)}
				{localSearchQuery && !isSearching && (
					<button
						className={styles.topbar__searchClear}
						onClick={handleSearchClear}
						aria-label="Wyczyść"
					>
						<X size={14} />
					</button>
				)}


				{isSearchFocused && localSearchQuery.length >= 2 && (
					<div className={styles.searchResultsDropdown}>
						{searchResults && searchResults.length > 0 ? (
							<>
								<div className={styles.searchResultsHeader}>
									<span>Znaleziono {searchResults.length} wyników</span>
								</div>
								<div className={styles.searchResultsList}>
									{searchResults.map((result: any) => {
										// ✅ MAPOWANIE TYPÓW NA ŚCIEŻKI
										let correctLink = result.link;

										switch (result.type) {
											case "member":
												correctLink = "/members";
												break;
											case "project":
												correctLink = "/projects";
												break;
											case "guide":
												correctLink = "/guides";
												break;
											case "task":
												correctLink = "/tasks";
												break;
											case "vacancy":
												correctLink = "/vacancies";
												break;
											case "structure":
												correctLink = "/structure";
												break;
											case "social":
												correctLink = "/social";
												break;
											default:
												correctLink = result.link || "#";
										}

										return (
											<a
												key={result.id}
												href={correctLink}
												className={styles.searchResultItem}
												onClick={(e) => {
													e.preventDefault();
													setIsSearchFocused(false);
													handleSearchClear();
													window.location.href = correctLink;
												}}
											>
												<div className={styles.searchResultIcon}>
													{result.type === "member" && <Users size={16} />}
													{result.type === "project" && <Briefcase size={16} />}
													{result.type === "guide" && <GraduationCap size={16} />}
													{result.type === "task" && <CheckCircle size={16} />}
													{result.type === "vacancy" && <Briefcase size={16} />}
													{result.type === "structure" && <Building2 size={16} />}
													{result.type === "social" && <Megaphone size={16} />}
												</div>
												<div className={styles.searchResultContent}>
													<div className={styles.searchResultTitle}>
														{result.title}
													</div>
													<div className={styles.searchResultSubtitle}>
														{result.subtitle}
													</div>
													{result.description && (
														<div className={styles.searchResultDescription}>
															{result.description}
														</div>
													)}
												</div>
												<div className={styles.searchResultType}>
													<span className={styles.searchResultBadge}>
														{result.type === "member" && "Członek"}
														{result.type === "project" && "Projekt"}
														{result.type === "guide" && "Poradnik"}
														{result.type === "task" && "Zadanie"}
														{result.type === "vacancy" && "Wakat"}
														{result.type === "structure" && "Struktura"}
														{result.type === "social" && "Social Media"}
													</span>
												</div>
											</a>
										);
									})}
								</div>
							</>
						) : (
							<div className={styles.searchResultsEmpty}>
								<Search size={24} />
								<span>Brak wyników dla "{localSearchQuery}"</span>
							</div>
						)}
					</div>
				)}
			</div>


			<div className={styles.topbar__actions}>
				{!hideNotifications && (
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
																{notification.time || "przed chwilą"}
															</span>
															{!notification.read && (
																<span
																	className={styles.notification__unreadDot}
																>
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
				)}
			</div>
		</div>
	);
}
