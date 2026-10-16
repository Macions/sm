import { useEffect, useState } from "react";
import {
	X,
	ExternalLink,
	Calendar,
	Euro,
	User,
	Award,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Grant } from "./GrantCard";
import styles from "./Grants.module.css";

const WORK_STATUS_LABELS: Record<string, string> = {
	analyzed: "Analizowany",
	in_preparation: "W przygotowaniu",
	submitted: "Złożony",
	accepted: "Zaakceptowany",
	rejected: "Odrzucony",
	no_application: "Bez aplikacji",
};

interface Props {
	grantId: string;
	canManage: boolean;
	onClose: () => void;
	onChanged: () => void;
}

function fmt(iso: string | null | undefined): string {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString("pl-PL");
}

function fmtAmount(min: number | null, max: number | null): string {
	if (min == null && max == null) return "—";
	if (min != null && max != null)
		return `${min.toLocaleString("pl-PL")} – ${max.toLocaleString("pl-PL")} zł`;
	if (min != null) return `od ${min.toLocaleString("pl-PL")} zł`;
	return `do ${max!.toLocaleString("pl-PL")} zł`;
}

export function GrantDetailModal({
	grantId,
	canManage,
	onClose,
	onChanged,
}: Props) {
	const [grant, setGrant] = useState<Grant | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchGrant = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/grants/${grantId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error("Błąd pobierania");
			const data = await res.json();
			setGrant(data.grant);
		} catch (err) {
			toast.error("Nie udało się pobrać szczegółów grantu");
			onClose();
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchGrant();

	}, [grantId]);

	const handleMarkVerified = async () => {
		try {
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/grants/${grantId}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ markVerified: true }),
			});
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Błąd weryfikacji");
			}
			toast.success("Oznaczono jako zweryfikowane");
			await fetchGrant();
			onChanged();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Nie udało się");
		}
	};

	if (loading || !grant) {
		return (
			<div className={styles.overlay} onClick={onClose}>
				<div
					className={`${styles.modal} ${styles.modalWide}`}
					onClick={(e) => e.stopPropagation()}
				>
					<div className={styles.spinner} />
				</div>
			</div>
		);
	}

	return (
		<div className={styles.overlay} onClick={onClose}>
			<div
				className={`${styles.modal} ${styles.modalWide}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modalHeader}>
					<h2>{grant.name}</h2>
					<button className={styles.closeBtn} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<div className={styles.modalBody}>
					{grant.description && (
						<p className={styles.detailDescription}>{grant.description}</p>
					)}

					<div className={styles.detailGrid}>
						<div className={styles.detailItem}>
							<Euro size={16} />
							<div>
								<span className={styles.detailLabel}>Kwota</span>
								<span className={styles.detailValue}>
									{fmtAmount(grant.amountMin, grant.amountMax)}
								</span>
							</div>
						</div>
						<div className={styles.detailItem}>
							<Calendar size={16} />
							<div>
								<span className={styles.detailLabel}>Termin naboru</span>
								<span className={styles.detailValue}>
									{fmt(grant.submissionDeadline)}
								</span>
							</div>
						</div>
						<div className={styles.detailItem}>
							<Award size={16} />
							<div>
								<span className={styles.detailLabel}>Status pracy</span>
								<span className={styles.detailValue}>
									{WORK_STATUS_LABELS[grant.workStatus] || grant.workStatus}
								</span>
							</div>
						</div>
						<div className={styles.detailItem}>
							<User size={16} />
							<div>
								<span className={styles.detailLabel}>Odpowiedzialny</span>
								<span className={styles.detailValue}>
									{grant.responsibleUser
										? `${grant.responsibleUser.firstName} ${grant.responsibleUser.lastName}`
										: "—"}
								</span>
							</div>
						</div>
					</div>

					<div className={styles.linksRow}>
						{grant.websiteUrl && (
							<a
								href={grant.websiteUrl}
								target="_blank"
								rel="noreferrer"
								className={styles.link}
							>
								<ExternalLink size={14} />
								Strona
							</a>
						)}
						{grant.regulationsUrl && (
							<a
								href={grant.regulationsUrl}
								target="_blank"
								rel="noreferrer"
								className={styles.link}
							>
								<ExternalLink size={14} />
								Regulamin
							</a>
						)}
						{grant.applicationFormUrl && (
							<a
								href={grant.applicationFormUrl}
								target="_blank"
								rel="noreferrer"
								className={styles.link}
							>
								<ExternalLink size={14} />
								Formularz
							</a>
						)}
					</div>

					{grant.requirements && (
						<div className={styles.detailSection}>
							<h4>Wymagania</h4>
							<p>{grant.requirements}</p>
						</div>
					)}
					{grant.ownContribution && (
						<div className={styles.detailSection}>
							<h4>Wkład własny</h4>
							<p>{grant.ownContribution}</p>
						</div>
					)}
					{grant.eligibleCosts && (
						<div className={styles.detailSection}>
							<h4>Koszty kwalifikowalne</h4>
							<p>{grant.eligibleCosts}</p>
						</div>
					)}
					{grant.targetGroup && (
						<div className={styles.detailSection}>
							<h4>Grupa docelowa</h4>
							<p>{grant.targetGroup}</p>
						</div>
					)}
					{grant.eligibleApplicants && (
						<div className={styles.detailSection}>
							<h4>Uprawnieni wnioskodawcy</h4>
							<p>{grant.eligibleApplicants}</p>
						</div>
					)}
					{grant.requiredPartners && (
						<div className={styles.detailSection}>
							<h4>Wymagani partnerzy</h4>
							<p>{grant.requiredPartners}</p>
						</div>
					)}
					{grant.requiredDocuments && (
						<div className={styles.detailSection}>
							<h4>Wymagane dokumenty</h4>
							<p>{grant.requiredDocuments}</p>
						</div>
					)}
					{grant.projectResults && (
						<div className={styles.detailSection}>
							<h4>Rezultaty projektu</h4>
							<p>{grant.projectResults}</p>
						</div>
					)}
				</div>

				<div className={styles.modalFooter}>
					<div className={styles.footerLeft}>
						{grant.lastVerifiedAt ? (
							<span className={styles.verifiedInfo}>
								Zweryfikowano: {fmt(grant.lastVerifiedAt)}
								{grant.lastVerifiedBy &&
									` przez ${grant.lastVerifiedBy.firstName} ${grant.lastVerifiedBy.lastName}`}
							</span>
						) : (
							<span className={styles.verifiedInfo}>
								Ostatnia weryfikacja: brak
							</span>
						)}
					</div>
					<div className={styles.footerRight}>
						{canManage && (
							<button className={styles.actionBtn} onClick={handleMarkVerified}>
								Oznacz jako zweryfikowany
							</button>
						)}
						<button className={styles.cancelBtn} onClick={onClose}>
							Zamknij
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}