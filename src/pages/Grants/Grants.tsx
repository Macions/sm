import { useEffect, useState } from "react";
import { Award, Plus, RefreshCw, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./Grants.module.css";
import { GrantCard, type Grant } from "./GrantCard";
import { GrantModal } from "./GrantModal";
import { GrantTeamSection } from "./GrantTeamSection";
import { GrantDetailModal } from "./GrantDetailModal";
import { RecruitmentModal } from "./RecruitmentModal";

const CATEGORY_LABELS: Record<string, string> = {
	upcoming: "Przyszłe",
	current: "Aktualne",
	archived: "Archiwalne",
};

export default function Grants() {
	const [grants, setGrants] = useState<Grant[]>([]);
	const [loading, setLoading] = useState(true);
	const [canManage, setCanManage] = useState(false);

	const [search, setSearch] = useState("");
	const [filterCategory, setFilterCategory] = useState<string>("all");
	const [filterWorkStatus, setFilterWorkStatus] = useState<string>("all");
	const [onlyWithOpenRecruitment, setOnlyWithOpenRecruitment] = useState(false);

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingGrant, setEditingGrant] = useState<Grant | null>(null);
	const [detailGrantId, setDetailGrantId] = useState<string | null>(null);
	const [recruitmentGrantId, setRecruitmentGrantId] = useState<string | null>(
		null,
	);

	const fetchGrants = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("accessToken");
			const params = new URLSearchParams();
			if (search) params.set("search", search);
			if (filterCategory !== "all") params.set("category", filterCategory);
			if (filterWorkStatus !== "all")
				params.set("workStatus", filterWorkStatus);
			if (onlyWithOpenRecruitment) params.set("hasRecruitment", "open");

			const res = await fetch(`/api/grants?${params.toString()}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error("Błąd pobierania grantów");
			const data = await res.json();
			setGrants(data.grants || []);
			setCanManage(data.canManage || false);
		} catch (err) {
			console.error(err);
			toast.error("Nie udało się pobrać grantów");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchGrants();

	}, [search, filterCategory, filterWorkStatus, onlyWithOpenRecruitment]);

	const handleDelete = async (grant: Grant) => {
		if (!confirm(`Usunąć grant „${grant.name}”?`)) return;
		try {
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/grants/${grant.id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Błąd usuwania");
			}
			toast.success("Grant usunięty");
			await fetchGrants();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Nie udało się usunąć");
		}
	};

	const grouped = {
		upcoming: grants.filter((g) => g.category === "upcoming"),
		current: grants.filter((g) => g.category === "current"),
		archived: grants.filter((g) => g.category === "archived"),
	};

	if (loading) {
		return (
			<div className={styles.page}>
				<div className={styles.spinner} />
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<div className={styles.headerLeft}>
					<div className={styles.titleRow}>
						<Award size={22} />
						<h1 className={styles.title}>Granty</h1>
					</div>
					<p className={styles.subtitle}>
						Baza możliwości finansowania projektów oraz narzędzie pracy zespołu
						grantowego.
					</p>
				</div>
				<div className={styles.headerRight}>
					<button
						className={styles.refreshBtn}
						onClick={fetchGrants}
						title="Odśwież"
					>
						<RefreshCw size={16} />
					</button>
					{canManage && (
						<button
							className={styles.addBtn}
							onClick={() => setIsCreateOpen(true)}
						>
							<Plus size={16} />
							Dodaj grant
						</button>
					)}
				</div>
			</div>

			<GrantTeamSection />

			<div className={styles.filters}>
				<div className={styles.searchWrap}>
					<Search size={16} className={styles.searchIcon} />
					<input
						type="text"
						className={styles.searchInput}
						placeholder="Szukaj grantu po nazwie lub opisie..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					{search && (
						<button
							className={styles.searchClear}
							onClick={() => setSearch("")}
						>
							<X size={14} />
						</button>
					)}
				</div>

				<select
					className={styles.select}
					value={filterCategory}
					onChange={(e) => setFilterCategory(e.target.value)}
				>
					<option value="all">Wszystkie kategorie</option>
					<option value="upcoming">Przyszłe</option>
					<option value="current">Aktualne</option>
					<option value="archived">Archiwalne</option>
				</select>

				<select
					className={styles.select}
					value={filterWorkStatus}
					onChange={(e) => setFilterWorkStatus(e.target.value)}
				>
					<option value="all">Wszystkie statusy pracy</option>
					<option value="analyzed">Analizowany</option>
					<option value="in_preparation">W przygotowaniu</option>
					<option value="submitted">Złożony</option>
					<option value="accepted">Zaakceptowany</option>
					<option value="rejected">Odrzucony</option>
					<option value="no_application">Bez aplikacji</option>
				</select>

				<label className={styles.checkbox}>
					<input
						type="checkbox"
						checked={onlyWithOpenRecruitment}
						onChange={(e) => setOnlyWithOpenRecruitment(e.target.checked)}
					/>
					<span>Tylko z otwartą rekrutacją</span>
				</label>
			</div>

			{grants.length === 0 ? (
				<div className={styles.empty}>
					<Award size={48} />
					<h3>Brak grantów</h3>
					<p>
						{canManage
							? 'Kliknij "Dodaj grant", aby dodać pierwszy.'
							: "Nie znaleziono grantów spełniających kryteria."}
					</p>
				</div>
			) : (
				["current", "upcoming", "archived"].map((cat) => {
					const items = grouped[cat as keyof typeof grouped];
					if (!items || items.length === 0) return null;
					return (
						<div key={cat} className={styles.section}>
							<h2 className={styles.sectionTitle}>
								{CATEGORY_LABELS[cat]}
								<span className={styles.sectionCount}>{items.length}</span>
							</h2>
							<div className={styles.list}>
								{items.map((grant) => (
									<GrantCard
										key={grant.id}
										grant={grant}
										canManage={canManage}
										onView={(g) => setDetailGrantId(g.id)}
										onEdit={(g) => setEditingGrant(g)}
										onDelete={handleDelete}
										onAddRecruitment={(g) => setRecruitmentGrantId(g.id)}
									/>
								))}
							</div>
						</div>
					);
				})
			)}

			{isCreateOpen && (
				<GrantModal
					isOpen={true}
					onClose={() => setIsCreateOpen(false)}
					onSaved={fetchGrants}
				/>
			)}
			{editingGrant && (
				<GrantModal
					isOpen={true}
					grant={editingGrant}
					onClose={() => setEditingGrant(null)}
					onSaved={fetchGrants}
				/>
			)}
			{detailGrantId && (
				<GrantDetailModal
					grantId={detailGrantId}
					canManage={canManage}
					onClose={() => setDetailGrantId(null)}
					onChanged={fetchGrants}
				/>
			)}
			{recruitmentGrantId && (
				<RecruitmentModal
					isOpen={true}
					grantId={recruitmentGrantId}
					onClose={() => setRecruitmentGrantId(null)}
					onSaved={async () => {
						setRecruitmentGrantId(null);
						await fetchGrants();
					}}
				/>
			)}
		</div>
	);
}