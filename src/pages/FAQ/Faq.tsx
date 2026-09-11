import { useEffect, useMemo, useState } from "react";
import {
	Search,
	Plus,
	Pencil,
	Trash2,
	X,
	ChevronDown,
	HelpCircle,
	Inbox,
	AlertCircle,
} from "lucide-react";
import { createPortal } from "react-dom";

import api from "@/api/axios";
import { logger } from "@/utils/logger";
import styles from "./FAQ.module.css";

/* ──────────────── Typy ──────────────── */
interface FAQItem {
	id: string;
	question: string;
	answer: string;
	category: string;
	createdAt: string;
	updatedAt: string;
}

interface FAQCategory {
	id: string;
	name: string;
}

type UserRole = "board" | "admin" | "member" | "guest";

/* ──────────────── Helper: rola użytkownika ──────────────── */
const getUserRole = (): UserRole => {
	try {
		const raw = localStorage.getItem("user");
		if (!raw) return "guest";
		const user = JSON.parse(raw);
		return (user?.role as UserRole) ?? "guest";
	} catch {
		return "guest";
	}
};

/* ──────────────── Modal formularza ──────────────── */
interface FormModalProps {
	initial?: FAQItem | null;
	categories: FAQCategory[];
	onClose: () => void;
	onSave: (data: Omit<FAQItem, "id" | "createdAt" | "updatedAt">) => Promise<void>;
}

const FormModal = ({
	initial,
	categories,
	onClose,
	onSave,
}: FormModalProps) => {
	const [question, setQuestion] = useState(initial?.question ?? "");
	const [answer, setAnswer] = useState(initial?.answer ?? "");
	const [category, setCategory] = useState(
		initial?.category ?? categories[0]?.id ?? "",
	);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	/* ESC zamyka modal */
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	/* Blokada scrolla body */
	useEffect(() => {
		const original = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = original;
		};
	}, []);

	const handleSubmit = async () => {
		if (!question.trim() || !answer.trim()) {
			setError("Pytanie i odpowiedź są wymagane.");
			return;
		}
		if (!category) {
			setError("Wybierz kategorię.");
			return;
		}

		setError("");
		setSaving(true);
		try {
			await onSave({
				question: question.trim(),
				answer: answer.trim(),
				category,
			});
		} catch (e: any) {
			logger.error("[FAQ] Błąd zapisu", e);
			setError(
				e?.response?.data?.message ??
					"Nie udało się zapisać. Spróbuj ponownie.",
			);
		} finally {
			setSaving(false);
		}
	};

	return createPortal(
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modalHeader}>
					<h3 className={styles.modalTitle}>
						{initial ? "Edytuj pytanie" : "Dodaj pytanie"}
					</h3>
					<button
						className={styles.modalClose}
						onClick={onClose}
						aria-label="Zamknij"
						type="button"
					>
						<X size={18} strokeWidth={2.5} />
					</button>
				</div>

				<div className={styles.modalBody}>
					<div className={styles.field}>
						<label className={styles.label}>Kategoria</label>
						<select
							className={styles.select}
							value={category}
							onChange={(e) => setCategory(e.target.value)}
						>
							<option value="" disabled>
								— wybierz kategorię —
							</option>
							{categories.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name}
								</option>
							))}
						</select>
					</div>

					<div className={styles.field}>
						<label className={styles.label}>Pytanie</label>
						<input
							className={styles.input}
							value={question}
							onChange={(e) => setQuestion(e.target.value)}
							placeholder="Wpisz treść pytania..."
						/>
					</div>

					<div className={styles.field}>
						<label className={styles.label}>Odpowiedź</label>
						<textarea
							className={styles.textarea}
							value={answer}
							onChange={(e) => setAnswer(e.target.value)}
							placeholder="Wpisz odpowiedź..."
						/>
					</div>

					{error && <span className={styles.error}>{error}</span>}
				</div>

				<div className={styles.modalFooter}>
					<button
						className={`${styles.btn} ${styles.btnSecondary}`}
						onClick={onClose}
						type="button"
						disabled={saving}
					>
						Anuluj
					</button>
					<button
						className={`${styles.btn} ${styles.btnPrimary}`}
						onClick={handleSubmit}
						type="button"
						disabled={saving}
					>
						{saving
							? "Zapisywanie..."
							: initial
								? "Zapisz zmiany"
								: "Dodaj"}
					</button>
				</div>
			</div>
		</div>,
		document.body,
	);
};

/* ──────────────── Główny komponent ──────────────── */
interface FAQProps {
	title?: string;
	userRole?: UserRole;
}

const FAQ = ({ title = "Najczęstsze pytania", userRole }: FAQProps) => {
	const [items, setItems] = useState<FAQItem[]>([]);
	const [categories, setCategories] = useState<FAQCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [openId, setOpenId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [activeCategory, setActiveCategory] = useState<string>("all");

	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<FAQItem | null>(null);

	const role: UserRole = userRole ?? getUserRole();
	const canManage = role === "board" || role === "admin";

	/* ─── FETCH: kategorie ─── */
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const res = await api.get<FAQCategory[]>("/faq/categories");
				setCategories(res.data);
			} catch (e: any) {
				logger.error("[FAQ] Błąd pobierania kategorii", e);
			}
		};
		fetchCategories();
	}, []);

	/* ─── FETCH: pytania ─── */
	const fetchItems = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.get<FAQItem[]>("/faq");
			setItems(res.data);
		} catch (e: any) {
			logger.error("[FAQ] Błąd pobierania pytań", e);
			setError(
				e?.response?.data?.message ??
					"Nie udało się pobrać listy pytań.",
			);
			setItems([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchItems();
	}, []);

	/* ─── Filtrowanie ─── */
	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return items.filter((item) => {
			const matchesCategory =
				activeCategory === "all" || item.category === activeCategory;
			const matchesSearch =
				!q ||
				item.question.toLowerCase().includes(q) ||
				item.answer.toLowerCase().includes(q);
			return matchesCategory && matchesSearch;
		});
	}, [items, search, activeCategory]);

	/* ─── CRUD ─── */
	const handleAdd = () => {
		setEditing(null);
		setModalOpen(true);
	};

	const handleEdit = (item: FAQItem) => {
		setEditing(item);
		setModalOpen(true);
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Czy na pewno usunąć to pytanie?")) return;
		try {
			await api.delete(`/faq/${id}`);
			setItems((prev) => prev.filter((i) => i.id !== id));
		} catch (e: any) {
			logger.error("[FAQ] Błąd usuwania", e);
			alert(
				e?.response?.data?.message ??
					"Nie udało się usunąć pytania.",
			);
		}
	};

	const handleSave = async (
		data: Omit<FAQItem, "id" | "createdAt" | "updatedAt">,
	) => {
		if (editing) {
			const res = await api.put<FAQItem>(`/faq/${editing.id}`, data);
			const updated = res.data;
			setItems((prev) =>
				prev.map((i) => (i.id === editing.id ? updated : i)),
			);
		} else {
			const res = await api.post<FAQItem>("/faq", data);
			const created = res.data;
			setItems((prev) => [created, ...prev]);
		}
		setModalOpen(false);
		setEditing(null);
	};

	const getCategoryName = (id: string) =>
		categories.find((c) => c.id === id)?.name ?? id;

	return (
		<div className={styles.page}>
			{/* ─── Nagłówek ─── */}
			<div className={styles.header}>
				<div>
					<h1 className={styles.title}>{title}</h1>
					<p className={styles.subtitle}>
						Znajdź odpowiedzi na najczęściej zadawane pytania
					</p>
				</div>
				{canManage && (
					<button
						className={`${styles.btn} ${styles.btnPrimary}`}
						onClick={handleAdd}
						type="button"
						disabled={categories.length === 0}
					>
						<Plus size={16} strokeWidth={2.5} />
						Dodaj pytanie
					</button>
				)}
			</div>

			{/* ─── Wyszukiwarka ─── */}
			<div className={styles.toolbar}>
				<Search
					className={styles.searchIcon}
					size={18}
					strokeWidth={2.2}
				/>
				<input
					className={styles.searchInput}
					placeholder="Szukaj pytania lub odpowiedzi..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			{/* ─── Filtry kategorii ─── */}
			{categories.length > 0 && (
				<div className={styles.categoryFilters}>
					<button
						className={`${styles.categoryChip} ${
							activeCategory === "all"
								? styles.categoryChipActive
								: ""
						}`}
						onClick={() => setActiveCategory("all")}
						type="button"
					>
						Wszystkie
					</button>
					{categories.map((c) => (
						<button
							key={c.id}
							className={`${styles.categoryChip} ${
								activeCategory === c.id
									? styles.categoryChipActive
									: ""
							}`}
							onClick={() => setActiveCategory(c.id)}
							type="button"
						>
							{c.name}
						</button>
					))}
				</div>
			)}

			{/* ─── Lista ─── */}
			{loading ? (
				<div className={styles.empty}>
					<HelpCircle size={40} strokeWidth={1.5} />
					<span>Ładowanie...</span>
				</div>
			) : error ? (
				<div className={styles.empty}>
					<AlertCircle size={40} strokeWidth={1.5} />
					<span>{error}</span>
					<button
						className={`${styles.btn} ${styles.btnSecondary}`}
						onClick={fetchItems}
						type="button"
					>
						Spróbuj ponownie
					</button>
				</div>
			) : filtered.length === 0 ? (
				<div className={styles.empty}>
					<Inbox size={40} strokeWidth={1.5} />
					<span>Brak pytań spełniających kryteria.</span>
				</div>
			) : (
				<div className={styles.list}>
					{filtered.map((item) => {
						const isOpen = openId === item.id;
						return (
							<div
								key={item.id}
								className={`${styles.item} ${
									isOpen ? styles.itemOpen : ""
								}`}
							>
								<button
									className={styles.itemHeader}
									onClick={() =>
										setOpenId(isOpen ? null : item.id)
									}
									aria-expanded={isOpen}
									type="button"
								>
									<span className={styles.categoryBadge}>
										{getCategoryName(item.category)}
									</span>
									<span className={styles.question}>
										{item.question}
									</span>
									<span
										className={`${styles.chevron} ${
											isOpen ? styles.chevronOpen : ""
										}`}
									>
										<ChevronDown
											size={18}
											strokeWidth={2.5}
										/>
									</span>
								</button>

								<div
									className={`${styles.answerWrapper} ${
										isOpen
											? styles.answerWrapperOpen
											: ""
									}`}
								>
									<div className={styles.answerInner}>
										<div className={styles.answer}>
											{item.answer}
										</div>

										{canManage && (
											<div
												className={styles.itemActions}
											>
												<button
													className={`${styles.btn} ${styles.btnSecondary}`}
													onClick={() =>
														handleEdit(item)
													}
													type="button"
												>
													<Pencil
														size={14}
														strokeWidth={2.5}
													/>
													Edytuj
												</button>
												<button
													className={`${styles.btn} ${styles.btnDanger}`}
													onClick={() =>
														handleDelete(item.id)
													}
													type="button"
												>
													<Trash2
														size={14}
														strokeWidth={2.5}
													/>
													Usuń
												</button>
											</div>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* ─── Modal ─── */}
			{modalOpen && (
				<FormModal
					initial={editing}
					categories={categories}
					onClose={() => {
						setModalOpen(false);
						setEditing(null);
					}}
					onSave={handleSave}
				/>
			)}
		</div>
	);
};

export default FAQ;