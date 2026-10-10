// frontend/src/pages/Ideas/ManageIdeaModal.tsx
import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { SystemIdea } from "./Ideas";
import styles from "./Ideas.module.css";

interface Props {
	idea: SystemIdea;
	onClose: () => void;
	onSaved: () => void;
}

export function ManageIdeaModal({ idea, onClose, onSaved }: Props) {
	const [status, setStatus] = useState(idea.status);
	const [adminNote, setAdminNote] = useState(idea.adminNote ?? "");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		setStatus(idea.status);
		setAdminNote(idea.adminNote ?? "");
	}, [idea]);

	const handleSave = async () => {
		setSaving(true);
		try {
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/system-ideas/${idea.id}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ status, adminNote }),
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Błąd zapisu");
			}

			toast.success("Zaktualizowano");
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
					<h2>Zarządzaj pomysłem</h2>
					<button className={styles.closeBtn} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<div className={styles.modalBody}>
					<div className={styles.ideaPreview}>
						<strong>{idea.title}</strong>
						<p>{idea.description}</p>
						<small>
							Autor: {idea.author.firstName} {idea.author.lastName}
						</small>
					</div>

					<label className={styles.field}>
						<span>Status</span>
						<select value={status} onChange={(e) => setStatus(e.target.value)}>
							<option value="new">Nowy</option>
							<option value="in_review">W analizie</option>
							<option value="planned">Zaplanowany</option>
							<option value="in_progress">W realizacji</option>
							<option value="done">Zrealizowany</option>
							<option value="rejected">Odrzucony</option>
						</select>
					</label>

					<label className={styles.field}>
						<span>Notatka od zarządu (widoczna dla autora)</span>
						<textarea
							value={adminNote}
							onChange={(e) => setAdminNote(e.target.value)}
							placeholder="np. Świetny pomysł, wdrażamy w przyszłym miesiącu..."
							rows={4}
						/>
					</label>
				</div>

				<div className={styles.modalFooter}>
					<button className={styles.cancelBtn} onClick={onClose}>
						Anuluj
					</button>
					<button
						className={styles.saveBtn}
						onClick={handleSave}
						disabled={saving}
					>
						<Save size={14} />
						{saving ? "Zapisywanie..." : "Zapisz"}
					</button>
				</div>
			</div>
		</div>
	);
}
