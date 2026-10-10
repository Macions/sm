// frontend/src/pages/Ideas/IdeaCard.tsx
import {
	Clock,
	CheckCircle2,
	XCircle,
	AlertCircle,
	Edit2,
	Trash2,
	Send,
	Lightbulb,
} from "lucide-react";
import type { SystemIdea } from "./Ideas";
import styles from "./Ideas.module.css";

const STATUS_COLORS: Record<string, string> = {
	new: "#2563eb",
	in_review: "#d97706",
	planned: "#7c3aed",
	in_progress: "#0891b2",
	done: "#059669",
	rejected: "#dc2626",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
	new: <Lightbulb size={13} />,
	in_review: <Clock size={13} />,
	planned: <AlertCircle size={13} />,
	in_progress: <Clock size={13} />,
	done: <CheckCircle2 size={13} />,
	rejected: <XCircle size={13} />,
};

const PRIORITY_LABELS: Record<string, string> = {
	low: "Niski",
	medium: "Średni",
	high: "Wysoki",
};

interface Props {
	idea: SystemIdea;
	canManage: boolean;
	onEdit: (idea: SystemIdea) => void;
	onManage: (idea: SystemIdea) => void;
	onDelete: (idea: SystemIdea) => void;
}

export function IdeaCard({
	idea,
	canManage,
	onEdit,
	onManage,
	onDelete,
}: Props) {
	const canEdit = !canManage && idea.status === "new";

	return (
		<div className={styles.card}>
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
				</div>
			</div>

			<p className={styles.cardDescription}>{idea.description}</p>

			{idea.adminNote && (
				<div className={styles.adminNote}>
					<strong>Notatka od zarządu:</strong> {idea.adminNote}
				</div>
			)}

			<div className={styles.cardFooter}>
				<div className={styles.meta}>
					{idea.category && <span className={styles.tag}>{idea.category}</span>}
					{idea.priority && (
						<span className={styles.tag}>
							Priorytet: {PRIORITY_LABELS[idea.priority] || idea.priority}
						</span>
					)}
				</div>

				<div className={styles.actions}>
					{canManage ? (
						<button
							className={styles.actionBtn}
							onClick={() => onManage(idea)}
							title="Zarządzaj"
						>
							<Send size={14} />
							Zarządzaj
						</button>
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

					{canManage && (
						<button
							className={`${styles.actionBtn} ${styles.danger}`}
							onClick={() => onDelete(idea)}
							title="Usuń"
						>
							<Trash2 size={14} />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
