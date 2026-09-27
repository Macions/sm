import { useEffect, useState } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
	Cell,
	LineChart,
	Line,
	Legend,
} from "recharts";
import {
	ChevronDown,
	ChevronRight,
	Users,
	RefreshCw,
	TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { logger } from "@/utils/logger";
import styles from "./TeamAttendanceSection.module.css";

interface PillarSummary {
	pillar_id: number;
	pillar_name: string;
	pillar_label: string;
	members_count: number;
	meetings_count: number;
	present_count: number;
	absent_count: number;
	excused_count: number;
	attendance_percentage: number;
}

interface MemberAttendance {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	total_meetings: number;
	present_count: number;
	absent_count: number;
	excused_count: number;
	attendance_percentage: number;
}

interface SubteamSummary {
	subteam_id: number;
	subteam_name: string;
	members_count: number;
	meetings_count: number;
	attendance_percentage: number;
}

interface ChartPoint {
	label: string;
	percentage: number;
}

function getColor(pct: number): string {
	if (pct >= 75) return "#059669";
	if (pct >= 50) return "#d97706";
	return "#dc2626";
}

export function TeamAttendanceSection() {
	const [pillars, setPillars] = useState<PillarSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [withCard, setWithCard] = useState<number | null>(null);
	const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
	const [members, setMembers] = useState<Record<string, MemberAttendance[]>>(
		{},
	);
	const [membersLoading, setMembersLoading] = useState<string | null>(null);

	const [subteams, setSubteams] = useState<Record<string, SubteamSummary[]>>(
		{},
	);
	const [expandedSubteam, setExpandedSubteam] = useState<number | null>(null);
	const [subteamMembers, setSubteamMembers] = useState<
		Record<number, MemberAttendance[]>
	>({});
	const [subteamsLoading, setSubteamsLoading] = useState<string | null>(null);
	const [subteamMembersLoading, setSubteamMembersLoading] = useState<
		number | null
	>(null);

	const [chartPillar, setChartPillar] = useState<string | null>(null);
	const [chartData, setChartData] = useState<ChartPoint[]>([]);
	const [chartLoading, setChartLoading] = useState(false);

	const token = () => localStorage.getItem("accessToken") || "";

	const fetchPillars = async () => {
		try {
			setLoading(true);
			const res = await fetch("/api/admin/attendance/pillars", {
				headers: { Authorization: `Bearer ${token()}` },
			});
			if (!res.ok) throw new Error("Błąd pobierania filarów");
			const data = await res.json();
			setPillars(data.pillars || []);
		} catch (err) {
			logger.error("Błąd:", err);
			toast.error("Nie udało się pobrać frekwencji filarów");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		fetchPillars();
	}, []);
	useEffect(() => {
		const token = localStorage.getItem("accessToken") || "";
		fetch("/api/admin/members-with-card", {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => setWithCard(d?.total ?? null))
			.catch(() => setWithCard(null));
	}, []);
	const loadMembers = async (pillarName: string) => {
		if (members[pillarName]) return;
		setMembersLoading(pillarName);
		try {
			const res = await fetch(
				`/api/admin/attendance/pillars/${encodeURIComponent(pillarName)}/members`,
				{ headers: { Authorization: `Bearer ${token()}` } },
			);
			if (!res.ok) throw new Error("Błąd pobierania członków");
			const data = await res.json();
			setMembers((prev) => ({ ...prev, [pillarName]: data.members || [] }));
		} catch (err) {
			logger.error("Błąd:", err);
			toast.error("Nie udało się pobrać członków filaru");
		} finally {
			setMembersLoading(null);
		}
	};

	const loadSubteams = async (pillarName: string) => {
		if (subteams[pillarName]) return;
		setSubteamsLoading(pillarName);
		try {
			const res = await fetch(
				`/api/admin/attendance/pillars/${encodeURIComponent(pillarName)}/subteams`,
				{ headers: { Authorization: `Bearer ${token()}` } },
			);
			if (!res.ok) throw new Error("Błąd pobierania subteamów");
			const data = await res.json();
			setSubteams((prev) => ({
				...prev,
				[pillarName]: data.subteams || [],
			}));
		} catch (err) {
			logger.error("Błąd:", err);
			toast.error("Nie udało się pobrać subteamów");
		} finally {
			setSubteamsLoading(null);
		}
	};

	const loadSubteamMembers = async (subteamId: number) => {
		if (subteamMembers[subteamId]) return;
		setSubteamMembersLoading(subteamId);
		try {
			const res = await fetch(
				`/api/admin/attendance/subteams/${subteamId}/members`,
				{ headers: { Authorization: `Bearer ${token()}` } },
			);
			if (!res.ok) throw new Error("Błąd pobierania członków subteamu");
			const data = await res.json();
			setSubteamMembers((prev) => ({
				...prev,
				[subteamId]: data.members || [],
			}));
		} catch (err) {
			logger.error("Błąd:", err);
			toast.error("Nie udało się pobrać członków subteamu");
		} finally {
			setSubteamMembersLoading(null);
		}
	};

	const loadChart = async (pillarName: string) => {
		setChartPillar(pillarName);
		setChartLoading(true);
		try {
			const res = await fetch(
				`/api/admin/attendance/pillars/${encodeURIComponent(pillarName)}/chart?months=12`,
				{ headers: { Authorization: `Bearer ${token()}` } },
			);
			if (!res.ok) throw new Error("Błąd pobierania wykresu");
			const data = await res.json();
			setChartData(data.chart || []);
		} catch (err) {
			logger.error("Błąd:", err);
			toast.error("Nie udało się pobrać wykresu filaru");
			setChartData([]);
		} finally {
			setChartLoading(false);
		}
	};

	const togglePillar = (pillarName: string) => {
		if (expandedPillar === pillarName) {
			setExpandedPillar(null);
			setExpandedSubteam(null);
		} else {
			setExpandedPillar(pillarName);
			loadMembers(pillarName);
			loadSubteams(pillarName);
		}
	};

	const toggleSubteam = (subteamId: number) => {
		if (expandedSubteam === subteamId) {
			setExpandedSubteam(null);
		} else {
			setExpandedSubteam(subteamId);
			loadSubteamMembers(subteamId);
		}
	};

	const handleRefresh = () => {
		setRefreshing(true);
		setMembers({});
		setSubteams({});
		setSubteamMembers({});
		setChartData([]);
		setChartPillar(null);
		setExpandedPillar(null);
		setExpandedSubteam(null);

		// DODAJ TO:
		const token = localStorage.getItem("accessToken") || "";
		fetch("/api/admin/members-with-card", {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => setWithCard(d?.total ?? null))
			.catch(() => {});

		fetchPillars();
	};

	if (loading) {
		return (
			<section className={styles.section}>
				<div className={styles.loading}>
					<div className={styles.loading__spinner} />
					<span>Ładowanie frekwencji filarów...</span>
				</div>
			</section>
		);
	}

	return (
		<section className={styles.section}>
			<div className={styles.section__header}>
				<div className={styles.section__headerLeft}>
					<h2 className={styles.section__title}>
						<TrendingUp
							size={20}
							style={{ display: "inline", marginRight: 8 }}
						/>
						Frekwencja w filarach
					</h2>
					<p className={styles.section__subtitle}>
						Średnia frekwencja poszczególnych filarów oraz szczegóły per
						członek.
					</p>
				</div>
				<button
					className={styles.section__refreshBtn}
					onClick={handleRefresh}
					disabled={refreshing}
					title="Odśwież"
				>
					<RefreshCw size={16} className={refreshing ? styles.spinning : ""} />
				</button>
			</div>
			{withCard !== null && (
				<div className={styles.statCard}>
					<span className={styles.statCard__value}>{withCard}</span>
					<span className={styles.statCard__label}>
						Stali członkowie (z papierami SM)
					</span>
				</div>
			)}

			{/* Wykres słupkowy filarów */}
			<div className={styles.chartWrapper}>
				<ResponsiveContainer width="100%" height={320}>
					<BarChart
						data={pillars}
						margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
					>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis
							dataKey="pillar_label"
							tick={{ fontSize: 12 }}
							interval={0}
							angle={-15}
							textAnchor="end"
							height={60}
						/>
						<YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
						<Tooltip
							formatter={(v) => [`${v}%`, "Frekwencja"]}
							labelFormatter={(l) => `Filar: ${l}`}
						/>
						<Bar
							dataKey="attendance_percentage"
							radius={[6, 6, 0, 0]}
							cursor="pointer"
							onClick={(d: any) => loadChart(d.pillar_name)}
						>
							{pillars.map((p) => (
								<Cell
									key={p.pillar_id}
									fill={getColor(p.attendance_percentage)}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</div>

			{/* Lista filarów */}
			<div className={styles.list}>
				{pillars.map((pillar) => {
					const isExpanded = expandedPillar === pillar.pillar_name;
					const pillarMembers = members[pillar.pillar_name] || [];
					const isLoading = membersLoading === pillar.pillar_name;
					const stList = subteams[pillar.pillar_name] || [];
					const stLoading = subteamsLoading === pillar.pillar_name;

					return (
						<div key={pillar.pillar_id} className={styles.pillarRow}>
							<button
								className={styles.pillarHeader}
								onClick={() => togglePillar(pillar.pillar_name)}
							>
								{isExpanded ? (
									<ChevronDown size={16} />
								) : (
									<ChevronRight size={16} />
								)}
								<Users size={16} />
								<span className={styles.pillarName}>{pillar.pillar_label}</span>
								<span className={styles.pillarMeta}>
									{pillar.members_count} osób · {pillar.meetings_count} spotkań
								</span>
								<span
									className={styles.pillarPercentage}
									style={{ color: getColor(pillar.attendance_percentage) }}
								>
									{pillar.attendance_percentage.toFixed(1)}%
								</span>
							</button>

							{isExpanded && (
								<div className={styles.membersList}>
									{isLoading ? (
										<div className={styles.membersLoading}>
											Ładowanie członków...
										</div>
									) : pillarMembers.length === 0 ? (
										<div className={styles.membersEmpty}>
											Brak danych o członkach
										</div>
									) : (
										pillarMembers.map((m) => (
											<div key={m.id} className={styles.memberRow}>
												<span className={styles.memberName}>
													{m.first_name} {m.last_name}
												</span>
												<span className={styles.memberEmail}>{m.email}</span>
												<span className={styles.memberStats}>
													{m.present_count}/{m.total_meetings}
												</span>
												<span
													className={styles.memberPercentage}
													style={{
														color: getColor(m.attendance_percentage),
													}}
												>
													{m.attendance_percentage.toFixed(1)}%
												</span>
											</div>
										))
									)}

									{/* Subteamy w tym filarze */}
									{stLoading ? (
										<div className={styles.subteamsBlock}>
											<div className={styles.membersLoading}>
												Ładowanie podzespołów...
											</div>
										</div>
									) : stList.length > 0 ? (
										<div className={styles.subteamsBlock}>
											<h4 className={styles.subteamsTitle}>Podzespoły</h4>
											{stList.map((st) => {
												const isSubExpanded = expandedSubteam === st.subteam_id;
												const stMembers = subteamMembers[st.subteam_id] || [];
												const stMembersLoadingNow =
													subteamMembersLoading === st.subteam_id;

												return (
													<div
														key={st.subteam_id}
														className={styles.subteamRow}
													>
														<button
															className={styles.subteamHeader}
															onClick={() => toggleSubteam(st.subteam_id)}
														>
															{isSubExpanded ? (
																<ChevronDown size={14} />
															) : (
																<ChevronRight size={14} />
															)}
															<span className={styles.subteamName}>
																{st.subteam_name}
															</span>
															<span className={styles.subteamMeta}>
																{st.members_count} osób
															</span>
															<span
																className={styles.subteamPercentage}
																style={{
																	color: getColor(st.attendance_percentage),
																}}
															>
																{st.attendance_percentage.toFixed(1)}%
															</span>
														</button>

														{isSubExpanded && (
															<div className={styles.subteamMembers}>
																{stMembersLoadingNow ? (
																	<div className={styles.membersLoading}>
																		Ładowanie...
																	</div>
																) : stMembers.length === 0 ? (
																	<div className={styles.membersEmpty}>
																		Brak członków
																	</div>
																) : (
																	stMembers.map((m) => (
																		<div
																			key={m.id}
																			className={styles.memberRow}
																		>
																			<span className={styles.memberName}>
																				{m.first_name} {m.last_name}
																			</span>
																			<span className={styles.memberEmail}>
																				{m.email}
																			</span>
																			<span className={styles.memberStats}>
																				{m.present_count}/{m.total_meetings}
																			</span>
																			<span
																				className={styles.memberPercentage}
																				style={{
																					color: getColor(
																						m.attendance_percentage,
																					),
																				}}
																			>
																				{m.attendance_percentage.toFixed(1)}%
																			</span>
																		</div>
																	))
																)}
															</div>
														)}
													</div>
												);
											})}
										</div>
									) : null}
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Wykres trendu wybranego filaru */}
			{chartPillar && (
				<div className={styles.trendSection}>
					<h3 className={styles.trendTitle}>
						Trend frekwencji –{" "}
						{pillars.find((p) => p.pillar_name === chartPillar)?.pillar_label ??
							chartPillar}
					</h3>
					{chartLoading ? (
						<div className={styles.chartLoading}>Ładowanie wykresu...</div>
					) : chartData.length === 0 ? (
						<div className={styles.chartEmpty}>Brak danych do wyświetlenia</div>
					) : (
						<ResponsiveContainer width="100%" height={260}>
							<LineChart
								data={chartData}
								margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
							>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="label" tick={{ fontSize: 12 }} />
								<YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
								<Tooltip formatter={(v) => [`${v}%`, "Frekwencja"]} />
								<Legend />
								<Line
									type="monotone"
									dataKey="percentage"
									name="Frekwencja"
									stroke="#2563eb"
									strokeWidth={2}
									dot={{ r: 4 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					)}
				</div>
			)}
		</section>
	);
}
