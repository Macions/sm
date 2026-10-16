import {
	Clock,
	CheckCircle2,
	XCircle,
	AlertCircle,
	Edit2,
	Trash2,
	Send,
	Lightbulb,
	Loader2,
} from "lucide-react";
import type { SystemIdea } from "./Ideas";
import styles from "./Ideas.module.css";

const STATUS_COLORS: Record<string, string> = {
	pending: "#2563eb",
	planned: "#7c3aed",
	in_progress: "#0891b2",
	done: "#059669",
	rejected: "#dc2626",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
	pending: <Lightbulb size={13} />,
	planned: <AlertCircle size={13} />,
	in_progress: <Clock size={13} />,
	done: <CheckCircle2 size={13} />,
	rejected: <XCircle size={13} />,
};

interface Props {
	idea: SystemIdea;
	canManage: boolean;
	busy?: boolean;
	onEdit: (idea: SystemIdea) => void;
	onManage: (idea: SystemIdea) => void;
	onDelete: (idea: SystemIdea) => void;
	onQuickDone?: (idea: SystemIdea) => void;
	onQuickReject?: (idea: SystemIdea) => void;
}

export function IdeaCard({
	idea,
	canManage,
	busy = false,
	onEdit,
	onManage,
	onDelete,
	onQuickDone,
	onQuickReject,
}: Props) {

	const canEdit = !canManage && idea.status === "pending";

	return (
		<div className={`${styles.card} ${busy ? styles.cardBusy : ""}`}>
			<div className={styles.cardHeader}>
				<div className={styles.cardTitleRow}>
					<h3 className={styles.cardTitle}>{idea.title}</h3>
					<span
						className={styles.badge}
						style={{
							backgroundColor: STATUS_COLORS[idea.status] || "#6b7280",
						}}
					>
						{STATUS_ICONS[idea.status]}
						<span>{idea.statusLabel}</span>
					</span>
				</div>

				<div className={styles.authorLine}>
					{canManage && (
						<>
							{idea.author.firstName} {idea.author.lastName} •{" "}
						</>
					)}
					Dodano {new Date(idea.createdAt).toLocaleDateString("pl-PL")}
					{idea.status === "done" && idea.completedAt && (
						<>
							{" "}• Wykonano{" "}
							{new Date(idea.completedAt).toLocaleDateString("pl-PL")}
						</>
					)}
				</div>
			</div>

			<p className={styles.cardDescription}>{idea.description}</p>

			{idea.adminNote && (
				<div className={styles.adminNote}>
					<strong>Notatka od IT:</strong> {idea.adminNote}
				</div>
			)}

			<div className={styles.cardFooter}>
				<div className={styles.meta}>
					{idea.category && (
						<span className={styles.tag}>{idea.category}</span>
					)}
				</div>

				<div className={styles.actions}>
					{canManage ? (
						<>

							{onQuickDone && idea.status !== "done" && (
								<button
									className={`${styles.actionBtn} ${styles.success}`}
									onClick={() => onQuickDone(idea)}
									disabled={busy}
									title="Oznacz jako wykonany"
								>
									{busy ? (
										<Loader2 size={14} className={styles.spin} />
									) : (
										<CheckCircle2 size={14} />
									)}
									Wykonany
								</button>
							)}
							{onQuickReject && idea.status !== "rejected" && (
								<button
									className={`${styles.actionBtn} ${styles.danger}`}
									onClick={() => onQuickReject(idea)}
									disabled={busy}
									title="Odrzuć pomysł"
								>
									{busy ? (
										<Loader2 size={14} className={styles.spin} />
									) : (
										<XCircle size={14} />
									)}
									Odrzuć
								</button>
							)}

							<button
								className={styles.actionBtn}
								onClick={() => onManage(idea)}
								disabled={busy}
								title="Zarządzaj"
							>
								<Send size={14} />
								Zarządzaj
							</button>

							<button
								className={`${styles.actionBtn} ${styles.danger}`}
								onClick={() => onDelete(idea)}
								disabled={busy}
								title="Usuń"
							>
								<Trash2 size={14} />
							</button>
						</>
					) : canEdit ? (
						<>
							<button
								className={styles.actionBtn}
								onClick={() => onEdit(idea)}
								title="Edytuj"
							>
								<Edit2 size={14} />
							</button>
							<button
								className={`${styles.actionBtn} ${styles.danger}`}
								onClick={() => onDelete(idea)}
								title="Usuń"
							>
								<Trash2 size={14} />
							</button>
						</>
					) : null}
				</div>
			</div>
		</div>
	);
}