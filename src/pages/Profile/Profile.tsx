import React from "react";
import { useState } from "react";
import {
    User,
    MapPin,
    Briefcase,
    Clock,
    CheckCircle,
    AlertCircle,
    Mail,
    Phone,
    Calendar,
    Edit,
    Save,
    X,
    Users,
    Star,
    Award,
    BookOpen,
    TrendingUp,
    Umbrella,
    CreditCard,
    Eye,
    Shield,
    Camera,
    Settings,
    Plus,
} from "lucide-react";
import styles from "./Profile.module.css";

// ---------------------------------------------------------------------------
// TYPY
// ---------------------------------------------------------------------------

type MemberStatus = "trial" | "full" | "mentor";
type DevelopmentArea =
    | "projects"
    | "conferences"
    | "advocacy"
    | "simulations"
    | "social_media"
    | "graphics"
    | "editing"
    | "it"
    | "event_organization";

type ContributionStatus = "paid" | "partial" | "unpaid";

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    function: string;
    team: string;
    province: string;
    status: MemberStatus;
    email: string;
    phone?: string;
    joinDate: string;
    mentor?: string;
    mentee?: string[];
    currentTasks: string[];
    projects: string[];
    developmentAreas: DevelopmentArea[];
    skills: string[];
    availability: string;
    description?: string;
    contacts?: {
        salaContacts: string[];
        mpContacts: string[];
        institutionContacts: string[];
        otherContacts: string[];
    };
    contributionInfo?: {
        arrears: number;
        status: ContributionStatus;
    };
    leave?: {
        isOnLeave: boolean;
        endDate?: string;
        history: {
            id: string;
            startDate: string;
            endDate: string;
            status: string;
        }[];
    };
}

// ---------------------------------------------------------------------------
// DANE PRZYKŁADOWE
// ---------------------------------------------------------------------------

const MOCK_USER: Member = {
    id: "1",
    firstName: "Jan",
    lastName: "Kowalski",
    function: "Koordynator Filaru Projektowego",
    team: "Filar Projektowy",
    province: "Łódzkie",
    status: "mentor",
    email: "jan.kowalski@silamlodych.pl",
    joinDate: "2023-11-01",
    mentor: "Maksym Marczak",
    mentee: ["Anna Nowak", "Piotr Kowalski"],
    currentTasks: [
        "Przygotowanie raportu z projektu",
        "Koordynacja spotkania zespołu",
        "Aktualizacja dokumentacji"
    ],
    projects: [
        "Letnia Akademia Liderów",
        "Debata Młodych 2026"
    ],
    developmentAreas: [
        "projects",
        "conferences",
        "advocacy"
    ],
    skills: [
        "Project Management",
        "Agile",
        "Scrum",
        "Public Speaking",
        "Negocjacje"
    ],
    availability: "Poniedziałek-Piątek 16:00-20:00, Weekendy",
    description: "Doświadczony koordynator z 3-letnim stażem w organizacji. Pasjonat zarządzania projektami i rozwoju młodych liderów.",
    contacts: {
        salaContacts: [
            "Sala nr 3 - Centrum Konferencyjne (kontakt: 501-234-567)",
            "Sala warsztatowa - Budynek A"
        ],
        mpContacts: [
            "Poseł Anna Kowalska (anna.kowalska@sejm.gov.pl)",
            "Poseł Jan Nowak - kontak w sprawie edukacji"
        ],
        institutionContacts: [
            "Fundacja Rozwoju Młodzieży",
            "Centrum Inicjatyw Obywatelskich"
        ],
        otherContacts: [
            "Redaktor naczelny Gazety Młodych"
        ]
    },
    contributionInfo: {
        arrears: 50,
        status: "partial"
    },
    leave: {
        isOnLeave: false,
        history: [
            {
                id: "1",
                startDate: "2025-07-15",
                endDate: "2025-07-20",
                status: "approved"
            },
            {
                id: "2",
                startDate: "2025-08-01",
                endDate: "2025-08-07",
                status: "pending"
            }
        ]
    }
};

// ---------------------------------------------------------------------------
// MAPOWANIA
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<MemberStatus, string> = {
    trial: "Okres próbny",
    full: "Aktywny członek",
    mentor: "Mentor",
};

const STATUS_COLORS: Record<MemberStatus, string> = {
    trial: styles.statusTrial,
    full: styles.statusFull,
    mentor: styles.statusMentor,
};

const STATUS_ICONS: Record<MemberStatus, React.ReactNode> = {
    trial: <Clock size={16} />,
    full: <CheckCircle size={16} />,
    mentor: <Star size={16} />,
};

const DEVELOPMENT_AREA_LABELS: Record<DevelopmentArea, string> = {
    projects: "Projekty",
    conferences: "Konferencje i debaty",
    advocacy: "Rzecznictwo",
    simulations: "Symulacje",
    social_media: "Social Media",
    graphics: "Grafika",
    editing: "Montaż",
    it: "IT",
    event_organization: "Organizacja wydarzeń",
};

const DEVELOPMENT_AREA_ICONS: Record<DevelopmentArea, React.ReactNode> = {
    projects: <Briefcase size={14} />,
    conferences: <Users size={14} />,
    advocacy: <Shield size={14} />,
    simulations: <Award size={14} />,
    social_media: <Camera size={14} />,
    graphics: <Eye size={14} />,
    editing: <Edit size={14} />,
    it: <Settings size={14} />,
    event_organization: <Calendar size={14} />,
};

const CONTRIBUTION_STATUS_LABELS: Record<ContributionStatus, string> = {
    paid: "Opłacone",
    partial: "Częściowo opłacone",
    unpaid: "Nieopłacone",
};

const CONTRIBUTION_STATUS_COLORS: Record<ContributionStatus, string> = {
    paid: styles.contributionPaid,
    partial: styles.contributionPartial,
    unpaid: styles.contributionUnpaid,
};

// ---------------------------------------------------------------------------
// KOMPONENT
// ---------------------------------------------------------------------------

export default function Profile({ title }: { title?: string }) {
    const [user, setUser] = useState<Member>(MOCK_USER);
    const [isEditing, setIsEditing] = useState(false);
    // const [showPrivateData, setShowPrivateData] = useState(false);
    const [editData, setEditData] = useState<Partial<Member>>({});
    const [selectedTab, setSelectedTab] = useState<string>("profile");


    // Funkcje do edycji
    const handleEditToggle = () => {
        if (isEditing) {
            // Zapisz zmiany
            setUser({
                ...user,
                ...editData,
            });
            setEditData({});
        } else {
            // Rozpocznij edycję
            setEditData({
                firstName: user.firstName,
                lastName: user.lastName,
                province: user.province,
                description: user.description,
                skills: user.skills,
                developmentAreas: user.developmentAreas,
                availability: user.availability,
            });
        }
        setIsEditing(!isEditing);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditData({});
    };

    const handleInputChange = <K extends keyof Member>(
        field: K,
        value: Member[K]
    ) => {
        setEditData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const toggleDevelopmentArea = (area: DevelopmentArea) => {
        const current = editData.developmentAreas || user.developmentAreas;
        if (current.includes(area)) {
            handleInputChange("developmentAreas", current.filter((a) => a !== area));
        } else {
            handleInputChange("developmentAreas", [...current, area]);
        }
    };

    const addSkill = () => {
        const newSkill = prompt("Podaj nazwę umiejętności:");
        if (newSkill && newSkill.trim()) {
            const current = editData.skills || user.skills;
            handleInputChange("skills", [...current, newSkill.trim()]);
        }
    };

    const removeSkill = (skill: string) => {
        const current = editData.skills || user.skills;
        handleInputChange("skills", current.filter((s) => s !== skill));
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("pl-PL", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const canViewPrivate = true; // W rzeczywistej aplikacji: currentUser.role === "admin" || currentUser.role === "coordinator" || currentUser.id === user.id

    const displayUser = isEditing
        ? { ...user, ...editData }
        : user;
    return (
        <div className={styles.profile}>
            {/* Nagłówek */}
            <div className={styles.header}>
                <div className={styles.header__left}>
                    <h1 className={styles.header__title}>
                        {title ?? "Mój profil"}
                    </h1>
                    <p className={styles.header__subtitle}>
                        Twoje dane, funkcje, zespoły oraz informacje związane z działalnością w Stowarzyszeniu Siła Młodych.
                    </p>
                </div>
                <div className={styles.header__actions}>
                    <button
                        className={styles.header__editBtn}
                        onClick={handleEditToggle}
                    >
                        {isEditing ? <Save size={18} /> : <Edit size={18} />}
                        {isEditing ? "Zapisz zmiany" : "Edytuj profil"}
                    </button>
                    {isEditing && (
                        <button
                            className={styles.header__cancelBtn}
                            onClick={handleCancelEdit}
                        >
                            <X size={18} />
                            Anuluj
                        </button>
                    )}
                </div>
            </div>

            {/* Nawigacja */}
            <div className={styles.navigation}>
                <button
                    className={`${styles.navigation__item} ${selectedTab === "profile" ? styles.navigation__itemActive : ""}`}
                    onClick={() => setSelectedTab("profile")}
                >
                    <User size={16} />
                    Profil
                </button>
                <button
                    className={`${styles.navigation__item} ${selectedTab === "activity" ? styles.navigation__itemActive : ""}`}
                    onClick={() => setSelectedTab("activity")}
                >
                    <TrendingUp size={16} />
                    Aktywność
                </button>
                <button
                    className={`${styles.navigation__item} ${selectedTab === "private" ? styles.navigation__itemActive : ""}`}
                    onClick={() => setSelectedTab("private")}
                >
                    <Shield size={16} />
                    Prywatne
                </button>
            </div>

            {/* Główna zawartość */}
            <div className={styles.content}>
                {/* Karta profilowa */}
                <div className={styles.profileCard}>
                    <div className={styles.profileCard__header}>
                        <div className={styles.profileCard__avatarSection}>
                            <div className={styles.profileCard__avatar}>
                                {displayUser.avatar || displayUser.firstName[0] + displayUser.lastName[0]}
                            </div>
                            <div className={styles.profileCard__userInfo}>
                                <h2 className={styles.profileCard__name}>
                                    {displayUser.firstName} {displayUser.lastName}
                                </h2>
                                <p className={styles.profileCard__function}>
                                    <Briefcase size={16} />
                                    {displayUser.function}
                                </p>
                                <div className={styles.profileCard__meta}>
                                    <span>
                                        <Users size={14} />
                                        {displayUser.team}
                                    </span>
                                    <span>
                                        <MapPin size={14} />
                                        {displayUser.province}
                                    </span>
                                    <span className={`${styles.profileCard__status} ${STATUS_COLORS[displayUser.status]}`}>
                                        {STATUS_ICONS[displayUser.status]}
                                        {STATUS_LABELS[displayUser.status]}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.profileCard__contact}>
                            <div className={styles.profileCard__contactItem}>
                                <Mail size={14} />
                                <span>{displayUser.email}</span>
                            </div>
                            {displayUser.phone && (
                                <div className={styles.profileCard__contactItem}>
                                    <Phone size={14} />
                                    <span>{displayUser.phone}</span>
                                </div>
                            )}
                            <div className={styles.profileCard__contactItem}>
                                <Calendar size={14} />
                                <span>Dołączył: {formatDate(displayUser.joinDate)}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.profileCard__description}>
                        {isEditing ? (
                            <textarea
                                className={styles.section__input}
                                value={editData.description || user.description || ""}
                                onChange={(e) => handleInputChange("description", e.target.value)}
                                rows={3}
                                placeholder="Dodaj opis o sobie..."
                            />
                        ) : (
                            <p>{displayUser.description || "Brak opisu"}</p>
                        )}
                    </div>
                </div>

                {/* Sekcje - z filtrowaniem przez zakładki */}
                <div className={styles.sections}>
                    {/* Zakładka "Profil" - pokazuje wszystko */}
                    {(selectedTab === "profile" || selectedTab === "all") && (
                        <>
                            {/* Działalność w SM */}
                            <div className={styles.section}>
                                <h3 className={styles.section__title}>
                                    <TrendingUp size={20} />
                                    Moja działalność w SM
                                </h3>
                                <div className={styles.section__grid}>
                                    {/* IMIĘ - edytowalne */}
                                    <div className={styles.section__item}>
                                        <span className={styles.section__label}>Imię</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className={styles.section__input}
                                                value={editData.firstName || user.firstName}
                                                onChange={(e) => handleInputChange("firstName", e.target.value)}
                                            />
                                        ) : (
                                            <span className={styles.section__value}>{displayUser.firstName}</span>
                                        )}
                                    </div>

                                    {/* NAZWISKO - edytowalne */}
                                    <div className={styles.section__item}>
                                        <span className={styles.section__label}>Nazwisko</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className={styles.section__input}
                                                value={editData.lastName || user.lastName}
                                                onChange={(e) => handleInputChange("lastName", e.target.value)}
                                            />
                                        ) : (
                                            <span className={styles.section__value}>{displayUser.lastName}</span>
                                        )}
                                    </div>

                                    {/* FUNKCJA - NIEedytowalna */}
                                    <div className={styles.section__item}>
                                        <span className={styles.section__label}>Funkcja</span>
                                        <span className={styles.section__value}>{displayUser.function}</span>
                                    </div>

                                    {/* ZESPÓŁ - NIEedytowalny */}
                                    <div className={styles.section__item}>
                                        <span className={styles.section__label}>Zespół</span>
                                        <span className={styles.section__value}>{displayUser.team}</span>
                                    </div>

                                    {/* WOJEWÓDZTWO - edytowalne */}
                                    <div className={styles.section__item}>
                                        <span className={styles.section__label}>Województwo</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className={styles.section__input}
                                                value={editData.province || user.province}
                                                onChange={(e) => handleInputChange("province", e.target.value)}
                                            />
                                        ) : (
                                            <span className={styles.section__value}>{displayUser.province}</span>
                                        )}
                                    </div>

                                    {/* DATA DOŁĄCZENIA - NIEedytowalna */}
                                    <div className={styles.section__item}>
                                        <span className={styles.section__label}>Data dołączenia</span>
                                        <span className={styles.section__value}>{formatDate(displayUser.joinDate)}</span>
                                    </div>
                                </div>

                                {/* Zainteresowania i rozwój */}
                                <div className={styles.section}>
                                    <h3 className={styles.section__title}>
                                        <BookOpen size={20} />
                                        Zainteresowania i rozwój
                                    </h3>

                                    <div className={styles.section__field}>
                                        <label className={styles.section__label}>Obszary, w których chcę się rozwijać</label>
                                        <div className={styles.section__areas}>
                                            {Object.entries(DEVELOPMENT_AREA_LABELS).map(([key, label]) => {
                                                const area = key as DevelopmentArea;
                                                const isSelected = (editData.developmentAreas || user.developmentAreas).includes(area);
                                                return (
                                                    <button
                                                        key={key}
                                                        className={`${styles.section__area} ${isSelected ? styles.section__areaSelected : ""}`}
                                                        onClick={() => isEditing ? toggleDevelopmentArea(area) : null}
                                                        disabled={!isEditing}
                                                    >
                                                        {DEVELOPMENT_AREA_ICONS[area]}
                                                        {label}
                                                        {isSelected && isEditing && <CheckCircle size={12} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className={styles.section__field}>
                                        <label className={styles.section__label}>Umiejętności</label>
                                        <div className={styles.section__skills}>
                                            {(editData.skills || user.skills).map((skill) => (
                                                <span key={skill} className={styles.section__skill}>
                                                    {skill}
                                                    {isEditing && (
                                                        <button
                                                            className={styles.section__removeSkill}
                                                            onClick={() => removeSkill(skill)}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    )}
                                                </span>
                                            ))}
                                            {isEditing && (
                                                <button
                                                    className={styles.section__addSkill}
                                                    onClick={addSkill}
                                                >
                                                    <Plus size={14} />
                                                    Dodaj umiejętność
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.section__field}>
                                        <label className={styles.section__label}>Dostępność</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className={styles.section__input}
                                                value={editData.availability || user.availability}
                                                onChange={(e) => handleInputChange("availability", e.target.value)}
                                            />
                                        ) : (
                                            <p className={styles.section__value}>{displayUser.availability}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Kontakty i zasoby - prywatne */}
                                {canViewPrivate && displayUser.contacts && (
                                    <div className={styles.section}>
                                        <h3 className={styles.section__title}>
                                            <Shield size={20} />
                                            Kontakty i zasoby
                                        </h3>
                                        <div className={styles.section__privateNote}>
                                            <AlertCircle size={16} />
                                            <span>Te dane są prywatne i widoczne tylko dla Ciebie oraz osób posiadających odpowiednie uprawnienia.</span>
                                        </div>
                                        <div className={styles.section__grid}>
                                            {displayUser.contacts.salaContacts.length > 0 && (
                                                <div className={styles.section__item}>
                                                    <span className={styles.section__label}>Kontakty do sal</span>
                                                    <ul className={styles.section__list}>
                                                        {displayUser.contacts.salaContacts.map((contact) => (
                                                            <li key={contact}>{contact}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {displayUser.contacts.mpContacts.length > 0 && (
                                                <div className={styles.section__item}>
                                                    <span className={styles.section__label}>Kontakty do posłów</span>
                                                    <ul className={styles.section__list}>
                                                        {displayUser.contacts.mpContacts.map((contact) => (
                                                            <li key={contact}>{contact}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {displayUser.contacts.institutionContacts.length > 0 && (
                                                <div className={styles.section__item}>
                                                    <span className={styles.section__label}>Kontakty do instytucji</span>
                                                    <ul className={styles.section__list}>
                                                        {displayUser.contacts.institutionContacts.map((contact) => (
                                                            <li key={contact}>{contact}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {displayUser.contacts.otherContacts.length > 0 && (
                                                <div className={styles.section__item}>
                                                    <span className={styles.section__label}>Inne możliwości współpracy</span>
                                                    <ul className={styles.section__list}>
                                                        {displayUser.contacts.otherContacts.map((contact) => (
                                                            <li key={contact}>{contact}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Składki */}
                                {canViewPrivate && displayUser.contributionInfo && (
                                    <div className={styles.section}>
                                        <h3 className={styles.section__title}>
                                            <CreditCard size={20} />
                                            Składki
                                        </h3>
                                        <div className={styles.section__grid}>
                                            <div className={styles.section__item}>
                                                <span className={styles.section__label}>Aktualne zadłużenie</span>
                                                <span className={styles.section__value}>
                                                    {displayUser.contributionInfo.arrears} zł
                                                </span>
                                            </div>
                                            <div className={styles.section__item}>
                                                <span className={styles.section__label}>Status składek</span>
                                                <span className={`${styles.section__status} ${CONTRIBUTION_STATUS_COLORS[displayUser.contributionInfo.status]}`}>
                                                    {CONTRIBUTION_STATUS_LABELS[displayUser.contributionInfo.status]}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Urlopy */}
                                <div className={styles.section}>
                                    <h3 className={styles.section__title}>
                                        <Umbrella size={20} />
                                        Moja dostępność
                                    </h3>
                                    {displayUser.leave?.isOnLeave ? (
                                        <div className={styles.section__leaveWarning}>
                                            <AlertCircle size={20} />
                                            <span>Nieobecny do: {formatDate(displayUser.leave.endDate!)}</span>
                                        </div>
                                    ) : (
                                        <div className={styles.section__leaveActive}>
                                            <CheckCircle size={20} />
                                            <span>Aktywny</span>
                                        </div>
                                    )}
                                    <div className={styles.section__leaveHistory}>
                                        <h4 className={styles.section__subtitle}>Historia zgłoszonych urlopów</h4>
                                        <div className={styles.section__leaveList}>
                                            {displayUser.leave?.history.map((leave) => (
                                                <div key={leave.id} className={styles.section__leaveItem}>
                                                    <span>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</span>
                                                    <span className={`${styles.section__leaveStatus} ${leave.status === "approved" ? styles.leaveApproved :
                                                        leave.status === "pending" ? styles.leavePending :
                                                            styles.leaveRejected
                                                        }`}>
                                                        {leave.status === "approved" ? "Zatwierdzony" :
                                                            leave.status === "pending" ? "Oczekuje" :
                                                                "Odrzucony"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <button className={styles.section__leaveBtn}>
                                            <Plus size={16} />
                                            Zgłoś urlop
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Zakładka "Aktywność" */}
                    {(selectedTab === "activity") && (
                        <>
                            <div className={styles.section}>
                                <h3 className={styles.section__title}>
                                    <TrendingUp size={20} />
                                    Moja aktywność
                                </h3>
                                <div className={styles.section__grid}>
                                    <div className={styles.section__item}>
                                        <span className={styles.section__label}>Aktualne zadania</span>
                                        <div className={styles.section__tags}>
                                            {displayUser.currentTasks.map((task) => (
                                                <span key={task} className={styles.section__tag}>
                                                    {task}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles.section__item}>
                                        <span className={styles.section__label}>Projekty</span>
                                        <div className={styles.section__tags}>
                                            {displayUser.projects.map((project) => (
                                                <span key={project} className={styles.section__tagProject}>
                                                    {project}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles.section__item}>
                                        <span className={styles.section__label}>Funkcja</span>
                                        <span className={styles.section__value}>{displayUser.function}</span>
                                    </div>
                                    <div className={styles.section__item}>
                                        <span className={styles.section__label}>Zespół</span>
                                        <span className={styles.section__value}>{displayUser.team}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h3 className={styles.section__title}>
                                    <BookOpen size={20} />
                                    Rozwój
                                </h3>
                                <div className={styles.section__field}>
                                    <label className={styles.section__label}>Obszary rozwoju</label>
                                    <div className={styles.section__areas}>
                                        {displayUser.developmentAreas.map((area) => (
                                            <span key={area} className={styles.section__areaSelected} style={{ cursor: "default" }}>
                                                {DEVELOPMENT_AREA_ICONS[area]}
                                                {DEVELOPMENT_AREA_LABELS[area]}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.section__field}>
                                    <label className={styles.section__label}>Umiejętności</label>
                                    <div className={styles.section__skills}>
                                        {displayUser.skills.map((skill) => (
                                            <span key={skill} className={styles.section__skill}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Zakładka "Prywatne" */}
                    {(selectedTab === "private") && (
                        <>
                            {canViewPrivate && displayUser.contacts && (
                                <div className={styles.section}>
                                    <h3 className={styles.section__title}>
                                        <Shield size={20} />
                                        Kontakty i zasoby
                                    </h3>
                                    <div className={styles.section__privateNote}>
                                        <AlertCircle size={16} />
                                        <span>Te dane są prywatne i widoczne tylko dla Ciebie oraz osób posiadających odpowiednie uprawnienia.</span>
                                    </div>
                                    <div className={styles.section__grid}>
                                        {displayUser.contacts.salaContacts.length > 0 && (
                                            <div className={styles.section__item}>
                                                <span className={styles.section__label}>Kontakty do sal</span>
                                                <ul className={styles.section__list}>
                                                    {displayUser.contacts.salaContacts.map((contact) => (
                                                        <li key={contact}>{contact}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {displayUser.contacts.mpContacts.length > 0 && (
                                            <div className={styles.section__item}>
                                                <span className={styles.section__label}>Kontakty do posłów</span>
                                                <ul className={styles.section__list}>
                                                    {displayUser.contacts.mpContacts.map((contact) => (
                                                        <li key={contact}>{contact}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {displayUser.contacts.institutionContacts.length > 0 && (
                                            <div className={styles.section__item}>
                                                <span className={styles.section__label}>Kontakty do instytucji</span>
                                                <ul className={styles.section__list}>
                                                    {displayUser.contacts.institutionContacts.map((contact) => (
                                                        <li key={contact}>{contact}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {displayUser.contacts.otherContacts.length > 0 && (
                                            <div className={styles.section__item}>
                                                <span className={styles.section__label}>Inne możliwości współpracy</span>
                                                <ul className={styles.section__list}>
                                                    {displayUser.contacts.otherContacts.map((contact) => (
                                                        <li key={contact}>{contact}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {canViewPrivate && displayUser.contributionInfo && (
                                <div className={styles.section}>
                                    <h3 className={styles.section__title}>
                                        <CreditCard size={20} />
                                        Składki
                                    </h3>
                                    <div className={styles.section__grid}>
                                        <div className={styles.section__item}>
                                            <span className={styles.section__label}>Aktualne zadłużenie</span>
                                            <span className={styles.section__value}>
                                                {displayUser.contributionInfo.arrears} zł
                                            </span>
                                        </div>
                                        <div className={styles.section__item}>
                                            <span className={styles.section__label}>Status składek</span>
                                            <span className={`${styles.section__status} ${CONTRIBUTION_STATUS_COLORS[displayUser.contributionInfo.status]}`}>
                                                {CONTRIBUTION_STATUS_LABELS[displayUser.contributionInfo.status]}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={styles.section}>
                                <h3 className={styles.section__title}>
                                    <Umbrella size={20} />
                                    Moja dostępność
                                </h3>
                                {displayUser.leave?.isOnLeave ? (
                                    <div className={styles.section__leaveWarning}>
                                        <AlertCircle size={20} />
                                        <span>Nieobecny do: {formatDate(displayUser.leave.endDate!)}</span>
                                    </div>
                                ) : (
                                    <div className={styles.section__leaveActive}>
                                        <CheckCircle size={20} />
                                        <span>Aktywny</span>
                                    </div>
                                )}
                                <div className={styles.section__leaveHistory}>
                                    <h4 className={styles.section__subtitle}>Historia zgłoszonych urlopów</h4>
                                    <div className={styles.section__leaveList}>
                                        {displayUser.leave?.history.map((leave) => (
                                            <div key={leave.id} className={styles.section__leaveItem}>
                                                <span>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</span>
                                                <span className={`${styles.section__leaveStatus} ${leave.status === "approved" ? styles.leaveApproved :
                                                    leave.status === "pending" ? styles.leavePending :
                                                        styles.leaveRejected
                                                    }`}>
                                                    {leave.status === "approved" ? "Zatwierdzony" :
                                                        leave.status === "pending" ? "Oczekuje" :
                                                            "Odrzucony"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <button className={styles.section__leaveBtn}>
                                        <Plus size={16} />
                                        Zgłoś urlop
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}