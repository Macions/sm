import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import styles from "./Calendar.module.css";
import {
	ChevronLeft,
	ChevronRight,
	X,
	Clock,
	User,
	Tag,
	Calendar as CalendarIcon,
	CalendarDays,
	Video,
	Link2,
	AlertCircle,
} from "lucide-react";

type TaskStatus = "todo" | "in_progress" | "review" | "done";
type TaskPriority = "low" | "medium" | "high" | "urgent";

type CalendarTask = {
	id: string;
	title: string;
	description: string;
	status: TaskStatus;
	priority: TaskPriority;
	dueDate: string;
	assignedTo: string;
	assignedToName: string;
	pillar?: string;
	tags: string[];
	source?: "google" | "system";
	type?: "event" | "task";
	hangoutLink?: string | null;
	hasMeeting?: boolean;
	htmlLink?: string;
	absenceReported?: boolean;
	absentees?: Array<{
		userId: number;
		userName: string;
		userEmail: string;
		reportedAt: string;
	}>;
	isOrganizer?: boolean;
};

const STATUS_COLORS: Record<TaskStatus, string> = {
	todo: "#6b7280",
	in_progress: "#3b82f6",
	review: "#f59e0b",
	done: "#22c55e",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
	todo: "Do zrobienia",
	in_progress: "W trakcie",
	review: "Do weryfikacji",
	done: "Zakończone",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
	low: "#22c55e",
	medium: "#f59e0b",
	high: "#f97316",
	urgent: "#ef4444",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
	low: "Niski",
	medium: "Średni",
	high: "Wysoki",
	urgent: "Krytyczny",
};

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Calendar() {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [tasks, setTasks] = useState<CalendarTask[]>([]);
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
	const [loading, setLoading] = useState(true);
	const [googleEvents, setGoogleEvents] = useState<any[]>([]);
	const [isGoogleAuth, setIsGoogleAuth] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [isReportingAbsence, setIsReportingAbsence] = useState(false);

	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth();
	const [viewMode, setViewMode] = useState<"month" | "week">("month");

	useEffect(() => {
		const checkWidth = () => {
			setViewMode(window.innerWidth <= 768 ? "week" : "month");
		};
		checkWidth();
		window.addEventListener("resize", checkWidth);
		return () => window.removeEventListener("resize", checkWidth);
	}, []);
	const checkGoogleAuth = async () => {
		try {
			const token = localStorage.getItem("accessToken");
			if (!token) {
				setIsGoogleAuth(false);
				return;
			}

			const res = await fetch(`${API_URL}/api/calendar/status`, {
				headers: { Authorization: `Bearer ${token}` },
				cache: "no-store",
			});

			if (res.status === 401) {
				console.log(" [Google] Brak autoryzacji - kontynuuję bez Google");
				setIsGoogleAuth(false);
				return;
			}

			if (res.ok) {
				const data = await res.json();
				console.log("[Google] status data:", data);
				setIsGoogleAuth(data.authenticated);
				if (data.authenticated) {
					await fetchGoogleEvents();
				}
			} else {
				console.warn("[Google] status HTTP:", res.status);
				setIsGoogleAuth(false);
			}
		} catch (error) {
			console.log(" [Google] Błąd sprawdzania autoryzacji:", error);
			setIsGoogleAuth(false);
		}
	};

	const fetchGoogleEvents = async () => {
		setIsGoogleLoading(true);
		try {
			const token = localStorage.getItem("accessToken");
			if (!token) {
				setIsGoogleAuth(false);
				return;
			}

			const res = await fetch(`${API_URL}/api/calendar/events`, {
				headers: { Authorization: `Bearer ${token}` },
				cache: "no-store",
			});

			if (res.status === 401) {
				console.log(" [Google] 401 - wyłączam Google");
				setIsGoogleAuth(false);
				return;
			}

			if (res.ok) {
				const data = await res.json();
				console.log(
					"[Google] events:",
					Array.isArray(data) ? data.length : data,
				);
				setGoogleEvents(data);
			} else {
				console.warn("[Google] events HTTP:", res.status);
			}
		} catch (error) {
			console.log(" [Google] Błąd pobierania wydarzeń:", error);
		} finally {
			setIsGoogleLoading(false);
		}
	};

	const fetchTasks = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("accessToken");

			if (!token) {
				console.warn(" [Calendar] Brak tokena - pokazuję puste zadania");
				setTasks([]);
				setLoading(false);
				return;
			}

			const tasksRes = await fetch(`${API_URL}/api/tasks`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (tasksRes.status === 401) {
				console.warn(" [Calendar] 401 - pokazuję puste zadania");
				setTasks([]);
				setLoading(false);
				return;
			}

			if (tasksRes.ok) {
				const data = await tasksRes.json();
				setTasks(data);
			} else {
				setTasks([]);
			}
		} catch (error) {
			console.error(" [Calendar] Błąd:", error);
			setTasks([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		console.log(" [Calendar] Montowanie");
		fetchTasks();
		checkGoogleAuth();
	}, []);

	useEffect(() => {
		if (isGoogleAuth) {
			fetchGoogleEvents();
		}
	}, [isGoogleAuth]);

	const goToPreviousMonth = () => {
		setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
	};

	const goToNextMonth = () => {
		setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
	};
	const goToPreviousWeek = () => {
		const newDate = new Date(currentDate);
		newDate.setDate(newDate.getDate() - 7);
		setCurrentDate(newDate);
	};

	const goToNextWeek = () => {
		const newDate = new Date(currentDate);
		newDate.setDate(newDate.getDate() + 7);
		setCurrentDate(newDate);
	};

	const getWeekDays = () => {
		const days: Date[] = [];
		const start = new Date(currentDate);
		const dayOfWeek = start.getDay();
		const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
		start.setDate(start.getDate() + diff);

		for (let i = 0; i < 7; i++) {
			const d = new Date(start);
			d.setDate(d.getDate() + i);
			days.push(d);
		}
		return days;
	};

	const getWeekLabel = () => {
		const days = getWeekDays();
		const first = days[0];
		const last = days[6];
		const sameMonth = first.getMonth() === last.getMonth();
		const sameYear = first.getFullYear() === last.getFullYear();

		const formatDay = (d: Date) =>
			d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });

		if (sameMonth && sameYear) {
			return `${first.getDate()} - ${last.getDate()} ${last.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })}`;
		}
		return `${formatDay(first)} - ${formatDay(last)} ${last.getFullYear()}`;
	};
	const goToToday = () => {
		setCurrentDate(new Date());
	};

	const getDaysInMonth = (year: number, month: number) => {
		return new Date(year, month + 1, 0).getDate();
	};

	const getFirstDayOfMonth = (year: number, month: number) => {
		return new Date(year, month, 1).getDay();
	};

	const daysInMonth = getDaysInMonth(currentYear, currentMonth);
	const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

	const getEventsForDay = (date: Date) => {
		const dateStr = date.toISOString().split("T")[0];

		const taskEvents = tasks
			.filter((task) => {
				const taskDate = new Date(task.dueDate);
				return taskDate.toISOString().split("T")[0] === dateStr;
			})
			.map((task) => ({
				...task,
				source: "system" as const,
				type: "task" as const,
			}));

		let googleEventsForDay: any[] = [];
		if (isGoogleAuth && googleEvents.length > 0) {
			googleEventsForDay = googleEvents
				.filter((event) => {
					const eventDate = new Date(
						event.start?.dateTime || event.start?.date,
					);
					return eventDate.toISOString().split("T")[0] === dateStr;
				})
				.map((event) => ({
					id: `google-${event.id}`,
					title: event.summary || "Bez tytułu",
					description: event.description || "",
					status: "todo" as TaskStatus,
					priority: "medium" as TaskPriority,
					dueDate: event.start?.dateTime || event.start?.date || "",
					assignedTo: "",
					assignedToName: "Google Calendar",
					source: "google" as const,
					type: "event" as const,
					pillar: undefined,
					tags: [],
					htmlLink: event.htmlLink || "",
					hangoutLink:
						event.hangoutLink ||
						event.conferenceData?.entryPoints?.[0]?.uri ||
						null,
					hasMeeting: !!(
						event.hangoutLink || event.conferenceData?.entryPoints?.length > 0
					),
					absenceReported: event.absenceReported === true,
					absentees: event.absentees || [],
					isOrganizer: event.isOrganizer === true,
				}));
		}

		return [...taskEvents, ...googleEventsForDay];
	};

	const isToday = (day: number) => {
		const today = new Date();
		return (
			day === today.getDate() &&
			currentMonth === today.getMonth() &&
			currentYear === today.getFullYear()
		);
	};

	const isPast = (day: number) => {
		const date = new Date(currentYear, currentMonth, day);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return date < today;
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString("pl-PL", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	const formatTime = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleTimeString("pl-PL", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Funkcja sprawdzająca czy można zgłosić nieobecność (minimum 24h przed)
	const canReportAbsence = (eventDate: string): boolean => {
		if (!eventDate) return false;
		const now = new Date();
		const event = new Date(eventDate);
		if (isNaN(event.getTime())) return false;

		const nowMidnight = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
		);
		const eventMidnight = new Date(
			event.getFullYear(),
			event.getMonth(),
			event.getDate(),
		);
		const diffDays =
			(eventMidnight.getTime() - nowMidnight.getTime()) / (1000 * 60 * 60 * 24);
		return diffDays >= 1;
	};

	// Zgłaszanie nieobecności na wydarzeniu Google Calendar
	const handleReportGoogleAbsence = async (
		eventId: string,
		eventTitle: string,
		eventDate: string,
	) => {
		try {
			setIsReportingAbsence(true);
			const token = localStorage.getItem("accessToken");
			if (!token) {
				toast.error("Musisz być zalogowany");
				return;
			}

			// Usuń prefiks "google-" jeśli jest
			const cleanId = eventId.replace(/^google-/, "");
			const url = `${API_URL}/api/calendar/events/${cleanId}/absence`;
			console.log("[DEBUG] POST", url);

			const res = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					eventTitle,
					eventDate,
				}),
			});

			console.log("[DEBUG] Response status:", res.status);

			if (res.ok) {
				toast.success("Zgłoszono nieobecność!");
				await fetchGoogleEvents();
				closeModal();
			} else {
				const error = await res.json().catch(() => ({}));
				toast.error(error.message || "Nie udało się zgłosić nieobecności");
			}
		} catch (error) {
			console.error("Błąd zgłaszania nieobecności:", error);
			toast.error("Wystąpił błąd podczas zgłaszania nieobecności");
		} finally {
			setIsReportingAbsence(false);
		}
	};
	const handleDayClick = (date: Date) => {
		const dateStr = date.toISOString().split("T")[0];
		const events = getEventsForDay(date);

		if (events.length === 0) {
			toast("Brak wydarzeń na ten dzień");
			return;
		}

		setSelectedDate(dateStr);
		setSelectedTask(null);
		setIsModalOpen(true);
	};

	const handleTaskClick = (task: any) => {
		console.log("[DEBUG] Kliknięte zadanie:", {
			id: task.id,
			title: task.title,
			source: task.source,
			dueDate: task.dueDate,
			absenceReported: task.absenceReported,
			canReport: canReportAbsence(task.dueDate),
		});
		setSelectedTask(task);
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setSelectedTask(null);
		setIsReportingAbsence(false);
	};

	const monthNames = [
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

	const dayNames = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"];

	if (loading || isGoogleLoading) {
		return (
			<div className={styles.calendar}>
				<div className={styles.loading}>
					<div className={styles.loadingSpinner}></div>
					<p>
						{isGoogleLoading
							? "Ładowanie wydarzeń z Google..."
							: "Ładowanie kalendarza..."}
					</p>
				</div>
			</div>
		);
	}
	const renderDay = (date: Date, day: number) => {
		const dayEvents = getEventsForDay(date);
		const isTodayDate =
			date.getDate() === new Date().getDate() &&
			date.getMonth() === new Date().getMonth() &&
			date.getFullYear() === new Date().getFullYear();

		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const dateMidnight = new Date(date);
		dateMidnight.setHours(0, 0, 0, 0);
		const isPastDate = dateMidnight < today;

		const hasGoogleEvent = dayEvents.some((e) => e.source === "google");
		const hasSystemTask = dayEvents.some((e) => e.source === "system");

		return (
			<div
				key={date.toISOString()}
				className={`${styles.day} ${isTodayDate ? styles.today : ""} ${isPastDate ? styles.past : ""}`}
				onClick={() => handleDayClick(date)}
			>
				<div className={styles.dayHeader}>
					<span className={styles.dayNumber}>{day}</span>
					{viewMode === "week" && (
						<span className={styles.dayName}>
							{date.toLocaleDateString("pl-PL", { weekday: "short" })}
						</span>
					)}
					{dayEvents.length > 0 && (
						<span className={styles.taskCount}>{dayEvents.length}</span>
					)}
				</div>

				<div className={styles.dayTasks}>
					{dayEvents.slice(0, 3).map((event) => (
						<div
							key={event.id}
							className={`${styles.dayTaskItem} ${event.source === "google" ? styles.googleTaskItem : ""}`}
							onClick={(e) => {
								e.stopPropagation();
								handleTaskClick(event);
							}}
						>
							<span
								className={styles.dayTaskDot}
								style={{
									backgroundColor:
										event.source === "google"
											? event.hasMeeting
												? "#0b57d0"
												: "#4285f4"
											: PRIORITY_COLORS[event.priority as TaskPriority],
								}}
							/>
							<span className={styles.dayTaskTitle}>
								{event.title}
								{event.hasMeeting && (
									<span className={styles.meetBadge}>
										<Video size={10} /> Meet
									</span>
								)}
								{event.source === "google" && (
									<span className={styles.googleBadge}>Google</span>
								)}
								{event.source === "system" && event.absenceReported && (
									<span className={styles.absenceReportedBadge}>
										<AlertCircle size={10} /> Zgłoszono nieobecność
									</span>
								)}
							</span>
						</div>
					))}
					{dayEvents.length > 3 && (
						<div className={styles.moreTasks}>
							+{dayEvents.length - 3} więcej
						</div>
					)}
				</div>
			</div>
		);
	};
	return (
		<div className={styles.calendar}>
			<div className={styles.header}>
				<div className={styles.headerLeft}>
					<h1 className={styles.title}>Kalendarz</h1>
					<p className={styles.subtitle}>
						{isGoogleAuth
							? "Zadania systemowe i wydarzenia z Google Calendar"
							: "Zadania systemowe"}
					</p>
				</div>
				<div className={styles.headerRight}>
					<button className={styles.todayBtn} onClick={goToToday}>
						<CalendarDays size={16} />
						Dzisiaj
					</button>
				</div>
			</div>

			<div className={styles.controls}>
				<div className={styles.navigation}>
					<button
						className={styles.navBtn}
						onClick={
							viewMode === "month" ? goToPreviousMonth : goToPreviousWeek
						}
					>
						<ChevronLeft size={20} />
					</button>
					<span className={styles.monthYear}>
						{viewMode === "month"
							? `${monthNames[currentMonth]} ${currentYear}`
							: getWeekLabel()}
					</span>
					<button
						className={styles.navBtn}
						onClick={viewMode === "month" ? goToNextMonth : goToNextWeek}
					>
						<ChevronRight size={20} />
					</button>
				</div>
			</div>

			<div className={styles.calendarGrid}>
				{viewMode === "month" && (
					<div className={styles.weekDays}>
						{dayNames.map((day) => (
							<div key={day} className={styles.weekDay}>
								{day}
							</div>
						))}
					</div>
				)}

				<div className={styles.daysGrid}>
					{viewMode === "month" ? (
						<>
							{Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map(
								(_, index) => (
									<div key={`empty-${index}`} className={styles.emptyDay} />
								),
							)}
							{Array.from({ length: daysInMonth }).map((_, index) => {
								const day = index + 1;
								const date = new Date(currentYear, currentMonth, day);
								return renderDay(date, day);
							})}
						</>
					) : (
						getWeekDays().map((date) => {
							return renderDay(date, date.getDate());
						})
					)}
				</div>
			</div>

			{isModalOpen && (
				<div className={styles.modalOverlay} onClick={closeModal}>
					<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>
								{selectedTask
									? selectedTask.title
									: selectedDate
										? formatDate(selectedDate)
										: "Wydarzenia"}
							</h2>
							<button className={styles.modalClose} onClick={closeModal}>
								<X size={20} />
							</button>
						</div>

						<div className={styles.modalBody}>
							{selectedTask ? (
								<div className={styles.taskDetail}>
									<p className={styles.taskDescription}>
										{selectedTask.description || "Brak opisu"}
									</p>

									<div className={styles.taskMeta}>
										<div className={styles.metaItem}>
											<User size={16} />
											<span>{selectedTask.assignedToName}</span>
										</div>
										<div className={styles.metaItem}>
											<CalendarIcon size={16} />
											<span>{formatDate(selectedTask.dueDate)}</span>
										</div>
										<div className={styles.metaItem}>
											<Clock size={16} />
											<span>{formatTime(selectedTask.dueDate)}</span>
										</div>
										{selectedTask.source !== "google" && (
											<>
												<div className={styles.metaItem}>
													<span
														className={styles.statusBadge}
														style={{
															backgroundColor:
																STATUS_COLORS[selectedTask.status],
														}}
													>
														{STATUS_LABELS[selectedTask.status]}
													</span>
												</div>
												<div className={styles.metaItem}>
													<span
														className={styles.priorityBadge}
														style={{
															backgroundColor:
																PRIORITY_COLORS[selectedTask.priority],
														}}
													>
														{PRIORITY_LABELS[selectedTask.priority]}
													</span>
												</div>
											</>
										)}
										{selectedTask.pillar && (
											<div className={styles.metaItem}>
												<Tag size={16} />
												<span>{selectedTask.pillar}</span>
											</div>
										)}
										{selectedTask.source === "google" &&
											selectedTask.hasMeeting && (
												<div
													className={`${styles.metaItem} ${styles.metaItemFull}`}
												>
													<Video size={16} />
													<span>Spotkanie Google Meet</span>
												</div>
											)}
										{/* Lista nieobecności — tylko dla organizatora */}
										{selectedTask.source === "google" &&
											selectedTask.isOrganizer &&
											selectedTask.absentees &&
											selectedTask.absentees.length > 0 && (
												<div className={styles.absenteesBox}>
													<div className={styles.absenteesHeader}>
														<AlertCircle size={16} />
														<span>Zgłoszone nieobecności</span>
														<span className={styles.absenteesCount}>
															{selectedTask.absentees.length}
														</span>
													</div>
													<ul className={styles.absenteesList}>
														{selectedTask.absentees.map((a) => {
															const initials = a.userName
																.split(" ")
																.map((n) => n[0])
																.join("")
																.substring(0, 2)
																.toUpperCase();
															const time = new Date(
																a.reportedAt,
															).toLocaleString("pl-PL", {
																day: "numeric",
																month: "short",
																hour: "2-digit",
																minute: "2-digit",
															});

															return (
																<li
																	key={a.userId}
																	className={styles.absenteeItem}
																>
																	<div className={styles.absenteeAvatar}>
																		{initials}
																	</div>
																	<div className={styles.absenteeInfo}>
																		<span className={styles.absenteeName}>
																			{a.userName}
																		</span>
																		<span className={styles.absenteeEmail}>
																			{a.userEmail}
																		</span>
																	</div>
																	<span className={styles.absenteeTime}>
																		{time}
																	</span>
																</li>
															);
														})}
													</ul>
												</div>
											)}
									</div>

									{selectedTask.tags && selectedTask.tags.length > 0 && (
										<div className={styles.tags}>
											{selectedTask.tags.map((tag) => (
												<span key={tag} className={styles.tag}>
													<Tag size={12} />
													{tag}
												</span>
											))}
										</div>
									)}

									{/* Przycisk dołącz do Meet (tylko dla Google) */}
									{/* Przycisk dołącz do Meet (tylko dla Google) */}
									{selectedTask.source === "google" &&
										selectedTask.hangoutLink && (
											<a
												href={selectedTask.hangoutLink}
												target="_blank"
												rel="noopener noreferrer"
												className={styles.meetButton}
											>
												<Video size={18} />
												Dołącz do spotkania Google Meet
												<Link2 size={14} />
											</a>
										)}

									{/* Przycisk zgłaszania nieobecności (tylko dla wydarzeń Google) */}
									{selectedTask.source === "google" && (
										<>
											{selectedTask.absenceReported ? (
												<div className={styles.absenceReportedInfo}>
													<AlertCircle size={20} />
													<span>Nieobecność została już zgłoszona</span>
												</div>
											) : (
												<>
													<button
														className={styles.absenceButton}
														onClick={() =>
															handleReportGoogleAbsence(
																selectedTask.id,
																selectedTask.title,
																selectedTask.dueDate,
															)
														}
														disabled={
															isReportingAbsence ||
															!canReportAbsence(selectedTask.dueDate)
														}
														title={
															!canReportAbsence(selectedTask.dueDate)
																? "Nieobecność można zgłosić min. 24h przed spotkaniem"
																: ""
														}
													>
														{isReportingAbsence
															? "Zgłaszanie..."
															: "Zgłoś nieobecność"}
													</button>

													{!canReportAbsence(selectedTask.dueDate) && (
														<div className={styles.absenceNotAvailable}>
															<AlertCircle size={16} />
															<span>
																Nieobecność można zgłosić minimum 24h przed
																spotkaniem
															</span>
														</div>
													)}
												</>
											)}
										</>
									)}
								</div>
							) : (
								<div className={styles.dayTasksList}>
									<p className={styles.dayTasksTitle}>
										Wydarzenia na {selectedDate ? formatDate(selectedDate) : ""}
									</p>
									{selectedDate &&
										(() => {
											const [y, m, d] = selectedDate.split("-").map(Number);
											const date = new Date(y, m - 1, d);
											const events = getEventsForDay(date);
											return (
												<div className={styles.tasksList}>
													{events.map((event: any) => (
														<div
															key={event.id}
															className={`${styles.taskItem} ${event.source === "google" ? styles.googleTaskItem : ""}`}
															onClick={() => {
																handleTaskClick(event);
															}}
														>
															<div
																className={styles.taskStatusDot}
																style={{
																	backgroundColor:
																		event.source === "google"
																			? event.hasMeeting
																				? "#0b57d0"
																				: "#4285f4"
																			: STATUS_COLORS[
																					event.status as TaskStatus
																				],
																}}
															/>
															<div className={styles.taskInfo}>
																<span className={styles.taskTitle}>
																	{event.title}
																	{event.source === "google" && (
																		<>
																			<span className={styles.googleBadge}>
																				Google
																			</span>
																			{event.hasMeeting && (
																				<span className={styles.meetBadge}>
																					<Video size={12} /> Meet
																				</span>
																			)}
																		</>
																	)}
																	{event.source === "system" &&
																		event.absenceReported && (
																			<span
																				className={styles.absenceReportedBadge}
																			>
																				<AlertCircle size={10} /> Zgłoszono
																				nieobecność
																			</span>
																		)}
																</span>
																<span className={styles.taskAssignedTo}>
																	{event.assignedToName}
																</span>
															</div>
															{event.source !== "google" && (
																<span
																	className={styles.taskPriority}
																	style={{
																		color:
																			PRIORITY_COLORS[
																				event.priority as TaskPriority
																			],
																	}}
																>
																	{
																		PRIORITY_LABELS[
																			event.priority as TaskPriority
																		]
																	}
																</span>
															)}
														</div>
													))}
													{events.length === 0 && (
														<p className={styles.noTasks}>
															Brak wydarzeń na ten dzień
														</p>
													)}
												</div>
											);
										})()}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
