// frontend/src/pages/Ideas/IdeaModal.tsx
import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { SystemIdea } from "./Ideas";
import styles from "./Ideas.module.css";

interface Props {
	isOpen: boolean;
	idea?: SystemIdea;
	onClose: () => void;
	onSaved: () => void;
}

export function IdeaModal({ isOpen, idea, onClose, onSaved }: Props) {
	const isEdit = !!idea;
	const [form, setForm] = useState({
		title: "",
		description: "",
		category: "",
		priority: "medium",
	});
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setForm({
				title: idea?.title ?? "",
				description: idea?.description ?? "",
				category: idea?.category ?? "",
				priority: idea?.priority ?? "medium",
			});
		}
	}, [isOpen, idea]);

	if (!isOpen) return null;

	const handleSave = async () => {
		if (!form.title.trim() || !form.description.trim()) {
			toast.error("Uzupełnij tytuł i opis");
			return;
		}

		setSaving(true);
		try {
			const token = localStorage.getItem("accessToken");
			const url = isEdit
				? `/api/system-ideas/${idea!.id}`
				: "/api/system-ideas";
			const method = isEdit ? "PUT" : "POST";

			const res = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(form),
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Błąd zapisu");
			}

			toast.success(isEdit ? "Zapisano zmiany" : "Pomysł dodany");
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
					<h2>{isEdit ? "Edytuj pomysł" : "Dodaj nowy pomysł"}</h2>
					<button className={styles.closeBtn} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<div className={styles.modalBody}>
					<label className={styles.field}>
						<span>Tytuł *</span>
						<input
							type="text"
							value={form.title}
							onChange={(e) => setForm({ ...form, title: e.target.value })}
							placeholder="Krótki tytuł pomysłu"
							maxLength={200}
						/>
					</label>

					<label className={styles.field}>
						<span>Opis *</span>
						<textarea
							value={form.description}
							onChange={(e) =>
								setForm({ ...form, description: e.target.value })
							}
							placeholder="Opisz szczegółowo swój pomysł..."
							rows={6}
						/>
					</label>

					<div className={styles.row}>
						<label className={styles.field}>
							<span>Kategoria</span>
							<input
								type="text"
								value={form.category}
								onChange={(e) => setForm({ ...form, category: e.target.value })}
								placeholder="np. Social media, Wydarzenia"
							/>
						</label>
						<label className={styles.field}>
							<span>Priorytet</span>
							<select
								value={form.priority}
								onChange={(e) => setForm({ ...form, priority: e.target.value })}
							>
								<option value="low">Niski</option>
								<option value="medium">Średni</option>
								<option value="high">Wysoki</option>
							</select>
						</label>
					</div>
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
						{saving ? "Zapisywanie..." : "Zapisz"}
					</button>
				</div>
			</div>
		</div>
	);
}
