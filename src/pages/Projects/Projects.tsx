import { useState, useMemo } from "react";
import {
    Plus,
    Edit,
    Trash2,
    Search,
    X,
    Filter,
    Calendar,
    Users as UsersIcon,
    Tag,
    Clock,
    CheckCircle,
    Pencil,
    AlertCircle,
    Briefcase,
    Users,
    Megaphone,
    GraduationCap,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import styles from "./Projects.module.css";

// ---------------------------------------------------------------------------
// TYPY
// ---------------------------------------------------------------------------

type ProjectStatus = "planning" | "in_progress" | "promotion";

type ProjectPillar = "project" | "conference" | "advocacy" | "simulation";

type Project = {
    id: string;
    name: string;
    description: string;
    pillar: ProjectPillar;
    status: ProjectStatus;
    estimatedCompletion: string; // Data w formacie YYYY-MM-DD
    team: string[];
    coordinator: string;
    createdAt: string;
    updatedAt: string;
};

type User = {
    id: string;
    name: string;
    role: "admin" | "coordinator" | "member";
    pillar?: ProjectPillar;
};

// ---------------------------------------------------------------------------
// DANE PRZYKŁADOWE
// ---------------------------------------------------------------------------

const MOCK_USER: User = {
    id: "1",
    name: "Jan Kowalski",
    role: "coordinator",
    pillar: "project",
};

const MOCK_PROJECTS: Project[] = [
    {
        id: "1",
        name: "Aplikacja mobilna Siły Młodych",
        description: "Tworzenie aplikacji mobilnej dla członków organizacji umożliwiającej łatwy dostęp do informacji i wydarzeń.",
        pillar: "project",
        status: "in_progress",
        estimatedCompletion: "2026-12-31",
        team: ["Zosia Wartacz", "Zuzanna Wojtusiak", "Maksym Marczak"],
        coordinator: "Zosia Wartacz",
        createdAt: "2026-01-15",
        updatedAt: "2026-07-10",
    },
    {
        id: "2",
        name: "Konferencja Młodych Liderów 2026",
        description: "Organizacja dorocznej konferencji dla młodych liderów z całej Polski.",
        pillar: "conference",
        status: "planning",
        estimatedCompletion: "2026-11-15",
        team: ["Adrian Wróblewski", "Wojciech Podolski", "Maja Melerska"],
        coordinator: "Adrian Wróblewski",
        createdAt: "2026-03-01",
        updatedAt: "2026-07-01",
    },
    {
        id: "3",
        name: "Kampania społeczna #MłodziGłosują",
        description: "Ogólnopolska kampania zachęcająca młodych ludzi do udziału w wyborach i aktywności obywatelskiej.",
        pillar: "advocacy",
        status: "promotion",
        estimatedCompletion: "2026-10-30",
        team: ["Jan Augustynak", "Nikola Socha", "Oliwier Szulejko"],
        coordinator: "Jan Augustynak",
        createdAt: "2026-02-10",
        updatedAt: "2026-07-15",
    },
    {
        id: "4",
        name: "Symulacja Sejmu RP",
        description: "Organizacja symulacji obrad Sejmu dla studentów i młodych polityków.",
        pillar: "simulation",
        status: "planning",
        estimatedCompletion: "2027-01-20",
        team: ["Igor Piskórz", "Maksym Marczak"],
        coordinator: "Igor Piskórz",
        createdAt: "2026-05-01",
        updatedAt: "2026-06-20",
    },
    {
        id: "5",
        name: "Debaty Oksfordzkie",
        description: "Cykl debat oksfordzkich w szkołach średnich promujących umiejętność argumentacji i krytycznego myślenia.",
        pillar: "conference",
        status: "in_progress",
        estimatedCompletion: "2026-12-15",
        team: ["Adrian Wróblewski", "Wojciech Podolski", "Emilia Dobias"],
        coordinator: "Wojciech Podolski",
        createdAt: "2026-04-10",
        updatedAt: "2026-07-05",
    },
];

// ---------------------------------------------------------------------------
// MAPOWANIE NA TEKSTY
// ---------------------------------------------------------------------------

const PILLAR_LABELS: Record<ProjectPillar, string> = {
    project: "Filar Projektowy",
    conference: "Filar Konferencji i Debat",
    advocacy: "Filar Rzeczniczy",
    simulation: "Filar Symulacyjny",
};

const PILLAR_ICONS: Record<ProjectPillar, React.ReactNode> = {
    project: <Briefcase size={16} />,
    conference: <Users size={16} />,
    advocacy: <Megaphone size={16} />,
    simulation: <GraduationCap size={16} />,
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
    planning: "Faza planowania",
    in_progress: "Faza pracy",
    promotion: "Faza promocji",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
    planning: styles.statusPlanning,
    in_progress: styles.statusInProgress,
    promotion: styles.statusPromotion,
};

const STATUS_ICONS: Record<ProjectStatus, React.ReactNode> = {
    planning: <Clock size={14} />,
    in_progress: <Pencil size={14} />,
    promotion: <CheckCircle size={14} />,
};

// ---------------------------------------------------------------------------
// KOMPONENT KARTY PROJEKTU
// ---------------------------------------------------------------------------

interface ProjectCardProps {
    project: Project;
    onEdit: (project: Project) => void;
    onDelete: (id: string) => void;
    canEdit: boolean;
}

function ProjectCard({ project, onEdit, onDelete, canEdit }: ProjectCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("pl-PL", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div className={styles.projectCard}>
            <div className={styles.projectCard__header}>
                <div className={styles.projectCard__titleRow}>
                    <h3 className={styles.projectCard__title}>{project.name}</h3>
                    <span className={`${styles.projectCard__status} ${STATUS_COLORS[project.status]}`}>
                        {STATUS_ICONS[project.status]}
                        {STATUS_LABELS[project.status]}
                    </span>
                </div>
                <div className={styles.projectCard__pillar}>
                    {PILLAR_ICONS[project.pillar]}
                    {PILLAR_LABELS[project.pillar]}
                </div>
            </div>

            <div className={styles.projectCard__body}>
                <p className={styles.projectCard__description}>{project.description}</p>

                <div className={styles.projectCard__meta}>
                    <div className={styles.projectCard__metaItem}>
                        <Calendar size={14} />
                        <span>Szacowane zakończenie: <strong>{formatDate(project.estimatedCompletion)}</strong></span>
                    </div>
                    <div className={styles.projectCard__metaItem}>
                        <UsersIcon size={14} />
                        <span>Zespół: <strong>{project.team.length} osób</strong></span>
                    </div>
                </div>

                <div className={styles.projectCard__coordinator}>
                    <Tag size={14} />
                    <span>Koordynator: <strong>{project.coordinator}</strong></span>
                </div>

                {isExpanded && (
                    <div className={styles.projectCard__team}>
                        <h4 className={styles.projectCard__teamTitle}>Członkowie zespołu:</h4>
                        <ul className={styles.projectCard__teamList}>
                            {project.team.map((member) => (
                                <li key={member} className={styles.projectCard__teamMember}>
                                    {member}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <button
                    className={styles.projectCard__expand}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? (
                        <>
                            <ChevronDown size={16} />
                            Zwiń zespół
                        </>
                    ) : (
                        <>
                            <ChevronRight size={16} />
                            Pokaż zespół ({project.team.length})
                        </>
                    )}
                </button>
            </div>

            {canEdit && (
                <div className={styles.projectCard__actions}>
                    <button
                        className={styles.projectCard__actionBtn}
                        onClick={() => onEdit(project)}
                        title="Edytuj projekt"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        className={`${styles.projectCard__actionBtn} ${styles.projectCard__actionBtnDanger}`}
                        onClick={() => onDelete(project.id)}
                        title="Usuń projekt"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// MODAL DODAWANIA/EDYCJI PROJEKTU
// ---------------------------------------------------------------------------

interface ProjectModalProps {
    isOpen: boolean;
    project: Project | null;
    onClose: () => void;
    onSave: (project: Project) => void;
}

function ProjectModal({ isOpen, project, onClose, onSave }: ProjectModalProps) {
    const [formData, setFormData] = useState<Partial<Project>>(
        project || {
            name: "",
            description: "",
            pillar: "project",
            status: "planning",
            estimatedCompletion: "",
            team: [],
            coordinator: "",
        }
    );
    const [teamMember, setTeamMember] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const now = new Date().toISOString().split("T")[0];
        const saveData: Project = {
            id: project?.id || `project-${Date.now()}`,
            name: formData.name || "",
            description: formData.description || "",
            pillar: formData.pillar as ProjectPillar || "project",
            status: formData.status as ProjectStatus || "planning",
            estimatedCompletion: formData.estimatedCompletion || "",
            team: formData.team || [],
            coordinator: formData.coordinator || "",
            createdAt: project?.createdAt || now,
            updatedAt: now,
        };
        onSave(saveData);
        onClose();
    };

    const addTeamMember = () => {
        if (teamMember.trim() && !formData.team?.includes(teamMember.trim())) {
            setFormData({
                ...formData,
                team: [...(formData.team || []), teamMember.trim()],
            });
            setTeamMember("");
        }
    };

    const removeTeamMember = (member: string) => {
        setFormData({
            ...formData,
            team: formData.team?.filter((m) => m !== member) || [],
        });
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modal__header}>
                    <h2 className={styles.modal__title}>
                        {project ? "Edytuj projekt" : "Dodaj nowy projekt"}
                    </h2>
                    <button className={styles.modal__close} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modal__form}>
                    <div className={styles.modal__field}>
                        <label className={styles.modal__label}>Nazwa projektu *</label>
                        <input
                            type="text"
                            className={styles.modal__input}
                            value={formData.name || ""}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className={styles.modal__field}>
                        <label className={styles.modal__label}>Opis projektu *</label>
                        <textarea
                            className={`${styles.modal__input} ${styles.modal__textarea}`}
                            value={formData.description || ""}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    <div className={styles.modal__row}>
                        <div className={styles.modal__field}>
                            <label className={styles.modal__label}>Filar *</label>
                            <select
                                className={styles.modal__select}
                                value={formData.pillar || "project"}
                                onChange={(e) => setFormData({ ...formData, pillar: e.target.value as ProjectPillar })}
                            >
                                <option value="project">Filar Projektowy</option>
                                <option value="conference">Filar Konferencji i Debat</option>
                                <option value="advocacy">Filar Rzeczniczy</option>
                                <option value="simulation">Filar Symulacyjny</option>
                            </select>
                        </div>

                        <div className={styles.modal__field}>
                            <label className={styles.modal__label}>Status *</label>
                            <select
                                className={styles.modal__select}
                                value={formData.status || "planning"}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                            >
                                <option value="planning">Faza planowania</option>
                                <option value="in_progress">Faza pracy</option>
                                <option value="promotion">Faza promocji</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.modal__field}>
                        <label className={styles.modal__label}>Szacowany czas ukończenia *</label>
                        <input
                            type="date"
                            className={styles.modal__input}
                            value={formData.estimatedCompletion || ""}
                            onChange={(e) => setFormData({ ...formData, estimatedCompletion: e.target.value })}
                            required
                        />
                    </div>

                    <div className={styles.modal__field}>
                        <label className={styles.modal__label}>Koordynator *</label>
                        <input
                            type="text"
                            className={styles.modal__input}
                            value={formData.coordinator || ""}
                            onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
                            placeholder="Imię i nazwisko koordynatora"
                            required
                        />
                    </div>

                    <div className={styles.modal__field}>
                        <label className={styles.modal__label}>Zespół</label>
                        <div className={styles.modal__teamInput}>
                            <input
                                type="text"
                                className={styles.modal__input}
                                value={teamMember}
                                onChange={(e) => setTeamMember(e.target.value)}
                                placeholder="Imię i nazwisko członka zespołu"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addTeamMember();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className={styles.modal__addMember}
                                onClick={addTeamMember}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        {formData.team && formData.team.length > 0 && (
                            <div className={styles.modal__teamList}>
                                {formData.team.map((member) => (
                                    <span key={member} className={styles.modal__teamTag}>
                                        {member}
                                        <button
                                            type="button"
                                            className={styles.modal__removeMember}
                                            onClick={() => removeTeamMember(member)}
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.modal__actions}>
                        <button type="button" className={styles.modal__btnCancel} onClick={onClose}>
                            Anuluj
                        </button>
                        <button type="submit" className={styles.modal__btnSave}>
                            {project ? "Zapisz zmiany" : "Dodaj projekt"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// GŁÓWNY KOMPONENT
// ---------------------------------------------------------------------------

export default function Projects() {
    const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPillar, setSelectedPillar] = useState<ProjectPillar | "all">("all");
    const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | "all">("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // W rzeczywistej aplikacji pobieramy z kontekstu/auth
    const currentUser = MOCK_USER;
    const canManageProjects = currentUser.role === "admin" || currentUser.role === "coordinator";

    const filteredProjects = useMemo(() => {
        return projects.filter((project) => {
            const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.coordinator.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesPillar = selectedPillar === "all" || project.pillar === selectedPillar;
            const matchesStatus = selectedStatus === "all" || project.status === selectedStatus;

            return matchesSearch && matchesPillar && matchesStatus;
        });
    }, [projects, searchTerm, selectedPillar, selectedStatus]);

    const handleAddProject = () => {
        setEditingProject(null);
        setIsModalOpen(true);
    };

    const handleEditProject = (project: Project) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const handleDeleteProject = (id: string) => {
        if (window.confirm("Czy na pewno chcesz usunąć ten projekt?")) {
            setProjects(projects.filter((p) => p.id !== id));
        }
    };

    const handleSaveProject = (project: Project) => {
        const existingIndex = projects.findIndex((p) => p.id === project.id);
        if (existingIndex >= 0) {
            const updated = [...projects];
            updated[existingIndex] = project;
            setProjects(updated);
        } else {
            setProjects([project, ...projects]);
        }
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedPillar("all");
        setSelectedStatus("all");
    };

    const getPillarCount = (pillar: ProjectPillar) => {
        return projects.filter((p) => p.pillar === pillar).length;
    };

    // const getStatusCount = (status: ProjectStatus) => {
    //     return projects.filter((p) => p.status === status).length;
    // };

    return (
        <div className={styles.projects}>
            {/* Nagłówek */}
            <div className={styles.header}>
                <div className={styles.header__left}>
                    <h1 className={styles.header__title}>Aktualne projekty</h1>
                    <p className={styles.header__subtitle}>
                        Przeglądaj wszystkie projekty realizowane w organizacji.
                        {canManageProjects && " Koordynatorzy mogą zarządzać projektami swojego zespołu."}
                    </p>
                </div>
                {canManageProjects && (
                    <button className={styles.header__addBtn} onClick={handleAddProject}>
                        <Plus size={18} />
                        Dodaj projekt
                    </button>
                )}
            </div>

            {/* Statystyki */}
            <div className={styles.stats}>
                <div className={styles.stats__item}>
                    <span className={styles.stats__number}>{projects.length}</span>
                    <span className={styles.stats__label}>Wszystkie projekty</span>
                </div>
                {Object.entries(PILLAR_LABELS).map(([key, label]) => (
                    <div key={key} className={styles.stats__item}>
                        <span className={styles.stats__number}>{getPillarCount(key as ProjectPillar)}</span>
                        <span className={styles.stats__label}>{label}</span>
                    </div>
                ))}
            </div>

            {/* Filtry */}
            <div className={styles.filters}>
                <div className={styles.filters__search}>
                    <Search size={18} className={styles.filters__searchIcon} />
                    <input
                        type="text"
                        className={styles.filters__searchInput}
                        placeholder="Szukaj projektu, koordynatora..."
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
                        value={selectedPillar}
                        onChange={(e) => setSelectedPillar(e.target.value as ProjectPillar | "all")}
                    >
                        <option value="all">Wszystkie filary</option>
                        {Object.entries(PILLAR_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>

                    <select
                        className={styles.filters__select}
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as ProjectStatus | "all")}
                    >
                        <option value="all">Wszystkie statusy</option>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>

                    {(selectedPillar !== "all" || selectedStatus !== "all" || searchTerm) && (
                        <button className={styles.filters__reset} onClick={clearFilters}>
                            Wyczyść filtry
                        </button>
                    )}
                </div>
            </div>

            {/* Lista projektów */}
            <div className={styles.projectsGrid}>
                {filteredProjects.length === 0 ? (
                    <div className={styles.emptyState}>
                        <AlertCircle size={48} className={styles.emptyState__icon} />
                        <h3 className={styles.emptyState__title}>Brak projektów</h3>
                        <p className={styles.emptyState__description}>
                            {searchTerm || selectedPillar !== "all" || selectedStatus !== "all"
                                ? "Nie znaleziono projektów spełniających kryteria wyszukiwania."
                                : canManageProjects
                                    ? 'Nie ma jeszcze żadnych projektów. Kliknij "Dodaj projekt", aby utworzyć pierwszy.'
                                    : 'Nie ma jeszcze żadnych projektów.'}
                        </p>
                        {canManageProjects && !searchTerm && selectedPillar === "all" && selectedStatus === "all" && (
                            <button className={styles.emptyState__btn} onClick={handleAddProject}>
                                <Plus size={18} />
                                Dodaj pierwszy projekt
                            </button>
                        )}
                    </div>
                ) : (
                    filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onEdit={handleEditProject}
                            onDelete={handleDeleteProject}
                            canEdit={canManageProjects}
                        />
                    ))
                )}
            </div>

            {/* Modal */}
            <ProjectModal
                isOpen={isModalOpen}
                project={editingProject}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingProject(null);
                }}
                onSave={handleSaveProject}
            />
        </div>
    );
}