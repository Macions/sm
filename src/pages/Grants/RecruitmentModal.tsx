import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./Grants.module.css";

interface Recruitment {
	id: string;
	projectTitle: string;
	projectDescription: string | null;
	responsibilities: string | null;
	requiredSkills: string | null;
	deadline: string | null;
	formUrl: string | null;
	status: "preparing" | "open" | "closed";
}

interface Props {
	isOpen: boolean;
	grantId: string;
	recruitment?: Recruitment;
	onClose: () => void;
	onSaved: () => void;
}

const EMPTY = {
	projectTitle: "",
	projectDescription: "",
	responsibilities: "",
	requiredSkills: "",
	deadline: "",
	formUrl: "",
	status: "preparing",
};

function dateForInput(iso: string | null | undefined): string {
	if (!iso) return "";
	return iso.slice(0, 10);
}

export function RecruitmentModal({
	isOpen,
	grantId,
	recruitment,
	onClose,
	onSaved,
}: Props) {
	const isEdit = !!recruitment;
	const [form, setForm] = useState({ ...EMPTY });
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!isOpen) return;
		if (recruitment) {
			setForm({
				projectTitle: recruitment.projectTitle,
				projectDescription: recruitment.projectDescription ?? "",
				responsibilities: recruitment.responsibilities ?? "",
				requiredSkills: recruitment.requiredSkills ?? "",
				deadline: dateForInput(recruitment.deadline),
				formUrl: recruitment.formUrl ?? "",
				status: recruitment.status,
			});
		} else {
			setForm({ ...EMPTY });
		}
	}, [isOpen, recruitment]);

	if (!isOpen) return null;

	const update = (key: keyof typeof EMPTY, value: string) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const handleSave = async () => {
		if (!form.projectTitle.trim()) {
			toast.error("Nazwa projektu jest wymagana");
			return;
		}
		setSaving(true);
		try {
			const token = localStorage.getItem("accessToken");
			const url = isEdit
				? `/api/grants/${grantId}/recruitments/${recruitment!.id}`
				: `/api/grants/${grantId}/recruitments`;
			const method = isEdit ? "PUT" : "POST";

			const res = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					projectTitle: form.projectTitle.trim(),
					projectDescription: form.projectDescription.trim() || null,
					responsibilities: form.responsibilities.trim() || null,
					requiredSkills: form.requiredSkills.trim() || null,
					deadline: form.deadline || null,
					formUrl: form.formUrl.trim() || null,
					status: form.status,
				}),
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Błąd zapisu");
			}

			toast.success(isEdit ? "Zapisano" : "Rekrutacja dodana");
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
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modalHeader}>
					<h2>
						{isEdit
							? "Edytuj rekrutację"
							: "Dodaj rekrutację na Project Leadera"}
					</h2>
					<button className={styles.closeBtn} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<div className={styles.modalBody}>
					<label className={styles.field}>
						<span>Nazwa projektu / roboczy tytuł *</span>
						<input
							type="text"
							value={form.projectTitle}
							onChange={(e) => update("projectTitle", e.target.value)}
						/>
					</label>

					<label className={styles.field}>
						<span>Krótki opis projektu</span>
						<textarea
							value={form.projectDescription}
							onChange={(e) => update("projectDescription", e.target.value)}
							rows={3}
						/>
					</label>

					<label className={styles.field}>
						<span>Zakres obowiązków</span>
						<textarea
							value={form.responsibilities}
							onChange={(e) => update("responsibilities", e.target.value)}
							rows={3}
						/>
					</label>

					<label className={styles.field}>
						<span>Wymagane kompetencje</span>
						<textarea
							value={form.requiredSkills}
							onChange={(e) => update("requiredSkills", e.target.value)}
							rows={3}
						/>
					</label>

					<div className={styles.row}>
						<label className={styles.field}>
							<span>Termin zgłoszeń</span>
							<input
								type="date"
								value={form.deadline}
								onChange={(e) => update("deadline", e.target.value)}
							/>
						</label>
						<label className={styles.field}>
							<span>Status</span>
							<select
								value={form.status}
								onChange={(e) => update("status", e.target.value)}
							>
								<option value="preparing">W przygotowaniu</option>
								<option value="open">Otwarta</option>
								<option value="closed">Zamknięta</option>
							</select>
						</label>
					</div>

					<label className={styles.field}>
						<span>Link do formularza rekrutacyjnego</span>
						<input
							type="url"
							value={form.formUrl}
							onChange={(e) => update("formUrl", e.target.value)}
							placeholder="https://..."
						/>
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
