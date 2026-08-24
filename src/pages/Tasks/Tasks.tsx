declare global {
	interface Window {
		__tasks?: any;
		__currentUser?: any;
	}
}
import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import {
	Plus,
	Search,
	Check,
	Clock,
	Edit,
	Trash2,
	Eye,
	User,
	Users,        // ✅ DODAJ
	Calendar,
	Tag,
	X,
	FolderKanban,
	Send,
	File as FileIcon,
	MessageCircle,
	ChevronDown,  // ✅ DODAJ
	ChevronUp,    // ✅ DODAJ
} from "lucide-react"
import { FiInfo } from "react-icons/fi";
import styles from "./Tasks.module.css";
import { logger } from "@/utils/logger";
import { TaskRatingModal } from "./TaskRatingModal";

type TaskStatus = "todo" | "in_progress" | "review" | "done";
type TaskPriority = "low" | "medium" | "high" | "urgent";

type Task = {
	id: string;
	title: string;
	description: string;
	status: TaskStatus;
	priority: TaskPriority;
	assignedTo: string;
	assignedToName: string;
	assignedUsers?: string[];
	createdBy: string;
	createdByName: string;
	dueDate: string;
	createdAt: string;
	updatedAt: string;
	tags: string[];
	projectId?: string;
	projectName?: string;
	requiresFeedback?: boolean;
	feedbackType?: string;
	feedbackText?: string;
	feedbackFile?: string;
	feedbackFileName?: string;
	feedbackFileSize?: number;
	feedbackFileType?: string;
	feedbackSubmittedAt?: string;

	assignedType?: "user" | "team" | "pillar" | "role";
	assignedGroup?: string;
	isRecurring?: boolean;
	recurrencePattern?: "daily" | "weekly" | "monthly";
	recurrenceEndDate?: string;
	parentTaskId?: string;
	childTasks?: Task[];
	attachments?: {
		id: string;
		name: string;
		url: string;
		size: number;
	}[];
	comments?: {
		id: string;
		userId: string;
		userName: string;
		content: string;
		createdAt: string;
	}[];
	pillar?: string;

	rating?: number;
	rating_comment?: string;
	rated_at?: string;
	rated_by?: string;
	rated_by_name?: string;
	assignees?: {
		id: string;
		userId: string;
		userName: string;
		status: TaskStatus;
		startedAt: string | null;
		completedAt: string | null;
	}[];
};

type User = {
	id: string;
	name: string;
	role: string;

	teamId?: string;
	teamName?: string;
	pillarId?: string;
	pillarName?: string;
	isLeader?: boolean;
	isTeamCoordinator?: boolean;
	isPillarCoordinator?: boolean;
};

const STATUS_LABELS: Record<TaskStatus, string> = {
	todo: "Do zrobienia",
	in_progress: "W trakcie",
	review: "Do weryfikacji",
	done: "Zakończone",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
	todo: styles.statusTodo,
	in_progress: styles.statusInProgress,
	review: styles.statusReview,
	done: styles.statusDone,
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
	low: "Niski",
	medium: "Średni",
	high: "Wysoki",
	urgent: "Krytyczny",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
	low: styles.priorityLow,
	medium: styles.priorityMedium,
	high: styles.priorityHigh,
	urgent: styles.priorityUrgent,
};

const canManageTask = (user: User, task: Task): boolean => {
	// ✅ Admin i Zarząd mają pełne uprawnienia
	if (user.role === "admin" || user.role === "board") {
		return true;
	}

	// ✅ Prezes i Wiceprezes mają pełne uprawnienia
	if (user.role === "Prezes" || user.role === "Wiceprezes") {
		return true;
	}

	// ✅ Twórca zadania może nim zarządzać
	if (user.id === task.createdBy) {
		return true;
	}

	// ❌ USUŃ TEN WARUNEK - nie dajemy uprawnień do edycji tylko za bycie przypisanym
	// if (task.assignedUsers && task.assignedUsers.includes(user.id)) {
	// 	return true;
	// }

	// ✅ Liderzy mogą zarządzać tylko zadaniami w swoim filarze/zespole
	if (user.isLeader === true) {
		// Jeśli zadanie ma przypisany filar i użytkownik jest liderem tego filaru
		if (user.pillarName && task.pillar && task.pillar === user.pillarName) {
			return true;
		}

		// Jeśli zadanie jest przypisane do zespołu i użytkownik jest liderem tego zespołu
		if (
			user.teamName &&
			task.assignedGroup &&
			task.assignedGroup === user.teamName
		) {
			return true;
		}

		// ✅ TYLKO jeśli użytkownik jest liderem i zadanie jest przypisane do jego zespołu/filaru
		// Nie dajemy uprawnień tylko za bycie przypisanym do zadania
	}

	// ❌ Zwykli członkowie NIE mogą edytować zadań
	return false;
};

interface TaskCardProps {
	task: Task;
	currentUser: User;
	onView: (task: Task) => void;
	onEdit?: (task: Task) => void;
	onDelete?: (task: Task) => void;
	onStatusChange: (task: Task, status: TaskStatus, userId?: string) => void;
	onFeedback?: (task: Task) => void;
}

interface Comment {
	id: string;
	taskId: string;
	userId: string;
	userName: string;
	content: string;
	createdAt: string;
}

function Comments({ taskId }: { taskId: string; currentUser: User }) {
	const [comments, setComments] = useState<Comment[]>([]);
	const [newComment, setNewComment] = useState("");
	const [loading, setLoading] = useState(true);

	const fetchComments = async () => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch(`/api/tasks/${taskId}/comments`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				const data = await response.json();
				setComments(data);
			}
		} catch (error) {
			console.error("Błąd pobierania komentarzy:", error);
		} finally {
			setLoading(false);
		}
	};

	const addComment = async () => {
		if (!newComment.trim()) return;

		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch(`/api/tasks/${taskId}/comments`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ content: newComment.trim() }),
			});

			if (response.ok) {
				const comment = await response.json();
				setComments([...comments, comment]);
				setNewComment("");
				toast.success("Komentarz dodany!");
			}
		} catch (error) {
			console.error("Błąd dodawania komentarza:", error);
			toast.error("Nie udało się dodać komentarza");
		}
	};

	useEffect(() => {
		fetchComments();
	}, [taskId]);

	if (loading)
		return (
			<div className={styles.commentsLoading}>Ładowanie komentarzy...</div>
		);

	return (
		<div className={styles.commentsSection}>
			<h4 className={styles.commentsTitle}>
				<MessageCircle size={16} />
				Komentarze ({comments.length})
			</h4>

			<div className={styles.commentsList}>
				{comments.map((comment) => (
					<div key={comment.id} className={styles.commentItem}>
						<div className={styles.commentHeader}>
							<span className={styles.commentAuthor}>
								<User size={14} />
								{comment.userName}
							</span>
							<span className={styles.commentDate}>
								{new Date(comment.createdAt).toLocaleDateString("pl-PL", {
									day: "numeric",
									month: "short",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</span>
						</div>
						<p className={styles.commentContent}>{comment.content}</p>
					</div>
				))}
				{comments.length === 0 && (
					<p className={styles.commentsEmpty}>Brak komentarzy</p>
				)}
			</div>

			<div className={styles.commentInput}>
				<textarea
					className={styles.commentTextarea}
					value={newComment}
					onChange={(e) => setNewComment(e.target.value)}
					placeholder="Dodaj komentarz..."
					rows={2}
				/>
				<button
					className={styles.commentSubmitBtn}
					onClick={addComment}
					disabled={!newComment.trim()}
				>
					<Send size={14} />
					Wyślij
				</button>
			</div>
		</div>
	);
}
interface TaskDetailModalProps {
	isOpen: boolean;
	task: Task | null;
	currentUser: User;
	onClose: () => void;
	onEdit?: () => void;
}
interface FeedbackModalProps {
	isOpen: boolean;
	task: Task | null;
	onClose: () => void;
	onSubmit: (task: Task, feedbackText: string, file?: File) => void;
}

function FeedbackModal({
	isOpen,
	task,
	onClose,
	onSubmit,
}: FeedbackModalProps) {
	const [feedbackText, setFeedbackText] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (!isOpen) {
			setFeedbackText("");
			setFile(null);
			setErrors({});
		}
	}, [isOpen]);

	if (!isOpen || !task) return null;

	const validateForm = () => {
		const newErrors: Record<string, string> = {};
		if (task.feedbackType === "text" && !feedbackText.trim()) {
			newErrors.feedbackText = "Odpowiedź tekstowa jest wymagana";
		}
		if (task.feedbackType === "file" && !file) {
			newErrors.file = "Plik jest wymagany";
		}
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;
		onSubmit(task, feedbackText, file || undefined);
		onClose();
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modal__header}>
					<h2 className={styles.modal__title}>
						Odpowiedź zwrotna: {task.title}
					</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__body}>
						<p className={styles.feedbackInfo}>
							{task.feedbackType === "text"
								? "Wpisz odpowiedź tekstową dla tego zadania."
								: "Załącz plik z odpowiedzią dla tego zadania."}
						</p>

						{task.feedbackType === "text" ? (
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>
									Odpowiedź tekstowa{" "}
									<span className={styles.modal__required}>*</span>
								</label>
								<textarea
									className={`${styles.modal__input} ${styles.modal__textarea} ${errors.feedbackText ? styles.modal__inputError : ""}`}
									value={feedbackText}
									onChange={(e) => {
										setFeedbackText(e.target.value);
										if (errors.feedbackText)
											setErrors({ ...errors, feedbackText: "" });
									}}
									rows={6}
									placeholder="Napisz swoją odpowiedź..."
								/>
								{errors.feedbackText && (
									<span className={styles.modal__error}>
										{errors.feedbackText}
									</span>
								)}
							</div>
						) : (
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>
									Załącz plik <span className={styles.modal__required}>*</span>
								</label>

								<div className={styles.fileInputWrapper}>
									<input
										type="file"
										id="feedbackFileInput"
										className={styles.fileInputHidden}
										onChange={(e) => {
											if (e.target.files && e.target.files.length > 0) {
												setFile(e.target.files[0]);
												if (errors.file) setErrors({ ...errors, file: "" });
											}
										}}
									/>
									<label
										htmlFor="feedbackFileInput"
										className={styles.fileInputLabel}
									>
										<FileIcon size={18} />

										<span className={styles.fileInputText}>
											{file ? (
												<span className={styles.fileName}>{file.name}</span>
											) : (
												"Kliknij lub przeciągnij plik"
											)}
										</span>
										{file && (
											<button
												type="button"
												className={styles.fileRemoveBtn}
												onClick={(e) => {
													e.stopPropagation();
													setFile(null);

													const input = document.getElementById(
														"feedbackFileInput",
													) as HTMLInputElement;
													if (input) input.value = "";
												}}
											>
												<X size={14} />
											</button>
										)}
									</label>
								</div>

								{errors.file && (
									<span className={styles.modal__error}>{errors.file}</span>
								)}
								{file && (
									<p className={styles.fileInfo}>
										{file.name} ({(file.size / 1024).toFixed(1)} KB)
									</p>
								)}
							</div>
						)}
					</div>

					<div className={styles.modal__actions}>
						<div className={styles.modal__actionsRight}>
							<button
								type="button"
								className={styles.modal__btnCancel}
								onClick={onClose}
							>
								Anuluj
							</button>
							<button type="submit" className={styles.modal__btnSave}>
								<Send size={16} />
								Wyślij odpowiedź
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
function TaskDetailModal({
	isOpen,
	task,
	currentUser,
	onClose,
	onEdit,
}: TaskDetailModalProps) {
	if (!isOpen || !task) return null;
	const [showAllAssigneesDetail, setShowAllAssigneesDetail] = useState(false);

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString("pl-PL", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const handleDownloadFile = async (fileUrl: string, fileName: string) => {
		try {
			const token = localStorage.getItem("accessToken");

			const decodedFileName = decodeURIComponent(fileName);

			let fullUrl = fileUrl;
			if (fileUrl.startsWith("/uploads")) {
				fullUrl = `/api${fileUrl}`;
			}

			const response = await fetch(fullUrl, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error(`Błąd pobierania: ${response.status}`);
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = decodedFileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			setTimeout(() => {
				window.URL.revokeObjectURL(url);
			}, 5000);

			toast.success("✅ Plik pobrany!");
		} catch (error) {
			console.error("❌ Błąd pobierania pliku:", error);
			toast.error("❌ Nie udało się pobrać pliku");
		}
	};
	const getStatusLabel = (status: TaskStatus) => {
		const labels: Record<TaskStatus, string> = {
			todo: "Do zrobienia",
			in_progress: "W trakcie",
			review: "Do weryfikacji",
			done: "Zakończone",
		};
		return labels[status] || status;
	};

	const getPriorityLabel = (priority: TaskPriority) => {
		const labels: Record<TaskPriority, string> = {
			low: "Niski",
			medium: "Średni",
			high: "Wysoki",
			urgent: "Krytyczny",
		};
		return labels[priority] || priority;
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div
				className={`${styles.modal} ${styles.detailModal}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modal__header}>
					<h2 className={styles.modal__title}>{task.title}</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<div className={styles.modal__body}>
					<div className={styles.detailRow}>
						<div className={styles.detailItem}>
							<span className={styles.detailLabel}>Status</span>
							<span
								className={`${styles.detailValue} ${STATUS_COLORS[task.status]}`}
							>
								{getStatusLabel(task.status)}
							</span>
						</div>
						<div className={styles.detailItem}>
							<span className={styles.detailLabel}>Priorytet</span>
							<span
								className={`${styles.detailValue} ${PRIORITY_COLORS[task.priority]}`}
							>
								{getPriorityLabel(task.priority)}
							</span>
						</div>
					</div>

					<div className={styles.detailSection}>
						<h4 className={styles.detailSectionTitle}>Opis</h4>
						<p className={styles.detailDescription}>{task.description}</p>
					</div>

					<div className={styles.detailGrid}>
						<div className={styles.detailItem}>
							<span className={styles.detailLabel}>Przypisany do</span>
							<span className={styles.detailValue}>
								<User size={16} />
								{task.assignedUsers && task.assignedUsers.length > 0 ? (
									task.assignees && task.assignees.length > 0 ? (
										task.assignees[0].userName
									) : (
										task.assignedToName
									)
								) : (
									task.assignedToName
								)}
							</span>
						</div>
						{task.projectId && task.projectName && (
							<div className={styles.detailItem}>
								<span className={styles.detailLabel}>Projekt</span>
								<span className={styles.detailValue}>
									<FolderKanban size={16} />
									{task.projectName}
								</span>
							</div>
						)}
						<div className={styles.detailItem}>
							<span className={styles.detailLabel}>Termin</span>
							<span className={styles.detailValue}>
								<Calendar size={16} />
								{formatDate(task.dueDate)}
							</span>
						</div>
						<div className={styles.detailItem}>
							<span className={styles.detailLabel}>Utworzone</span>
							<span className={styles.detailValue}>
								{formatDate(task.createdAt)}
							</span>
						</div>
						<div className={styles.detailItem}>
							<span className={styles.detailLabel}>Przypisani</span>
							<div className={styles.detailValue}>
								{task.assignedUsers && task.assignedUsers.length > 0 ? (
									(currentUser.role === "admin" ||
										currentUser.role === "board" ||
										currentUser.role === "Prezes" ||
										currentUser.role === "Wiceprezes" ||
										currentUser.id === task.createdBy) ? (

										<div className={styles.detailAssigneesWrapper}>
											<div className={styles.detailAssigneesSummary}>
												<Users size={16} />
												<span className={styles.assigneesCount}>
													{task.assignedUsers.length} {task.assignedUsers.length === 1 ? 'osoba' :
														task.assignedUsers.length < 5 ? 'osoby' : 'osób'}
												</span>
												{task.assignees && task.assignees.length > 2 && (
													<button
														className={styles.toggleAssigneesBtn}
														onClick={() => setShowAllAssigneesDetail(!showAllAssigneesDetail)}
													>
														{showAllAssigneesDetail ? (
															<ChevronUp size={16} />
														) : (
															<ChevronDown size={16} />
														)}
													</button>
												)}
											</div>

											{showAllAssigneesDetail && task.assignees && (
												<div className={styles.detailAssigneesList}>
													{task.assignees.map((a) => (
														<div key={a.id} className={styles.detailAssignee}>
															<span className={styles.detailAssigneeName}>
																{a.userName}
																{a.userId === currentUser.id && ' (Ty)'}
															</span>
															<span className={`${styles.detailAssigneeStatus} ${styles[`status_${a.status}`]}`}>
																{STATUS_LABELS[a.status]}
															</span>
														</div>
													))}
												</div>
											)}

											{ }
											{task.assignees && task.assignees.length <= 2 && task.assignees.length > 0 && (
												<div className={styles.detailAssigneesList}>
													{task.assignees.map((a) => (
														<div key={a.id} className={styles.detailAssignee}>
															<span className={styles.detailAssigneeName}>
																{a.userName}
																{a.userId === currentUser.id && ' (Ty)'}
															</span>
															<span className={`${styles.detailAssigneeStatus} ${styles[`status_${a.status}`]}`}>
																{STATUS_LABELS[a.status]}
															</span>
														</div>
													))}
												</div>
											)}
										</div>
									) : (

										<span>Ty {task.assignedUsers.length > 1 ? `(+${task.assignedUsers.length - 1} innych)` : ''}</span>
									)
								) : (
									<span>{task.assignedToName}</span>
								)}
							</div>
						</div>
					</div>

					{task.tags.length > 0 && (
						<div className={styles.detailSection}>
							<h4 className={styles.detailSectionTitle}>Tagi</h4>
							<div className={styles.detailTags}>
								{task.tags.map((tag) => (
									<span key={tag} className={styles.detailTag}>
										<Tag size={12} />
										{tag}
									</span>
								))}
							</div>
						</div>
					)}

					{task.requiresFeedback && (
						<div className={styles.detailSection}>
							<h4 className={styles.detailSectionTitle}>
								Odpowiedź zwrotna
								{task.feedbackSubmittedAt ? (
									<span className={styles.feedbackSubmitted}>Przesłana</span>
								) : (
									<span className={styles.feedbackPending}>Oczekuje</span>
								)}
							</h4>
							{task.feedbackSubmittedAt ? (
								<div className={styles.feedbackContent}>
									<p className={styles.feedbackMeta}>
										Przesłano: {formatDate(task.feedbackSubmittedAt)}
									</p>
									{task.feedbackType === "text" && task.feedbackText && (
										<div className={styles.feedbackText}>
											<strong>Odpowiedź:</strong>
											<p>{task.feedbackText}</p>
										</div>
									)}
									{task.feedbackType === "file" && task.feedbackFile && (
										<div className={styles.feedbackFile}>
											<strong>Załącznik:</strong>
											<button
												className={styles.feedbackDownloadBtn}
												onClick={() =>
													handleDownloadFile(
														task.feedbackFile!,
														task.feedbackFileName || "plik.pdf",
													)
												}
											>
												{task.feedbackFileName || "Pobierz plik"}
											</button>

											<div className={styles.detailSection}>
												<Comments taskId={task.id} currentUser={currentUser} />
											</div>
										</div>
									)}
								</div>
							) : (
								<p className={styles.feedbackEmpty}>Brak odpowiedzi zwrotnej</p>
							)}
						</div>
					)}

					{task.rating !== undefined &&
						task.rating !== null &&
						task.rating > 0 && (
							<div className={styles.detailSection}>
								<h4 className={styles.detailSectionTitle}>
									Ocena trudności zadania
								</h4>
								<div className={styles.ratingDisplay}>
									<div className={styles.ratingStars}>
										{[1, 2, 3, 4, 5].map((star) => (
											<span
												key={star}
												className={`${styles.ratingStar} ${star <= (task.rating || 0) ? styles.ratingStarFilled : ""}`}
											>
												★
											</span>
										))}
										<span className={styles.ratingValue}>{task.rating}/5</span>
									</div>
									{task.rating_comment && (
										<div className={styles.ratingComment}>
											<strong>Komentarz:</strong>
											<p>{task.rating_comment}</p>
										</div>
									)}
									{task.rated_at && (
										<div className={styles.ratingMeta}>
											<span>Oceniono: {formatDate(task.rated_at)}</span>
											{task.rated_by_name && (
												<span>Ocenił: {task.rated_by_name}</span>
											)}
										</div>
									)}
								</div>
							</div>
						)}
				</div>

				<div className={styles.modal__actions}>
					<div className={styles.modal__actionsRight}>
						<button className={styles.modal__btnCancel} onClick={onClose}>
							Zamknij
						</button>
						{onEdit && canManageTask(currentUser, task) && (
							<button className={styles.modal__btnSave} onClick={onEdit}>
								<Edit size={16} />
								Edytuj
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
function TaskCard({
	task,
	currentUser,
	onView,
	onEdit,
	onDelete,
	onStatusChange,
	onFeedback,
}: TaskCardProps) {
	const canManage = canManageTask(currentUser, task);
	const isAssignedToMe =
		task.assignedTo === currentUser.id ||
		(task.assignedUsers && task.assignedUsers.includes(currentUser.id));
	const isAssigned = String(task.assignedTo) === String(currentUser.id);
	const [showAllAssignees, setShowAllAssignees] = useState(false);

	const formatDate = (date: string) => {
		const d = new Date(date);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		if (d.toDateString() === today.toDateString()) return "Dzisiaj";
		if (d.toDateString() === tomorrow.toDateString()) return "Jutro";
		return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
	};

	const isOverdue =
		task.dueDate &&
		new Date(task.dueDate) < new Date() &&
		task.status !== "done";
	const isMultiUser = task.assignedUsers && task.assignedUsers.length > 1;

	const currentUserStatus = isMultiUser
		? task.assignees?.find(a => a.userId === currentUser.id)?.status || task.status
		: task.status;


	const canChangeStatus = isMultiUser
		? task.assignedUsers?.includes(currentUser.id) || false
		: task.assignedTo === currentUser.id ||
		(task.assignedUsers && task.assignedUsers.includes(currentUser.id));
	const getAssignedNames = () => {

		if (isMultiUser && task.assignees && task.assignees.length > 0) {

			const canSeeAll =
				currentUser.role === "admin" ||
				currentUser.role === "board" ||
				currentUser.role === "Prezes" ||
				currentUser.role === "Wiceprezes" ||
				currentUser.id === task.createdBy;

			if (canSeeAll) {

				return `${task.assignees.length} przypisanych`;
			} else {

				const currentUserAssignee = task.assignees.find(a => a.userId === currentUser.id);
				if (currentUserAssignee) {
					return `Ty ${task.assignees.length > 1 ? `+ ${task.assignees.length - 1} ${task.assignees.length - 1 === 1 ? 'inny' : 'innych'}` : ''}`;
				}
				return 'Przypisany do Ciebie';
			}
		}


		return task.assignedToName;
	};
	return (
		<div
			className={`${styles.taskCard} ${isOverdue ? styles.taskCardOverdue : ""} ${isAssignedToMe ? styles.taskCardMyTask : ""}`}
		>
			<div className={styles.taskCard__header}>
				<div className={styles.taskCard__titleRow}>
					<h3 className={styles.taskCard__title}>{task.title}</h3>
					<span
						className={`${styles.taskCard__priority} ${PRIORITY_COLORS[task.priority]}`}
					>
						{PRIORITY_LABELS[task.priority]}
					</span>
				</div>
				<span
					className={`${styles.taskCard__status} ${STATUS_COLORS[task.status]}`}
				>
					{STATUS_LABELS[task.status]}
				</span>
			</div>

			<p className={styles.taskCard__description}>{task.description}</p>

			<div className={styles.taskCard__meta}>
				<div className={styles.taskCard__metaItem}>
					<User size={14} />
					<span>{getAssignedNames()}</span>
				</div>
				{task.projectId && task.projectName && (
					<div className={styles.taskCard__metaItem}>
						<FolderKanban size={14} />
						<span>{task.projectName}</span>
					</div>
				)}
				<div className={styles.taskCard__metaItem}>
					<Calendar size={14} />
					<span className={isOverdue ? styles.taskCard__dateOverdue : ""}>
						{formatDate(task.dueDate)}
					</span>
				</div>

				{(currentUser.role === "admin" || currentUser.role === "board") && (
					<div className={styles.taskCard__metaItem}>
						<span className={styles.taskCard__createdByBadge}>
							{task.createdBy === currentUser.id
								? "Utworzone przez Ciebie"
								: `Utworzył: ${task.createdByName || "Nieznany"}`}
						</span>
					</div>
				)}
				{task.tags.length > 0 && (
					<div className={styles.taskCard__tags}>
						{task.tags.slice(0, 2).map((tag) => (
							<span key={tag} className={styles.taskCard__tag}>
								<Tag size={12} />
								{tag}
							</span>
						))}
						{task.tags.length > 2 && (
							<span className={styles.taskCard__tag}>
								+{task.tags.length - 2}
							</span>
						)}
					</div>
				)}
			</div>
			{ }
			{ }
			{ }
			{isMultiUser && task.assignees && task.assignees.length > 0 && (
				(currentUser.role === "admin" ||
					currentUser.role === "board" ||
					currentUser.role === "Prezes" ||
					currentUser.role === "Wiceprezes" ||
					currentUser.id === task.createdBy) && (
					<div className={styles.taskCard__assignees}>
						<span className={styles.taskCard__assigneesLabel}>
							Postęp przypisanych ({task.assignees.length}):
						</span>
						<div className={styles.taskCard__assigneesList}>
							{ }
							{(showAllAssignees ? task.assignees : task.assignees.slice(0, 2)).map((assignee) => {
								const isCurrentUser = assignee.userId === currentUser.id;
								return (
									<div
										key={assignee.id}
										className={`${styles.assigneeStatus} ${styles[`status_${assignee.status}`]} ${isCurrentUser ? styles.assigneeCurrent : ''}`}
										title={`${assignee.userName}: ${STATUS_LABELS[assignee.status]}`}
									>
										<span className={styles.assigneeDot} />
										<span className={styles.assigneeName}>
											{assignee.userName}
											{isCurrentUser && ' (Ty)'}
										</span>
										<span className={styles.assigneeStatusLabel}>
											{STATUS_LABELS[assignee.status]}
										</span>
									</div>
								);
							})}
						</div>

						{ }
						{task.assignees.length > 2 && (
							<button
								className={styles.showMoreBtn}
								onClick={() => setShowAllAssignees(!showAllAssignees)}
							>
								{showAllAssignees ? (
									<>
										<ChevronUp size={14} />
										Pokaż mniej
									</>
								) : (
									<>
										<ChevronDown size={14} />
										Pokaż wszystkich ({task.assignees.length - 2} więcej)
									</>
								)}
							</button>
						)}
					</div>
				)
			)}
			<div className={styles.taskCard__actions}>
				{canChangeStatus && (
					<div className={styles.taskCard__statusActions}>
						{currentUserStatus !== "done" && (
							<button
								className={styles.taskCard__statusBtn}
								onClick={() => onStatusChange(task, "done", currentUser.id)}
								title="Zakończ zadanie"
							>
								<Check size={16} />
								Zakończ
							</button>
						)}
						{currentUserStatus === "todo" && (
							<button
								className={styles.taskCard__statusBtn}
								onClick={() => onStatusChange(task, "in_progress", currentUser.id)}
								title="Rozpocznij"
							>
								<Clock size={16} />
								Rozpocznij
							</button>
						)}
						{currentUserStatus === "in_progress" && (
							<button
								className={styles.taskCard__statusBtn}
								onClick={() => onStatusChange(task, "review", currentUser.id)}
								title="Prześlij do weryfikacji"
							>
								<Eye size={16} />
								Prześlij do weryfikacji
							</button>
						)}
					</div>
				)}

				<div className={styles.taskCard__actionBtns}>
					<button
						className={styles.taskCard__actionBtn}
						onClick={() => onView(task)}
						title="Szczegóły"
					>
						<Eye size={16} />
					</button>

					{/* ✅ TYLKO canManage - bez dodatkowych warunków! */}
					{canManage && (
						<button
							className={styles.taskCard__actionBtn}
							onClick={() => onEdit?.(task)}
							title="Edytuj"
						>
							<Edit size={16} />
						</button>
					)}

					{canManage && (
						<button
							className={`${styles.taskCard__actionBtn} ${styles.taskCard__actionBtnDanger}`}
							onClick={() => {
								if (onDelete) {
									onDelete(task);
								} else {
									console.error("❌ onDelete jest undefined!");
								}
							}}
							title="Usuń"
						>
							<Trash2 size={16} />
						</button>
					)}

					{task.requiresFeedback &&
						task.status === "done" &&
						!task.feedbackSubmittedAt && (
							<button
								className={styles.taskCard__feedbackBtn}
								onClick={() => onFeedback?.(task)}
								title="Dodaj odpowiedź zwrotną"
							>
								<Send size={14} />
								Odpowiedź
							</button>
						)}

					{task.requiresFeedback && task.feedbackSubmittedAt && (
						<span className={styles.taskCard__feedbackDone}>
							<Check size={14} />
							Odpowiedź przesłana
						</span>
					)}
				</div>
			</div>
		</div>
	);
}

interface TaskModalProps {
	isOpen: boolean;
	task: Task | null;
	currentUser: User;
	members: { id: string; name: string }[];
	projects: { id: string; name: string }[];
	teams?: string[];
	pillars?: string[];
	onClose: () => void;
	onSave: (task: Task) => void;
	onDelete?: (task: Task) => void;
}

function TaskModal({
	isOpen,
	task,
	currentUser,
	members,
	projects,
	teams = [],
	pillars = [],
	onClose,
	onSave,
	onDelete,
}: TaskModalProps) {
	const [searchUser, setSearchUser] = useState("");
	const [userSuggestions, setUserSuggestions] = useState<
		{ id: string; name: string }[]
	>([]);
	const [selectedUsers, setSelectedUsers] = useState<
		{ id: string; name: string }[]
	>([]);

	const [formData, setFormData] = useState<Partial<Task>>({
		title: "",
		description: "",
		status: "todo",
		priority: "medium",
		assignedTo: "",
		dueDate: "",
		tags: [],
		projectId: "",
		requiresFeedback: false,
		feedbackType: "text",
		assignedType: "user",
		assignedGroup: "",
		isRecurring: false,
		recurrencePattern: "weekly",
		recurrenceEndDate: "",
	});
	const [newTag, setNewTag] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (task) {
			setFormData({
				...task,
				dueDate: task.dueDate
					? new Date(task.dueDate).toISOString().slice(0, 16)
					: "",
				projectId: task.projectId || "",
				requiresFeedback: task.requiresFeedback || false,
				feedbackType: task.feedbackType || "text",
				assignedType: task.assignedType || "user",
				assignedGroup: task.assignedGroup || "",
				isRecurring: task.isRecurring || false,
				recurrencePattern: task.recurrencePattern || "weekly",
				recurrenceEndDate: task.recurrenceEndDate || "",

				assignedTo: task.assignedTo || "",
			});

			if (task.assignedTo) {
				setSelectedUsers([
					{
						id: task.assignedTo,
						name: task.assignedToName || "Nieznany",
					},
				]);
			}

			if (task.assignedUsers && task.assignedUsers.length > 0) {
				const users = task.assignedUsers.map((id: string) => {
					const member = members.find((m) => m.id === id);
					return { id, name: member?.name || "Nieznany" };
				});
				setSelectedUsers(users);
			}
		} else {
			setFormData({
				title: "",
				description: "",
				status: "todo",
				priority: "medium",
				assignedTo: "",
				assignedToName: "",
				dueDate: "",
				tags: [],
				projectId: "",
				requiresFeedback: false,
				feedbackType: "text",
				assignedType: "user",
				assignedGroup: "",
				isRecurring: false,
				recurrencePattern: "weekly",
				recurrenceEndDate: "",
			});
			setSelectedUsers([]);
		}
	}, [task, currentUser, members]);

	if (!isOpen) return null;

	const isEdit = !!task;

	const validateForm = () => {
		const newErrors: Record<string, string> = {};
		if (!formData.title?.trim()) newErrors.title = "Tytuł jest wymagany";
		if (!formData.description?.trim())
			newErrors.description = "Opis jest wymagany";

		if (formData.assignedType === "user" && selectedUsers.length === 0) {
			newErrors.assignedTo = "Wybierz przynajmniej jednego użytkownika";
		}
		if (formData.assignedType !== "user" && !formData.assignedGroup) {
			newErrors.assignedGroup = "Wybierz grupę";
		}
		if (!formData.dueDate) newErrors.dueDate = "Termin jest wymagany";
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;

		const saveData: Task = {
			id: task?.id || `task-${Date.now()}`,
			title: formData.title!.trim(),
			description: formData.description!.trim(),
			status: (formData.status as TaskStatus) || "todo",
			priority: (formData.priority as TaskPriority) || "medium",
			assignedTo: selectedUsers.length > 0 ? selectedUsers[0].id : "",
			assignedToName:
				selectedUsers.length > 0 ? selectedUsers[0].name : "Nieznany",
			assignedUsers: selectedUsers.map((u) => u.id),
			createdBy: task?.createdBy || currentUser.id,
			createdByName: task?.createdByName || currentUser.name,
			dueDate: formData.dueDate!,
			createdAt: task?.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			tags: formData.tags || [],
			projectId: formData.projectId || undefined,
			requiresFeedback: formData.requiresFeedback || false,
			feedbackType: formData.feedbackType || "text",

			assignedType:
				(formData.assignedType as "user" | "team" | "pillar" | "role") ||
				"user",
			assignedGroup: formData.assignedGroup || "",
			isRecurring: formData.isRecurring || false,
			recurrencePattern:
				(formData.recurrencePattern as "daily" | "weekly" | "monthly") ||
				"weekly",
			recurrenceEndDate: formData.recurrenceEndDate || "",
			attachments: task?.attachments || [],
			comments: task?.comments || [],
			pillar: formData.pillar || "",
			feedbackText: undefined,
			feedbackFile: undefined,
			feedbackFileName: undefined,
			feedbackFileSize: undefined,
			feedbackFileType: undefined,
			feedbackSubmittedAt: undefined,
		};

		onSave(saveData);
		onClose();
	};

	const addTag = () => {
		if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
			setFormData({
				...formData,
				tags: [...(formData.tags || []), newTag.trim()],
			});
			setNewTag("");
		}
	};

	const removeTag = (tag: string) => {
		setFormData({
			...formData,
			tags: (formData.tags || []).filter((t) => t !== tag),
		});
	};

	const handleDelete = () => {
		if (
			task &&
			onDelete &&
			window.confirm(`Czy na pewno chcesz usunąć zadanie "${task.title}"?`)
		) {
			onDelete(task);
			onClose();
		}
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modal__header}>
					<h2 className={styles.modal__title}>
						{isEdit ? "Edytuj zadanie" : "Dodaj nowe zadanie"}
					</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__body}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>
								Tytuł <span className={styles.modal__required}>*</span>
							</label>
							<input
								type="text"
								className={`${styles.modal__input} ${errors.title ? styles.modal__inputError : ""}`}
								value={formData.title || ""}
								onChange={(e) => {
									setFormData({ ...formData, title: e.target.value });
									if (errors.title) setErrors({ ...errors, title: "" });
								}}
								placeholder="np. Przygotowanie raportu"
							/>
							{errors.title && (
								<span className={styles.modal__error}>{errors.title}</span>
							)}
						</div>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>
								Opis <span className={styles.modal__required}>*</span>
							</label>
							<textarea
								className={`${styles.modal__input} ${styles.modal__textarea} ${errors.description ? styles.modal__inputError : ""}`}
								value={formData.description || ""}
								onChange={(e) => {
									setFormData({ ...formData, description: e.target.value });
									if (errors.description)
										setErrors({ ...errors, description: "" });
								}}
								rows={4}
								placeholder="Szczegółowy opis zadania..."
							/>
							{errors.description && (
								<span className={styles.modal__error}>
									{errors.description}
								</span>
							)}
						</div>
						<div className={styles.modal__row}>
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>
									Status <span className={styles.modal__required}>*</span>
								</label>
								<select
									className={styles.modal__select}
									value={formData.status || "todo"}
									onChange={(e) =>
										setFormData({
											...formData,
											status: e.target.value as TaskStatus,
										})
									}
								>
									<option value="todo">Do zrobienia</option>
									<option value="in_progress">W trakcie</option>
									<option value="review">Do weryfikacji</option>
									<option value="done">Zakończone</option>
								</select>
							</div>

							<div className={styles.modal__field}>
								<label className={styles.modal__label}>
									Priorytet <span className={styles.modal__required}>*</span>
								</label>
								<select
									className={styles.modal__select}
									value={formData.priority || "medium"}
									onChange={(e) =>
										setFormData({
											...formData,
											priority: e.target.value as TaskPriority,
										})
									}
								>
									<option value="low">Niski</option>
									<option value="medium">Średni</option>
									<option value="high">Wysoki</option>
									<option value="urgent">Krytyczny</option>
								</select>
							</div>
						</div>

						<div className={styles.modal__field}>
							<label className={styles.modal__label}>
								Projekt (opcjonalnie)
							</label>
							<select
								className={styles.modal__select}
								value={formData.projectId || ""}
								onChange={(e) =>
									setFormData({
										...formData,
										projectId: e.target.value || undefined,
									})
								}
							>
								<option value="">Brak projektu</option>
								{projects.map((p: { id: string; name: string }) => (
									<option key={p.id} value={p.id}>
										{p.name}
									</option>
								))}
							</select>
						</div>

						<div className={styles.modal__field}>
							<label
								className={styles.modal__label}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "8px",
									cursor: "pointer",
								}}
							>
								<input
									type="checkbox"
									checked={formData.requiresFeedback || false}
									onChange={(e) =>
										setFormData({
											...formData,
											requiresFeedback: e.target.checked,
										})
									}
								/>
								Wymaga odpowiedzi zwrotnej
							</label>
						</div>

						{formData.requiresFeedback && (
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>Typ odpowiedzi</label>
								<select
									className={styles.modal__select}
									value={formData.feedbackType || "text"}
									onChange={(e) =>
										setFormData({ ...formData, feedbackType: e.target.value })
									}
								>
									<option value="text">Tekst</option>
									<option value="file">Plik</option>
								</select>
								<span className={styles.modal__helper}>
									{formData.feedbackType === "text"
										? "Użytkownik będzie musiał wpisać odpowiedź tekstową"
										: "Użytkownik będzie musiał załączyć plik"}
								</span>
							</div>
						)}
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>
								Filar
							</label>
							<select
								className={styles.modal__select}
								value={formData.pillar || ""}
								onChange={(e) => {
									setFormData({ ...formData, pillar: e.target.value });
								}}
							>
								<option value="">Wybierz filar...</option>
								{pillars.map((p) => (
									<option key={p} value={p}>
										{p}
									</option>
								))}
							</select>
						</div>

						<div className={styles.modal__row}>
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>Przypisz do</label>
								<select
									className={styles.modal__select}
									value={formData.assignedType || "user"}
									onChange={(e) => {
										const type = e.target.value as
											| "user"
											| "team"
											| "pillar"
											| "role";
										setFormData({
											...formData,
											assignedType: type,
											assignedGroup: "",
										});
										setSelectedUsers([]);
									}}
								>
									<option value="user">Konkretny użytkownik</option>
									<option value="team">Zespół</option>
									<option value="pillar">Filar</option>
									<option value="role">Rola</option>
								</select>
							</div>

							<div className={styles.modal__field}>
								<label className={styles.modal__label}>
									Termin <span className={styles.modal__required}>*</span>
								</label>
								<input
									type="datetime-local"
									className={`${styles.modal__input} ${errors.dueDate ? styles.modal__inputError : ""}`}
									value={formData.dueDate || ""}
									onChange={(e) => {
										setFormData({ ...formData, dueDate: e.target.value });
										if (errors.dueDate) setErrors({ ...errors, dueDate: "" });
									}}
								/>
								{errors.dueDate && (
									<span className={styles.modal__error}>{errors.dueDate}</span>
								)}
							</div>
						</div>

						{formData.assignedType === "user" && (
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>
									Szukaj użytkowników *
								</label>
								<div className={styles.userSearchWrapper}>
									<input
										type="text"
										className={styles.modal__input}
										placeholder="Wpisz imię lub nazwisko..."
										value={searchUser}
										onChange={(e) => {
											setSearchUser(e.target.value);
											const filtered = members.filter((m) =>
												m.name
													.toLowerCase()
													.includes(e.target.value.toLowerCase()),
											);
											setUserSuggestions(filtered.slice(0, 10));
										}}
										onFocus={() => {
											if (searchUser && userSuggestions.length === 0) {
												const filtered = members.filter((m) =>
													m.name
														.toLowerCase()
														.includes(searchUser.toLowerCase()),
												);
												setUserSuggestions(filtered.slice(0, 10));
											}
										}}
									/>
									{userSuggestions.length > 0 && (
										<div className={styles.userSuggestions}>
											{userSuggestions.map((user) => (
												<div
													key={user.id}
													className={styles.userSuggestionItem}
													onMouseDown={(e) => {
														e.preventDefault();

														if (!selectedUsers.find((u) => u.id === user.id)) {
															setSelectedUsers([...selectedUsers, user]);
														}
														setSearchUser("");
														setUserSuggestions([]);
													}}
												>
													<User size={14} />
													{user.name}
												</div>
											))}
										</div>
									)}
								</div>
								{selectedUsers.length > 0 && (
									<div className={styles.selectedUsers}>
										{selectedUsers.map((user) => (
											<span key={user.id} className={styles.selectedUser}>
												{user.name}
												<button
													type="button"
													onClick={() => {
														setSelectedUsers(
															selectedUsers.filter((u) => u.id !== user.id),
														);
													}}
												>
													<X size={12} />
												</button>
											</span>
										))}
									</div>
								)}
								{selectedUsers.length === 0 && (
									<span className={styles.modal__error}>
										Wybierz przynajmniej jednego użytkownika
									</span>
								)}
							</div>
						)}

						{formData.assignedType !== "user" && (
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>
									{formData.assignedType === "team"
										? "Zespół"
										: formData.assignedType === "pillar"
											? "Filar"
											: "Rola"}{" "}
									*
								</label>
								<select
									className={styles.modal__select}
									value={formData.assignedGroup || ""}
									onChange={(e) =>
										setFormData({ ...formData, assignedGroup: e.target.value })
									}
								>
									<option value="">Wybierz...</option>
									{formData.assignedType === "team" &&
										teams.map((t) => (
											<option key={t} value={t}>
												{t}
											</option>
										))}
									{formData.assignedType === "pillar" &&
										pillars.map((p) => (
											<option key={p} value={p}>
												{p}
											</option>
										))}
									{formData.assignedType === "role" &&
										[
											{ value: "admin", label: "Administrator" },
											{ value: "board", label: "Zarząd" },
											{ value: "coordinator", label: "Koordynator" },
											{ value: "member", label: "Członek" },
										].map((r) => (
											<option key={r.value} value={r.value}>
												{r.label}
											</option>
										))}
								</select>
							</div>
						)}

						<div className={styles.modal__field}>
							<label
								className={styles.modal__label}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "8px",
									cursor: "pointer",
								}}
							>
								<input
									type="checkbox"
									checked={formData.isRecurring || false}
									onChange={(e) =>
										setFormData({ ...formData, isRecurring: e.target.checked })
									}
								/>
								Zadanie cykliczne
							</label>
						</div>
						{formData.isRecurring && (
							<>
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>Powtarzaj</label>
									<select
										className={styles.modal__select}
										value={formData.recurrencePattern || "weekly"}
										onChange={(e) =>
											setFormData({
												...formData,
												recurrencePattern: e.target.value as
													| "daily"
													| "weekly"
													| "monthly",
											})
										}
									>
										<option value="daily">Codziennie</option>
										<option value="weekly">Co tydzień</option>
										<option value="monthly">Co miesiąc</option>
									</select>
								</div>
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Data zakończenia powtarzania
									</label>
									<input
										type="datetime-local"
										className={styles.modal__input}
										value={formData.recurrenceEndDate || ""}
										onChange={(e) =>
											setFormData({
												...formData,
												recurrenceEndDate: e.target.value,
											})
										}
									/>
								</div>
							</>
						)}
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Tagi</label>
							<div className={styles.tagInput}>
								<input
									type="text"
									className={styles.modal__input}
									value={newTag}
									onChange={(e) => setNewTag(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											addTag();
										}
									}}
									placeholder="Dodaj tag (np. ważne, raport)"
								/>
								<button
									type="button"
									className={styles.tagAddBtn}
									onClick={addTag}
								>
									<Plus size={16} />
								</button>
							</div>
							<div className={styles.tagsList}>
								{(formData.tags || []).map((tag) => (
									<span key={tag} className={styles.tag}>
										{tag}
										<button type="button" onClick={() => removeTag(tag)}>
											<X size={12} />
										</button>
									</span>
								))}
							</div>
						</div>
					</div>

					<div className={styles.modal__actions}>
						{isEdit && canManageTask(currentUser, task) && (
							<button
								type="button"
								className={styles.modal__btnDelete}
								onClick={handleDelete}
							>
								<Trash2 size={16} />
								Usuń zadanie
							</button>
						)}
						<div className={styles.modal__actionsRight}>
							<button
								type="button"
								className={styles.modal__btnCancel}
								onClick={onClose}
							>
								Anuluj
							</button>
							<button type="submit" className={styles.modal__btnSave}>
								{isEdit ? "Zapisz zmiany" : "Dodaj zadanie"}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}

export default function Tasks() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState<string>("all");
	const [teams, setTeams] = useState<string[]>([]);
	const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
	const [ratingTask, setRatingTask] = useState<Task | null>(null);
	const [pillars, setPillars] = useState<string[]>([]);
	const [filterPriority, setFilterPriority] = useState<string>("all");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
	const [feedbackTask, setFeedbackTask] = useState<Task | null>(null);
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const [selectedTask, setSelectedTask] = useState<Task | null>(null);
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
	const [currentUser, setCurrentUser] = useState<User>({
		id: "",
		name: "",
		role: "member",
	});

	useEffect(() => {
		const fetchTeamsAndPillars = async () => {
			try {
				const token = localStorage.getItem("accessToken");

				const teamsRes = await fetch("/api/teams", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (teamsRes.ok) {
					const data = await teamsRes.json();
					setTeams(data.map((t: any) => t.name));
				}

				const pillarsRes = await fetch("/api/teams", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (pillarsRes.ok) {
					const data = await pillarsRes.json();
					const pillarNames = data
						.filter((team: any) => team.name?.includes("Filar"))
						.map((team: any) => team.name);
					setPillars(pillarNames);
				}
			} catch (error) {
				console.error("Błąd pobierania:", error);
			}
		};
		fetchTeamsAndPillars();
	}, []);

	const canManage =
		currentUser.role === "admin" ||
		currentUser.role === "board" ||
		currentUser.role === "Prezes" ||
		currentUser.role === "Wiceprezes" ||
		currentUser.isLeader === true;
	const canViewTask = (task: Task, user: User): boolean => {
		if (user.role === "admin" || user.role === "board") {
			return true;
		}

		if (user.role === "Prezes" || user.role === "Wiceprezes") {
			return true;
		}


		if (user.id === task.createdBy) {
			return true;
		}

		if (user.isLeader === true) {
			if (task.pillar === user.pillarName) {
				return true;
			}

			if (
				task.assignedTo === user.id ||
				(task.assignedUsers && task.assignedUsers.includes(user.id))
			) {
				return true;
			}

			return false;
		}

		return (
			task.assignedTo === user.id ||
			(Array.isArray(task.assignedUsers) &&
				task.assignedUsers.includes(user.id))
		);
	};
	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("accessToken");

			let userData = null;

			const userRes = await fetch("/api/profile", {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (userRes.ok) {
				userData = await userRes.json();

				setCurrentUser({
					id: userData.id?.toString() || "",
					name:
						`${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
						"Użytkownik",
					role: userData.role || "member",
					teamId: userData.teamId?.toString(),
					teamName: userData.teamName,
					pillarId: userData.pillarId?.toString(),
					pillarName: userData.pillarName,
					isLeader: userData.isLeader === true,
				});
			}

			const membersRes = await fetch("/api/members", {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (membersRes.ok) {
				const data = await membersRes.json();
				setMembers(
					data.map((m: any) => ({
						id: m.id?.toString() || "",
						name:
							`${m.first_name || ""} ${m.last_name || ""}`.trim() ||
							m.email ||
							"Nieznany",
						teamId: m.teamId?.toString(),
						teamName: m.teamName,
						pillarId: m.pillarId?.toString(),
						pillarName: m.pillarName,
						isLeader: m.isLeader === true,
					})),
				);
			}

			if (!userData) {
				throw new Error("Nie udało się pobrać danych użytkownika");
			}

			const getTasksUrl = () => {
				return "/api/tasks";
			};

			const tasksRes = await fetch(getTasksUrl(), {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (tasksRes.ok) {
				const data = await tasksRes.json();
				const mappedTasks = data.map((task: any) => {
					let assignedUsers = task.assigned_users || task.assignedUsers || [];

					if (
						typeof assignedUsers === "string" &&
						assignedUsers.startsWith("[")
					) {
						try {
							assignedUsers = JSON.parse(assignedUsers);
						} catch {
							assignedUsers = [];
						}
					} else if (typeof assignedUsers === "string") {
						assignedUsers = assignedUsers.split(",").filter(Boolean);
					}

					assignedUsers = assignedUsers.map((id: string | number) =>
						String(id),
					);

					const assignees = task.assignees?.map((a: any) => ({
						id: a.id?.toString() || "",
						userId: a.userId?.toString() || a.user_id?.toString() || "",
						userName: a.userName || a.user?.first_name + " " + a.user?.last_name || "Nieznany",
						status: a.status || "todo",
						startedAt: a.startedAt || a.started_at || null,
						completedAt: a.completedAt || a.completed_at || null,
					})) || [];

					return {
						...task,
						id: String(task.id),
						assignedTo: String(task.assigned_to || task.assignedTo || ""),
						assignedToName:
							task.assigned_to_name || task.assignedToName || "Nieznany",
						assignedUsers: assignedUsers,
						projectName: task.project?.name || task.projectName || undefined,
						createdBy: String(task.created_by || task.createdBy || ""),
						createdByName:
							task.created_by_name || task.createdByName || "Nieznany",
						assignees: assignees,
					};
				});

				const visibleTasks = mappedTasks.filter((task: Task) =>
					canViewTask(task, {
						id: userData.id?.toString() || "",
						name:
							`${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
							"Użytkownik",
						role: userData.role || "member",
						pillarName: userData.pillarName,
						teamName: userData.teamName,
						isLeader: userData.isLeader === true,
					} as User),
				);
				setTasks(visibleTasks);
				window.__tasks = visibleTasks;
				window.__currentUser = currentUser;
			}
		} catch (error) {
			logger.error("Błąd pobierania danych:", error);
			toast.error("Nie udało się pobrać danych");
		} finally {
			setLoading(false);
		}
	}, []); // ✅ PUSTA TABLICA - NIE MA ZALEŻNOŚCI
	const handleOpenRating = (task: Task) => {
		if (task.rated_at) {
			toast("To zadanie zostało już ocenione!", {
				icon: <FiInfo />,
				duration: 4000,
			});
			return;
		}
		setRatingTask(task);
		setIsRatingModalOpen(true);
	};

	const handleSubmitRating = async (
		taskId: string,
		rating: number,
		comment: string,
	) => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch(`/api/tasks/${taskId}/rate`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ rating, comment }),
			});

			const data = await response.json();

			if (!response.ok) {
				if (data.error === "To zadanie zostało już ocenione") {
					toast("To zadanie zostało już przez Ciebie ocenione!", {
						icon: <FiInfo />,
						duration: 4000,
					});
					setIsRatingModalOpen(false);
					setRatingTask(null);
					return;
				}
				throw new Error(data.error || "Błąd zapisu oceny");
			}

			await fetchData();
			await sendRatingNotification(taskId, rating);
			toast.success("✅ Ocena została zapisana!");
			setIsRatingModalOpen(false);
			setRatingTask(null);
		} catch (error) {
			console.error("Błąd zapisu oceny:", error);
			toast.error("❌ Nie udało się zapisać oceny");
		}
	};

	const sendRatingNotification = async (taskId: string, rating: number) => {
		try {
			const token = localStorage.getItem("accessToken");
			await fetch("/api/notifications/task-rated", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					taskId,
					rating,
					ratedBy: currentUser.name,
				}),
			});
		} catch (error) {
			console.error("Błąd wysyłki powiadomienia:", error);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);
	const handleOpenFeedback = (task: Task) => {
		setFeedbackTask(task);
		setIsFeedbackOpen(true);
	};

	const handleSubmitFeedback = async (
		task: Task,
		feedbackText: string,
		file?: File,
	) => {
		try {
			const token = localStorage.getItem("accessToken");

			let response;

			if (file) {
				const formData = new FormData();
				formData.append("feedbackText", feedbackText || "");
				formData.append("file", file);

				response = await fetch(`/api/tasks/${task.id}/feedback`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
					},
					body: formData,
				});
			} else {
				response = await fetch(`/api/tasks/${task.id}/feedback`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						feedbackText: feedbackText || "",
					}),
				});
			}

			if (response.ok) {
				const data = await response.json();

				setTasks(
					tasks.map((t) =>
						t.id === task.id
							? {
								...t,
								feedbackText: data.feedbackText || feedbackText,
								feedbackFile: data.feedbackFile,
								feedbackFileName: data.feedbackFileName,
								feedbackSubmittedAt:
									data.feedbackSubmittedAt || new Date().toISOString(),
							}
							: t,
					),
				);

				toast.success("Odpowiedź zwrotna została przesłana!");
				setIsFeedbackOpen(false);
				setFeedbackTask(null);
			} else {
				const error = await response.json();
				throw new Error(error.error || "Błąd zapisu");
			}
		} catch (error) {
			console.error("Błąd wysyłania odpowiedzi:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Nie udało się wysłać odpowiedzi",
			);
		}
	};
	const handleViewTask = (task: Task) => {
		setSelectedTask(task);
		setIsDetailOpen(true);
	};

	const handleEditFromDetail = () => {
		if (selectedTask) {
			setIsDetailOpen(false);
			handleEditTask(selectedTask);
		}
	};

	useEffect(() => {
		if (currentUser.id) {
			setTasks((prevTasks) =>
				prevTasks.filter((task) => canViewTask(task, currentUser)),
			);
		}
	}, [currentUser]);

	useEffect(() => {
		const fetchProjects = async () => {
			try {
				const token = localStorage.getItem("accessToken");
				const res = await fetch("/api/projects", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.ok) {
					const data = await res.json();
					setProjects(
						data.map((p: any) => ({ id: p.id.toString(), name: p.name })),
					);
				}
			} catch (error) {
				console.error("Błąd pobierania projektów:", error);
			}
		};
		fetchProjects();
	}, []);

	const handleAddTask = () => {
		setEditingTask(null);
		setIsModalOpen(true);
	};

	const handleEditTask = (task: Task) => {
		setEditingTask(task);
		setIsModalOpen(true);
	};

	const handleDeleteTask = (task: Task) => {
		setTaskToDelete(task);
		setIsConfirmOpen(true);
	};
	const handleConfirmDelete = async () => {
		if (!taskToDelete) return;

		setIsDeleting(true);

		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch(`/api/tasks/${taskToDelete.id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});

			if (response.ok) {
				setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
				toast.success(`Zadanie "${taskToDelete.title}" zostało usunięte`);
			} else {
				const error = await response.text();
				toast.error(`Nie udało się usunąć: ${error}`);
			}
		} catch (error) {
			console.error("❌ Błąd usuwania:", error);
			setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
			toast.success(
				`Zadanie "${taskToDelete.title}" zostało usunięte lokalnie`,
			);
		} finally {
			setIsDeleting(false);
			setIsConfirmOpen(false);
			setTaskToDelete(null);
		}
	};

	const handleCancelDelete = () => {
		setIsConfirmOpen(false);
		setTaskToDelete(null);
	};
	const handleSaveTask = async (task: Task) => {
		try {
			const token = localStorage.getItem("accessToken");
			const isEdit = tasks.some((t) => t.id === task.id);
			const isNumericId = /^\d+$/.test(task.id);

			if (
				task.isRecurring &&
				task.recurrencePattern &&
				task.recurrenceEndDate
			) {
				const response = await fetch("/api/tasks/recurring", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						...task,
						assignedTo: task.assignedTo,
						assignedUsers: task.assignedUsers || [],
						assignedType: task.assignedType || "user",
						assignedGroup: task.assignedGroup || null,
					}),
				});

				if (response.ok) {
					const data = await response.json();
					toast.success(`Utworzono ${data.count} zadań cyklicznych`);
					setIsModalOpen(false);
					setEditingTask(null);
					// ✅ ZMIANA: ODŚWIEŻ DANE
					await fetchData();
					return;
				}
			}

			const url = isEdit && isNumericId ? `/api/tasks/${task.id}` : "/api/tasks";
			const method = isEdit && isNumericId ? "PUT" : "POST";

			const payload = {
				title: task.title,
				description: task.description,
				status: task.status,
				priority: task.priority,
				assignedTo: task.assignedTo,
				assignedUsers: task.assignedUsers || [],
				projectId: task.projectId || null,
				dueDate: task.dueDate,
				tags: task.tags || [],
				requiresFeedback: task.requiresFeedback || false,
				feedbackType: task.feedbackType || "text",
				assignedType: task.assignedType || "user",
				assignedGroup: task.assignedGroup || null,
				isRecurring: task.isRecurring || false,
				recurrencePattern: task.recurrencePattern || "weekly",
				recurrenceEndDate: task.recurrenceEndDate || null,
				pillar: task.pillar || null,
			};

			const response = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (response.ok) {

				// ✅ ZMIANA: ODŚWIEŻ DANE - TO JEST NAJWAŻNIEJSZE
				await fetchData();

				toast.success(`Zadanie "${task.title}" zostało ${isEdit ? 'zaktualizowane' : 'dodane'}`);
				setIsModalOpen(false);
				setEditingTask(null);
			} else {
				const errorText = await response.text();
				console.error("Błąd response:", response.status, errorText);
				throw new Error(`Błąd zapisu: ${response.status}`);
			}
		} catch (error) {
			console.error("Błąd zapisywania zadania:", error);
			toast.error("Nie udało się zapisać zadania");
		}
	};


	const handleStatusChange = useCallback(
		async (task: Task, newStatus: TaskStatus, userId?: string) => {
			const targetUserId = userId || currentUser.id;


			const isMultiUser = task.assignedUsers && task.assignedUsers.length > 1;

			if (isMultiUser) {

				try {
					const token = localStorage.getItem("accessToken");
					const response = await fetch(`/api/tasks/${task.id}/assignees/${targetUserId}/status`, {
						method: "PUT",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ status: newStatus }),
					});

					if (response.ok) {

						await fetchData();

						if (newStatus === "done") {

							const allAssigneesRes = await fetch(`/api/tasks/${task.id}/assignees`, {
								headers: { Authorization: `Bearer ${token}` }
							});
							const allAssignees = await allAssigneesRes.json();
							const assignedUsers = task.assignedUsers || [];
							const allDone = assignedUsers.every((uid: string) => {
								const a = allAssignees.find((ass: any) => ass.userId === uid);
								return a && a.status === 'done';
							});

							if (allDone) {
								toast.success("✅ Wszyscy ukończyli zadanie!");
							} else {
								toast.success(`✅ Zakończyłeś swoje zadanie! Czekaj na innych.`);
							}
						} else {
							toast.success(`✅ Status zmieniony na ${STATUS_LABELS[newStatus]}`);
						}
					} else {
						const error = await response.json();
						toast.error(error.error || "Nie udało się zmienić statusu");
					}
				} catch (error) {
					console.error("Błąd zmiany statusu:", error);
					toast.error("Nie udało się zmienić statusu");
				}
				return;
			}


			if (isUpdating || task.status === newStatus) return;

			setIsUpdating(true);
			try {
				const token = localStorage.getItem("accessToken");
				const response = await fetch(`/api/tasks/${task.id}`, {
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						...task,
						status: newStatus,
					}),
				});

				if (response.ok) {
					const data = await response.json();
					setTasks((prev) =>
						prev
							.map((t) =>
								t.id === task.id
									? { ...t, status: data.status || newStatus }
									: t,
							)
							.filter((t) => canViewTask(t, currentUser)),
					);

					if (newStatus === "done") {
						toast.success(`Zadanie zakończone! Oceń je teraz.`);
						handleOpenRating({ ...task, status: newStatus });
					} else {
						toast.success(`Status zmieniony na ${STATUS_LABELS[newStatus]}`);
					}
				}
			} catch (error) {
				console.error("Błąd zmiany statusu:", error);
				toast.error("Nie udało się zmienić statusu");
			} finally {
				setIsUpdating(false);
			}
		},
		[isUpdating, currentUser, fetchData],
	);

	const filteredTasks = tasks
		.filter((task) => {
			const matchesSearch =
				task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				task.description.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesStatus =
				filterStatus === "all" || task.status === filterStatus;
			const matchesPriority =
				filterPriority === "all" || task.priority === filterPriority;
			return matchesSearch && matchesStatus && matchesPriority;
		})
		.sort((a, b) => {
			const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
			return priorityOrder[a.priority] - priorityOrder[b.priority];
		});

	if (loading) {
		return (
			<div className={styles.tasks}>
				<div className={styles.loading}>
					<div className={styles.loading__spinner}></div>
					<p>Ładowanie zadań...</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.tasks}>
			<div className={styles.header}>
				<div className={styles.header__left}>
					<h1 className={styles.header__title}>Zadania</h1>
					<p className={styles.header__subtitle}>
						Zarządzaj zadaniami dla członków organizacji
					</p>
				</div>
				{canManage && (
					<button className={styles.header__addBtn} onClick={handleAddTask}>
						<Plus size={18} />
						Dodaj zadanie
					</button>
				)}
			</div>

			<div className={styles.filters}>
				<div className={styles.filters__search}>
					<Search size={18} className={styles.filters__searchIcon} />
					<input
						type="text"
						className={styles.filters__searchInput}
						placeholder="Szukaj zadań..."
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
					<select
						className={styles.filters__select}
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value)}
					>
						<option value="all">Wszystkie statusy</option>
						<option value="todo">Do zrobienia</option>
						<option value="in_progress">W trakcie</option>
						<option value="review">Do weryfikacji</option>
						<option value="done">Zakończone</option>
					</select>

					<select
						className={styles.filters__select}
						value={filterPriority}
						onChange={(e) => setFilterPriority(e.target.value)}
					>
						<option value="all">Wszystkie priorytety</option>
						<option value="urgent">Krytyczny</option>
						<option value="high">Wysoki</option>
						<option value="medium">Średni</option>
						<option value="low">Niski</option>
					</select>
				</div>
			</div>

			<div className={styles.tasksContainer}>
				{filteredTasks.length === 0 ? (
					<div className={styles.emptyState}>
						<Check size={48} className={styles.emptyState__icon} />
						<h3 className={styles.emptyState__title}>Brak zadań</h3>
						<p className={styles.emptyState__description}>
							{searchTerm || filterStatus !== "all" || filterPriority !== "all"
								? "Nie znaleziono zadań spełniających kryteria wyszukiwania."
								: canManage
									? "Nie ma jeszcze żadnych zadań. Kliknij 'Dodaj zadanie' aby utworzyć pierwsze."
									: "Nie ma jeszcze żadnych zadań."}
						</p>
						{canManage && filteredTasks.length === 0 && !searchTerm && (
							<button
								className={styles.emptyState__btn}
								onClick={handleAddTask}
							>
								<Plus size={16} />
								Dodaj pierwsze zadanie
							</button>
						)}
					</div>
				) : (
					<>
						{(() => {
							const myTasks = filteredTasks.filter(
								(task) =>
									task.assignedTo === currentUser.id ||
									(task.assignedUsers &&
										task.assignedUsers.includes(currentUser.id)),
							);
							if (myTasks.length > 0) {
								return (
									<div className={styles.tasksSection}>
										<div className={styles.tasksSectionHeader}>
											<h2 className={styles.tasksSectionTitle}>
												Twoje zadania
												<span className={styles.tasksSectionCount}>
													{myTasks.length}
												</span>
											</h2>
										</div>
										<div className={styles.tasksGrid}>
											{myTasks.map((task) => (
												<TaskCard
													key={task.id}
													task={task}
													currentUser={currentUser}
													onView={handleViewTask}
													onEdit={canManage ? handleEditTask : undefined}
													onDelete={canManage ? handleDeleteTask : undefined}
													onStatusChange={handleStatusChange}
													onFeedback={handleOpenFeedback}
												/>
											))}
										</div>
									</div>
								);
							}
							return null;
						})()}

						{(() => {
							const otherTasks = filteredTasks.filter(
								(task) =>
									task.assignedTo !== currentUser.id &&
									!(
										task.assignedUsers &&
										task.assignedUsers.includes(currentUser.id)
									),
							);
							if (otherTasks.length > 0) {
								return (
									<div className={styles.tasksSection}>
										<div className={styles.tasksSectionHeader}>
											<h2 className={styles.tasksSectionTitle}>
												Zadania innych
												<span className={styles.tasksSectionCount}>
													{otherTasks.length}
												</span>
											</h2>
										</div>
										<div className={styles.tasksGrid}>
											{otherTasks.map((task) => (
												<TaskCard
													key={task.id}
													task={task}
													currentUser={currentUser}
													onView={handleViewTask}
													onEdit={canManage ? handleEditTask : undefined}
													onDelete={canManage ? handleDeleteTask : undefined}
													onStatusChange={handleStatusChange}
													onFeedback={handleOpenFeedback}
												/>
											))}
										</div>
									</div>
								);
							}
							return null;
						})()}
					</>
				)}
			</div>

			<FeedbackModal
				isOpen={isFeedbackOpen}
				task={feedbackTask}
				onClose={() => {
					setIsFeedbackOpen(false);
					setFeedbackTask(null);
				}}
				onSubmit={handleSubmitFeedback}
			/>
			<TaskDetailModal
				isOpen={isDetailOpen}
				task={selectedTask}
				currentUser={currentUser}
				onClose={() => {
					setIsDetailOpen(false);
					setSelectedTask(null);
				}}
				onEdit={
					selectedTask && canManageTask(currentUser, selectedTask)
						? handleEditFromDetail
						: undefined
				}
			/>
			<TaskModal
				isOpen={isModalOpen}
				task={editingTask}
				currentUser={currentUser}
				members={members}
				projects={projects}
				teams={teams}
				pillars={pillars}
				onClose={() => {
					setIsModalOpen(false);
					setEditingTask(null);
				}}
				onSave={handleSaveTask}
				onDelete={canManage ? handleDeleteTask : undefined}
			/>
			<TaskRatingModal
				isOpen={isRatingModalOpen}
				task={ratingTask}
				onClose={() => {
					setIsRatingModalOpen(false);
					setRatingTask(null);
				}}
				onSubmit={handleSubmitRating}
			/>
			<ConfirmDialog
				isOpen={isConfirmOpen}
				title="Potwierdź usunięcie"
				message={`Czy na pewno chcesz usunąć zadanie "${taskToDelete?.title || ""}"? Tej operacji nie można cofnąć.`}
				confirmText="Usuń"
				cancelText="Anuluj"
				isLoading={isDeleting}
				onConfirm={handleConfirmDelete}
				onCancel={handleCancelDelete}
			/>
		</div>
	);
}
