import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import styles from "./MyTeam.module.css";
import { Star, X } from "lucide-react";
/* =========================
   TYPY
   ========================= */

interface Coordinator {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
}

interface MemberTasksStats {
	total: number;
	completed: number;
	in_progress: number;
	todo: number;
	completion_rate: number;
	average_rating: number | null;
	average_difficulty: number | null;
	total_rated: number;
}

interface Member {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	functional_role?: string | null;
	role_in_team?: string | null;
	is_leader: boolean;
	tasks: MemberTasksStats;
}

interface Project {
	id: number;
	name: string;
	pillar?: string | null;
	status?: string | null;
	tasks_count: number;
	completed_tasks: number;
}

interface TeamStats {
	members_count: number;
	projects_count: number;
	tasks_total: number;
	tasks_completed: number;
	average_rating: number | null;
	average_difficulty: number | null;
	total_rated: number;
}

interface TeamOption {
	id: number;
	name: string;
}

interface MyTeamResponse {
	team: TeamOption | null;
	isCoordinator: boolean;
	isBoard: boolean;
	isAdmin: boolean;
	availableTeams: TeamOption[];
	coordinators: Coordinator[];
	members: Member[];
	projects: Project[];
	team_stats: TeamStats;
}

interface MemberTask {
	id: number;
	title: string;
	project_name?: string | null;
	pillar?: string | null;
	priority: string;
	difficulty: number | null;
	rating: number | null;
	rating_comment?: string | null;
	completed_at?: string | null;
	days_to_complete?: number | null;
	rated_by_name?: string | null;
}

interface MemberTasksResponse {
	tasks: MemberTask[];
	stats: {
		total: number;
		completed: number;
		average_rating: number | null;
		average_difficulty: number | null;
	};
}

/* -------- FREKWENCJA -------- */

interface MemberAttendance {
	total_meetings: number;
	present_count: number;
	absent_count: number;
	excused_count: number;
	attendance_percentage: number;
}

interface MemberWithAttendance {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	phone: string | null;
	province: string | null;
	functional_role: string | null;
	status: string | null;
	role_in_team: string | null;
	is_leader: boolean;
	attendance: MemberAttendance | null;
}

interface AttendanceResponse {
	team: TeamOption | null;
	members: MemberWithAttendance[];
	has_attendance: boolean;
}

/* =========================
   HELPERS
   ========================= */

const API_BASE = "/api";

function getToken(): string | null {
	return (
		localStorage.getItem("token") ||
		localStorage.getItem("authToken") ||
		sessionStorage.getItem("token")
	);
}

async function apiFetch<T>(url: string): Promise<T> {
	const token = getToken();
	const res = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		credentials: "include",
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`HTTP ${res.status} ${res.statusText} – ${text}`);
	}
	return (await res.json()) as T;
}

function initials(first?: string, last?: string): string {
	const a = (first || "").trim().charAt(0);
	const b = (last || "").trim().charAt(0);
	return (a + b).toUpperCase() || "?";
}

function fullName(
	p?: { first_name?: string; last_name?: string } | null,
): string {
	if (!p) return "—";
	const n = `${p.first_name || ""} ${p.last_name || ""}`.trim();
	return n || "—";
}

function fmtNumber(v: number | null | undefined, digits = 1): string {
	if (v === null || v === undefined || Number.isNaN(v)) return "—";
	return v.toFixed(digits);
}

function fmtDate(v?: string | null): string {
	if (!v) return "—";
	const d = new Date(v);
	if (Number.isNaN(d.getTime())) return "—";
	return d.toLocaleDateString("pl-PL", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
}

function pctColor(pct: number): string {
	if (pct >= 80) return "#16a34a";
	if (pct >= 50) return "#ca8a04";
	return "#dc2626";
}

const PRIORITY_LABEL: Record<string, string> = {
	low: "Niski",
	medium: "Średni",
	high: "Wysoki",
	urgent: "Pilny",
};

/* =========================
   KOMPONENT
   ========================= */

export default function MyTeam() {
	const [data, setData] = useState<MyTeamResponse | null>(null);
	const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { user, loading: authLoading } = useAuth();
	const navigate = useNavigate();

	// frekwencja
	const [attendanceData, setAttendanceData] = useState<MemberWithAttendance[]>(
		[],
	);
	const [attendanceLoading, setAttendanceLoading] = useState(false);
	const [hasAttendance, setHasAttendance] = useState(false);

	useEffect(() => {
		if (authLoading) return;
		if (!user) {
			navigate("/login", { replace: true });
			return;
		}
		const allowed =
			user.role === "admin" ||
			user.role === "board" ||
			user.role === "coordinator" ||
			user.isLeader === true;
		if (!allowed) {
			navigate("/dashboard", { replace: true });
		}
	}, [user, authLoading, navigate]);

	// modal historii
	const [historyOpen, setHistoryOpen] = useState(false);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [historyError, setHistoryError] = useState<string | null>(null);
	const [historyMember, setHistoryMember] = useState<Member | null>(null);
	const [historyData, setHistoryData] = useState<MemberTasksResponse | null>(
		null,
	);

	/* -------- ładowanie danych zespołu -------- */
	const loadTeam = useCallback(async (teamId?: number | null) => {
		setLoading(true);
		setError(null);
		try {
			const qs = teamId ? `?teamId=${teamId}` : "";
			const json = await apiFetch<MyTeamResponse>(`${API_BASE}/my-team${qs}`);
			setData(json);
			setSelectedTeamId(json.team?.id ?? null);
		} catch (e: any) {
			setError(e?.message || "Nie udało się załadować danych zespołu.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadTeam();
	}, [loadTeam]);

	/* -------- ładowanie frekwencji -------- */
	useEffect(() => {
		if (!selectedTeamId) return;
		let cancelled = false;
		setAttendanceLoading(true);
		apiFetch<AttendanceResponse>(
			`${API_BASE}/my-team/attendance?teamId=${selectedTeamId}`,
		)
			.then((json) => {
				if (cancelled) return;
				setAttendanceData(json.members || []);
				setHasAttendance(json.has_attendance || false);
			})
			.catch(() => {
				if (cancelled) return;
				setAttendanceData([]);
				setHasAttendance(false);
			})
			.finally(() => {
				if (!cancelled) setAttendanceLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [selectedTeamId]);

	/* -------- zmiana zespołu (board/admin) -------- */
	const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const id = Number(e.target.value);
		if (!Number.isNaN(id)) {
			loadTeam(id);
		}
	};

	/* -------- historia członka -------- */
	const openHistory = async (member: Member) => {
		setHistoryMember(member);
		setHistoryOpen(true);
		setHistoryLoading(true);
		setHistoryError(null);
		setHistoryData(null);
		try {
			const json = await apiFetch<MemberTasksResponse>(
				`${API_BASE}/my-team/member/${member.id}/tasks`,
			);
			setHistoryData(json);
		} catch (e: any) {
			setHistoryError(e?.message || "Nie udało się załadować historii zadań.");
		} finally {
			setHistoryLoading(false);
		}
	};

	const closeHistory = () => {
		setHistoryOpen(false);
		setHistoryMember(null);
		setHistoryData(null);
		setHistoryError(null);
	};

	if (authLoading) {
		return (
			<div className={styles.page}>
				<div className={styles.stateBox}>Ładowanie…</div>
			</div>
		);
	}

	/* -------- stany brzegowe -------- */
	if (loading && !data) {
		return (
			<div className={styles.page}>
				<div className={styles.stateBox}>Ładowanie danych zespołu…</div>
			</div>
		);
	}

	if (error && !data) {
		return (
			<div className={styles.page}>
				<div className={styles.stateBox + " " + styles.stateError}>{error}</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div className={styles.page}>
				<div className={styles.stateBox}>Brak danych.</div>
			</div>
		);
	}

	const roleLabel = data.isAdmin
		? "Administrator"
		: data.isBoard
			? "Zarząd"
			: data.isCoordinator
				? "Koordynator"
				: "Członek";

	const canSwitch =
		(data.isBoard || data.isAdmin) && data.availableTeams.length > 0;

	const { team_stats } = data;

	// ── Średnia frekwencja zespołu ──
	const attendanceWithData = attendanceData.filter(
		(m) => m.attendance && m.attendance.total_meetings > 0,
	);
	const avgAttendance =
		attendanceWithData.length > 0
			? attendanceWithData.reduce(
					(s, m) => s + (m.attendance?.attendance_percentage ?? 0),
					0,
				) / attendanceWithData.length
			: null;
	const totalMeetingsCount =
		attendanceWithData[0]?.attendance?.total_meetings ?? 0;

	return (
		<div className={styles.page}>
			{/* ---------- HEADER ---------- */}
			<div className={styles.header}>
				<div className={styles.headerLeft}>
					<h1 className={styles.title}>{data.team?.name || "My Team"}</h1>
					<span className={styles.roleBadge}>{roleLabel}</span>
				</div>

				{canSwitch && (
					<div className={styles.headerRight}>
						<label className={styles.switchLabel}>
							Zespół:
							<select
								className={styles.select}
								value={selectedTeamId ?? ""}
								onChange={handleTeamChange}
							>
								{data.availableTeams.map((t) => (
									<option key={t.id} value={t.id}>
										{t.name}
									</option>
								))}
							</select>
						</label>
					</div>
				)}
			</div>

			{/* ---------- KAFELKI STATYSTYK ---------- */}
			<div className={styles.statsGrid}>
				<StatCard label="Członkowie" value={String(team_stats.members_count)} />
				<StatCard label="Projekty" value={String(team_stats.projects_count)} />
				<StatCard
					label="Zadania"
					value={`${team_stats.tasks_completed}/${team_stats.tasks_total}`}
					sub={
						team_stats.tasks_total > 0
							? `${Math.round(
									(team_stats.tasks_completed / team_stats.tasks_total) * 100,
								)}%`
							: "0%"
					}
				/>
				<StatCard
					label="Średnia ocena"
					value={
						team_stats.average_rating !== null
							? `${fmtNumber(team_stats.average_rating)}`
							: "—"
					}
					icon={
						team_stats.average_rating !== null ? <Star size={20} /> : undefined
					}
					sub={
						team_stats.total_rated > 0
							? `z ${team_stats.total_rated} ocenionych`
							: "brak ocen"
					}
				/>
				{hasAttendance && (
					<StatCard
						label="Śr. frekwencja"
						value={
							avgAttendance !== null ? `${avgAttendance.toFixed(1)}%` : "—"
						}
						sub={
							totalMeetingsCount > 0
								? `z ${totalMeetingsCount} spotkań`
								: "brak spotkań"
						}
					/>
				)}
			</div>

			{/* ---------- KOORDYNATORZY ---------- */}
			{data.coordinators.length > 0 && (
				<section className={styles.section}>
					<h2 className={styles.sectionTitle}>Koordynatorzy</h2>
					<div className={styles.coordinatorsGrid}>
						{data.coordinators.map((c) => (
							<div key={c.id} className={styles.coordinatorCard}>
								<div className={styles.avatar}>
									{initials(c.first_name, c.last_name)}
								</div>
								<div className={styles.coordinatorInfo}>
									<div className={styles.coordinatorName}>{fullName(c)}</div>
									<div className={styles.coordinatorEmail}>
										{c.email || "—"}
									</div>
								</div>
							</div>
						))}
					</div>
				</section>
			)}

			{/* ---------- PROJEKTY ---------- */}
			{data.projects.length > 0 && (
				<section className={styles.section}>
					<h2 className={styles.sectionTitle}>Projekty zespołu</h2>
					<div className={styles.projectsGrid}>
						{data.projects.map((p) => {
							const pct =
								p.tasks_count > 0
									? Math.round((p.completed_tasks / p.tasks_count) * 100)
									: 0;
							return (
								<div key={p.id} className={styles.projectCard}>
									<div className={styles.projectHeader}>
										<span className={styles.projectName}>{p.name}</span>
										{p.status && (
											<span className={styles.projectStatus}>{p.status}</span>
										)}
									</div>
									{p.pillar && (
										<div className={styles.projectPillar}>{p.pillar}</div>
									)}
									<div className={styles.projectProgressRow}>
										<span className={styles.projectProgressText}>
											{p.completed_tasks}/{p.tasks_count} zadań
										</span>
										<span className={styles.projectProgressPct}>{pct}%</span>
									</div>
									<div className={styles.progressBar}>
										<div
											className={styles.progressBarFill}
											style={{ width: `${pct}%` }}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</section>
			)}

			{/* ---------- FREKWENCJA ZESPOŁU ---------- */}
			{hasAttendance && (
				<section className={styles.section}>
					<h2 className={styles.sectionTitle}>
						Frekwencja zespołu{" "}
						<span className={styles.sectionCount}>
							({attendanceData.length})
						</span>
					</h2>

					{attendanceLoading ? (
						<div className={styles.stateBox}>Ładowanie frekwencji…</div>
					) : attendanceData.length === 0 ? (
						<div className={styles.stateBox}>
							Brak danych frekwencji dla tego zespołu.
						</div>
					) : (
						<div className={styles.tableWrapper}>
							<div className={styles.attendanceHeader}>
								<div />
								<div>Imię i nazwisko</div>
								<div>Telefon</div>
								<div>Województwo</div>
								<div>Spotkania</div>
								<div>Obecny</div>
								<div>Nieobecny</div>
								<div>Uspraw.</div>
								<div>Frekwencja</div>
							</div>

							{attendanceData.map((m) => {
								const a = m.attendance;
								const pct = a?.attendance_percentage ?? 0;
								return (
									<div key={m.id} className={styles.attendanceRow}>
										<div className={styles.cellAvatar}>
											<div className={styles.avatarSmall}>
												{initials(m.first_name, m.last_name)}
											</div>
										</div>
										<div className={styles.cellName}>
											<div className={styles.memberName}>
												{fullName(m)}
												{m.is_leader && (
													<span className={styles.leaderBadge}>Lider</span>
												)}
											</div>
											<div className={styles.memberEmail}>{m.email || "—"}</div>
										</div>
										<div className={styles.cellContact}>{m.phone || "—"}</div>
										<div className={styles.cellContact}>
											{m.province || "—"}
										</div>
										<div className={styles.cellNum}>
											{a?.total_meetings ?? "—"}
										</div>
										<div className={styles.cellPresent}>
											{a?.present_count ?? "—"}
										</div>
										<div className={styles.cellAbsent}>
											{a?.absent_count ?? "—"}
										</div>
										<div className={styles.cellExcused}>
											{a?.excused_count ?? "—"}
										</div>
										<div
											className={styles.cellPct}
											style={{ color: a ? pctColor(pct) : "#9ca3af" }}
										>
											{a ? `${pct.toFixed(1)}%` : "—"}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</section>
			)}

			{/* ---------- CZŁONKOWIE (zadania) ---------- */}
			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>
					Członkowie{" "}
					<span className={styles.sectionCount}>({data.members.length})</span>
				</h2>

				{data.members.length === 0 ? (
					<div className={styles.stateBox}>Brak członków w tym zespole.</div>
				) : (
					<div className={styles.tableWrapper}>
						<div className={styles.tableHeader}>
							<div />
							<div>Imię i nazwisko</div>
							<div>Rola</div>
							<div>Zadania</div>
							<div>%</div>
							<div>Ocena</div>
							<div>Trudność</div>
							<div>Akcje</div>
						</div>

						{data.members.map((m) => (
							<div key={m.id} className={styles.tableRow}>
								<div className={styles.cellAvatar}>
									<div className={styles.avatarSmall}>
										{initials(m.first_name, m.last_name)}
									</div>
								</div>
								<div className={styles.cellName}>
									<div className={styles.memberName}>
										{fullName(m)}
										{m.is_leader && (
											<span className={styles.leaderBadge}>Lider</span>
										)}
									</div>
									<div className={styles.memberEmail}>{m.email || "—"}</div>
								</div>
								<div className={styles.cellRole}>
									{m.role_in_team || m.functional_role || "—"}
								</div>
								<div className={styles.cellTasks}>
									{m.tasks.completed}/{m.tasks.total}
								</div>
								<div className={styles.cellPct}>
									{m.tasks.total > 0 ? `${m.tasks.completion_rate}%` : "—"}
								</div>
								<div className={styles.cellRating}>
									{m.tasks.average_rating !== null ? (
										<>
											<Star size={14} />
											{fmtNumber(m.tasks.average_rating)}
										</>
									) : (
										"—"
									)}
								</div>
								<div className={styles.cellDifficulty}>
									{m.tasks.average_difficulty !== null
										? `${fmtNumber(m.tasks.average_difficulty)} / 5`
										: "—"}
								</div>
								<div className={styles.cellActions}>
									<button
										className={styles.historyBtn}
										onClick={() => openHistory(m)}
									>
										Historia
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			{/* ---------- MODAL HISTORII ---------- */}
			{historyOpen && (
				<div className={styles.modalOverlay} onClick={closeHistory}>
					<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
						<div className={styles.modalHeader}>
							<div>
								<h3 className={styles.modalTitle}>Historia zadań</h3>
								<div className={styles.modalSubtitle}>
									{historyMember ? fullName(historyMember) : ""}
								</div>
							</div>
							<button
								className={styles.modalClose}
								onClick={closeHistory}
								aria-label="Zamknij"
							>
								<X size={18} />
							</button>
						</div>

						<div className={styles.modalBody}>
							{historyLoading && (
								<div className={styles.stateBox}>Ładowanie historii…</div>
							)}

							{historyError && !historyLoading && (
								<div className={styles.stateBox + " " + styles.stateError}>
									{historyError}
								</div>
							)}

							{historyData && !historyLoading && (
								<>
									<div className={styles.modalStats}>
										<div className={styles.modalStat}>
											<span className={styles.modalStatLabel}>Ukończone</span>
											<span className={styles.modalStatValue}>
												{historyData.stats.completed}/{historyData.stats.total}
											</span>
										</div>
										<div className={styles.modalStat}>
											<span className={styles.modalStatLabel}>Śr. ocena</span>
											<span className={styles.modalStatValue}>
												{historyData.stats.average_rating !== null ? (
													<>
														<Star size={16} />
														{fmtNumber(historyData.stats.average_rating)}
													</>
												) : (
													"—"
												)}
											</span>
										</div>
										<div className={styles.modalStat}>
											<span className={styles.modalStatLabel}>
												Śr. trudność
											</span>
											<span className={styles.modalStatValue}>
												{historyData.stats.average_difficulty !== null
													? `${fmtNumber(historyData.stats.average_difficulty)} / 5`
													: "—"}
											</span>
										</div>
									</div>

									{historyData.tasks.length === 0 ? (
										<div className={styles.stateBox}>
											Brak ukończonych zadań.
										</div>
									) : (
										<div className={styles.historyList}>
											{historyData.tasks.map((t) => (
												<div key={t.id} className={styles.historyItem}>
													<div className={styles.historyItemHeader}>
														<span className={styles.historyTitle}>
															{t.title}
														</span>
														<span
															className={
																styles.priorityBadge +
																" " +
																(styles[`priority_${t.priority}`] || "")
															}
														>
															{PRIORITY_LABEL[t.priority] || t.priority}
														</span>
													</div>

													<div className={styles.historyMeta}>
														<span>
															<b>Projekt:</b> {t.project_name || "—"}
														</span>
														{t.pillar && (
															<span>
																<b>Filar:</b> {t.pillar}
															</span>
														)}
														<span>
															<b>Ukończono:</b> {fmtDate(t.completed_at)}
														</span>
														{t.days_to_complete !== null &&
															t.days_to_complete !== undefined && (
																<span>
																	<b>Czas:</b> {t.days_to_complete} dni
																</span>
															)}
													</div>

													<div className={styles.historyRating}>
														<span className={styles.historyRatingItem}>
															<b>Ocena:</b>{" "}
															{t.rating !== null ? `${t.rating} ⭐` : "—"}
														</span>
														<span className={styles.historyRatingItem}>
															<b>Trudność:</b>{" "}
															{t.difficulty !== null
																? `${t.difficulty} / 5`
																: "—"}
														</span>
														{t.rated_by_name && (
															<span className={styles.historyRatingItem}>
																<b>Ocenił:</b> {t.rated_by_name}
															</span>
														)}
													</div>

													{t.rating_comment && (
														<div className={styles.historyComment}>
															„{t.rating_comment}"
														</div>
													)}
												</div>
											))}
										</div>
									)}
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

/* =========================
   SUBKOMPONENT
   ========================= */

function StatCard({
	label,
	value,
	icon,
	sub,
}: {
	label: string;
	value: string;
	icon?: React.ReactNode;
	sub?: string;
}) {
	return (
		<div className={styles.statCard}>
			<div className={styles.statLabel}>{label}</div>
			<div className={styles.statValue}>
				{icon && <span className={styles.statIcon}>{icon}</span>}
				{value}
			</div>
			{sub && <div className={styles.statSub}>{sub}</div>}
		</div>
	);
}
