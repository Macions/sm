// frontend/src/pages/Ideas/Ideas.tsx
import { useEffect, useState } from "react";
import { Lightbulb, Plus } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./Ideas.module.css";
import { IdeaCard } from "./IdeaCard";
import { IdeaModal } from "./IdeaModal";
import { ManageIdeaModal } from "./ManageIdeaModal";

export interface SystemIdea {
	id: string;
	title: string;
	description: string;
	category: string | null;
	status: string;
	statusLabel: string;
	priority: string | null;
	adminNote: string | null;
	createdAt: string;
	updatedAt: string;
	reviewedAt: string | null;
	author: { id: string; firstName: string; lastName: string };
}

export default function Ideas() {
	const [ideas, setIdeas] = useState<SystemIdea[]>([]);
	const [loading, setLoading] = useState(true);
	const [canManage, setCanManage] = useState(false);

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingIdea, setEditingIdea] = useState<SystemIdea | null>(null);
	const [managingIdea, setManagingIdea] = useState<SystemIdea | null>(null);

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

	const handleDelete = async (idea: SystemIdea) => {
		if (!confirm(`Usunąć pomysł „${idea.title}"?`)) return;
		try {
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
			toast.error(err instanceof Error ? err.message : "Nie udało się usunąć");
		}
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
						<Lightbulb size={22} />
						<h1 className={styles.title}>Pomysły</h1>
					</div>
					<p className={styles.subtitle}>
						{canManage
							? "Wszystkie pomysły zgłoszone przez członków."
							: "Twoje pomysły i ich status."}
					</p>
				</div>

				<button className={styles.addBtn} onClick={() => setIsCreateOpen(true)}>
					<Plus size={16} />
					Dodaj pomysł
				</button>
			</div>

			{ideas.length === 0 ? (
				<div className={styles.empty}>
					<Lightbulb size={48} />
					<h3>
						{canManage
							? "Brak pomysłów w systemie"
							: "Nie dodałeś jeszcze żadnego pomysłu"}
					</h3>
					<p>Kliknij „Dodaj pomysł", żeby zacząć.</p>
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
							onEdit={(i) => setEditingIdea(i)}
							onManage={(i) => setManagingIdea(i)}
							onDelete={handleDelete}
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
		</div>
	);
}
