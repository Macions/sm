import { useEffect, useState } from "react";
import {
	Plus,
	X,
	CheckCircle,
	XCircle,
	Clock,
	AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import styles from "./PillarChangeTab.module.css";

/* =========================
   TYPY
   ========================= */

interface PillarOption {
	id: number;
	name: string;
}

interface PillarRequest {
	id: number;
	user: {
		id: number;
		first_name: string;
		last_name: string;
		email: string;
	};
	fromPillar: PillarOption | null;
	toPillar: PillarOption | null;
	reason: string | null;
	status: "pending" | "approved" | "rejected" | "cancelled";
	reviewer: { id: number; first_name: string; last_name: string } | null;
	reviewed_at: string | null;
	review_comment: string | null;
	created_at: string;
}

/* =========================
   HELPERS
   ========================= */

const API_BASE = "/api";

function getToken(): string | null {
	return (
		localStorage.getItem("accessToken") ||
		localStorage.getItem("token") ||
		localStorage.getItem("authToken")
	);
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
	const token = getToken();
	const res = await fetch(url, {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...(init?.headers || {}),
		},
		credentials: "include",
	});
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		let message = `HTTP ${res.status}`;
		try {
			const json = JSON.parse(text);
			if (json.error) message = json.error;
		} catch {
			// ignore
		}
		throw new Error(message);
	}
	return (await res.json()) as T;
}

const STATUS_LABEL: Record<string, string> = {
	pending: "Oczekujący",
	approved: "Zatwierdzony",
	rejected: "Odrzucony",
	cancelled: "Anulowany",
};

function fullName(p?: { first_name?: string; last_name?: string } | null) {
	if (!p) return "—";
	const n = `${p.first_name || ""} ${p.last_name || ""}`.trim();
	return n || "—";
}

function fmtDate(v?: string | null) {
	if (!v) return "—";
	const d = new Date(v);
	if (Number.isNaN(d.getTime())) return "—";
	return d.toLocaleDateString("pl-PL", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/* =========================
   KOMPONENT
   ========================= */

export default function PillarChangeTab() {
	const { user } = useAuth();
	const isAdminOrBoard = user?.role === "admin" || user?.role === "board";

	const [pillars, setPillars] = useState<PillarOption[]>([]);
	const [requests, setRequests] = useState<PillarRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// formularz nowego wniosku
	const [formOpen, setFormOpen] = useState(false);
	const [toPillarId, setToPillarId] = useState<string>("");
	const [reason, setReason] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	// rozpatrywanie (admin/board)
	const [reviewingId, setReviewingId] = useState<number | null>(null);
	const [reviewComment, setReviewComment] = useState("");
	const [reviewSubmitting, setReviewSubmitting] = useState(false);

	// ── Ładowanie danych ──
	const loadAll = async () => {
		setLoading(true);
		setError(null);
		try {
			const [pillarsRes, requestsRes] = await Promise.all([
				apiFetch<any[]>(`${API_BASE}/teams`),
				apiFetch<PillarRequest[]>(`${API_BASE}/pillar-requests`),
			]);

			const filary = pillarsRes
				.filter((t) => String(t.name || "").startsWith("Filar "))
				.map((t) => ({ id: t.id, name: t.name }));

			setPillars(filary);
			setRequests(requestsRes);
		} catch (e: any) {
			setError(e?.message || "Nie udało się pobrać danych");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadAll();
	}, []);

	// ── Złożenie wniosku ──
	const handleSubmit = async () => {
		if (!toPillarId) {
			setSubmitError("Wybierz filar docelowy");
			return;
		}
		setSubmitting(true);
		setSubmitError(null);
		try {
			await apiFetch(`${API_BASE}/pillar-requests`, {
				method: "POST",
				body: JSON.stringify({
					toPillarId: Number(toPillarId),
					reason: reason.trim() || undefined,
				}),
			});
			setFormOpen(false);
			setToPillarId("");
			setReason("");
			await loadAll();
		} catch (e: any) {
			setSubmitError(e?.message || "Nie udało się złożyć wniosku");
		} finally {
			setSubmitting(false);
		}
	};

	// ── Rozpatrzenie wniosku ──
	const handleReview = async (id: number, status: "approved" | "rejected") => {
		setReviewSubmitting(true);
		try {
			await apiFetch(`${API_BASE}/pillar-requests/${id}`, {
				method: "PUT",
				body: JSON.stringify({
					status,
					comment: reviewComment.trim() || undefined,
				}),
			});
			setReviewingId(null);
			setReviewComment("");
			await loadAll();
		} catch (e: any) {
			alert(e?.message || "Nie udało się rozpatrzyć wniosku");
		} finally {
			setReviewSubmitting(false);
		}
	};

	// ── Anulowanie własnego ──
	const handleCancel = async (id: number) => {
		if (!confirm("Czy na pewno chcesz anulować ten wniosek?")) return;
		try {
			await apiFetch(`${API_BASE}/pillar-requests/${id}`, {
				method: "PUT",
				body: JSON.stringify({ status: "cancelled" }),
			});
			await loadAll();
		} catch (e: any) {
			alert(e?.message || "Nie udało się anulować");
		}
	};

	// ── Stany brzegowe ──
	if (loading) {
		return <div className={styles.stateBox}>Ładowanie wniosków…</div>;
	}
	if (error) {
		return (
			<div className={styles.stateBox + " " + styles.stateError}>{error}</div>
		);
	}

	const myPendingRequest = requests.find(
		(r) => r.user.id === Number(user?.id) && r.status === "pending",
	);

	return (
		<div className={styles.wrapper}>
			{/* ---------- NAGŁÓWEK + PRZYCISK ---------- */}
			<div className={styles.header}>
				<div>
					<h2 className={styles.title}>Zmiana filaru</h2>
					<p className={styles.subtitle}>
						Złóż wniosek o przeniesienie do innego filaru. Zostanie on
						rozpatrzony przez zarząd.
					</p>
				</div>

				{!formOpen && !myPendingRequest && (
					<button
						className={styles.primaryBtn}
						onClick={() => setFormOpen(true)}
					>
						<Plus size={16} />
						Zgłoś zmianę filaru
					</button>
				)}
			</div>

			{/* ---------- INFO: MASZ JUŻ PENDING ---------- */}
			{myPendingRequest && !formOpen && (
				<div className={styles.infoBox}>
					<Clock size={18} />
					Masz już wniosek w trakcie rozpatrywania. Poczekaj na decyzję zarządu.
				</div>
			)}

			{/* ---------- FORMULARZ ---------- */}
			{formOpen && (
				<div className={styles.formCard}>
					<div className={styles.formHeader}>
						<h3 className={styles.formTitle}>Nowy wniosek</h3>
						<button
							className={styles.closeBtn}
							onClick={() => {
								setFormOpen(false);
								setSubmitError(null);
							}}
							aria-label="Zamknij"
						>
							<X size={18} />
						</button>
					</div>

					<div className={styles.formBody}>
						<label className={styles.label}>
							Filar docelowy
							<select
								className={styles.select}
								value={toPillarId}
								onChange={(e) => setToPillarId(e.target.value)}
							>
								<option value="">— wybierz filar —</option>
								{pillars.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name}
									</option>
								))}
							</select>
						</label>

						<label className={styles.label}>
							Powód (opcjonalnie)
							<textarea
								className={styles.textarea}
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								rows={4}
								placeholder="Dlaczego chcesz zmienić filar?"
							/>
						</label>

						{submitError && (
							<div className={styles.errorBox}>
								<AlertCircle size={16} />
								{submitError}
							</div>
						)}
					</div>

					<div className={styles.formFooter}>
						<button
							className={styles.secondaryBtn}
							onClick={() => setFormOpen(false)}
							disabled={submitting}
						>
							Anuluj
						</button>
						<button
							className={styles.primaryBtn}
							onClick={handleSubmit}
							disabled={submitting}
						>
							{submitting ? "Wysyłanie…" : "Wyślij wniosek"}
						</button>
					</div>
				</div>
			)}

			{/* ---------- LISTA WNIOSKÓW ---------- */}
			<div className={styles.listSection}>
				<h3 className={styles.listTitle}>
					{isAdminOrBoard ? "Wszystkie wnioski" : "Moje wnioski"}{" "}
					<span className={styles.listCount}>({requests.length})</span>
				</h3>

				{requests.length === 0 ? (
					<div className={styles.stateBox}>Brak wniosków.</div>
				) : (
					<div className={styles.list}>
						{requests.map((r) => (
							<div key={r.id} className={styles.requestCard}>
								<div className={styles.requestHeader}>
									<div className={styles.requestUser}>
										<div className={styles.avatar}>
											{(r.user?.first_name?.[0] || "") +
												(r.user?.last_name?.[0] || "")}
										</div>
										<div>
											<div className={styles.userName}>{fullName(r.user)}</div>
											<div className={styles.userEmail}>
												{r.user?.email || "—"}
											</div>
										</div>
									</div>

									<span
										className={`${styles.statusBadge} ${
											styles[`status_${r.status}`] || ""
										}`}
									>
										{STATUS_LABEL[r.status] || r.status}
									</span>
								</div>

								<div className={styles.requestMeta}>
									<span>
										<b>Z:</b> {r.fromPillar?.name || "—"}
									</span>
									<span>
										<b>Na:</b> {r.toPillar?.name || "—"}
									</span>
									<span>
										<b>Złożono:</b> {fmtDate(r.created_at)}
									</span>
								</div>

								{r.reason && (
									<div className={styles.reasonBox}>
										<b>Powód:</b> {r.reason}
									</div>
								)}

								{r.status !== "pending" && r.reviewed_at && (
									<div className={styles.reviewInfo}>
										Rozpatrzono przez <b>{fullName(r.reviewer)}</b> (
										{fmtDate(r.reviewed_at)})
										{r.review_comment && (
											<>
												<br />
												<b>Komentarz:</b> {r.review_comment}
											</>
										)}
									</div>
								)}

								{/* Akcje */}
								<div className={styles.requestActions}>
									{isAdminOrBoard && r.status === "pending" && (
										<>
											{reviewingId === r.id ? (
												<>
													<textarea
														className={styles.textarea}
														value={reviewComment}
														onChange={(e) => setReviewComment(e.target.value)}
														placeholder="Komentarz (opcjonalnie)"
														rows={2}
													/>
													<div className={styles.reviewButtons}>
														<button
															className={styles.approveBtn}
															onClick={() => handleReview(r.id, "approved")}
															disabled={reviewSubmitting}
														>
															<CheckCircle size={14} />
															Zatwierdź
														</button>
														<button
															className={styles.rejectBtn}
															onClick={() => handleReview(r.id, "rejected")}
															disabled={reviewSubmitting}
														>
															<XCircle size={14} />
															Odrzuć
														</button>
														<button
															className={styles.secondaryBtn}
															onClick={() => {
																setReviewingId(null);
																setReviewComment("");
															}}
															disabled={reviewSubmitting}
														>
															Anuluj
														</button>
													</div>
												</>
											) : (
												<button
													className={styles.primaryBtn}
													onClick={() => {
														setReviewingId(r.id);
														setReviewComment("");
													}}
												>
													Rozpatrz
												</button>
											)}
										</>
									)}

									{!isAdminOrBoard &&
										r.user.id === Number(user?.id) &&
										r.status === "pending" && (
											<button
												className={styles.secondaryBtn}
												onClick={() => handleCancel(r.id)}
											>
												Anuluj wniosek
											</button>
										)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
