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

type User = {
	id: string;
	name: string;
	role: string;
};

const API_URL = import.meta.env.VITE_API_URL ||
	(window.location.hostname === 'panel.silamlodych.pl'
		? ''  // ✅ Puste - użyje tej samej domeny (https://panel.silamlodych.pl)
		: 'http://localhost:3000');

export default function Calendar() {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [tasks, setTasks] = useState<CalendarTask[]>([]);
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
	const [loading, setLoading] = useState(true);
	const [_isSyncing, _setIsSyncing] = useState(false);
	const [googleEvents, setGoogleEvents] = useState<any[]>([]);
	const [isGoogleAuth, setIsGoogleAuth] = useState(false);
	const [_isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [_currentUser] = useState<User>({
		id: "",
		name: "",
		role: "member",
	});

	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth();

	// ============================================================
	// 1. ŁADUJ ZADANIA
	// ============================================================
	useEffect(() => {
		fetchTasks();
		checkGoogleAuth();
	}, []);

	const checkGoogleAuth = async () => {
		try {
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`${API_URL}/api/calendar/status`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			setIsGoogleAuth(data.authenticated);
			if (data.authenticated) {
				await fetchGoogleEvents();
			}
		} catch (error) {
			// console.log("ℹ️ Google Calendar nie dostępny");
			setIsGoogleAuth(false);
		}
	};

	const fetchGoogleEvents = async () => {
		if (!isGoogleAuth) return;
		setIsGoogleLoading(true);
		try {
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`${API_URL}/api/calendar/events`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				setGoogleEvents(data);
			}
		} catch (error) {
			// console.log("ℹ️ Nie udało się pobrać wydarzeń z Google");
		} finally {
			setIsGoogleLoading(false);
		}
	};

	const fetchTasks = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("accessToken");
			const tasksRes = await fetch(`${API_URL}/api/tasks`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (tasksRes.ok) {
				const data = await tasksRes.json();
				setTasks(data);
			}
		} catch (error) {
			console.error("Błąd pobierania:", error);
			toast.error("Nie udało się pobrać zadań");
		} finally {
			setLoading(false);
		}
	};


	const goToPreviousMonth = () => {
		setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
	};

	const goToNextMonth = () => {
		setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
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

	const getEventsForDay = (day: number) => {
		const date = new Date(currentYear, currentMonth, day);
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
					const eventDate = new Date(event.start?.dateTime || event.start?.date);
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
					hangoutLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || null,
					hasMeeting: !!(event.hangoutLink || event.conferenceData?.entryPoints?.length > 0),
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

	const handleDayClick = (day: number) => {
		const date = new Date(currentYear, currentMonth, day);
		const dateStr = date.toISOString().split("T")[0];
		const events = getEventsForDay(day);

		if (events.length === 1) {
			// Jeśli tylko jedno wydarzenie - otwórz je bezpośrednio
			const event = events[0];
			if (event.source === "google" && event.htmlLink) {
				window.open(event.htmlLink, "_blank");
				return;
			}
			setSelectedTask(event);
			setSelectedDate(dateStr);
			setIsModalOpen(true);
		} else if (events.length > 1) {
			// Jeśli więcej - otwórz listę
			setSelectedDate(dateStr);
			setSelectedTask(null);
			setIsModalOpen(true);
		} else {
			// Brak wydarzeń
			toast("Brak wydarzeń na ten dzień");
		}
	};

	const handleTaskClick = (task: any) => {
		if (task.source === "google" && task.htmlLink) {
			window.open(task.htmlLink, "_blank");
			return;
		}
		setSelectedTask(task);
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setSelectedTask(null);
	};

	const monthNames = [
		"Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
		"Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
	];

	const dayNames = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"];

	if (loading) {
		return (
			<div className={styles.calendar}>
				<div className={styles.loading}>
					<div className={styles.loadingSpinner}></div>
					<p>Ładowanie kalendarza...</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.calendar}>
			<div className={styles.header}>
				<div className={styles.headerLeft}>
					<h1 className={styles.title}>Kalendarz</h1>
					<p className={styles.subtitle}>Przeglądaj swoje zadania w kalendarzu</p>
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
					<button className={styles.navBtn} onClick={goToPreviousMonth}>
						<ChevronLeft size={20} />
					</button>
					<span className={styles.monthYear}>
						{monthNames[currentMonth]} {currentYear}
					</span>
					<button className={styles.navBtn} onClick={goToNextMonth}>
						<ChevronRight size={20} />
					</button>
				</div>
			</div>

			<div className={styles.calendarGrid}>
				<div className={styles.weekDays}>
					{dayNames.map((day) => (
						<div key={day} className={styles.weekDay}>{day}</div>
					))}
				</div>

				<div className={styles.daysGrid}>
					{Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map(
						(_, index) => (
							<div key={`empty-${index}`} className={styles.emptyDay} />
						),
					)}

					{Array.from({ length: daysInMonth }).map((_, index) => {
						const day = index + 1;
						const dayEvents = getEventsForDay(day);
						const isTodayDate = isToday(day);
						const isPastDate = isPast(day);

						return (
							<div
								key={day}
								className={`${styles.day} ${isTodayDate ? styles.today : ""} ${isPastDate ? styles.past : ""}`}
								onClick={() => handleDayClick(day)}
							>
								<div className={styles.dayHeader}>
									<span className={styles.dayNumber}>{day}</span>
									{dayEvents.length > 0 && (
										<span className={styles.taskCount}>{dayEvents.length}</span>
									)}
								</div>
								{/* ZMIENIONE: WYŚWIETLANIE NAZW ZADAŃ ZAMIAST KROPEK */}
								<div className={styles.dayTasks}>
									{dayEvents.slice(0, 3).map((event) => (
										<div
											key={event.id}
											className={`${styles.dayTaskItem} ${event.source === "google" ? styles.googleTaskItem : ""}`}
											onClick={(e) => {
												e.stopPropagation();
												if (event.source === "google" && event.hangoutLink) {
													window.open(event.hangoutLink, "_blank");
													return;
												}
												if (event.source === "google") {
													window.open(event.htmlLink || "#", "_blank");
												} else {
													handleTaskClick(event);
												}
											}}
										>
											<span
												className={styles.dayTaskDot}
												style={{
													backgroundColor:
														event.source === "google"
															? (event.hasMeeting ? "#0b57d0" : "#4285f4")
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
					})}
				</div>
			</div>

			{isModalOpen && (
				<div className={styles.modalOverlay} onClick={closeModal}>
					<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>
								{selectedTask ? selectedTask.title : selectedDate ? formatDate(selectedDate) : "Wydarzenia"}
							</h2>
							<button className={styles.modalClose} onClick={closeModal}>
								<X size={20} />
							</button>
						</div>

						<div className={styles.modalBody}>
							{selectedTask ? (
								// SZCZEGÓŁY POJEDYNCZEGO ZADANIA
								<div className={styles.taskDetail}>
									<p className={styles.taskDescription}>
										{selectedTask.description}
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
										<div className={styles.metaItem}>
											<span
												className={styles.statusBadge}
												style={{ backgroundColor: STATUS_COLORS[selectedTask.status] }}
											>
												{STATUS_LABELS[selectedTask.status]}
											</span>
										</div>
										<div className={styles.metaItem}>
											<span
												className={styles.priorityBadge}
												style={{ backgroundColor: PRIORITY_COLORS[selectedTask.priority] }}
											>
												{PRIORITY_LABELS[selectedTask.priority]}
											</span>
										</div>
										{selectedTask.pillar && (
											<div className={styles.metaItem}>
												<Tag size={16} />
												<span>{selectedTask.pillar}</span>
											</div>
										)}
										{selectedTask.source === "google" && selectedTask.hasMeeting && (
											<div className={styles.metaItem} style={{ gridColumn: "1 / -1", background: "#e8f0fe" }}>
												<Video size={16} color="#1a73e8" />
												<span style={{ fontWeight: 600, color: "#1a73e8" }}>
													Spotkanie Google Meet
												</span>
											</div>
										)}
									</div>

									{selectedTask.tags.length > 0 && (
										<div className={styles.tags}>
											{selectedTask.tags.map((tag) => (
												<span key={tag} className={styles.tag}>
													<Tag size={12} />
													{tag}
												</span>
											))}
										</div>
									)}

									{selectedTask.source === "google" && selectedTask.hangoutLink && (
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


								</div>
							) : (
								// LISTA WSZYSTKICH WYDARZEŃ NA DZIEŃ
								<div className={styles.dayTasksList}>
									<p className={styles.dayTasksTitle}>
										Zadania na {selectedDate ? formatDate(selectedDate) : ""}
									</p>
									{selectedDate && (
										<div className={styles.tasksList}>
											{getEventsForDay(parseInt(selectedDate.split("-")[2])).map((event: any) => (
												<div
													key={event.id}
													className={`${styles.taskItem} ${event.source === "google" ? styles.googleTaskItem : ""}`}
													onClick={() => {
														if (event.source === "google" && event.hangoutLink) {
															window.open(event.hangoutLink, "_blank");
															return;
														}
														if (event.source === "google") {
															window.open(event.htmlLink || "#", "_blank");
														} else {
															handleTaskClick(event);
														}
													}}
												>
													<div
														className={styles.taskStatusDot}
														style={{
															backgroundColor:
																event.source === "google"
																	? (event.hasMeeting ? "#0b57d0" : "#4285f4")
																	: STATUS_COLORS[event.status as TaskStatus],
														}}
													/>
													<div className={styles.taskInfo}>
														<span className={styles.taskTitle}>
															{event.title}
															{event.source === "google" && (
																<>
																	<span className={styles.googleBadge}>Google</span>
																	{event.hasMeeting && (
																		<span className={styles.meetBadge}>
																			<Video size={12} /> Meet
																		</span>
																	)}
																</>
															)}
														</span>
														<span className={styles.taskAssignedTo}>
															{event.assignedToName}
														</span>
													</div>
													{event.source !== "google" && (
														<span
															className={styles.taskPriority}
															style={{ color: PRIORITY_COLORS[event.priority as TaskPriority] }}
														>
															{PRIORITY_LABELS[event.priority as TaskPriority]}
														</span>
													)}
												</div>
											))}
											{getEventsForDay(parseInt(selectedDate.split("-")[2])).length === 0 && (
												<p className={styles.noTasks}>Brak wydarzeń na ten dzień</p>
											)}
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
