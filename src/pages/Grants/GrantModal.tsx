// src/pages/Grants/GrantModal.tsx
import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { Grant } from "./GrantCard";
import styles from "./Grants.module.css";

interface TeamMember {
	id: string;
	firstName: string;
	lastName: string;
	email: string | null;
	roleInTeam: string;
	isLeader: boolean;
}

interface Props {
	isOpen: boolean;
	grant?: Grant;
	onClose: () => void;
	onSaved: () => void;
}

const EMPTY_FORM = {
	name: "",
	description: "",
	category: "current",
	workStatus: "analyzed",
	amountMin: "",
	amountMax: "",
	submissionDeadline: "",
	projectStartDate: "",
	projectEndDate: "",
	websiteUrl: "",
	regulationsUrl: "",
	applicationFormUrl: "",
	thematicArea: "",
	requirements: "",
	ownContribution: "",
	eligibleCosts: "",
	targetGroup: "",
	eligibleApplicants: "",
	requiredPartners: "",
	requiredDocuments: "",
	projectResults: "",
	responsibleUserId: "",
};

function dateForInput(iso: string | null | undefined): string {
	if (!iso) return "";
	return iso.slice(0, 10);
}

export function GrantModal({ isOpen, grant, onClose, onSaved }: Props) {
	const isEdit = !!grant;
	const [form, setForm] = useState({ ...EMPTY_FORM });
	const [members, setMembers] = useState<TeamMember[]>([]);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!isOpen) return;

		setForm({
			name: grant?.name ?? "",
			description: grant?.description ?? "",
			category: grant?.category ?? "current",
			workStatus: grant?.workStatus ?? "analyzed",
			amountMin: grant?.amountMin != null ? String(grant.amountMin) : "",
			amountMax: grant?.amountMax != null ? String(grant.amountMax) : "",
			submissionDeadline: dateForInput(grant?.submissionDeadline),
			projectStartDate: dateForInput(grant?.projectStartDate),
			projectEndDate: dateForInput(grant?.projectEndDate),
			websiteUrl: grant?.websiteUrl ?? "",
			regulationsUrl: grant?.regulationsUrl ?? "",
			applicationFormUrl: grant?.applicationFormUrl ?? "",
			thematicArea: grant?.thematicArea ?? "",
			requirements: grant?.requirements ?? "",
			ownContribution: grant?.ownContribution ?? "",
			eligibleCosts: grant?.eligibleCosts ?? "",
			targetGroup: grant?.targetGroup ?? "",
			eligibleApplicants: grant?.eligibleApplicants ?? "",
			requiredPartners: grant?.requiredPartners ?? "",
			requiredDocuments: grant?.requiredDocuments ?? "",
			projectResults: grant?.projectResults ?? "",
			responsibleUserId: grant?.responsibleUser?.id ?? "",
		});

		const fetchMembers = async () => {
			try {
				const token = localStorage.getItem("accessToken");
				const res = await fetch("/api/grant-team/members", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.ok) {
					const data = await res.json();
					setMembers(data.members || []);
				}
			} catch (e) {
				console.error(e);
			}
		};
		fetchMembers();
	}, [isOpen, grant]);

	if (!isOpen) return null;

	const update = (key: keyof typeof EMPTY_FORM, value: string) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const handleSave = async () => {
		if (!form.name.trim()) {
			toast.error("Nazwa grantu jest wymagana");
			return;
		}
		setSaving(true);
		try {
			const token = localStorage.getItem("accessToken");
			const url = isEdit ? `/api/grants/${grant!.id}` : "/api/grants";
			const method = isEdit ? "PUT" : "POST";

			const payload: any = {
				name: form.name.trim(),
				description: form.description.trim() || null,
				category: form.category,
				workStatus: form.workStatus,
				amountMin: form.amountMin !== "" ? form.amountMin : null,
				amountMax: form.amountMax !== "" ? form.amountMax : null,
				submissionDeadline: form.submissionDeadline || null,
				projectStartDate: form.projectStartDate || null,
				projectEndDate: form.projectEndDate || null,
				websiteUrl: form.websiteUrl.trim() || null,
				regulationsUrl: form.regulationsUrl.trim() || null,
				applicationFormUrl: form.applicationFormUrl.trim() || null,
				thematicArea: form.thematicArea.trim() || null,
				requirements: form.requirements.trim() || null,
				ownContribution: form.ownContribution.trim() || null,
				eligibleCosts: form.eligibleCosts.trim() || null,
				targetGroup: form.targetGroup.trim() || null,
				eligibleApplicants: form.eligibleApplicants.trim() || null,
				requiredPartners: form.requiredPartners.trim() || null,
				requiredDocuments: form.requiredDocuments.trim() || null,
				projectResults: form.projectResults.trim() || null,
				responsibleUserId: form.responsibleUserId || null,
			};

			const res = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Błąd zapisu");
			}

			toast.success(isEdit ? "Zapisano zmiany" : "Grant dodany");
			onClose();
			onSaved();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Nie udało się zapisać");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className={styles.overlay} onClick={onClose}>
			<div
				className={`${styles.modal} ${styles.modalWide}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modalHeader}>
					<h2>{isEdit ? "Edytuj grant" : "Dodaj nowy grant"}</h2>
					<button className={styles.closeBtn} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<div className={styles.modalBody}>
					<div className={styles.sectionTitle}>Podstawowe informacje</div>

					<label className={styles.field}>
						<span>Nazwa grantu *</span>
						<input
							type="text"
							value={form.name}
							onChange={(e) => update("name", e.target.value)}
							placeholder="np. Rządowy Fundusz Młodzieży 2026"
						/>
					</label>

					<label className={styles.field}>
						<span>Krótki opis</span>
						<textarea
							value={form.description}
							onChange={(e) => update("description", e.target.value)}
							rows={3}
						/>
					</label>

					<div className={styles.row}>
						<label className={styles.field}>
							<span>Kategoria *</span>
							<select
								value={form.category}
								onChange={(e) => update("category", e.target.value)}
							>
								<option value="upcoming">Przyszły</option>
								<option value="current">Aktualny</option>
								<option value="archived">Archiwalny</option>
							</select>
						</label>
						<label className={styles.field}>
							<span>Status pracy *</span>
							<select
								value={form.workStatus}
								onChange={(e) => update("workStatus", e.target.value)}
							>
								<option value="analyzed">Analizowany</option>
								<option value="in_preparation">W przygotowaniu</option>
								<option value="submitted">Złożony</option>
								<option value="accepted">Zaakceptowany</option>
								<option value="rejected">Odrzucony</option>
								<option value="no_application">Bez aplikacji</option>
							</select>
						</label>
					</div>

					<div className={styles.sectionTitle}>Dofinansowanie i terminy</div>

					<div className={styles.row}>
						<label className={styles.field}>
							<span>Kwota minimalna (zł)</span>
							<input
								type="number"
								value={form.amountMin}
								onChange={(e) => update("amountMin", e.target.value)}
								min="0"
								step="0.01"
							/>
						</label>
						<label className={styles.field}>
							<span>Kwota maksymalna (zł)</span>
							<input
								type="number"
								value={form.amountMax}
								onChange={(e) => update("amountMax", e.target.value)}
								min="0"
								step="0.01"
							/>
						</label>
					</div>

					<label className={styles.field}>
						<span>Termin naboru</span>
						<input
							type="date"
							value={form.submissionDeadline}
							onChange={(e) => update("submissionDeadline", e.target.value)}
						/>
					</label>

					<div className={styles.row}>
						<label className={styles.field}>
							<span>Przewidywany start projektu</span>
							<input
								type="date"
								value={form.projectStartDate}
								onChange={(e) => update("projectStartDate", e.target.value)}
							/>
						</label>
						<label className={styles.field}>
							<span>Przewidywany koniec projektu</span>
							<input
								type="date"
								value={form.projectEndDate}
								onChange={(e) => update("projectEndDate", e.target.value)}
							/>
						</label>
					</div>

					<div className={styles.sectionTitle}>Linki</div>

					<label className={styles.field}>
						<span>Oficjalna strona</span>
						<input
							type="url"
							value={form.websiteUrl}
							onChange={(e) => update("websiteUrl", e.target.value)}
							placeholder="https://..."
						/>
					</label>
					<label className={styles.field}>
						<span>Regulamin</span>
						<input
							type="url"
							value={form.regulationsUrl}
							onChange={(e) => update("regulationsUrl", e.target.value)}
							placeholder="https://..."
						/>
					</label>
					<label className={styles.field}>
						<span>Formularz wniosku</span>
						<input
							type="url"
							value={form.applicationFormUrl}
							onChange={(e) => update("applicationFormUrl", e.target.value)}
							placeholder="https://..."
						/>
					</label>

					<div className={styles.sectionTitle}>
						Obszar tematyczny i wymagania
					</div>

					<label className={styles.field}>
						<span>Obszar tematyczny</span>
						<input
							type="text"
							value={form.thematicArea}
							onChange={(e) => update("thematicArea", e.target.value)}
							placeholder="np. Edukacja, Kultura, Sport"
						/>
					</label>

					<label className={styles.field}>
						<span>Wymagania</span>
						<textarea
							value={form.requirements}
							onChange={(e) => update("requirements", e.target.value)}
							rows={3}
						/>
					</label>

					<label className={styles.field}>
						<span>Wymagany wkład własny</span>
						<textarea
							value={form.ownContribution}
							onChange={(e) => update("ownContribution", e.target.value)}
							rows={2}
						/>
					</label>

					<label className={styles.field}>
						<span>Koszty kwalifikowalne</span>
						<textarea
							value={form.eligibleCosts}
							onChange={(e) => update("eligibleCosts", e.target.value)}
							rows={2}
						/>
					</label>

					<label className={styles.field}>
						<span>Grupa docelowa</span>
						<textarea
							value={form.targetGroup}
							onChange={(e) => update("targetGroup", e.target.value)}
							rows={2}
						/>
					</label>

					<label className={styles.field}>
						<span>Uprawnieni wnioskodawcy</span>
						<textarea
							value={form.eligibleApplicants}
							onChange={(e) => update("eligibleApplicants", e.target.value)}
							rows={2}
						/>
					</label>

					<label className={styles.field}>
						<span>Wymagani partnerzy</span>
						<textarea
							value={form.requiredPartners}
							onChange={(e) => update("requiredPartners", e.target.value)}
							rows={2}
						/>
					</label>

					<label className={styles.field}>
						<span>Wymagane dokumenty</span>
						<textarea
							value={form.requiredDocuments}
							onChange={(e) => update("requiredDocuments", e.target.value)}
							rows={2}
						/>
					</label>

					<label className={styles.field}>
						<span>Rezultaty projektu</span>
						<textarea
							value={form.projectResults}
							onChange={(e) => update("projectResults", e.target.value)}
							rows={2}
						/>
					</label>

					<div className={styles.sectionTitle}>Odpowiedzialność</div>

					<label className={styles.field}>
						<span>Osoba odpowiedzialna za grant</span>
						<select
							value={form.responsibleUserId}
							onChange={(e) => update("responsibleUserId", e.target.value)}
						>
							<option value="">— brak —</option>
							{members.map((m) => (
								<option key={m.id} value={m.id}>
									{m.firstName} {m.lastName}
									{m.isLeader ? " (lider)" : ""}
								</option>
							))}
						</select>
					</label>
				</div>

				<div className={styles.modalFooter}>
					<button
						className={styles.cancelBtn}
						onClick={onClose}
						disabled={saving}
					>
						Anuluj
					</button>
					<button
						className={styles.saveBtn}
						onClick={handleSave}
						disabled={saving}
					>
						<Save size={14} />
						{saving ? "Zapisywanie..." : isEdit ? "Zapisz" : "Dodaj"}
					</button>
				</div>
			</div>
		</div>
	);
}
