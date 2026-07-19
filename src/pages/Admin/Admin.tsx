import { useState, useMemo } from "react";
import {
    Users,
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    User,
    MapPin,
    Briefcase,
    Clock,
    CheckCircle,
    AlertCircle,
    Calendar,
    Tag,
    ChevronDown,
    ChevronRight,
    FileText,
    MessageSquare,
    TrendingUp,
    Star,
    Calendar as CalendarIcon,
    Filter,
    X,
    Download,
    Link,
    Mail,
    Phone,
    Camera,
    Shield,
    Settings,
    FolderTree,
    File,
    Projector,
    Briefcase as BriefcaseIcon,
    Activity,
    History,
    UserPlus,
    UserCheck,
    UserX,
    Award,
    BookOpen,
    Save, // <-- DODAJ TO
} from "lucide-react";
import styles from "./Admin.module.css";

// ---------------------------------------------------------------------------
// TYPY
// ---------------------------------------------------------------------------

type UserRole = "admin" | "board" | "coordinator" | "member" | "mentor";
type UserStatus = "trial" | "active" | "mentor" | "former";
type ProjectStatus = "planning" | "work" | "promotion" | "completed";
type DocumentCategory =
    | "new_member"
    | "coordinator"
    | "project_guidelines"
    | "statute"
    | "regulations"
    | "procedures";

type Permission =
    | "manage_users"
    | "manage_projects"
    | "approve_leaves"
    | "add_documents"
    | "manage_structure"
    | "manage_social_media"
    | "view_member_data"
    | "manage_roles";

// ---------------------------------------------------------------------------
// INTERFEJSY
// ---------------------------------------------------------------------------

interface AdminUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    province: string;
    role: UserRole;
    team: string;
    status: UserStatus;
    joinDate: string;
    active: boolean;
    permissions?: Permission[];
}

interface Role {
    id: string;
    name: UserRole;
    label: string;
    permissions: Permission[];
    description: string;
}

interface Team {
    id: string;
    name: string;
    description: string;
    parent?: string;
    members: string[];
    lead?: string;
}

interface Document {
    id: string;
    title: string;
    category: DocumentCategory;
    description: string;
    url: string;
    visibility: "all" | "coordinator" | "admin";
    createdAt: string;
    updatedAt: string;
    author: string;
}

interface Project {
    id: string;
    name: string;
    description: string;
    pillar: string;
    coordinator: string;
    team: string;
    status: ProjectStatus;
    estimatedEnd: string;
    createdAt: string;
    updatedAt?: string;
}

interface Vacancy {
    id: string;
    title: string;
    description: string;
    requirements: string;
    team: string;
    contactPerson: string;
    status: "open" | "closed";
    createdAt: string;
}

interface SystemLog {
    id: string;
    action: string;
    user: string;
    timestamp: string;
    details: string;
}

interface SystemSettings {
    organizationName: string;
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    teams: string[];
    roles: string[];
    notifications: boolean;
    integrations: string[];
}

// ---------------------------------------------------------------------------
// DANE PRZYKŁADOWE
// ---------------------------------------------------------------------------

const MOCK_ADMIN = {
    id: "1",
    name: "Jan Kowalski",
    role: "admin",
};

const MOCK_USERS: AdminUser[] = [
    {
        id: "1",
        firstName: "Maksym",
        lastName: "Marczak",
        email: "maksym.marczak@silamlodych.pl",
        province: "Mazowieckie",
        role: "admin",
        team: "Zarząd",
        status: "active",
        joinDate: "2024-01-15",
        active: true,
        permissions: ["manage_users", "manage_projects", "approve_leaves", "add_documents", "manage_structure", "manage_social_media", "view_member_data", "manage_roles"],
    },
    {
        id: "2",
        firstName: "Krzysztof",
        lastName: "Korbut",
        email: "krzysztof.korbut@silamlodych.pl",
        province: "Małopolskie",
        role: "board",
        team: "Zarząd",
        status: "active",
        joinDate: "2024-02-01",
        active: true,
        permissions: ["manage_projects", "approve_leaves", "view_member_data"],
    },
    {
        id: "3",
        firstName: "Zosia",
        lastName: "Wartacz",
        email: "zosia.wartacz@silamlodych.pl",
        province: "Pomorskie",
        role: "coordinator",
        team: "Filar Projektowy",
        status: "active",
        joinDate: "2024-03-15",
        active: true,
        permissions: ["manage_projects", "view_member_data"],
    },
    {
        id: "4",
        firstName: "Adrian",
        lastName: "Wróblewski",
        email: "adrian.wroblewski@silamlodych.pl",
        province: "Dolnośląskie",
        role: "member",
        team: "Filar Konferencji i Debat",
        status: "trial",
        joinDate: "2025-06-01",
        active: true,
        permissions: [],
    },
    {
        id: "5",
        firstName: "Jan",
        lastName: "Augustynak",
        email: "jan.augustynak@silamlodych.pl",
        province: "Łódzkie",
        role: "mentor",
        team: "Filar Rzeczniczy",
        status: "mentor",
        joinDate: "2023-11-01",
        active: true,
        permissions: ["view_member_data"],
    },
];

const MOCK_ROLES: Role[] = [
    {
        id: "admin",
        name: "admin",
        label: "Administrator główny",
        description: "Pełny dostęp do systemu",
        permissions: ["manage_users", "manage_projects", "approve_leaves", "add_documents", "manage_structure", "manage_social_media", "view_member_data", "manage_roles"],
    },
    {
        id: "board",
        name: "board",
        label: "Zarząd",
        description: "Zarządzanie projektami i strukturami",
        permissions: ["manage_projects", "approve_leaves", "manage_structure", "view_member_data"],
    },
    {
        id: "coordinator",
        name: "coordinator",
        label: "Koordynator",
        description: "Zarządzanie projektami i zespołami",
        permissions: ["manage_projects", "view_member_data"],
    },
    {
        id: "member",
        name: "member",
        label: "Członek",
        description: "Podstawowy dostęp",
        permissions: [],
    },
    {
        id: "mentor",
        name: "mentor",
        label: "Mentor",
        description: "Dostęp do danych członków",
        permissions: ["view_member_data"],
    },
];

const MOCK_TEAMS: Team[] = [
    {
        id: "board",
        name: "Zarząd",
        description: "Najwyższy organ zarządzający",
        members: ["1", "2"],
    },
    {
        id: "project",
        name: "Filar Projektowy",
        description: "Tworzenie i prowadzenie projektów",
        parent: "pillars",
        members: ["3"],
    },
    {
        id: "conference",
        name: "Filar Konferencji i Debat",
        description: "Organizacja debat i wydarzeń",
        parent: "pillars",
        members: ["4"],
    },
    {
        id: "advocacy",
        name: "Filar Rzeczniczy",
        description: "Komunikacja i reprezentowanie organizacji",
        parent: "pillars",
        members: ["5"],
    },
    {
        id: "simulation",
        name: "Filar Symulacyjny",
        description: "Symulacje edukacyjne",
        parent: "pillars",
        members: [],
    },
    {
        id: "social-media",
        name: "Social Media",
        description: "Zarządzanie mediami społecznościowymi",
        members: [],
    },
    {
        id: "court",
        name: "Sąd Koleżeński",
        description: "Rozwiązywanie sporów",
        members: [],
    },
    {
        id: "audit",
        name: "Komisja Rewizyjna",
        description: "Kontrola działalności organizacji",
        members: [],
    },
];

const MOCK_DOCUMENTS: Document[] = [
    {
        id: "1",
        title: "Poradnik nowych członków",
        category: "new_member",
        description: "Kompleksowy przewodnik dla nowych członków",
        url: "#",
        visibility: "all",
        createdAt: "2026-01-15",
        updatedAt: "2026-07-15",
        author: "Maksym Marczak",
    },
    {
        id: "2",
        title: "Poradnik koordynatorów",
        category: "coordinator",
        description: "Materiał dla koordynatorów",
        url: "#",
        visibility: "coordinator",
        createdAt: "2026-02-01",
        updatedAt: "2026-07-12",
        author: "Zarząd",
    },
    {
        id: "3",
        title: "Wytyczne projektowe",
        category: "project_guidelines",
        description: "Zasady tworzenia projektów",
        url: "#",
        visibility: "all",
        createdAt: "2026-03-15",
        updatedAt: "2026-07-10",
        author: "Dział Projektów",
    },
];

const MOCK_PROJECTS: Project[] = [
    {
        id: "1",
        name: "Letnia Akademia Liderów",
        description: "Szkolenia dla młodych liderów",
        pillar: "Filar Projektowy",
        coordinator: "Zosia Wartacz",
        team: "Filar Projektowy",
        status: "work",
        estimatedEnd: "2026-09-30",
        createdAt: "2026-06-01",
    },
    {
        id: "2",
        name: "Debata Młodych 2026",
        description: "Ogólnopolska debata młodzieżowa",
        pillar: "Filar Konferencji i Debat",
        coordinator: "Adrian Wróblewski",
        team: "Filar Konferencji i Debat",
        status: "planning",
        estimatedEnd: "2026-11-15",
        createdAt: "2026-07-01",
    },
];

const MOCK_VACANCIES: Vacancy[] = [
    {
        id: "1",
        title: "Koordynator Filaru Symulacyjnego",
        description: "Zarządzanie filarem symulacyjnym",
        requirements: "Doświadczenie w prowadzeniu symulacji",
        team: "Filar Symulacyjny",
        contactPerson: "Maksym Marczak",
        status: "open",
        createdAt: "2026-07-01",
    },
    {
        id: "2",
        title: "Social Media Manager",
        description: "Zarządzanie mediami społecznościowymi",
        requirements: "Znajomość Instagrama, TikToka",
        team: "Social Media",
        contactPerson: "Maja Melerska",
        status: "open",
        createdAt: "2026-07-15",
    },
];

const MOCK_LOGS: SystemLog[] = [
    {
        id: "1",
        action: "Nadano rolę koordynatora",
        user: "Maksym Marczak",
        timestamp: "2026-07-15T10:30:00",
        details: "Użytkownik Zosia Wartacz otrzymał rolę koordynatora",
    },
    {
        id: "2",
        action: "Dodano nowy projekt",
        user: "Maksym Marczak",
        timestamp: "2026-07-01T09:00:00",
        details: "Utworzono projekt 'Debata Młodych 2026'",
    },
    {
        id: "3",
        action: "Zmieniono status projektu",
        user: "Zosia Wartacz",
        timestamp: "2026-06-15T14:20:00",
        details: "Status projektu 'Letnia Akademia Liderów' zmieniony na 'Faza pracy'",
    },
];

const MOCK_SETTINGS: SystemSettings = {
    organizationName: "Stowarzyszenie Siła Młodych",
    primaryColor: "#7c3aed",
    secondaryColor: "#6d28d9",
    teams: ["Zarząd", "Filar Projektowy", "Filar Konferencji i Debat", "Filar Rzeczniczy", "Filar Symulacyjny", "Social Media", "Sąd Koleżeński", "Komisja Rewizyjna"],
    roles: ["admin", "board", "coordinator", "member", "mentor"],
    notifications: true,
    integrations: ["Google Calendar", "Slack"],
};

// ---------------------------------------------------------------------------
// MAPOWANIA
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<UserRole, string> = {
    admin: "Administrator główny",
    board: "Zarząd",
    coordinator: "Koordynator",
    member: "Członek",
    mentor: "Mentor",
};

const STATUS_LABELS: Record<UserStatus, string> = {
    trial: "Okres próbny",
    active: "Aktywny członek",
    mentor: "Mentor",
    former: "Były członek",
};

const STATUS_COLORS: Record<UserStatus, string> = {
    trial: styles.statusTrial,
    active: styles.statusActive,
    mentor: styles.statusMentor,
    former: styles.statusFormer,
};

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    planning: "Faza planowania",
    work: "Faza pracy",
    promotion: "Faza promocji",
    completed: "Zakończony",
};

const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
    planning: styles.projectStatusPlanning,
    work: styles.projectStatusWork,
    promotion: styles.projectStatusPromotion,
    completed: styles.projectStatusCompleted,
};

const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
    new_member: "Poradnik nowych członków",
    coordinator: "Poradnik koordynatorów",
    project_guidelines: "Wytyczne projektowe",
    statute: "Statut",
    regulations: "Regulamin",
    procedures: "Procedury organizacyjne",
};

const PERMISSION_LABELS: Record<Permission, string> = {
    manage_users: "Zarządzanie użytkownikami",
    manage_projects: "Zarządzanie projektami",
    approve_leaves: "Akceptowanie urlopów",
    add_documents: "Dodawanie dokumentów",
    manage_structure: "Zarządzanie strukturą",
    manage_social_media: "Zarządzanie social mediami",
    view_member_data: "Dostęp do danych członków",
    manage_roles: "Zarządzanie rolami",
};

// ---------------------------------------------------------------------------
// KOMPONENTY
// ---------------------------------------------------------------------------

function UsersManagement({ users, canManage }: { users: AdminUser[]; canManage: boolean }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all");
    const [selectedStatus, setSelectedStatus] = useState<UserStatus | "all">("all");

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesSearch =
                (user.firstName + " " + user.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.team.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = selectedRole === "all" || user.role === selectedRole;
            const matchesStatus = selectedStatus === "all" || user.status === selectedStatus;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, selectedRole, selectedStatus]);

    return (
        <section className={styles.section}>
            <div className={styles.section__header}>
                <div className={styles.section__headerLeft}>
                    <h2 className={styles.section__title}>Zarządzanie użytkownikami</h2>
                    <p className={styles.section__subtitle}>
                        Zarządzanie członkami Stowarzyszenia Siła Młodych.
                    </p>
                </div>
                {canManage && (
                    <button className={styles.section__addBtn}>
                        <Plus size={18} />
                        Dodaj użytkownika
                    </button>
                )}
            </div>

            <div className={styles.section__filters}>
                <div className={styles.section__search}>
                    <Search size={18} className={styles.section__searchIcon} />
                    <input
                        type="text"
                        className={styles.section__searchInput}
                        placeholder="Szukaj po imieniu, nazwisku, email, zespole..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className={styles.section__select}
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole | "all")}
                >
                    <option value="all">Wszystkie role</option>
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <select
                    className={styles.section__select}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as UserStatus | "all")}
                >
                    <option value="all">Wszystkie statusy</option>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>

            <div className={styles.usersGrid}>
                {filteredUsers.map((user) => (
                    <div key={user.id} className={styles.userCard}>
                        <div className={styles.userCard__header}>
                            <div className={styles.userCard__avatar}>
                                {user.firstName[0] + user.lastName[0]}
                            </div>
                            <div className={styles.userCard__info}>
                                <h3 className={styles.userCard__name}>
                                    {user.firstName} {user.lastName}
                                </h3>
                                <span className={styles.userCard__email}>
                                    <Mail size={14} />
                                    {user.email}
                                </span>
                            </div>
                            <div className={styles.userCard__status}>
                                <span className={`${styles.userCard__statusBadge} ${STATUS_COLORS[user.status]}`}>
                                    {STATUS_LABELS[user.status]}
                                </span>
                            </div>
                        </div>
                        <div className={styles.userCard__body}>
                            <div className={styles.userCard__details}>
                                <span>
                                    <MapPin size={14} />
                                    {user.province}
                                </span>
                                <span>
                                    <Briefcase size={14} />
                                    {user.team}
                                </span>
                                <span>
                                    <Shield size={14} />
                                    {ROLE_LABELS[user.role]}
                                </span>
                            </div>
                            <div className={styles.userCard__permissions}>
                                {user.permissions && user.permissions.length > 0 ? (
                                    user.permissions.slice(0, 3).map((p) => (
                                        <span key={p} className={styles.userCard__permissionTag}>
                                            {PERMISSION_LABELS[p]}
                                        </span>
                                    ))
                                ) : (
                                    <span className={styles.userCard__noPermissions}>Brak uprawnień</span>
                                )}
                                {user.permissions && user.permissions.length > 3 && (
                                    <span className={styles.userCard__permissionMore}>
                                        +{user.permissions.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                        {canManage && (
                            <div className={styles.userCard__actions}>
                                <button className={styles.userCard__actionBtn} title="Edytuj">
                                    <Edit size={16} />
                                </button>
                                <button className={styles.userCard__actionBtn} title="Podgląd">
                                    <Eye size={16} />
                                </button>
                                <button className={`${styles.userCard__actionBtn} ${user.active ? styles.userCard__actionBtnDanger : styles.userCard__actionBtnSuccess}`} title={user.active ? "Dezaktywuj" : "Aktywuj"}>
                                    {user.active ? <UserX size={16} /> : <UserCheck size={16} />}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

function RolesManagement({ roles, canManage }: { roles: Role[]; canManage: boolean }) {
    const [expandedRole, setExpandedRole] = useState<string | null>(null);

    return (
        <section className={styles.section}>
            <div className={styles.section__header}>
                <div className={styles.section__headerLeft}>
                    <h2 className={styles.section__title}>Role i uprawnienia</h2>
                    <p className={styles.section__subtitle}>
                        Zarządzanie dostępami i uprawnieniami użytkowników.
                    </p>
                </div>
                {canManage && (
                    <button className={styles.section__addBtn}>
                        <Plus size={18} />
                        Dodaj rolę
                    </button>
                )}
            </div>

            <div className={styles.rolesGrid}>
                {roles.map((role) => (
                    <div key={role.id} className={styles.roleCard}>
                        <div className={styles.roleCard__header}>
                            <div className={styles.roleCard__icon}>
                                <Shield size={24} />
                            </div>
                            <div className={styles.roleCard__info}>
                                <h3 className={styles.roleCard__name}>{role.label}</h3>
                                <p className={styles.roleCard__description}>{role.description}</p>
                            </div>
                            <button
                                className={styles.roleCard__expandBtn}
                                onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                            >
                                {expandedRole === role.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                        </div>
                        {expandedRole === role.id && (
                            <div className={styles.roleCard__body}>
                                <h4 className={styles.roleCard__permissionsTitle}>Uprawnienia:</h4>
                                <div className={styles.roleCard__permissions}>
                                    {role.permissions.length > 0 ? (
                                        role.permissions.map((p) => (
                                            <span key={p} className={styles.roleCard__permission}>
                                                <CheckCircle size={14} />
                                                {PERMISSION_LABELS[p]}
                                            </span>
                                        ))
                                    ) : (
                                        <span className={styles.roleCard__noPermissions}>Brak uprawnień</span>
                                    )}
                                </div>
                                {canManage && (
                                    <div className={styles.roleCard__actions}>
                                        <button className={styles.roleCard__actionBtn}>
                                            <Edit size={16} />
                                            Edytuj
                                        </button>
                                        <button className={`${styles.roleCard__actionBtn} ${styles.roleCard__actionBtnDanger}`}>
                                            <Trash2 size={16} />
                                            Usuń
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

function StructureManagement({ teams, canManage }: { teams: Team[]; canManage: boolean }) {
    return (
        <section className={styles.section}>
            <div className={styles.section__header}>
                <div className={styles.section__headerLeft}>
                    <h2 className={styles.section__title}>Struktura organizacji</h2>
                    <p className={styles.section__subtitle}>
                        Zarządzanie zespołami i strukturą organizacyjną.
                    </p>
                </div>
                {canManage && (
                    <button className={styles.section__addBtn}>
                        <Plus size={18} />
                        Dodaj zespół
                    </button>
                )}
            </div>

            <div className={styles.structure}>
                <div className={styles.structure__root}>
                    <div className={styles.structure__node}>
                        <div className={styles.structure__nodeContent}>
                            <h3 className={styles.structure__nodeTitle}>Siła Młodych</h3>
                            <span className={styles.structure__nodeCount}>{teams.length} zespołów</span>
                        </div>
                    </div>
                    <div className={styles.structure__children}>
                        {teams.map((team) => (
                            <div key={team.id} className={styles.structure__node}>
                                <div className={styles.structure__nodeContent}>
                                    <h4 className={styles.structure__nodeName}>{team.name}</h4>
                                    <p className={styles.structure__nodeDescription}>{team.description}</p>
                                    <div className={styles.structure__nodeMeta}>
                                        <span>{team.members.length} członków</span>
                                        {team.lead && <span>Lider: {team.lead}</span>}
                                    </div>
                                </div>
                                {canManage && (
                                    <div className={styles.structure__nodeActions}>
                                        <button className={styles.structure__nodeBtn} title="Edytuj">
                                            <Edit size={14} />
                                        </button>
                                        <button className={`${styles.structure__nodeBtn} ${styles.structure__nodeBtnDanger}`} title="Usuń">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function DocumentsManagement({ documents, canManage }: { documents: Document[]; canManage: boolean }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | "all">("all");

    const filteredDocuments = useMemo(() => {
        return documents.filter((doc) => {
            const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [documents, searchTerm, selectedCategory]);

    return (
        <section className={styles.section}>
            <div className={styles.section__header}>
                <div className={styles.section__headerLeft}>
                    <h2 className={styles.section__title}>Zarządzanie dokumentami</h2>
                    <p className={styles.section__subtitle}>
                        Administracja materiałami dostępnymi w zakładce "Poradniki".
                    </p>
                </div>
                {canManage && (
                    <button className={styles.section__addBtn}>
                        <Plus size={18} />
                        Dodaj dokument
                    </button>
                )}
            </div>

            <div className={styles.section__filters}>
                <div className={styles.section__search}>
                    <Search size={18} className={styles.section__searchIcon} />
                    <input
                        type="text"
                        className={styles.section__searchInput}
                        placeholder="Szukaj po tytule..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className={styles.section__select}
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory | "all")}
                >
                    <option value="all">Wszystkie kategorie</option>
                    {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
            </div>

            <div className={styles.documentsGrid}>
                {filteredDocuments.map((doc) => (
                    <div key={doc.id} className={styles.documentCard}>
                        <div className={styles.documentCard__header}>
                            <h3 className={styles.documentCard__title}>{doc.title}</h3>
                            <span className={`${styles.documentCard__visibility} ${doc.visibility === "all" ? styles.visibilityAll :
                                doc.visibility === "coordinator" ? styles.visibilityCoordinator :
                                    styles.visibilityAdmin
                                }`}>
                                {doc.visibility === "all" ? "Dla wszystkich" :
                                    doc.visibility === "coordinator" ? "Dla koordynatorów" :
                                        "Dla admina"}
                            </span>
                        </div>
                        <div className={styles.documentCard__body}>
                            <p className={styles.documentCard__description}>{doc.description}</p>
                            <div className={styles.documentCard__meta}>
                                <span>
                                    <Tag size={14} />
                                    {DOCUMENT_CATEGORY_LABELS[doc.category]}
                                </span>
                                <span>
                                    <User size={14} />
                                    {doc.author}
                                </span>
                                <span>
                                    <Calendar size={14} />
                                    {new Date(doc.updatedAt).toLocaleDateString("pl-PL")}
                                </span>
                            </div>
                        </div>
                        {canManage && (
                            <div className={styles.documentCard__actions}>
                                <button className={styles.documentCard__actionBtn} title="Edytuj">
                                    <Edit size={16} />
                                </button>
                                <button className={styles.documentCard__actionBtn} title="Pobierz">
                                    <Download size={16} />
                                </button>
                                <button className={`${styles.documentCard__actionBtn} ${styles.documentCard__actionBtnDanger}`} title="Usuń">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

function ProjectsManagement({ projects, canManage }: { projects: Project[]; canManage: boolean }) {
    return (
        <section className={styles.section}>
            <div className={styles.section__header}>
                <div className={styles.section__headerLeft}>
                    <h2 className={styles.section__title}>Zarządzanie projektami</h2>
                    <p className={styles.section__subtitle}>
                        Panel kontroli projektów organizacji.
                    </p>
                </div>
                {canManage && (
                    <button className={styles.section__addBtn}>
                        <Plus size={18} />
                        Dodaj projekt
                    </button>
                )}
            </div>

            <div className={styles.projectsGrid}>
                {projects.map((project) => (
                    <div key={project.id} className={styles.projectCard}>
                        <div className={styles.projectCard__header}>
                            <h3 className={styles.projectCard__title}>{project.name}</h3>
                            <span className={`${styles.projectCard__status} ${PROJECT_STATUS_COLORS[project.status]}`}>
                                {PROJECT_STATUS_LABELS[project.status]}
                            </span>
                        </div>
                        <div className={styles.projectCard__body}>
                            <p className={styles.projectCard__description}>{project.description}</p>
                            <div className={styles.projectCard__meta}>
                                <span>
                                    <BriefcaseIcon size={14} />
                                    {project.pillar}
                                </span>
                                <span>
                                    <User size={14} />
                                    {project.coordinator}
                                </span>
                                <span>
                                    <Users size={14} />
                                    {project.team}
                                </span>
                                <span>
                                    <Calendar size={14} />
                                    {new Date(project.estimatedEnd).toLocaleDateString("pl-PL")}
                                </span>
                            </div>
                        </div>
                        {canManage && (
                            <div className={styles.projectCard__actions}>
                                <button className={styles.projectCard__actionBtn} title="Edytuj">
                                    <Edit size={16} />
                                </button>
                                <button className={styles.projectCard__actionBtn} title="Podgląd">
                                    <Eye size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

function VacanciesManagement({ vacancies, canManage }: { vacancies: Vacancy[]; canManage: boolean }) {
    return (
        <section className={styles.section}>
            <div className={styles.section__header}>
                <div className={styles.section__headerLeft}>
                    <h2 className={styles.section__title}>Zarządzanie wakatami</h2>
                    <p className={styles.section__subtitle}>
                        Dodawanie i edycja wolnych stanowisk.
                    </p>
                </div>
                {canManage && (
                    <button className={styles.section__addBtn}>
                        <Plus size={18} />
                        Dodaj wakat
                    </button>
                )}
            </div>

            <div className={styles.vacanciesGrid}>
                {vacancies.map((vacancy) => (
                    <div key={vacancy.id} className={styles.vacancyCard}>
                        <div className={styles.vacancyCard__header}>
                            <h3 className={styles.vacancyCard__title}>{vacancy.title}</h3>
                            <span className={`${styles.vacancyCard__status} ${vacancy.status === "open" ? styles.vacancyOpen : styles.vacancyClosed
                                }`}>
                                {vacancy.status === "open" ? "Otwarty" : "Zamknięty"}
                            </span>
                        </div>
                        <div className={styles.vacancyCard__body}>
                            <p className={styles.vacancyCard__description}>{vacancy.description}</p>
                            <div className={styles.vacancyCard__requirements}>
                                <strong>Wymagania:</strong> {vacancy.requirements}
                            </div>
                            <div className={styles.vacancyCard__meta}>
                                <span>
                                    <Briefcase size={14} />
                                    {vacancy.team}
                                </span>
                                <span>
                                    <User size={14} />
                                    Kontakt: {vacancy.contactPerson}
                                </span>
                            </div>
                        </div>
                        {canManage && (
                            <div className={styles.vacancyCard__actions}>
                                <button className={styles.vacancyCard__actionBtn} title="Edytuj">
                                    <Edit size={16} />
                                </button>
                                <button className={`${styles.vacancyCard__actionBtn} ${vacancy.status === "open" ? styles.vacancyCard__actionBtnDanger : styles.vacancyCard__actionBtnSuccess
                                    }`} title={vacancy.status === "open" ? "Zamknij" : "Otwórz"}>
                                    {vacancy.status === "open" ? <X size={16} /> : <CheckCircle size={16} />}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

function ActivityMonitoring({ users, projects, leaves }: { users: AdminUser[]; projects: Project[]; leaves: any[] }) {
    const activeUsers = users.filter(u => u.active).length;
    const activeProjects = projects.filter(p => p.status !== "completed").length;

    return (
        <section className={styles.section}>
            <div className={styles.section__header}>
                <div className={styles.section__headerLeft}>
                    <h2 className={styles.section__title}>Monitorowanie aktywności</h2>
                    <p className={styles.section__subtitle}>
                        Statystyki organizacji.
                    </p>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statCard__icon} style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                        <Users size={24} />
                    </div>
                    <div className={styles.statCard__content}>
                        <span className={styles.statCard__value}>{activeUsers}</span>
                        <span className={styles.statCard__label}>Aktywnych członków</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statCard__icon} style={{ background: "#d1fae5", color: "#059669" }}>
                        <FolderTree size={24} />
                    </div>
                    <div className={styles.statCard__content}>
                        <span className={styles.statCard__value}>{users.length}</span>
                        <span className={styles.statCard__label}>Zespołów</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statCard__icon} style={{ background: "#fef3c7", color: "#d97706" }}>
                        <Projector size={24} />
                    </div>
                    <div className={styles.statCard__content}>
                        <span className={styles.statCard__value}>{activeProjects}</span>
                        <span className={styles.statCard__label}>Aktywnych projektów</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statCard__icon} style={{ background: "#fce4ec", color: "#dc2626" }}>
                        <Clock size={24} />
                    </div>
                    <div className={styles.statCard__content}>
                        <span className={styles.statCard__value}>3</span>
                        <span className={styles.statCard__label}>Oczekujących wniosków</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

function SystemLogs({ logs }: { logs: SystemLog[] }) {
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    return (
        <section className={styles.section}>
            <div className={styles.section__header}>
                <div className={styles.section__headerLeft}>
                    <h2 className={styles.section__title}>Logi systemowe</h2>
                    <p className={styles.section__subtitle}>
                        Historia działań administracyjnych.
                    </p>
                </div>
            </div>

            <div className={styles.logsList}>
                {logs.map((log) => (
                    <div key={log.id} className={styles.logItem}>
                        <div className={styles.logItem__header}>
                            <div className={styles.logItem__info}>
                                <span className={styles.logItem__action}>{log.action}</span>
                                <span className={styles.logItem__user}>
                                    <User size={14} />
                                    {log.user}
                                </span>
                                <span className={styles.logItem__time}>
                                    <Clock size={14} />
                                    {new Date(log.timestamp).toLocaleString("pl-PL")}
                                </span>
                            </div>
                            <button
                                className={styles.logItem__expandBtn}
                                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                            >
                                {expandedLog === log.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                        </div>
                        {expandedLog === log.id && (
                            <div className={styles.logItem__details}>
                                <p>{log.details}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

function SystemSettingsPanel({ settings, canManage }: { settings: SystemSettings; canManage: boolean }) {
    return (
        <section className={styles.section}>
            <div className={styles.section__header}>
                <div className={styles.section__headerLeft}>
                    <h2 className={styles.section__title}>Ustawienia systemu</h2>
                    <p className={styles.section__subtitle}>
                        Konfiguracja aplikacji.
                    </p>
                </div>
                {canManage && (
                    <button className={styles.section__addBtn}>
                        <Save size={18} />
                        Zapisz zmiany
                    </button>
                )}
            </div>

            <div className={styles.settingsGrid}>
                <div className={styles.settingCard}>
                    <label className={styles.settingCard__label}>Nazwa organizacji</label>
                    <input
                        type="text"
                        className={styles.settingCard__input}
                        value={settings.organizationName}
                        disabled={!canManage}
                    />
                </div>
                <div className={styles.settingCard}>
                    <label className={styles.settingCard__label}>Kolor główny</label>
                    <div className={styles.settingCard__colorInput}>
                        <input
                            type="color"
                            className={styles.settingCard__colorPicker}
                            value={settings.primaryColor}
                            disabled={!canManage}
                        />
                        <input
                            type="text"
                            className={styles.settingCard__input}
                            value={settings.primaryColor}
                            disabled={!canManage}
                        />
                    </div>
                </div>
                <div className={styles.settingCard}>
                    <label className={styles.settingCard__label}>Powiadomienia</label>
                    <div className={styles.settingCard__toggle}>
                        <input
                            type="checkbox"
                            checked={settings.notifications}
                            disabled={!canManage}
                        />
                        <span>Włączone</span>
                    </div>
                </div>
                <div className={styles.settingCard}>
                    <label className={styles.settingCard__label}>Integracje</label>
                    <div className={styles.settingCard__tags}>
                        {settings.integrations.map((integration) => (
                            <span key={integration} className={styles.settingCard__tag}>
                                {integration}
                            </span>
                        ))}
                        {canManage && (
                            <button className={styles.settingCard__addTag}>
                                <Plus size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// GŁÓWNY KOMPONENT
// ---------------------------------------------------------------------------

export default function Admin({ title }: { title?: string }) {
    const currentUser = MOCK_ADMIN;
    const canManage = currentUser.role === "admin";

    return (
        <div className={styles.admin}>
            <div className={styles.header}>
                <div className={styles.header__left}>
                    <h1 className={styles.header__title}>
                        {title ?? "Administracja systemu"}
                    </h1>
                    <p className={styles.header__subtitle}>
                        Panel zarządzania organizacją, użytkownikami, uprawnieniami oraz konfiguracją systemu Stowarzyszenia Siła Młodych.
                    </p>
                </div>
            </div>

            <UsersManagement users={MOCK_USERS} canManage={canManage} />
            <RolesManagement roles={MOCK_ROLES} canManage={canManage} />
            <StructureManagement teams={MOCK_TEAMS} canManage={canManage} />
            <DocumentsManagement documents={MOCK_DOCUMENTS} canManage={canManage} />
            <ProjectsManagement projects={MOCK_PROJECTS} canManage={canManage} />
            <VacanciesManagement vacancies={MOCK_VACANCIES} canManage={canManage} />
            <ActivityMonitoring users={MOCK_USERS} projects={MOCK_PROJECTS} leaves={[]} />
            <SystemLogs logs={MOCK_LOGS} />
            <SystemSettingsPanel settings={MOCK_SETTINGS} canManage={canManage} />
        </div>
    );
}