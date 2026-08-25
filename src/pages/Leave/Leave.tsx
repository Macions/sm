import { useEffect } from "react";
import { logger } from "@/utils/logger";
import toast from "react-hot-toast";
import { useState, useMemo } from "react";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

import {
	Calendar,
	Search,
	X,
	Plus,
	Trash2,
	Users,
	User,
	Clock,
	CheckCircle,
	Umbrella,
	ChevronDown,
	ChevronRight,
	FileText,
	Download,
	EyeOff,
	Eye as EyeIcon,
	LayoutGrid,
	List,
	AlertCircle,
} from "lucide-react";
import styles from "./Leave.module.css";

type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
type LeaveType = "vacation";
type LeaveScope = "all" | "team";
type ReasonVisibility = "private" | "coordinators";

type LeaveRequest = {
	id: string;
	userId: string;
	userName: string;
	userAvatar?: string;
	userTeam: string;
	type: LeaveType;
	scope: LeaveScope;
	affectedTeams?: string[];
	startDate: string;
	endDate: string;
	reason: string;
	reasonVisibility: ReasonVisibility;
	status: LeaveStatus;
	createdAt: string;
	approvedBy?: string;
	approvedAt?: string;
	attachments?: {
		name: string;
		url: string;
		size: string;
	}[];
	comments?: {
		id: string;
		author: string;
		content: string;
		createdAt: string;
	}[];
};

type Notification = {
	id: string;
	title: string;
	message: string;
	createdAt: string;
	read: boolean;
	type: "leave" | "approval" | "rejection";
};

type User = {
	id: string;
	name: string;
	role: "admin" | "coordinator" | "member" | "board" | "zarząd";
	teamId?: string;
	team?: string;
};

const TYPE_LABELS: Record<LeaveType, string> = {
	vacation: "Urlop wypoczynkowy",
};

const TYPE_ICONS: Record<LeaveType, React.ReactNode> = {
	vacation: <Umbrella size={16} />,
};

const STATUS_LABELS: Record<LeaveStatus, string> = {
	pending: "Oczekuje",
	approved: "Zaakceptowany",
	rejected: "Odrzucony",
	cancelled: "Anulowany",
};

const STATUS_COLORS: Record<LeaveStatus, string> = {
	pending: styles.statusPending,
	approved: styles.statusApproved,
	rejected: styles.statusRejected,
	cancelled: styles.statusCancelled,
};

const STATUS_ICONS: Record<LeaveStatus, React.ReactNode> = {
	pending: <Clock size={14} />,
	approved: <CheckCircle size={14} />,
	rejected: <X size={14} />,
	cancelled: <X size={14} />,
};

const SCOPE_LABELS: Record<LeaveScope, string> = {
	all: "Cała organizacja SM",
	team: "Konkretny zespół/filar",
};

interface LeaveCardProps {
	leave: LeaveRequest;
	currentUser: User;
	onView: (leave: LeaveRequest) => void;
	onEdit: (leave: LeaveRequest) => void;
	onDelete: (id: string) => void;
	onStatusChange: (id: string, status: LeaveStatus) => void;
	onCancel: (id: string) => void;
	canManage: boolean;
	canViewReason: boolean;
}

function LeaveCard({
	leave,
	currentUser,
	onView,
	onDelete,
	onStatusChange,
	onCancel,
	canManage,
	canViewReason,
}: LeaveCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString("pl-PL", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const formatDateTime = (date: string) => {
		return new Date(date).toLocaleDateString("pl-PL", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getDaysCount = () => {
		const start = new Date(leave.startDate);
		const end = new Date(leave.endDate);
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
		return diffDays;
	};

	const isPending = leave.status === "pending";
	const canApprove = canManage && isPending;

	return (
		<div className={styles.leaveCard}>
			<div className={styles.leaveCard__header}>
				<div className={styles.leaveCard__user}>
					<div className={styles.leaveCard__avatar}>
						{leave.userAvatar || (leave.userName && leave.userName[0]) || "?"}
					</div>
					<div className={styles.leaveCard__userInfo}>
						<h3 className={styles.leaveCard__userName}>{leave.userName}</h3>
						<span className={styles.leaveCard__userTeam}>
							<Users size={12} />
							{leave.userTeam}
						</span>
					</div>
				</div>
				<div className={styles.leaveCard__badges}>

					<span
						className={`${styles.leaveCard__status} ${isLeaveActive(leave) ? styles.statusActive : STATUS_COLORS[leave.status]}`}
					>
						{isLeaveActive(leave) ? (
							<CheckCircle size={14} />
						) : (
							STATUS_ICONS[leave.status]
						)}
						{isLeaveActive(leave) ? "Aktywny" : STATUS_LABELS[leave.status]}
					</span>
					<span className={styles.leaveCard__type}>
						{TYPE_ICONS[leave.type]}
						{TYPE_LABELS[leave.type]}
					</span>
				</div>
			</div>

			<div className={styles.leaveCard__body}>
				<div className={styles.leaveCard__dates}>
					<div className={styles.leaveCard__dateRange}>
						<Calendar size={14} />
						<span>
							{formatDate(leave.startDate)} - {formatDate(leave.endDate)}
						</span>
						<span className={styles.leaveCard__days}>
							({getDaysCount()} {getDaysCount() === 1 ? "dzień" : "dni"})
						</span>
					</div>
				</div>

				<div className={styles.leaveCard__scope}>
					<span className={styles.leaveCard__scopeLabel}>
						Zakres: {SCOPE_LABELS[leave.scope]}
					</span>
					{leave.scope === "team" && leave.affectedTeams && (
						<span className={styles.leaveCard__scopeTeams}>
							{leave.affectedTeams.join(", ")}
						</span>
					)}
				</div>

				{leave.reason && canViewReason && (
					<p className={styles.leaveCard__reason}>{leave.reason}</p>
				)}
				{leave.reason && !canViewReason && (
					<p className={styles.leaveCard__reasonPrivate}>
						<EyeOff size={14} />
						Powód ukryty
					</p>
				)}

				{leave.approvedBy && (
					<div
						className={`${styles.leaveCard__approval} ${leave.status === "approved"
							? styles.leaveCard__approvalApproved
							: leave.status === "rejected"
								? styles.leaveCard__approvalRejected
								: ""
							}`}
					>
						{leave.status === "approved" ? (
							<CheckCircle size={14} />
						) : leave.status === "rejected" ? (
							<X size={14} />
						) : null}
						<span>
							{leave.status === "approved" ? "Zatwierdził" : "Odrzucił"}:{" "}
							<strong>{leave.approvedBy}</strong>
							{leave.approvedAt && ` (${formatDateTime(leave.approvedAt)})`}
						</span>
					</div>
				)}

				{isExpanded && (
					<div className={styles.leaveCard__details}>
						{leave.comments && leave.comments.length > 0 && (
							<div className={styles.leaveCard__comments}>
								<h4 className={styles.leaveCard__commentsTitle}>Komentarze:</h4>
								{leave.comments.map((comment) => (
									<div key={comment.id} className={styles.leaveCard__comment}>
										<strong>{comment.author}</strong>
										<span className={styles.leaveCard__commentDate}>
											{formatDateTime(comment.createdAt)}
										</span>
										<p>{comment.content}</p>
									</div>
								))}
							</div>
						)}

						{leave.attachments && leave.attachments.length > 0 && (
							<div className={styles.leaveCard__attachments}>
								<h4 className={styles.leaveCard__attachmentsTitle}>
									Załączniki:
								</h4>
								<ul className={styles.leaveCard__attachmentsList}>
									{leave.attachments.map((file) => (
										<li
											key={file.name}
											className={styles.leaveCard__attachment}
										>
											<FileText size={14} />
											<span>{file.name}</span>
											<span className={styles.leaveCard__attachmentSize}>
												{file.size}
											</span>
											<button className={styles.leaveCard__downloadBtn}>
												<Download size={14} />
											</button>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}

				<div className={styles.leaveCard__actions}>
					{(leave.comments && leave.comments.length > 0) ||
						(leave.attachments && leave.attachments.length > 0) ? (
						<button
							className={styles.leaveCard__expandBtn}
							onClick={() => setIsExpanded(!isExpanded)}
						>
							{isExpanded ? (
								<>
									<ChevronDown size={16} />
									Zwiń szczegóły
								</>
							) : (
								<>
									<ChevronRight size={16} />
									Pokaż szczegóły
								</>
							)}
						</button>
					) : (
						<div style={{ height: "32px" }} />
					)}

					<div className={styles.leaveCard__actionButtons}>
						<button
							className={styles.leaveCard__actionBtn}
							onClick={() => onView(leave)}
							title="Podgląd"
						>
							<EyeIcon size={16} />
						</button>

						{canApprove && (
							<>
								<button
									className={`${styles.leaveCard__actionBtn} ${styles.leaveCard__actionBtnApprove}`}
									onClick={() => onStatusChange(leave.id, "approved")}
									title="Zaakceptuj"
								>
									<CheckCircle size={16} />
								</button>
								<button
									className={`${styles.leaveCard__actionBtn} ${styles.leaveCard__actionBtnReject}`}
									onClick={() => onStatusChange(leave.id, "rejected")}
									title="Odrzuć"
								>
									<X size={16} />
								</button>
							</>
						)}
						{(currentUser.role === "admin" || currentUser.role === "board" || currentUser.role === "zarząd") &&
							isLeaveActive(leave) && (
								<button
									className={`${styles.leaveCard__actionBtn} ${styles.leaveCard__actionBtnCancel}`}
									onClick={() => onCancel(leave.id)}
									title="Anuluj aktywny urlop"
								>
									<X size={16} />
								</button>
							)}

						{canManage && leave.status === "rejected" && (
							<>
								<button
									className={`${styles.leaveCard__actionBtn} ${styles.leaveCard__actionBtnRestore}`}
									onClick={() => onStatusChange(leave.id, "pending")}
									title="Przywróć do oczekujących"
								>
									<Clock size={16} />
								</button>
								<button
									className={`${styles.leaveCard__actionBtn} ${styles.leaveCard__actionBtnApprove}`}
									onClick={() => onStatusChange(leave.id, "approved")}
									title="Zatwierdź bezpośrednio"
								>
									<CheckCircle size={16} />
								</button>
							</>
						)}

						{(currentUser.role === "admin" || currentUser.role === "board" || currentUser.role === "zarząd") && (
							<>

								<button
									className={`${styles.leaveCard__actionBtn} ${styles.leaveCard__actionBtnDanger}`}
									onClick={() => onDelete(leave.id)}
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

interface CalendarViewProps {
	leaves: LeaveRequest[];
}

function CalendarView({ leaves }: CalendarViewProps) {
	const [currentMonth, setCurrentMonth] = useState(new Date());

	const getDaysInMonth = (date: Date) => {
		const year = date.getFullYear();
		const month = date.getMonth();
		const days = [];
		const lastDay = new Date(year, month + 1, 0);

		for (let d = 1; d <= lastDay.getDate(); d++) {
			days.push(new Date(year, month, d));
		}
		return days;
	};

	const getLeavesForDay = (date: Date) => {
		return leaves.filter((leave) => {
			const start = new Date(leave.startDate);
			const end = new Date(leave.endDate);
			return date >= start && date <= end;
		});
	};

	const days = getDaysInMonth(currentMonth);
	const monthName = currentMonth.toLocaleDateString("pl-PL", {
		month: "long",
		year: "numeric",
	});

	const prevMonth = () => {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
		);
	};

	const nextMonth = () => {
		setCurrentMonth(
			new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
		);
	};

	return (
		<div className={styles.calendar}>
			<div className={styles.calendar__header}>
				<button onClick={prevMonth} className={styles.calendar__nav}>
					←
				</button>
				<h3 className={styles.calendar__title}>{monthName}</h3>
				<button onClick={nextMonth} className={styles.calendar__nav}>
					→
				</button>
			</div>
			<div className={styles.calendar__grid}>
				<div className={styles.calendar__weekdays}>
					{["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((day) => (
						<div key={day} className={styles.calendar__weekday}>
							{day}
						</div>
					))}
				</div>
				<div className={styles.calendar__days}>
					{days.map((day, index) => {
						const dayLeaves = getLeavesForDay(day);
						const isToday = day.toDateString() === new Date().toDateString();
						return (
							<div
								key={index}
								className={`${styles.calendar__day} ${isToday ? styles.calendar__dayToday : ""}`}
							>
								<span className={styles.calendar__dayNumber}>
									{day.getDate()}
								</span>
								{dayLeaves.length > 0 && (
									<div className={styles.calendar__dayLeaves}>
										{dayLeaves.slice(0, 2).map((leave) => (
											<div key={leave.id} className={styles.calendar__dayLeave}>
												{leave.userName} ({leave.userTeam})
											</div>
										))}
										{dayLeaves.length > 2 && (
											<div className={styles.calendar__dayLeaveMore}>
												+{dayLeaves.length - 2} więcej
											</div>
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

interface LeaveModalProps {
	isOpen: boolean;
	leave: LeaveRequest | null;
	currentUser: User;
	isViewOnly?: boolean;
	onClose: () => void;
	onSave?: (leave: LeaveRequest) => void;
}

const isLeaveActive = (leave: LeaveRequest): boolean => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const start = new Date(leave.startDate);
	const end = new Date(leave.endDate);
	start.setHours(0, 0, 0, 0);
	end.setHours(0, 0, 0, 0);
	return leave.status === "approved" && start <= today && end >= today;
};
function LeaveModal({
	isOpen,
	leave,
	currentUser,
	isViewOnly = false,
	onClose,
	onSave,
}: LeaveModalProps) {
	const [formData, setFormData] = useState<Partial<LeaveRequest>>(
		leave || {
			userId: currentUser.id,
			userName: currentUser.name,
			userTeam: currentUser.team || "",
			type: "vacation",
			scope: "all",
			affectedTeams: [],
			startDate: "",
			endDate: "",
			reason: "",
			reasonVisibility: "private",
			status: "pending",
			attachments: [],
			comments: [],
		},
	);
	const [userTeams, setUserTeams] = useState<string[]>([]);
	const [loadingTeams, setLoadingTeams] = useState(false);

	useEffect(() => {
		const fetchUserTeams = async () => {
			if (!isOpen || !currentUser) return;

			try {
				setLoadingTeams(true);
				const token = localStorage.getItem("accessToken");

				const response = await fetch("/api/profile", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					throw new Error("Nie udało się pobrać profilu");
				}

				const userData = await response.json();
				logger.debug("📊 Dane z /api/profile:", userData);

				const teams = userData.pillars || [];

				if (teams.length === 0 && userData.team) {
					setUserTeams([userData.team]);
				} else {
					setUserTeams(teams);
				}

				logger.debug("✅ Zespoły użytkownika:", teams);
			} catch (error) {
				logger.error("❌ Błąd pobierania zespołów:", error);

				if (currentUser.team) {
					setUserTeams([currentUser.team]);
				}
			} finally {
				setLoadingTeams(false);
			}
		};

		fetchUserTeams();
	}, [isOpen, currentUser]);
	useEffect(() => {
		if (leave) {
			setFormData({
				...leave,

				affectedTeams: leave.affectedTeams || [],
				attachments: leave.attachments || [],
				comments: leave.comments || [],
			});
		} else {
			setFormData({
				userId: currentUser.id,
				userName: currentUser.name,
				userTeam: currentUser.team || "",
				type: "vacation",
				scope: "all",
				affectedTeams: [],
				startDate: "",
				endDate: "",
				reason: "",
				reasonVisibility: "private",
				status: "pending",
				attachments: [],
				comments: [],
			});
		}
	}, [leave, currentUser]);
	const [newAttachment, setNewAttachment] = useState({
		name: "",
		url: "",
		size: "",
	});
	if (!isOpen) return null;

	const isEdit = !!leave;

	const canEdit =
		!isViewOnly &&
		(currentUser.role === "admin" ||
			currentUser.role === "coordinator" ||
			!leave);

	const validateDates = (
		startDate: string,
		endDate: string,
	): { valid: boolean; error: string } => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const start = new Date(startDate);
		const end = new Date(endDate);

		start.setHours(0, 0, 0, 0);
		end.setHours(0, 0, 0, 0);

		if (start < today) {
			return {
				valid: false,
				error: "Data rozpoczęcia nie może być wcześniejsza niż dzisiejsza data",
			};
		}

		if (end < start) {
			return {
				valid: false,
				error:
					"Data zakończenia nie może być wcześniejsza niż data rozpoczęcia",
			};
		}

		return { valid: true, error: "" };
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (onSave && canEdit) {
			const validation = validateDates(
				formData.startDate || "",
				formData.endDate || "",
			);

			if (!validation.valid) {
				toast.error(validation.error);
				return;
			}

			const saveData: LeaveRequest = {
				id: leave?.id || `leave-${Date.now()}`,
				userId: formData.userId || currentUser.id,
				userName: formData.userName || currentUser.name,
				userTeam: formData.userTeam || currentUser.team || "",
				type: "vacation",
				scope: (formData.scope as LeaveScope) || "all",
				affectedTeams: formData.affectedTeams || [],
				startDate: formData.startDate || "",
				endDate: formData.endDate || "",
				reason: formData.reason || "",
				reasonVisibility:
					(formData.reasonVisibility as ReasonVisibility) || "private",
				status: (formData.status as LeaveStatus) || "pending",
				createdAt: leave?.createdAt || new Date().toISOString(),
				approvedBy: leave?.approvedBy,
				approvedAt: leave?.approvedAt,
				attachments: formData.attachments || [],
				comments: formData.comments || [],
			};
			onSave(saveData);
		}
		onClose();
	};

	const addAttachment = () => {
		if (newAttachment.name.trim() && newAttachment.url.trim()) {
			setFormData({
				...formData,
				attachments: [...(formData.attachments || []), { ...newAttachment }],
			});
			setNewAttachment({ name: "", url: "", size: "" });
		}
	};

	const removeAttachment = (index: number) => {
		setFormData({
			...formData,
			attachments: formData.attachments?.filter((_, i) => i !== index) || [],
		});
	};

	const toggleTeam = (team: string) => {
		const current = formData.affectedTeams || [];
		if (current.includes(team)) {
			setFormData({
				...formData,
				affectedTeams: current.filter((t) => t !== team),
			});
		} else {
			setFormData({
				...formData,
				affectedTeams: [...current, team],
			});
		}
	};

	const formatDateTime = (date: string) => {
		return new Date(date).toLocaleDateString("pl-PL", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
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
							? "Podgląd wniosku"
							: isEdit
								? "Edytuj wniosek"
								: "Nowy wniosek urlopowy"}
					</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__row}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Typ wniosku *</label>
							<select
								className={styles.modal__select}
								value="vacation"
								disabled
							>
								<option value="vacation">Urlop wypoczynkowy</option>
							</select>
						</div>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Status</label>
							<select
								className={styles.modal__select}
								value={formData.status || "pending"}
								onChange={(e) =>
									setFormData({
										...formData,
										status: e.target.value as LeaveStatus,
									})
								}
								disabled
							>
								<option value="pending">Oczekuje</option>
								<option value="approved">Zaakceptowany</option>
								<option value="rejected">Odrzucony</option>
								<option value="cancelled">Anulowany</option>
							</select>
						</div>
					</div>

					<div className={styles.modal__row}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Zakres urlopu *</label>
							<select
								className={styles.modal__select}
								value={formData.scope || "all"}
								onChange={(e) =>
									setFormData({
										...formData,
										scope: e.target.value as LeaveScope,
									})
								}
								disabled={!canEdit || isViewOnly}
							>
								<option value="all">Cała organizacja SM</option>
								<option value="team">Konkretny zespół/filar</option>
							</select>
						</div>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Widoczność powodu</label>
							<select
								className={styles.modal__select}
								value={formData.reasonVisibility || "private"}
								onChange={(e) =>
									setFormData({
										...formData,
										reasonVisibility: e.target.value as ReasonVisibility,
									})
								}
								disabled={!canEdit || isViewOnly}
							>
								<option value="private">Tylko dla mnie</option>
								<option value="coordinators">Dla koordynatorów</option>
							</select>
						</div>
					</div>

					{formData.scope === "team" && (
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Wybierz zespoły *</label>
							{loadingTeams ? (
								<div className={styles.modal__loading}>
									Ładowanie zespołów...
								</div>
							) : userTeams.length === 0 ? (
								<div className={styles.modal__noTeams}>
									<AlertCircle size={16} />
									<span>Nie należysz do żadnego zespołu</span>
								</div>
							) : (
								<div className={styles.modal__teams}>
									{userTeams.map((team) => (
										<label key={team} className={styles.modal__teamCheckbox}>
											<input
												type="checkbox"
												checked={(formData.affectedTeams || []).includes(team)}
												onChange={() => toggleTeam(team)}
												disabled={!canEdit || isViewOnly}
											/>
											{team}
										</label>
									))}
								</div>
							)}
						</div>
					)}

					<div className={styles.modal__row}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Data rozpoczęcia *</label>
							<input
								type="date"
								className={styles.modal__input}
								value={
									formData.startDate
										? new Date(formData.startDate).toISOString().split("T")[0]
										: ""
								}
								onChange={(e) => {
									const newStartDate = e.target.value;
									setFormData({
										...formData,
										startDate: newStartDate,

										endDate:
											formData.endDate &&
												new Date(formData.endDate) < new Date(newStartDate)
												? ""
												: formData.endDate,
									});
								}}
								required
								disabled={!canEdit || isViewOnly}
								min={new Date().toISOString().split("T")[0]}
							/>
						</div>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Data zakończenia *</label>
							<input
								type="date"
								className={styles.modal__input}
								value={
									formData.endDate
										? new Date(formData.endDate).toISOString().split("T")[0]
										: ""
								}
								onChange={(e) =>
									setFormData({ ...formData, endDate: e.target.value })
								}
								required
								disabled={!canEdit || isViewOnly}
								min={
									formData.startDate || new Date().toISOString().split("T")[0]
								}
							/>
						</div>
					</div>

					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Powód</label>
						{isViewOnly && formData.reason ? (
							(() => {
								// TYLKO admin i właściciel zawsze widzą
								const isAdmin = currentUser.role === "admin";
								const isOwner = currentUser.id === formData.userId;

								// Board i Zarząd - widzą tylko jeśli nie jest prywatny
								const isBoardOrZarzad = currentUser.role === "board" || currentUser.role === "zarząd";
								const isNotPrivate = formData.reasonVisibility !== "private";

								// Koordynator - widzi tylko jeśli dla koordynatorów
								const isCoordinator = currentUser.role === "coordinator";
								const isForCoordinators = formData.reasonVisibility === "coordinators";

								const canViewReason =
									isAdmin ||           // Admin zawsze widzi
									isOwner ||           // Właściciel zawsze widzi
									(isBoardOrZarzad && isNotPrivate) ||  // Board/Zarząd nie widzą prywatnych
									(isCoordinator && isForCoordinators); // Koordynator tylko dla koordynatorów

								return canViewReason ? (
									<div className={styles.modal__reasonView}>
										{formData.reason}
									</div>
								) : (
									<div className={styles.modal__reasonHidden}>
										<EyeOff size={16} />
										<span>Powód ukryty</span>
									</div>
								);
							})()
						) : (
							<textarea
								className={`${styles.modal__input} ${styles.modal__textarea}`}
								value={formData.reason || ""}
								onChange={(e) =>
									setFormData({ ...formData, reason: e.target.value })
								}
								placeholder="Podaj powód wniosku (opcjonalnie)..."
								rows={3}
								disabled={!canEdit || isViewOnly}
							/>
						)}
					</div>

					{!isViewOnly && (
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Załączniki</label>
							<div className={styles.modal__fileInput}>
								<input
									type="text"
									className={styles.modal__input}
									value={newAttachment.name}
									onChange={(e) =>
										setNewAttachment({ ...newAttachment, name: e.target.value })
									}
									placeholder="Nazwa pliku"
									disabled={!canEdit}
								/>
								<input
									type="text"
									className={styles.modal__input}
									value={newAttachment.url}
									onChange={(e) =>
										setNewAttachment({ ...newAttachment, url: e.target.value })
									}
									placeholder="URL pliku"
									disabled={!canEdit}
								/>
								<input
									type="text"
									className={styles.modal__input}
									value={newAttachment.size}
									onChange={(e) =>
										setNewAttachment({ ...newAttachment, size: e.target.value })
									}
									placeholder="Rozmiar"
									disabled={!canEdit}
								/>
								<button
									type="button"
									className={styles.modal__addBtn}
									onClick={addAttachment}
									disabled={!canEdit}
								>
									<Plus size={16} />
								</button>
							</div>
							{formData.attachments && formData.attachments.length > 0 && (
								<div className={styles.modal__fileList}>
									{formData.attachments.map((file, index) => (
										<div key={index} className={styles.modal__fileItem}>
											<FileText size={14} />
											<span>{file.name}</span>
											<span className={styles.modal__fileSize}>
												{file.size}
											</span>
											{canEdit && (
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
											<FileText size={14} />
											<span>{file.name}</span>
											<span className={styles.modal__fileSize}>
												{file.size}
											</span>
											<button className={styles.modal__downloadBtn}>
												<Download size={14} />
											</button>
										</div>
									))}
								</div>
							</div>
						)}

					{isViewOnly && formData.comments && formData.comments.length > 0 && (
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Komentarze</label>
							<div className={styles.modal__comments}>
								{formData.comments.map((comment) => (
									<div key={comment.id} className={styles.modal__comment}>
										<div className={styles.modal__commentHeader}>
											<strong>{comment.author}</strong>
											<span className={styles.modal__commentDate}>
												{formatDateTime(comment.createdAt)}
											</span>
										</div>
										<p>{comment.content}</p>
									</div>
								))}
							</div>
						</div>
					)}

					{leave?.approvedBy && (
						<div
							className={`${styles.modal__approval} ${leave.status === "approved"
								? styles.modal__approvalApproved
								: leave.status === "rejected"
									? styles.modal__approvalRejected
									: ""
								}`}
						>
							{leave.status === "approved" ? (
								<CheckCircle size={16} />
							) : leave.status === "rejected" ? (
								<X size={16} />
							) : null}
							<span>
								{leave.status === "approved" ? "Zatwierdził" : "Odrzucił"}:
								<strong> {leave.approvedBy}</strong>
								{leave.approvedAt && ` (${formatDateTime(leave.approvedAt)})`}
							</span>
						</div>
					)}

					<div className={styles.modal__actions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={onClose}
						>
							{isViewOnly ? "Zamknij" : "Anuluj"}
						</button>
						{!isViewOnly && canEdit && (
							<button type="submit" className={styles.modal__btnSave}>
								{isEdit ? "Zapisz zmiany" : "Wyślij wniosek"}
							</button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}

export default function Leave({ title }: { title?: string }) {
	const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [leaveFilter, setLeaveFilter] = useState<"all" | "active" | "archived">("all");
	const [selectedStatus, setSelectedStatus] = useState<LeaveStatus | "all">(
		"all",
	);
	const [_notifications, _setNotifications] = useState<Notification[]>([]);
	const [selectedType, setSelectedType] = useState<LeaveType | "all">("all");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isViewModalOpen, setIsViewModalOpen] = useState(false);
	const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
	const [viewingLeave, setViewingLeave] = useState<LeaveRequest | null>(null);
	const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [confirmDialog, setConfirmDialog] = useState<{
		isOpen: boolean;
		title: string;
		message: string;
		confirmText: string;
		onConfirm: () => void;
		onCancel: () => void;
	}>({
		isOpen: false,
		title: "",
		message: "",
		confirmText: "Potwierdź",
		onConfirm: () => { },
		onCancel: () => { },
	});

	const canManage = currentUser
		? currentUser.role === "admin" ||
		currentUser.role === "board" ||
		currentUser.role === "zarząd"
		: false;

	const filteredLeaves = useMemo(() => {
		if (!currentUser) return [];

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const result = leaves.filter((leave) => {
			const matchesSearch =
				(leave.userName || "")
					.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				(leave.userTeam || "")
					.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				(leave.reason || "").toLowerCase().includes(searchTerm.toLowerCase());


			const matchesStatus =
				selectedStatus === "all" || leave.status === selectedStatus;

			const matchesType = selectedType === "all" || leave.type === selectedType;

			let canView = false;
			if (currentUser?.role === "admin" ||
				currentUser?.role === "board" ||
				currentUser?.role === "zarząd") {
				canView = true;
			} else if (currentUser?.role === "coordinator") {
				canView =
					leave.userTeam === currentUser.team ||
					leave.affectedTeams?.includes(currentUser.team || "") ||
					currentUser.id === leave.userId;
			} else {
				canView = currentUser?.id === leave.userId;
			}

			const isActive = isLeaveActive(leave);


			let matchesActiveFilter = true;

			if (leaveFilter === "active") {
				matchesActiveFilter = isActive;
			} else if (leaveFilter === "archived") {
				const endDate = new Date(leave.endDate);
				endDate.setHours(0, 0, 0, 0);
				const archiveDate = new Date(endDate);
				archiveDate.setDate(archiveDate.getDate() + 7);
				archiveDate.setHours(0, 0, 0, 0);
				const isArchived = leave.status === "cancelled" ||
					leave.status === "rejected" ||
					(leave.status === "approved" && today > archiveDate);
				matchesActiveFilter = isArchived;
			}


			return matchesSearch && matchesStatus && matchesType && canView && matchesActiveFilter;
		});


		return result.sort((a, b) => {
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	}, [leaves, searchTerm, selectedStatus, selectedType, currentUser, leaveFilter]);
	useEffect(() => {
		const fetchAllData = async () => {
			try {
				setLoading(true);
				const token = localStorage.getItem("accessToken");

				const userResponse = await fetch("/api/profile", {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!userResponse.ok) throw new Error("Błąd pobierania profilu");

				const userData = await userResponse.json();
				logger.debug("📊 Dane użytkownika z API:", userData);
				logger.debug("📊 Rola z API:", userData.role);

				const mappedUser = {
					id: userData.id,
					name:
						`${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
						"Użytkownik",
					role: userData.role || "member",
					teamId: userData.teamId,
					team: userData.team,
				};

				setCurrentUser(mappedUser);
				logger.debug("✅ Zmapowany użytkownik:", mappedUser);

				const leavesResponse = await fetch("/api/leaves", {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!leavesResponse.ok) throw new Error("Błąd pobierania urlopów");

				const leavesData = await leavesResponse.json();
				setLeaves(leavesData);
			} catch (error) {
				logger.error("❌ Błąd:", error);
				toast.error("Nie udało się pobrać danych");
			} finally {
				setLoading(false);
			}
		};

		fetchAllData();
	}, []);

	const handleAddLeave = () => {
		setEditingLeave(null);
		setIsModalOpen(true);
	};

	const handleEditLeave = (leave: LeaveRequest) => {
		setEditingLeave(leave);
		setIsModalOpen(true);
	};

	const handleViewLeave = (leave: LeaveRequest) => {
		logger.debug("📋 Viewing leave:", leave);
		setViewingLeave(leave);
		setIsViewModalOpen(true);
	};

	const handleDeleteLeave = (id: string) => {
		showConfirm(
			"Usuń wniosek urlopowy",
			"Czy na pewno chcesz usunąć ten wniosek? Tej operacji nie można cofnąć.",
			"Usuń",
			async () => {
				try {
					const token = localStorage.getItem("accessToken");
					logger.debug(`🔍 [FRONTEND] Usuwanie wniosku: ${id}`);

					const response = await fetch(`/api/leaves/${id}`, {
						method: "DELETE",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					});

					logger.debug(`🔍 [FRONTEND] Status odpowiedzi: ${response.status}`);

					if (response.ok) {
						const data = await response.json();
						logger.debug("🔍 [FRONTEND] Odpowiedź:", data);

						setLeaves(leaves.filter((l) => l.id !== id));
						toast.success("Wniosek usunięty!");
					} else {
						const error = await response.json();
						toast.error(error.error || "Nie udało się usunąć wniosku");
					}
				} catch (error) {
					logger.error("🔍 [FRONTEND] Błąd:", error);
					toast.error("Wystąpił błąd podczas usuwania");
				}
			},
		);
	};
	const showConfirm = (
		title: string,
		message: string,
		confirmText: string,
		onConfirm: () => void,
		onCancel?: () => void,
	) => {
		setConfirmDialog({
			isOpen: true,
			title,
			message,
			confirmText,
			onConfirm: () => {
				onConfirm();
				setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
			},
			onCancel: () => {
				if (onCancel) onCancel();
				setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
			},
		});
	};
	const handleStatusChange = (id: string, status: LeaveStatus) => {
		if (!canManage) return;

		const actionText = status === "approved" ? "zatwierdzić" : "odrzucić";
		const actionLabel = status === "approved" ? "Zaakceptuj" : "Odrzuć";

		showConfirm(
			`${actionLabel} wniosek`,
			`Czy na pewno chcesz ${actionText} ten wniosek urlopowy?`,
			actionLabel,
			async () => {
				try {
					const token = localStorage.getItem("accessToken");
					toast.loading(`Zmiana statusu...`);

					const response = await fetch(`/api/leaves/${id}`, {
						method: "PUT",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ status }),
					});

					if (!response.ok) {
						toast.dismiss();
						toast.error(`Nie udało się ${actionText} wniosku`);
						return;
					}

					setLeaves((prevLeaves) =>
						prevLeaves.map((l) =>
							l.id === id
								? {
									...l,
									status,
									approvedBy:
										status === "pending" ? undefined : currentUser?.name,
									approvedAt:
										status === "pending"
											? undefined
											: new Date().toISOString(),
								}
								: l,
						),
					);

					const leave = leaves.find((l) => l.id === id);
					if (leave) {
						const notification: Notification = {
							id: `n${Date.now()}`,
							title:
								status === "approved"
									? "Wniosek zaakceptowany"
									: "Wniosek odrzucony",
							message: `Wniosek ${leave.userName} został ${status === "approved" ? "zaakceptowany" : "odrzucony"} przez ${currentUser?.name}`,
							createdAt: new Date().toISOString(),
							read: false,
							type: status === "approved" ? "approval" : "rejection",
						};
						_setNotifications((prev) => [notification, ...prev]);
					}

					toast.dismiss();
					toast.success(
						`Wniosek ${status === "approved" ? "zaakceptowany" : "odrzucony"}!`,
					);
				} catch (error) {
					logger.error("❌ Błąd:", error);
					toast.dismiss();
					toast.error("Wystąpił błąd podczas zmiany statusu");
				}
			},
		);
	};


	const handleCancelLeave = (id: string) => {
		if (!canManage) {
			toast.error("Nie masz uprawnień do anulowania urlopów");
			return;
		}

		const leave = leaves.find((l) => l.id === id);
		if (!leave) {
			toast.error("Nie znaleziono wniosku");
			return;
		}


		if (!isLeaveActive(leave)) {
			toast.error("Można anulować tylko aktywne urlopy");
			return;
		}

		showConfirm(
			"Anuluj aktywny urlop",
			`Czy na pewno chcesz anulować aktywny urlop użytkownika ${leave.userName}? 
        Urlop trwa od ${new Date(leave.startDate).toLocaleDateString("pl-PL")} do ${new Date(leave.endDate).toLocaleDateString("pl-PL")}.`,
			"Anuluj urlop",
			async () => {
				try {
					const token = localStorage.getItem("accessToken");
					toast.loading("Anulowanie urlopu...");

					const response = await fetch(`/api/leaves/${id}`, {
						method: "PUT",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ status: "cancelled" }),
					});

					if (!response.ok) {
						toast.dismiss();
						toast.error("Nie udało się anulować urlopu");
						return;
					}


					setLeaves((prevLeaves) =>
						prevLeaves.map((l) =>
							l.id === id
								? {
									...l,
									status: "cancelled",
									approvedBy: currentUser?.name,
									approvedAt: new Date().toISOString(),
								}
								: l,
						),
					);

					toast.dismiss();
					toast.success(`Urlop użytkownika ${leave.userName} został anulowany!`);
				} catch (error) {
					logger.error("❌ Błąd anulowania:", error);
					toast.dismiss();
					toast.error("Wystąpił błąd podczas anulowania urlopu");
				}
			},
		);
	};

	const handleSaveLeave = async (leave: LeaveRequest) => {
		try {
			const token = localStorage.getItem("accessToken");
			const isEdit = leaves.some((l) => l.id === leave.id);
			const url = isEdit ? `/api/leaves/${leave.id}` : "/api/leaves";
			const method = isEdit ? "PUT" : "POST";

			const payload = {
				type: leave.type || "vacation",
				scope: leave.scope || "all",
				affectedTeams: leave.affectedTeams || [],
				startDate: leave.startDate,
				endDate: leave.endDate,
				reason: leave.reason || "",
				reasonVisibility: leave.reasonVisibility || "private",
				attachments: leave.attachments || [],
				status: leave.status || "pending",
			};

			logger.debug("📤 Wysyłam dane do API:", { url, method, payload });

			const response = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorText = await response.text();
				logger.error("❌ Błąd odpowiedzi:", response.status, errorText);
				throw new Error(`Błąd zapisu: ${response.status} ${errorText}`);
			}

			const data = await response.json();
			logger.debug("✅ Otrzymane dane z API:", data);

			const savedLeave = {
				...leave,
				id: data.id || leave.id,
				userId: data.userId || leave.userId || currentUser!.id,
				userName: data.userName || leave.userName || currentUser!.name,
				userTeam:
					data.userTeam ||
					leave.userTeam ||
					currentUser!.team ||
					"Brak zespołu",
				createdAt: data.createdAt || new Date().toISOString(),
				approvedBy: data.approvedBy || leave.approvedBy,
				approvedAt: data.approvedAt || leave.approvedAt,
				comments: data.comments || leave.comments || [],
				attachments: data.attachments || leave.attachments || [],
			};

			if (isEdit) {
				setLeaves(leaves.map((l) => (l.id === leave.id ? savedLeave : l)));
				toast.success("Wniosek zaktualizowany!");
			} else {
				setLeaves([savedLeave, ...leaves]);
				toast.success("Wniosek wysłany!");
			}
		} catch (error) {
			logger.error("❌ Błąd:", error);
			toast.error("Nie udało się zapisać wniosku");
		}
	};

	const clearFilters = () => {
		setSearchTerm("");
		setSelectedStatus("all");
		setSelectedType("all");
	};

	if (loading || !currentUser) {
		return (
			<div className={styles.leave}>
				<div className={styles.loading}>
					<div className={styles.loading__spinner}></div>
				</div>
			</div>
		);
	}
	return (
		<div className={styles.leave}>
			<div className={styles.header}>
				<div className={styles.header__left}>
					<h1 className={styles.header__title}>
						{title ?? "Urlopy i nieobecności"}
					</h1>
					<p className={styles.header__subtitle}>
						Zarządzanie wnioskami urlopowymi i nieobecnościami członków.
						{canManage && " Możesz akceptować i odrzucać wnioski."}
					</p>
				</div>
				<div className={styles.header__right}>
					<button className={styles.header__addBtn} onClick={handleAddLeave}>
						<Plus size={18} />
						Nowy wniosek
					</button>
				</div>
			</div>

			<div className={styles.statuses}>
				<button
					className={`${styles.statuses__item} ${leaveFilter === "all" ? styles.statuses__itemActive : ""}`}
					onClick={() => setLeaveFilter("all")}
				>
					<span className={styles.statuses__count}>{leaves.length}</span>
					<span>Wszystkie</span>
				</button>
				<button
					className={`${styles.statuses__item} ${leaveFilter === "active" ? styles.statuses__itemActive : ""}`}
					onClick={() => setLeaveFilter("active")}
				>
					<span className={styles.statuses__count}>
						{leaves.filter((l) => isLeaveActive(l)).length}
					</span>
					<span>Aktywne</span>
				</button>
				<button
					className={`${styles.statuses__item} ${leaveFilter === "archived" ? styles.statuses__itemActive : ""}`}
					onClick={() => setLeaveFilter("archived")}
				>
					<span className={styles.statuses__count}>
						{leaves.filter((l) => {
							const today = new Date();
							today.setHours(0, 0, 0, 0);
							const end = new Date(l.endDate);
							end.setHours(0, 0, 0, 0);
							const archiveDate = new Date(end);
							archiveDate.setDate(archiveDate.getDate() + 7);
							archiveDate.setHours(0, 0, 0, 0);
							return l.status === "cancelled" ||
								l.status === "rejected" ||
								(l.status === "approved" && today > archiveDate);
						}).length}
					</span>
					<span>Archiwum</span>
				</button>


				{Object.entries(STATUS_LABELS).map(([key, label]) => {
					const count = leaves.filter((l) => l.status === key as LeaveStatus).length;
					if (count === 0) return null;
					return (
						<button
							key={key}
							className={`${styles.statuses__item} ${selectedStatus === key ? styles.statuses__itemActive : ""}`}
							onClick={() => setSelectedStatus(key as LeaveStatus)}
						>
							{STATUS_ICONS[key as LeaveStatus]}
							<span>{label}</span>
							<span className={styles.statuses__count}>{count}</span>
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
						placeholder="Szukaj po nazwie, zespole, powodzie..."
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
					<div className={styles.filters__viewToggle}>
						<button
							className={`${styles.filters__viewBtn} ${viewMode === "list" ? styles.filters__viewBtnActive : ""}`}
							onClick={() => setViewMode("list")}
							title="Widok listy"
						>
							<List size={18} />
						</button>
						<button
							className={`${styles.filters__viewBtn} ${viewMode === "calendar" ? styles.filters__viewBtnActive : ""}`}
							onClick={() => setViewMode("calendar")}
							title="Widok kalendarza"
						>
							<LayoutGrid size={18} />
						</button>
					</div>

					{(selectedStatus !== "all" ||
						selectedType !== "all" ||
						searchTerm) && (
							<button className={styles.filters__reset} onClick={clearFilters}>
								Wyczyść filtry
							</button>
						)}
				</div>
			</div>

			{viewMode === "list" ? (
				<div className={styles.leavesGrid}>
					{filteredLeaves.length === 0 ? (
						<div className={styles.emptyState}>
							<Umbrella size={48} className={styles.emptyState__icon} />
							<h3 className={styles.emptyState__title}>Brak wniosków</h3>
							<p className={styles.emptyState__description}>
								{searchTerm ||
									selectedStatus !== "all" ||
									selectedType !== "all"
									? "Nie znaleziono wniosków spełniających kryteria wyszukiwania."
									: "Nie ma jeszcze żadnych wniosków urlopowych."}
							</p>
							<button
								className={styles.emptyState__btn}
								onClick={handleAddLeave}
							>
								<Plus size={18} />
								Złóż pierwszy wniosek
							</button>
						</div>
					) : (
						filteredLeaves.map((leave) => {
							const canViewReason = (() => {
								if (!currentUser) return false;

								// Admin i właściciel zawsze widzą
								if (currentUser.role === "admin") return true;
								if (currentUser.id === leave.userId) return true;

								// Board i Zarząd - nie widzą prywatnych
								if (currentUser.role === "board" || currentUser.role === "zarząd") {
									return leave.reasonVisibility !== "private";
								}

								// Koordynator - tylko jeśli dla koordynatorów
								if (currentUser.role === "coordinator") {
									return leave.reasonVisibility === "coordinators";
								}

								return false;
							})();
							return (
								<LeaveCard
									key={leave.id}
									leave={leave}
									currentUser={currentUser}
									onView={handleViewLeave}
									onEdit={handleEditLeave}
									onDelete={handleDeleteLeave}
									onStatusChange={handleStatusChange}
									onCancel={handleCancelLeave}
									canManage={canManage}
									canViewReason={canViewReason}
								/>
							);
						})
					)}
				</div>
			) : (
				<CalendarView leaves={filteredLeaves} />
			)}

			<LeaveModal
				isOpen={isModalOpen}
				leave={editingLeave}
				currentUser={currentUser}
				isViewOnly={false}
				onClose={() => {
					setIsModalOpen(false);
					setEditingLeave(null);
				}}
				onSave={handleSaveLeave}
			/>

			<LeaveModal
				isOpen={isViewModalOpen}
				leave={viewingLeave}
				currentUser={currentUser}
				isViewOnly={true}
				onClose={() => {
					setIsViewModalOpen(false);
					setViewingLeave(null);
				}}
			/>

			<ConfirmDialog
				isOpen={confirmDialog.isOpen}
				title={confirmDialog.title}
				message={confirmDialog.message}
				confirmText={confirmDialog.confirmText}
				onConfirm={confirmDialog.onConfirm}
				onCancel={confirmDialog.onCancel}
			/>
		</div>
	);
}
