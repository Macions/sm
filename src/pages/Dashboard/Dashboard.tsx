import { useState, useEffect, useCallback, useMemo } from "react";
import { safeNavigate } from "@/utils/safeNavigation";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { logger } from "@/utils/logger";
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
	Wallet,
	CreditCard,
	Gift,
} from "lucide-react";
import styles from "./Dashboard.module.css";
function getMonthName(month: number): string {
	const months = [
		"Styczeń",
		"Luty",
		"Marzec",
		"Kwiecień",
		"Maj",
		"Czerwiec",
		"Lipiec",
		"Sierpień",
		"Wrzesień",
		"Październik",
		"Listopad",
		"Grudzień",
	];
	return months[month - 1] || month.toString();
}
type Birthday = {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	birthday: string | null;
};
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

type Stat = {
	id: string;
	label: string;
	value: string | React.ReactNode; // 👈 Pozwala na ReactNode
	subtext?: string;
	icon: React.ReactNode;
	color: string;
	bgColor: string;
};

type DashboardStats = {
	members: number;
	projects: number;
	attendance: string;
	announcements: number;
	newGuides: number;
};
type ContributionStats = {
	hasContributions?: boolean;
	currentMonth: {
		status: "paid" | "pending";
		amount: number;
		monthName: string;
		month: number;
		year: number;
		monthsPaid: number;
	};
	summary: {
		overdueMonths: number;
		totalPaid: number;
		totalContributions: number;
	};
	history: Array<{
		month: number;
		year: number;
		monthName: string;
		status: string;
		amount: number;
		monthsPaid: number;
	}>;
};

const PILLAR_MAP: Record<string, string> = {
	Konferencyjny: "Filar Konferencyjny",
	Projektowy: "Filar Projektowy",
	Rzeczniczy: "Filar Rzeczniczy",
	Symulacyjny: "Filar Symulacyjny",
};
const QUICK_ACTIONS: QuickAction[] = [
	{
		id: "projects",
		label: "Projekty",
		icon: <FolderKanban size={18} />,
		color: "#4A6FE8",
		link: "/projects",
		roles: ["member", "board"],
	},
	{
		id: "add-project",
		label: "Dodaj projekt",
		icon: <Plus size={18} />,
		color: "#4A6FE8",
		link: "/projects",
		roles: ["admin", "coordinator", "board"],
	},
	{
		id: "leave-request",
		label: "Zgłoś urlop",
		icon: <CalendarPlus size={18} />,
		color: "#2ECC71",
		link: "/leave/",
		roles: ["admin", "coordinator", "member", "board"],
	},
	{
		id: "search-member",
		label: "Wyszukaj członka",
		icon: <Search size={18} />,
		color: "#F5A623",
		link: "/members",
		roles: ["admin", "coordinator", "member", "board"],
	},
	{
		id: "browse-guides",
		label: "Przeglądaj poradniki",
		icon: <BookMarked size={18} />,
		color: "#E84AA9",
		link: "/guides",
		roles: ["admin", "coordinator", "member", "board"],
	},
];

const STATUS_MAP: Record<string, string> = {
	active: "Aktywny",
	trial: "Okres próbny",
	mentor: "Mentor",
	vacation: "Urlop",
};

const ROLE_MAP: Record<string, string> = {
	admin: "Administrator",
	board: "Zarząd",
	coordinator: "Koordynator",
	member: "Członek",
	mentor: "Mentor",
};

const STATUS_COLOR_MAP: Record<string, string> = {
	Aktywny: "#2ECC71",
	Urlop: "#F5A623",
	"Okres próbny": "#ff8989",
};

const transformPillars = (pillars: unknown): string => {
	if (!pillars) return "";

	const pillarList =
		typeof pillars === "string"
			? pillars.split(",")
			: Array.isArray(pillars)
				? pillars
				: [];

	return pillarList
		.filter((p): p is string => typeof p === "string")
		.map((p) => p.trim())
		.filter(Boolean)
		.map((p) => PILLAR_MAP[p] || p)
		.join(", ");
};
export default function Dashboard() {
	const navigate = useNavigate();
	const { user, loading: userLoading } = useUser();

	const displayName = user?.firstName || "Użytkowniku";

	const [checkingOnboarding, setCheckingOnboarding] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [contributionStats, setContributionStats] =
		useState<ContributionStats | null>(null);

	const [loadingStats, setLoadingStats] = useState(true);
	const [loadingNotifs, setLoadingNotifs] = useState(true);
	const [loadingContributions, setLoadingContributions] = useState(true);
	const [birthdays, setBirthdays] = useState<Birthday[]>([]);
	const [loadingBirthdays, setLoadingBirthdays] = useState(true);
	useEffect(() => {
		const checkOnboarding = async () => {
			try {
				const cachedStatus = localStorage.getItem("onboardingCompleted");
				const cachedData = localStorage.getItem("onboardingData");

				if (cachedStatus === "true" && cachedData) {
					logger.debug("✅ [Dashboard] Onboarding ukończony (z cache)");
					setCheckingOnboarding(false);
					return;
				}

				const token = localStorage.getItem("accessToken");
				if (!token) {
					setCheckingOnboarding(false);
					return;
				}

				logger.debug("🔄 [Dashboard] Sprawdzam onboarding w API...");
				const response = await fetch("/api/auth/onboarding-status", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (response.ok) {
					const data = await response.json();
					const completed = data.completed === true;

					localStorage.setItem(
						"onboardingCompleted",
						completed ? "true" : "false",
					);

					if (completed && data.data) {
						localStorage.setItem("onboardingData", JSON.stringify(data.data));
					}

					logger.debug(`📋 [Dashboard] Onboarding status: ${completed}`);

					if (!completed) {
						logger.debug("🔄 [Dashboard] Przekierowanie do onboardingu");

						window.location.href = "/onboarding";
						return;
					}
				} else {
					logger.warn(
						"⚠️ [Dashboard] Nie udało się sprawdzić statusu onboardingu",
					);
				}
			} catch (error) {
				logger.error("❌ [Dashboard] Błąd sprawdzania onboardingu:", error);
			} finally {
				setCheckingOnboarding(false);
			}
		};

		checkOnboarding();
	}, []);
	useEffect(() => {
		const controller = new AbortController();
		const fetchBirthdays = async () => {
			try {
				setLoadingBirthdays(true);
				const token = localStorage.getItem("accessToken");

				const res = await fetch("/api/dashboard/birthdays", {
					signal: controller.signal,
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (!res.ok) throw new Error("Nie udało się pobrać urodzin");
				const data = await res.json();
				setBirthdays(data);
			} catch (err) {
				if (err instanceof Error && err.name === "AbortError") return;
				console.error("❌ [Dashboard] Błąd pobierania urodzin:", err);
			} finally {
				setLoadingBirthdays(false);
			}
		};
		const fetchStats = async () => {
			try {
				setLoadingStats(true);
				const token = localStorage.getItem("accessToken");

				const res = await fetch("/api/dashboard/stats", {
					signal: controller.signal,
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (!res.ok) throw new Error("Nie udało się pobrać statystyk");
				const data = await res.json();

				setStats(data);
			} catch (err) {
				if (err instanceof Error && err.name === "AbortError") return;
				console.error("❌ [Dashboard] Błąd statystyk:", err);
				setError("Nie udało się pobrać statystyk");
			} finally {
				setLoadingStats(false);
			}
		};

		const fetchContributions = async () => {
			try {
				setLoadingContributions(true);
				const token = localStorage.getItem("accessToken");

				const res = await fetch("/api/dashboard/contributions", {
					signal: controller.signal,
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (!res.ok) throw new Error("Nie udało się pobrać statystyk składek");
				const data = await res.json();

				setContributionStats(data);
			} catch (err) {
				if (err instanceof Error && err.name === "AbortError") return;
				console.error("❌ [Dashboard] Błąd składek:", err);
			} finally {
				setLoadingContributions(false);
			}
		};

		const fetchNotifs = async () => {
			try {
				setLoadingNotifs(true);
				const token = localStorage.getItem("accessToken");

				const res = await fetch("/api/dashboard/notifications?limit=4", {
					signal: controller.signal,
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (!res.ok) throw new Error("Nie udało się pobrać powiadomień");
				const data = await res.json();

				setNotifications(data);
			} catch (err) {
				if (err instanceof Error && err.name === "AbortError") return;
				console.error("❌ [Dashboard] Błąd powiadomień:", err);
				setError("Nie udało się pobrać powiadomień");
			} finally {
				setLoadingNotifs(false);
			}
		};

		Promise.all([
			fetchStats(),
			fetchContributions(),
			fetchNotifs(),
			fetchBirthdays(),
		]);

		return () => {
			controller.abort();
		};
	}, []);
	const getGreeting = useCallback(() => {
		const hour = new Date().getHours();
		if (hour >= 4 && hour < 21) return "Dzień dobry";
		return "Dobry wieczór";
	}, []);
	const isCurrentUserBirthday = useCallback((): boolean => {
		if (!user?.id || !birthdays.length) return false;
		const currentUserId =
			typeof user.id === "string" ? parseInt(user.id) : user.id;
		return birthdays.some((b) => b.id === currentUserId);
	}, [user?.id, birthdays]);
	const getMembershipDuration = useCallback(
		(joinDate: string | null | undefined, isTrial: boolean): string | null => {
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

			// Funkcja pomocnicza do odmiany lat
			const getYearsText = (count: number): string => {
				if (count === 1) return "rok";
				if (count >= 2 && count <= 4) return "lata";
				return "lat";
			};

			// Funkcja pomocnicza do odmiany miesięcy
			const getMonthsText = (count: number): string => {
				if (count === 1) return "miesiąc";
				if (count >= 2 && count <= 4) return "miesiące";
				return "miesięcy";
			};

			// Funkcja pomocnicza do odmiany dni
			const getDaysText = (count: number): string => {
				if (count === 1) return "dzień";
				if (count >= 2 && count <= 4) return "dni";
				return "dni";
			};

			if (years > 0) {
				const yearText = getYearsText(years);
				if (months > 0) {
					const monthText = getMonthsText(months);
					return `${years} ${yearText}, ${months} ${monthText}`;
				}
				return `${years} ${yearText}`;
			}
			if (months > 0) {
				const monthText = getMonthsText(months);
				return `${months} ${monthText}`;
			}
			if (days > 0) {
				const dayText = getDaysText(days);
				return `${days} ${dayText}`;
			}
			return "od dzisiaj!";
		},
		[],
	);

	const getNotificationIcon = useCallback((type: string) => {
		switch (type) {
			case "success":
				return <CheckCircle size={16} color="#2ECC71" />;
			case "warning":
				return <AlertCircle size={16} color="#F5A623" />;
			default:
				return <Bell size={16} color="#4A6FE8" />;
		}
	}, []);

	const roleText = useMemo(
		() => ROLE_MAP[user?.role?.toLowerCase() || ""] || user?.role || "—",
		[user?.role],
	);

	const statusText = useMemo(
		() => STATUS_MAP[user?.status?.toLowerCase() || ""] || user?.status || "—",
		[user?.status],
	);

	const statusColor = useMemo(
		() => STATUS_COLOR_MAP[statusText] || "#6B7280",
		[statusText],
	);

	const membershipDuration = useMemo(
		() => getMembershipDuration(user?.joinDate || null, user?.isTrial || false),
		[user?.joinDate, user?.isTrial, getMembershipDuration],
	);

	const statsData = useMemo(() => {
		if (!stats) return [];

		const baseStats: Stat[] = [
			{
				id: "members",
				label: "Członkowie SM",
				value: stats.members.toString(),
				icon: <Users size={24} />,
				color: "#4A6FE8",
				bgColor: "#EFEBFD",
			},

			...(contributionStats
				? [
						{
							id: "contribution",
							label: (() => {
								const { month, monthName, year, monthsPaid } =
									contributionStats.currentMonth;
								if (monthsPaid > 1) {
									const months = [];
									for (let i = 0; i < monthsPaid; i++) {
										const m = ((month - i + 11) % 12) + 1;
										months.push(m);
									}
									const monthNames = months.map((m) => getMonthName(m));
									return `Składka ${monthNames.reverse().join("-")} ${year}`;
								}
								return `Składka ${monthName} ${year}`;
							})(),
							value:
								contributionStats.hasContributions === false
									? ""
									: `${contributionStats.currentMonth.amount.toFixed(2)} zł`,
							subtext:
								contributionStats.hasContributions === false
									? "Nie dotyczy"
									: contributionStats.currentMonth.status === "paid"
										? `Opłacona (${contributionStats.currentMonth.monthsPaid} mies.)`
										: contributionStats.summary.overdueMonths > 0
											? `${contributionStats.summary.overdueMonths} mies. zaległości`
											: "Nieopłacona",
							icon:
								contributionStats.hasContributions === false ? (
									<AlertCircle size={24} />
								) : contributionStats.currentMonth.status === "paid" ? (
									<CreditCard size={24} />
								) : (
									<Wallet size={24} />
								),
							color:
								contributionStats.hasContributions === false
									? "#6B7280"
									: contributionStats.currentMonth.status === "paid"
										? "#2ECC71"
										: "#F5A623",
							bgColor:
								contributionStats.hasContributions === false
									? "#F3F4F6"
									: contributionStats.currentMonth.status === "paid"
										? "#ECFDF5"
										: "#FEF9E7",
						},
					]
				: []),
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
				subtext: "(na podstawie systemu frekwencji)",
				value: stats.attendance,
				icon: <CalendarCheck size={24} />,
				color: "#10B981",
				bgColor: "#ECFDF5",
			},
		];

		// Dodaj kafelek poradników tylko jeśli są nowe (newGuides > 0)
		if (stats.newGuides > 0) {
			baseStats.push({
				id: "guides",
				label: "Nowe poradniki",
				value: stats.newGuides.toString(),
				subtext: "aktualizacje",
				icon: <BookOpen size={24} />,
				color: "#17C3B2",
				bgColor: "#F0FDFA",
			});
		}

		if (membershipDuration) {
			baseStats.splice(3, 0, {
				id: "membership",
				label: "Jesteś z nami",
				value: membershipDuration,
				icon: <CalendarCheck size={24} />,
				color: "#4A6FE8",
				bgColor: "#EFEBFD",
			});
		}
		// Dodaj kafelek urodzin
		// Dodaj kafelek urodzin
		// Dodaj kafelek urodzin
		if (birthdays.length > 0) {
			const names = birthdays.map((b) => `${b.first_name} ${b.last_name}`);
			const currentUserHasBirthday = isCurrentUserBirthday();

			let displayText: React.ReactNode;

			if (currentUserHasBirthday) {
				// 🎂 OSOBISTE ŻYCZENIE DLA ZALOGOWANEGO UŻYTKOWNIKA
				displayText = (
					<>
						<strong>Życzymy Ci dużej ilości zadań!</strong>
						<br />
					</>
				);
			} else if (names.length === 1) {
				displayText = names[0];
			} else if (names.length === 2) {
				displayText = (
					<>
						{names[0]} <span style={{ opacity: 0.4 }}>i</span> {names[1]}
					</>
				);
			} else {
				const lastTwo = names.slice(-2);
				const rest = names.slice(0, -2);
				displayText = (
					<>
						{rest.join(", ")}
						{rest.length > 0 && ", "}
						{lastTwo[0]} <span style={{ opacity: 0.6 }}>i</span> {lastTwo[1]}
					</>
				);
			}

			baseStats.push({
				id: "birthdays",
				label: currentUserHasBirthday
					? "Wszystkiego najlepszego!"
					: names.length === 1
						? "Dzisiaj urodziny obchodzi"
						: "Dzisiaj urodziny obchodzą",
				value: displayText,
				icon: <Gift size={24} />,
				color: currentUserHasBirthday ? "#FF6B6B" : "#E84AA9",
				bgColor: currentUserHasBirthday ? "#FFF0F0" : "#FDF2F8",
			});
		}
		return baseStats;
	}, [stats, membershipDuration, contributionStats, birthdays]);
	const handleQuickAction = useCallback(
		(action: QuickAction) => {
			if (action.link) {
				safeNavigate(action.link, navigate);
			} else {
				logger.debug(`Akcja: ${action.label}`);
			}
		},
		[navigate],
	);

	if (checkingOnboarding) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
				}}
			>
				<div
					style={{
						width: "48px",
						height: "48px",
						border: "4px solid #e5e7eb",
						borderTopColor: "#4A6FE8",
						borderRadius: "50%",
						animation: "spin 0.8s linear infinite",
					}}
				/>
			</div>
		);
	}

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

	return (
		<>
			<div className={styles.welcomeCard}>
				<div className={styles.welcomeCard__content}>
					<img
						src="/assets/images/sm-logo.png"
						alt="Siła Młodych logo"
						className={styles.welcomeCard__logo}
					/>
					<div className={styles.welcomeCard__text}>
						<h1 className={styles.welcomeCard__title}>
							{getGreeting()}, {displayName}!
						</h1>
						<div className={styles.welcomeCard__info}>
							<span className={styles.welcomeCard__role}>{roleText}</span>
							<span className={styles.welcomeCard__divider}>•</span>
							<span className={styles.welcomeCard__team}>
								{userLoading ? (
									<span
										className={styles.skeleton}
										style={{ width: 60, display: "inline-block" }}
									>
										&nbsp;
									</span>
								) : (
									(() => {
										if (
											user?.role?.toLowerCase() === "admin" ||
											user?.role === "Prezes"
										) {
											return user?.team || "—";
										}

										if (user?.pillars) {
											return transformPillars(user.pillars);
										}

										return user?.team || "—";
									})()
								)}
							</span>
							<span className={styles.welcomeCard__divider}>•</span>
							<span
								className={styles.welcomeCard__status}
								style={{ color: statusColor }}
							>
								<span
									className={styles.welcomeCard__statusDot}
									style={{ background: statusColor }}
								/>
								{statusText}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div className={styles.stats}>
				{loadingStats || loadingContributions || loadingBirthdays ? (
					<>
						{[1, 2, 3, 4, 5].map((i) => (
							<div key={i} className={styles.statCard}>
								<div
									className={`${styles.skeleton} ${styles.skeletonCircle}`}
									style={{ width: 48, height: 48 }}
								/>
								<div className={styles.statCard__content}>
									<div
										className={styles.skeleton}
										style={{ width: 80, height: 14, marginBottom: 6 }}
									/>
									<div
										className={styles.skeleton}
										style={{ width: 60, height: 24 }}
									/>
								</div>
							</div>
						))}
					</>
				) : (
					statsData.map((stat) => (
						<div key={stat.id} className={styles.statCard}>
							<div
								className={styles.statCard__icon}
								style={{ background: stat.bgColor, color: stat.color }}
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
					))
				)}
			</div>

			<div className={styles.bottomSection}>
				<div className={styles.notifications}>
					<h2 className={styles.sectionTitle}>
						<Bell size={20} />
						Powiadomienia
					</h2>
					<div className={styles.notifications__list}>
						{loadingNotifs ? (
							<>
								{[1, 2, 3].map((i) => (
									<div key={i} className={styles.notification}>
										<div
											className={`${styles.skeleton} ${styles.skeletonCircle}`}
											style={{ width: 32, height: 32 }}
										/>
										<div className={styles.notification__content}>
											<div
												className={styles.skeleton}
												style={{ width: "80%", height: 14 }}
											/>
											<div
												className={styles.skeleton}
												style={{ width: "40%", height: 12 }}
											/>
										</div>
									</div>
								))}
							</>
						) : notifications.length === 0 ? (
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

				<div className={styles.quickActions}>
					<h2 className={styles.sectionTitle}>Szybkie akcje</h2>
					<div className={styles.quickActions__grid}>
						{QUICK_ACTIONS.filter((action) => {
							if (!user?.role || !action.roles) return true;
							return action.roles.includes(user.role);
						}).map((action) => (
							<button
								key={action.id}
								className={styles.quickAction}
								onClick={() => handleQuickAction(action)}
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
