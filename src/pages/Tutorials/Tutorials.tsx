import { useState, useMemo } from "react";
import {
    BookOpen,
    Search,
    X,
    Filter,
    Plus,
    Edit,
    Trash2,
    Eye,
    Download,
    FileText,
    Users,
    UserCog,
    UserCheck,
    Calendar,
    Tag,
    ChevronDown,
    ChevronRight,
    BadgeCheck,
    File,
} from "lucide-react";
import styles from "./Tutorials.module.css";

// ---------------------------------------------------------------------------
// TYPY
// ---------------------------------------------------------------------------

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
    updatedAt: string;
    content: string;
    attachments?: {
        name: string;
        url: string;
        size: string;
    }[];
    isNew?: boolean;
    isUpdated?: boolean;
    functionalRoles?: string[]; // Dla kategorii "functional" - lista stanowisk
};

type User = {
    id: string;
    name: string;
    role: "admin" | "coordinator" | "functional" | "member";
    functionalRole?: string; // np. "Prezes", "Wiceprezes", "Koordynator Filaru Projektowego"
};

// ---------------------------------------------------------------------------
// DANE PRZYKŁADOWE
// ---------------------------------------------------------------------------

const MOCK_USER: User = {
    id: "1",
    name: "Jan Kowalski",
    role: "coordinator",
    functionalRole: "Koordynator Filaru Projektowego",
};

const MOCK_TUTORIALS: Tutorial[] = [
    {
        id: "1",
        title: "Poradnik dla nowych członków SM",
        description: "Kompleksowy przewodnik dla nowych członków organizacji. Zawiera informacje o strukturze, zasadach działania, komunikacji oraz podstawowych obowiązkach.",
        category: "new_member",
        access: "all",
        author: "Zarząd Siły Młodych",
        updatedAt: "2026-07-15",
        content: "Witaj w Siły Młodych! Ten poradnik pomoże Ci rozpocząć przygodę z naszą organizacją...",
        attachments: [
            { name: "Przewodnik_nowego_członka.pdf", url: "#", size: "2.4 MB" },
        ],
        isNew: false,
        isUpdated: true,
    },
    {
        id: "2",
        title: "Wytyczne i poradnik tworzenia projektów",
        description: "Dokument opisujący sposób zgłaszania, planowania oraz realizacji projektów w organizacji.",
        category: "project_guidelines",
        access: "all",
        author: "Dział Projektów",
        updatedAt: "2026-07-10",
        content: "Proces tworzenia projektu w Siły Młodych składa się z kilku etapów...",
        attachments: [
            { name: "Szablon_projektu.docx", url: "#", size: "1.1 MB" },
            { name: "Karta_projektu.pdf", url: "#", size: "0.8 MB" },
        ],
        isNew: false,
        isUpdated: false,
    },
    {
        id: "3",
        title: "Poradnik opłacania składek",
        description: "Informacje dotyczące zasad opłacania składek, terminów oraz procedur.",
        category: "contributions",
        access: "all",
        author: "Komisja Rewizyjna",
        updatedAt: "2026-07-01",
        content: "Składki członkowskie są podstawą funkcjonowania organizacji...",
        attachments: [
            { name: "Instrukcja_przelewu.pdf", url: "#", size: "0.5 MB" },
        ],
        isNew: false,
        isUpdated: false,
    },
    {
        id: "4",
        title: "Statut organizacji",
        description: "Oficjalny dokument określający zasady funkcjonowania, cele i strukturę organizacji.",
        category: "statute",
        access: "all",
        author: "Zarząd Siły Młodych",
        updatedAt: "2026-06-20",
        content: "Statut Siły Młodych został uchwalony w dniu...",
        attachments: [
            { name: "Statut_SM_2026.pdf", url: "#", size: "3.2 MB" },
        ],
        isNew: false,
        isUpdated: false,
    },
    {
        id: "5",
        title: "Regulamin organizacji",
        description: "Zbiór zasad obowiązujących członków organizacji.",
        category: "regulations",
        access: "all",
        author: "Zarząd Siły Młodych",
        updatedAt: "2026-06-15",
        content: "Regulamin określa prawa i obowiązki członków...",
        attachments: [
            { name: "Regulamin_SM.pdf", url: "#", size: "1.8 MB" },
        ],
        isNew: false,
        isUpdated: false,
    },
    {
        id: "6",
        title: "Procedura 'Jak działają wyróżnienia'",
        description: "Informacje dotyczące zasad przyznawania wyróżnień, kryteriów oraz procedury ich otrzymywania.",
        category: "distinctions",
        access: "all",
        author: "Zarząd Siły Młodych",
        updatedAt: "2026-07-18",
        content: "Wyróżnienia są przyznawane za szczególne osiągnięcia...",
        attachments: [
            { name: "Procedura_wyróżnień.pdf", url: "#", size: "0.9 MB" },
        ],
        isNew: true,
        isUpdated: false,
    },
    {
        id: "7",
        title: "Poradnik dla koordynatorów",
        description: "Materiał dostępny wyłącznie dla osób pełniących funkcję koordynatora. Zawiera informacje o zarządzaniu zespołem, prowadzeniu projektów i obowiązkach.",
        category: "coordinator",
        access: "coordinator",
        author: "Zarząd Siły Młodych",
        updatedAt: "2026-07-12",
        content: "Jako koordynator jesteś odpowiedzialny za...",
        attachments: [
            { name: "Poradnik_koordynatora.pdf", url: "#", size: "2.1 MB" },
            { name: "Szablon_raportu.xlsx", url: "#", size: "0.6 MB" },
        ],
        isNew: false,
        isUpdated: true,
    },
    {
        id: "8",
        title: "Procedura zgłaszania problemów z frekwencją",
        description: "Instrukcja dla osób funkcyjnych dotycząca zgłaszania problemów z frekwencją członków zespołu.",
        category: "functional",
        access: "functional",
        author: "Dział HR",
        updatedAt: "2026-07-08",
        content: "Procedura zgłaszania problemów z frekwencją...",
        functionalRoles: ["Koordynator Filaru Projektowego", "Koordynator Filaru Konferencyjnego"],
        attachments: [
            { name: "Procedura_frekwencji.pdf", url: "#", size: "0.7 MB" },
        ],
        isNew: false,
        isUpdated: false,
    },
    {
        id: "9",
        title: "Zakres odpowiedzialności funkcji",
        description: "Szczegółowy opis obowiązków dla poszczególnych stanowisk w organizacji.",
        category: "functional",
        access: "functional",
        author: "Zarząd Siły Młodych",
        updatedAt: "2026-07-05",
        content: "Każda funkcja w organizacji ma określony zakres odpowiedzialności...",
        functionalRoles: ["Prezes", "Wiceprezes", "Koordynator Filaru Projektowego", "Koordynator Filaru Konferencyjnego"],
        attachments: [
            { name: "Zakres_odpowiedzialnosci.pdf", url: "#", size: "1.2 MB" },
        ],
        isNew: false,
        isUpdated: false,
    },
];

// ---------------------------------------------------------------------------
// MAPOWANIE NA TEKSTY
// ---------------------------------------------------------------------------

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

// const ACCESS_LABELS: Record<TutorialAccess, string> = {
//     all: "Dla wszystkich",
//     coordinator: "Dla koordynatorów",
//     functional: "Dla osób funkcyjnych",
//     board: "Dla zarządu",
// };

const ACCESS_COLORS: Record<TutorialAccess, string> = {
    all: styles.accessAll,
    coordinator: styles.accessCoordinator,
    functional: styles.accessFunctional,
    board: styles.accessBoard,
};

// ---------------------------------------------------------------------------
// KOMPONENT KARTY PORADNIKA
// ---------------------------------------------------------------------------

interface TutorialCardProps {
    tutorial: Tutorial;
    onView: (tutorial: Tutorial) => void;
    onEdit: (tutorial: Tutorial) => void;
    onDelete: (id: string) => void;
    canEdit: boolean;
    canView: boolean;
}

function TutorialCard({
    tutorial,
    onView,
    onEdit,
    onDelete,
    canEdit,
    canView
}: TutorialCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("pl-PL", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

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
                        {tutorial.isNew && (
                            <span className={styles.tutorialCard__badgeNew}>Nowy</span>
                        )}
                        {tutorial.isUpdated && !tutorial.isNew && (
                            <span className={styles.tutorialCard__badgeUpdated}>Aktualizacja</span>
                        )}
                        <span className={`${styles.tutorialCard__access} ${ACCESS_COLORS[tutorial.access]}`}>
                            {getAccessLabel()}
                        </span>
                    </div>
                </div>
                <p className={styles.tutorialCard__description}>{tutorial.description}</p>
            </div>

            <div className={styles.tutorialCard__body}>
                <div className={styles.tutorialCard__meta}>
                    <div className={styles.tutorialCard__metaItem}>
                        <Tag size={14} />
                        <span>{CATEGORY_LABELS[tutorial.category]}</span>
                    </div>
                    <div className={styles.tutorialCard__metaItem}>
                        <Users size={14} />
                        <span>Autor: <strong>{tutorial.author}</strong></span>
                    </div>
                    <div className={styles.tutorialCard__metaItem}>
                        <Calendar size={14} />
                        <span>Ostatnia aktualizacja: <strong>{formatDate(tutorial.updatedAt)}</strong></span>
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
                        <h4 className={styles.tutorialCard__contentTitle}>Treść poradnika:</h4>
                        <p className={styles.tutorialCard__contentText}>{tutorial.content}</p>
                    </div>
                )}

                {tutorial.attachments && tutorial.attachments.length > 0 && (
                    <div className={styles.tutorialCard__attachments}>
                        <h4 className={styles.tutorialCard__attachmentsTitle}>Załączniki:</h4>
                        <ul className={styles.tutorialCard__attachmentsList}>
                            {tutorial.attachments.map((file) => (
                                <li key={file.name} className={styles.tutorialCard__attachment}>
                                    <File size={14} />
                                    <span>{file.name}</span>
                                    <span className={styles.tutorialCard__attachmentSize}>{file.size}</span>
                                    <button className={styles.tutorialCard__downloadBtn}>
                                        <Download size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className={styles.tutorialCard__actions}>
                    <button
                        className={styles.tutorialCard__expandBtn}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? (
                            <>
                                <ChevronDown size={16} />
                                Zwiń
                            </>
                        ) : (
                            <>
                                <ChevronRight size={16} />
                                Pokaż więcej
                            </>
                        )}
                    </button>

                    <div className={styles.tutorialCard__actionButtons}>
                        <button
                            className={styles.tutorialCard__actionBtn}
                            onClick={() => onView(tutorial)}
                            title="Podgląd"
                        >
                            <Eye size={16} />
                        </button>
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

// ---------------------------------------------------------------------------
// MODAL PODGLĄDU/EDYCJI
// ---------------------------------------------------------------------------

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
    onSave
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
        }
    );
    const [newAttachment, setNewAttachment] = useState({ name: "", url: "", size: "" });
    const [newRole, setNewRole] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSave && !isViewOnly) {
            const now = new Date().toISOString().split("T")[0];
            const saveData: Tutorial = {
                id: tutorial?.id || `tutorial-${Date.now()}`,
                title: formData.title || "",
                description: formData.description || "",
                category: formData.category as TutorialCategory || "new_member",
                access: formData.access as TutorialAccess || "all",
                author: formData.author || "",
                updatedAt: now,
                content: formData.content || "",
                attachments: formData.attachments || [],
                functionalRoles: formData.functionalRoles || [],
                isNew: tutorial?.isNew || false,
                isUpdated: true,
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
            functionalRoles: formData.functionalRoles?.filter((r) => r !== role) || [],
        });
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={`${styles.modal} ${isViewOnly ? styles.modalView : ""}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modal__header}>
                    <h2 className={styles.modal__title}>
                        {isViewOnly ? "Podgląd poradnika" : tutorial ? "Edytuj poradnik" : "Dodaj nowy poradnik"}
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
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            disabled={isViewOnly}
                        />
                    </div>

                    <div className={styles.modal__field}>
                        <label className={styles.modal__label}>Opis *</label>
                        <textarea
                            className={`${styles.modal__input} ${styles.modal__textarea}`}
                            value={formData.description || ""}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            disabled={isViewOnly}
                        />
                    </div>

                    <div className={styles.modal__row}>
                        <div className={styles.modal__field}>
                            <label className={styles.modal__label}>Kategoria *</label>
                            <select
                                className={styles.modal__select}
                                value={formData.category || "new_member"}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as TutorialCategory })}
                                disabled={isViewOnly}
                            >
                                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.modal__field}>
                            <label className={styles.modal__label}>Dostępność *</label>
                            <select
                                className={styles.modal__select}
                                value={formData.access || "all"}
                                onChange={(e) => setFormData({ ...formData, access: e.target.value as TutorialAccess })}
                                disabled={isViewOnly}
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
                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                            required
                            disabled={isViewOnly}
                        />
                    </div>

                    {formData.category === "functional" && (
                        <div className={styles.modal__field}>
                            <label className={styles.modal__label}>Stanowiska (dla osób funkcyjnych)</label>
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
                                    disabled={isViewOnly}
                                />
                                <button
                                    type="button"
                                    className={styles.modal__addMember}
                                    onClick={addRole}
                                    disabled={isViewOnly}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            {formData.functionalRoles && formData.functionalRoles.length > 0 && (
                                <div className={styles.modal__teamList}>
                                    {formData.functionalRoles.map((role) => (
                                        <span key={role} className={styles.modal__teamTag}>
                                            {role}
                                            {!isViewOnly && (
                                                <button
                                                    type="button"
                                                    className={styles.modal__removeMember}
                                                    onClick={() => removeRole(role)}
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
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Pełna treść poradnika..."
                            rows={6}
                            disabled={isViewOnly}
                        />
                    </div>

                    {!isViewOnly && (
                        <div className={styles.modal__field}>
                            <label className={styles.modal__label}>Załączniki</label>
                            <div className={styles.modal__teamInput}>
                                <input
                                    type="text"
                                    className={styles.modal__input}
                                    value={newAttachment.name}
                                    onChange={(e) => setNewAttachment({ ...newAttachment, name: e.target.value })}
                                    placeholder="Nazwa pliku"
                                />
                                <input
                                    type="text"
                                    className={styles.modal__input}
                                    value={newAttachment.url}
                                    onChange={(e) => setNewAttachment({ ...newAttachment, url: e.target.value })}
                                    placeholder="URL pliku"
                                />
                                <input
                                    type="text"
                                    className={styles.modal__input}
                                    value={newAttachment.size}
                                    onChange={(e) => setNewAttachment({ ...newAttachment, size: e.target.value })}
                                    placeholder="Rozmiar (np. 2.4 MB)"
                                />
                                <button
                                    type="button"
                                    className={styles.modal__addMember}
                                    onClick={addAttachment}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            {formData.attachments && formData.attachments.length > 0 && (
                                <div className={styles.modal__fileList}>
                                    {formData.attachments.map((file, index) => (
                                        <div key={index} className={styles.modal__fileItem}>
                                            <File size={14} />
                                            <span>{file.name}</span>
                                            <span className={styles.modal__fileSize}>{file.size}</span>
                                            <button
                                                type="button"
                                                className={styles.modal__removeFile}
                                                onClick={() => removeAttachment(index)}
                                            >
                                                <X size={14} />
                                            </button>
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
                                        <File size={14} />
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

                    <div className={styles.modal__actions}>
                        <button type="button" className={styles.modal__btnCancel} onClick={onClose}>
                            {isViewOnly ? "Zamknij" : "Anuluj"}
                        </button>
                        {!isViewOnly && (
                            <button type="submit" className={styles.modal__btnSave}>
                                {tutorial ? "Zapisz zmiany" : "Dodaj poradnik"}
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

export default function Tutorials() {
    const [tutorials, setTutorials] = useState<Tutorial[]>(MOCK_TUTORIALS);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<TutorialCategory | "all">("all");
    const [selectedAccess, setSelectedAccess] = useState<TutorialAccess | "all">("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
    const [viewingTutorial, setViewingTutorial] = useState<Tutorial | null>(null);

    // W rzeczywistej aplikacji pobieramy z kontekstu/auth
    const currentUser = MOCK_USER;

    const canManageTutorials = currentUser.role === "admin";
    const canViewTutorial = (tutorial: Tutorial): boolean => {
        if (tutorial.access === "all") return true;
        if (tutorial.access === "coordinator" && currentUser.role === "coordinator") return true;
        if (tutorial.access === "functional" && currentUser.role === "functional") {
            if (tutorial.functionalRoles) {
                return tutorial.functionalRoles.includes(currentUser.functionalRole || "");
            }
            return true;
        }
        if (tutorial.access === "board" && currentUser.role === "admin") return true;
        return false;
    };

    const filteredTutorials = useMemo(() => {
        return tutorials.filter((tutorial) => {
            const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tutorial.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tutorial.author.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = selectedCategory === "all" || tutorial.category === selectedCategory;
            const matchesAccess = selectedAccess === "all" || tutorial.access === selectedAccess;

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

    const handleViewTutorial = (tutorial: Tutorial) => {
        setViewingTutorial(tutorial);
        setIsViewModalOpen(true);
    };

    const handleDeleteTutorial = (id: string) => {
        if (window.confirm("Czy na pewno chcesz usunąć ten poradnik?")) {
            setTutorials(tutorials.filter((t) => t.id !== id));
        }
    };

    const handleSaveTutorial = (tutorial: Tutorial) => {
        const existingIndex = tutorials.findIndex((t) => t.id === tutorial.id);
        if (existingIndex >= 0) {
            const updated = [...tutorials];
            updated[existingIndex] = tutorial;
            setTutorials(updated);
        } else {
            setTutorials([tutorial, ...tutorials]);
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedCategory("all");
        setSelectedAccess("all");
    };

    const getCategoryCount = (category: TutorialCategory) => {
        return tutorials.filter((t) => t.category === category && canViewTutorial(t)).length;
    };

    return (
        <div className={styles.tutorials}>
            {/* Nagłówek */}
            <div className={styles.header}>
                <div className={styles.header__left}>
                    <h1 className={styles.header__title}>Poradniki</h1>
                    <p className={styles.header__subtitle}>
                        Centralne miejsce przechowywania dokumentacji, instrukcji i materiałów pomocniczych.
                        {canManageTutorials && " Zarząd może dodawać, edytować i usuwać wszystkie poradniki."}
                    </p>
                </div>
                {canManageTutorials && (
                    <button className={styles.header__addBtn} onClick={handleAddTutorial}>
                        <Plus size={18} />
                        Dodaj poradnik
                    </button>
                )}
            </div>

            {/* Kategorie - szybki dostęp */}
            <div className={styles.categories}>
                <button
                    className={`${styles.categories__item} ${selectedCategory === "all" ? styles.categories__itemActive : ""}`}
                    onClick={() => setSelectedCategory("all")}
                >
                    <span className={styles.categories__count}>{tutorials.filter(t => canViewTutorial(t)).length}</span>
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

            {/* Filtry */}
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
                        <button className={styles.filters__clear} onClick={() => setSearchTerm("")}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className={styles.filters__group}>
                    <Filter size={16} className={styles.filters__groupIcon} />
                    <select
                        className={styles.filters__select}
                        value={selectedAccess}
                        onChange={(e) => setSelectedAccess(e.target.value as TutorialAccess | "all")}
                    >
                        <option value="all">Cała dostępność</option>
                        <option value="all">Dla wszystkich</option>
                        <option value="coordinator">Dla koordynatorów</option>
                        <option value="functional">Dla osób funkcyjnych</option>
                        <option value="board">Dla zarządu</option>
                    </select>

                    {(selectedCategory !== "all" || selectedAccess !== "all" || searchTerm) && (
                        <button className={styles.filters__reset} onClick={clearFilters}>
                            Wyczyść filtry
                        </button>
                    )}
                </div>
            </div>

            {/* Lista poradników */}
            <div className={styles.tutorialsGrid}>
                {filteredTutorials.length === 0 ? (
                    <div className={styles.emptyState}>
                        <BookOpen size={48} className={styles.emptyState__icon} />
                        <h3 className={styles.emptyState__title}>Brak poradników</h3>
                        <p className={styles.emptyState__description}>
                            {searchTerm || selectedCategory !== "all" || selectedAccess !== "all"
                                ? "Nie znaleziono poradników spełniających kryteria wyszukiwania."
                                : "Nie ma jeszcze żadnych poradników."}
                        </p>
                        {canManageTutorials && !searchTerm && selectedCategory === "all" && selectedAccess === "all" && (
                            <button className={styles.emptyState__btn} onClick={handleAddTutorial}>
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
                            onView={handleViewTutorial}
                            onEdit={handleEditTutorial}
                            onDelete={handleDeleteTutorial}
                            canEdit={canManageTutorials}
                            canView={canViewTutorial(tutorial)}
                        />
                    ))
                )}
            </div>

            {/* Modal edycji/dodawania */}
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

            {/* Modal podglądu */}
            <TutorialModal
                isOpen={isViewModalOpen}
                tutorial={viewingTutorial}
                isViewOnly={true}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setViewingTutorial(null);
                }}
            />
        </div>
    );
}