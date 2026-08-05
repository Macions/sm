import { useUser } from "@/context/UserContext";
import { getCachedPermissions, type Permission } from "@/utils/permissions";
import { useState, useMemo, useEffect } from "react";
import { useCallback } from "react";
import { safeNavigate } from "@/utils/safeNavigation";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { logger } from "@/utils/logger";
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
	Eye,
	AlertCircle,
	Briefcase,
	PenLine,
	Users,
	Megaphone,
	GraduationCap,
	ChevronDown,
	ChevronRight,
	Lightbulb,
	Send,
	XCircle,
	ThumbsUp,
	ThumbsDown,
} from "lucide-react";
import styles from "./Projects.module.css";

type IdeaStatus = "pending" | "approved" | "rejected" | "in_progress";
type ProjectStatus = "planning" | "in_progress" | "promotion";

const ROLE_LABELS: Record<string, string> = {
	admin: "Administrator",
	coordinator: "Koordynator",
	member: "Członek",
};

const MOCK_IDEAS: Idea[] = [
	{
		id: "1",
		title: "Aplikacja mobilna dla członków",
		description:
			"Aplikacja umożliwiająca łatwy dostęp do informacji o projektach i wydarzeniach.",
		pillar: "Filar Projektowy",
		authorId: "1",
		authorName: "Jan Kowalski",
		status: "pending",
		votes: 5,
		upvotes: 7,
		downvotes: 2,
		createdAt: new Date().toISOString(),
		currentUserVote: null,
	},
	{
		id: "2",
		title: "Warsztaty z wystąpień publicznych",
		description:
			"Cykl warsztatów dla członków organizacji uczących skutecznej komunikacji.",
		pillar: "Filar Konferencyjny",
		authorId: "2",
		authorName: "Anna Nowak",
		status: "approved",
		votes: 12,
		upvotes: 14,
		downvotes: 2,
		createdAt: new Date(Date.now() - 86400000).toISOString(),
		currentUserVote: null,
	},
];
const PILLAR_LABELS_FALLBACK: Record<string, string> = {
	project: "Filar Projektowy",
	conference: "Filar Konferencyjny",
	advocacy: "Filar Rzeczniczy",
	simulation: "Filar Symulacyjny",
};
type ProjectPillar = "project" | "conference" | "advocacy" | "simulation";

type Idea = {
	id: string;
	title: string;
	description: string;
	pillar: string;
	authorId: string;
	authorName: string;
	status: IdeaStatus;
	votes: number;
	upvotes: number;
	downvotes: number;
	createdAt: string;
	currentUserVote?: "up" | "down" | null;
};

type Project = {
	id: string;
	name: string;
	description: string;
	pillar: ProjectPillar;
	status: ProjectStatus;
	estimated_end: string;
	team: string[];
	coordinator_id: string | number;
	created_at: string;
	updated_at: string;
};

type Task = {
	id: string;
	title: string;
	status: string;
	priority: string;
	dueDate: string;
	assignedToName: string;
	projectId?: string; // 🔥 DODAJ - potrzebne do filtrowania
	createdAt: string;
};
type User = {
	id: string;
	name: string;
	email: string;
	role: "admin" | "coordinator" | "member" | "board" | "zarząd"; // ← DODAJ "board" i "zarząd"
	pillar?: string | null;
	pillars?: string[];
	coordinatorPillars?: string[];
};

const MOCK_PROJECTS: Project[] = [
	{
		id: "1",
		name: "Aplikacja mobilna Siły Młodych",
		description:
			"Tworzenie aplikacji mobilnej dla członków organizacji umożliwiającej łatwy dostęp do informacji i wydarzeń.",
		pillar: "project",
		status: "in_progress",
		estimated_end: "2026-12-31",
		team: ["Zosia Wartacz", "Zuzanna Wojtusiak", "Maksym Marczak"],
		coordinator_id: "1",
		created_at: "2026-01-15",
		updated_at: "2026-07-10",
	},
	{
		id: "2",
		name: "Konferencja Młodych Liderów 2026",
		description:
			"Organizacja dorocznej konferencji dla młodych liderów z całej Polski.",
		pillar: "conference",
		status: "planning",
		estimated_end: "2026-11-15",
		team: ["Adrian Wróblewski", "Wojciech Podolski", "Maja Melerska"],
		coordinator_id: "2",
		created_at: "2026-03-01",
		updated_at: "2026-07-01",
	},
	{
		id: "3",
		name: "Kampania społeczna #MłodziGłosują",
		description:
			"Ogólnopolska kampania zachęcająca młodych ludzi do udziału w wyborach i aktywności obywatelskiej.",
		pillar: "advocacy",
		status: "promotion",
		estimated_end: "2026-10-30",
		team: ["Jan Augustynak", "Nikola Socha", "Oliwier Szulejko"],
		coordinator_id: "3",
		created_at: "2026-02-10",
		updated_at: "2026-07-15",
	},
	{
		id: "4",
		name: "Symulacja Sejmu RP",
		description:
			"Organizacja symulacji obrad Sejmu dla studentów i młodych polityków.",
		pillar: "simulation",
		status: "planning",
		estimated_end: "2027-01-20",
		team: ["Igor Piskórz", "Maksym Marczak"],
		coordinator_id: "4",
		created_at: "2026-05-01",
		updated_at: "2026-06-20",
	},
	{
		id: "5",
		name: "Debaty Oksfordzkie",
		description:
			"Cykl debat oksfordzkich w szkołach średnich promujących umiejętność argumentacji i krytycznego myślenia.",
		pillar: "conference",
		status: "in_progress",
		estimated_end: "2026-12-15",
		team: ["Adrian Wróblewski", "Wojciech Podolski", "Emilia Dobias"],
		coordinator_id: "5",
		created_at: "2026-04-10",
		updated_at: "2026-07-05",
	},
];

const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
	pending: "Oczekuje",
	approved: "Zaakceptowany",
	rejected: "Odrzucony",
	in_progress: "W realizacji",
};

const IDEA_STATUS_COLORS: Record<IdeaStatus, string> = {
	pending: styles.statusPending,
	approved: styles.statusApproved,
	rejected: styles.statusRejected,
	in_progress: styles.statusInProgress,
};
const getPillarsArray = (pillars: string | string[] | undefined): string[] => {
	if (!pillars) return [];
	if (Array.isArray(pillars)) return pillars;
	if (typeof pillars === "string") {
		return pillars
			.split(",")
			.map((p: string) => p.trim())
			.filter(Boolean);
	}
	return [];
};

// 🔥 DODAJ NOWĄ FUNKCJĘ - normalizuje nazwy filarów
const normalizePillarName = (pillar: string): string => {
	// Jeśli już ma "Filar " to zwróć jak jest
	if (pillar.startsWith("Filar ")) return pillar;

	// Mapowanie nazw bez prefiksu na nazwy z prefiksem
	const pillarMap: Record<string, string> = {
		Projektowy: "Filar Projektowy",
		Konferencyjny: "Filar Konferencyjny",
		Rzeczniczy: "Filar Rzeczniczy",
		Symulacyjny: "Filar Symulacyjny",
	};

	return pillarMap[pillar] || pillar;
};

const isPillarMatching = (userPillar: string, ideaPillar: string): boolean => {
	const normalizedUser = normalizePillarName(userPillar);
	const normalizedIdea = normalizePillarName(ideaPillar);
	return normalizedUser === normalizedIdea;
};
const getPillarsString = (pillars: string | string[] | undefined): string => {
	return getPillarsArray(pillars).join(", ");
};
const IDEA_STATUS_ICONS: Record<IdeaStatus, React.ReactNode> = {
	pending: <Clock size={14} />,
	approved: <CheckCircle size={14} />,
	rejected: <XCircle size={14} />,
	in_progress: <CheckCircle size={14} />,
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

interface ProjectCardProps {
	project: Project;
	onEdit: (project: Project) => void;
	onDelete: (id: string) => void;
	canEdit: boolean;
	users: User[];
	tasks?: Task[];
}

function ProjectCard({
	project,
	onEdit,
	onDelete,
	canEdit,
	users,
	tasks = [],
}: ProjectCardProps) {
	logger.debug("🔍 ProjectCard - projekt:", {
		id: project.id,
		name: project.name,
		coordinator_id: project.coordinator_id,
		users: users.length,

		foundUser: users.find((u) => u.id === project.coordinator_id?.toString()),
	});
	const [isExpanded, setIsExpanded] = useState(false);
	const projectTasks = tasks
		.filter((task) => task.projectId === project.id)
		.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		)
		.slice(0, 5);
	const getCoordinatorName = (coordinatorId: string) => {
		if (!coordinatorId) return "Brak";
		const user = users.find((u) => u.id === coordinatorId);
		return user ? user.name : "Brak";
	};

	const getTeamMemberName = (member: string) => {
		if (member.includes(" ")) {
			return member;
		}

		if (/^\d+$/.test(member)) {
			const user = users.find((u) => u.id === member);
			if (user) {
				return user.name;
			}

			return `ID: ${member}`;
		}
		return member;
	};

	const teamMembers = project.team.filter(
		(member) => /^\d+$/.test(member) && member !== "63",
	);
	const displayTeamCount = teamMembers.length;
	const formatDate = (dateString: string) => {
		if (!dateString) return "Brak daty";

		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return "Nieprawidłowa data";

			const day = String(date.getDate()).padStart(2, "0");
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const year = date.getFullYear();
			return `${day}.${month}.${year}`;
		} catch {
			return "Nieprawidłowa data";
		}
	};
	const pluralizePeople = (count: number) => {
		if (count === 1) return "osoba";
		if (count >= 2 && count <= 4) return "osoby";
		return "osób";
	};
	return (
		<div className={styles.projectCard}>
			<div className={styles.projectCard__header}>
				<div className={styles.projectCard__titleRow}>
					<h3 className={styles.projectCard__title}>{project.name}</h3>
					<span
						className={`${styles.projectCard__status} ${STATUS_COLORS[project.status]}`}
					>
						{STATUS_ICONS[project.status]}
						{STATUS_LABELS[project.status]}
					</span>
				</div>
				<div className={styles.projectCard__pillar}>
					{PILLAR_ICONS[project.pillar]}
					{PILLAR_LABELS_FALLBACK[project.pillar] || project.pillar}
				</div>
			</div>

			<div className={styles.projectCard__body}>
				<p className={styles.projectCard__description}>{project.description}</p>

				<div className={styles.projectCard__meta}>
					<div className={styles.projectCard__metaItem}>
						<Calendar size={14} />
						<span>
							Szacowane zakończenie:{" "}
							<strong>{formatDate(project.estimated_end)}</strong>
						</span>
					</div>
					<div className={styles.projectCard__metaItem}>
						<UsersIcon size={14} />
						<span>
							Zespół:{" "}
							<strong>
								{displayTeamCount} {pluralizePeople(displayTeamCount)}
							</strong>
						</span>
					</div>
				</div>
				{projectTasks.length > 0 && (
					<div className={styles.projectTasks}>
						<div className={styles.projectTasks__header}>
							<h4 className={styles.projectTasks__title}>
								<CheckCircle size={14} />
								Ostatnie zadania ({projectTasks.length})
							</h4>
						</div>
						<ul className={styles.projectTasks__list}>
							{projectTasks.map((task) => (
								<li key={task.id} className={styles.projectTasks__item}>
									<span className={styles.projectTasks__status}>
										{task.status === "done" ? (
											<CheckCircle size={12} className={styles.statusDone} />
										) : task.status === "in_progress" ? (
											<Clock size={12} className={styles.statusInProgress} />
										) : task.status === "review" ? (
											<Eye size={12} className={styles.statusReview} />
										) : (
											<Clock size={12} className={styles.statusTodo} />
										)}
									</span>
									<span className={styles.projectTasks__title}>
										{task.title}
									</span>
									<span className={styles.projectTasks__assignee}>
										<UsersIcon size={12} />
										{task.assignedToName}
									</span>
									<span className={styles.projectTasks__due}>
										<Calendar size={12} />
										{new Date(task.dueDate).toLocaleDateString("pl-PL")}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}
				<div className={styles.projectCard__coordinator}>
					<Tag size={14} />
					<span>
						Koordynator:{" "}
						<strong>
							{getCoordinatorName(String(project.coordinator_id))}
						</strong>
					</span>
				</div>

				{isExpanded && (
					<div className={styles.projectCard__team}>
						<h4 className={styles.projectCard__teamTitle}>
							Członkowie zespołu:
						</h4>
						<ul className={styles.projectCard__teamList}>
							{project.team.map((member) => (
								<li key={member} className={styles.projectCard__teamMember}>
									{getTeamMemberName(member)}
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

interface ProjectModalProps {
	isOpen: boolean;
	project: Project | null;
	onClose: () => void;
	onSave: (project: Project) => void;
	users: User[];
	userPillars?: string[]; // <- DODAJ
	isAdminOrBoard?: boolean; // <- DODAJ
}

function ProjectModal({
	isOpen,
	project,
	onClose,
	onSave,
	users,
	userPillars = [],
	isAdminOrBoard = false,
}: ProjectModalProps) {
	console.log("🔍 [ProjectModal] userPillars:", userPillars);
	console.log("🔍 [ProjectModal] isAdminOrBoard:", isAdminOrBoard);

	const [formData, setFormData] = useState<Partial<Project>>(
		project || {
			name: "",
			description: "",
			pillar: "project",
			status: "planning",
			estimated_end: "",
			team: [],
			coordinator_id: "",
		},
	);

	// ✅ HOOKI PRZED if (!isOpen) - TYLKO JEDNA KOPIA!
	const availablePillars = useMemo(() => {
		if (isAdminOrBoard) {
			return Object.keys(PILLAR_LABELS_FALLBACK);
		}

		const userPillarKeys = userPillars
			.map((p) => {
				const entry = Object.entries(PILLAR_LABELS_FALLBACK).find(
					([key, label]) => {
						// Sprawdź czy pasuje po pełnej nazwie
						if (label === p) return true;
						// Sprawdź czy pasuje po skróconej nazwie
						if (key === p) return true;
						// Sprawdź czy pasuje po nazwie bez "Filar "
						const labelWithoutPrefix = label.replace("Filar ", "");
						if (labelWithoutPrefix === p) return true;
						return false;
					},
				);
				return entry ? entry[0] : null;
			})
			.filter(Boolean) as string[];

		return userPillarKeys;
	}, [userPillars, isAdminOrBoard]);

	// Automatycznie wybierz filar jeśli tylko jeden dostępny
	useEffect(() => {
		if (availablePillars.length === 1 && !formData.pillar && isOpen) {
			setFormData((prev) => ({
				...prev,
				pillar: availablePillars[0] as ProjectPillar,
			}));
		}
	}, [availablePillars, isOpen]);

	useEffect(() => {
		if (project) {
			setFormData({
				id: project.id,
				name: project.name || "",
				description: project.description || "",
				pillar: project.pillar || "project",
				status: project.status || "planning",
				estimated_end: project.estimated_end || "",
				team: project.team || [],
				coordinator_id: project.coordinator_id || "",
				created_at: project.created_at || "",
				updated_at: project.updated_at || "",
			});
		} else {
			setFormData({
				name: "",
				description: "",
				pillar: "project",
				status: "planning",
				estimated_end: "",
				team: [],
				coordinator_id: "",
			});
		}
	}, [project]);

	// ✅ TERAZ MOŻE BYĆ if (!isOpen)
	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const now = new Date().toISOString().split("T")[0];
		const saveData: Project = {
			id: project?.id || `project-${Date.now()}`,
			name: formData.name || "",
			description: formData.description || "",
			pillar: (formData.pillar as ProjectPillar) || "project",
			status: (formData.status as ProjectStatus) || "planning",
			estimated_end: formData.estimated_end || "",
			team: formData.team || [],
			coordinator_id: formData.coordinator_id || "",
			created_at: project?.created_at || now,
			updated_at: now,
		};
		onSave(saveData);
		onClose();
	};

	// ❌ USUŃ TEN DUPLIKAT (linie ~680-700):
	/*
	const availablePillars = useMemo(() => {
		if (isAdminOrBoard) {
			return Object.keys(PILLAR_LABELS_FALLBACK);
		}
		const userPillarKeys = userPillars.map(p => {
			const entry = Object.entries(PILLAR_LABELS_FALLBACK).find(
				([key, label]) => label === p || p === key
			);
			return entry ? entry[0] : null;
		}).filter(Boolean) as string[];
		return userPillarKeys;
	}, [userPillars, isAdminOrBoard]);

	useEffect(() => {
		if (availablePillars.length === 1 && !formData.pillar) {
			setFormData(prev => ({
				...prev,
				pillar: availablePillars[0] as ProjectPillar,
			}));
		}
	}, [availablePillars]);
	*/

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
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							required
						/>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Opis projektu *</label>
						<textarea
							className={`${styles.modal__input} ${styles.modal__textarea}`}
							value={formData.description || ""}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							required
						/>
					</div>
					<div className={styles.modal__row}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Filar *</label>
							<select
								className={styles.modal__select}
								value={formData.pillar || ""}
								onChange={(e) =>
									setFormData({
										...formData,
										pillar: e.target.value as ProjectPillar,
									})
								}
								required
							>
								<option value="">Wybierz filar</option>
								{availablePillars.map((key) => (
									<option key={key} value={key}>
										{PILLAR_LABELS_FALLBACK[key]}
									</option>
								))}
							</select>
							{availablePillars.length === 0 && (
								<p style={{ color: "red", fontSize: "13px", marginTop: "4px" }}>
									Nie masz przypisanego żadnego filaru. Skontaktuj się z
									administratorem.
								</p>
							)}
						</div>

						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Status *</label>
							<select
								className={styles.modal__select}
								value={formData.status || "planning"}
								onChange={(e) =>
									setFormData({
										...formData,
										status: e.target.value as ProjectStatus,
									})
								}
							>
								<option value="planning">Faza planowania</option>
								<option value="in_progress">Faza pracy</option>
								<option value="promotion">Faza promocji</option>
							</select>
						</div>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>
							Szacowany czas ukończenia *
						</label>
						<input
							type="date"
							className={styles.modal__input}
							value={formData.estimated_end || ""}
							onChange={(e) =>
								setFormData({ ...formData, estimated_end: e.target.value })
							}
							required
						/>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Koordynator *</label>
						<select
							className={styles.modal__select}
							value={formData.coordinator_id || ""}
							onChange={(e) =>
								setFormData({ ...formData, coordinator_id: e.target.value })
							}
							required
						>
							<option value="">Wybierz koordynatora</option>
							{users.map((user) => (
								<option key={user.id} value={user.id}>
									{user.name} ({ROLE_LABELS[user.role] || user.role}){" "}
								</option>
							))}
						</select>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Zespół</label>
						<TeamSelector
							users={users}
							selectedTeam={formData.team || []}
							onTeamChange={(team) => setFormData({ ...formData, team })}
							pillar={formData.pillar}
						/>
					</div>
					<div className={styles.modal__actions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={onClose}
						>
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

interface TeamSelectorProps {
	users: User[];
	selectedTeam: string[];
	onTeamChange: (team: string[]) => void;
	pillar?: ProjectPillar | null;
}

const pluralizeUsers = (count: number) => {
	return count === 1 ? "użytkownika" : "użytkowników";
};

const pluralizePeople = (count: number) => {
	if (count === 1) return "osobę";
	if (count >= 2 && count <= 4) return "osoby";
	return "osób";
};

function TeamSelector({
	users,
	selectedTeam,
	onTeamChange,
	pillar,
}: TeamSelectorProps) {
	const [filter, setFilter] = useState<"all" | "pillar" | "custom">("all");
	const [forceUpdate, setForceUpdate] = useState(0);

	// 🔥 DODAJ - automatycznie wybierz wszystkich gdy filter === "all" i selectedTeam jest puste
	useEffect(() => {
		if (filter === "all" && selectedTeam.length === 0 && users.length > 0) {
			const allIds = users.map((u) => u.id);
			onTeamChange(allIds);
		}
	}, [filter, users, selectedTeam.length, onTeamChange]);

	// Wymuś odświeżenie gdy zmieni się filtr
	useEffect(() => {
		setForceUpdate((prev) => prev + 1);
	}, [filter, pillar]);

	const filteredUsers = useMemo(() => {
		if (filter === "pillar" && pillar) {
			const pillarName =
				PILLAR_LABELS_FALLBACK[pillar as ProjectPillar] || pillar;
			const searchPillar = pillarName.replace("Filar ", "");

			return users.filter((u) => {
				if (u.pillars && Array.isArray(u.pillars) && u.pillars.length > 0) {
					return u.pillars.some((p: string) => {
						const normalizedP = p.replace("Filar ", "");
						return normalizedP === searchPillar || p === pillarName;
					});
				}
				if (u.pillar) {
					const normalizedP = u.pillar.replace("Filar ", "");
					return normalizedP === searchPillar || u.pillar === pillarName;
				}
				return false;
			});
		}
		if (filter === "all") {
			return users;
		}
		return users;
	}, [users, filter, pillar, forceUpdate]);

	const toggleUser = (userId: string) => {
		if (selectedTeam.includes(userId)) {
			const newTeam = selectedTeam.filter((id) => id !== userId);
			onTeamChange(newTeam);
		} else {
			const newTeam = [...selectedTeam, userId];
			onTeamChange(newTeam);
		}
	};

	const selectAll = () => {
		const allIds = filteredUsers.map((u) => u.id);
		onTeamChange(allIds);
	};

	const selectNone = () => {
		onTeamChange([]);
	};

	return (
		<div className={styles.teamSelector}>
			<div className={styles.teamSelector__options}>
				<button
					type="button"
					className={`${styles.teamSelector__option} ${filter === "all" ? styles.teamSelector__optionActive : ""}`}
					onClick={() => {
						setFilter("all");
						const allIds = users.map((u) => u.id);
						onTeamChange(allIds);
					}}
				>
					<Users size={14} />
					Wszyscy użytkownicy
				</button>
				{pillar && (
					<button
						type="button"
						className={`${styles.teamSelector__option} ${filter === "pillar" ? styles.teamSelector__optionActive : ""}`}
						onClick={() => {
							setFilter("pillar");
							const pillarName =
								PILLAR_LABELS_FALLBACK[pillar as ProjectPillar] || pillar;
							const searchPillar = pillarName.replace("Filar ", "");

							const pillarIds = users
								.filter((u) => {
									if (
										u.pillars &&
										Array.isArray(u.pillars) &&
										u.pillars.length > 0
									) {
										return u.pillars.some((p: string) => {
											const normalizedP = p.replace("Filar ", "");
											return normalizedP === searchPillar || p === pillarName;
										});
									}
									if (u.pillar) {
										const normalizedP = u.pillar.replace("Filar ", "");
										return (
											normalizedP === searchPillar || u.pillar === pillarName
										);
									}
									return false;
								})
								.map((u) => u.id);
							onTeamChange(pillarIds);
						}}
					>
						<Briefcase size={14} />
						Tylko z filaru
					</button>
				)}
				<button
					type="button"
					className={`${styles.teamSelector__option} ${filter === "custom" ? styles.teamSelector__optionActive : ""}`}
					onClick={() => setFilter("custom")}
				>
					<UsersIcon size={14} />
					Wybierz ręcznie
				</button>
			</div>

			{(filter === "pillar" || filter === "custom") && (
				<>
					<div className={styles.teamSelector__actions}>
						<button
							type="button"
							className={styles.teamSelector__action}
							onClick={selectAll}
						>
							Zaznacz wszystkich
						</button>
						<button
							type="button"
							className={styles.teamSelector__action}
							onClick={selectNone}
						>
							Odznacz wszystkich
						</button>
					</div>

					<div className={styles.teamSelector__list}>
						{filteredUsers.length === 0 ? (
							<p className={styles.teamSelector__empty}>
								{filter === "pillar"
									? "Brak użytkowników w tym filarze"
									: "Brak użytkowników"}
							</p>
						) : (
							filteredUsers.map((user) => (
								<label key={user.id} className={styles.teamSelector__item}>
									<input
										type="checkbox"
										checked={selectedTeam.includes(user.id)}
										onChange={() => toggleUser(user.id)}
										className={styles.teamSelector__checkbox}
									/>
									<span className={styles.teamSelector__name}>{user.name}</span>
									<span
										className={`${styles.teamSelector__role} ${styles[ROLE_COLORS[user.role] || ""]}`}
									>
										{ROLE_LABELS[user.role] || user.role}
									</span>
									{user.pillars &&
										Array.isArray(user.pillars) &&
										user.pillars.length > 0 && (
											<span className={styles.teamSelector__pillar} hidden>
												{user.pillars.join(", ")}
											</span>
										)}
									{user.pillar && !user.pillars?.length && (
										<span className={styles.teamSelector__pillar}>
											{user.pillar}
										</span>
									)}
								</label>
							))
						)}
					</div>
				</>
			)}

			{filter === "all" && (
				<div className={styles.teamSelector__info}>
					{selectedTeam.length === users.length ? (
						<p className={styles.teamSelector__infoText}>
							Wybrano{" "}
							<strong>
								wszystkich {users.length} {pluralizeUsers(users.length)}
							</strong>
						</p>
					) : (
						<p className={styles.teamSelector__infoText}>
							Wybrano:{" "}
							<strong>
								{selectedTeam.length} {pluralizePeople(selectedTeam.length)}
							</strong>
						</p>
					)}
				</div>
			)}

			<div className={styles.teamSelector__summary}>
				<strong>{selectedTeam.length}</strong> / {users.length}{" "}
				{pluralizeUsers(users.length)}
			</div>
		</div>
	);
}

const mapPillar = (pillar: string): ProjectPillar => {
	if (["project", "conference", "advocacy", "simulation"].includes(pillar)) {
		return pillar as ProjectPillar;
	}

	const mapping: Record<string, ProjectPillar> = {
		"Filar Projektowy": "project",
		"Filar Konferencyjny": "conference",
		"Filar Rzeczniczy": "advocacy",
		"Filar Symulacyjny": "simulation",
	};
	return mapping[pillar] || "project";
};

const ROLE_COLORS: Record<string, string> = {
	admin: "roleAdmin",
	coordinator: "roleCoordinator",
	member: "roleMember",
};

interface IdeaModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (idea: {
		title: string;
		description: string;
		pillar: string;
	}) => void;
	currentUser: User;
	pillars: string[];
}

function IdeaModal({ isOpen, onClose, onSubmit, pillars }: IdeaModalProps) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [pillar, setPillar] = useState("");

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (title.trim() && description.trim() && pillar) {
			onSubmit({
				title: title.trim(),
				description: description.trim(),
				pillar,
			});
			setTitle("");
			setDescription("");
			setPillar("");
			onClose();
			toast.success("Pomysł został zgłoszony!");
		} else {
			toast.error("Wypełnij wszystkie pola");
		}
	};

	const pillarOptions = [
		{ value: "", label: "Wybierz filar..." },
		...pillars.map((p) => ({
			value: p,
			label: p,
		})),
	];

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modal__header}>
					<div className={styles.modal__headerLeft}>
						<Lightbulb size={24} className={styles.modal__icon} />
						<h2 className={styles.modal__title}>Zgłoś pomysł na projekt</h2>
					</div>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__body}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>
								Tytuł pomysłu <span className={styles.modal__required}>*</span>
							</label>
							<input
								type="text"
								className={styles.modal__input}
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="np. Aplikacja mobilna dla członków"
								required
							/>
						</div>

						<div className={styles.modal__field}>
							<label className={styles.modal__label}>
								Opis pomysłu <span className={styles.modal__required}>*</span>
							</label>
							<textarea
								className={`${styles.modal__input} ${styles.modal__textarea}`}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={4}
								placeholder="Opisz swój pomysł, co chcesz zrobić i dlaczego warto..."
								required
							/>
						</div>

						<div className={styles.modal__field}>
							<label className={styles.modal__label}>
								Filar <span className={styles.modal__required}>*</span>
							</label>
							<select
								className={styles.modal__select}
								value={pillar}
								onChange={(e) => setPillar(e.target.value)}
								required
							>
								{pillarOptions.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>

						<div className={styles.modal__info}>
							<AlertCircle size={16} />
							<span>
								Twój pomysł zostanie przesłany do koordynatora filaru. Inni
								użytkownicy będą mogli głosować na Twój pomysł.
							</span>
						</div>
					</div>

					<div className={styles.modal__actions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={onClose}
						>
							Anuluj
						</button>
						<button type="submit" className={styles.modal__btnSave}>
							<Send size={16} />
							Wyślij pomysł
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

interface IdeaCardProps {
	idea: Idea;
	currentUser: User;
	onVote: (ideaId: string, type: "up" | "down") => void;
	onStatusChange?: (ideaId: string, status: IdeaStatus) => void;
	canManage: boolean;
	pillars: string[];
	permissions: Permission[];
}

function IdeaCard({
	idea,
	currentUser,
	onVote,
	onStatusChange,
	pillars,
	permissions,
}: IdeaCardProps) {
	const userVote = idea.currentUserVote || null;

	const formatDate = (date: string) => {
		if (!date) return "Brak daty";
		try {
			const d = new Date(date);
			if (isNaN(d.getTime())) return "Brak daty";
			return d.toLocaleDateString("pl-PL", {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		} catch {
			return "Brak daty";
		}
	};
	const getPointsLabel = (points: number | string): string => {
		const value = Number(points);
		const absPoints = Math.abs(value);

		if (absPoints === 1) {
			return `${value} punkt`;
		}

		if (
			absPoints % 10 >= 2 &&
			absPoints % 10 <= 4 &&
			!(absPoints % 100 >= 12 && absPoints % 100 <= 14)
		) {
			return `${value} punkty`;
		}

		return `${value} punktów`;
	};
	const IconComponent = PILLAR_ICONS[idea.pillar as ProjectPillar] || (
		<Briefcase size={16} />
	);
	const pillarLabel = pillars.includes(idea.pillar)
		? idea.pillar
		: PILLAR_LABELS_FALLBACK[idea.pillar] || idea.pillar;

	const isUpActive = userVote === "up";

	const isDownActive = userVote === "down";
	const isAuthor = idea.authorId === currentUser.id;
	return (
		<div className={styles.ideaCard}>
			<div className={styles.ideaCard__header}>
				<div className={styles.ideaCard__titleRow}>
					<h3 className={styles.ideaCard__title}>{idea.title}</h3>
					<span
						className={`${styles.ideaCard__status} ${IDEA_STATUS_COLORS[idea.status]}`}
					>
						{IDEA_STATUS_ICONS[idea.status]}
						{IDEA_STATUS_LABELS[idea.status]}
					</span>
				</div>
				<div className={styles.ideaCard__pillar}>
					{IconComponent}
					{pillarLabel}
				</div>
			</div>

			<p className={styles.ideaCard__description}>{idea.description}</p>

			<div className={styles.ideaCard__meta}>
				<span className={styles.ideaCard__author}>
					<Users size={14} />
					{idea.authorName}
				</span>
				<span className={styles.ideaCard__date}>
					<Clock size={14} />
					{formatDate(idea.createdAt)}
				</span>
			</div>

			<div className={styles.ideaCard__votes}>
				{isAuthor ? (
					<>
						<span className={styles.voteCount}>
							<ThumbsUp size={16} />
							{idea.upvotes}
						</span>
						<span className={styles.voteCount}>
							<ThumbsDown size={16} />
							{idea.downvotes}
						</span>
						<span className={styles.ideaCard__voteScore}>
							{getPointsLabel(idea.votes)}
						</span>
						<span className={styles.ideaCard__authorBadge}>
							<PenLine size={14} />
							Twój pomysł
						</span>
					</>
				) : (
					<>
						{idea.status === "pending" ? (
							<>
								<button
									className={`${styles.voteBtn} ${styles.voteUp} ${isUpActive ? styles.voteUpActive : ""}`}
									onClick={() => onVote(idea.id, "up")}
									disabled={isUpActive}
								>
									<ThumbsUp size={16} />
									{idea.upvotes}
								</button>
								<button
									className={`${styles.voteBtn} ${styles.voteDown} ${isDownActive ? styles.voteDownActive : ""}`}
									onClick={() => onVote(idea.id, "down")}
									disabled={isDownActive}
								>
									<ThumbsDown size={16} />
									{idea.downvotes}
								</button>
								<span className={styles.ideaCard__voteScore}>
									{getPointsLabel(idea.votes)}
								</span>
							</>
						) : (
							<>
								<span className={styles.voteCount}>
									<ThumbsUp size={16} />
									{idea.upvotes}
								</span>
								<span className={styles.voteCount}>
									<ThumbsDown size={16} />
									{idea.downvotes}
								</span>
								<span className={styles.ideaCard__voteScore}>
									{getPointsLabel(idea.votes)}
								</span>
							</>
						)}
					</>
				)}
			</div>
			{idea.status === "pending" && (
				<div className={styles.ideaCard__actions}>
					{permissions.includes("canManageAllProjects") && (
						<>
							<button
								className={`${styles.ideaCard__actionBtn} ${styles.ideaCard__actionBtnSuccess}`}
								onClick={() => onStatusChange?.(idea.id, "approved")}
								type="button"
							>
								<CheckCircle size={14} /> Zaakceptuj
							</button>
							<button
								className={`${styles.ideaCard__actionBtn} ${styles.ideaCard__actionBtnDanger}`}
								onClick={() => onStatusChange?.(idea.id, "rejected")}
								type="button"
							>
								<XCircle size={14} /> Odrzuć
							</button>
						</>
					)}

					{permissions.includes("canManagePillarProjects") &&
						getPillarsArray(currentUser?.coordinatorPillars).some((up) =>
							isPillarMatching(up, idea.pillar),
						) && (
							<>
								<button
									className={`${styles.ideaCard__actionBtn} ${styles.ideaCard__actionBtnSuccess}`}
									onClick={() => onStatusChange?.(idea.id, "approved")}
									type="button"
								>
									<CheckCircle size={14} /> Zaakceptuj
								</button>
								<button
									className={`${styles.ideaCard__actionBtn} ${styles.ideaCard__actionBtnDanger}`}
									onClick={() => onStatusChange?.(idea.id, "rejected")}
									type="button"
								>
									<XCircle size={14} /> Odrzuć
								</button>
							</>
						)}
				</div>
			)}
		</div>
	);
}
export default function Projects() {
	const navigate = useNavigate();
	const { user: contextUser } = useUser();
	const [projects, setProjects] = useState<Project[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [pillars, setPillars] = useState<string[]>([]);
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [permissions, setPermissions] = useState<Permission[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	useEffect(() => {
		const fetchTasks = async () => {
			try {
				const token = localStorage.getItem("accessToken");
				const response = await fetch("/api/tasks", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});
				if (response.ok) {
					const data = await response.json();
					// Mapuj dane do typu Task
					const mappedTasks = data.map((task: any) => ({
						id: task.id,
						title: task.title,
						status: task.status,
						priority: task.priority,
						dueDate: task.dueDate,
						assignedToName: task.assignedToName || "Nieprzypisany",
						projectId: task.projectId || task.project_id?.toString(),
						createdAt: task.createdAt || task.created_at,
					}));
					setTasks(mappedTasks);
				}
			} catch (error) {
				console.error("Błąd pobierania zadań:", error);
			}
		};
		fetchTasks();
	}, []);
	const refreshAllData = useCallback(async () => {
		console.log("🔄 [REFRESH] Odświeżanie danych...");

		const token = localStorage.getItem("accessToken");
		if (!token) {
			console.warn("⚠️ [REFRESH] Brak tokenu");
			return;
		}

		try {
			// 1. Odśwież profil
			const profileRes = await fetch("/api/profile", {
				headers: { Authorization: `Bearer ${token}` },
			});

			let profileData = null;
			if (profileRes.ok) {
				profileData = await profileRes.json();
				console.log("👤 Profil pobrany:", profileData);

				// 🔥 DODAJ - zapisz do localStorage z coordinatorPillars
				const userForStorage = {
					id: profileData.id,
					firstName: profileData.firstName,
					lastName: profileData.lastName,
					email: profileData.email,
					role: profileData.role,
					team: profileData.team,
					pillar: profileData.pillar,
					pillars: profileData.pillars || [],
					coordinatorPillars: profileData.coordinatorPillars || [],
				};
				localStorage.setItem("user", JSON.stringify(userForStorage));
				console.log(
					"✅ Zapisano user do localStorage z coordinatorPillars:",
					userForStorage.coordinatorPillars,
				);

				setCurrentUser({
					id: String(profileData.id),
					name: `${profileData.firstName} ${profileData.lastName}`,
					email: profileData.email || "",
					role: profileData.role as "admin" | "coordinator" | "member",
					pillar: profileData.pillar || null,
					pillars: profileData.pillars || "",
					coordinatorPillars: profileData.coordinatorPillars || [],
				});
			}

			// 🔥 2. Pobierz uprawnienia - NAJPIERW SPRAWDŹ CZY KOORDYNATOR
			if (profileData?.role) {
				console.log("🔓 Pobieranie uprawnień...");

				const coordRes = await fetch("/api/user/is-coordinator", {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (coordRes.ok) {
					const coordData = await coordRes.json();
					console.log("👑 Status koordynatora:", coordData);

					if (coordData.isCoordinator) {
						const perms: Permission[] = [
							"canManagePillarProjects",
							"canManagePillarIdeas",
						];
						if (coordData.isAdmin) {
							perms.push("canManageAllProjects");
						}
						setPermissions(perms);
						console.log("✅ Uprawnienia koordynatora ustawione:", perms);
					} else {
						const perms = await getCachedPermissions(profileData.role);
						setPermissions(perms);
					}
				} else {
					const perms = await getCachedPermissions(profileData.role);
					setPermissions(perms);
				}
			}

			// 3. Odśwież pomysły
			const ideasRes = await fetch("/api/ideas", {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (ideasRes.ok) {
				const ideasData = await ideasRes.json();
				const mappedIdeas = ideasData.map((idea: any) => ({
					id: idea.id.toString(),
					title: idea.title,
					description: idea.description,
					pillar: idea.pillar,
					authorId: idea.author_id?.toString() || "unknown",
					authorName: idea.author_name || "Nieznany",
					status: (idea.status as IdeaStatus) || "pending",
					votes: idea.votes || 0,
					upvotes: idea.upvotes || 0,
					downvotes: idea.downvotes || 0,
					createdAt: idea.created_at || new Date().toISOString(),
					currentUserVote: idea.user_vote || null,
				}));
				setIdeas(mappedIdeas);
			}

			// 4. Odśwież projekty
			const projectsRes = await fetch("/api/projects", {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (projectsRes.ok) {
				const projectsData = await projectsRes.json();
				const mappedProjects = projectsData.map((apiProject: any) => ({
					id: apiProject.id,
					name: apiProject.name,
					description: apiProject.description || "",
					pillar: mapPillar(String(apiProject.pillar)),
					status: apiProject.status as ProjectStatus,
					estimated_end: apiProject.estimated_end,
					coordinator_id: apiProject.coordinator_id?.toString() || "",
					team: apiProject.team
						? apiProject.team.split(",").map((t: string) => t.trim())
						: [],
					created_at: apiProject.created_at,
					updated_at: apiProject.updated_at,
				}));
				setProjects(mappedProjects);
			}

			console.log("✅ [REFRESH] Dane odświeżone!");
		} catch (error) {
			console.error("❌ [REFRESH] Błąd odświeżania:", error);
		}
	}, []);

	// Nasłuchuj na zmiany HMR
	useEffect(() => {
		// Obsługa HMR - odśwież dane gdy moduł jest aktualizowany
		if (import.meta.hot) {
			import.meta.hot.on("vite:afterUpdate", () => {
				console.log("🔄 [HMR] Wykryto zmianę kodu - odświeżam dane...");
				setTimeout(() => {
					refreshAllData();
				}, 100);
			});
		}
	}, [refreshAllData]);

	// Odśwież dane przy montowaniu i po zmianie uprawnień
	useEffect(() => {
		if (currentUser?.role) {
			refreshAllData();
		}
	}, [currentUser?.role]);
	useEffect(() => {
		const loadPermissions = async () => {
			if (!currentUser?.role) return;
			try {
				const token = localStorage.getItem("accessToken");
				const response = await fetch("/api/user/is-coordinator", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (response.ok) {
					const data = await response.json();
					console.log("👑 Status koordynatora z endpointu:", data);

					if (data.isCoordinator) {
						const perms: Permission[] = [
							"canManagePillarProjects",
							"canManagePillarIdeas",
						];

						if (data.isAdmin) {
							perms.push("canManageAllProjects");
						}

						setPermissions(perms);

						// 🔥 DODAJ - zapisz coordinatorPillars do localStorage
						const currentUserData = JSON.parse(
							localStorage.getItem("user") || "{}",
						);
						const updatedUser = {
							...currentUserData,
							coordinatorPillars: data.leaderTeams.map((t: any) => t.name),
							isCoordinator: true,
						};
						localStorage.setItem("user", JSON.stringify(updatedUser));
						console.log(
							"✅ Zaktualizowano localStorage z coordinatorPillars:",
							updatedUser.coordinatorPillars,
						);

						setCurrentUser((prev) =>
							prev
								? {
										...prev,
										coordinatorPillars: data.leaderTeams.map(
											(t: any) => t.name,
										),
									}
								: prev,
						);

						return;
					}
				}

				const perms = await getCachedPermissions(currentUser.role);
				setPermissions(perms);
			} catch (error) {
				logger.error("❌ Błąd pobierania uprawnień:", error);
				const perms = await getCachedPermissions(currentUser.role);
				setPermissions(perms);
			}
		};
		loadPermissions();
	}, [currentUser?.role]);
	// Projects.tsx - w useEffect dla contextUser
	useEffect(() => {
		if (contextUser) {
			// 🔥 DODAJ - zapisz do localStorage z coordinatorPillars
			const userForStorage = {
				id: contextUser.id,
				firstName: contextUser.firstName,
				lastName: contextUser.lastName,
				email: contextUser.email,
				role: contextUser.role,
				pillar: (contextUser as any).pillar || null,
				pillars: (contextUser as any).pillars || [],
				coordinatorPillars: (contextUser as any).coordinatorPillars || [],
			};
			localStorage.setItem("user", JSON.stringify(userForStorage));

			setCurrentUser({
				id: String(contextUser.id),
				name: `${contextUser.firstName} ${contextUser.lastName}`,
				email: contextUser.email || "",
				role: contextUser.role as "admin" | "coordinator" | "member",
				pillar: (contextUser as any).pillar || null,
				pillars: (contextUser as any).pillars || "",
				coordinatorPillars: (contextUser as any).coordinatorPillars || [],
			});
		}
	}, [contextUser]);

	const [searchTerm, setSearchTerm] = useState("");
	const [selectedPillar, setSelectedPillar] = useState<ProjectPillar | "all">(
		"all",
	);
	const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | "all">(
		"all",
	);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingProject, setEditingProject] = useState<Project | null>(null);
	const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
	const [ideas, setIdeas] = useState<Idea[]>([]);
	const [activeTab, setActiveTab] = useState<"projects" | "ideas">("projects");

	const handleSubmitIdea = async (idea: {
		title: string;
		description: string;
		pillar: string;
	}) => {
		try {
			const token = localStorage.getItem("accessToken");

			logger.debug("📤 Wysyłam pomysł do backendu:", idea);

			const response = await fetch("/api/ideas", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: idea.title,
					description: idea.description,
					pillar: idea.pillar,
					authorId: currentUser?.id,
					authorName: currentUser?.name,
				}),
			});

			logger.debug("📥 Status odpowiedzi:", response.status);

			if (!response.ok) {
				const errorText = await response.text();
				logger.error("❌ Błąd odpowiedzi:", response.status, errorText);

				const newIdea: Idea = {
					id: `idea-${Date.now()}`,
					title: idea.title,
					description: idea.description,
					pillar: idea.pillar,
					authorId: currentUser?.id || "unknown",
					authorName: currentUser?.name || "Nieznany",
					status: "pending",
					votes: 0,
					upvotes: 0,
					downvotes: 0,
					createdAt: new Date().toISOString(),
					currentUserVote: null,
				};
				setIdeas([newIdea, ...ideas]);
				toast.error("Pomysł zapisany lokalnie (backend niedostępny)", {
					duration: 4000,
				});
				setIsIdeaModalOpen(false);
				return;
			}

			const newIdea = await response.json();
			logger.debug("✅ Nowy pomysł z backendu:", newIdea);

			setIdeas([newIdea, ...ideas]);
			toast.success("Pomysł został zgłoszony!");

			setIsIdeaModalOpen(false);

			logger.debug("🔄 Przeładowuję stronę i otwieram zakładkę pomysły...");

			sessionStorage.setItem("openIdeasTab", "true");

			setTimeout(() => {
				window.location.reload();
			}, 1500);
		} catch (error) {
			logger.error("❌ Błąd:", error);

			const newIdea: Idea = {
				id: `idea-${Date.now()}`,
				title: idea.title,
				description: idea.description,
				pillar: idea.pillar,
				authorId: currentUser?.id || "unknown",
				authorName: currentUser?.name || "Nieznany",
				status: "pending",
				votes: 0,
				upvotes: 0,
				downvotes: 0,
				createdAt: new Date().toISOString(),
				currentUserVote: null,
			};
			setIdeas([newIdea, ...ideas]);
			toast.error("Pomysł zapisany lokalnie (backend niedostępny)", {
				duration: 4000,
			});
			setIsIdeaModalOpen(false);

			sessionStorage.setItem("openIdeasTab", "true");
			setTimeout(() => {
				window.location.reload();
			}, 1500);
		}
	};

	const handleVote = async (ideaId: string, type: "up" | "down") => {
		try {
			const token = localStorage.getItem("accessToken");

			const currentIdea = ideas.find((i) => i.id === ideaId);
			if (!currentIdea) return;

			if (currentIdea.currentUserVote === type) {
				toast("Już zagłosowałeś w ten sposób", {
					icon: "ℹ️",
					duration: 3000,
				});
				return;
			}

			setIdeas((prevIdeas) =>
				prevIdeas.map((i) => {
					if (i.id === ideaId) {
						let newUpvotes = i.upvotes;
						let newDownvotes = i.downvotes;
						let newVotes = i.votes;

						if (i.currentUserVote === "down" && type === "up") {
							newDownvotes--;
							newUpvotes++;
							newVotes += 2;
						} else if (i.currentUserVote === "up" && type === "down") {
							newUpvotes--;
							newDownvotes++;
							newVotes -= 2;
						} else {
							if (type === "up") {
								newUpvotes++;
								newVotes++;
							} else {
								newDownvotes++;
								newVotes--;
							}
						}

						return {
							...i,
							upvotes: newUpvotes,
							downvotes: newDownvotes,
							votes: newVotes,
							currentUserVote: type,
						};
					}
					return i;
				}),
			);

			const response = await fetch(`/api/ideas/${ideaId}/vote`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ type }),
			});

			if (!response.ok) {
				throw new Error("Błąd głosowania");
			}

			toast.success(type === "up" ? "Głos oddany!" : "Głos oddany!");
		} catch (error) {
			logger.error("❌ Błąd:", error);
			toast.error("Nie udało się zagłosować");
		}
	};

	const handleIdeaStatusChange = async (ideaId: string, status: IdeaStatus) => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch(`/api/ideas/${ideaId}/status`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ status }),
			});

			if (!response.ok) throw new Error("Błąd zmiany statusu");

			const updatedIdea = await response.json();
			logger.debug("📦 Odpowiedź z API po zmianie statusu:", updatedIdea);

			setIdeas(
				ideas.map((i: Idea) => {
					if (i.id === ideaId) {
						return {
							...i,
							status: status,
						};
					}
					return i;
				}),
			);

			toast.success(`Status zmieniony na: ${IDEA_STATUS_LABELS[status]}`);
		} catch (error) {
			logger.error("Błąd:", error);
			toast.error("Nie udało się zmienić statusu");
		}
	};

	useEffect(() => {
		const fetchPillars = async () => {
			try {
				const token = localStorage.getItem("accessToken");
				logger.debug("🔍 Pobieranie filarów z API...");

				const response = await fetch("/api/teams", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				logger.debug("📥 Status odpowiedzi /api/teams:", response.status);

				if (response.ok) {
					const data = await response.json();
					logger.debug("📦 Surowe dane z API /api/teams:", data);

					const pillarNames = data
						.filter(
							(team: any) =>
								team.name?.includes("Filar") &&
								team.name !== "Filary organizacji",
						)
						.map((team: any) => team.name);

					logger.debug("📋 Przefiltrowane filary z bazy:", pillarNames);
					logger.debug("📊 Liczba filarów:", pillarNames.length);

					setPillars(pillarNames);
				} else {
					logger.warn(
						"⚠️ Odpowiedź nie OK:",
						response.status,
						response.statusText,
					);
				}
			} catch (error) {
				logger.error("❌ Błąd pobierania filarów:", error);

				const fallback = [
					"Filar Projektowy",
					"Filar Konferencyjny",
					"Filar Rzeczniczy",
					"Filar Symulacyjny",
				];
				logger.debug("📋 Używam fallback filarów:", fallback);
				setPillars(fallback);
			}
		};

		fetchPillars();
	}, []);

	useEffect(() => {
		const fetchIdeas = async () => {
			setLoading(true);
			try {
				const token = localStorage.getItem("accessToken");
				logger.debug("🔍 Pobieranie pomysłów z API...");

				if (!token) {
					logger.warn("⚠️ Brak tokenu, używam danych przykładowych");
					setIdeas(MOCK_IDEAS);
					return;
				}

				const response = await fetch("/api/ideas", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				logger.debug("📥 Status odpowiedzi /api/ideas:", response.status);

				if (!response.ok) {
					logger.warn(
						`⚠️ Błąd API (${response.status}), używam danych przykładowych`,
					);
					setIdeas(MOCK_IDEAS);
					return;
				}

				const data = await response.json();
				logger.debug("📦 Surowe dane pomysłów:", data);
				logger.debug("📊 Liczba pomysłów:", data.length);

				const pillarsInIdeas = data.map((i: any) => i.pillar);
				logger.debug("🏷️ Filary w pomysłach:", pillarsInIdeas);
				logger.debug("🏷️ Unikalne filary w pomysłach:", [
					...new Set(pillarsInIdeas),
				]);

				const mappedIdeas = data.map((idea: any) => ({
					id: idea.id.toString(),
					title: idea.title,
					description: idea.description,
					pillar: idea.pillar,
					authorId: idea.author_id?.toString() || "unknown",
					authorName: idea.author_name || "Nieznany",
					status: (idea.status as IdeaStatus) || "pending",
					votes: idea.votes || 0,
					upvotes: idea.upvotes || 0,
					downvotes: idea.downvotes || 0,
					createdAt: idea.created_at || new Date().toISOString(),
					currentUserVote: idea.user_vote || null,
				}));

				logger.debug("✅ Zamapowane pomysły:", mappedIdeas);
				setIdeas(mappedIdeas);
			} catch (error) {
				logger.error("❌ Błąd pobierania pomysłów:", error);
				setIdeas(MOCK_IDEAS);
			} finally {
				setLoading(false);
			}
		};

		fetchIdeas();
	}, []);

	useEffect(() => {
		const shouldOpenIdeas = sessionStorage.getItem("openIdeasTab") === "true";
		if (shouldOpenIdeas) {
			logger.debug("📋 Otwieram zakładkę pomysły po reloadzie");
			setActiveTab("ideas");

			sessionStorage.removeItem("openIdeasTab");
		}
	}, []);
	useEffect(() => {
		const fetchProjects = async () => {
			setLoading(true);
			try {
				const token = localStorage.getItem("accessToken");
				logger.debug("🔍 Pobieranie projektów z API...");

				const response = await fetch("/api/projects", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				logger.debug("📥 Status odpowiedzi /api/projects:", response.status);

				if (response.status === 401) {
					logger.warn(
						"⚠️ Token wygasł lub nieprawidłowy - przekierowanie do login",
					);
					safeNavigate("/login", navigate);
					return;
				}

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				logger.debug("📦 Surowe dane z API /api/projects:", data);
				logger.debug("📊 Liczba projektów:", data.length);
				if (data.length > 0) {
					logger.debug("📋 Pierwszy projekt:", data[0]);
					logger.debug("📋 Klucze projektu:", Object.keys(data[0]));
					logger.debug("👤 coordinator_id:", data[0].coordinator_id);
				}

				const pillarsInProjects = data.map((p: any) => p.pillar);
				logger.debug("🏷️ Filary w projektach:", pillarsInProjects);
				logger.debug("🏷️ Unikalne filary w projektach:", [
					...new Set(pillarsInProjects),
				]);

				const mappedProjects = data.map((apiProject: any) => ({
					id: apiProject.id,
					name: apiProject.name,
					description: apiProject.description || "",
					pillar: mapPillar(String(apiProject.pillar)),
					status: apiProject.status as ProjectStatus,
					estimated_end: apiProject.estimated_end,
					coordinator_id: apiProject.coordinator_id?.toString() || "",
					team: apiProject.team
						? apiProject.team.split(",").map((t: string) => t.trim())
						: [],
					created_at: apiProject.created_at,
					updated_at: apiProject.updated_at,
				}));

				logger.debug("✅ Zamapowane projekty:", mappedProjects);
				setProjects(mappedProjects);
			} catch (error) {
				logger.error("❌ Błąd ładowania projektów:", error);
				logger.debug("📋 Używam MOCK_PROJECTS jako fallback");
				setProjects(MOCK_PROJECTS);
			} finally {
				console.log("🔄 [Projects] BEFORE setTimeout - loading:", loading);
				setTimeout(() => {
					console.log(
						"🔄 [Projects] INSIDE setTimeout - ustawiam loading na false",
					);
					setLoading(false);
				}, 300);
			}
		};

		fetchProjects();
	}, []);

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const token = localStorage.getItem("accessToken");
				const response = await fetch("/api/users", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (response.ok) {
					const data = await response.json();
					console.log("📦 [fetchUsers] Otrzymano danych:", data.length);
					console.log("📦 [fetchUsers] Pierwszy użytkownik:", data[0]);

					const mappedUsers = data
						.filter((user: any) => user.id !== 63 && user.id !== "63")
						.map((user: any) => ({
							id: user.id.toString(),
							name:
								user.name ||
								`${user.first_name || ""} ${user.last_name || ""}`.trim() ||
								user.email ||
								"Nieznany",
							email: user.email,
							role: user.role || "member",
							pillar: user.pillar || null,
							pillars: user.pillars || [], // ← TO JEST WAŻNE!
						}));

					console.log(
						"📦 [fetchUsers] Po mapowaniu - pierwszy:",
						mappedUsers[0],
					);
					setUsers(mappedUsers);
				}
			} catch (error) {
				logger.error("❌ Błąd pobierania użytkowników:", error);
			}
		};

		fetchUsers();
	}, []);
	const canManageProject = (project: Project) => {
		if (permissions.includes("canManageAllProjects")) return true;
		if (permissions.includes("canManagePillarProjects")) {
			const pillarName =
				PILLAR_LABELS_FALLBACK[project.pillar as ProjectPillar] ||
				project.pillar;
			const userPillars = getPillarsArray(currentUser?.coordinatorPillars);
			return userPillars.some((up) => isPillarMatching(up, pillarName));
		}
		return false;
	};

	const canManageProjects =
		permissions.includes("canManageAllProjects") ||
		permissions.includes("canManagePillarProjects");

	const filteredProjects = useMemo(() => {
		return projects.filter((project) => {
			const matchesSearch =
				project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
				project.coordinator_id
					.toString()
					.toLowerCase()
					.includes(searchTerm.toLowerCase());

			const matchesPillar =
				selectedPillar === "all" || project.pillar === selectedPillar;
			const matchesStatus =
				selectedStatus === "all" || project.status === selectedStatus;
			return matchesSearch && matchesPillar && matchesStatus;
		});
	}, [projects, searchTerm, selectedPillar, selectedStatus]);

	const coordinatorStats = useMemo(() => {
		if (!permissions.includes("canManagePillarIdeas")) return null;
		if (!currentUser?.coordinatorPillars?.length) return null;

		const userPillars = getPillarsArray(currentUser.coordinatorPillars);
		const pillarIdeas = ideas.filter((i) =>
			userPillars.some((up) => isPillarMatching(up, i.pillar)),
		);

		const pending = pillarIdeas.filter((i) => i.status === "pending").length;
		const approved = pillarIdeas.filter((i) => i.status === "approved").length;
		const rejected = pillarIdeas.filter((i) => i.status === "rejected").length;

		return {
			total: pillarIdeas.length,
			pending,
			approved,
			rejected,
			pillars: currentUser.pillars,
		};
	}, [ideas, currentUser, permissions]);

	const handleAddProject = () => {
		setEditingProject(null);
		setIsModalOpen(true);
	};

	const handleEditProject = (project: Project) => {
		setEditingProject(project);
		setIsModalOpen(true);
	};
	const filteredIdeas = useMemo(() => {
		return ideas.filter((idea) => {
			const matchesSearch =
				idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				idea.description.toLowerCase().includes(searchTerm.toLowerCase());

			const matchesPillar =
				selectedPillar === "all" || idea.pillar === selectedPillar;

			return matchesSearch && matchesPillar;
		});
	}, [ideas, searchTerm, selectedPillar]);

	const handleDeleteProject = async (id: string) => {
		if (!window.confirm("Czy na pewno chcesz usunąć ten projekt?")) {
			return;
		}

		try {
			const token = localStorage.getItem("accessToken");

			const response = await fetch(`/api/projects/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			setProjects(projects.filter((p) => p.id !== id));
			logger.debug(`✅ Projekt ${id} został usunięty`);
		} catch (error) {
			logger.error("❌ Błąd usuwania projektu:", error);
			alert("Nie udało się usunąć projektu. Spróbuj ponownie.");
		}
	};

	const handleSaveProject = async (project: Project) => {
		logger.debug("📤 Team przed wysyłką:", project.team);
		logger.debug("📤 Team jako string:", project.team.join(", "));
		try {
			const token = localStorage.getItem("accessToken");
			const isEdit = projects.some((p) => p.id === project.id);
			const url = isEdit ? `/api/projects/${project.id}` : "/api/projects";
			const method = isEdit ? "PUT" : "POST";

			const payload = {
				name: project.name,
				description: project.description,
				pillar: PILLAR_LABELS_FALLBACK[project.pillar] || project.pillar,
				status: project.status,
				coordinator_id: parseInt(String(project.coordinator_id), 10),
				team: project.team.join(", "),
				estimated_end: project.estimated_end,
			};

			logger.debug("📤 Team przed wysyłką:", project.team);
			logger.debug("📤 Team jako string:", project.team.join(", "));
			logger.debug("📤 Liczba członków:", project.team.length);
			logger.debug("📤 Cały payload:", payload);

			logger.debug("📤 Wysyłane dane:", payload);

			const response = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const savedProject = await response.json();

			const mappedProject = {
				id: savedProject.id,
				name: savedProject.name,
				description: savedProject.description,
				pillar: mapPillar(String(savedProject.pillar)),
				status: savedProject.status as ProjectStatus,
				estimated_end: savedProject.estimated_end,
				coordinator_id: savedProject.coordinator_id,
				team: savedProject.team
					? savedProject.team.split(",").map((t: string) => t.trim())
					: [],
				created_at: savedProject.created_at,
				updated_at: savedProject.updated_at,
			};

			if (isEdit) {
				setProjects(
					projects.map((p) => (p.id === mappedProject.id ? mappedProject : p)),
				);
			} else {
				setProjects([mappedProject, ...projects]);
			}
		} catch (error) {
			logger.error("Błąd zapisywania projektu:", error);
			alert("Nie udało się zapisać projektu. Spróbuj ponownie.");
		}
	};
	const clearFilters = () => {
		setSearchTerm("");
		setSelectedPillar("all");
		setSelectedStatus("all");
	};

	useEffect(() => {
		logger.debug("📊 PODSUMOWANIE DANYCH:");
		logger.debug("📋 Filary:", pillars);
		logger.debug("📋 Projekty:", projects.length);
		logger.debug("📋 Użytkownicy:", users.length);
		logger.debug("📋 Pomysły:", ideas.length);
		logger.debug("👤 Aktualny użytkownik:", currentUser);
	}, [pillars, projects, users, ideas, currentUser]);

	return (
		<div className={styles.projects}>
			<div className={styles.header}>
				<div className={styles.header__left}>
					<h1 className={styles.header__title}>Aktualne projekty</h1>
					<p className={styles.header__subtitle}>
						Przeglądaj wszystkie projekty realizowane w organizacji.
						{canManageProjects &&
							" Koordynatorzy mogą zarządzać projektami swojego zespołu."}
					</p>
				</div>
				<div className={styles.header__actions}>
					<button
						className={styles.header__ideaBtn}
						onClick={() => setIsIdeaModalOpen(true)}
					>
						<Lightbulb size={18} />
						Zgłoś pomysł
					</button>
					{canManageProjects && (
						<button
							className={styles.header__addBtn}
							onClick={handleAddProject}
						>
							<Plus size={18} />
							Dodaj projekt
						</button>
					)}
				</div>
			</div>

			<div className={styles.stats}>
				<div className={styles.stats__item}>
					<span className={styles.stats__number}>{projects.length}</span>
					<span className={styles.stats__label}>Wszystkie projekty</span>
				</div>
				{pillars.map((pillar) => (
					<div key={pillar} className={styles.stats__item}>
						<span className={styles.stats__number}>
							{projects.filter((p) => p.pillar === pillar).length}
						</span>
						<span className={styles.stats__label}>{pillar}</span>
					</div>
				))}
			</div>

			{permissions.includes("canManagePillarProjects") &&
				coordinatorStats &&
				currentUser &&
				currentUser.coordinatorPillars &&
				currentUser.coordinatorPillars.length > 0 && (
					<div className={styles.coordinatorStats}>
						<span className={styles.coordinatorStats__title}>
							Pomysły dla twoich filarów (koordynator):{" "}
							<strong>
								{getPillarsString(currentUser.coordinatorPillars)}
							</strong>
						</span>
						<span className={styles.coordinatorStats__item}>
							<span className={styles.coordinatorStats__number}>
								{coordinatorStats.total}
							</span>
							<span className={styles.coordinatorStats__label}>Wszystkie</span>
						</span>
						<span className={styles.coordinatorStats__item}>
							<span
								className={styles.coordinatorStats__number}
								style={{ color: "#f59e0b" }}
							>
								{coordinatorStats.pending}
							</span>
							<span className={styles.coordinatorStats__label}>Oczekujące</span>
						</span>
						<span className={styles.coordinatorStats__item}>
							<span
								className={styles.coordinatorStats__number}
								style={{ color: "#22c55e" }}
							>
								{coordinatorStats.approved}
							</span>
							<span className={styles.coordinatorStats__label}>
								Zaakceptowane
							</span>
						</span>
						<span className={styles.coordinatorStats__item}>
							<span
								className={styles.coordinatorStats__number}
								style={{ color: "#ef4444" }}
							>
								{coordinatorStats.rejected}
							</span>
							<span className={styles.coordinatorStats__label}>Odrzucone</span>
						</span>
					</div>
				)}
			<div className={styles.tabs}>
				<button
					className={`${styles.tab} ${activeTab === "projects" ? styles.tabActive : ""}`}
					onClick={() => setActiveTab("projects")}
				>
					<Briefcase size={16} />
					Projekty
					<span className={styles.tabBadge}>{projects.length}</span>
				</button>
				<button
					className={`${styles.tab} ${activeTab === "ideas" ? styles.tabActive : ""}`}
					onClick={() => setActiveTab("ideas")}
				>
					<Lightbulb size={16} />
					Pomysły
					<span className={styles.tabBadge}>
						{ideas.filter((i) => i.status === "pending").length}
					</span>
				</button>
			</div>

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
						value={selectedPillar}
						onChange={(e) =>
							setSelectedPillar(e.target.value as ProjectPillar | "all")
						}
					>
						<option value="all">Wszystkie filary</option>
						{pillars.map((pillar) => (
							<option key={pillar} value={pillar}>
								{pillar}
							</option>
						))}
					</select>

					<select
						className={styles.filters__select}
						value={selectedStatus}
						onChange={(e) =>
							setSelectedStatus(e.target.value as ProjectStatus | "all")
						}
					>
						<option value="all">Wszystkie statusy</option>
						{Object.entries(STATUS_LABELS).map(([key, label]) => (
							<option key={key} value={key}>
								{label}
							</option>
						))}
					</select>

					{(selectedPillar !== "all" ||
						selectedStatus !== "all" ||
						searchTerm) && (
						<button className={styles.filters__reset} onClick={clearFilters}>
							Wyczyść filtry
						</button>
					)}
				</div>
			</div>

			{activeTab === "projects" ? (
				<div className={styles.projectsGrid}>
					{loading ? (
						<div className={styles.loading}>
							<div className={styles.loading__spinner}></div>
						</div>
					) : filteredProjects.length === 0 ? (
						<div className={styles.emptyState}>
							<AlertCircle size={48} className={styles.emptyState__icon} />
							<h3 className={styles.emptyState__title}>Brak projektów</h3>
							<p className={styles.emptyState__description}>
								{searchTerm ||
								selectedPillar !== "all" ||
								selectedStatus !== "all"
									? "Nie znaleziono projektów spełniających kryteria wyszukiwania."
									: canManageProjects
										? 'Nie ma jeszcze żadnych projektów. Kliknij "Dodaj projekt", aby utworzyć pierwszy.'
										: "Nie ma jeszcze żadnych projektów."}
							</p>
							{canManageProjects &&
								!searchTerm &&
								selectedPillar === "all" &&
								selectedStatus === "all" && (
									<button
										className={styles.emptyState__btn}
										onClick={handleAddProject}
									>
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
								canEdit={canManageProject(project)}
								users={users}
								tasks={tasks} // 🔥 DODAJ
							/>
						))
					)}
				</div>
			) : (
				<div className={styles.ideasGrid}>
					{loading ? (
						<div className={styles.loadingContainer}>
							<div className={styles.loading__spinner}></div>
						</div>
					) : filteredIdeas.length === 0 ? (
						<div className={styles.emptyState}>
							<Lightbulb size={48} className={styles.emptyState__icon} />
							<h3 className={styles.emptyState__title}>Brak pomysłów</h3>
							<p className={styles.emptyState__description}>
								Nie ma jeszcze żadnych zgłoszonych pomysłów. Bądź pierwszy i
								zgłoś swój pomysł!
							</p>
							<button
								className={styles.emptyState__btn}
								onClick={() => setIsIdeaModalOpen(true)}
							>
								<Plus size={16} />
								Zgłoś pomysł
							</button>
						</div>
					) : (
						filteredIdeas.map((idea) => (
							<IdeaCard
								key={idea.id}
								idea={idea}
								currentUser={currentUser!}
								onVote={handleVote}
								onStatusChange={handleIdeaStatusChange}
								canManage={canManageProjects}
								pillars={pillars}
								permissions={permissions}
							/>
						))
					)}
				</div>
			)}

			<ProjectModal
				isOpen={isModalOpen}
				project={editingProject}
				onClose={() => {
					setIsModalOpen(false);
					setEditingProject(null);
				}}
				onSave={handleSaveProject}
				users={users}
				userPillars={getPillarsArray(currentUser?.coordinatorPillars)} // <- TYLKO KOORDYNATOR
				isAdminOrBoard={
					permissions.includes("canManageAllProjects") ||
					currentUser?.role === "admin" ||
					currentUser?.role === "board"
				}
			/>

			<IdeaModal
				isOpen={isIdeaModalOpen}
				onClose={() => setIsIdeaModalOpen(false)}
				onSubmit={handleSubmitIdea}
				currentUser={currentUser!}
				pillars={pillars}
			/>
		</div>
	);
}
