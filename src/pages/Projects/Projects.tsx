import { useState, useMemo, useEffect } from "react";
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
	estimated_end: string;
	team: string[]; // Lista ID użytkowników
	coordinator_id: string; // ID koordynatora
	created_at: string;
	updated_at: string;
};
type User = {
	id: string;
	name: string;
	email: string;
	role: "admin" | "coordinator" | "member";
	pillar?: ProjectPillar | null;
};

// ---------------------------------------------------------------------------
// DANE PRZYKŁADOWE
// ---------------------------------------------------------------------------

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
	users: User[]; // ✅ DODAJ
}

function ProjectCard({
	project,
	onEdit,
	onDelete,
	canEdit,
	users,
}: ProjectCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	// ✅ DODAJ TUTAJ funkcje pomocnicze:
	const getCoordinatorName = (coordinatorId: string) => {
		if (!coordinatorId) return "Brak";
		if (/^\d+$/.test(coordinatorId)) {
			const user = users.find((u) => u.id === coordinatorId);
			return user ? user.name : coordinatorId;
		}
		return coordinatorId;
	};

	const getTeamMemberName = (memberId: string) => {
		if (!memberId) return "Nieznany";
		if (/^\d+$/.test(memberId)) {
			const user = users.find((u) => u.id === memberId);
			return user ? user.name : memberId;
		}
		return memberId;
	};

	// ✅ Liczenie rzeczywistych członków
	const teamMembers = project.team.filter((member) => /^\d+$/.test(member));
	const displayTeamCount =
		teamMembers.length > 0 ? teamMembers.length : project.team.length;

	const formatDate = (dateString: string) => {
		if (!dateString) return "Brak daty";

		// Data jest już w formacie YYYY-MM-DD
		if (
			typeof dateString === "string" &&
			dateString.match(/^\d{4}-\d{2}-\d{2}$/)
		) {
			const [year, month, day] = dateString.split("-");
			return `${day}.${month}.${year}`;
		}

		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return "Nieprawidłowa data";
			return date.toLocaleDateString("pl-PL", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		} catch {
			return "Nieprawidłowa data";
		}
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
					{PILLAR_LABELS[project.pillar]}
				</div>
			</div>

			<div className={styles.projectCard__body}>
				<p className={styles.projectCard__description}>{project.description}</p>

				<div className={styles.projectCard__meta}>
					{/* ✅ DODAJ to pole z datą */}
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
							Zespół: <strong>{displayTeamCount} osób</strong>
						</span>
					</div>
				</div>

				<div className={styles.projectCard__coordinator}>
					<Tag size={14} />
					<span>
						Koordynator:{" "}
						<strong>{getCoordinatorName(project.coordinator_id)}</strong>
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

// ---------------------------------------------------------------------------
// MODAL DODAWANIA/EDYCJI PROJEKTU
// ---------------------------------------------------------------------------

interface ProjectModalProps {
	isOpen: boolean;
	project: Project | null;
	onClose: () => void;
	onSave: (project: Project) => void;
	users: User[]; // ✅ Dodaj users jako prop
}

function ProjectModal({
	isOpen,
	project,
	onClose,
	onSave,
	users,
}: ProjectModalProps) {
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

	// ✅ DODAJ TEN useEffect - aktualizuje formularz gdy zmienia się project
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
			// Resetuj formularz gdy nie ma projektu (dodawanie)
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
								value={formData.pillar || "project"}
								onChange={(e) =>
									setFormData({
										...formData,
										pillar: e.target.value as ProjectPillar,
									})
								}
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
							value={formData.estimated_end || ""} // ✅ Zmiana nazwy pola
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
									{/* ✅ Tłumaczenie */}
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
// ---------------------------------------------------------------------------
// KOMPONENT WYBORU ZESPOŁU
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// KOMPONENT WYBORU ZESPOŁU
// ---------------------------------------------------------------------------

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

	const filteredUsers = useMemo(() => {
		if (filter === "pillar" && pillar) {
			return users.filter((u) => u.pillar === pillar);
		}
		if (filter === "all") {
			return users; // ✅ Wszyscy użytkownicy
		}
		return users;
	}, [users, filter, pillar]);

	// W TeamSelector, w onTeamChange:
	const toggleUser = (userId: string) => {
		console.log("🔄 Toggle user:", userId);
		console.log("📋 Current team:", selectedTeam);

		if (selectedTeam.includes(userId)) {
			const newTeam = selectedTeam.filter((id) => id !== userId);
			console.log("➖ After remove:", newTeam);
			onTeamChange(newTeam);
		} else {
			const newTeam = [...selectedTeam, userId];
			console.log("➕ After add:", newTeam);
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
						// ✅ Automatycznie zaznacz wszystkich
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
							// ✅ Automatycznie zaznacz z filaru
							const pillarIds = users
								.filter((u) => u.pillar === pillar)
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

			{/* ✅ Pokaż listę TYLKO gdy wybrano "Wybierz ręcznie" */}
			{filter === "custom" && (
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
						{filteredUsers.map((user) => (
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
								{user.pillar && (
									<span className={styles.teamSelector__pillar}>
										{PILLAR_LABELS[user.pillar]}
									</span>
								)}
							</label>
						))}
						{filteredUsers.length === 0 && (
							<p className={styles.teamSelector__empty}>Brak użytkowników</p>
						)}
					</div>
				</>
			)}

			{filter !== "custom" && (
				<div className={styles.teamSelector__info}>
					{filter === "all" && (
						<p className={styles.teamSelector__infoText}>
							Wybrano{" "}
							<strong>
								wszystkich {users.length} {pluralizeUsers(users.length)}
							</strong>
						</p>
					)}

					{filter === "pillar" && pillar && (
						<p className={styles.teamSelector__infoText}>
							Wybrano{" "}
							<strong>
								{filteredUsers.length} {pluralizeUsers(filteredUsers.length)}
							</strong>{" "}
							z filaru "{PILLAR_LABELS[pillar]}"
						</p>
					)}
				</div>
			)}

			<div className={styles.teamSelector__summary}>
				Wybrano: <strong>{selectedTeam.length}</strong>{" "}
				{pluralizePeople(selectedTeam.length)}
			</div>
		</div>
	);
}
// Dodaj tę funkcję przed komponentem Projects
const mapPillar = (pillar: string): ProjectPillar => {
	const mapping: Record<string, ProjectPillar> = {
		"Filar Projektowy": "project",
		"Filar Konferencji i Debat": "conference",
		"Filar Rzeczniczy": "advocacy",
		"Filar Symulacyjny": "simulation",
		// Jeśli z API przychodzą inne wartości
		project: "project",
		conference: "conference",
		advocacy: "advocacy",
		simulation: "simulation",
	};
	return mapping[pillar] || "project";
};
// ---------------------------------------------------------------------------
// GŁÓWNY KOMPONENT
// ---------------------------------------------------------------------------
const ROLE_LABELS: Record<string, string> = {
	admin: "Administrator",
	coordinator: "Koordynator",
	member: "Członek",
};

const ROLE_COLORS: Record<string, string> = {
	admin: "roleAdmin",
	coordinator: "roleCoordinator",
	member: "roleMember",
};
export default function Projects() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [currentUser, setCurrentUser] = useState<User | null>(() => {
		// ✅ Inicjalizuj od razu z localStorage
		const userStr = localStorage.getItem("user");
		if (userStr) {
			try {
				const user = JSON.parse(userStr);
				return {
					id: user.id.toString(),
					name: `${user.first_name} ${user.last_name}`,
					email: user.email,
					role: user.role as "admin" | "coordinator" | "member",
					pillar: user.pillar || null,
				};
			} catch {
				return null;
			}
		}
		return null;
	});
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedPillar, setSelectedPillar] = useState<ProjectPillar | "all">(
		"all",
	);
	const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | "all">(
		"all",
	);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingProject, setEditingProject] = useState<Project | null>(null);

	useEffect(() => {
		const fetchProjects = async () => {
			try {
				setLoading(true);
				const token = localStorage.getItem("accessToken");

				const response = await fetch("/api/projects", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (response.status === 401) {
					window.location.href = "/login";
					return;
				}

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();

				const mappedProjects = data.map((apiProject: any) => ({
					id: apiProject.id,
					name: apiProject.name,
					description: apiProject.description || "",
					pillar: mapPillar(apiProject.pillar),
					status: apiProject.status as ProjectStatus,
					estimated_end: apiProject.estimated_end,
					coordinator_id: apiProject.coordinator_id?.toString() || "", // ✅ Konwersja na string
					team: apiProject.team
						? apiProject.team.split(",").map((t: string) => t.trim())
						: [],
					created_at: apiProject.created_at,
					updated_at: apiProject.updated_at,
				}));

				console.log("✅ Zamapowane dane:", mappedProjects);
				setProjects(mappedProjects);
			} catch (error) {
				console.error("❌ Błąd ładowania projektów:", error);
				setProjects(MOCK_PROJECTS);
			} finally {
				setLoading(false);
			}
		};

		fetchProjects();
	}, []);
	// Pobieranie użytkowników
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
					setUsers(data);
				}
			} catch (error) {
				console.error("❌ Błąd pobierania użytkowników:", error);
				// Fallback - użytkownicy z mocków
				setUsers([
					{
						id: "1",
						name: "Jan Kowalski",
						email: "jan@example.com",
						role: "coordinator",
						pillar: "project",
					},
					{
						id: "2",
						name: "Anna Nowak",
						email: "anna@example.com",
						role: "coordinator",
						pillar: "conference",
					},
					{
						id: "3",
						name: "Piotr Wiśniewski",
						email: "piotr@example.com",
						role: "member",
					},
					{
						id: "4",
						name: "Maria Kowalczyk",
						email: "maria@example.com",
						role: "member",
					},
					{
						id: "5",
						name: "Tomasz Lewandowski",
						email: "tomasz@example.com",
						role: "coordinator",
						pillar: "advocacy",
					},
				]);
			}
		};

		fetchUsers();
	}, []);
	const canManageProjects =
		currentUser?.role === "admin" || currentUser?.role === "coordinator";

	const filteredProjects = useMemo(() => {
		return projects.filter((project) => {
			const matchesSearch =
				project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
				project.coordinator_id.toLowerCase().includes(searchTerm.toLowerCase()); // ✅ Używamy coordinator_id

			const matchesPillar =
				selectedPillar === "all" || project.pillar === selectedPillar;
			const matchesStatus =
				selectedStatus === "all" || project.status === selectedStatus;

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

	// ZMIEŃ tę funkcję (około linii 450):
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

			// ✅ Usuń projekt z listy po pomyślnym usunięciu z API
			setProjects(projects.filter((p) => p.id !== id));
			console.log(`✅ Projekt ${id} został usunięty`);
		} catch (error) {
			console.error("❌ Błąd usuwania projektu:", error);
			alert("Nie udało się usunąć projektu. Spróbuj ponownie.");
		}
	};

	// W Projects.tsx, zaktualizuj handleSaveProject
	const handleSaveProject = async (project: Project) => {
		console.log("📤 Team przed wysyłką:", project.team);
		console.log("📤 Team jako string:", project.team.join(", "));
		try {
			const token = localStorage.getItem("accessToken");
			const isEdit = projects.some((p) => p.id === project.id);
			const url = isEdit ? `/api/projects/${project.id}` : "/api/projects";
			const method = isEdit ? "PUT" : "POST";

			// ✅ coordinator_id jako NUMBER
			const payload = {
				name: project.name,
				description: project.description,
				pillar: PILLAR_LABELS[project.pillar],
				status: project.status,
				coordinator_id: parseInt(project.coordinator_id, 10), // ✅ Konwersja na number
				team: project.team.join(", "),
				estimated_end: project.estimated_end,
			};

			console.log("📤 Wysyłane dane:", payload); // ✅ Debug

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

			// ✅ Mapuj odpowiedź z API na strukturę frontendu
			const mappedProject = {
				id: savedProject.id,
				name: savedProject.name,
				description: savedProject.description,
				pillar: mapPillar(savedProject.pillar),
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
			console.error("Błąd zapisywania projektu:", error);
			alert("Nie udało się zapisać projektu. Spróbuj ponownie.");
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
						{canManageProjects &&
							" Koordynatorzy mogą zarządzać projektami swojego zespołu."}
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
						<span className={styles.stats__number}>
							{getPillarCount(key as ProjectPillar)}
						</span>
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
						{Object.entries(PILLAR_LABELS).map(([key, label]) => (
							<option key={key} value={key}>
								{label}
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

			{/* Lista projektów */}
			<div className={styles.projectsGrid}>
				{filteredProjects.length === 0 ? (
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
							canEdit={canManageProjects}
							users={users} // ✅ DODAJ
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
				users={users} // ✅ Dodaj users
			/>
		</div>
	);
}
