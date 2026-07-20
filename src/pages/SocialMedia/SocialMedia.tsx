import { FaInstagram, FaTiktok, FaFacebook, FaYoutube } from "react-icons/fa";
import { useState, useMemo } from "react";
import {
    Users,
    Search,
    Plus,
    User,
    MapPin,
    Briefcase,
    Clock,
    AlertCircle,
    Calendar,
    Tag,
    Image as ImageIcon,
    Video as VideoIcon,
    FileText,
    Star,
    Mail,
    Phone,
    Camera,
} from "lucide-react";
import styles from "./SocialMedia.module.css";

// ---------------------------------------------------------------------------
// TYPY
// ---------------------------------------------------------------------------

type SocialRole =
    | "instagram"
    | "tiktok"
    | "manager"
    | "graphic"
    | "editor"
    | "photographer"
    | "content_creator";

type Platform = "instagram" | "tiktok" | "facebook" | "youtube";
type ContentType = "reel" | "post" | "story" | "graphic" | "video";
type PublicationStatus =
    | "idea"
    | "preparation"
    | "editing"
    | "approval"
    | "scheduled"
    | "published";
type TaskStatus = "pending" | "in_progress" | "done";
type MaterialStage =
    | "ideas"
    | "recording"
    | "editing"
    | "approval"
    | "ready";

// ---------------------------------------------------------------------------
// INTERFEJSY
// ---------------------------------------------------------------------------

interface TeamMember {
    id: string;
    firstName: string;
    lastName: string;
    role: SocialRole;
    avatar?: string;
    email: string;
    phone?: string;
    province: string;
    team: string;
    joinDate: string;
    active: boolean;
}

interface ContentCreator {
    id: string;
    firstName: string;
    lastName: string;
    province: string;
    team: string;
    availability: string;
    experience: "none" | "beginner" | "intermediate" | "advanced";
    topics: string[];
    email: string;
    phone?: string;
    active: boolean;
}

interface Publication {
    id: string;
    title: string;
    platform: Platform;
    type: ContentType;
    responsible: string;
    dueDate: string;
    status: PublicationStatus;
    description?: string;
    createdAt: string;
    updatedAt?: string;
}

interface Material {
    id: string;
    name: string;
    description: string;
    responsible: string;
    deadline: string;
    priority: "low" | "medium" | "high";
    stage: MaterialStage;
    createdAt: string;
}

interface Task {
    id: string;
    name: string;
    responsible: string;
    deadline: string;
    status: TaskStatus;
    description?: string;
    createdAt: string;
}

interface MediaContact {
    id: string;
    name: string;
    channel: string;
    responsible: string;
    email?: string;
    phone?: string;
    notes?: string;
    createdAt: string;
}

// ---------------------------------------------------------------------------
// DANE PRZYKŁADOWE
// ---------------------------------------------------------------------------

const MOCK_USER = {
    id: "1",
    name: "Jan Kowalski",
    role: "admin",
    team: "Zarząd",
};

const MOCK_TEAM_MEMBERS: TeamMember[] = [
    {
        id: "1",
        firstName: "Maja",
        lastName: "Melerska",
        role: "manager",
        email: "maja.melerska@silamlodych.pl",
        province: "Mazowieckie",
        team: "Social Media",
        joinDate: "2024-05-15",
        active: true,
    },
    {
        id: "2",
        firstName: "Maja",
        lastName: "Kądziela",
        role: "tiktok",
        email: "maja.kadziela@silamlodych.pl",
        province: "Pomorskie",
        team: "Social Media",
        joinDate: "2024-06-01",
        active: true,
    },
    {
        id: "3",
        firstName: "Anna",
        lastName: "Nowak",
        role: "instagram",
        email: "anna.nowak@silamlodych.pl",
        province: "Mazowieckie",
        team: "Social Media",
        joinDate: "2024-07-01",
        active: true,
    },
    {
        id: "4",
        firstName: "Piotr",
        lastName: "Kowalski",
        role: "graphic",
        email: "piotr.kowalski@silamlodych.pl",
        province: "Małopolskie",
        team: "Social Media",
        joinDate: "2024-07-15",
        active: true,
    },
    {
        id: "5",
        firstName: "Katarzyna",
        lastName: "Wiśniewska",
        role: "editor",
        email: "katarzyna.wisniewska@silamlodych.pl",
        province: "Dolnośląskie",
        team: "Social Media",
        joinDate: "2024-08-01",
        active: true,
    },
    {
        id: "6",
        firstName: "Tomasz",
        lastName: "Lewandowski",
        role: "photographer",
        email: "tomasz.lewandowski@silamlodych.pl",
        province: "Pomorskie",
        team: "Social Media",
        joinDate: "2024-08-15",
        active: false,
    },
    {
        id: "7",
        firstName: "Agnieszka",
        lastName: "Dąbrowska",
        role: "content_creator",
        email: "agnieszka.dabrowska@silamlodych.pl",
        province: "Łódzkie",
        team: "Social Media",
        joinDate: "2024-09-01",
        active: true,
    },
];

const MOCK_CONTENT_CREATORS: ContentCreator[] = [
    {
        id: "1",
        firstName: "Agnieszka",
        lastName: "Dąbrowska",
        province: "Łódzkie",
        team: "Social Media",
        availability: "Weekendy, wieczory",
        experience: "intermediate",
        topics: ["Polityka", "Social media", "Edukacja"],
        email: "agnieszka.dabrowska@silamlodych.pl",
        active: true,
    },
    {
        id: "2",
        firstName: "Igor",
        lastName: "Piskórz",
        province: "Pomorskie",
        team: "Filar Symulacyjny",
        availability: "Weekendy",
        experience: "beginner",
        topics: ["Gry", "Symulacje", "Edukacja"],
        email: "igor.piskorz@silamlodych.pl",
        active: true,
    },
    {
        id: "3",
        firstName: "Maja",
        lastName: "Kądziela",
        province: "Pomorskie",
        team: "Social Media",
        availability: "Codziennie",
        experience: "advanced",
        topics: ["Social media", "Video content", "Kreatywność"],
        email: "maja.kadziela@silamlodych.pl",
        active: true,
    },
];

const MOCK_PUBLICATIONS: Publication[] = [
    {
        id: "1",
        title: "Wakacje z Siłą Młodych",
        platform: "instagram",
        type: "post",
        responsible: "Maja Melerska",
        dueDate: "2026-08-15",
        status: "scheduled",
        description: "Post podsumowujący wakacyjne aktywności organizacji",
        createdAt: "2026-08-01T10:00:00",
    },
    {
        id: "2",
        title: "Relacja z debaty",
        platform: "tiktok",
        type: "reel",
        responsible: "Maja Kądziela",
        dueDate: "2026-08-10",
        status: "editing",
        description: "Rolka z najważniejszych momentów debaty",
        createdAt: "2026-08-05T14:30:00",
    },
    {
        id: "3",
        title: "Zapowiedź konferencji",
        platform: "facebook",
        type: "graphic",
        responsible: "Piotr Kowalski",
        dueDate: "2026-08-20",
        status: "preparation",
        description: "Grafika promująca nadchodzącą konferencję",
        createdAt: "2026-08-07T09:00:00",
    },
    {
        id: "4",
        title: "Rozmowa z prezesem",
        platform: "youtube",
        type: "video",
        responsible: "Katarzyna Wiśniewska",
        dueDate: "2026-08-25",
        status: "idea",
        description: "Wywiad z prezesem organizacji",
        createdAt: "2026-08-08T11:00:00",
    },
    {
        id: "5",
        title: "Podsumowanie projektu",
        platform: "instagram",
        type: "story",
        responsible: "Maja Melerska",
        dueDate: "2026-08-12",
        status: "published",
        description: "Relacja z zakończenia projektu",
        createdAt: "2026-08-11T08:00:00",
        updatedAt: "2026-08-12T10:00:00",
    },
];

const MOCK_MATERIALS: Material[] = [
    {
        id: "1",
        name: "Rolka z konferencji",
        description: "Nagranie z wystąpień prelegentów",
        responsible: "Maja Kądziela",
        deadline: "2026-08-15",
        priority: "high",
        stage: "editing",
        createdAt: "2026-08-01T10:00:00",
    },
    {
        id: "2",
        name: "Grafika promocyjna",
        description: "Baner na wydarzenie",
        responsible: "Piotr Kowalski",
        deadline: "2026-08-20",
        priority: "medium",
        stage: "ideas",
        createdAt: "2026-08-05T14:30:00",
    },
    {
        id: "3",
        name: "Film podsumowujący",
        description: "Montaż materiałów z wydarzeń",
        responsible: "Katarzyna Wiśniewska",
        deadline: "2026-08-30",
        priority: "low",
        stage: "recording",
        createdAt: "2026-08-07T09:00:00",
    },
];

const MOCK_TASKS: Task[] = [
    {
        id: "1",
        name: "Przygotowanie rolki z wydarzenia",
        responsible: "Maja Kądziela",
        deadline: "2026-08-10",
        status: "in_progress",
        description: "Montaż materiałów z debaty",
        createdAt: "2026-08-05T10:00:00",
    },
    {
        id: "2",
        name: "Przygotowanie grafiki",
        responsible: "Piotr Kowalski",
        deadline: "2026-08-15",
        status: "pending",
        description: "Grafika promująca konferencję",
        createdAt: "2026-08-07T14:30:00",
    },
    {
        id: "3",
        name: "Napisanie opisu publikacji",
        responsible: "Maja Melerska",
        deadline: "2026-08-12",
        status: "done",
        description: "Opis postu podsumowującego projekt",
        createdAt: "2026-08-08T09:00:00",
    },
];

const MOCK_CONTACTS: MediaContact[] = [
    {
        id: "1",
        name: "Program TVN 'Bez kitu'",
        channel: "TVN",
        responsible: "Dawid Brzeski",
        email: "dawid.brzeski@tvn.pl",
        notes: "Kontakt w sprawie współpracy medialnej",
        createdAt: "2026-07-15T10:00:00",
    },
    {
        id: "2",
        name: "Gazeta Wyborcza",
        channel: "Prasa",
        responsible: "Anna Kowalska",
        email: "anna.kowalska@wyborcza.pl",
        notes: "Kontakt w sprawie publikacji o SM",
        createdAt: "2026-07-20T14:30:00",
    },
];

// ---------------------------------------------------------------------------
// MAPOWANIA
// ---------------------------------------------------------------------------

const ROLE_ICONS: Record<SocialRole, React.ReactNode> = {
    instagram: <FaInstagram size={16} />,
    tiktok: <FaTiktok size={16} />,
    manager: <Users size={16} />,
    graphic: <ImageIcon size={16} />,
    editor: <VideoIcon size={16} />,
    photographer: <Camera size={16} />,
    content_creator: <FileText size={16} />,
};


const ROLE_LABELS: Record<SocialRole, string> = {
    instagram: "Opiekun Instagrama",
    tiktok: "Opiekun TikToka",
    manager: "Social Media Manager",
    graphic: "Grafik",
    editor: "Montażysta",
    photographer: "Fotograf",
    content_creator: "Twórca treści",
};
const PLATFORM_LABELS: Record<Platform, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    facebook: "Facebook",
    youtube: "YouTube",
};

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
    instagram: <FaInstagram size={14} />,
    tiktok: <FaTiktok size={14} />,
    facebook: <FaFacebook size={14} />,
    youtube: <FaYoutube size={14} />,
};

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
    reel: "Rolka",
    post: "Post",
    story: "Relacja",
    graphic: "Grafika",
    video: "Film",
};

const STATUS_LABELS: Record<PublicationStatus, string> = {
    idea: "Pomysł",
    preparation: "W przygotowaniu",
    editing: "W trakcie montażu",
    approval: "Do akceptacji",
    scheduled: "Zaplanowane",
    published: "Opublikowane",
};

const STATUS_COLORS: Record<PublicationStatus, string> = {
    idea: "statusIdea",
    preparation: "statusPreparation",
    editing: "statusEditing",
    approval: "statusApproval",
    scheduled: "statusScheduled",
    published: "statusPublished",
};

const STAGE_LABELS: Record<MaterialStage, string> = {
    ideas: "Pomysły",
    recording: "Nagrywanie",
    editing: "Montaż",
    approval: "Akceptacja",
    ready: "Gotowe",
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    pending: "Do zrobienia",
    in_progress: "W trakcie",
    done: "Zakończone",
};

// ---------------------------------------------------------------------------
// KOMPONENT SEKCJI ZESPOŁU
// ---------------------------------------------------------------------------

interface TeamSectionProps {
    members: TeamMember[];
    canManage: boolean;
}

function TeamSection({ members, canManage }: TeamSectionProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState<SocialRole | "all">("all");

    const filteredMembers = useMemo(() => {
        return members.filter((member) => {
            const matchesSearch =
                member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.province.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = selectedRole === "all" || member.role === selectedRole;
            return matchesSearch && matchesRole;
        });
    }, [members, searchTerm, selectedRole]);

    return (
        <section className={styles.section}>
            <div className={styles.section__header}>
                <div className={styles.section__headerLeft}>
                    <h2 className={styles.section__title}>Zespół Social Media</h2>
                    <p className={styles.section__subtitle}>
                        Osoby odpowiedzialne za prowadzenie kanałów organizacji.
                    </p>
                </div>
                {canManage && (
                    <button className={styles.section__addBtn}>
                        <Plus size={18} />
                        Dodaj członka
                    </button>
                )}
            </div>

            <div className={styles.section__filters}>
                <div className={styles.section__search}>
                    <Search size={18} className={styles.section__searchIcon} />
                    <input
                        type="text"
                        className={styles.section__searchInput}
                        placeholder="Szukaj po imieniu, nazwisku, województwie..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className={styles.section__select}
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as SocialRole | "all")}
                >
                    <option value="all">Wszystkie role</option>
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.teamGrid}>
                {filteredMembers.map((member) => (
                    <div key={member.id} className={styles.teamCard}>
                        <div className={styles.teamCard__avatar}>
                            {member.avatar || member.firstName[0] + member.lastName[0]}
                        </div>
                        <div className={styles.teamCard__info}>
                            <h3 className={styles.teamCard__name}>
                                {member.firstName} {member.lastName}
                            </h3>
                            <div className={styles.teamCard__role}>
                                {ROLE_ICONS[member.role]}
                                {ROLE_LABELS[member.role]}
                            </div>
                            <div className={styles.teamCard__details}>
                                <span>
                                    <MapPin size={14} />
                                    {member.province}
                                </span>
                                <span>
                                    <Briefcase size={14} />
                                    {member.team}
                                </span>
                            </div>
                            <div className={styles.teamCard__contact}>
                                <a href={`mailto:${member.email}`} className={styles.teamCard__link}>
                                    <Mail size={14} />
                                </a>
                                {member.phone && (
                                    <a href={`tel:${member.phone}`} className={styles.teamCard__link}>
                                        <Phone size={14} />
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className={styles.teamCard__status}>
                            <span className={member.active ? styles.statusActive : styles.statusInactive}>
                                {member.active ? "Aktywny" : "Nieaktywny"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// KOMPONENT SEKCJI TWÓRCÓW ROLEK
// ---------------------------------------------------------------------------

function CreatorsSection({ creators }: { creators: ContentCreator[] }) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCreators = useMemo(() => {
        return creators.filter((c) =>
            (c.firstName + " " + c.lastName)
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );
    }, [creators, searchTerm]);

    return (
        <section className={styles.section}>
            <div className={styles.section__header}>
                <div className={styles.section__headerLeft}>
                    <h2 className={styles.section__title}>Twórcy rolek</h2>
                    <p className={styles.section__subtitle}>
                        Osoby, które chcą regularnie nagrywać materiały wideo.
                    </p>
                </div>
            </div>

            <div className={styles.section__filters}>
                <div className={styles.section__search}>
                    <Search size={18} className={styles.section__searchIcon} />
                    <input
                        type="text"
                        className={styles.section__searchInput}
                        placeholder="Szukaj po imieniu, nazwisku..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.creatorsGrid}>
                {filteredCreators.map((creator) => (
                    <div key={creator.id} className={styles.creatorCard}>
                        <div className={styles.creatorCard__avatar}>
                            {creator.firstName[0] + creator.lastName[0]}
                        </div>
                        <div className={styles.creatorCard__info}>
                            <h3 className={styles.creatorCard__name}>
                                {creator.firstName} {creator.lastName}
                            </h3>
                            <div className={styles.creatorCard__details}>
                                <span>
                                    <MapPin size={14} />
                                    {creator.province}
                                </span>
                                <span>
                                    <Briefcase size={14} />
                                    {creator.team}
                                </span>
                            </div>
                            <div className={styles.creatorCard__availability}>
                                <Clock size={14} />
                                {creator.availability}
                            </div>
                            <div className={styles.creatorCard__experience}>
                                <Star size={14} />
                                Doświadczenie:{" "}
                                {creator.experience === "none" && "Brak"}
                                {creator.experience === "beginner" && "Początkujący"}
                                {creator.experience === "intermediate" && "Średniozaawansowany"}
                                {creator.experience === "advanced" && "Zaawansowany"}
                            </div>
                            <div className={styles.creatorCard__topics}>
                                {creator.topics.map((topic) => (
                                    <span key={topic} className={styles.creatorCard__topic}>
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// KOMPONENT SEKCJI PLANOWANIA PUBLIKACJI
// ---------------------------------------------------------------------------

function PublicationsSection({
    publications,
    canManage,
}: {
    publications: Publication[];
    canManage: boolean;
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<PublicationStatus | "all">("all");
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | "all">("all");

    const filteredPublications = useMemo(() => {
        return publications.filter((p) => {
            const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = selectedStatus === "all" || p.status === selectedStatus;
            const matchesPlatform = selectedPlatform === "all" || p.platform === selectedPlatform;
            return matchesSearch && matchesStatus && matchesPlatform;
        });
    }, [publications, searchTerm, selectedStatus, selectedPlatform]);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("pl-PL", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <section className={styles.section}>
            <div className={styles.section__header}>
                <div className={styles.section__headerLeft}>
                    <h2 className={styles.section__title}>Planowanie publikacji</h2>
                    <p className={styles.section__subtitle}>
                        Organizacja przyszłych publikacji w mediach społecznościowych.
                    </p>
                </div>
                {canManage && (
                    <button className={styles.section__addBtn}>
                        <Plus size={18} />
                        Dodaj publikację
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
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as PublicationStatus | "all")}
                >
                    <option value="all">Wszystkie statusy</option>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
                <select
                    className={styles.section__select}
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value as Platform | "all")}
                >
                    <option value="all">Wszystkie platformy</option>
                    {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.publicationsGrid}>
                {filteredPublications.map((pub) => (
                    <div key={pub.id} className={styles.publicationCard}>
                        <div className={styles.publicationCard__header}>
                            <h3 className={styles.publicationCard__title}>{pub.title}</h3>
                            <span className={`${styles.publicationCard__status} ${styles[STATUS_COLORS[pub.status]]}`}>
                                {STATUS_LABELS[pub.status]}
                            </span>
                        </div>
                        <div className={styles.publicationCard__body}>
                            <div className={styles.publicationCard__meta}>
                                <span>
                                    {PLATFORM_ICONS[pub.platform]}
                                    {PLATFORM_LABELS[pub.platform]}
                                </span>
                                <span>
                                    <Tag size={14} />
                                    {CONTENT_TYPE_LABELS[pub.type]}
                                </span>
                                <span>
                                    <User size={14} />
                                    {pub.responsible}
                                </span>
                                <span>
                                    <Calendar size={14} />
                                    {formatDate(pub.dueDate)}
                                </span>
                            </div>
                            {pub.description && (
                                <p className={styles.publicationCard__description}>{pub.description}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// KOMPONENT SEKCJI TABLICY MATERIAŁÓW
// ---------------------------------------------------------------------------

function MaterialsBoard({ materials }: { materials: Material[] }) {
    const stages: MaterialStage[] = ["ideas", "recording", "editing", "approval", "ready"];

    const getMaterialsByStage = (stage: MaterialStage) => {
        return materials.filter((m) => m.stage === stage);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return styles.priorityHigh;
            case "medium":
                return styles.priorityMedium;
            case "low":
                return styles.priorityLow;
            default:
                return "";
        }
    };

    return (
        <section className={styles.section}>
            <div className={styles.section__header}>
                <div className={styles.section__headerLeft}>
                    <h2 className={styles.section__title}>Tablica materiałów</h2>
                    <p className={styles.section__subtitle}>
                        Organizacja pracy zespołu - etapy realizacji materiałów.
                    </p>
                </div>
            </div>

            <div className={styles.board}>
                {stages.map((stage) => (
                    <div key={stage} className={styles.board__column}>
                        <div className={styles.board__columnHeader}>
                            <h3 className={styles.board__columnTitle}>{STAGE_LABELS[stage]}</h3>
                            <span className={styles.board__columnCount}>
                                {getMaterialsByStage(stage).length}
                            </span>
                        </div>
                        <div className={styles.board__columnBody}>
                            {getMaterialsByStage(stage).map((material) => (
                                <div key={material.id} className={styles.board__card}>
                                    <h4 className={styles.board__cardTitle}>{material.name}</h4>
                                    <p className={styles.board__cardDescription}>{material.description}</p>
                                    <div className={styles.board__cardMeta}>
                                        <span>
                                            <User size={12} />
                                            {material.responsible}
                                        </span>
                                        <span>
                                            <Calendar size={12} />
                                            {new Date(material.deadline).toLocaleDateString("pl-PL")}
                                        </span>
                                    </div>
                                    <span className={`${styles.board__cardPriority} ${getPriorityColor(material.priority)}`}>
                                        {material.priority === "high" && "Wysoki"}
                                        {material.priority === "medium" && "Średni"}
                                        {material.priority === "low" && "Niski"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// KOMPONENT SEKCJI ZADAŃ
// ---------------------------------------------------------------------------

function TasksSection({ tasks, canManage }: { tasks: Task[]; canManage: boolean }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "all">("all");

    const filteredTasks = useMemo(() => {
        return tasks.filter((t) => {
            const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = selectedStatus === "all" || t.status === selectedStatus;
            return matchesSearch && matchesStatus;
        });
    }, [tasks, searchTerm, selectedStatus]);

    return (
        <section className={styles.section}>
            <div className={styles.section__header}>
                <div className={styles.section__headerLeft}>
                    <h2 className={styles.section__title}>Zadania zespołu</h2>
                    <p className={styles.section__subtitle}>
                        Lista aktualnych zadań dla osób zajmujących się social mediami.
                    </p>
                </div>
                {canManage && (
                    <button className={styles.section__addBtn}>
                        <Plus size={18} />
                        Dodaj zadanie
                    </button>
                )}
            </div>

            <div className={styles.section__filters}>
                <div className={styles.section__search}>
                    <Search size={18} className={styles.section__searchIcon} />
                    <input
                        type="text"
                        className={styles.section__searchInput}
                        placeholder="Szukaj po nazwie..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className={styles.section__select}
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as TaskStatus | "all")}
                >
                    <option value="all">Wszystkie statusy</option>
                    {Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.tasksGrid}>
                {filteredTasks.map((task) => (
                    <div key={task.id} className={styles.taskCard}>
                        <div className={styles.taskCard__header}>
                            <h3 className={styles.taskCard__title}>{task.name}</h3>
                            <span className={`${styles.taskCard__status} ${task.status === "done"
                                ? styles.taskStatusDone
                                : task.status === "in_progress"
                                    ? styles.taskStatusInProgress
                                    : styles.taskStatusPending
                                }`}>
                                {TASK_STATUS_LABELS[task.status]}
                            </span>
                        </div>
                        <div className={styles.taskCard__body}>
                            <div className={styles.taskCard__meta}>
                                <span>
                                    <User size={14} />
                                    {task.responsible}
                                </span>
                                <span>
                                    <Calendar size={14} />
                                    {new Date(task.deadline).toLocaleDateString("pl-PL")}
                                </span>
                            </div>
                            {task.description && (
                                <p className={styles.taskCard__description}>{task.description}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// KOMPONENT SEKCJI WSPÓŁPRAC
// ---------------------------------------------------------------------------

function ContactsSection({ contacts, canManage }: { contacts: MediaContact[]; canManage: boolean }) {
    return (
        <section className={styles.section}>
            <div className={styles.section__header}>
                <div className={styles.section__headerLeft}>
                    <h2 className={styles.section__title}>Współprace i kontakty</h2>
                    <p className={styles.section__subtitle}>
                        Osoby odpowiedzialne za kontakty medialne.
                    </p>
                </div>
                {canManage && (
                    <button className={styles.section__addBtn}>
                        <Plus size={18} />
                        Dodaj kontakt
                    </button>
                )}
            </div>

            <div className={styles.contactsGrid}>
                {contacts.map((contact) => (
                    <div key={contact.id} className={styles.contactCard}>
                        <div className={styles.contactCard__header}>
                            <h3 className={styles.contactCard__name}>{contact.name}</h3>
                            <span className={styles.contactCard__channel}>{contact.channel}</span>
                        </div>
                        <div className={styles.contactCard__body}>
                            <div className={styles.contactCard__responsible}>
                                <User size={14} />
                                Osoba odpowiedzialna: <strong>{contact.responsible}</strong>
                            </div>
                            {contact.email && (
                                <a href={`mailto:${contact.email}`} className={styles.contactCard__link}>
                                    <Mail size={14} />
                                    {contact.email}
                                </a>
                            )}
                            {contact.phone && (
                                <a href={`tel:${contact.phone}`} className={styles.contactCard__link}>
                                    <Phone size={14} />
                                    {contact.phone}
                                </a>
                            )}
                            {contact.notes && (
                                <p className={styles.contactCard__notes}>{contact.notes}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ---------------------------------------------------------------------------
// GŁÓWNY KOMPONENT
// ---------------------------------------------------------------------------

export default function SocialMedia({ title }: { title?: string }) {
    const currentUser = MOCK_USER;
    const canManage = currentUser.role === "admin" || currentUser.role === "coordinator";

    return (
        <div className={styles.socialMedia}>
            {/* Nagłówek */}
            <div className={styles.header}>
                <div className={styles.header__left}>
                   <h1 className={styles.header__title}>
                        {title ?? "Social Media"}
                    </h1>
                                        <p className={styles.header__subtitle}>
                        Centrum zarządzania działaniami komunikacyjnymi, tworzeniem treści oraz zespołem
                        odpowiedzialnym za media społecznościowe Stowarzyszenia Siła Młodych.
                    </p>
                </div>
            </div>

            {/* Zespół */}
            <TeamSection members={MOCK_TEAM_MEMBERS} canManage={canManage} />

            {/* Twórcy rolek */}
            <CreatorsSection creators={MOCK_CONTENT_CREATORS} />

            {/* Planowanie publikacji */}
            <PublicationsSection publications={MOCK_PUBLICATIONS} canManage={canManage} />

            {/* Tablica materiałów */}
            <MaterialsBoard materials={MOCK_MATERIALS} />

            {/* Zadania */}
            <TasksSection tasks={MOCK_TASKS} canManage={canManage} />

            {/* Współprace */}
            <ContactsSection contacts={MOCK_CONTACTS} canManage={canManage} />

            {/* Informacje organizacyjne */}
            <section className={styles.section}>
                <div className={styles.infoBox}>
                    <div className={styles.infoBox__icon}>
                        <AlertCircle size={24} />
                    </div>
                    <div className={styles.infoBox__content}>
                        <h3 className={styles.infoBox__title}>Informacje organizacyjne</h3>
                        <p className={styles.infoBox__text}>
                            Dostęp do zakładki posiadają osoby zajmujące się mediami społecznościowymi
                            oraz osoby z odpowiednimi uprawnieniami. Administrator główny oraz zarząd
                            mogą przydzielać role i uprawnienia. Zakładka służy do koordynacji działań
                            medialnych, planowania publikacji oraz organizacji pracy zespołu.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}