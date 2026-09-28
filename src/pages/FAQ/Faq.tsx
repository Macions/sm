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
	Settings2,
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

/* ──────────────── Modal kategorii ──────────────── */
interface CategoriesModalProps {
	categories: FAQCategory[];
	onClose: () => void;
	onCreated: (cat: FAQCategory) => void;
	onDeleted: (id: string) => void;
}

const CategoriesModal = ({
	categories,
	onClose,
	onCreated,
	onDeleted,
}: CategoriesModalProps) => {
	const [newName, setNewName] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	useEffect(() => {
		const original = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = original;
		};
	}, []);

	const handleAdd = async () => {
		if (!newName.trim()) {
			setError("Wpisz nazwę kategorii.");
			return;
		}
		setError("");
		setSaving(true);
		try {
			const res = await api.post<FAQCategory>("/faq/categories", {
				name: newName.trim(),
			});
			onCreated(res.data);
			setNewName("");
		} catch (e: any) {
			logger.error("[FAQ] Błąd dodawania kategorii", e);
			setError(e?.response?.data?.error ?? "Nie udało się dodać kategorii.");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (
			!confirm(
				"Usunąć tę kategorię? Pytania w niej pozostaną, ale stracą przypisanie.",
			)
		)
			return;
		try {
			await api.delete(`/faq/categories/${id}`);

			onDeleted(id);
		} catch (e: any) {
			logger.error("[FAQ] Błąd usuwania kategorii", e);
			alert(e?.response?.data?.error ?? "Nie udało się usunąć kategorii.");
		}
	};

	return createPortal(
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modalHeader}>
					<h3 className={styles.modalTitle}>Zarządzaj kategoriami</h3>
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
						<label className={styles.label}>Nowa kategoria</label>
						<div style={{ display: "flex", gap: 8 }}>
							<input
								className={styles.input}
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleAdd();
								}}
								placeholder="Nazwa kategorii..."
							/>
							<button
								className={`${styles.btn} ${styles.btnPrimary}`}
								onClick={handleAdd}
								type="button"
								disabled={saving}
								style={{ flexShrink: 0 }}
							>
								{saving ? "..." : "Dodaj"}
							</button>
						</div>
						{error && <span className={styles.error}>{error}</span>}
					</div>

					<div className={styles.field}>
						<label className={styles.label}>
							Istniejące kategorie ({categories.length})
						</label>
						{categories.length === 0 ? (
							<div style={{ color: "#a3a3a3", fontSize: 13, padding: 8 }}>
								Brak kategorii. Dodaj pierwszą powyżej.
							</div>
						) : (
							<ul
								style={{
									listStyle: "none",
									margin: 0,
									padding: 0,
									display: "flex",
									flexDirection: "column",
									gap: 6,
								}}
							>
								{categories.map((c) => (
									<li
										key={c.id}
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											padding: "8px 12px",
											border: "1px solid #f0f0f0",
											borderRadius: 8,
										}}
									>
										<span style={{ fontSize: 14 }}>{c.name}</span>
										<button
											className={`${styles.btn} ${styles.btnDanger}`}
											onClick={() => handleDelete(c.id)}
											type="button"
											style={{ padding: "4px 10px" }}
										>
											<Trash2 size={12} strokeWidth={2.5} />
											Usuń
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>

				<div className={styles.modalFooter}>
					<button
						className={`${styles.btn} ${styles.btnSecondary}`}
						onClick={onClose}
						type="button"
					>
						Zamknij
					</button>
				</div>
			</div>
		</div>,
		document.body,
	);
};

/* ──────────────── Modal formularza ──────────────── */
interface FormModalProps {
	initial?: FAQItem | null;
	categories: FAQCategory[];
	onClose: () => void;
	onSave: (
		data: Omit<FAQItem, "id" | "createdAt" | "updatedAt">,
	) => Promise<void>;
	onCategoryCreated: (cat: FAQCategory) => void;
}

const FormModal = ({
	initial,
	categories,
	onClose,
	onSave,
	onCategoryCreated,
}: FormModalProps) => {
	const [question, setQuestion] = useState(initial?.question ?? "");
	const [answer, setAnswer] = useState(initial?.answer ?? "");
	const [category, setCategory] = useState(
		initial?.category ?? categories[0]?.id ?? "",
	);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [showNewCategory, setShowNewCategory] = useState(false);
	const [creatingCategory, setCreatingCategory] = useState(false);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	useEffect(() => {
		const original = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = original;
		};
	}, []);

	const handleCreateCategory = async () => {
		if (!newCategoryName.trim()) return;
		setCreatingCategory(true);
		try {
			const res = await api.post<FAQCategory>("/faq/categories", {
				name: newCategoryName.trim(),
			});
			onCategoryCreated(res.data);
			setCategory(res.data.id);
			setNewCategoryName("");
			setShowNewCategory(false);
		} catch (e: any) {
			logger.error("[FAQ] Błąd tworzenia kategorii", e);
			setError(e?.response?.data?.error ?? "Nie udało się dodać kategorii.");
		} finally {
			setCreatingCategory(false);
		}
	};

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
						{!showNewCategory ? (
							<div style={{ display: "flex", gap: 8 }}>
								<select
									className={styles.select}
									value={category}
									onChange={(e) => setCategory(e.target.value)}
									style={{ flex: 1 }}
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
								<button
									className={`${styles.btn} ${styles.btnSecondary}`}
									onClick={() => setShowNewCategory(true)}
									type="button"
									title="Dodaj nową kategorię"
									style={{ flexShrink: 0 }}
								>
									<Plus size={14} strokeWidth={2.5} />
								</button>
							</div>
						) : (
							<div style={{ display: "flex", gap: 8 }}>
								<input
									className={styles.input}
									value={newCategoryName}
									onChange={(e) => setNewCategoryName(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") handleCreateCategory();
										if (e.key === "Escape") setShowNewCategory(false);
									}}
									placeholder="Nazwa nowej kategorii..."
									autoFocus
									style={{ flex: 1 }}
								/>
								<button
									className={`${styles.btn} ${styles.btnPrimary}`}
									onClick={handleCreateCategory}
									type="button"
									disabled={creatingCategory || !newCategoryName.trim()}
									style={{ flexShrink: 0 }}
								>
									{creatingCategory ? "..." : "Dodaj"}
								</button>
								<button
									className={`${styles.btn} ${styles.btnSecondary}`}
									onClick={() => {
										setShowNewCategory(false);
										setNewCategoryName("");
									}}
									type="button"
									style={{ flexShrink: 0 }}
								>
									<X size={14} strokeWidth={2.5} />
								</button>
							</div>
						)}
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
						{saving ? "Zapisywanie..." : initial ? "Zapisz zmiany" : "Dodaj"}
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
	const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);

	const role: UserRole = userRole ?? getUserRole();
	const canManage = role === "board" || role === "admin";

	/* ─── FETCH: kategorie ─── */
	const fetchCategories = async () => {
		try {
			const res = await api.get<FAQCategory[]>("/faq/categories");

			const data = res.data;
			if (Array.isArray(data)) {
				setCategories(data);
			} else {
				setCategories([]);
			}
		} catch (e: any) {
			logger.error("[FAQ] Błąd pobierania kategorii", e);
		}
	};

	useEffect(() => {
		fetchCategories();
	}, []);

	/* ─── FETCH: pytania ─── */
	const fetchItems = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await api.get<FAQItem[]>("/faq");

			const data = res.data;

			if (Array.isArray(data)) {
				setItems(data);
			} else if (typeof data === "string") {
				try {
					const parsed = JSON.parse(data);
					setItems(Array.isArray(parsed) ? parsed : []);
				} catch {
					setItems([]);
				}
			} else {
				logger.error("[FAQ] Nieoczekiwany format:", data);
				setItems([]);
			}
		} catch (e: any) {
			logger.error("[FAQ] Błąd pobierania pytań", e);
			setError(
				e?.response?.data?.message ?? "Nie udało się pobrać listy pytań.",
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
			alert(e?.response?.data?.message ?? "Nie udało się usunąć pytania.");
		}
	};

	const handleSave = async (
		data: Omit<FAQItem, "id" | "createdAt" | "updatedAt">,
	) => {
		if (editing) {
			const res = await api.put<FAQItem>(`/faq/${editing.id}`, data);

			const updated = res.data;
			setItems((prev) => prev.map((i) => (i.id === editing.id ? updated : i)));
		} else {
			const res = await api.post<FAQItem>("/faq", data);

			const created = res.data;
			setItems((prev) => [created, ...prev]);
		}
		setModalOpen(false);
		setEditing(null);
	};

	const handleCategoryCreated = (cat: FAQCategory) => {
		setCategories((prev) => [...prev, cat]);
	};

	const handleCategoryDeleted = (id: string) => {
		setCategories((prev) => prev.filter((c) => c.id !== id));
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
					<div style={{ display: "flex", gap: 8 }}>
						<button
							className={`${styles.btn} ${styles.btnSecondary}`}
							onClick={() => setCategoriesModalOpen(true)}
							type="button"
						>
							<Settings2 size={16} strokeWidth={2.5} />
							Kategorie
						</button>
						<button
							className={`${styles.btn} ${styles.btnPrimary}`}
							onClick={handleAdd}
							type="button"
						>
							<Plus size={16} strokeWidth={2.5} />
							Dodaj pytanie
						</button>
					</div>
				)}
			</div>

			{/* ─── Wyszukiwarka ─── */}
			<div className={styles.toolbar}>
				<Search className={styles.searchIcon} size={18} strokeWidth={2.2} />
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
							activeCategory === "all" ? styles.categoryChipActive : ""
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
								activeCategory === c.id ? styles.categoryChipActive : ""
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
								className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}
							>
								<button
									className={styles.itemHeader}
									onClick={() => setOpenId(isOpen ? null : item.id)}
									aria-expanded={isOpen}
									type="button"
								>
									<span className={styles.categoryBadge}>
										{getCategoryName(item.category)}
									</span>
									<span className={styles.question}>{item.question}</span>
									<span
										className={`${styles.chevron} ${
											isOpen ? styles.chevronOpen : ""
										}`}
									>
										<ChevronDown size={18} strokeWidth={2.5} />
									</span>
								</button>

								<div
									className={`${styles.answerWrapper} ${
										isOpen ? styles.answerWrapperOpen : ""
									}`}
								>
									<div className={styles.answerInner}>
										<div className={styles.answer}>{item.answer}</div>

										{canManage && (
											<div className={styles.itemActions}>
												<button
													className={`${styles.btn} ${styles.btnSecondary}`}
													onClick={() => handleEdit(item)}
													type="button"
												>
													<Pencil size={14} strokeWidth={2.5} />
													Edytuj
												</button>
												<button
													className={`${styles.btn} ${styles.btnDanger}`}
													onClick={() => handleDelete(item.id)}
													type="button"
												>
													<Trash2 size={14} strokeWidth={2.5} />
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

			{/* ─── Modal pytania ─── */}
			{modalOpen && (
				<FormModal
					initial={editing}
					categories={categories}
					onClose={() => {
						setModalOpen(false);
						setEditing(null);
					}}
					onSave={handleSave}
					onCategoryCreated={handleCategoryCreated}
				/>
			)}

			{/* ─── Modal kategorii ─── */}
			{categoriesModalOpen && (
				<CategoriesModal
					categories={categories}
					onClose={() => setCategoriesModalOpen(false)}
					onCreated={handleCategoryCreated}
					onDeleted={handleCategoryDeleted}
				/>
			)}
		</div>
	);
};

export default FAQ;
