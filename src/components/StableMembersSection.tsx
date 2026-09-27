import { useEffect, useState } from "react";
import {
	RefreshCw,
	IdCard,
	Search,
	X,
	PauseCircle,
	CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { logger } from "@/utils/logger";
import styles from "./StableMembersSection.module.css";

interface StableMember {
	id: number;
	legitymacja: number;
	full_name: string;
	email: string;
	pay_from: string | null;
	suspended_until: string | null;
	suspended_months: string | null;
}

export function StableMembersSection() {
	const [members, setMembers] = useState<StableMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [search, setSearch] = useState("");
	const [showAll, setShowAll] = useState(false);

	const token = () => localStorage.getItem("accessToken") || "";

	const fetchMembers = async () => {
		try {
			setLoading(true);
			const res = await fetch("/api/admin/stable-members", {
				headers: { Authorization: `Bearer ${token()}` },
			});
			if (!res.ok) throw new Error("Błąd pobierania stałych członków");
			const data = await res.json();
			setMembers(data.members || []);
		} catch (err) {
			logger.error("Błąd:", err);
			toast.error("Nie udało się pobrać stałych członków");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		fetchMembers();
	}, []);

	const filtered = members.filter((m) => {
		const q = search.toLowerCase().trim();
		if (!q) return true;
		return (
			m.full_name.toLowerCase().includes(q) ||
			m.email.toLowerCase().includes(q) ||
			String(m.legitymacja).includes(q)
		);
	});

	const displayMembers = showAll ? filtered : filtered.slice(0, 10);
	const hasMore = filtered.length > 10;

	const formatDate = (d: string | null) => {
		if (!d) return "—";
		return new Date(d).toLocaleDateString("pl-PL");
	};

	const isSuspended = (m: StableMember) => {
		if (!m.suspended_until) return false;
		return new Date(m.suspended_until) > new Date();
	};

	const handleRefresh = () => {
		setRefreshing(true);
		fetchMembers();
	};

	if (loading) {
		return (
			<section className={styles.section}>
				<div className={styles.loading}>
					<div className={styles.loading__spinner} />
					<span>Ładowanie stałych członków...</span>
				</div>
			</section>
		);
	}

	return (
		<section className={styles.section}>
			<div className={styles.section__header}>
				<div className={styles.section__headerLeft}>
					<h2 className={styles.section__title}>
						<IdCard size={20} style={{ display: "inline", marginRight: 8 }} />
						Stali członkowie (z papierami SM)
					</h2>
					<p className={styles.section__subtitle}>
						Członkowie posiadający numer legitymacji SM.
						<strong style={{ color: "#1d4ed8", marginLeft: 8 }}>
							({filtered.length})
						</strong>
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

			<div className={styles.filters}>
				<div className={styles.filters__search}>
					<Search size={14} className={styles.filters__searchIcon} />
					<input
						type="text"
						className={styles.filters__input}
						placeholder="Szukaj po imieniu, emailu lub numerze legitymacji..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					{search && (
						<button
							className={styles.filters__clear}
							onClick={() => setSearch("")}
						>
							<X size={14} />
						</button>
					)}
				</div>
			</div>

			{displayMembers.length === 0 ? (
				<div className={styles.empty}>
					<p>Nie znaleziono członków spełniających kryteria.</p>
				</div>
			) : (
				<>
					<div className={styles.list}>
						{displayMembers.map((m) => {
							const suspended = isSuspended(m);
							return (
								<div key={m.id} className={styles.item}>
									<div className={styles.item__legitymacja}>
										#{m.legitymacja}
									</div>
									<div className={styles.item__info}>
										<span className={styles.item__name}>
											{m.full_name || "Nieznany"}
										</span>
										<span className={styles.item__email}>{m.email || "—"}</span>
									</div>
									<div className={styles.item__meta}>
										{suspended ? (
											<span className={styles.item__suspended}>
												<PauseCircle size={12} />
												Zawieszony do {formatDate(m.suspended_until)}
											</span>
										) : (
											<span className={styles.item__active}>
												<CheckCircle size={12} />
												Aktywny
											</span>
										)}
									</div>
								</div>
							);
						})}
					</div>

					{hasMore && !showAll && (
						<div className={styles.showMore}>
							<button
								className={styles.showMore__btn}
								onClick={() => setShowAll(true)}
							>
								Pokaż więcej ({filtered.length - 10} pozostałych)
							</button>
						</div>
					)}

					{showAll && hasMore && (
						<div className={styles.showMore}>
							<button
								className={styles.showMore__btn}
								onClick={() => setShowAll(false)}
							>
								Pokaż mniej
							</button>
						</div>
					)}
				</>
			)}
		</section>
	);
}
