// frontend/src/pages/Ideas/Ideas.tsx
import { useEffect, useMemo, useState } from "react";
import { Lightbulb, Plus, CheckCircle2, Clock3, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./Ideas.module.css";
import { IdeaCard } from "./IdeaCard";
import { ConfirmModal } from "./ConfirmModal";
import { IdeaModal } from "./IdeaModal";
import { ManageIdeaModal } from "./ManageIdeaModal";

/**
 * Statusy pomysłów (dodatki / usprawnienia strony):
 * - pending     → nowy, czeka na review
 * - planned     → zaakceptowany, w planach
 * - in_progress → w trakcie realizacji
 * - done        → wykonany (wdrożony na stronę)
 * - rejected    → odrzucony
 */
export type IdeaStatus =
	| "pending"
	| "planned"
	| "in_progress"
	| "done"
	| "rejected";

export interface SystemIdea {
	id: string;
	title: string;
	description: string;
	category: string | null;
	status: IdeaStatus | string;
	statusLabel: string;
	adminNote: string | null;
	createdAt: string;
	updatedAt: string;
	reviewedAt: string | null;
	completedAt?: string | null;
	author: { id: string; firstName: string; lastName: string };
}

const STATUS_LABEL: Record<string, string> = {
	pending: "Oczekuje",
	planned: "W planach",
	in_progress: "W trakcie",
	done: "Wykonany",
	rejected: "Odrzucony",
};

type ConfirmState = {
	title?: string;
	message: string;
	confirmLabel?: string;
	variant?: "default" | "danger";
	onConfirm: () => Promise<void> | void;
};

export default function Ideas() {
	const [ideas, setIdeas] = useState<SystemIdea[]>([]);
	const [loading, setLoading] = useState(true);
	const [canManage, setCanManage] = useState(false);
	const [busyId, setBusyId] = useState<string | null>(null);

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingIdea, setEditingIdea] = useState<SystemIdea | null>(null);
	const [managingIdea, setManagingIdea] = useState<SystemIdea | null>(null);

	const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
	const [confirmBusy, setConfirmBusy] = useState(false);

	const fetchIdeas = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("accessToken");
			const res = await fetch("/api/system-ideas", {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error("Błąd pobierania");
			const data = await res.json();
			setIdeas(data.ideas || []);
			setCanManage(data.canManage || false);
		} catch (err) {
			console.error(err);
			toast.error("Nie udało się pobrać pomysłów");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchIdeas();
	}, []);

	// Szybkie statystyki dla admina
	const stats = useMemo(() => {
		const s: Record<string, number> = {
			pending: 0,
			planned: 0,
			in_progress: 0,
			done: 0,
			rejected: 0,
		};
		for (const idea of ideas) {
			if (s[idea.status] !== undefined) s[idea.status] += 1;
		}
		return s;
	}, [ideas]);

	// ── DELETE ─────────────────────────────────────────────
	const runDelete = async (idea: SystemIdea) => {
		try {
			setConfirmBusy(true);
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/system-ideas/${idea.id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Błąd usuwania");
			}
			toast.success("Pomysł usunięty");
			await fetchIdeas();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Nie udało się usunąć",
			);
		} finally {
			setConfirmBusy(false);
		}
	};

	const handleDelete = (idea: SystemIdea) => {
		setConfirmState({
			title: "Usunąć pomysł?",
			message: `Czy na pewno chcesz usunąć pomysł „${idea.title}”? Tej operacji nie można cofnąć.`,
			confirmLabel: "Usuń",
			variant: "danger",
			onConfirm: () => runDelete(idea),
		});
	};

	// ── QUICK STATUS ──────────────────────────────────────
	const runQuickStatus = async (idea: SystemIdea, status: IdeaStatus) => {
		try {
			setBusyId(idea.id);
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/system-ideas/${idea.id}/status`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ status }),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "Błąd zmiany statusu");
			}
			const label = STATUS_LABEL[status] ?? status;
			toast.success(`Oznaczono jako: ${label}`);
			await fetchIdeas();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Nie udało się zmienić statusu",
			);
		} finally {
			setBusyId(null);
		}
	};

	const handleQuickStatus = (idea: SystemIdea, status: IdeaStatus) => {
		const label = STATUS_LABEL[status] ?? status;
		setConfirmState({
			title: `Zmienić status na: ${label}?`,
			message: `Pomysł „${idea.title}” zostanie oznaczony jako: ${label}.`,
			confirmLabel: label,
			variant: status === "rejected" ? "danger" : "default",
			onConfirm: () => runQuickStatus(idea, status),
		});
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
						<h1 className={styles.title}>Pomysły na rozwój strony</h1>
					</div>
					<p className={styles.subtitle}>
						{canManage
							? "Wszystkie zgłoszone pomysły: dodatki, usprawnienia i zmiany na stronie."
							: "Twoje propozycje dodatków i usprawnień strony oraz ich status."}
					</p>
				</div>

				<button
					className={styles.addBtn}
					onClick={() => setIsCreateOpen(true)}
				>
					<Plus size={16} />
					Dodaj pomysł
				</button>
			</div>

			{/* Panel statystyk — tylko dla admina/board */}
			{canManage && ideas.length > 0 && (
				<div className={styles.statsRow}>
					<div className={styles.statChip}>
						<Clock3 size={14} />
						Oczekuje: <strong>{stats.pending}</strong>
					</div>
					<div className={styles.statChip}>
						W planach: <strong>{stats.planned}</strong>
					</div>
					<div className={styles.statChip}>
						W trakcie: <strong>{stats.in_progress}</strong>
					</div>
					<div className={styles.statChip}>
						<CheckCircle2 size={14} />
						Wykonane: <strong>{stats.done}</strong>
					</div>
					<div className={styles.statChip}>
						<XCircle size={14} />
						Odrzucone: <strong>{stats.rejected}</strong>
					</div>
				</div>
			)}

			{ideas.length === 0 ? (
				<div className={styles.empty}>
					<Lightbulb size={48} />
					<h3>
						{canManage
							? "Brak pomysłów dotyczących strony"
							: "Nie dodałeś jeszcze żadnego pomysłu"}
					</h3>
					<p>
						{canManage
							? "Gdy członkowie zgłoszą pomysły, pojawią się tutaj."
							: "Kliknij „Dodaj pomysł”, żeby zaproponować dodatek lub usprawnienie strony."}
					</p>
					<button
						className={styles.addBtn}
						onClick={() => setIsCreateOpen(true)}
					>
						<Plus size={16} />
						Dodaj pierwszy pomysł
					</button>
				</div>
			) : (
				<div className={styles.list}>
					{ideas.map((idea) => (
						<IdeaCard
							key={idea.id}
							idea={idea}
							canManage={canManage}
							busy={busyId === idea.id}
							onEdit={(i) => setEditingIdea(i)}
							onManage={(i) => setManagingIdea(i)}
							onDelete={handleDelete}
							onQuickDone={
								canManage && idea.status !== "done"
									? (i) => handleQuickStatus(i, "done")
									: undefined
							}
							onQuickReject={
								canManage && idea.status !== "rejected"
									? (i) => handleQuickStatus(i, "rejected")
									: undefined
							}
						/>
					))}
				</div>
			)}

			{/* Modal: nowy pomysł */}
			<IdeaModal
				isOpen={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
				onSaved={fetchIdeas}
			/>

			{/* Modal: edycja (autor) */}
			{editingIdea && (
				<IdeaModal
					isOpen={true}
					idea={editingIdea}
					onClose={() => setEditingIdea(null)}
					onSaved={fetchIdeas}
				/>
			)}

			{/* Modal: zarządzanie (admin/board) */}
			{managingIdea && (
				<ManageIdeaModal
					idea={managingIdea}
					onClose={() => setManagingIdea(null)}
					onSaved={fetchIdeas}
				/>
			)}

			{/* Modal: potwierdzenie akcji */}
			<ConfirmModal
				isOpen={!!confirmState}
				title={confirmState?.title}
				message={confirmState?.message ?? ""}
				confirmLabel={confirmState?.confirmLabel}
				variant={confirmState?.variant}
				busy={confirmBusy}
				onConfirm={async () => {
					if (!confirmState) return;
					await confirmState.onConfirm();
					setConfirmState(null);
					setConfirmBusy(false);
				}}
				onCancel={() => {
					setConfirmState(null);
					setConfirmBusy(false);
				}}
			/>
		</div>
	);
}