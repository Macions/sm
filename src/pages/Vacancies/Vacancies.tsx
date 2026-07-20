import { useState, useMemo, useEffect } from "react";
import {
	Briefcase,
	Search,
	X,
	Filter,
	Grid,
	List,
	User as UserIcon,
	Clock,
	CheckCircle,
	Eye,
	Edit,
	Trash2,
	Plus,
	Send,
	Users,
	Calendar,
	Mail,
	Sparkles,
	Video,
	Camera,
	Megaphone,
	Globe,
	Link2,
	Award,
	Target,
	TrendingUp,
	ChevronRight,
	Check,
	UserPlus,
	BookOpen,
	Code,
	Music,
	Palette,
	Smartphone,
	Zap,
	Star,
	Heart,
	MessageCircle,
	Share2,
	FolderOpen,
	Settings,
	Tag,
	FileText,
} from "lucide-react";
import styles from "./Vacancies.module.css";

// ---------------------------------------------------------------------------
// TYPY
// ---------------------------------------------------------------------------

type VacancyStatus = "active" | "recruiting" | "filled";

type User = {
	id: string;
	name: string;
	role: "admin" | "coordinator" | "member";
	teamId?: string;
};

type RecruitmentType = "form" | "messenger" | "internal";

type FormQuestion = {
	id: string;
	question: string;
	type: "text" | "number" | "textarea" | "select" | "checkbox";
	required: boolean;
	options?: string[]; // dla typu select
};

type Vacancy = {
	id: string;
	title: string;
	icon: string;
	description: string;
	responsibilities: string[];
	requirements: string[];
	niceToHave?: string[];
	team: string;
	teamId: string;
	pillar?: string;
	contactPerson: {
		name: string;
		email: string;
		phone?: string;
	};
	createdAt: string;
	status: VacancyStatus;
	applicants?: string[];
	filledBy?: string;
	attachments?: {
		id: string;
		name: string;
		size: number;
		type: string;
		url: string;
		uploadedAt: string;
	}[];
	// NOWE POLA DLA REKRUTACJI
	recruitment: {
		type: RecruitmentType;
		formUrl?: string; // dla typu "form"
		messengerContact?: string; // dla typu "messenger"
		questions?: FormQuestion[]; // dla typu "internal"
		deadline: string; // data i godzina zakończenia rekrutacji
	};
};

type Application = {
	id: string;
	vacancyId: string;
	userId: string;
	userName: string;
	userEmail: string;
	message?: string;
	appliedAt: string;
	status: "pending" | "reviewed" | "accepted" | "rejected";
	answers?: Record<string, string>; // odpowiedzi na pytania
};

// ---------------------------------------------------------------------------
// DANE PRZYKŁADOWE
// ---------------------------------------------------------------------------

const MOCK_USER: User = {
	id: "1",
	name: "Jan Kowalski",
	role: "admin",
	teamId: "project",
};
const MOCK_MEMBERS = [
	{ id: "1", name: "Maksym Marczak", email: "maksym.marczak@silamlodych.pl" },
	{
		id: "2",
		name: "Krzysztof Korbut",
		email: "krzysztof.korbut@silamlodych.pl",
	},
	{ id: "3", name: "Zosia Wartacz", email: "zosia.wartacz@silamlodych.pl" },
	{
		id: "4",
		name: "Adrian Wróblewski",
		email: "adrian.wroblewski@silamlodych.pl",
	},
	{ id: "5", name: "Jan Augustynak", email: "jan.augustynak@silamlodych.pl" },
	{ id: "6", name: "Igor Piskórz", email: "igor.piskorz@silamlodych.pl" },
	{ id: "7", name: "Maja Melerska", email: "maja.melerska@silamlodych.pl" },
	{ id: "8", name: "Maja Kądziela", email: "maja.kadziela@silamlodych.pl" },
	{ id: "9", name: "Emilia Dobias", email: "emilia.dobias@silamlodych.pl" },
	{
		id: "10",
		name: "Jakub Patrowicz",
		email: "jakub.patrowicz@silamlodych.pl",
	},
	{ id: "11", name: "Jan Kowalski", email: "jan.kowalski@silamlodych.pl" },
];
const DEFAULT_PILLARS = [
	"Filar Projektowy",
	"Filar Konferencyjny",
	"Filar Symulacyjny",
	"Filar Rzeczniczy",
];

const MOCK_VACANCIES: Vacancy[] = [
	{
		id: "1",
		title: "Koordynator Filaru Projektowego",
		icon: "Target",
		description:
			"Osoba odpowiedzialna za koordynację działań w ramach Filaru Projektowego, nadzorująca realizację projektów i inicjatyw organizacyjnych.",
		responsibilities: [
			"Koordynacja prac zespołów projektowych",
			"Nadzór nad harmonogramami i terminami realizacji",
			"Raportowanie postępów do Zarządu",
			"Organizacja spotkań i warsztatów projektowych",
		],
		requirements: [
			"Doświadczenie w zarządzaniu projektami",
			"Umiejętność pracy zespołowej",
			"Dobra organizacja pracy",
			"Komunikatywność",
		],
		niceToHave: [
			"Certyfikat zarządzania projektami (PRINCE2, Agile)",
			"Znajomość narzędzi do zarządzania projektami",
		],
		team: "Filar Projektowy",
		teamId: "project",
		pillar: "Filar Projektowy",
		contactPerson: {
			name: "Maksym Marczak",
			email: "maksym.marczak@silamlodych.pl",
			phone: "+48 123 456 789",
		},
		createdAt: "2024-12-01",
		status: "active",
		applicants: ["2", "3"],
		recruitment: {
			// <-- DODAJ TO
			type: "internal",
			deadline: "2026-12-31T23:59",
			questions: [],
		},
	},
	{
		id: "2",
		title: "Opiekun TikToka",
		icon: "Video",
		description:
			"Osoba odpowiedzialna za prowadzenie i rozwój profilu Siły Młodych na TikToku, tworzenie angażujących treści i budowanie społeczności.",
		responsibilities: [
			"Tworzenie i planowanie contentu na TikToka",
			"Monitorowanie trendów i nowości na platformie",
			"Analiza statystyk i optymalizacja treści",
			"Współpraca z zespołem Social Media",
		],
		requirements: [
			"Znajomość platformy TikTok",
			"Umiejętność tworzenia angażujących treści wideo",
			"Kreatywność",
			"Znajomość podstaw montażu wideo",
		],
		niceToHave: [
			"Doświadczenie w prowadzeniu profili na TikTok",
			"Umiejętność obsługi programów do montażu",
		],
		team: "Zespół TikToka",
		teamId: "tiktok",
		pillar: "Zespół TikToka",
		contactPerson: {
			name: "Maja Kądziela",
			email: "maja.kadziela@silamlodych.pl",
		},
		createdAt: "2024-12-05",
		status: "recruiting",
		applicants: ["4", "5", "6"],
		recruitment: {
			type: "internal",
			deadline: "2026-12-31T23:59",
			questions: [
				// <-- DODAJ PYTANIA
				{
					id: "q1",
					question: "Jakie masz doświadczenie w zarządzaniu projektami?",
					type: "textarea",
					required: true,
				},
				{
					id: "q2",
					question: "Czy masz certyfikat zarządzania projektami?",
					type: "select",
					required: false,
					options: [
						"Tak, mam",
						"Nie, ale chcę zdobyć",
						"Nie interesuje mnie to",
					],
				},
				{
					id: "q3",
					question: "Ile godzin tygodniowo możesz poświęcić?",
					type: "number",
					required: true,
				},
			],
		},
	},
	{
		id: "3",
		title: "Opiekun Instagrama",
		icon: "Smartphone",
		description:
			"Osoba odpowiedzialna za prowadzenie profilu Siły Młodych na Instagramie, tworzenie atrakcyjnych wizualnie treści i budowanie zaangażowania społeczności.",
		responsibilities: [
			"Planowanie i tworzenie contentu na Instagram",
			"Tworzenie Stories i Reels",
			"Interakcja z obserwującymi",
			"Współpraca z zespołem Social Media",
		],
		requirements: [
			"Znajomość platformy Instagram",
			"Umiejętność tworzenia atrakcyjnych wizualnie treści",
			"Kreatywność",
			"Znajomość Canvy lub podobnych narzędzi",
		],
		niceToHave: [
			"Doświadczenie w prowadzeniu profili na Instagram",
			"Umiejętność obsługi programów graficznych",
		],
		team: "Social Media",
		teamId: "social-media",
		pillar: "Social Media",
		contactPerson: {
			name: "Maja Melerska",
			email: "maja.melerska@silamlodych.pl",
			phone: "+48 123 456 780",
		},
		createdAt: "2024-12-10",
		status: "active",
		applicants: ["7"],
		recruitment: {
			// <-- DODAJ TO
			type: "internal",
			deadline: "2026-12-31T23:59",
			questions: [],
		},
	},
	{
		id: "4",
		title: "Montażysta Materiałów Wideo",
		icon: "Camera",
		description:
			"Osoba odpowiedzialna za montaż i postprodukcję materiałów wideo wykorzystywanych w działaniach organizacji.",
		responsibilities: [
			"Montaż materiałów wideo z wydarzeń",
			"Tworzenie krótkich form wideo na social media",
			"Postprodukcja - korekcja koloru, dźwięk",
			"Archwizacja i zarządzanie materiałami wideo",
		],
		requirements: [
			"Znajomość programów do montażu wideo",
			"Umiejętność tworzenia angażujących treści",
			"Kreatywność",
			"Dobra organizacja pracy",
		],
		niceToHave: [
			"Doświadczenie w montażu wideo",
			"Znajomość After Effects lub podobnych narzędzi",
		],
		team: "Zespół TikToka",
		teamId: "tiktok",
		pillar: "Zespół TikToka",
		contactPerson: {
			name: "Maja Kądziela",
			email: "maja.kadziela@silamlodych.pl",
		},
		createdAt: "2024-12-15",
		status: "active",
		applicants: [],
		recruitment: {
			// <-- DODAJ TO
			type: "internal",
			deadline: "2026-12-31T23:59",
			questions: [],
		},
	},
	{
		id: "5",
		title: "Grafik",
		icon: "Palette",
		description:
			"Osoba odpowiedzialna za tworzenie grafik i materiałów wizualnych wykorzystywanych w działaniach organizacji.",
		responsibilities: [
			"Tworzenie grafik na social media",
			"Projektowanie materiałów promocyjnych",
			"Tworzenie identyfikacji wizualnej dla projektów",
			"Współpraca z zespołem Social Media",
		],
		requirements: [
			"Znajomość programów graficznych",
			"Umiejętność tworzenia atrakcyjnych wizualnie treści",
			"Kreatywność",
			"Dobra komunikacja",
		],
		niceToHave: [
			"Doświadczenie w projektowaniu graficznym",
			"Znajomość Figmy lub podobnych narzędzi",
		],
		team: "Social Media",
		teamId: "social-media",
		pillar: "Social Media",
		contactPerson: {
			name: "Maja Melerska",
			email: "maja.melerska@silamlodych.pl",
			phone: "+48 123 456 780",
		},
		createdAt: "2024-12-20",
		status: "active",
		applicants: ["8"],
		recruitment: {
			// <-- DODAJ TO
			type: "internal",
			deadline: "2026-12-31T23:59",
			questions: [],
		},
	},
	{
		id: "6",
		title: "Osoba ds. Kontaktu z Partnerami",
		icon: "Megaphone",
		description:
			"Osoba odpowiedzialna za budowanie i utrzymywanie relacji z partnerami organizacji, pozyskiwanie nowych współprac.",
		responsibilities: [
			"Identyfikacja potencjalnych partnerów",
			"Prowadzenie rozmów z partnerami",
			"Przygotowywanie ofert współpracy",
			"Utrzymywanie bazy partnerów",
		],
		requirements: [
			"Umiejętności komunikacyjne",
			"Zdolności negocjacyjne",
			"Znajomość rynku partnerskiego",
			"Dobra organizacja pracy",
		],
		niceToHave: [
			"Doświadczenie w pozyskiwaniu partnerów",
			"Znajomość języka angielskiego",
		],
		team: "Zarząd",
		teamId: "board",
		pillar: "Zarząd",
		contactPerson: {
			name: "Maksym Marczak",
			email: "maksym.marczak@silamlodych.pl",
			phone: "+48 123 456 789",
		},
		createdAt: "2025-01-05",
		status: "active",
		applicants: ["9"],
		recruitment: {
			// <-- DODAJ TO
			type: "internal",
			deadline: "2026-12-31T23:59",
			questions: [],
		},
	},
	{
		id: "7",
		title: "Członek Zespołu Social Media",
		icon: "MessageCircle",
		description:
			"Osoba wspierająca działania zespołu Social Media w prowadzeniu profili i tworzeniu treści.",
		responsibilities: [
			"Pomoc w tworzeniu contentu",
			"Monitorowanie mediów społecznościowych",
			"Interakcja z społecznością",
			"Wsparcie w planowaniu działań",
		],
		requirements: [
			"Znajomość mediów społecznościowych",
			"Kreatywność",
			"Umiejętność pracy zespołowej",
		],
		niceToHave: [
			"Doświadczenie w prowadzeniu social media",
			"Znajomość narzędzi do zarządzania social media",
		],
		team: "Social Media",
		teamId: "social-media",
		pillar: "Social Media",
		contactPerson: {
			name: "Maja Melerska",
			email: "maja.melerska@silamlodych.pl",
		},
		createdAt: "2025-01-10",
		status: "recruiting",
		applicants: ["10"],
		recruitment: {
			// <-- DODAJ TO
			type: "internal",
			deadline: "2026-12-31T23:59",
			questions: [],
		},
	},
	{
		id: "8",
		title: "Koordynator Filaru Konferencyjnego",
		icon: "Sparkles",
		description:
			"Osoba odpowiedzialna za koordynację działań w ramach Filaru Konferencyjnego, organizację konferencji i wydarzeń.",
		responsibilities: [
			"Organizacja konferencji i wydarzeń",
			"Zarządzanie budżetem wydarzeń",
			"Koordynacja zespołów konferencyjnych",
			"Raportowanie do Zarządu",
		],
		requirements: [
			"Doświadczenie w organizacji wydarzeń",
			"Umiejętność zarządzania zespołem",
			"Dobra organizacja pracy",
			"Komunikatywność",
		],
		niceToHave: [
			"Doświadczenie w organizacji konferencji",
			"Znajomość narzędzi do zarządzania wydarzeniami",
		],
		team: "Filar Konferencyjny",
		teamId: "conference",
		pillar: "Filar Konferencyjny",
		contactPerson: {
			name: "Adrian Wróblewski",
			email: "adrian.wroblewski@silamlodych.pl",
			phone: "+48 123 456 784",
		},
		createdAt: "2025-01-15",
		status: "active",
		applicants: [],
		recruitment: {
			// <-- DODAJ TO
			type: "internal",
			deadline: "2026-12-31T23:59",
			questions: [],
		},
	},
	{
		id: "9",
		title: "Koordynator Filaru Rzeczniczego",
		icon: "Award",
		description:
			"Osoba odpowiedzialna za koordynację działań rzeczniczych organizacji, reprezentowanie stanowisk i kontakt z mediami.",
		responsibilities: [
			"Przygotowywanie stanowisk i komunikatów",
			"Kontakt z mediami",
			"Koordynacja działań rzeczniczych",
			"Współpraca z Zarządem",
		],
		requirements: [
			"Umiejętności komunikacyjne",
			"Znajomość mediów",
			"Zdolności analityczne",
			"Dobra organizacja pracy",
		],
		niceToHave: [
			"Doświadczenie w rzecznictwie",
			"Znajomość języka angielskiego",
		],
		team: "Filar Rzeczniczy",
		teamId: "advocacy",
		pillar: "Filar Rzeczniczy",
		contactPerson: {
			name: "Jan Augustynak",
			email: "jan.augustynak@silamlodych.pl",
			phone: "+48 123 456 782",
		},
		createdAt: "2025-01-20",
		status: "filled",
		applicants: ["11"],
		filledBy: "11",
		recruitment: {
			// <-- DODAJ TO
			type: "internal",
			deadline: "2026-12-31T23:59",
			questions: [],
		},
	},
	{
		id: "10",
		title: "Opiekun Mediów Społecznościowych",
		icon: "Share2",
		description:
			"Osoba odpowiedzialna za nadzór nad wszystkimi profilami social media organizacji.",
		responsibilities: [
			"Nadzór nad treściami publikowanymi w social media",
			"Zarządzanie strategią social media",
			"Analiza efektywności działań",
			"Koordynacja zespołu social media",
		],
		requirements: [
			"Doświadczenie w prowadzeniu social media",
			"Znajomość strategii social media",
			"Umiejętność zarządzania zespołem",
			"Analityczne myślenie",
		],
		niceToHave: [
			"Doświadczenie w zarządzaniu social media",
			"Znajomość narzędzi do analizy social media",
		],
		team: "Social Media",
		teamId: "social-media",
		pillar: "Social Media",
		contactPerson: {
			name: "Maja Melerska",
			email: "maja.melerska@silamlodych.pl",
			phone: "+48 123 456 780",
		},
		createdAt: "2025-02-01",
		status: "active",
		applicants: [],
		recruitment: {
			// <-- DODAJ TO
			type: "internal",
			deadline: "2026-12-31T23:59",
			questions: [],
		},
	},
];

const MOCK_APPLICATIONS: Application[] = [
	{
		id: "1",
		vacancyId: "1",
		userId: "2",
		userName: "Krzysztof Korbut",
		userEmail: "krzysztof.korbut@silamlodych.pl",
		message:
			"Jestem zainteresowany tą funkcją, mam doświadczenie w zarządzaniu projektami.",
		appliedAt: "2024-12-02",
		status: "pending",
	},
	{
		id: "2",
		vacancyId: "1",
		userId: "3",
		userName: "Zosia Wartacz",
		userEmail: "zosia.wartacz@silamlodych.pl",
		message: "Chętnie podejmę to wyzwanie!",
		appliedAt: "2024-12-03",
		status: "reviewed",
	},
	{
		id: "3",
		vacancyId: "2",
		userId: "4",
		userName: "Adrian Wróblewski",
		userEmail: "adrian.wroblewski@silamlodych.pl",
		message: "Mam doświadczenie w tworzeniu treści na TikTok.",
		appliedAt: "2024-12-06",
		status: "pending",
	},
	{
		id: "4",
		vacancyId: "2",
		userId: "5",
		userName: "Jan Augustynak",
		userEmail: "jan.augustynak@silamlodych.pl",
		message: "Chciałbym rozwijać się w social media.",
		appliedAt: "2024-12-07",
		status: "pending",
	},
	{
		id: "5",
		vacancyId: "2",
		userId: "6",
		userName: "Igor Piskórz",
		userEmail: "igor.piskorz@silamlodych.pl",
		message: "Mam pomysły na angażujące treści na TikTok!",
		appliedAt: "2024-12-08",
		status: "accepted",
	},
];

// ---------------------------------------------------------------------------
// MAPOWANIE I IKONY
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<VacancyStatus, string> = {
	active: "Aktywny",
	recruiting: "W trakcie rekrutacji",
	filled: "Obsadzony",
};

const STATUS_COLORS: Record<VacancyStatus, string> = {
	active: styles.statusActive,
	recruiting: styles.statusRecruiting,
	filled: styles.statusFilled,
};

const STATUS_ICONS: Record<VacancyStatus, React.ReactNode> = {
	active: <CheckCircle size={14} />,
	recruiting: <Clock size={14} />,
	filled: <Check size={14} />,
};

// Mapowanie nazw ikon na komponenty
const ICON_MAP: Record<
	string,
	React.ComponentType<{ size?: number; className?: string }>
> = {
	Briefcase: Briefcase,
	Target: Target,
	Video: Video,
	Smartphone: Smartphone,
	Camera: Camera,
	Palette: Palette,
	Megaphone: Megaphone,
	MessageCircle: MessageCircle,
	Sparkles: Sparkles,
	Award: Award,
	Share2: Share2,
	Globe: Globe,
	Zap: Zap,
	Star: Star,
	Heart: Heart,
	TrendingUp: TrendingUp,
	Code: Code,
	Music: Music,
	BookOpen: BookOpen,
	Users: Users,
	UserPlus: UserPlus,
	FolderOpen: FolderOpen,
	Settings: Settings,
	Tag: Tag,
};
const ICON_LABELS: Record<string, string> = {
	Briefcase: "Teczka",
	Target: "Cel",
	Video: "Kamera wideo",
	Smartphone: "Telefon",
	Camera: "Aparat",
	Palette: "Paleta",
	Megaphone: "Megafon",
	MessageCircle: "Wiadomość",
	Sparkles: "Gwiazdy",
	Award: "Nagroda",
	Share2: "Udostępnianie",
	Globe: "Globus",
	Zap: "Błyskawica",
	Star: "Gwiazda",
	Heart: "Serce",
	TrendingUp: "Wzrost",
	Code: "Kod",
	Music: "Muzyka",
	BookOpen: "Książka",
	Users: "Grupa użytkowników",
	UserPlus: "Dodaj użytkownika",
	FolderOpen: "Otwarty folder",
	Settings: "Ustawienia",
	Tag: "Tag",
};

// ---------------------------------------------------------------------------
// KOMPONENT KARTY WAKATU
// ---------------------------------------------------------------------------

interface VacancyCardProps {
	vacancy: Vacancy;
	currentUser: User;
	onView: (vacancy: Vacancy) => void;
	onEdit?: (vacancy: Vacancy) => void;
	onDelete?: (vacancy: Vacancy) => void;
	onApply: (vacancy: Vacancy) => void;
	viewMode: "grid" | "list";
	hasApplied?: boolean;
}

function VacancyCard({
	vacancy,
	currentUser,
	onView,
	onEdit,
	onDelete,
	onApply,
	viewMode,
	hasApplied = false,
}: VacancyCardProps) {
	const IconComponent = ICON_MAP[vacancy.icon] || Briefcase;
	const canManage = currentUser.role === "admin";
	const isFilled = vacancy.status === "filled";
	const isRecruiting = vacancy.status === "recruiting";

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString("pl-PL", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	if (viewMode === "list") {
		return (
			<div className={`${styles.vacancyCard} ${styles.vacancyCardList}`}>
				<div className={styles.vacancyCard__iconWrapper}>
					<IconComponent size={32} className={styles.vacancyCard__icon} />
				</div>
				<div className={styles.vacancyCard__info}>
					<div className={styles.vacancyCard__header}>
						<h3 className={styles.vacancyCard__title}>{vacancy.title}</h3>
						<span
							className={`${styles.vacancyCard__status} ${STATUS_COLORS[vacancy.status]}`}
						>
							{STATUS_ICONS[vacancy.status]}
							{STATUS_LABELS[vacancy.status]}
						</span>
					</div>
					<p className={styles.vacancyCard__description}>
						{vacancy.description}
					</p>
					<div className={styles.vacancyCard__meta}>
						<span className={styles.vacancyCard__team}>
							<Users size={14} />
							{vacancy.team}
						</span>
						{vacancy.pillar && (
							<span className={styles.vacancyCard__pillar}>
								<Tag size={14} />
								{vacancy.pillar}
							</span>
						)}
						<span className={styles.vacancyCard__date}>
							<Calendar size={14} />
							Dodano: {formatDate(vacancy.createdAt)}
						</span>
						<span className={styles.vacancyCard__applicants}>
							<UserPlus size={14} />
							{vacancy.applicants?.length || 0} zgłoszeń
						</span>
					</div>
					{/* Informacja o rekrutacji */}
					{vacancy.recruitment && (
						<div className={styles.vacancyCard__recruitment}>
							{vacancy.recruitment.deadline && (
								<span className={styles.vacancyCard__deadline}>
									<Clock size={14} />
									Zgłoszenia do:{" "}
									{new Date(vacancy.recruitment.deadline).toLocaleString(
										"pl-PL",
									)}
								</span>
							)}
							<span className={styles.vacancyCard__recruitmentType}>
								{vacancy.recruitment.type === "form" && "📋 Formularz"}
								{vacancy.recruitment.type === "messenger" && "💬 Messenger"}
								{vacancy.recruitment.type === "internal" && "📝 Formularz"}
							</span>
						</div>
					)}
				</div>
				<div className={styles.vacancyCard__actions}>
					<button
						className={styles.vacancyCard__actionBtn}
						onClick={() => onView(vacancy)}
						title="Szczegóły"
					>
						<Eye size={16} />
					</button>
					{canManage && (
						<>
							<button
								className={styles.vacancyCard__actionBtn}
								onClick={() => onEdit?.(vacancy)}
								title="Edytuj"
							>
								<Edit size={16} />
							</button>
							<button
								className={`${styles.vacancyCard__actionBtn} ${styles.vacancyCard__actionBtnDanger}`}
								onClick={() => onDelete?.(vacancy)}
								title="Usuń"
							>
								<Trash2 size={16} />
							</button>
						</>
					)}
					{!isFilled && !hasApplied && (
						<button
							className={styles.vacancyCard__applyBtn}
							onClick={() => onApply(vacancy)} // <-- ZMIEŃ na onApply
							disabled={isRecruiting}
						>
							<Send size={14} />
							Zgłoś się
						</button>
					)}
					{hasApplied && (
						<span className={styles.vacancyCard__appliedBadge}>
							<Check size={14} />
							Zgłoszono
						</span>
					)}
				</div>
			</div>
		);
	}

	return (
		<div
			className={`${styles.vacancyCard} ${isFilled ? styles.vacancyCardFilled : ""}`}
		>
			<div className={styles.vacancyCard__iconWrapper}>
				<IconComponent size={40} className={styles.vacancyCard__icon} />
			</div>
			<div className={styles.vacancyCard__content}>
				<div className={styles.vacancyCard__header}>
					<h3 className={styles.vacancyCard__title}>{vacancy.title}</h3>
					<span
						className={`${styles.vacancyCard__status} ${STATUS_COLORS[vacancy.status]}`}
					>
						{STATUS_ICONS[vacancy.status]}
						{STATUS_LABELS[vacancy.status]}
					</span>
				</div>
				<p className={styles.vacancyCard__description}>{vacancy.description}</p>
				<div className={styles.vacancyCard__meta}>
					<span className={styles.vacancyCard__team}>
						<Users size={14} />
						{vacancy.team}
					</span>
					{vacancy.pillar && (
						<span className={styles.vacancyCard__pillar}>
							<Tag size={14} />
							{vacancy.pillar}
						</span>
					)}
					<span className={styles.vacancyCard__applicants}>
						<UserPlus size={14} />
						{vacancy.applicants?.length || 0} zgłoszeń
					</span>
				</div>
				{/* Informacja o rekrutacji */}
				{vacancy.recruitment && (
					<div className={styles.vacancyCard__recruitment}>
						{vacancy.recruitment.deadline && (
							<span className={styles.vacancyCard__deadline}>
								<Clock size={14} />
								Zgłoszenia do:{" "}
								{new Date(vacancy.recruitment.deadline).toLocaleString("pl-PL")}
							</span>
						)}
						<span className={styles.vacancyCard__recruitmentType}>
							{vacancy.recruitment.type === "form" && "📋 Formularz"}
							{vacancy.recruitment.type === "messenger" && "💬 Messenger"}
							{vacancy.recruitment.type === "internal" && "📝 Formularz"}
						</span>
					</div>
				)}
				<div className={styles.vacancyCard__footer}>
					<span className={styles.vacancyCard__date}>
						<Calendar size={14} />
						{formatDate(vacancy.createdAt)}
					</span>
					<div className={styles.vacancyCard__actions}>
						<button
							className={styles.vacancyCard__actionBtn}
							onClick={() => onView(vacancy)}
							title="Szczegóły"
						>
							<Eye size={16} />
						</button>
						{canManage && (
							<>
								<button
									className={styles.vacancyCard__actionBtn}
									onClick={() => onEdit?.(vacancy)}
									title="Edytuj"
								>
									<Edit size={16} />
								</button>
								<button
									className={`${styles.vacancyCard__actionBtn} ${styles.vacancyCard__actionBtnDanger}`}
									onClick={() => onDelete?.(vacancy)}
									title="Usuń"
								>
									<Trash2 size={16} />
								</button>
							</>
						)}
						{!isFilled && !hasApplied && (
							<button
								className={styles.vacancyCard__applyBtn}
								onClick={() => onApply(vacancy)}
								disabled={isRecruiting}
							>
								<Send size={14} />
								Zgłoś się
							</button>
						)}
						{hasApplied && (
							<span className={styles.vacancyCard__appliedBadge}>
								<Check size={14} />
								Zgłoszono
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
// ---------------------------------------------------------------------------
// MODAL ZGŁOSZENIA KANDYDATURY
// ---------------------------------------------------------------------------

interface ApplyModalProps {
	isOpen: boolean;
	vacancy: Vacancy | null;
	currentUser: User;
	onClose: () => void;
	onSubmit: (
		vacancy: Vacancy,
		answers: Record<string, string>,
		message: string,
	) => void;
}

function ApplyModal({
	isOpen,
	vacancy,
	onClose,
	onSubmit,
}: ApplyModalProps) {
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [message, setMessage] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});

	if (!isOpen || !vacancy) return null;

	const isInternal = vacancy.recruitment?.type === "internal";
	const questions = vacancy.recruitment?.questions || [];

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (isInternal) {
			questions.forEach((q) => {
				if (q.required && !answers[q.id]?.trim()) {
					newErrors[q.id] = "To pytanie jest wymagane";
				}
			});
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			// Przewiń do pierwszego błędu
			const firstError = document.querySelector(".apply-error");
			if (firstError) {
				firstError.scrollIntoView({ behavior: "smooth", block: "center" });
			}
			return;
		}

		if (
			window.confirm(
				`Czy chcesz zgłosić swoją kandydaturę na stanowisko "${vacancy.title}"?`,
			)
		) {
			onSubmit(vacancy, answers, message);
			onClose();
		}
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div
				className={`${styles.modal} ${styles.modalForm}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modal__header}>
					<div className={styles.modal__headerLeft}>
						<Briefcase size={24} className={styles.modal__icon} />
						<h2 className={styles.modal__title}>
							Zgłoszenie na stanowisko: {vacancy.title}
						</h2>
					</div>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__body}>
						{/* Informacje o rekrutacji */}
						<div className={styles.modal__section}>
							<div className={styles.modal__infoGrid}>
								<div className={styles.modal__infoItem}>
									<Clock size={16} />
									<span>
										Zgłoszenia do:{" "}
										<strong>
											{new Date(vacancy.recruitment.deadline).toLocaleString(
												"pl-PL",
											)}
										</strong>
									</span>
								</div>
								<div className={styles.modal__infoItem}>
									<Briefcase size={16} />
									<span>
										Typ rekrutacji:{" "}
										<strong>
											{vacancy.recruitment.type === "form" &&
												"Formularz zewnętrzny"}
											{vacancy.recruitment.type === "messenger" &&
												"Wiadomość na Messengerze"}
											{vacancy.recruitment.type === "internal" &&
												"Formularz na stronie"}
										</strong>
									</span>
								</div>
							</div>
						</div>

						{/* Dla typu "form" - przekierowanie */}
						{vacancy.recruitment.type === "form" &&
							vacancy.recruitment.formUrl && (
								<div className={styles.modal__section}>
									<div className={styles.applyInfoBox}>
										<p>
											Rekrutacja odbywa się przez zewnętrzny formularz. Kliknij
											poniższy link, aby przejść do formularza.
										</p>
										<a
											href={vacancy.recruitment.formUrl}
											target="_blank"
											rel="noopener noreferrer"
											className={styles.applyExternalLink}
										>
											<Link2 size={16} />
											Przejdź do formularza
										</a>
										<button
											type="button"
											className={styles.modal__btnCancel}
											onClick={onClose}
											style={{ marginTop: "12px" }}
										>
											Zamknij
										</button>
									</div>
								</div>
							)}

						{/* Dla typu "messenger" - kontakt */}
						{vacancy.recruitment.type === "messenger" &&
							vacancy.recruitment.messengerContact && (
								<div className={styles.modal__section}>
									<div className={styles.applyInfoBox}>
										<p>
											Rekrutacja odbywa się przez Messenger. Skontaktuj się z
											osobą odpowiedzialną:
										</p>
										<div className={styles.applyContactInfo}>
											<UserIcon size={20} />
											<strong>{vacancy.recruitment.messengerContact}</strong>
										</div>
										<button
											type="button"
											className={styles.modal__btnCancel}
											onClick={onClose}
											style={{ marginTop: "12px" }}
										>
											Zamknij
										</button>
									</div>
								</div>
							)}

						{/* Dla typu "internal" - formularz z pytaniami */}
						{vacancy.recruitment.type === "internal" && (
							<>
								{/* Pytania */}
								{questions.length > 0 && (
									<div className={styles.modal__section}>
										<h3 className={styles.modal__sectionTitle}>
											Pytania do kandydata
										</h3>
										{questions.map((q) => (
											<div key={q.id} className={styles.applyQuestion}>
												<label className={styles.modal__label}>
													{q.question}
													{q.required && (
														<span className={styles.requiredStar}>*</span>
													)}
												</label>

												{q.type === "text" && (
													<input
														type="text"
														className={`${styles.modal__input} ${errors[q.id] ? styles.modal__inputError : ""}`}
														value={answers[q.id] || ""}
														onChange={(e) => {
															setAnswers({
																...answers,
																[q.id]: e.target.value,
															});
															if (errors[q.id])
																setErrors({ ...errors, [q.id]: "" });
														}}
														placeholder="Twoja odpowiedź..."
													/>
												)}

												{q.type === "number" && (
													<input
														type="number"
														className={`${styles.modal__input} ${errors[q.id] ? styles.modal__inputError : ""}`}
														value={answers[q.id] || ""}
														onChange={(e) => {
															setAnswers({
																...answers,
																[q.id]: e.target.value,
															});
															if (errors[q.id])
																setErrors({ ...errors, [q.id]: "" });
														}}
														placeholder="Twoja odpowiedź..."
													/>
												)}

												{q.type === "textarea" && (
													<textarea
														className={`${styles.modal__input} ${styles.modal__textarea} ${errors[q.id] ? styles.modal__inputError : ""}`}
														value={answers[q.id] || ""}
														onChange={(e) => {
															setAnswers({
																...answers,
																[q.id]: e.target.value,
															});
															if (errors[q.id])
																setErrors({ ...errors, [q.id]: "" });
														}}
														rows={3}
														placeholder="Twoja odpowiedź..."
													/>
												)}

												{q.type === "select" && q.options && (
													<select
														className={`${styles.modal__select} ${errors[q.id] ? styles.modal__inputError : ""}`}
														value={answers[q.id] || ""}
														onChange={(e) => {
															setAnswers({
																...answers,
																[q.id]: e.target.value,
															});
															if (errors[q.id])
																setErrors({ ...errors, [q.id]: "" });
														}}
													>
														<option value="">Wybierz...</option>
														{q.options.map((opt) => (
															<option key={opt} value={opt}>
																{opt}
															</option>
														))}
													</select>
												)}

												{q.type === "checkbox" && (
													<div className={styles.applyCheckbox}>
														<input
															type="checkbox"
															checked={answers[q.id] === "true"}
															onChange={(e) => {
																setAnswers({
																	...answers,
																	[q.id]: e.target.checked ? "true" : "false",
																});
																if (errors[q.id])
																	setErrors({ ...errors, [q.id]: "" });
															}}
															id={`checkbox-${q.id}`}
														/>
														<label htmlFor={`checkbox-${q.id}`}>
															Tak, zgadzam się
														</label>
													</div>
												)}

												{errors[q.id] && (
													<span
														className={`${styles.modal__error} apply-error`}
													>
														{errors[q.id]}
													</span>
												)}
											</div>
										))}
									</div>
								)}

								{/* Wiadomość */}
								<div className={styles.modal__section}>
									<h3 className={styles.modal__sectionTitle}>Wiadomość</h3>
									<div className={styles.modal__field}>
										<label className={styles.modal__label}>
											Dodatkowa wiadomość (opcjonalnie)
										</label>
										<textarea
											className={styles.modal__input}
											value={message}
											onChange={(e) => setMessage(e.target.value)}
											rows={3}
											placeholder="Napisz coś o sobie, dlaczego chcesz dołączyć..."
										/>
									</div>
								</div>
							</>
						)}
					</div>

					{/* Przyciski - tylko dla typu "internal" */}
					{vacancy.recruitment.type === "internal" && (
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
									Wyślij zgłoszenie
								</button>
							</div>
						</div>
					)}
				</form>
			</div>
		</div>
	);
}
// ---------------------------------------------------------------------------
// MODAL SZCZEGÓŁÓW WAKATU
// ---------------------------------------------------------------------------

interface VacancyDetailModalProps {
	isOpen: boolean;
	vacancy: Vacancy | null;
	currentUser: User;
	onClose: () => void;
	onApply: (vacancy: Vacancy) => void;
	onOpenApply?: (vacancy: Vacancy) => void;
	hasApplied?: boolean;
	applications?: Application[]; // <-- DODAJ
}

function VacancyDetailModal({
	isOpen,
	vacancy,
	currentUser,
	onClose,
	onApply,
	onOpenApply,
	hasApplied = false,
	applications = [],
}: VacancyDetailModalProps) {
	if (!isOpen || !vacancy) return null;

	const IconComponent = ICON_MAP[vacancy.icon] || Briefcase;
	const isFilled = vacancy.status === "filled";
	const canManage = currentUser.role === "admin";

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString("pl-PL", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};
	const formatFileSize = (bytes: number): string => {
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		return (bytes / (1024 * 1024)).toFixed(1) + " MB";
	};
	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modal__header}>
					<div className={styles.modal__headerLeft}>
						<IconComponent size={32} className={styles.modal__icon} />
						<h2 className={styles.modal__title}>{vacancy.title}</h2>
					</div>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<div className={styles.modal__body}>
					<div className={styles.modal__statusRow}>
						<span
							className={`${styles.modal__status} ${STATUS_COLORS[vacancy.status]}`}
						>
							{STATUS_ICONS[vacancy.status]}
							{STATUS_LABELS[vacancy.status]}
						</span>
						<span className={styles.modal__date}>
							<Calendar size={14} />
							Dodano: {formatDate(vacancy.createdAt)}
						</span>
					</div>
					<div className={styles.modal__section}>
						<h3 className={styles.modal__sectionTitle}>Opis stanowiska</h3>
						<p className={styles.modal__description}>{vacancy.description}</p>
					</div>
					<div className={styles.modal__section}>
						<h3 className={styles.modal__sectionTitle}>Zakres obowiązków</h3>
						<ul className={styles.modal__list}>
							{vacancy.responsibilities.map((item, index) => (
								<li key={index} className={styles.modal__listItem}>
									<ChevronRight size={16} />
									{item}
								</li>
							))}
						</ul>
					</div>
					<div className={styles.modal__section}>
						<h3 className={styles.modal__sectionTitle}>Wymagania</h3>
						<ul className={styles.modal__list}>
							{vacancy.requirements.map((item, index) => (
								<li key={index} className={styles.modal__listItem}>
									<Check size={16} />
									{item}
								</li>
							))}
						</ul>
					</div>
					{vacancy.niceToHave && vacancy.niceToHave.length > 0 && (
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>Mile widziane</h3>
							<ul className={styles.modal__list}>
								{vacancy.niceToHave.map((item, index) => (
									<li key={index} className={styles.modal__listItem}>
										<Star size={16} />
										{item}
									</li>
								))}
							</ul>
						</div>
					)}
					<div className={styles.modal__section}>
						<h3 className={styles.modal__sectionTitle}>
							Informacje organizacyjne
						</h3>
						<div className={styles.modal__infoGrid}>
							<div className={styles.modal__infoItem}>
								<Users size={16} />
								<span>
									Zespół: <strong>{vacancy.team}</strong>
								</span>
							</div>
							{vacancy.pillar && (
								<div className={styles.modal__infoItem}>
									<Tag size={16} />
									<span>
										Filar: <strong>{vacancy.pillar}</strong>
									</span>
								</div>
							)}
							<div className={styles.modal__infoItem}>
								<UserIcon size={16} />{" "}
								<span>
									Kontakt: <strong>{vacancy.contactPerson.name}</strong>
								</span>
							</div>
							<div className={styles.modal__infoItem}>
								<Mail size={16} />
								<span>
									Email: <strong>{vacancy.contactPerson.email}</strong>
								</span>
							</div>
						</div>
					</div>
					{/* Informacje o rekrutacji */}
					{vacancy.recruitment && (
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>Rekrutacja</h3>
							<div className={styles.modal__infoGrid}>
								<div className={styles.modal__infoItem}>
									<Clock size={16} />
									<span>
										Termin zgłoszeń:{" "}
										<strong>
											{new Date(vacancy.recruitment.deadline).toLocaleString(
												"pl-PL",
											)}
										</strong>
									</span>
								</div>
								<div className={styles.modal__infoItem}>
									<Briefcase size={16} />
									<span>
										Typ:{" "}
										<strong>
											{vacancy.recruitment.type === "form" &&
												"Formularz zewnętrzny"}
											{vacancy.recruitment.type === "messenger" &&
												"Wiadomość na Messengerze"}
											{vacancy.recruitment.type === "internal" &&
												"Formularz na stronie"}
										</strong>
									</span>
								</div>
							</div>

							{vacancy.recruitment.type === "form" &&
								vacancy.recruitment.formUrl && (
									<div
										className={styles.modal__infoItem}
										style={{ marginTop: "8px" }}
									>
										<Link2 size={16} />
										<span>
											Link:{" "}
											<a
												href={vacancy.recruitment.formUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												{vacancy.recruitment.formUrl}
											</a>
										</span>
									</div>
								)}

							{vacancy.recruitment.type === "messenger" &&
								vacancy.recruitment.messengerContact && (
									<div
										className={styles.modal__infoItem}
										style={{ marginTop: "8px" }}
									>
										<UserIcon size={16} />
										<span>
											Kontakt na Messengerze:{" "}
											<strong>{vacancy.recruitment.messengerContact}</strong>
										</span>
									</div>
								)}

							{vacancy.recruitment.type === "internal" &&
								vacancy.recruitment.questions &&
								vacancy.recruitment.questions.length > 0 && (
									<div style={{ marginTop: "12px" }}>
										<h4
											className={styles.modal__sectionTitle}
											style={{ fontSize: "14px" }}
										>
											Pytania do kandydatów
										</h4>
										<ul className={styles.modal__list}>
											{vacancy.recruitment.questions.map((q) => (
												<li
													key={q.id}
													className={`${styles.modal__listItem} ${styles.q}`}
												>
													<ChevronRight size={16} />
													{q.question}
													{q.required && (
														<span style={{ color: "#ef4444" }}>*</span>
													)}
													<span
														style={{
															fontSize: "12px",
															color: "#94a3b8",
															marginLeft: "8px",
														}}
													>
														({q.type === "text" && "Tekst"}
														{q.type === "number" && "Liczba"}
														{q.type === "textarea" && "Dłuższy tekst"}
														{q.type === "select" && "Wybór"}
														{q.type === "checkbox" && "Checkbox"})
													</span>
												</li>
											))}
										</ul>
									</div>
								)}
						</div>
					)}
					{/* Załączniki */}
					{vacancy.attachments && vacancy.attachments.length > 0 && (
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>
								Załączniki ({vacancy.attachments.length})
							</h3>
							<div className={styles.modal__attachments}>
								{vacancy.attachments.map((file) => (
									<a
										key={file.id}
										href={file.url}
										target="_blank"
										rel="noopener noreferrer"
										className={styles.modal__attachment}
									>
										<FileText size={18} />
										<span className={styles.modal__attachmentName}>
											{file.name}
										</span>
										<span className={styles.modal__attachmentSize}>
											{formatFileSize(file.size)}
										</span>
										<span className={styles.modal__attachmentDate}>
											{formatDate(file.uploadedAt)}
										</span>
									</a>
								))}
							</div>
						</div>
					)}
					{vacancy.filledBy && (
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>
								Stanowisko obsadzone
							</h3>
							<div className={styles.modal__filledInfo}>
								<CheckCircle size={20} />
								<span>Stanowisko zostało już obsadzone.</span>
							</div>
						</div>
					)}
					{vacancy.applicants && vacancy.applicants.length > 0 && canManage && (
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>
								Zgłoszenia ({vacancy.applicants.length})
							</h3>
							<div className={styles.modal__applicants}>
								{(applications || [])
									.filter((app) => app.vacancyId === vacancy.id)
									.map((app) => (
										<div key={app.id} className={styles.modal__applicant}>
											{/* Nagłówek zgłoszenia */}
											<div className={styles.modal__applicantHeader}>
												<div className={styles.modal__applicantInfo}>
													<span className={styles.modal__applicantName}>
														{app.userName}
													</span>
													<span className={styles.modal__applicantEmail}>
														<Mail size={14} />
														{app.userEmail}
													</span>
													<span
														className={`${styles.modal__applicantStatus} ${styles[`applicantStatus${app.status.charAt(0).toUpperCase() + app.status.slice(1)}`]}`}
													>
														{app.status === "pending" && "⏳ Oczekuje"}
														{app.status === "reviewed" && "👀 Przejrzane"}
														{app.status === "accepted" && "✅ Zaakceptowane"}
														{app.status === "rejected" && "❌ Odrzucone"}
													</span>
												</div>
												<button
													className={styles.modal__applicantToggle}
													onClick={() => {
														const details = document.getElementById(
															`applicant-${app.id}`,
														);
														if (details) {
															const isHidden = details.style.display === "none";
															details.style.display = isHidden
																? "block"
																: "none";
															// Obróć strzałkę
															const toggleBtn =
																details.parentElement?.querySelector(
																	".modal__applicantToggle",
																);
															if (toggleBtn) {
																toggleBtn.classList.toggle("active");
															}
														}
													}}
												>
													<ChevronRight size={16} />
													Szczegóły
												</button>
											</div>

											{/* Rozwijane szczegóły - cała szerokość, pod spodem */}
											<div
												id={`applicant-${app.id}`}
												className={styles.modal__applicantDetails}
												style={{ display: "none" }}
											>
												{/* Wiadomość */}
												{app.message && (
													<div className={styles.modal__applicantMessage}>
														<strong>📝 Wiadomość:</strong>
														<p>{app.message}</p>
													</div>
												)}

												{/* Odpowiedzi na pytania */}
												{app.answers && Object.keys(app.answers).length > 0 && (
													<div className={styles.modal__applicantAnswers}>
														<strong>📋 Odpowiedzi:</strong>
														<div className={styles.modal__applicantAnswersList}>
															{vacancy.recruitment?.questions?.map((q) => {
																const answer = app.answers?.[q.id];
																if (!answer) return null;
																return (
																	<div
																		key={q.id}
																		className={`${styles.modal__applicantAnswer} ${styles[`type-${q.type}`]}`}
																	>
																		<div
																			className={
																				styles.modal__applicantQuestion
																			}
																		>
																			{q.question}
																			{q.required && (
																				<span className={styles.requiredStar}>
																					*
																				</span>
																			)}
																			<span
																				className={styles.modal__answerType}
																			>
																				({q.type === "text" && "Tekst"}
																				{q.type === "number" && "Liczba"}
																				{q.type === "textarea" &&
																					"Dłuższy tekst"}
																				{q.type === "select" && "Wybór"}
																				{q.type === "checkbox" && "Checkbox"})
																			</span>
																		</div>
																		<div
																			className={
																				styles.modal__applicantAnswerText
																			}
																		>
																			{q.type === "checkbox"
																				? answer === "true"
																					? "✅ Tak"
																					: "❌ Nie"
																				: answer}
																		</div>
																	</div>
																);
															})}
														</div>
													</div>
												)}

												{/* Data zgłoszenia */}
												<div className={styles.modal__applicantDate}>
													<Clock size={14} />
													Zgłoszono:{" "}
													{new Date(app.appliedAt).toLocaleString("pl-PL")}
												</div>

												{/* Przyciski akcji dla admina */}
												<div className={styles.modal__applicantActions}>
													<button className={styles.modal__applicantActionBtn}>
														<Check size={14} />
														Zaakceptuj
													</button>
													<button
														className={`${styles.modal__applicantActionBtn} ${styles.modal__applicantActionBtnDanger}`}
													>
														<X size={14} />
														Odrzuć
													</button>
												</div>
											</div>
										</div>
									))}
							</div>
						</div>
					)}
				</div>

				<div className={styles.modal__footer}>
					<button className={styles.modal__btnCancel} onClick={onClose}>
						Zamknij
					</button>
					{!isFilled && !hasApplied && (
						<button
							className={styles.modal__btnApply}
							onClick={() => {
								onClose();
								if (onOpenApply) {
									onOpenApply(vacancy);
								}
							}}
						>
							<Send size={16} />
							Zgłoś swoją kandydaturę
						</button>
					)}
					{hasApplied && (
						<span className={styles.modal__appliedBadge}>
							<Check size={16} />
							Już zgłoszono
						</span>
					)}
				</div>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// MODAL DODAWANIA/EDYCJI WAKATU (ULEPSZONA WERSJA)
// ---------------------------------------------------------------------------

interface VacancyFormModalProps {
	isOpen: boolean;
	vacancy: Vacancy | null;
	currentUser: User;
	teams: string[]; // <-- DODAJ
	pillars: string[];
	onClose: () => void;
	onSave: (vacancy: Vacancy) => void;
	onDelete?: (vacancy: Vacancy) => void;
}
function VacancyFormModal({
	isOpen,
	vacancy,
	currentUser,
	teams,
	pillars,
	onClose,
	onSave,
	onDelete,
}: VacancyFormModalProps) {
	const [formData, setFormData] = useState<Partial<Vacancy>>(
		vacancy || {
			title: "",
			icon: "Briefcase",
			description: "",
			responsibilities: [],
			requirements: [],
			niceToHave: [],
			team: "",
			teamId: "",
			pillar: "",
			contactPerson: {
				name: currentUser.name || "",
				email: "",
				phone: "",
			},
			status: "active",
			recruitment: {
				// <-- DODAJ
				type: "internal",
				deadline: "",
				questions: [],
			},
		},
	);

	const [newResponsibility, setNewResponsibility] = useState("");
	const [newRequirement, setNewRequirement] = useState("");
	const [newNiceToHave, setNewNiceToHave] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [showCustomTeam, setShowCustomTeam] = useState(false);
	const [showCustomPillar, setShowCustomPillar] = useState(false);
	const [contactSuggestions, setContactSuggestions] = useState<
		typeof MOCK_MEMBERS
	>([]);
	const [attachments, setAttachments] = useState<
		{
			id: string;
			name: string;
			size: number;
			type: string;
			url: string;
			uploadedAt: string;
		}[]
	>(vacancy?.attachments || []);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [contactSearch, setContactSearch] = useState("");

	if (!isOpen) return null;

	const isEdit = !!vacancy;
	const canManage =
		currentUser.role === "admin" || currentUser.role === "coordinator";
	// Funkcja do generowania emaila z imienia i nazwiska
	const generateEmail = (name: string): string => {
		if (!name.trim()) return "";
		const parts = name.trim().split(/\s+/);
		if (parts.length < 2) return "";
		const firstName = parts[0].toLowerCase();
		const lastName = parts.slice(1).join("").toLowerCase();
		// Usuń polskie znaki
		const normalize = (str: string) => {
			return str.replace(/[ąćęłńóśźż]/g, (char) => {
				const map: Record<string, string> = {
					ą: "a",
					ć: "c",
					ę: "e",
					ł: "l",
					ń: "n",
					ó: "o",
					ś: "s",
					ź: "z",
					ż: "z",
				};
				return map[char] || char;
			});
		};
		return `${normalize(firstName)}.${normalize(lastName)}@silamlodych.pl`;
	};
	// Funkcja do formatowania rozmiaru pliku
	const formatFileSize = (bytes: number): string => {
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		return (bytes / (1024 * 1024)).toFixed(1) + " MB";
	};

	// Funkcja do obsługi dodawania pliku
	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const file = files[0];

		// Sprawdź rozmiar (max 10MB)
		if (file.size > 10 * 1024 * 1024) {
			alert("Maksymalny rozmiar pliku to 10MB!");
			e.target.value = "";
			return;
		}

		// Tworzenie URL dla podglądu
		const fileUrl = URL.createObjectURL(file);

		const newAttachment = {
			id: `att-${Date.now()}`,
			name: file.name,
			size: file.size,
			type: file.type,
			url: fileUrl,
			uploadedAt: new Date().toISOString().split("T")[0],
		};

		setAttachments([...attachments, newAttachment]);
		e.target.value = ""; // Reset input
	};

	// Funkcja do usuwania załącznika
	const removeAttachment = (id: string) => {
		const attachment = attachments.find((a) => a.id === id);
		if (attachment) {
			URL.revokeObjectURL(attachment.url); // Zwolnij pamięć
		}
		setAttachments(attachments.filter((a) => a.id !== id));
	};
	// Filtruj członków po wpisanej frazie
	const filterMembers = (search: string) => {
		if (!search.trim()) {
			setContactSuggestions([]);
			setShowSuggestions(false);
			return;
		}
		const filtered = MOCK_MEMBERS.filter((member) =>
			member.name.toLowerCase().includes(search.toLowerCase()),
		);
		setContactSuggestions(filtered);
		setShowSuggestions(filtered.length > 0);
	};
	const addItem = (
		list: string[],
		setList: (list: string[]) => void,
		item: string,
	) => {
		if (item.trim() && !list.includes(item.trim())) {
			setList([...list, item.trim()]);
			return true;
		}
		return false;
	};

	const removeItem = (
		list: string[],
		setList: (list: string[]) => void,
		item: string,
	) => {
		setList(list.filter((i) => i !== item));
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.title?.trim()) {
			newErrors.title = "Nazwa stanowiska jest wymagana";
		}

		if (!formData.description?.trim()) {
			newErrors.description = "Opis stanowiska jest wymagany";
		}

		if (!formData.team?.trim()) {
			newErrors.team = "Zespół jest wymagany";
		}

		if (!formData.contactPerson?.name?.trim()) {
			newErrors.contactName = "Imię i nazwisko osoby kontaktowej jest wymagane";
		}

		if (!formData.contactPerson?.email?.trim()) {
			newErrors.contactEmail = "Email osoby kontaktowej jest wymagany";
		} else if (
			!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactPerson.email)
		) {
			newErrors.contactEmail = "Podaj poprawny adres email";
		}

		if (formData.responsibilities && formData.responsibilities.length === 0) {
			newErrors.responsibilities = "Dodaj przynajmniej jeden obowiązek";
		}

		if (formData.requirements && formData.requirements.length === 0) {
			newErrors.requirements = "Dodaj przynajmniej jedno wymaganie";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			const firstError = document.querySelector(".modal__input--error");
			if (firstError) {
				firstError.scrollIntoView({ behavior: "smooth", block: "center" });
			}
			return;
		}

		const now = new Date().toISOString().split("T")[0];
		const saveData: Vacancy = {
			id: vacancy?.id || `vacancy-${Date.now()}`,
			title: formData.title!.trim(),
			icon: formData.icon || "Briefcase",
			description: formData.description!.trim(),
			responsibilities: formData.responsibilities || [],
			requirements: formData.requirements || [],
			niceToHave: formData.niceToHave || [],
			team: formData.team!.trim(),
			teamId: formData.teamId?.trim() || "",
			pillar: formData.pillar?.trim() || "",
			contactPerson: {
				name: formData.contactPerson?.name?.trim() || "",
				email: formData.contactPerson?.email?.trim() || "",
				phone: formData.contactPerson?.phone?.trim() || "",
			},
			createdAt: vacancy?.createdAt || now,
			status: (formData.status as VacancyStatus) || "active",
			applicants: vacancy?.applicants || [],
			filledBy: vacancy?.filledBy,
			attachments: attachments,
			recruitment: {
				// <-- DODAJ
				type: formData.recruitment?.type || "internal",
				formUrl: formData.recruitment?.formUrl,
				messengerContact: formData.recruitment?.messengerContact,
				questions: formData.recruitment?.questions || [],
				deadline: formData.recruitment?.deadline || "",
			},
		};
		onSave(saveData);
		onClose();
	};

	const handleDelete = () => {
		if (vacancy && onDelete) {
			if (
				window.confirm(`Czy na pewno chcesz usunąć wakat "${vacancy.title}"?`)
			) {
				onDelete(vacancy);
				onClose();
			}
		}
	};

	// Grupowanie ikon dla lepszego wyboru
	const iconCategories = {
		Stanowiska: ["Briefcase", "Target", "Award", "Sparkles", "Star"],
		"Media i Social": [
			"Video",
			"Smartphone",
			"Camera",
			"Palette",
			"Megaphone",
			"MessageCircle",
			"Share2",
			"Globe",
		],
		Inne: [
			"Zap",
			"Heart",
			"TrendingUp",
			"Code",
			"Music",
			"BookOpen",
			"Users",
			"UserPlus",
			"FolderOpen",
			"Settings",
			"Tag",
		],
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div
				className={`${styles.modal} ${styles.modalForm}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modal__header}>
					<div className={styles.modal__headerLeft}>
						<Briefcase size={24} className={styles.modal__icon} />
						<h2 className={styles.modal__title}>
							{isEdit ? "Edytuj wakat" : "Dodaj nowy wakat"}
						</h2>
					</div>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__body}>
						{/* Podstawowe informacje */}
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>
								Podstawowe informacje
							</h3>

							<div className={styles.modal__formGrid}>
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Nazwa stanowiska{" "}
										<span className={styles.modal__required}>*</span>
									</label>
									<input
										type="text"
										className={`${styles.modal__input} ${errors.title ? styles.modal__inputError : ""}`}
										value={formData.title || ""}
										onChange={(e) => {
											setFormData({ ...formData, title: e.target.value });
											if (errors.title) setErrors({ ...errors, title: "" });
										}}
										placeholder="np. Koordynator Filaru Projektowego"
										required
									/>
									{errors.title && (
										<span className={styles.modal__error}>{errors.title}</span>
									)}
								</div>

								<div className={styles.modal__field}>
									<label className={styles.modal__label}>Ikona</label>
									<select
										className={styles.modal__select}
										value={formData.icon || "Briefcase"}
										onChange={(e) =>
											setFormData({ ...formData, icon: e.target.value })
										}
									>
										<optgroup label="Stanowiska">
											{iconCategories["Stanowiska"].map((icon) => (
												<option key={icon} value={icon}>
													{ICON_LABELS[icon]}
												</option>
											))}
										</optgroup>
										<optgroup label="Media i Social">
											{iconCategories["Media i Social"].map((icon) => (
												<option key={icon} value={icon}>
													{ICON_LABELS[icon]}
												</option>
											))}
										</optgroup>
										<optgroup label="Inne">
											{iconCategories["Inne"].map((icon) => (
												<option key={icon} value={icon}>
													{ICON_LABELS[icon]}
												</option>
											))}
										</optgroup>
									</select>
									<div className={styles.modal__iconPreview}>
										{formData.icon && (
											<>
												{(() => {
													const IconComp = ICON_MAP[formData.icon!];
													return IconComp ? <IconComp size={24} /> : null;
												})()}
												<span className={styles.modal__iconPreviewLabel}>
													{ICON_LABELS[formData.icon] || formData.icon}
												</span>
											</>
										)}
									</div>
								</div>
							</div>

							<div className={styles.modal__field}>
								<label className={styles.modal__label}>
									Opis stanowiska{" "}
									<span className={styles.modal__required}>*</span>
								</label>
								<textarea
									className={`${styles.modal__input} ${styles.modal__textarea} ${errors.description ? styles.modal__inputError : ""}`}
									value={formData.description || ""}
									onChange={(e) => {
										setFormData({ ...formData, description: e.target.value });
										if (errors.description)
											setErrors({ ...errors, description: "" });
									}}
									rows={3}
									placeholder="Opisz krótko czym zajmuje się osoba na tym stanowisku..."
									required
								/>
								{errors.description && (
									<span className={styles.modal__error}>
										{errors.description}
									</span>
								)}
							</div>
						</div>

						{/* Zakres obowiązków */}
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>
								Zakres obowiązków{" "}
								<span className={styles.modal__required}>*</span>
							</h3>
							<div className={styles.modal__field}>
								<div className={styles.modal__tagInput}>
									<input
										type="text"
										className={styles.modal__input}
										value={newResponsibility}
										onChange={(e) => setNewResponsibility(e.target.value)}
										placeholder="Dodaj obowiązek (np. Koordynacja prac zespołów)"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												addItem(
													formData.responsibilities || [],
													(list) =>
														setFormData({
															...formData,
															responsibilities: list,
														}),
													newResponsibility,
												);
												setNewResponsibility("");
												if (errors.responsibilities)
													setErrors({ ...errors, responsibilities: "" });
											}
										}}
									/>
									<button
										type="button"
										className={styles.modal__addBtn}
										onClick={() => {
											const added = addItem(
												formData.responsibilities || [],
												(list) =>
													setFormData({ ...formData, responsibilities: list }),
												newResponsibility,
											);
											if (added) {
												setNewResponsibility("");
												if (errors.responsibilities)
													setErrors({ ...errors, responsibilities: "" });
											}
										}}
									>
										<Plus size={16} />
									</button>
								</div>
								{errors.responsibilities && (
									<span className={styles.modal__error}>
										{errors.responsibilities}
									</span>
								)}
								<div className={styles.modal__tags}>
									{(formData.responsibilities || []).map((item) => (
										<span key={item} className={styles.modal__tag}>
											{item}
											<button
												type="button"
												className={styles.modal__removeTag}
												onClick={() =>
													removeItem(
														formData.responsibilities || [],
														(list) =>
															setFormData({
																...formData,
																responsibilities: list,
															}),
														item,
													)
												}
											>
												<X size={12} />
											</button>
										</span>
									))}
									{(formData.responsibilities || []).length === 0 && (
										<span className={styles.modal__emptyTags}>
											Dodaj obowiązki dla tego stanowiska
										</span>
									)}
								</div>
							</div>
						</div>

						{/* Wymagania */}
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>
								Wymagania <span className={styles.modal__required}>*</span>
							</h3>
							<div className={styles.modal__field}>
								<div className={styles.modal__tagInput}>
									<input
										type="text"
										className={styles.modal__input}
										value={newRequirement}
										onChange={(e) => setNewRequirement(e.target.value)}
										placeholder="Dodaj wymaganie (np. Doświadczenie w zarządzaniu)"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												addItem(
													formData.requirements || [],
													(list) =>
														setFormData({ ...formData, requirements: list }),
													newRequirement,
												);
												setNewRequirement("");
												if (errors.requirements)
													setErrors({ ...errors, requirements: "" });
											}
										}}
									/>
									<button
										type="button"
										className={styles.modal__addBtn}
										onClick={() => {
											const added = addItem(
												formData.requirements || [],
												(list) =>
													setFormData({ ...formData, requirements: list }),
												newRequirement,
											);
											if (added) {
												setNewRequirement("");
												if (errors.requirements)
													setErrors({ ...errors, requirements: "" });
											}
										}}
									>
										<Plus size={16} />
									</button>
								</div>
								{errors.requirements && (
									<span className={styles.modal__error}>
										{errors.requirements}
									</span>
								)}
								<div className={styles.modal__tags}>
									{(formData.requirements || []).map((item) => (
										<span key={item} className={styles.modal__tag}>
											{item}
											<button
												type="button"
												className={styles.modal__removeTag}
												onClick={() =>
													removeItem(
														formData.requirements || [],
														(list) =>
															setFormData({ ...formData, requirements: list }),
														item,
													)
												}
											>
												<X size={12} />
											</button>
										</span>
									))}
									{(formData.requirements || []).length === 0 && (
										<span className={styles.modal__emptyTags}>
											Dodaj wymagania dla tego stanowiska
										</span>
									)}
								</div>
							</div>
						</div>

						{/* Mile widziane */}
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>Mile widziane</h3>
							<div className={styles.modal__field}>
								<div className={styles.modal__tagInput}>
									<input
										type="text"
										className={styles.modal__input}
										value={newNiceToHave}
										onChange={(e) => setNewNiceToHave(e.target.value)}
										placeholder="Dodaj umiejętność mile widzianą"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												addItem(
													formData.niceToHave || [],
													(list) =>
														setFormData({ ...formData, niceToHave: list }),
													newNiceToHave,
												);
												setNewNiceToHave("");
											}
										}}
									/>
									<button
										type="button"
										className={styles.modal__addBtn}
										onClick={() => {
											addItem(
												formData.niceToHave || [],
												(list) =>
													setFormData({ ...formData, niceToHave: list }),
												newNiceToHave,
											);
											setNewNiceToHave("");
										}}
									>
										<Plus size={16} />
									</button>
								</div>
								<div className={styles.modal__tags}>
									{(formData.niceToHave || []).map((item) => (
										<span key={item} className={styles.modal__tag}>
											{item}
											<button
												type="button"
												className={styles.modal__removeTag}
												onClick={() =>
													removeItem(
														formData.niceToHave || [],
														(list) =>
															setFormData({ ...formData, niceToHave: list }),
														item,
													)
												}
											>
												<X size={12} />
											</button>
										</span>
									))}
									{(formData.niceToHave || []).length === 0 && (
										<span className={styles.modal__emptyTags}>
											Brak dodatkowych wymagań
										</span>
									)}
								</div>
							</div>
						</div>

						{/* Informacje organizacyjne */}
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>
								Informacje organizacyjne
							</h3>

							<div className={styles.modal__formGrid}>
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Zespół <span className={styles.modal__required}>*</span>
									</label>
									<select
										className={styles.modal__select}
										value={formData.team || ""}
										onChange={(e) => {
											const value = e.target.value;
											if (value === "other") {
												setShowCustomTeam(true); // <-- Używamy osobnego stanu
												setFormData({
													...formData,
													team: "",
													teamId: "",
												});
											} else if (value) {
												const teamId = value
													.toLowerCase()
													.replace(/[^a-z0-9]/g, "-")
													.replace(/-+/g, "-")
													.replace(/^-|-$/g, "");
												setShowCustomTeam(false); // <-- Używamy osobnego stanu
												setFormData({
													...formData,
													team: value,
													teamId: teamId,
												});
											}
										}}
										required
									>
										<option value="">Wybierz zespół...</option>
										{teams.map((t) => (
											<option key={t} value={t}>
												{t}
											</option>
										))}
										<option value="other">Inny zespół</option>
									</select>
								</div>
								{showCustomTeam && (
									<div className={styles.modal__field}>
										<label className={styles.modal__label}>
											Nazwa zespołu{" "}
											<span className={styles.modal__required}>*</span>
										</label>
										<input
											type="text"
											className={styles.modal__input}
											value={formData.team || ""}
											onChange={(e) => {
												const value = e.target.value;
												const teamId = value
													.toLowerCase()
													.replace(/[^a-z0-9]/g, "-")
													.replace(/-+/g, "-")
													.replace(/^-|-$/g, "");
												setFormData({
													...formData,
													team: value,
													teamId: teamId,
												});
											}}
											placeholder="Wpisz nazwę nowego zespołu"
											required
										/>
									</div>
								)}

								<div className={styles.modal__field}>
									<label className={styles.modal__label}>ID zespołu</label>
									<input
										type="text"
										className={styles.modal__input}
										value={formData.teamId || ""}
										onChange={(e) =>
											setFormData({ ...formData, teamId: e.target.value })
										}
										placeholder="np. social-media"
									/>
								</div>
							</div>

							<div className={styles.modal__formGrid}>
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>Filar</label>
									<select
										className={styles.modal__select}
										value={formData.pillar || ""}
										onChange={(e) => {
											const value = e.target.value;
											if (value === "other") {
												setShowCustomPillar(true);
												setFormData({
													...formData,
													pillar: "",
												});
											} else if (value) {
												setShowCustomPillar(false);
												setFormData({
													...formData,
													pillar: value,
												});
											}
										}}
									>
										<option value="">Wybierz filar...</option>
										{pillars.map((p) => (
											<option key={p} value={p}>
												{p}
											</option>
										))}
										<option value="other">Inny filar</option>
									</select>
								</div>

								{showCustomPillar && (
									<div className={styles.modal__field}>
										<label className={styles.modal__label}>Nazwa filaru</label>
										<input
											type="text"
											className={styles.modal__input}
											value={formData.pillar || ""}
											onChange={(e) => {
												setFormData({
													...formData,
													pillar: e.target.value,
												});
											}}
											placeholder="Wpisz nazwę nowego filaru"
										/>
									</div>
								)}

								<div className={styles.modal__field}>
									<label className={styles.modal__label}>Status</label>
									<select
										className={styles.modal__select}
										value={formData.status || "active"}
										onChange={(e) =>
											setFormData({
												...formData,
												status: e.target.value as VacancyStatus,
											})
										}
									>
										<option value="active">Aktywny</option>
										<option value="recruiting">W trakcie rekrutacji</option>
										<option value="filled">Obsadzony</option>
									</select>
								</div>
							</div>
						</div>

						{/* Osoba kontaktowa */}
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>Osoba kontaktowa</h3>
							<p className={styles.modal__sectionDescription}>
								Osoba, do której mogą zgłaszać się zainteresowani kandydaci.
							</p>

							<div className={styles.modal__formGrid}>
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Imię i nazwisko{" "}
										<span className={styles.modal__required}>*</span>
									</label>
									<div className={styles.contactInputWrapper}>
										<input
											type="text"
											className={`${styles.modal__input} ${errors.contactName ? styles.modal__inputError : ""}`}
											value={formData.contactPerson?.name || ""}
											onChange={(e) => {
												const value = e.target.value;
												setContactSearch(value);

												// Generuj email automatycznie
												const email = generateEmail(value);

												setFormData({
													...formData,
													contactPerson: {
														name: value,
														email: email || formData.contactPerson?.email || "",
														phone: formData.contactPerson?.phone || "",
													},
												});

												// Filtruj sugestie
												filterMembers(value);

												if (errors.contactName)
													setErrors({ ...errors, contactName: "" });
											}}
											onFocus={() => {
												if (contactSuggestions.length > 0) {
													setShowSuggestions(true);
												}
											}}
											onBlur={() => {
												// Opóźnij zamknięcie, żeby zdążyć kliknąć
												setTimeout(() => {
													setShowSuggestions(false);
												}, 200);
											}}
											placeholder="np. Jan Kowalski"
											required
											autoComplete="off"
										/>

										{/* Lista sugestii */}
										{showSuggestions && contactSuggestions.length > 0 && (
											<ul className={styles.contactSuggestions}>
												{contactSuggestions.map((member) => (
													<li
														key={member.id}
														className={styles.contactSuggestionItem}
														onMouseDown={(e) => {
															e.preventDefault(); // Zapobiega blurowi przed kliknięciem
															const email = generateEmail(member.name);
															setFormData({
																...formData,
																contactPerson: {
																	name: member.name,
																	email: email,
																	phone: formData.contactPerson?.phone || "",
																},
															});
															setContactSearch(member.name);
															setContactSuggestions([]);
															setShowSuggestions(false);
															if (errors.contactName)
																setErrors({ ...errors, contactName: "" });
															if (errors.contactEmail)
																setErrors({ ...errors, contactEmail: "" });
														}}
													>
														<div className={styles.contactSuggestionName}>
															<UserIcon size={14} />
															{member.name}
														</div>
														<div className={styles.contactSuggestionEmail}>
															<Mail size={12} />
															{member.email}
														</div>
													</li>
												))}
											</ul>
										)}
									</div>
									{errors.contactName && (
										<span className={styles.modal__error}>
											{errors.contactName}
										</span>
									)}
								</div>

								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Email <span className={styles.modal__required}>*</span>
									</label>
									<input
										type="email"
										className={`${styles.modal__input} ${errors.contactEmail ? styles.modal__inputError : ""}`}
										value={formData.contactPerson?.email || ""}
										onChange={(e) => {
											setFormData({
												...formData,
												contactPerson: {
													name: formData.contactPerson?.name || "",
													email: e.target.value,
													phone: formData.contactPerson?.phone || "",
												},
											});
											if (errors.contactEmail)
												setErrors({ ...errors, contactEmail: "" });
										}}
										placeholder="jan.kowalski@silamlodych.pl"
										required
									/>
									{errors.contactEmail && (
										<span className={styles.modal__error}>
											{errors.contactEmail}
										</span>
									)}
								</div>
							</div>
						</div>
						{/* Załączniki */}
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>Załączniki</h3>
							<p className={styles.modal__sectionDescription}>
								Dodaj plik z opisem stanowiska lub innymi dokumentami.
								Obsługiwane formaty: PDF, DOC, DOCX, JPG, PNG, itp.
							</p>

							<div className={styles.attachmentsArea}>
								{/* Przycisk dodawania */}
								<div className={styles.attachmentUpload}>
									<label
										htmlFor="file-upload"
										className={styles.attachmentUploadLabel}
									>
										<Plus size={20} />
										<span>Dodaj załącznik</span>
									</label>
									<input
										id="file-upload"
										type="file"
										onChange={handleFileUpload}
										className={styles.attachmentUploadInput}
										disabled={!canManage}
									/>
								</div>

								{/* Lista załączników */}
								{attachments.length > 0 && (
									<div className={styles.attachmentsList}>
										{attachments.map((file) => (
											<div key={file.id} className={styles.attachmentItem}>
												<div className={styles.attachmentInfo}>
													<div className={styles.attachmentIcon}>
														<FileText size={20} />
													</div>
													<div className={styles.attachmentDetails}>
														<span className={styles.attachmentName}>
															{file.name}
														</span>
														<span className={styles.attachmentMeta}>
															{formatFileSize(file.size)} • {file.uploadedAt}
														</span>
													</div>
												</div>
												<div className={styles.attachmentActions}>
													<a
														href={file.url}
														target="_blank"
														rel="noopener noreferrer"
														className={styles.attachmentActionBtn}
														title="Podgląd"
													>
														<Eye size={16} />
													</a>
													{canManage && ( // <-- ZMIEŃ z canEdit na canManage
														<button
															type="button"
															className={`${styles.attachmentActionBtn} ${styles.attachmentActionBtnDanger}`}
															onClick={() => removeAttachment(file.id)}
															title="Usuń"
														>
															<Trash2 size={16} />
														</button>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
						{/* Informacje o rekrutacji */}
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>
								Informacje o rekrutacji
							</h3>

							<div className={styles.modal__formGrid}>
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Typ rekrutacji{" "}
										<span className={styles.modal__required}>*</span>
									</label>
									<select
										className={styles.modal__select}
										value={formData.recruitment?.type || "internal"}
										onChange={(e) => {
											const type = e.target.value as RecruitmentType;
											setFormData({
												...formData,
												recruitment: {
													...formData.recruitment,
													type,
													questions: type === "internal" ? [] : undefined,
													formUrl: undefined,
													messengerContact: undefined,
													deadline: formData.recruitment?.deadline || "",
												},
											});
										}}
										required
									>
										<option value="form">Link do formularza</option>
										<option value="messenger">Wiadomość na Messengerze</option>
										<option value="internal">Formularz na stronie</option>
									</select>
								</div>

								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Termin zgłoszeń{" "}
										<span className={styles.modal__required}>*</span>
									</label>
									<input
										type="datetime-local"
										className={styles.modal__input}
										value={formData.recruitment?.deadline || ""}
										onChange={(e) => {
											setFormData({
												...formData,
												recruitment: {
													...formData.recruitment,
													deadline: e.target.value,
													type: formData.recruitment?.type || "internal",
												},
											});
										}}
										required
									/>
									<span className={styles.modal__helper}>
										Data i godzina, do której można zgłaszać kandydatury
									</span>
								</div>
							</div>

							{/* Opcje dla typu "form" */}
							{formData.recruitment?.type === "form" && (
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Link do formularza{" "}
										<span className={styles.modal__required}>*</span>
									</label>
									<input
										type="url"
										className={styles.modal__input}
										value={formData.recruitment?.formUrl || ""}
										onChange={(e) => {
											setFormData({
												...formData,
												recruitment: {
													...formData.recruitment,
													formUrl: e.target.value,
													type: "form",
													deadline: formData.recruitment?.deadline || "",
												},
											});
										}}
										placeholder="https://forms.google.com/..."
										required
									/>
								</div>
							)}

							{/* Opcje dla typu "messenger" */}
							{formData.recruitment?.type === "messenger" && (
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Osoba kontaktowa na Messengerze{" "}
										<span className={styles.modal__required}>*</span>
									</label>
									<input
										type="text"
										className={styles.modal__input}
										value={formData.recruitment?.messengerContact || ""}
										onChange={(e) => {
											setFormData({
												...formData,
												recruitment: {
													...formData.recruitment,
													messengerContact: e.target.value,
													type: "messenger",
													deadline: formData.recruitment?.deadline || "",
												},
											});
										}}
										placeholder="np. Jan Kowalski"
										required
									/>
									<span className={styles.modal__helper}>
										Podaj imię i nazwisko osoby, do której można napisać na
										Messengerze
									</span>
								</div>
							)}

							{/* Opcje dla typu "internal" */}
							{formData.recruitment?.type === "internal" && (
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Pytania do kandydatów
									</label>
									<QuestionManager
										questions={formData.recruitment?.questions || []}
										onAdd={(q) => {
											setFormData({
												...formData,
												recruitment: {
													...formData.recruitment,
													questions: [
														...(formData.recruitment?.questions || []),
														q,
													],
													type: "internal",
													deadline: formData.recruitment?.deadline || "",
												},
											});
										}}
										onRemove={(id) => {
											setFormData({
												...formData,
												recruitment: {
													...formData.recruitment,
													questions: (
														formData.recruitment?.questions || []
													).filter((q) => q.id !== id),
													type: "internal",
													deadline: formData.recruitment?.deadline || "",
												},
											});
										}}
										onUpdate={() => {}}
									/>
								</div>
							)}
						</div>

						{/* Podgląd */}
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>Podgląd wakatu</h3>
							<div className={styles.modal__preview}>
								<div className={styles.modal__previewCard}>
									<div className={styles.modal__previewHeader}>
										{formData.icon && (
											<div className={styles.modal__previewIcon}>
												{(() => {
													const IconComp = ICON_MAP[formData.icon!];
													return IconComp ? <IconComp size={24} /> : null;
												})()}
											</div>
										)}
										<div className={styles.modal__previewInfo}>
											<h4>{formData.title || "Nazwa stanowiska"}</h4>
											<span>{formData.team || "Zespół"}</span>
											{formData.pillar && <span>• {formData.pillar}</span>}
										</div>
										<span
											className={`${styles.modal__previewStatus} ${STATUS_COLORS[(formData.status as VacancyStatus) || "active"]}`}
										>
											{
												STATUS_ICONS[
													(formData.status as VacancyStatus) || "active"
												]
											}
											{
												STATUS_LABELS[
													(formData.status as VacancyStatus) || "active"
												]
											}
										</span>
									</div>
									<p className={styles.modal__previewDescription}>
										{formData.description ||
											"Opis stanowiska pojawi się tutaj..."}
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className={styles.modal__actions}>
						{isEdit && onDelete && canManage && (
							<button
								type="button"
								className={styles.modal__btnDelete}
								onClick={handleDelete}
							>
								<Trash2 size={16} />
								Usuń wakat
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
								{isEdit ? (
									<>
										<Edit size={16} />
										Zapisz zmiany
									</>
								) : (
									<>
										<Plus size={16} />
										Dodaj wakat
									</>
								)}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// KOMPONENT ZARZĄDZANIA PYTANIAMI
// ---------------------------------------------------------------------------

interface QuestionManagerProps {
	questions: FormQuestion[];
	onAdd: (question: FormQuestion) => void;
	onRemove: (id: string) => void;
	onUpdate: (id: string, updates: Partial<FormQuestion>) => void;
	disabled?: boolean;
}

function QuestionManager({
	questions,
	onAdd,
	onRemove,
	onUpdate,
	disabled = false,
}: QuestionManagerProps) {
	const [newQuestion, setNewQuestion] = useState("");
	const [newType, setNewType] = useState<FormQuestion["type"]>("text");
	const [newRequired, setNewRequired] = useState(false);
	const [newOptions, setNewOptions] = useState("");
	const [showAddForm, setShowAddForm] = useState(false);

	const handleAdd = () => {
		if (!newQuestion.trim()) return;

		const question: FormQuestion = {
			id: `q-${Date.now()}`,
			question: newQuestion.trim(),
			type: newType,
			required: newRequired,
			options:
				newType === "select"
					? newOptions.split(",").map((s) => s.trim())
					: undefined,
		};

		onAdd(question);
		setNewQuestion("");
		setNewOptions("");
		setShowAddForm(false);
	};

	return (
		<div className={styles.questionManager}>
			{/* Lista pytań */}
			{questions.length > 0 && (
				<div className={styles.questionsList}>
					{questions.map((q) => (
						<div key={q.id} className={styles.questionItem}>
							<div className={styles.questionInfo}>
								<span className={styles.questionText}>
									{q.question}
									{q.required && <span className={styles.requiredStar}>*</span>}
								</span>
								<span className={styles.questionType}>
									{q.type === "text" && "📝 Tekst"}
									{q.type === "number" && "🔢 Liczba"}
									{q.type === "textarea" && "📄 Dłuższy tekst"}
									{q.type === "select" && "📋 Wybór"}
									{q.type === "checkbox" && "☑️ Checkbox"}
								</span>
								{q.options && q.options.length > 0 && (
									<span className={styles.questionOptions}>
										({q.options.join(", ")})
									</span>
								)}
							</div>
							{!disabled && (
								<button
									type="button"
									className={styles.questionRemove}
									onClick={() => onRemove(q.id)}
								>
									<X size={16} />
								</button>
							)}
						</div>
					))}
				</div>
			)}

			{/* Przycisk dodawania */}
			{!disabled && (
				<button
					type="button"
					className={styles.addQuestionBtn}
					onClick={() => setShowAddForm(!showAddForm)}
				>
					<Plus size={16} />
					{showAddForm ? "Anuluj" : "Dodaj pytanie"}
				</button>
			)}

			{/* Formularz dodawania pytania */}
			{showAddForm && !disabled && (
				<div className={styles.addQuestionForm}>
					<div className={styles.formField}>
						<label className={styles.modal__label}>Treść pytania</label>
						<input
							type="text"
							className={styles.modal__input}
							value={newQuestion}
							onChange={(e) => setNewQuestion(e.target.value)}
							placeholder="np. Jakie masz doświadczenie?"
						/>
					</div>

					<div className={styles.formRow}>
						<div className={styles.formField}>
							<label className={styles.modal__label}>Typ odpowiedzi</label>
							<select
								className={styles.modal__select}
								value={newType}
								onChange={(e) =>
									setNewType(e.target.value as FormQuestion["type"])
								}
							>
								<option value="text">Tekst</option>
								<option value="number">Liczba</option>
								<option value="textarea">Dłuższy tekst</option>
								<option value="select">Wybór z listy</option>
								<option value="checkbox">Checkbox</option>
							</select>
						</div>

						<div className={styles.formField}>
							<label className={styles.modal__label}>
								<input
									type="checkbox"
									checked={newRequired}
									onChange={(e) => setNewRequired(e.target.checked)}
								/>
								Wymagane
							</label>
						</div>
					</div>

					{newType === "select" && (
						<div className={styles.formField}>
							<label className={styles.modal__label}>
								Opcje (oddzielone przecinkami)
							</label>
							<input
								type="text"
								className={styles.modal__input}
								value={newOptions}
								onChange={(e) => setNewOptions(e.target.value)}
								placeholder="np. Tak, Nie, Może"
							/>
						</div>
					)}

					<div className={styles.formActions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={() => setShowAddForm(false)}
						>
							Anuluj
						</button>
						<button
							type="button"
							className={styles.modal__btnSave}
							onClick={handleAdd}
						>
							Dodaj pytanie
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
// ---------------------------------------------------------------------------
// GŁÓWNY KOMPONENT
// ---------------------------------------------------------------------------

export default function Vacancies({ title }: { title?: string }) {
	const [vacancies, setVacancies] = useState<Vacancy[]>(MOCK_VACANCIES);
	const [applications, setApplications] =
		useState<Application[]>(MOCK_APPLICATIONS);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedTeam, setSelectedTeam] = useState<string>("all");
	const [selectedPillar, setSelectedPillar] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
	const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
	const [isApplyOpen, setIsApplyOpen] = useState(false);
	const [applyingVacancy, setApplyingVacancy] = useState<Vacancy | null>(null);
	const [applicationMessage, setApplicationMessage] = useState("");

	const currentUser = MOCK_USER;
	const canManage = currentUser.role === "admin";

	// Unikalne zespoły i filary dla filtrów
	const teams = useMemo(() => {
		const unique = new Set(vacancies.map((v) => v.team));
		return Array.from(unique).sort();
	}, [vacancies]);

	// Filary - połączenie stałej listy z tymi z wakatów
	const pillars = useMemo(() => {
		return [...DEFAULT_PILLARS].sort();
	}, []);
	// W głównym komponencie Vacancies
	useEffect(() => {
		const checkDeadlines = () => {
			const now = new Date();
			const updated = vacancies.map((v) => {
				if (v.recruitment?.deadline) {
					const deadline = new Date(v.recruitment.deadline);
					if (deadline < now && v.status === "active") {
						return { ...v, status: "recruiting" as VacancyStatus };
					}
					if (deadline >= now && v.status === "recruiting") {
						return { ...v, status: "active" as VacancyStatus };
					}
				}
				return v;
			});

			// Sprawdź czy coś się zmieniło
			const hasChanges = updated.some(
				(v, i) => v.status !== vacancies[i].status,
			);
			if (hasChanges) {
				setVacancies(updated);
			}
		};

		// Sprawdź od razu
		checkDeadlines();

		// Sprawdzaj co minutę
		const interval = setInterval(checkDeadlines, 60000);

		return () => clearInterval(interval);
	}, [vacancies]);
	const filteredVacancies = useMemo(() => {
		return vacancies
			.filter((vacancy) => {
				const matchesSearch =
					vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					vacancy.description
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					vacancy.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
					vacancy.responsibilities.some((r) =>
						r.toLowerCase().includes(searchTerm.toLowerCase()),
					) ||
					vacancy.requirements.some((r) =>
						r.toLowerCase().includes(searchTerm.toLowerCase()),
					);

				const matchesTeam =
					selectedTeam === "all" || vacancy.team === selectedTeam;
				const matchesPillar =
					selectedPillar === "all" || vacancy.pillar === selectedPillar;
				const matchesStatus =
					selectedStatus === "all" || vacancy.status === selectedStatus;

				return matchesSearch && matchesTeam && matchesPillar && matchesStatus;
			})
			.sort((a, b) => {
				// Aktywne i rekrutacyjne na górze
				const statusOrder = { active: 0, recruiting: 1, filled: 2 };
				const statusCompare = statusOrder[a.status] - statusOrder[b.status];
				if (statusCompare !== 0) return statusCompare;
				return (
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
			});
	}, [vacancies, searchTerm, selectedTeam, selectedPillar, selectedStatus]);

	const activeCount = vacancies.filter(
		(v) => v.status === "active" || v.status === "recruiting",
	).length;

	const handleViewVacancy = (vacancy: Vacancy) => {
		setSelectedVacancy(vacancy);
		setIsDetailOpen(true);
	};

	const handleAddVacancy = () => {
		setEditingVacancy(null);
		setIsFormOpen(true);
	};

	const handleOpenApply = (vacancy: Vacancy) => {
		setApplyingVacancy(vacancy);
		setIsApplyOpen(true);
	};
	const handleSubmitApplication = (
		vacancy: Vacancy,
		answers: Record<string, string>,
		message: string,
	) => {
		// Sprawdź czy już się zgłoszono
		const existingApplication = applications.find(
			(a) => a.vacancyId === vacancy.id && a.userId === currentUser.id,
		);
		if (existingApplication) {
			alert("Już zgłosiłeś się na to stanowisko!");
			return;
		}

		const newApplication: Application = {
			id: `app-${Date.now()}`,
			vacancyId: vacancy.id,
			userId: currentUser.id,
			userName: currentUser.name,
			userEmail: "jan.kowalski@silamlodych.pl", // Pobierz z danych użytkownika
			message: message || "Jestem zainteresowany/a tą funkcją.",
			appliedAt: new Date().toISOString().split("T")[0],
			status: "pending",
			answers: answers, // <-- ZAPISZ ODPOWIEDZI
		};

		setApplications([...applications, newApplication]);

		// Aktualizuj listę zgłoszeń w wakacie
		const updatedVacancies = vacancies.map((v) => {
			if (v.id === vacancy.id) {
				return {
					...v,
					applicants: [...(v.applicants || []), currentUser.id],
				};
			}
			return v;
		});
		setVacancies(updatedVacancies);

		console.log(
			`📧 Powiadomienie wysłane do ${vacancy.contactPerson.name} (${vacancy.contactPerson.email})`,
		);
		console.log(
			`📧 Treść: Nowe zgłoszenie od ${currentUser.name} na stanowisko ${vacancy.title}`,
		);
		if (answers && Object.keys(answers).length > 0) {
			console.log("📧 Odpowiedzi:", answers);
		}

		alert(
			`Zgłoszenie zostało wysłane! ${vacancy.contactPerson.name} otrzymał/a powiadomienie.`,
		);
	};

	const handleEditVacancy = (vacancy: Vacancy) => {
		setEditingVacancy(vacancy);
		setIsFormOpen(true);
	};

	const handleDeleteVacancy = (vacancy: Vacancy) => {
		setVacancies(vacancies.filter((v) => v.id !== vacancy.id));
	};

	const handleSaveVacancy = (vacancy: Vacancy) => {
		const existingIndex = vacancies.findIndex((v) => v.id === vacancy.id);
		if (existingIndex >= 0) {
			const updated = [...vacancies];
			updated[existingIndex] = vacancy;
			setVacancies(updated);
		} else {
			setVacancies([vacancy, ...vacancies]);
		}
	};

	const handleApply = (vacancy: Vacancy) => {
		// Sprawdź czy już się zgłoszono
		const existingApplication = applications.find(
			(a) => a.vacancyId === vacancy.id && a.userId === currentUser.id,
		);
		if (existingApplication) {
			alert("Już zgłosiłeś się na to stanowisko!");
			return;
		}

		if (
			window.confirm(
				`Czy chcesz zgłosić swoją kandydaturę na stanowisko "${vacancy.title}"?`,
			)
		) {
			const newApplication: Application = {
				id: `app-${Date.now()}`,
				vacancyId: vacancy.id,
				userId: currentUser.id,
				userName: currentUser.name,
				userEmail: "jan.kowalski@silamlodych.pl", // W rzeczywistości z danych użytkownika
				message: "Jestem zainteresowany/a tą funkcją.",
				appliedAt: new Date().toISOString().split("T")[0],
				status: "pending",
			};

			setApplications([...applications, newApplication]);

			// Aktualizuj listę zgłoszeń w wakacie
			const updatedVacancies = vacancies.map((v) => {
				if (v.id === vacancy.id) {
					return {
						...v,
						applicants: [...(v.applicants || []), currentUser.id],
					};
				}
				return v;
			});
			setVacancies(updatedVacancies);

			// Symulacja powiadomienia email
			console.log(
				`📧 Powiadomienie wysłane do ${vacancy.contactPerson.name} (${vacancy.contactPerson.email})`,
			);
			console.log(
				`📧 Treść: Nowe zgłoszenie od ${currentUser.name} na stanowisko ${vacancy.title}`,
			);

			alert(
				`Zgłoszenie zostało wysłane! ${vacancy.contactPerson.name} otrzymał/a powiadomienie.`,
			);
		}
	};

	const hasApplied = (vacancyId: string) => {
		return applications.some(
			(a) => a.vacancyId === vacancyId && a.userId === currentUser.id,
		);
	};

	const clearFilters = () => {
		setSearchTerm("");
		setSelectedTeam("all");
		setSelectedPillar("all");
		setSelectedStatus("all");
	};

	return (
		<div className={styles.vacancies}>
			<h1>{title ?? "Wakaty"}</h1>
			{/* Nagłówek */}
			<div className={styles.header}>
				<div className={styles.header__left}>
					<h1 className={styles.header__title}>
						Wolne Stanowiska w Siła Młodych
					</h1>
					<p className={styles.header__subtitle}>
						Sprawdź aktualnie dostępne funkcje i dołącz do zespołów, w których
						możesz rozwijać swoje umiejętności.
					</p>
					<div className={styles.header__stats}>
						<span className={styles.header__stat}>
							<Briefcase size={18} />
							{activeCount} aktywnych wakatów
						</span>
						<span className={styles.header__stat}>
							<Users size={18} />
							{vacancies.length} wszystkich
						</span>
					</div>
				</div>
				{canManage && (
					<button className={styles.header__addBtn} onClick={handleAddVacancy}>
						<Plus size={18} />
						Dodaj wakat
					</button>
				)}
			</div>

			{/* Filtry i wyszukiwarka */}
			<div className={styles.filters}>
				<div className={styles.filters__search}>
					<Search size={18} className={styles.filters__searchIcon} />
					<input
						type="text"
						className={styles.filters__searchInput}
						placeholder="Szukaj wakatów..."
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
						value={selectedTeam}
						onChange={(e) => setSelectedTeam(e.target.value)}
					>
						<option value="all">Wszystkie zespoły</option>
						{teams.map((t) => (
							<option key={t} value={t}>
								{t}
							</option>
						))}
					</select>

					<select
						className={styles.filters__select}
						value={selectedPillar}
						onChange={(e) => setSelectedPillar(e.target.value)}
					>
						<option value="all">Wszystkie filary</option>
						{pillars.map((p) => (
							<option key={p} value={p}>
								{p}
							</option>
						))}
					</select>

					<select
						className={styles.filters__select}
						value={selectedStatus}
						onChange={(e) => setSelectedStatus(e.target.value)}
					>
						<option value="all">Wszystkie statusy</option>
						<option value="active">Aktywne</option>
						<option value="recruiting">W trakcie rekrutacji</option>
						<option value="filled">Obsadzone</option>
					</select>

					<div className={styles.filters__viewToggle}>
						<button
							className={`${styles.filters__viewBtn} ${viewMode === "grid" ? styles.filters__viewBtnActive : ""}`}
							onClick={() => setViewMode("grid")}
							title="Widok kafelków"
						>
							<Grid size={18} />
						</button>
						<button
							className={`${styles.filters__viewBtn} ${viewMode === "list" ? styles.filters__viewBtnActive : ""}`}
							onClick={() => setViewMode("list")}
							title="Widok listy"
						>
							<List size={18} />
						</button>
					</div>

					{(selectedTeam !== "all" ||
						selectedPillar !== "all" ||
						selectedStatus !== "all" ||
						searchTerm) && (
						<button className={styles.filters__reset} onClick={clearFilters}>
							Wyczyść filtry
						</button>
					)}
				</div>
			</div>

			{/* Lista wakatów */}
			<div
				className={`${styles.vacanciesGrid} ${viewMode === "list" ? styles.vacanciesGridList : ""}`}
			>
				{filteredVacancies.length === 0 ? (
					<div className={styles.emptyState}>
						<Briefcase size={48} className={styles.emptyState__icon} />
						<h3 className={styles.emptyState__title}>Brak wakatów</h3>
						<p className={styles.emptyState__description}>
							{searchTerm ||
							selectedTeam !== "all" ||
							selectedPillar !== "all" ||
							selectedStatus !== "all"
								? "Nie znaleziono wakatów spełniających kryteria wyszukiwania."
								: canManage
									? "Nie ma jeszcze żadnych wakatów. Kliknij 'Dodaj wakat' aby utworzyć pierwszy."
									: "Nie ma jeszcze żadnych wakatów."}
						</p>
						{canManage &&
							filteredVacancies.length === 0 &&
							!searchTerm &&
							selectedTeam === "all" &&
							selectedPillar === "all" &&
							selectedStatus === "all" && (
								<button
									className={styles.emptyState__btn}
									onClick={handleAddVacancy}
								>
									<Plus size={16} />
									Dodaj pierwszy wakat
								</button>
							)}
					</div>
				) : (
					filteredVacancies.map((vacancy) => (
						<VacancyCard
							key={vacancy.id}
							vacancy={vacancy}
							currentUser={currentUser}
							onView={handleViewVacancy}
							onEdit={canManage ? handleEditVacancy : undefined}
							onDelete={canManage ? handleDeleteVacancy : undefined}
							onApply={handleOpenApply} // <-- OTWIERA MODAL ZGŁOSZENIOWY
							viewMode={viewMode}
							hasApplied={hasApplied(vacancy.id)}
						/>
					))
				)}
			</div>

			{/* Modal szczegółów */}
			<VacancyDetailModal
				isOpen={isDetailOpen}
				vacancy={selectedVacancy}
				currentUser={currentUser}
				onClose={() => {
					setIsDetailOpen(false);
					setSelectedVacancy(null);
				}}
				onApply={handleApply}
				onOpenApply={handleOpenApply}
				hasApplied={selectedVacancy ? hasApplied(selectedVacancy.id) : false}
				applications={applications}
			/>

			{/* Modal dodawania/edycji */}
			<VacancyFormModal
				isOpen={isFormOpen}
				vacancy={editingVacancy}
				currentUser={currentUser}
				teams={teams}
				pillars={pillars} // <-- DODAJ
				onClose={() => {
					setIsFormOpen(false);
					setEditingVacancy(null);
				}}
				onSave={handleSaveVacancy}
				onDelete={canManage ? handleDeleteVacancy : undefined}
			/>
			{/* Modal zgłoszeniowy - DODAJ TUTAJ */}
			<ApplyModal
				isOpen={isApplyOpen}
				vacancy={applyingVacancy}
				currentUser={currentUser}
				onClose={() => {
					setIsApplyOpen(false);
					setApplyingVacancy(null);
				}}
				onSubmit={handleSubmitApplication}
			/>
		</div>
	);
}
