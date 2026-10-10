// src/pages/Grants/GrantCard.tsx
import { Calendar, Eye, Edit2, Trash2, User, Euro } from "lucide-react";
import styles from "./Grants.module.css";

export interface Grant {
	id: string;
	name: string;
	description: string | null;
	category: string;
	workStatus: string;
	amountMin: number | null;
	amountMax: number | null;
	submissionDeadline: string | null;
	projectStartDate: string | null;
	projectEndDate: string | null;
	websiteUrl: string | null;
	regulationsUrl: string | null;
	applicationFormUrl: string | null;
	thematicArea: string | null;
	requirements: string | null;
	ownContribution: string | null;
	eligibleCosts: string | null;
	targetGroup: string | null;
	eligibleApplicants: string | null;
	requiredPartners: string | null;
	requiredDocuments: string | null;
	projectResults: string | null;
	responsibleUser: {
		id: string;
		firstName: string;
		lastName: string;
		email: string | null;
	} | null;
	lastVerifiedAt: string | null;
	lastVerifiedBy: {
		id: string;
		firstName: string;
		lastName: string;
	} | null;
	createdBy: {
		id: string;
		firstName: string;
		lastName: string;
	};
	createdAt: string;
	updatedAt: string;
	recruitments?: any[];
}

const WORK_STATUS_LABELS: Record<string, string> = {
	analyzed: "Analizowany",
	in_preparation: "W przygotowaniu",
	submitted: "Złożony",
	accepted: "Zaakceptowany",
	rejected: "Odrzucony",
	no_application: "Bez aplikacji",
};

const WORK_STATUS_COLORS: Record<string, string> = {
	analyzed: "#6b7280",
	in_preparation: "#d97706",
	submitted: "#2563eb",
	accepted: "#059669",
	rejected: "#dc2626",
	no_application: "#9ca3af",
};

interface Props {
	grant: Grant;
	canManage: boolean;
	onView: (grant: Grant) => void;
	onEdit: (grant: Grant) => void;
	onDelete: (grant: Grant) => void;
}

function formatDate(iso: string | null): string {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString("pl-PL");
}

function formatAmount(g: Grant): string {
	if (g.amountMin == null && g.amountMax == null) return "—";
	if (g.amountMin != null && g.amountMax != null) {
		return `${g.amountMin.toLocaleString("pl-PL")} – ${g.amountMax.toLocaleString("pl-PL")} zł`;
	}
	if (g.amountMin != null)
		return `od ${g.amountMin.toLocaleString("pl-PL")} zł`;
	return `do ${g.amountMax!.toLocaleString("pl-PL")} zł`;
}

export function GrantCard({
	grant,
	canManage,
	onView,
	onEdit,
	onDelete,
}: Props) {
	const openRecruitments =
		grant.recruitments?.filter((r) => r.status === "open") ?? [];

	return (
		<div className={styles.card}>
			<div className={styles.cardHeader}>
				<div className={styles.cardTitleRow}>
					<h3 className={styles.cardTitle}>{grant.name}</h3>
					<span
						className={styles.badge}
						style={{
							backgroundColor:
								WORK_STATUS_COLORS[grant.workStatus] || "#6b7280",
						}}
					>
						{WORK_STATUS_LABELS[grant.workStatus] || grant.workStatus}
					</span>
				</div>
				{grant.thematicArea && (
					<span className={styles.themeTag}>{grant.thematicArea}</span>
				)}
			</div>

			{grant.description && (
				<p className={styles.cardDescription}>{grant.description}</p>
			)}

			<div className={styles.metaGrid}>
				<div className={styles.metaItem}>
					<Euro size={14} />
					<span>{formatAmount(grant)}</span>
				</div>
				<div className={styles.metaItem}>
					<Calendar size={14} />
					<span>
						Termin naboru:{" "}
						<strong>{formatDate(grant.submissionDeadline)}</strong>
					</span>
				</div>
				{grant.responsibleUser && (
					<div className={styles.metaItem}>
						<User size={14} />
						<span>
							Odpowiedzialny: {grant.responsibleUser.firstName}{" "}
							{grant.responsibleUser.lastName}
						</span>
					</div>
				)}
			</div>

			{openRecruitments.length > 0 && (
				<div className={styles.recruitmentsBadge}>
					Otwarte rekrutacje na Project Leadera: {openRecruitments.length}
				</div>
			)}

			<div className={styles.cardFooter}>
				<span className={styles.verifiedLine}>
					{grant.lastVerifiedAt
						? `Zweryfikowano: ${formatDate(grant.lastVerifiedAt)}`
						: "Niezweryfikowany"}
				</span>
				<div className={styles.cardActions}>
					<button
						className={styles.actionBtn}
						onClick={() => onView(grant)}
						title="Szczegóły"
					>
						<Eye size={14} />
						Szczegóły
					</button>
					{canManage && (
						<>
							<button
								className={styles.actionBtn}
								onClick={() => onEdit(grant)}
								title="Edytuj"
							>
								<Edit2 size={14} />
							</button>
							<button
								className={`${styles.actionBtn} ${styles.danger}`}
								onClick={() => onDelete(grant)}
								title="Usuń"
							>
								<Trash2 size={14} />
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
