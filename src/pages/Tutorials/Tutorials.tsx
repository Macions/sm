import { useState, useEffect, useMemo } from "react";
import { hasPermission } from "../../utils/permissions";
import { logger } from "@/utils/logger";
import {
	BookOpen,
	Search,
	X,
	Filter,
	Plus,
	Edit,
	Trash2,
	Download,
	FileText,
	Users,
	UserCog,
	UserCheck,
	Calendar,
	Tag,
	BadgeCheck,
	File,
} from "lucide-react";
import styles from "./Tutorials.module.css";

type TutorialCategory =
	| "new_member"
	| "project_guidelines"
	| "contributions"
	| "statute"
	| "regulations"
	| "distinctions"
	| "coordinator"
	| "functional";

type TutorialAccess = "all" | "coordinator" | "functional" | "board";

type Tutorial = {
	id: string;
	title: string;
	description: string;
	category: TutorialCategory;
	access: TutorialAccess;
	author: string;
	createdAt: string;
	updatedAt: string;
	content: string;
	attachments?: {
		name: string;
		url: string;
		size: string;
		file?: File;
		id?: string;
	}[];
	isNew?: boolean;
	isUpdated?: boolean;
	functionalRoles?: string[];
};

type User = {
	id: string;
	name: string;
	role: "admin" | "coordinator" | "functional" | "member";
	functionalRole?: string;
};

const isNewTutorial = (updatedAt: string): boolean => {
	const now = new Date();
	const updateDate = new Date(updatedAt);
	const diffTime = Math.abs(now.getTime() - updateDate.getTime());
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays <= 7;
};

const isUpdatedTutorial = (
	createdAt: string | undefined,
	updatedAt: string,
): boolean => {
	if (!createdAt) return false;
	const createDate = new Date(createdAt);
	const updateDate = new Date(updatedAt);
	return updateDate > createDate;
};

const CATEGORY_LABELS: Record<TutorialCategory, string> = {
	new_member: "Dla nowych członków",
	project_guidelines: "Tworzenie projektów",
	contributions: "Opłacanie składek",
	statute: "Statut",
	regulations: "Regulamin",
	distinctions: "Wyróżnienia",
	coordinator: "Dla koordynatorów",
	functional: "Dla osób funkcyjnych",
};

const CATEGORY_ICONS: Record<TutorialCategory, React.ReactNode> = {
	new_member: <Users size={16} />,
	project_guidelines: <FileText size={16} />,
	contributions: <File size={16} />,
	statute: <BookOpen size={16} />,
	regulations: <FileText size={16} />,
	distinctions: <BadgeCheck size={16} />,
	coordinator: <UserCog size={16} />,
	functional: <UserCheck size={16} />,
};

const ACCESS_COLORS: Record<TutorialAccess, string> = {
	all: styles.accessAll,
	coordinator: styles.accessCoordinator,
	functional: styles.accessFunctional,
	board: styles.accessBoard,
};

const downloadFile = async (url: string, fileName: string) => {
	try {
		const fullUrl = url.startsWith("/uploads") ? `/api${url}` : url;

		logger.debug("📥 Pobieranie:", fullUrl);

		const token = localStorage.getItem("accessToken");
		const response = await fetch(fullUrl, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Błąd pobierania: ${response.status}`);
		}

		const blob = await response.blob();
		logger.debug("📦 Rozmiar pliku:", blob.size, "Typ:", blob.type);

		const downloadUrl = window.URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = downloadUrl;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		setTimeout(() => {
			window.URL.revokeObjectURL(downloadUrl);
		}, 1000);
	} catch (error) {
		logger.error("❌ Błąd pobierania:", error);
		alert("Nie udało się pobrać pliku");
	}
};

interface TutorialCardProps {
	tutorial: Tutorial;
	onEdit: (tutorial: Tutorial) => void;
	onDelete: (id: string) => void;
	canEdit: boolean;
	canView: boolean;
}

function TutorialCard({
	tutorial,
	onEdit,
	onDelete,
	canEdit,
	canView,
}: TutorialCardProps) {
	const [isExpanded] = useState(false);

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString("pl-PL", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const isNew = isNewTutorial(tutorial.updatedAt);
	const isUpdated = isUpdatedTutorial(tutorial.createdAt, tutorial.updatedAt);

	const getAccessLabel = () => {
		if (tutorial.access === "all") return "Dla wszystkich";
		if (tutorial.access === "coordinator") return "🔒 Dla koordynatorów";
		if (tutorial.access === "functional") return "🔒 Dla osób funkcyjnych";
		return "🔒 Dla zarządu";
	};

	if (!canView) return null;

	return (
		<div className={styles.tutorialCard}>
			<div className={styles.tutorialCard__header}>
				<div className={styles.tutorialCard__titleRow}>
					<div className={styles.tutorialCard__titleGroup}>
						<div className={styles.tutorialCard__icon}>
							{CATEGORY_ICONS[tutorial.category]}
						</div>
						<h3 className={styles.tutorialCard__title}>{tutorial.title}</h3>
					</div>
					<div className={styles.tutorialCard__badges}>
						{isNew && (
							<span className={styles.tutorialCard__badgeNew}>Nowy</span>
						)}
						{!isNew && isUpdated && (
							<span className={styles.tutorialCard__badgeUpdated}>
								Aktualizacja
							</span>
						)}
						<span
							className={`${styles.tutorialCard__access} ${ACCESS_COLORS[tutorial.access]}`}
						>
							{getAccessLabel()}
						</span>
					</div>
				</div>
				<p className={styles.tutorialCard__description}>
					{tutorial.description}
				</p>
			</div>

			<div className={styles.tutorialCard__body}>
				<div className={styles.tutorialCard__meta}>
					<div className={styles.tutorialCard__metaItem}>
						<Tag size={14} />
						<span>{CATEGORY_LABELS[tutorial.category]}</span>
					</div>
					<div className={styles.tutorialCard__metaItem}>
						<Users size={14} />
						<span>
							Autor: <strong>{tutorial.author}</strong>
						</span>
					</div>
					<div className={styles.tutorialCard__metaItem}>
						<Calendar size={14} />
						<span>
							Ostatnia aktualizacja:{" "}
							<strong>{formatDate(tutorial.updatedAt)}</strong>
						</span>
					</div>
				</div>

				{tutorial.functionalRoles && tutorial.functionalRoles.length > 0 && (
					<div className={styles.tutorialCard__roles}>
						<span className={styles.tutorialCard__rolesLabel}>Stanowiska:</span>
						<div className={styles.tutorialCard__rolesList}>
							{tutorial.functionalRoles.map((role) => (
								<span key={role} className={styles.tutorialCard__roleTag}>
									{role}
								</span>
							))}
						</div>
					</div>
				)}

				{isExpanded && tutorial.content && (
					<div className={styles.tutorialCard__content}>
						<h4 className={styles.tutorialCard__contentTitle}>
							Treść poradnika:
						</h4>
						<p className={styles.tutorialCard__contentText}>
							{tutorial.content}
						</p>
					</div>
				)}

				{tutorial.attachments && tutorial.attachments.length > 0 && (
					<div className={styles.tutorialCard__attachments}>
						<h4 className={styles.tutorialCard__attachmentsTitle}>
							Załączniki:
						</h4>
						<ul className={styles.tutorialCard__attachmentsList}>
							{tutorial.attachments.map((file) => (
								<li key={file.name} className={styles.tutorialCard__attachment}>
									<File size={14} />
									<span>{file.name}</span>
									<span className={styles.tutorialCard__attachmentSize}>
										{file.size}
									</span>
									<button
										className={styles.tutorialCard__downloadBtn}
										onClick={() => downloadFile(file.url, file.name)}
									>
										<Download size={14} />
									</button>
								</li>
							))}
						</ul>
					</div>
				)}

				<div className={styles.tutorialCard__actions}>
					<div className={styles.tutorialCard__actionButtons}>
						{canEdit && (
							<>
								<button
									className={styles.tutorialCard__actionBtn}
									onClick={() => onEdit(tutorial)}
									title="Edytuj"
								>
									<Edit size={16} />
								</button>
								<button
									className={`${styles.tutorialCard__actionBtn} ${styles.tutorialCard__actionBtnDanger}`}
									onClick={() => onDelete(tutorial.id)}
									title="Usuń"
								>
									<Trash2 size={16} />
								</button>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

interface TutorialModalProps {
	isOpen: boolean;
	tutorial: Tutorial | null;
	isViewOnly?: boolean;
	onClose: () => void;
	onSave?: (tutorial: Tutorial) => void;
}

function TutorialModal({
	isOpen,
	tutorial,
	isViewOnly = false,
	onClose,
	onSave,
}: TutorialModalProps) {
	const [formData, setFormData] = useState<Partial<Tutorial>>(
		tutorial || {
			title: "",
			description: "",
			category: "new_member",
			access: "all",
			author: "",
			content: "",
			attachments: [],
			functionalRoles: [],
		},
	);
	const [_loading, setLoading] = useState(false);
	const [newAttachment, setNewAttachment] = useState<{
		name: string;
		url: string;
		size: string;
		file?: File;
	}>({
		name: "",
		url: "",
		size: "",
	});
	const [newRole, setNewRole] = useState("");
	const [attachmentType, setAttachmentType] = useState<"file" | "link">("file");
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	useEffect(() => {
		if (tutorial) {
			setFormData({
				title: tutorial.title || "",
				description: tutorial.description || "",
				category: tutorial.category || "new_member",
				access: tutorial.access || "all",
				author: tutorial.author || "",
				content: tutorial.content || "",
				attachments: tutorial.attachments || [],
				functionalRoles: tutorial.functionalRoles || [],
			});
		} else {
			setFormData({
				title: "",
				description: "",
				category: "new_member",
				access: "all",
				author: "",
				content: "",
				attachments: [],
				functionalRoles: [],
			});
		}
	}, [tutorial, isOpen]);

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!onSave || isViewOnly) return;

		setIsUploading(true);
		setLoading(true);

		try {
			const now = new Date().toISOString().split("T")[0];
			const token = localStorage.getItem("accessToken");

			const tutorialData = {
				id: tutorial?.id || `tutorial-${Date.now()}`,
				title: formData.title || "",
				description: formData.description || "",
				category: formData.category as TutorialCategory,
				access: formData.access as TutorialAccess,
				author: formData.author || "",
				createdAt: tutorial?.createdAt || now,
				updatedAt: now,
				content: formData.content || "",
				functionalRoles: formData.functionalRoles || [],
				attachments: (formData.attachments || [])
					.filter((att) => att.id)
					.map((att) => ({
						id: att.id,
						name: att.name,
						url: att.url,
						size: att.size,
					})),
			};

			const formDataToSend = new FormData();
			formDataToSend.append("data", JSON.stringify(tutorialData));

			(formData.attachments || [])
				.filter(
					(att) =>
						att.file && typeof att.file === "object" && "name" in att.file,
				)
				.forEach((attachment) => {
					if (attachment.file) {
						formDataToSend.append("files", attachment.file);
					}
				});

			const url = tutorial?.id
				? `/api/tutorials/${tutorial.id}`
				: "/api/tutorials";

			const response = await fetch(url, {
				method: tutorial?.id ? "PUT" : "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formDataToSend,
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`Błąd zapisu: ${error}`);
			}

			const savedTutorial = await response.json();
			onSave(savedTutorial);
			onClose();
		} catch (error) {
			logger.error("❌ Błąd zapisu:", error);
			alert("Nie udało się zapisać: " + (error as Error).message);
		} finally {
			setIsUploading(false);
			setLoading(false);
		}
	};

	const handleFileUpload = (file: File) => {
		if (file.size > 10 * 1024 * 1024) {
			alert("Plik jest za duży. Maksymalny rozmiar: 10MB");
			return;
		}

		const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);

		const newAttachmentObj = {
			name: file.name,
			url: URL.createObjectURL(file),
			size: sizeInMB + " MB",
			file: file,
		};

		setFormData((prev) => ({
			...prev,
			attachments: [...(prev.attachments || []), newAttachmentObj],
		}));

		setNewAttachment({ name: "", url: "", size: "" });
	};

	const removeAttachment = async (index: number) => {
		const attachment = formData.attachments?.[index];

		if (attachment?.id) {
			try {
				const token = localStorage.getItem("accessToken");
				const response = await fetch(
					`/api/tutorials/attachments/${attachment.id}`,
					{
						method: "DELETE",
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				);

				if (!response.ok) {
					throw new Error("Nie udało się usunąć pliku");
				}
			} catch (error) {
				logger.error("❌ Błąd usuwania pliku:", error);
				alert("Nie udało się usunąć pliku");
				return;
			}
		}

		setFormData({
			...formData,
			attachments: formData.attachments?.filter((_, i) => i !== index) || [],
		});
	};

	const addAttachment = () => {
		if (newAttachment.name.trim() && newAttachment.url.trim()) {
			setFormData({
				...formData,
				attachments: [
					...(formData.attachments || []),
					{
						name: newAttachment.name,
						url: newAttachment.url,
						size: newAttachment.size || "0 MB",
					},
				],
			});
			setNewAttachment({ name: "", url: "", size: "" });
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (file) {
			handleFileUpload(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const addRole = () => {
		if (newRole.trim() && !formData.functionalRoles?.includes(newRole.trim())) {
			setFormData({
				...formData,
				functionalRoles: [...(formData.functionalRoles || []), newRole.trim()],
			});
			setNewRole("");
		}
	};

	const removeRole = (role: string) => {
		setFormData({
			...formData,
			functionalRoles:
				formData.functionalRoles?.filter((r) => r !== role) || [],
		});
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div
				className={`${styles.modal} ${isViewOnly ? styles.modalView : ""}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modal__header}>
					<h2 className={styles.modal__title}>
						{isViewOnly
							? "Podgląd poradnika"
							: tutorial
								? "Edytuj poradnik"
								: "Dodaj nowy poradnik"}
					</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Tytuł *</label>
						<input
							type="text"
							className={styles.modal__input}
							value={formData.title || ""}
							onChange={(e) =>
								setFormData({ ...formData, title: e.target.value })
							}
							required
							disabled={isViewOnly || isUploading}
						/>
					</div>

					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Opis *</label>
						<textarea
							className={`${styles.modal__input} ${styles.modal__textarea}`}
							value={formData.description || ""}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							required
							disabled={isViewOnly || isUploading}
						/>
					</div>

					<div className={styles.modal__row}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Kategoria *</label>
							<select
								className={styles.modal__select}
								value={formData.category || "new_member"}
								onChange={(e) =>
									setFormData({
										...formData,
										category: e.target.value as TutorialCategory,
									})
								}
								disabled={isViewOnly || isUploading}
							>
								{Object.entries(CATEGORY_LABELS).map(([key, label]) => (
									<option key={key} value={key}>
										{label}
									</option>
								))}
							</select>
						</div>

						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Dostępność *</label>
							<select
								className={styles.modal__select}
								value={formData.access || "all"}
								onChange={(e) =>
									setFormData({
										...formData,
										access: e.target.value as TutorialAccess,
									})
								}
								disabled={isViewOnly || isUploading}
							>
								<option value="all">Dla wszystkich</option>
								<option value="coordinator">Dla koordynatorów</option>
								<option value="functional">Dla osób funkcyjnych</option>
								<option value="board">Dla zarządu</option>
							</select>
						</div>
					</div>

					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Autor *</label>
						<input
							type="text"
							className={styles.modal__input}
							value={formData.author || ""}
							onChange={(e) =>
								setFormData({ ...formData, author: e.target.value })
							}
							required
							disabled={isViewOnly || isUploading}
						/>
					</div>

					{formData.category === "functional" && (
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>
								Stanowiska (dla osób funkcyjnych)
							</label>
							<div className={styles.modal__teamInput}>
								<input
									type="text"
									className={styles.modal__input}
									value={newRole}
									onChange={(e) => setNewRole(e.target.value)}
									placeholder="Nazwa stanowiska"
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											addRole();
										}
									}}
									disabled={isViewOnly || isUploading}
								/>
								<button
									type="button"
									className={styles.modal__addMember}
									onClick={addRole}
									disabled={isViewOnly || isUploading}
								>
									<Plus size={16} />
								</button>
							</div>
							{formData.functionalRoles &&
								formData.functionalRoles.length > 0 && (
									<div className={styles.modal__teamList}>
										{formData.functionalRoles.map((role) => (
											<span key={role} className={styles.modal__teamTag}>
												{role}
												{!isViewOnly && (
													<button
														type="button"
														className={styles.modal__removeMember}
														onClick={() => removeRole(role)}
														disabled={isUploading}
													>
														<X size={12} />
													</button>
												)}
											</span>
										))}
									</div>
								)}
						</div>
					)}

					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Treść poradnika</label>
						<textarea
							className={`${styles.modal__input} ${styles.modal__textarea}`}
							value={formData.content || ""}
							onChange={(e) =>
								setFormData({ ...formData, content: e.target.value })
							}
							placeholder="Pełna treść poradnika..."
							rows={6}
							disabled={isViewOnly || isUploading}
						/>
					</div>

					{!isViewOnly && (
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Załączniki</label>

							{isUploading && (
								<div className={styles.modal__progress}>
									<div
										className={styles.modal__progressBar}
										style={{ width: "100%" }}
									/>
									<span>Przesyłanie...</span>
								</div>
							)}

							<div className={styles.modal__attachmentToggle}>
								<button
									type="button"
									className={`${styles.modal__toggleBtn} ${attachmentType === "file" ? styles.modal__toggleBtnActive : ""}`}
									onClick={() => setAttachmentType("file")}
									disabled={isUploading}
								>
									Dodaj plik
								</button>
								<button
									type="button"
									className={`${styles.modal__toggleBtn} ${attachmentType === "link" ? styles.modal__toggleBtnActive : ""}`}
									onClick={() => setAttachmentType("link")}
									disabled={isUploading}
								>
									Dodaj link
								</button>
							</div>

							{attachmentType === "file" ? (
								<div
									className={`${styles.modal__dropzone} ${isDragging ? styles.modal__dropzoneDragging : ""}`}
									onDrop={handleDrop}
									onDragOver={handleDragOver}
									onDragLeave={handleDragLeave}
								>
									<input
										type="file"
										id="fileInput"
										className={styles.modal__fileInput}
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (file) handleFileUpload(file);
										}}
										disabled={isUploading}
									/>
									<label
										htmlFor="fileInput"
										className={styles.modal__dropzoneLabel}
									>
										<span>Przeciągnij plik tutaj lub kliknij aby wybrać</span>
										<span className={styles.modal__dropzoneHint}>
											Maksymalny rozmiar: 10 MB
										</span>
									</label>
								</div>
							) : (
								<div className={styles.modal__linkInput}>
									<input
										type="text"
										className={styles.modal__input}
										value={newAttachment.name}
										onChange={(e) =>
											setNewAttachment({
												...newAttachment,
												name: e.target.value,
											})
										}
										placeholder="Nazwa pliku (np. Dokument.pdf)"
										disabled={isUploading}
									/>
									<input
										type="text"
										className={styles.modal__input}
										value={newAttachment.url}
										onChange={(e) =>
											setNewAttachment({
												...newAttachment,
												url: e.target.value,
											})
										}
										placeholder="URL pliku (np. https://...)"
										disabled={isUploading}
									/>
									<button
										type="button"
										className={styles.modal__addBtn}
										onClick={addAttachment}
										disabled={
											!newAttachment.name.trim() ||
											!newAttachment.url.trim() ||
											isUploading
										}
									>
										<Plus size={16} />
										Dodaj link
									</button>
								</div>
							)}

							{formData.attachments && formData.attachments.length > 0 && (
								<div className={styles.modal__fileList}>
									{formData.attachments.map((file, index) => (
										<div key={index} className={styles.modal__fileItem}>
											<File size={14} />
											<span>{file.name}</span>
											<span className={styles.modal__fileSize}>
												{file.size || "0 MB"}
											</span>
											{!isViewOnly && !isUploading && (
												<button
													type="button"
													className={styles.modal__removeFile}
													onClick={() => removeAttachment(index)}
												>
													<X size={14} />
												</button>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{isViewOnly &&
						formData.attachments &&
						formData.attachments.length > 0 && (
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>Załączniki</label>
								<div className={styles.modal__fileListView}>
									{formData.attachments.map((file, index) => (
										<div key={index} className={styles.modal__fileItemView}>
											<File size={14} />
											<span>{file.name}</span>
											<span className={styles.modal__fileSize}>
												{file.size}
											</span>
											<button
												className={styles.modal__downloadBtn}
												onClick={() => downloadFile(file.url, file.name)}
											>
												<Download size={14} />
											</button>
										</div>
									))}
								</div>
							</div>
						)}

					<div className={styles.modal__actions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={onClose}
							disabled={isUploading}
						>
							{isViewOnly ? "Zamknij" : "Anuluj"}
						</button>
						{!isViewOnly && (
							<button
								type="submit"
								className={styles.modal__btnSave}
								disabled={isUploading}
							>
								{isUploading
									? "Zapisywanie..."
									: tutorial
										? "Zapisz zmiany"
										: "Dodaj poradnik"}
							</button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}

export default function Tutorials() {
	const [loading, setLoading] = useState(true);
	const [tutorials, setTutorials] = useState<Tutorial[]>([]);
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<
		TutorialCategory | "all"
	>("all");
	const [selectedAccess, setSelectedAccess] = useState<TutorialAccess | "all">(
		"all",
	);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);

	const canManageTutorials = currentUser
		? hasPermission(currentUser.role, "canManageGuides")
		: false;
	useEffect(() => {
		const fetchUserAndTutorials = async () => {
			try {
				setLoading(true);
				const token = localStorage.getItem("accessToken");

				const userResponse = await fetch("/api/profile", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (!userResponse.ok) {
					throw new Error("Błąd pobierania profilu");
				}

				const userData = await userResponse.json();
				logger.debug("📊 Dane użytkownika z API:", userData);

				const mappedUser: User = {
					id: userData.id,
					name:
						`${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
						"Użytkownik",
					role: userData.role || "member",
					functionalRole: userData.function || userData.functional_role || "",
				};

				setCurrentUser(mappedUser);
				logger.debug("✅ Zmapowany użytkownik:", mappedUser);
				logger.debug("🔍 Rola użytkownika:", mappedUser.role);

				const tutorialsResponse = await fetch("/api/tutorials", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (!tutorialsResponse.ok) {
					throw new Error("Błąd pobierania poradników");
				}

				const tutorialsData = await tutorialsResponse.json();
				setTutorials(tutorialsData);
			} catch (error) {
				logger.error("❌ Błąd:", error);
				setTutorials([]);
			} finally {
				setLoading(false);
			}
		};

		fetchUserAndTutorials();
	}, []);
	const canViewTutorial = (tutorial: Tutorial): boolean => {
		if (tutorial.access === "all") return true;
		if (
			tutorial.access === "coordinator" &&
			hasPermission(currentUser?.role, "canManageGuides")
		)
			return true;
		if (
			tutorial.access === "functional" &&
			hasPermission(currentUser?.role, "canManageGuides")
		) {
			if (tutorial.functionalRoles) {
				if (!currentUser) return false;
				return tutorial.functionalRoles.includes(
					currentUser.functionalRole || "",
				);
			}
			return true;
		}
		if (
			tutorial.access === "board" &&
			hasPermission(currentUser?.role, "canManageTeams")
		)
			return true;
		return false;
	};

	const filteredTutorials = useMemo(() => {
		return tutorials.filter((tutorial) => {
			const matchesSearch =
				tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				tutorial.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
				tutorial.author.toLowerCase().includes(searchTerm.toLowerCase());

			const matchesCategory =
				selectedCategory === "all" || tutorial.category === selectedCategory;
			const matchesAccess =
				selectedAccess === "all" || tutorial.access === selectedAccess;

			const canView = canViewTutorial(tutorial);

			return matchesSearch && matchesCategory && matchesAccess && canView;
		});
	}, [tutorials, searchTerm, selectedCategory, selectedAccess, currentUser]);

	const handleAddTutorial = () => {
		setEditingTutorial(null);
		setIsModalOpen(true);
	};

	const handleEditTutorial = (tutorial: Tutorial) => {
		setEditingTutorial(tutorial);
		setIsModalOpen(true);
	};

	const handleDeleteTutorial = async (id: string) => {
		if (!window.confirm("Czy na pewno chcesz usunąć ten poradnik?")) return;

		try {
			const token = localStorage.getItem("accessToken");

			const response = await fetch(`/api/tutorials/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Błąd usuwania");
			}

			const fetchResponse = await fetch("/api/tutorials", {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});
			const allTutorials = await fetchResponse.json();
			setTutorials(allTutorials);
		} catch (error) {
			logger.error("❌ Błąd usuwania:", error);
			alert("Nie udało się usunąć poradnika");
		}
	};

	const handleSaveTutorial = async (savedTutorial: Tutorial) => {
		logger.debug("✅ Otrzymano zapisany poradnik:", savedTutorial);

		try {
			const token = localStorage.getItem("accessToken");

			const response = await fetch("/api/tutorials", {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Błąd pobierania poradników");
			}

			const allTutorials = await response.json();
			setTutorials(allTutorials);

			logger.debug("✅ Odświeżono listę poradników");
		} catch (error) {
			logger.error("❌ Błąd odświeżania:", error);

			setTutorials((prev) => {
				const exists = prev.some((t) => t.id === savedTutorial.id);
				if (exists) {
					return prev.map((t) =>
						t.id === savedTutorial.id ? savedTutorial : t,
					);
				} else {
					return [savedTutorial, ...prev];
				}
			});
		}
	};

	const clearFilters = () => {
		setSearchTerm("");
		setSelectedCategory("all");
		setSelectedAccess("all");
	};

	const getCategoryCount = (category: TutorialCategory) => {
		return tutorials.filter(
			(t) => t.category === category && canViewTutorial(t),
		).length;
	};
	if (loading || !currentUser) {
		return (
			<div className={styles.tutorials}>
				<div className={styles.loadingState}>
					<div className={styles.loadingSpinner}></div>
				</div>
			</div>
		);
	}
	return (
		<div className={styles.tutorials}>
			<div className={styles.header}>
				<div className={styles.header__left}>
					<h1 className={styles.header__title}>Poradniki</h1>
					<p className={styles.header__subtitle}>
						Centralne miejsce przechowywania dokumentacji, instrukcji i
						materiałów pomocniczych.
						{canManageTutorials &&
							" Zarząd może dodawać, edytować i usuwać wszystkie poradniki."}
					</p>
				</div>
				{canManageTutorials && (
					<button className={styles.header__addBtn} onClick={handleAddTutorial}>
						<Plus size={18} />
						Dodaj poradnik
					</button>
				)}
			</div>

			<div className={styles.categories}>
				<button
					className={`${styles.categories__item} ${selectedCategory === "all" ? styles.categories__itemActive : ""}`}
					onClick={() => setSelectedCategory("all")}
				>
					<span className={styles.categories__count}>
						{tutorials.filter((t) => canViewTutorial(t)).length}
					</span>
					<span>Wszystkie</span>
				</button>
				{Object.entries(CATEGORY_LABELS).map(([key, label]) => {
					const count = getCategoryCount(key as TutorialCategory);
					if (count === 0) return null;
					return (
						<button
							key={key}
							className={`${styles.categories__item} ${selectedCategory === key ? styles.categories__itemActive : ""}`}
							onClick={() => setSelectedCategory(key as TutorialCategory)}
						>
							{CATEGORY_ICONS[key as TutorialCategory]}
							<span>{label}</span>
							<span className={styles.categories__count}>{count}</span>
						</button>
					);
				})}
			</div>

			<div className={styles.filters}>
				<div className={styles.filters__search}>
					<Search size={18} className={styles.filters__searchIcon} />
					<input
						type="text"
						className={styles.filters__searchInput}
						placeholder="Szukaj poradnika, autora..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					{searchTerm && (
						<button
							className={styles.filters__clear}
							onClick={() => setSearchTerm("")}
						>
							<X size={14} />
						</button>
					)}
				</div>

				<div className={styles.filters__group}>
					<Filter size={16} className={styles.filters__groupIcon} />
					<select
						className={styles.filters__select}
						value={selectedAccess}
						onChange={(e) =>
							setSelectedAccess(e.target.value as TutorialAccess | "all")
						}
					>
						<option value="all">Cała dostępność</option>
						<option value="all">Dla wszystkich</option>
						<option value="coordinator">Dla koordynatorów</option>
						<option value="functional">Dla osób funkcyjnych</option>
						<option value="board">Dla zarządu</option>
					</select>

					{(selectedCategory !== "all" ||
						selectedAccess !== "all" ||
						searchTerm) && (
						<button className={styles.filters__reset} onClick={clearFilters}>
							Wyczyść filtry
						</button>
					)}
				</div>
			</div>

			<div className={styles.tutorialsGrid}>
				{loading ? (
					<div className={styles.loadingState}>
						<div className={styles.loadingSpinner}></div>
						<p>Ładowanie poradników...</p>
					</div>
				) : filteredTutorials.length === 0 ? (
					<div className={styles.emptyState}>
						<BookOpen size={48} className={styles.emptyState__icon} />
						<h3 className={styles.emptyState__title}>Brak poradników</h3>
						<p className={styles.emptyState__description}>
							{searchTerm ||
							selectedCategory !== "all" ||
							selectedAccess !== "all"
								? "Nie znaleziono poradników spełniających kryteria wyszukiwania."
								: "Nie ma jeszcze żadnych poradników."}
						</p>
						{canManageTutorials &&
							!searchTerm &&
							selectedCategory === "all" &&
							selectedAccess === "all" && (
								<button
									className={styles.emptyState__btn}
									onClick={handleAddTutorial}
								>
									<Plus size={18} />
									Dodaj pierwszy poradnik
								</button>
							)}
					</div>
				) : (
					filteredTutorials.map((tutorial) => (
						<TutorialCard
							key={tutorial.id}
							tutorial={tutorial}
							onEdit={handleEditTutorial}
							onDelete={handleDeleteTutorial}
							canEdit={canManageTutorials}
							canView={canViewTutorial(tutorial)}
						/>
					))
				)}
			</div>

			<TutorialModal
				isOpen={isModalOpen}
				tutorial={editingTutorial}
				isViewOnly={false}
				onClose={() => {
					setIsModalOpen(false);
					setEditingTutorial(null);
				}}
				onSave={handleSaveTutorial}
			/>
		</div>
	);
}
