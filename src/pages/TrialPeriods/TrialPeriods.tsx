import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
	ClipboardCheck,
	Search,
	X,
	Calendar,
	Users,
	AlertCircle,
	CheckCircle,
	Save,
	UserCheck,
} from "lucide-react";
import styles from "./TrialPeriods.module.css";
import { logger } from "@/utils/logger";

type TrialUser = {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	joinDate: string | null;
	teams: string[];
	papersDueDate: string | null;
	papersSubmitted: boolean;
	papersSubmittedAt: string | null;
	trialEndDate: string | null;
	trialNotes: string | null;
};

type FilterType = "all" | "papers_overdue" | "trial_ending" | "papers_pending";

export default function TrialPeriods() {
	const navigate = useNavigate();
	const [users, setUsers] = useState<TrialUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [filter, setFilter] = useState<FilterType>("all");
	const [editingDateFor, setEditingDateFor] = useState<string | null>(null);
	const [tempDate, setTempDate] = useState("");
	const [savingId, setSavingId] = useState<string | null>(null);
	const [currentUser, setCurrentUser] = useState<any>(null);

	useEffect(() => {
		const checkAccess = async () => {
			try {
				const token = localStorage.getItem("accessToken");
				const res = await fetch("/api/profile", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok) throw new Error("Brak profilu");
				const profile = await res.json();

				const isMaja = String(profile.id) === "294";
				const isAdminOrBoard =
					profile.role === "admin" || profile.role === "board";

				if (!isMaja && !isAdminOrBoard) {
					toast.error("Brak dostępu do tej zakładki");
					navigate("/dashboard");
					return;
				}
				setCurrentUser(profile);
			} catch (e) {
				logger.error("Błąd sprawdzania uprawnień:", e);
				navigate("/dashboard");
			}
		};
		checkAccess();
	}, [navigate]);


	const fetchUsers = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("accessToken");
			const res = await fetch("/api/trial-periods", {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error("Błąd pobierania");
			const data = await res.json();
			setUsers(data);
		} catch (error) {
			logger.error("Błąd pobierania okresów próbnych:", error);
			toast.error("Nie udało się pobrać listy");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (currentUser) fetchUsers();
	}, [currentUser]);


	const savePapersDate = async (userId: string, date: string | null) => {
		try {
			setSavingId(userId);
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/trial-periods/${userId}/papers`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ papersDueDate: date }),
			});
			if (!res.ok) throw new Error("Błąd zapisu");
			const updated = await res.json();
			setUsers((prev) =>
				prev.map((u) =>
					u.id === userId ? { ...u, papersDueDate: updated.papersDueDate } : u,
				),
			);
			toast.success("Data papierów zapisana");
		} catch (error) {
			logger.error("Błąd zapisu daty:", error);
			toast.error("Nie udało się zapisać daty");
		} finally {
			setSavingId(null);
			setEditingDateFor(null);
			setTempDate("");
		}
	};


	const togglePapersSubmitted = async (userId: string, current: boolean) => {
		try {
			setSavingId(userId);
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/trial-periods/${userId}/papers`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ papersSubmitted: !current }),
			});
			if (!res.ok) throw new Error("Błąd zapisu");
			const updated = await res.json();
			setUsers((prev) =>
				prev.map((u) =>
					u.id === userId
						? {
							...u,
							papersSubmitted: updated.papersSubmitted,
							papersSubmittedAt: updated.papersSubmittedAt,
						}
						: u,
				),
			);
			toast.success(
				updated.papersSubmitted
					? "Oznaczono jako wysłane"
					: "Cofnięto oznaczenie",
			);
		} catch (error) {
			logger.error("Błąd zapisu:", error);
			toast.error("Nie udało się zapisać");
		} finally {
			setSavingId(null);
		}
	};


	const finishTrial = async (userId: string, name: string) => {
		if (!confirm(`Zakończyć okres próbny dla ${name}?`)) return;
		try {
			setSavingId(userId);
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/trial-periods/${userId}/finish`, {
				method: "PUT",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error("Błąd zapisu");
			setUsers((prev) => prev.filter((u) => u.id !== userId));
			toast.success(`Zakończono okres próbny dla ${name}`);
		} catch (error) {
			logger.error("Błąd kończenia okresu:", error);
			toast.error("Nie udało się zakończyć okresu");
		} finally {
			setSavingId(null);
		}
	};


	const filteredUsers = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const in14Days = new Date(today);
		in14Days.setDate(in14Days.getDate() + 14);

		return users.filter((u) => {
			const search = searchTerm.toLowerCase();
			const matchesSearch =
				!search ||
				u.firstName.toLowerCase().includes(search) ||
				u.lastName.toLowerCase().includes(search) ||
				u.email.toLowerCase().includes(search) ||
				u.teams.some((t) => t.toLowerCase().includes(search));

			if (!matchesSearch) return false;

			if (filter === "papers_overdue") {
				if (!u.papersDueDate || u.papersSubmitted) return false;
				return new Date(u.papersDueDate) < today;
			}

			if (filter === "trial_ending") {
				if (!u.trialEndDate) return false;
				const end = new Date(u.trialEndDate);
				return end >= today && end <= in14Days;
			}

			if (filter === "papers_pending") {
				return !u.papersSubmitted;
			}

			return true;
		});
	}, [users, searchTerm, filter]);


	const stats = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const in14Days = new Date(today);
		in14Days.setDate(in14Days.getDate() + 14);

		return {
			total: users.length,
			papersOverdue: users.filter(
				(u) =>
					u.papersDueDate &&
					!u.papersSubmitted &&
					new Date(u.papersDueDate) < today,
			).length,
			papersPending: users.filter((u) => !u.papersSubmitted).length,
			trialEndingSoon: users.filter((u) => {
				if (!u.trialEndDate) return false;
				const end = new Date(u.trialEndDate);
				return end >= today && end <= in14Days;
			}).length,
		};
	}, [users]);

	const formatDate = (d: string | null) => {
		if (!d) return "—";
		return new Date(d).toLocaleDateString("pl-PL", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	const isOverdue = (d: string | null, submitted: boolean) => {
		if (!d || submitted) return false;
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return new Date(d) < today;
	};

	if (loading || !currentUser) {
		return (
			<div className={styles.trialPeriods}>
				<div className={styles.loading}>
					<div className={styles.loading__spinner}></div>
					<p>Ładowanie...</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.trialPeriods}>
			<div className={styles.header}>
				<div>
					<h1 className={styles.header__title}>Okresy próbne</h1>
					<p className={styles.header__subtitle}>
						Zarządzaj okresami próbnymi członków i terminami wysyłki papierów
					</p>
				</div>
			</div>


			<div className={styles.stats}>
				<div className={styles.statCard}>
					<Users size={20} className={styles.statCard__icon} />
					<div>
						<div className={styles.statCard__value}>{stats.total}</div>
						<div className={styles.statCard__label}>Wszyscy próbni</div>
					</div>
				</div>
				<div className={`${styles.statCard} ${styles.statCardWarning}`}>
					<AlertCircle size={20} className={styles.statCard__icon} />
					<div>
						<div className={styles.statCard__value}>{stats.papersOverdue}</div>
						<div className={styles.statCard__label}>Po terminie papierów</div>
					</div>
				</div>
				<div className={`${styles.statCard} ${styles.statCardInfo}`}>
					<Calendar size={20} className={styles.statCard__icon} />
					<div>
						<div className={styles.statCard__value}>
							{stats.trialEndingSoon}
						</div>
						<div className={styles.statCard__label}>
							Koniec okresu {"<"} 14 dni
						</div>
					</div>
				</div>
				<div className={`${styles.statCard} ${styles.statCardNeutral}`}>
					<CheckCircle size={20} className={styles.statCard__icon} />
					<div>
						<div className={styles.statCard__value}>{stats.papersPending}</div>
						<div className={styles.statCard__label}>Papiery niewysłane</div>
					</div>
				</div>
			</div>


			<div className={styles.filters}>
				<div className={styles.filters__search}>
					<Search size={18} className={styles.filters__searchIcon} />
					<input
						type="text"
						className={styles.filters__searchInput}
						placeholder="Szukaj po imieniu, nazwisku, emailu lub zespole..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					{searchTerm && (
						<button
							className={styles.filters__clear}
							onClick={() => setSearchTerm("")}
						>
							<X size={14} />
						</button>
					)}
				</div>

				<div className={styles.filters__group}>
					<select
						className={styles.filters__select}
						value={filter}
						onChange={(e) => setFilter(e.target.value as FilterType)}
					>
						<option value="all">Wszyscy</option>
						<option value="papers_overdue">Po terminie papierów</option>
						<option value="trial_ending">Koniec okresu {"<"} 14 dni</option>
						<option value="papers_pending">Papiery niewysłane</option>
					</select>
				</div>
			</div>


			{filteredUsers.length === 0 ? (
				<div className={styles.emptyState}>
					<ClipboardCheck size={48} className={styles.emptyState__icon} />
					<h3 className={styles.emptyState__title}>Brak wyników</h3>
					<p className={styles.emptyState__description}>
						{searchTerm || filter !== "all"
							? "Nie znaleziono próbnych spełniających kryteria."
							: "Nie ma obecnie nikogo na okresie próbnym."}
					</p>
				</div>
			) : (
				<div className={styles.tableWrapper}>
					<table className={styles.table}>
						<thead>
							<tr>
								<th>Osoba</th>
								<th>Zespoły</th>
								<th>Data dołączenia</th>
								<th>Data papierów</th>
								<th>Papiery wysłane</th>
								<th>Koniec okresu</th>
								<th>Akcje</th>
							</tr>
						</thead>
						<tbody>
							{filteredUsers.map((u) => (
								<tr key={u.id} className={styles.tableRow}>
									<td>
										<div className={styles.personCell}>
											<div className={styles.personAvatar}>
												{u.firstName[0]}
												{u.lastName[0]}
											</div>
											<div>
												<div className={styles.personName}>
													{u.firstName} {u.lastName}
												</div>
												<div className={styles.personEmail}>{u.email}</div>
											</div>
										</div>
									</td>
									<td>
										<div className={styles.teamsList}>
											{u.teams.length === 0 ? (
												<span className={styles.noTeams}>—</span>
											) : (
												u.teams.map((t) => (
													<span key={t} className={styles.teamTag}>
														{t}
													</span>
												))
											)}
										</div>
									</td>
									<td>{formatDate(u.joinDate)}</td>
									<td>
										{editingDateFor === u.id ? (
											<div className={styles.dateEdit}>
												<input
													type="date"
													className={styles.dateInput}
													value={tempDate}
													onChange={(e) => setTempDate(e.target.value)}
													autoFocus
												/>
												<button
													className={styles.dateSave}
													onClick={() => savePapersDate(u.id, tempDate || null)}
													disabled={savingId === u.id}
												>
													<Save size={14} />
												</button>
												<button
													className={styles.dateCancel}
													onClick={() => {
														setEditingDateFor(null);
														setTempDate("");
													}}
												>
													<X size={14} />
												</button>
											</div>
										) : (
											<button
												className={`${styles.dateCell} ${isOverdue(u.papersDueDate, u.papersSubmitted) ? styles.dateCellOverdue : ""}`}
												onClick={() => {
													setEditingDateFor(u.id);
													setTempDate(u.papersDueDate || "");
												}}
											>
												{formatDate(u.papersDueDate)}
												{isOverdue(u.papersDueDate, u.papersSubmitted) && (
													<AlertCircle size={14} />
												)}
											</button>
										)}
									</td>
									<td>
										<label className={styles.checkboxLabel}>
											<input
												type="checkbox"
												checked={u.papersSubmitted}
												onChange={() =>
													togglePapersSubmitted(u.id, u.papersSubmitted)
												}
												disabled={savingId === u.id}
												className={styles.checkbox}
											/>
											<span className={styles.checkboxText}>
												{u.papersSubmitted
													? `Tak (${formatDate(u.papersSubmittedAt)})`
													: "Nie"}
											</span>
										</label>
									</td>
									<td>{formatDate(u.trialEndDate)}</td>
									<td>
										<button
											className={styles.finishBtn}
											onClick={() =>
												finishTrial(u.id, `${u.firstName} ${u.lastName}`)
											}
											disabled={savingId === u.id}
											title="Zakończ okres próbny"
										>
											<UserCheck size={16} />
											Zakończ
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
