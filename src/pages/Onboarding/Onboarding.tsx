import React, { useState, useEffect } from "react";
import {
    User,
    Briefcase,
    Calendar,
    CheckCircle,
    ArrowRight,
    Shield,
    Camera,
    Settings,
    Users,
    Award,
    Eye,
    Edit,
    BookOpen,
    AlertCircle,
} from "lucide-react";
import styles from "./Onboarding.module.css";

// ---------------------------------------------------------------------------
// TYPY
// ---------------------------------------------------------------------------

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

type ExperienceLevel = "none" | "beginner" | "intermediate" | "advanced";

interface OnboardingData {
    // Podstawowe dane
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    province: string;

    // Zainteresowania i rozwój
    developmentAreas: DevelopmentArea[];
    skills: string[];
    experience: ExperienceLevel;
    availability: string;
    description: string;

    // Kontakty (prywatne)
    salaContacts: string[];
    mpContacts: string[];
    institutionContacts: string[];
    otherContacts: string[];
}

// ---------------------------------------------------------------------------
// DANE
// ---------------------------------------------------------------------------

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
    projects: <Briefcase size={16} />,
    conferences: <Users size={16} />,
    advocacy: <Shield size={16} />,
    simulations: <Award size={16} />,
    social_media: <Camera size={16} />,
    graphics: <Eye size={16} />,
    editing: <Edit size={16} />,
    it: <Settings size={16} />,
    event_organization: <Calendar size={16} />,
};

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
    none: "Brak doświadczenia",
    beginner: "Początkujący",
    intermediate: "Średniozaawansowany",
    advanced: "Zaawansowany",
};

const PROVINCES = [
    "Dolnośląskie",
    "Kujawsko-pomorskie",
    "Lubelskie",
    "Lubuskie",
    "Łódzkie",
    "Małopolskie",
    "Mazowieckie",
    "Opolskie",
    "Podkarpackie",
    "Podlaskie",
    "Pomorskie",
    "Śląskie",
    "Świętokrzyskie",
    "Warmińsko-mazurskie",
    "Wielkopolskie",
    "Zachodniopomorskie",
];

// ---------------------------------------------------------------------------
// KOMPONENT
// ---------------------------------------------------------------------------

interface OnboardingProps {
    onComplete: (data: OnboardingData) => void;
    initialData?: Partial<OnboardingData>;
}

export default function Onboarding({ onComplete, initialData = {} }: OnboardingProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<OnboardingData>({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        province: initialData.province || "",
        developmentAreas: initialData.developmentAreas || [],
        skills: initialData.skills || [],
        experience: initialData.experience || "none",
        availability: initialData.availability || "",
        description: initialData.description || "",
        salaContacts: initialData.salaContacts || [],
        mpContacts: initialData.mpContacts || [],
        institutionContacts: initialData.institutionContacts || [],
        otherContacts: initialData.otherContacts || [],
    });

    const [newSkill, setNewSkill] = useState("");
    const [newSalaContact, setNewSalaContact] = useState("");
    const [newMpContact, setNewMpContact] = useState("");
    const [newInstitutionContact, setNewInstitutionContact] = useState("");
    const [newOtherContact, setNewOtherContact] = useState("");
    const [isEmailManuallyEdited, setIsEmailManuallyEdited] = useState(false); // <-- DODAJ

    const totalSteps = 4;

    const handleInputChange = (field: keyof OnboardingData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Jeśli użytkownik ręcznie zmienił email - zapamiętaj to
        if (field === "email") {
            setIsEmailManuallyEdited(true);
        }
    };

    const toggleDevelopmentArea = (area: DevelopmentArea) => {
        const current = formData.developmentAreas;
        if (current.includes(area)) {
            handleInputChange("developmentAreas", current.filter(a => a !== area));
        } else {
            handleInputChange("developmentAreas", [...current, area]);
        }
    };

    const addItem = (list: string[], setList: (list: string[]) => void, item: string) => {
        if (item.trim() && !list.includes(item.trim())) {
            setList([...list, item.trim()]);
        }
    };

    const removeItem = (list: string[], setList: (list: string[]) => void, item: string) => {
        setList(list.filter(i => i !== item));
    };

    const handleSubmit = () => {
        onComplete(formData);
    };

    const isStepValid = () => {
        switch (step) {
            case 1:
                return formData.firstName.trim() &&
                    formData.lastName.trim() &&
                    formData.email.trim() &&
                    formData.province;
            case 2:
                return formData.developmentAreas.length > 0;
            case 3:
                return true; // Opcjonalne
            case 4:
                return true; // Opcjonalne
            default:
                return false;
        }
    };

    const nextStep = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };
    useEffect(() => {
        // Generuj email tylko jeśli imię i nazwisko nie są puste
        if (formData.firstName.trim() && formData.lastName.trim()) {
            const normalize = (str: string) => {
                return str
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/ł/g, 'l')
                    .replace(/Ł/g, 'L')
                    .replace(/ą/g, 'a')
                    .replace(/Ą/g, 'A')
                    .replace(/ć/g, 'c')
                    .replace(/Ć/g, 'C')
                    .replace(/ę/g, 'e')
                    .replace(/Ę/g, 'E')
                    .replace(/ń/g, 'n')
                    .replace(/Ń/g, 'N')
                    .replace(/ó/g, 'o')
                    .replace(/Ó/g, 'O')
                    .replace(/ś/g, 's')
                    .replace(/Ś/g, 'S')
                    .replace(/ź/g, 'z')
                    .replace(/Ź/g, 'Z')
                    .replace(/ż/g, 'z')
                    .replace(/Ż/g, 'Z');
            };

            const firstName = normalize(formData.firstName.trim().toLowerCase());
            const lastName = normalize(formData.lastName.trim().toLowerCase());
            const generatedEmail = `${firstName}.${lastName}@silamlodych.pl`;

            // Aktualizuj email tylko jeśli NIE został ręcznie zmieniony
            if (!isEmailManuallyEdited) {
                setFormData(prev => ({ ...prev, email: generatedEmail }));
            }
        }
    }, [formData.firstName, formData.lastName, isEmailManuallyEdited]); // <-- DODAJ isEmailManuallyEdited
    return (
        <div className={styles.onboarding}>
            <div className={styles.container}>
                {/* Nagłówek */}
                <div className={styles.header}>
                    <h1 className={styles.title}>Witaj w Sile Młodych!</h1>
                    <p className={styles.subtitle}>
                        Wypełnij formularz, abyśmy mogli lepiej poznać Twoje zainteresowania
                        i dopasować Cię do odpowiednich działań w organizacji.
                    </p>
                </div>

                {/* Progress */}
                <div className={styles.progress}>
                    <div className={styles.progress__bar}>
                        <div
                            className={styles.progress__fill}
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        />
                    </div>
                    <div className={styles.progress__steps}>
                        <span className={styles.progress__step}>
                            {step} / {totalSteps}
                        </span>
                    </div>
                </div>

                {/* Formularz */}
                <div className={styles.form}>
                    {/* Krok 1: Dane podstawowe */}
                    {step === 1 && (
                        <div className={styles.step}>
                            <h2 className={styles.step__title}>
                                <User size={24} />
                                Dane podstawowe
                            </h2>
                            <p className={styles.step__description}>
                                Podaj swoje podstawowe dane, które będą widoczne dla innych członków.
                            </p>

                            <div className={styles.form__grid}>
                                <div className={styles.form__field}>
                                    <label className={styles.form__label}>Imię *</label>
                                    <input
                                        type="text"
                                        className={styles.form__input}
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                                        placeholder="np. Jan"
                                    />
                                </div>
                                <div className={styles.form__field}>
                                    <label className={styles.form__label}>Nazwisko *</label>
                                    <input
                                        type="text"
                                        className={styles.form__input}
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                                        placeholder="np. Kowalski"
                                    />
                                </div>
                            </div>

                            <div className={styles.form__grid}>
                                <div className={styles.form__field}>
                                    <label className={styles.form__label}>Email *</label>
                                    <input
                                        type="email"
                                        className={styles.form__input}
                                        value={formData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        placeholder="jan.kowalski@example.com"
                                    />
                                </div>
                                <div className={styles.form__field}>
                                    <label className={styles.form__label}>Telefon (opcjonalnie)</label>
                                    <input
                                        type="tel"
                                        className={styles.form__input}
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                        placeholder="+48 123 456 789"
                                    />
                                </div>
                            </div>

                            <div className={styles.form__field}>
                                <label className={styles.form__label}>Województwo *</label>
                                <select
                                    className={styles.form__select}
                                    value={formData.province}
                                    onChange={(e) => handleInputChange("province", e.target.value)}
                                >
                                    <option value="">Wybierz województwo</option>
                                    {PROVINCES.map((province) => (
                                        <option key={province} value={province}>
                                            {province}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Krok 2: Zainteresowania i rozwój */}
                    {step === 2 && (
                        <div className={styles.step}>
                            <h2 className={styles.step__title}>
                                <BookOpen size={24} />
                                Zainteresowania i rozwój
                            </h2>
                            <p className={styles.step__description}>
                                Wybierz obszary, w których chcesz się rozwijać. Te informacje będą widoczne dla wszystkich członków.
                            </p>

                            <div className={styles.form__field}>
                                <label className={styles.form__label}>Obszary rozwoju *</label>
                                <div className={styles.areas__grid}>
                                    {Object.entries(DEVELOPMENT_AREA_LABELS).map(([key, label]) => {
                                        const area = key as DevelopmentArea;
                                        const isSelected = formData.developmentAreas.includes(area);
                                        return (
                                            <button
                                                key={key}
                                                className={`${styles.area__btn} ${isSelected ? styles.area__btnSelected : ""}`}
                                                onClick={() => toggleDevelopmentArea(area)}
                                                type="button"
                                            >
                                                {DEVELOPMENT_AREA_ICONS[area]}
                                                {label}
                                                {isSelected && <CheckCircle size={14} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={styles.form__field}>
                                <label className={styles.form__label}>Poziom doświadczenia</label>
                                <select
                                    className={styles.form__select}
                                    value={formData.experience}
                                    onChange={(e) => handleInputChange("experience", e.target.value as ExperienceLevel)}
                                >
                                    {Object.entries(EXPERIENCE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.form__field}>
                                <label className={styles.form__label}>Umiejętności</label>
                                <div className={styles.tags__input}>
                                    <input
                                        type="text"
                                        className={styles.form__input}
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        placeholder="Dodaj umiejętność (np. Project Management)"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addItem(
                                                    formData.skills,
                                                    (list) => handleInputChange("skills", list),
                                                    newSkill
                                                );
                                                setNewSkill("");
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className={styles.tags__addBtn}
                                        onClick={() => {
                                            addItem(
                                                formData.skills,
                                                (list) => handleInputChange("skills", list),
                                                newSkill
                                            );
                                            setNewSkill("");
                                        }}
                                    >
                                        Dodaj
                                    </button>
                                </div>
                                <div className={styles.tags__list}>
                                    {formData.skills.map((skill) => (
                                        <span key={skill} className={styles.tag}>
                                            {skill}
                                            <button
                                                type="button"
                                                className={styles.tag__remove}
                                                onClick={() => removeItem(
                                                    formData.skills,
                                                    (list) => handleInputChange("skills", list),
                                                    skill
                                                )}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.form__field}>
                                <label className={styles.form__label}>Dostępność</label>
                                <input
                                    type="text"
                                    className={styles.form__input}
                                    value={formData.availability}
                                    onChange={(e) => handleInputChange("availability", e.target.value)}
                                    placeholder="np. Poniedziałek-Piątek 16:00-20:00, Weekendy"
                                />
                            </div>

                            <div className={styles.form__field}>
                                <label className={styles.form__label}>Opis / O sobie</label>
                                <textarea
                                    className={styles.form__textarea}
                                    value={formData.description}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    placeholder="Opowiedz nam o sobie, swoich zainteresowaniach i czym chciałbyś się zajmować w SM..."
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    {/* Krok 3: Kontakty prywatne */}
                    {step === 3 && (
                        <div className={styles.step}>
                            <h2 className={styles.step__title}>
                                <Shield size={24} />
                                Kontakty i zasoby
                            </h2>
                            <p className={styles.step__description}>
                                Podane informacje posłużą nam do sprawniejszego kontaktu, organizacji działań oraz lepszego dopasowania zadań i projektów do Twoich możliwości.
                            </p>

                            <div className={styles.form__field}>
                                <label className={styles.form__label}>Kontakty do sal</label>
                                <div className={styles.tags__input}>
                                    <input
                                        type="text"
                                        className={styles.form__input}
                                        value={newSalaContact}
                                        onChange={(e) => setNewSalaContact(e.target.value)}
                                        placeholder="np. Sala nr 3 - Centrum Konferencyjne"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addItem(
                                                    formData.salaContacts,
                                                    (list) => handleInputChange("salaContacts", list),
                                                    newSalaContact
                                                );
                                                setNewSalaContact("");
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className={styles.tags__addBtn}
                                        onClick={() => {
                                            addItem(
                                                formData.salaContacts,
                                                (list) => handleInputChange("salaContacts", list),
                                                newSalaContact
                                            );
                                            setNewSalaContact("");
                                        }}
                                    >
                                        Dodaj
                                    </button>
                                </div>
                                <div className={styles.tags__list}>
                                    {formData.salaContacts.map((contact) => (
                                        <span key={contact} className={styles.tag}>
                                            {contact}
                                            <button
                                                type="button"
                                                className={styles.tag__remove}
                                                onClick={() => removeItem(
                                                    formData.salaContacts,
                                                    (list) => handleInputChange("salaContacts", list),
                                                    contact
                                                )}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.form__field}>
                                <label className={styles.form__label}>Kontakty do posłów</label>
                                <div className={styles.tags__input}>
                                    <input
                                        type="text"
                                        className={styles.form__input}
                                        value={newMpContact}
                                        onChange={(e) => setNewMpContact(e.target.value)}
                                        placeholder="np. Poseł Anna Kowalska"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addItem(
                                                    formData.mpContacts,
                                                    (list) => handleInputChange("mpContacts", list),
                                                    newMpContact
                                                );
                                                setNewMpContact("");
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className={styles.tags__addBtn}
                                        onClick={() => {
                                            addItem(
                                                formData.mpContacts,
                                                (list) => handleInputChange("mpContacts", list),
                                                newMpContact
                                            );
                                            setNewMpContact("");
                                        }}
                                    >
                                        Dodaj
                                    </button>
                                </div>
                                <div className={styles.tags__list}>
                                    {formData.mpContacts.map((contact) => (
                                        <span key={contact} className={styles.tag}>
                                            {contact}
                                            <button
                                                type="button"
                                                className={styles.tag__remove}
                                                onClick={() => removeItem(
                                                    formData.mpContacts,
                                                    (list) => handleInputChange("mpContacts", list),
                                                    contact
                                                )}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.form__field}>
                                <label className={styles.form__label}>Kontakty do instytucji</label>
                                <div className={styles.tags__input}>
                                    <input
                                        type="text"
                                        className={styles.form__input}
                                        value={newInstitutionContact}
                                        onChange={(e) => setNewInstitutionContact(e.target.value)}
                                        placeholder="np. Fundacja Rozwoju Młodzieży"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addItem(
                                                    formData.institutionContacts,
                                                    (list) => handleInputChange("institutionContacts", list),
                                                    newInstitutionContact
                                                );
                                                setNewInstitutionContact("");
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className={styles.tags__addBtn}
                                        onClick={() => {
                                            addItem(
                                                formData.institutionContacts,
                                                (list) => handleInputChange("institutionContacts", list),
                                                newInstitutionContact
                                            );
                                            setNewInstitutionContact("");
                                        }}
                                    >
                                        Dodaj
                                    </button>
                                </div>
                                <div className={styles.tags__list}>
                                    {formData.institutionContacts.map((contact) => (
                                        <span key={contact} className={styles.tag}>
                                            {contact}
                                            <button
                                                type="button"
                                                className={styles.tag__remove}
                                                onClick={() => removeItem(
                                                    formData.institutionContacts,
                                                    (list) => handleInputChange("institutionContacts", list),
                                                    contact
                                                )}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.form__field}>
                                <label className={styles.form__label}>Inne kontakty</label>
                                <div className={styles.tags__input}>
                                    <input
                                        type="text"
                                        className={styles.form__input}
                                        value={newOtherContact}
                                        onChange={(e) => setNewOtherContact(e.target.value)}
                                        placeholder="np. Redaktor naczelny Gazety Młodych"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addItem(
                                                    formData.otherContacts,
                                                    (list) => handleInputChange("otherContacts", list),
                                                    newOtherContact
                                                );
                                                setNewOtherContact("");
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className={styles.tags__addBtn}
                                        onClick={() => {
                                            addItem(
                                                formData.otherContacts,
                                                (list) => handleInputChange("otherContacts", list),
                                                newOtherContact
                                            );
                                            setNewOtherContact("");
                                        }}
                                    >
                                        Dodaj
                                    </button>
                                </div>
                                <div className={styles.tags__list}>
                                    {formData.otherContacts.map((contact) => (
                                        <span key={contact} className={styles.tag}>
                                            {contact}
                                            <button
                                                type="button"
                                                className={styles.tag__remove}
                                                onClick={() => removeItem(
                                                    formData.otherContacts,
                                                    (list) => handleInputChange("otherContacts", list),
                                                    contact
                                                )}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.form__privateNote}>
                                <AlertCircle size={16} />
                                <span>Te dane są prywatne i widoczne tylko dla Ciebie oraz koordynatorów.</span>
                            </div>
                        </div>
                    )}

                    {/* Krok 4: Podsumowanie */}
                    {step === 4 && (
                        <div className={styles.step}>
                            <h2 className={styles.step__title}>
                                <CheckCircle size={24} />
                                Podsumowanie
                            </h2>
                            <p className={styles.step__description}>
                                Sprawdź swoje dane przed wysłaniem. Możesz wrócić do poprzednich kroków, aby coś zmienić.
                            </p>

                            <div className={styles.summary}>
                                <div className={styles.summary__section}>
                                    <h4 className={styles.summary__title}>Dane podstawowe</h4>
                                    <div className={styles.summary__grid}>
                                        <div>
                                            <span className={styles.summary__label}>Imię i nazwisko</span>
                                            <span className={styles.summary__value}>
                                                {formData.firstName} {formData.lastName}
                                            </span>
                                        </div>
                                        <div>
                                            <span className={styles.summary__label}>Email</span>
                                            <span className={styles.summary__value}>{formData.email}</span>
                                        </div>
                                        <div>
                                            <span className={styles.summary__label}>Telefon</span>
                                            <span className={styles.summary__value}>{formData.phone || "—"}</span>
                                        </div>
                                        <div>
                                            <span className={styles.summary__label}>Województwo</span>
                                            <span className={styles.summary__value}>{formData.province}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.summary__section}>
                                    <h4 className={styles.summary__title}>Zainteresowania i rozwój</h4>
                                    <div className={styles.summary__grid}>
                                        <div>
                                            <span className={styles.summary__label}>Obszary rozwoju</span>
                                            <div className={styles.summary__tags}>
                                                {formData.developmentAreas.map((area) => (
                                                    <span key={area} className={styles.summary__tag}>
                                                        {DEVELOPMENT_AREA_LABELS[area]}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <span className={styles.summary__label}>Poziom doświadczenia</span>
                                            <span className={styles.summary__value}>
                                                {EXPERIENCE_LABELS[formData.experience]}
                                            </span>
                                        </div>
                                        <div>
                                            <span className={styles.summary__label}>Umiejętności</span>
                                            <div className={styles.summary__tags}>
                                                {formData.skills.map((skill) => (
                                                    <span key={skill} className={styles.summary__tag}>
                                                        {skill}
                                                    </span>
                                                ))}
                                                {formData.skills.length === 0 && "—"}
                                            </div>
                                        </div>
                                        <div>
                                            <span className={styles.summary__label}>Dostępność</span>
                                            <span className={styles.summary__value}>
                                                {formData.availability || "—"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {(formData.salaContacts.length > 0 ||
                                    formData.mpContacts.length > 0 ||
                                    formData.institutionContacts.length > 0 ||
                                    formData.otherContacts.length > 0) && (
                                        <div className={styles.summary__section}>
                                            <h4 className={styles.summary__title}>Kontakty prywatne</h4>
                                            <div className={styles.summary__grid}>
                                                {formData.salaContacts.length > 0 && (
                                                    <div>
                                                        <span className={styles.summary__label}>Kontakty do sal</span>
                                                        <div className={styles.summary__tags}>
                                                            {formData.salaContacts.map((contact) => (
                                                                <span key={contact} className={styles.summary__tag}>
                                                                    {contact}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {formData.mpContacts.length > 0 && (
                                                    <div>
                                                        <span className={styles.summary__label}>Kontakty do posłów</span>
                                                        <div className={styles.summary__tags}>
                                                            {formData.mpContacts.map((contact) => (
                                                                <span key={contact} className={styles.summary__tag}>
                                                                    {contact}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {formData.institutionContacts.length > 0 && (
                                                    <div>
                                                        <span className={styles.summary__label}>Kontakty do instytucji</span>
                                                        <div className={styles.summary__tags}>
                                                            {formData.institutionContacts.map((contact) => (
                                                                <span key={contact} className={styles.summary__tag}>
                                                                    {contact}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {formData.otherContacts.length > 0 && (
                                                    <div>
                                                        <span className={styles.summary__label}>Inne kontakty</span>
                                                        <div className={styles.summary__tags}>
                                                            {formData.otherContacts.map((contact) => (
                                                                <span key={contact} className={styles.summary__tag}>
                                                                    {contact}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {formData.description && (
                                    <div className={styles.summary__section}>
                                        <h4 className={styles.summary__title}>Opis</h4>
                                        <p className={styles.summary__text}>{formData.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Przyciski nawigacji */}
                    <div className={styles.navigation}>
                        <button
                            type="button"
                            className={`${styles.nav__btn} ${styles.nav__btnPrev}`}
                            onClick={prevStep}
                            disabled={step === 1}
                        >
                            Poprzedni
                        </button>

                        {step < totalSteps ? (
                            <button
                                type="button"
                                className={`${styles.nav__btn} ${styles.nav__btnNext}`}
                                onClick={nextStep}
                                disabled={!isStepValid()}
                            >
                                Dalej
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                className={`${styles.nav__btn} ${styles.nav__btnSubmit}`}
                                onClick={handleSubmit}
                                disabled={!isStepValid()}
                            >
                                <CheckCircle size={18} />
                                Zakończ
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}