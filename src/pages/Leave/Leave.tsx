import { useState, useMemo } from "react";
import {
    Calendar,
    Search,
    X,
    Filter,
    Plus,
    Edit,
    Trash2,
    Eye,
    Users,
    User,
    Clock,
    CheckCircle,
    AlertCircle,
    Umbrella,
    ChevronDown,
    ChevronRight,
    FileText,
    Download,
    Bell,
    EyeOff,
    Eye as EyeIcon,
    LayoutGrid,
    List,
} from "lucide-react";
import styles from "./Leave.module.css";

// ---------------------------------------------------------------------------
// TYPY
// ---------------------------------------------------------------------------

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
    role: "admin" | "coordinator" | "member";
    teamId?: string;
    team?: string;
};

// ---------------------------------------------------------------------------
// DANE PRZYKŁADOWE
// ---------------------------------------------------------------------------

const MOCK_USER: User = {
    id: "1",
    name: "Jan Kowalski",
    role: "admin",
    teamId: "board",
    team: "Zarząd",
};

const TEAMS = [
    "Filar Projektowy",
    "Filar Konferencji i Debat",
    "Filar Rzeczniczy",
    "Filar Symulacyjny",
    "Social Media",
    "Zespół TikToka",
    "Zarząd",
    "Komisja Rewizyjna",
    "Sąd Koleżeński",
];

const MOCK_LEAVES: LeaveRequest[] = [
    {
        id: "1",
        userId: "4",
        userName: "Adrian Wróblewski",
        userTeam: "Filar Konferencji i Debat",
        type: "vacation",
        scope: "all",
        startDate: "2026-08-01",
        endDate: "2026-08-14",
        reason: "",
        reasonVisibility: "private",
        status: "approved",
        createdAt: "2026-07-15T10:30:00",
        approvedBy: "Maksym Marczak",
        approvedAt: "2026-07-16T09:00:00",
    },
    {
        id: "2",
        userId: "6",
        userName: "Igor Piskórz",
        userTeam: "Filar Symulacyjny",
        type: "vacation",
        scope: "team",
        affectedTeams: ["Filar Symulacyjny"],
        startDate: "2026-07-20",
        endDate: "2026-07-22",
        reason: "",
        reasonVisibility: "private",
        status: "pending",
        createdAt: "2026-07-19T08:15:00",
    },
    {
        id: "3",
        userId: "7",
        userName: "Maja Melerska",
        userTeam: "Social Media",
        type: "vacation",
        scope: "all",
        startDate: "2026-07-25",
        endDate: "2026-07-25",
        reason: "",
        reasonVisibility: "private",
        status: "pending",
        createdAt: "2026-07-18T14:20:00",
    },
    {
        id: "4",
        userId: "3",
        userName: "Zosia Wartacz",
        userTeam: "Filar Projektowy",
        type: "vacation",
        scope: "team",
        affectedTeams: ["Filar Projektowy", "Filar Konferencji i Debat"],
        startDate: "2026-08-15",
        endDate: "2026-08-22",
        reason: "",
        reasonVisibility: "private",
        status: "pending",
        createdAt: "2026-07-17T11:45:00",
    },
    {
        id: "5",
        userId: "5",
        userName: "Jan Augustynak",
        userTeam: "Filar Rzeczniczy",
        type: "vacation",
        scope: "all",
        startDate: "2026-07-28",
        endDate: "2026-07-29",
        reason: "",
        reasonVisibility: "coordinators",
        status: "rejected",
        createdAt: "2026-07-14T09:00:00",
        approvedBy: "Maksym Marczak",
        approvedAt: "2026-07-15T10:00:00",
        comments: [
            {
                id: "c1",
                author: "Maksym Marczak",
                content: "Szkolenie nie jest w tym terminie. Proszę o przesunięcie lub wybór innego terminu.",
                createdAt: "2026-07-15T10:00:00",
            },
        ],
    },
    {
        id: "6",
        userId: "2",
        userName: "Krzysztof Korbut",
        userTeam: "Zarząd",
        type: "vacation",
        scope: "all",
        startDate: "2026-09-01",
        endDate: "2026-09-07",
        reason: "",
        reasonVisibility: "private",
        status: "cancelled",
        createdAt: "2026-07-10T13:30:00",
        approvedBy: "Maksym Marczak",
        approvedAt: "2026-07-11T08:30:00",
    },
    {
        id: "7",
        userId: "8",
        userName: "Maja Kądziela",
        userTeam: "Zespół TikToka",
        type: "vacation",
        scope: "all",
        startDate: "2026-07-18",
        endDate: "2026-07-19",
        reason: "",
        reasonVisibility: "private",
        status: "approved",
        createdAt: "2026-07-18T06:00:00",
        approvedBy: "Jakub Patrowicz",
        approvedAt: "2026-07-18T08:00:00",
    },
];

// ---------------------------------------------------------------------------
// MAPOWANIE NA TEKSTY
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// FUNKCJE POMOCNICZE
// ---------------------------------------------------------------------------

const isCurrentlyOnLeave = (userId: string, leaves: LeaveRequest[]): { onLeave: boolean; endDate?: string } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeLeave = leaves.find(
        (l) =>
            l.userId === userId &&
            l.status === "approved" &&
            new Date(l.startDate) <= today &&
            new Date(l.endDate) >= today
    );

    return {
        onLeave: !!activeLeave,
        endDate: activeLeave?.endDate,
    };
};

const checkTeamAvailability = (leave: LeaveRequest, leaves: LeaveRequest[], allMembers: string[]): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const affectedTeams = leave.scope === "all" ? TEAMS : leave.affectedTeams || [];

    const activeMembers = allMembers.filter((member) => {
        const isOnLeave = leaves.some(
            (l) =>
                l.userId === member &&
                l.status === "approved" &&
                new Date(l.startDate) <= today &&
                new Date(l.endDate) >= today
        );
        return !isOnLeave;
    });

    return activeMembers.length;
};

// ---------------------------------------------------------------------------
// KOMPONENT KARTY WNIOSKU
// ---------------------------------------------------------------------------

interface LeaveCardProps {
    leave: LeaveRequest;
    currentUser: User;
    onView: (leave: LeaveRequest) => void;
    onEdit: (leave: LeaveRequest) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: LeaveStatus) => void;
    canManage: boolean;
    canViewReason: boolean;
}

function LeaveCard({
    leave,
    currentUser,
    onView,
    onEdit,
    onDelete,
    onStatusChange,
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
                        {leave.userAvatar || leave.userName[0]}
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
                    <span className={`${styles.leaveCard__status} ${STATUS_COLORS[leave.status]}`}>
                        {STATUS_ICONS[leave.status]}
                        {STATUS_LABELS[leave.status]}
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
                    <div className={`${styles.leaveCard__approval} ${leave.status === "approved"
                            ? styles.leaveCard__approvalApproved
                            : leave.status === "rejected"
                                ? styles.leaveCard__approvalRejected
                                : ""
                        }`}>
                        {leave.status === "approved" ? (
                            <CheckCircle size={14} />
                        ) : leave.status === "rejected" ? (
                            <X size={14} />
                        ) : null}
                        <span>
                            {leave.status === "approved" ? "Zatwierdził" : "Odrzucił"}: <strong>{leave.approvedBy}</strong>
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
                                <h4 className={styles.leaveCard__attachmentsTitle}>Załączniki:</h4>
                                <ul className={styles.leaveCard__attachmentsList}>
                                    {leave.attachments.map((file) => (
                                        <li key={file.name} className={styles.leaveCard__attachment}>
                                            <FileText size={14} />
                                            <span>{file.name}</span>
                                            <span className={styles.leaveCard__attachmentSize}>{file.size}</span>
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

                        {(canManage || currentUser.id === leave.userId) && (
                            <>
                                <button
                                    className={styles.leaveCard__actionBtn}
                                    onClick={() => onEdit(leave)}
                                    title="Edytuj"
                                >
                                    <Edit size={16} />
                                </button>
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

// ---------------------------------------------------------------------------
// KALENDARZ
// ---------------------------------------------------------------------------

interface CalendarViewProps {
    leaves: LeaveRequest[];
    currentUser: User;
    canManage: boolean;
}

function CalendarView({ leaves, currentUser, canManage }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = [];
        const firstDay = new Date(year, month, 1);
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
    const monthName = currentMonth.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    return (
        <div className={styles.calendar}>
            <div className={styles.calendar__header}>
                <button onClick={prevMonth} className={styles.calendar__nav}>←</button>
                <h3 className={styles.calendar__title}>{monthName}</h3>
                <button onClick={nextMonth} className={styles.calendar__nav}>→</button>
            </div>
            <div className={styles.calendar__grid}>
                <div className={styles.calendar__weekdays}>
                    {["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((day) => (
                        <div key={day} className={styles.calendar__weekday}>{day}</div>
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
                                <span className={styles.calendar__dayNumber}>{day.getDate()}</span>
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

// ---------------------------------------------------------------------------
// MODAL WNIOSKU
// ---------------------------------------------------------------------------

interface LeaveModalProps {
    isOpen: boolean;
    leave: LeaveRequest | null;
    currentUser: User;
    isViewOnly?: boolean;
    onClose: () => void;
    onSave?: (leave: LeaveRequest) => void;
}

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
    const [newAttachment, setNewAttachment] = useState({ name: "", url: "", size: "" });
    const [newComment, setNewComment] = useState("");
    const [showReason, setShowReason] = useState(!isViewOnly);

    if (!isOpen) return null;

    const isEdit = !!leave;
    const canEdit = !isViewOnly && (
        currentUser.role === "admin" ||
        currentUser.id === leave?.userId ||
        !leave
    );

    const canViewReason = !isViewOnly ||
        currentUser.role === "admin" ||
        currentUser.role === "coordinator" ||
        currentUser.id === leave?.userId;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSave && canEdit) {
            const saveData: LeaveRequest = {
                id: leave?.id || `leave-${Date.now()}`,
                userId: formData.userId || currentUser.id,
                userName: formData.userName || currentUser.name,
                userTeam: formData.userTeam || currentUser.team || "",
                type: "vacation",
                scope: formData.scope as LeaveScope || "all",
                affectedTeams: formData.affectedTeams || [],
                startDate: formData.startDate || "",
                endDate: formData.endDate || "",
                reason: formData.reason || "",
                reasonVisibility: formData.reasonVisibility as ReasonVisibility || "private",
                status: formData.status as LeaveStatus || "pending",
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

    const addComment = () => {
        if (newComment.trim()) {
            const comment = {
                id: `c${Date.now()}`,
                author: currentUser.name,
                content: newComment.trim(),
                createdAt: new Date().toISOString(),
            };
            setFormData({
                ...formData,
                comments: [...(formData.comments || []), comment],
            });
            setNewComment("");
        }
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
                        {isViewOnly ? "Podgląd wniosku" :
                            isEdit ? "Edytuj wniosek" :
                                "Nowy wniosek urlopowy"}
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
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as LeaveStatus })}
                                disabled={!canEdit || isViewOnly}
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
                                onChange={(e) => setFormData({ ...formData, scope: e.target.value as LeaveScope })}
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
                                onChange={(e) => setFormData({ ...formData, reasonVisibility: e.target.value as ReasonVisibility })}
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
                            <div className={styles.modal__teams}>
                                {TEAMS.map((team) => (
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
                        </div>
                    )}

                    <div className={styles.modal__row}>
                        <div className={styles.modal__field}>
                            <label className={styles.modal__label}>Data rozpoczęcia *</label>
                            <input
                                type="date"
                                className={styles.modal__input}
                                value={formData.startDate || ""}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                                disabled={!canEdit || isViewOnly}
                            />
                        </div>
                        <div className={styles.modal__field}>
                            <label className={styles.modal__label}>Data zakończenia *</label>
                            <input
                                type="date"
                                className={styles.modal__input}
                                value={formData.endDate || ""}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                required
                                disabled={!canEdit || isViewOnly}
                            />
                        </div>
                    </div>

                    <div className={styles.modal__field}>
                        <label className={styles.modal__label}>Powód</label>
                        <textarea
                            className={`${styles.modal__input} ${styles.modal__textarea}`}
                            value={formData.reason || ""}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="Podaj powód wniosku (opcjonalnie)..."
                            rows={3}
                            disabled={!canEdit || isViewOnly}
                        />
                    </div>

                    {!isViewOnly && (
                        <div className={styles.modal__field}>
                            <label className={styles.modal__label}>Załączniki</label>
                            <div className={styles.modal__fileInput}>
                                <input
                                    type="text"
                                    className={styles.modal__input}
                                    value={newAttachment.name}
                                    onChange={(e) => setNewAttachment({ ...newAttachment, name: e.target.value })}
                                    placeholder="Nazwa pliku"
                                    disabled={!canEdit}
                                />
                                <input
                                    type="text"
                                    className={styles.modal__input}
                                    value={newAttachment.url}
                                    onChange={(e) => setNewAttachment({ ...newAttachment, url: e.target.value })}
                                    placeholder="URL pliku"
                                    disabled={!canEdit}
                                />
                                <input
                                    type="text"
                                    className={styles.modal__input}
                                    value={newAttachment.size}
                                    onChange={(e) => setNewAttachment({ ...newAttachment, size: e.target.value })}
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
                                            <span className={styles.modal__fileSize}>{file.size}</span>
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

                    {isViewOnly && formData.attachments && formData.attachments.length > 0 && (
                        <div className={styles.modal__field}>
                            <label className={styles.modal__label}>Załączniki</label>
                            <div className={styles.modal__fileListView}>
                                {formData.attachments.map((file, index) => (
                                    <div key={index} className={styles.modal__fileItemView}>
                                        <FileText size={14} />
                                        <span>{file.name}</span>
                                        <span className={styles.modal__fileSize}>{file.size}</span>
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
                        <div className={`${styles.modal__approval} ${leave.status === "approved"
                                ? styles.modal__approvalApproved
                                : leave.status === "rejected"
                                    ? styles.modal__approvalRejected
                                    : ""
                            }`}>
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

                    {!isViewOnly && (currentUser.role === "admin" || currentUser.role === "coordinator") && (
                        <div className={styles.modal__field}>
                            <label className={styles.modal__label}>Dodaj komentarz</label>
                            <div className={styles.modal__commentInput}>
                                <textarea
                                    className={`${styles.modal__input} ${styles.modal__textarea}`}
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Dodaj komentarz do wniosku..."
                                    rows={2}
                                    disabled={!canEdit}
                                />
                                <button
                                    type="button"
                                    className={styles.modal__addCommentBtn}
                                    onClick={addComment}
                                    disabled={!canEdit || !newComment.trim()}
                                >
                                    <Plus size={16} />
                                    Dodaj
                                </button>
                            </div>
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

// ---------------------------------------------------------------------------
// GŁÓWNY KOMPONENT
// ---------------------------------------------------------------------------

export default function Leave({ title }: { title?: string }) {
    const [leaves, setLeaves] = useState<LeaveRequest[]>(MOCK_LEAVES);
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: "n1",
            title: "Nowy wniosek urlopowy",
            message: "Igor Piskórz zgłosił urlop od 20.07.2026 do 22.07.2026",
            createdAt: "2026-07-19T08:15:00",
            read: false,
            type: "leave",
        },
        {
            id: "n2",
            title: "Wniosek zaakceptowany",
            message: "Wniosek Adriana Wróblewskiego został zaakceptowany przez Maksyma Marczaka",
            createdAt: "2026-07-16T09:00:00",
            read: true,
            type: "approval",
        },
    ]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<LeaveStatus | "all">("all");
    const [selectedType, setSelectedType] = useState<LeaveType | "all">("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
    const [viewingLeave, setViewingLeave] = useState<LeaveRequest | null>(null);
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
    const [showNotifications, setShowNotifications] = useState(false);

    const currentUser = MOCK_USER;
    const canManage = currentUser.role === "admin" || currentUser.role === "coordinator";

    const unreadCount = notifications.filter((n) => !n.read).length;

    const filteredLeaves = useMemo(() => {
        return leaves.filter((leave) => {
            const matchesSearch =
                leave.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                leave.userTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (leave.reason && leave.reason.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = selectedStatus === "all" || leave.status === selectedStatus;
            const matchesType = selectedType === "all" || leave.type === selectedType;

            let canView = false;
            if (currentUser.role === "admin") {
                canView = true;
            } else if (currentUser.role === "coordinator") {
                // Koordynator widzi urlopy swojego zespołu
                canView = leave.userTeam === currentUser.team ||
                    leave.affectedTeams?.includes(currentUser.team || "") ||
                    currentUser.id === leave.userId;
            } else {
                canView = currentUser.id === leave.userId;
            }

            return matchesSearch && matchesStatus && matchesType && canView;
        });
    }, [leaves, searchTerm, selectedStatus, selectedType, currentUser]);

    const handleAddLeave = () => {
        setEditingLeave(null);
        setIsModalOpen(true);
    };

    const handleEditLeave = (leave: LeaveRequest) => {
        setEditingLeave(leave);
        setIsModalOpen(true);
    };

    const handleViewLeave = (leave: LeaveRequest) => {
        setViewingLeave(leave);
        setIsViewModalOpen(true);
    };

    const handleDeleteLeave = (id: string) => {
        if (window.confirm("Czy na pewno chcesz usunąć ten wniosek?")) {
            setLeaves(leaves.filter((l) => l.id !== id));
        }
    };

    const handleStatusChange = (id: string, status: LeaveStatus) => {
        if (!canManage) return;
        setLeaves(
            leaves.map((l) =>
                l.id === id
                    ? {
                        ...l,
                        status,
                        approvedBy: status === "pending" ? undefined : currentUser.name,
                        approvedAt: status === "pending" ? undefined : new Date().toISOString(),
                    }
                    : l,
            )
        );

        // Dodaj powiadomienie
        const leave = leaves.find((l) => l.id === id);
        if (leave) {
            const notification: Notification = {
                id: `n${Date.now()}`,
                title: status === "approved" ? "Wniosek zaakceptowany" : "Wniosek odrzucony",
                message: `Wniosek ${leave.userName} został ${status === "approved" ? "zaakceptowany" : "odrzucony"} przez ${currentUser.name}`,
                createdAt: new Date().toISOString(),
                read: false,
                type: status === "approved" ? "approval" : "rejection",
            };
            setNotifications([notification, ...notifications]);
        }
    };

    const handleSaveLeave = (leave: LeaveRequest) => {
        const existingIndex = leaves.findIndex((l) => l.id === leave.id);
        if (existingIndex >= 0) {
            const updated = [...leaves];
            updated[existingIndex] = leave;
            setLeaves(updated);
        } else {
            setLeaves([leave, ...leaves]);
            // Dodaj powiadomienie o nowym wniosku
            const notification: Notification = {
                id: `n${Date.now()}`,
                title: "Nowy wniosek urlopowy",
                message: `${leave.userName} zgłosił urlop od ${new Date(leave.startDate).toLocaleDateString("pl-PL")} do ${new Date(leave.endDate).toLocaleDateString("pl-PL")}`,
                createdAt: new Date().toISOString(),
                read: false,
                type: "leave",
            };
            setNotifications([notification, ...notifications]);
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedStatus("all");
        setSelectedType("all");
    };

    const getStatusCount = (status: LeaveStatus) => {
        return leaves.filter((l) => l.status === status).length;
    };

    const totalLeaves = leaves.length;

    const markNotificationAsRead = (id: string) => {
        setNotifications(
            notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            )
        );
    };

    const markAllAsRead = () => {
        setNotifications(
            notifications.map((n) => ({ ...n, read: true }))
        );
    };

    return (
        <div className={styles.leave}>
            {/* Nagłówek */}
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
                    <div className={styles.header__notifications}>
                        <button
                            className={styles.header__notifBtn}
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className={styles.header__notifBadge}>{unreadCount}</span>
                            )}
                        </button>
                        {showNotifications && (
                            <div className={styles.header__notifDropdown}>
                                <div className={styles.header__notifHeader}>
                                    <span>Powiadomienia</span>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} className={styles.header__notifMarkAll}>
                                            Oznacz wszystkie jako przeczytane
                                        </button>
                                    )}
                                </div>
                                {notifications.length === 0 ? (
                                    <div className={styles.header__notifEmpty}>Brak powiadomień</div>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`${styles.header__notifItem} ${!n.read ? styles.header__notifItemUnread : ""}`}
                                            onClick={() => markNotificationAsRead(n.id)}
                                        >
                                            <div className={styles.header__notifTitle}>{n.title}</div>
                                            <div className={styles.header__notifMessage}>{n.message}</div>
                                            <div className={styles.header__notifTime}>
                                                {new Date(n.createdAt).toLocaleString("pl-PL")}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    <button className={styles.header__addBtn} onClick={handleAddLeave}>
                        <Plus size={18} />
                        Nowy wniosek
                    </button>
                </div>
            </div>

            {/* Statusy - szybki dostęp */}
            <div className={styles.statuses}>
                <button
                    className={`${styles.statuses__item} ${selectedStatus === "all" ? styles.statuses__itemActive : ""}`}
                    onClick={() => setSelectedStatus("all")}
                >
                    <span className={styles.statuses__count}>{totalLeaves}</span>
                    <span>Wszystkie</span>
                </button>
                {Object.entries(STATUS_LABELS).map(([key, label]) => {
                    const count = getStatusCount(key as LeaveStatus);
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

            {/* Filtry */}
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
                        <button className={styles.filters__clear} onClick={() => setSearchTerm("")}>
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

                    {(selectedStatus !== "all" || selectedType !== "all" || searchTerm) && (
                        <button className={styles.filters__reset} onClick={clearFilters}>
                            Wyczyść filtry
                        </button>
                    )}
                </div>
            </div>

            {/* Lista/Kalendarz */}
            {viewMode === "list" ? (
                <div className={styles.leavesGrid}>
                    {filteredLeaves.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Umbrella size={48} className={styles.emptyState__icon} />
                            <h3 className={styles.emptyState__title}>Brak wniosków</h3>
                            <p className={styles.emptyState__description}>
                                {searchTerm || selectedStatus !== "all" || selectedType !== "all"
                                    ? "Nie znaleziono wniosków spełniających kryteria wyszukiwania."
                                    : "Nie ma jeszcze żadnych wniosków urlopowych."}
                            </p>
                            <button className={styles.emptyState__btn} onClick={handleAddLeave}>
                                <Plus size={18} />
                                Złóż pierwszy wniosek
                            </button>
                        </div>
                    ) : (
                        filteredLeaves.map((leave) => {
                            const canViewReason =
                                currentUser.role === "admin" ||
                                currentUser.role === "coordinator" ||
                                currentUser.id === leave.userId ||
                                leave.reasonVisibility === "coordinators";

                            return (
                                <LeaveCard
                                    key={leave.id}
                                    leave={leave}
                                    currentUser={currentUser}
                                    onView={handleViewLeave}
                                    onEdit={handleEditLeave}
                                    onDelete={handleDeleteLeave}
                                    onStatusChange={handleStatusChange}
                                    canManage={canManage}
                                    canViewReason={canViewReason}
                                />
                            );
                        })
                    )}
                </div>
            ) : (
                <CalendarView
                    leaves={filteredLeaves}
                    currentUser={currentUser}
                    canManage={canManage}
                />
            )}

            {/* Modal edycji/dodawania */}
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

            {/* Modal podglądu */}
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
        </div>
    );
}