// src/pages/Grants/GrantCard.tsx
import { Calendar, ExternalLink, Plus, Edit2, Trash2, Eye } from "lucide-react";
import styles from "./Grants.module.css";

export interface Grant {
	id: string;
	name: string;
	description: string | null;
	category: "upcoming" | "current" | "archived";
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
	recruitments?: Array<{
		id: string;
		projectTitle: string;
		status: "preparing" | "open" | "closed";
		deadline: string | null;
		formUrl: string | null;
	}>;
}

interface Props {
	grant: Grant;
	canManage: boolean;
	onView: (grant: Grant) => void;
	onEdit: (grant: Grant) => void;
	onDelete: (grant: Grant) => void;
	onAddRecruitment?: (grant: Grant) => void;
}

const WORK_STATUS_LABELS: Record<string, string> = {
	analyzed: "Analizowany",
	in_preparation: "W przygotowaniu",
	submitted: "Złożony",
	accepted: "Zaakceptowany",
	rejected: "Odrzucony",
	no_application: "Bez aplikacji",
};

export function GrantCard({
	grant,
	canManage,
	onView,
	onEdit,
	onDelete,
	onAddRecruitment,
}: Props) {
	const recruitments = grant.recruitments || [];

	return (
		<div className={styles.card} onClick={() => onView(grant)}>
			<div className={styles.cardHeader}>
				<h3 className={styles.cardTitle}>{grant.name}</h3>
				<span className={styles.badge}>
					{WORK_STATUS_LABELS[grant.workStatus] || grant.workStatus}
				</span>
			</div>

			{grant.description && (
				<p className={styles.cardDescription}>{grant.description}</p>
			)}

			<div className={styles.cardMeta}>
				{grant.amountMin != null || grant.amountMax != null ? (
					<span className={styles.metaItem}>
						{grant.amountMin?.toLocaleString("pl-PL") || "0"} –{" "}
						{grant.amountMax?.toLocaleString("pl-PL") || "?"} zł
					</span>
				) : null}

				{grant.submissionDeadline && (
					<span className={styles.metaItem}>
						<Calendar size={12} />
						{new Date(grant.submissionDeadline).toLocaleDateString("pl-PL")}
					</span>
				)}
			</div>

			{/* Rekrutacje na Project Leadera – widoczne od razu na karcie */}
			{recruitments.length > 0 && (
				<div className={styles.recruitmentsBox} onClick={(e) => e.stopPropagation()}>
					<div className={styles.recruitmentsBox__header}>
						<span>Rekrutacje na Project Leadera</span>
						<span className={styles.recruitmentsBox__count}>
							{recruitments.length}
						</span>
					</div>
					<div className={styles.recruitmentsBox__list}>
						{recruitments.map((r) => (
							<div key={r.id} className={styles.recruitmentItem}>
								<div className={styles.recruitmentItem__row}>
									<strong className={styles.recruitmentItem__title}>
										{r.projectTitle}
									</strong>
									<span
										className={styles.recruitmentItem__badge}
										style={{
											backgroundColor:
												r.status === "open"
													? "#059669"
													: r.status === "closed"
														? "#6b7280"
														: "#d97706",
										}}
									>
										{r.status === "open"
											? "Otwarta"
											: r.status === "closed"
												? "Zamknięta"
												: "W przygotowaniu"}
									</span>
								</div>
								{r.deadline && (
									<div className={styles.recruitmentItem__meta}>
										<Calendar size={11} />
										Termin:{" "}
										{new Date(r.deadline).toLocaleDateString("pl-PL")}
									</div>
								)}
								{r.formUrl && (
									<a
										href={r.formUrl}
										target="_blank"
										rel="noreferrer"
										className={styles.recruitmentItem__link}
										onClick={(e) => e.stopPropagation()}
									>
										<ExternalLink size={11} />
										Formularz zgłoszeniowy
									</a>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Przycisk dodania rekrutacji – tylko dla canManage */}
			{canManage && onAddRecruitment && (
				<button
					type="button"
					className={styles.addRecruitmentBtn}
					onClick={(e) => {
						e.stopPropagation();
						onAddRecruitment(grant);
					}}
				>
					<Plus size={12} />
					Dodaj rekrutację
				</button>
			)}

			<div
				className={styles.cardActions}
				onClick={(e) => e.stopPropagation()}
			>
				<button
					type="button"
					className={styles.iconBtn}
					onClick={() => onView(grant)}
					title="Szczegóły"
				>
					<Eye size={14} />
				</button>
				{canManage && (
					<>
						<button
							type="button"
							className={styles.iconBtn}
							onClick={() => onEdit(grant)}
							title="Edytuj"
						>
							<Edit2 size={14} />
						</button>
						<button
							type="button"
							className={`${styles.iconBtn} ${styles.danger}`}
							onClick={() => onDelete(grant)}
							title="Usuń"
						>
							<Trash2 size={14} />
						</button>
					</>
				)}
			</div>
		</div>
	);
}