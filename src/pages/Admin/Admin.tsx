import React, { useState, useEffect } from "react";
import { safeNavigate } from "@/utils/safeNavigation";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { logger } from "@/utils/logger";

import {
	Users,
	Plus,
	Edit,
	Trash2,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	FolderTree,
	RefreshCw,
	Mail,
	UserCog,
	Building2,
	Briefcase,
	Megaphone,
	GraduationCap,
	X,
	Save,
	UserPlus,
	Crown,
	User,
	Shield,
} from "lucide-react";
import type { Permission } from "../../utils/permissions";
import {
	PERMISSION_LABELS,
	clearPermissionsCache,
	updateRolePermissions,
} from "../../utils/permissions";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import styles from "./Admin.module.css";
import { hasPermission } from "../../utils/permissions";

// ---------------------------------------------------------------------------
// TYPY
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// TYPY DLA LOGÓW
// ---------------------------------------------------------------------------

interface SystemLog {
	id: string;
	user_id: number;
	user_name: string;
	user_role: string;
	action_type:
		| "CREATE"
		| "UPDATE"
		| "DELETE"
		| "LOGIN"
		| "LOGOUT"
		| "APPROVE"
		| "REJECT";
	category:
		| "USER"
		| "TEAM"
		| "LEAVE"
		| "PROJECT"
		| "VACANCY"
		| "TUTORIAL"
		| "SOCIAL_MEDIA"
		| "PERMISSION"
		| "STRUCTURE"
		| "NOTIFICATION"
		| "AUTH";
	endpoint: string;
	method: string;
	entity_id: string | null;
	entity_name: string | null;
	changes: any;
	ip_address: string | null;
	user_agent: string | null;
	status: "success" | "error" | "warning";
	error_message: string | null;
	created_at: string;
}

interface LogsResponse {
	logs: SystemLog[];
	total: number;
	page: number;
	totalPages: number;
	limit: number;
}

type UserRole = "admin" | "board" | "coordinator" | "member" | "mentor";

// ---- Komponent zarządzania logami ----
// ---- Komponent zarządzania logami ----
function LogsManagement() {
	const [logs, setLogs] = useState<SystemLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const [limit] = useState(15);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [selectedAction, setSelectedAction] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");

	const categoryLabels: Record<string, string> = {
		USER: "Użytkownicy",
		TEAM: "Zespoły",
		LEAVE: "Urlopy i nieobecności",
		PROJECT: "Projekty",
		VACANCY: "Rekrutacja",
		TUTORIAL: "Poradniki",
		SOCIAL_MEDIA: "Media społecznościowe",
		PERMISSION: "Uprawnienia",
		STRUCTURE: "Struktura organizacji",
		NOTIFICATION: "Powiadomienia",
		AUTH: "Logowanie",
	};

	const actionLabels: Record<string, string> = {
		CREATE: "Dodanie",
		UPDATE: "Modyfikacja",
		DELETE: "Usunięcie",
		LOGIN: "Logowanie",
		LOGOUT: "Wylogowanie",
		APPROVE: "Zatwierdzenie",
		REJECT: "Odrzucenie",
	};

	const statusLabels: Record<
		string,
		{ label: string; icon: string; color: string }
	> = {
		success: { label: "Powodzenie", icon: "✓", color: "#059669" },
		error: { label: "Błąd", icon: "✗", color: "#dc2626" },
		warning: { label: "Ostrzeżenie", icon: "⚠", color: "#d97706" },
	};

	const getHumanReadableDescription = (log: SystemLog): string => {
		const action = actionLabels[log.action_type] || log.action_type;
		const category = categoryLabels[log.category] || log.category;

		if (log.category === "LEAVE" && log.action_type === "CREATE") {
			return `Zgłoszono nowy wniosek urlopowy przez ${log.user_name}`;
		}
		if (log.category === "LEAVE" && log.action_type === "DELETE") {
			return `Usunięto wniosek urlopowy (${log.entity_name || "brak danych"})`;
		}
		if (log.category === "LEAVE" && log.action_type === "APPROVE") {
			return `Zatwierdzono wniosek urlopowy`;
		}
		if (log.category === "LEAVE" && log.action_type === "REJECT") {
			return `Odrzucono wniosek urlopowy`;
		}
		if (log.category === "TEAM" && log.action_type === "CREATE") {
			return `Utworzono nowy zespół: ${log.entity_name || "brak nazwy"}`;
		}
		if (log.category === "TEAM" && log.action_type === "DELETE") {
			return `Usunięto zespół: ${log.entity_name || "brak nazwy"}`;
		}
		if (log.category === "USER" && log.action_type === "UPDATE") {
			return `Zaktualizowano dane profilu użytkownika ${log.user_name}`;
		}
		if (log.category === "PERMISSION" && log.action_type === "UPDATE") {
			return `Zmieniono uprawnienia dla roli`;
		}
		if (log.category === "AUTH" && log.action_type === "LOGIN") {
			return `Użytkownik ${log.user_name} zalogował się do systemu`;
		}
		if (log.category === "AUTH" && log.action_type === "LOGOUT") {
			return `Użytkownik ${log.user_name} wylogował się z systemu`;
		}

		return `${action} w kategorii ${category.toLowerCase()}`;
	};

	const getReadableChanges = (log: SystemLog): string | null => {
		if (!log.changes) return null;

		try {
			const changes =
				typeof log.changes === "string" ? JSON.parse(log.changes) : log.changes;

			if (log.category === "LEAVE" && changes.startDate && changes.endDate) {
				const start = new Date(changes.startDate).toLocaleDateString("pl-PL");
				const end = new Date(changes.endDate).toLocaleDateString("pl-PL");
				return `Okres: ${start} - ${end}`;
			}

			if (log.category === "USER" && log.action_type === "UPDATE") {
				const fields: string[] = [];
				if (changes.firstName) fields.push(`imię na "${changes.firstName}"`);
				if (changes.lastName) fields.push(`nazwisko na "${changes.lastName}"`);
				if (changes.description) fields.push(`opis profilu`);
				if (changes.skills !== undefined) fields.push(`umiejętności`);
				if (changes.availability) fields.push(`dostępność`);
				if (fields.length === 0) return "Zaktualizowano dane profilu";
				return `Zmieniono: ${fields.join(", ")}`;
			}

			if (log.category === "TEAM" && changes.name) {
				return `Nazwa zespołu: "${changes.name}"`;
			}

			const keys = Object.keys(changes);
			if (keys.length === 0) return null;
			if (keys.length <= 3) {
				return keys.map((k) => `${k}: ${changes[k]}`).join(", ");
			}
			return `${keys
				.slice(0, 3)
				.map((k) => `${k}: ${changes[k]}`)
				.join(", ")} i ${keys.length - 3} innych...`;
		} catch {
			return null;
		}
	};

	const formatDateTime = (date: string) => {
		const d = new Date(date);
		return d.toLocaleString("pl-PL", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getRelativeTime = (date: string) => {
		const now = new Date();
		const then = new Date(date);
		const diffMs = now.getTime() - then.getTime();
		const diffMin = Math.floor(diffMs / 60000);
		const diffHour = Math.floor(diffMin / 60);
		const diffDay = Math.floor(diffHour / 24);

		if (diffMin < 1) return "przed chwilą";
		if (diffMin < 60) return `${diffMin} min temu`;
		if (diffHour < 24) return `${diffHour} godz. temu`;
		if (diffDay === 1) return "wczoraj";
		if (diffDay < 7) return `${diffDay} dni temu`;
		if (diffDay < 30) {
			const weeks = Math.floor(diffDay / 7);
			return `${weeks} ${weeks === 1 ? "tydzień" : "tygodnie"} temu`;
		}
		if (diffDay < 365) {
			const months = Math.floor(diffDay / 30);
			return `${months} ${months === 1 ? "miesiąc" : "miesięcy"} temu`;
		}
		const years = Math.floor(diffDay / 365);
		return `${years} ${years === 1 ? "rok" : "lat"} temu`;
	};

	const fetchLogs = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("accessToken");

			let url = `/api/admin/logs?page=${page}&limit=${limit}`;
			if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
			if (selectedCategory !== "all") url += `&category=${selectedCategory}`;
			if (selectedAction !== "all") url += `&action=${selectedAction}`;
			if (selectedStatus !== "all") url += `&status=${selectedStatus}`;

			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) throw new Error("Błąd pobierania logów");

			const data: LogsResponse = await response.json();
			setLogs(data.logs);
			setTotal(data.total);
			setTotalPages(data.totalPages);
		} catch (error) {
			logger.error("❌ Błąd:", error);
			toast.error("Nie udało się pobrać logów");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLogs();
	}, [page, searchTerm, selectedCategory, selectedAction, selectedStatus]);

	const categories = Object.keys(categoryLabels);
	const actionTypes = Object.keys(actionLabels);

	return (
		<section className={styles.section}>
			<div className={styles.section__header}>
				<div className={styles.section__headerLeft}>
					<h2 className={styles.section__title}>Historia działań</h2>
					<p className={styles.section__subtitle}>
						Rejestr wszystkich operacji wykonanych w systemie.
					</p>
				</div>
				<button
					className={styles.section__refreshBtn}
					onClick={() => {
						setPage(1);
						fetchLogs();
					}}
					title="Odśwież logi"
				>
					<RefreshCw size={16} />
				</button>
			</div>

			<div className={styles.logsFilters}>
				<div className={styles.logsFilters__search}>
					<input
						type="text"
						className={styles.logsFilters__input}
						placeholder="Szukaj po nazwie użytkownika lub opisie..."
						value={searchTerm}
						onChange={(e) => {
							setSearchTerm(e.target.value);
							setPage(1);
						}}
					/>
					{searchTerm && (
						<button
							className={styles.logsFilters__clear}
							onClick={() => {
								setSearchTerm("");
								setPage(1);
							}}
						>
							<X size={14} />
						</button>
					)}
				</div>
				<div className={styles.logsFilters__group}>
					<select
						className={styles.logsFilters__select}
						value={selectedCategory}
						onChange={(e) => {
							setSelectedCategory(e.target.value);
							setPage(1);
						}}
					>
						<option value="all">Wszystkie obszary</option>
						{categories.map((cat) => (
							<option key={cat} value={cat}>
								{categoryLabels[cat]}
							</option>
						))}
					</select>
					<select
						className={styles.logsFilters__select}
						value={selectedAction}
						onChange={(e) => {
							setSelectedAction(e.target.value);
							setPage(1);
						}}
					>
						<option value="all">Wszystkie operacje</option>
						{actionTypes.map((action) => (
							<option key={action} value={action}>
								{actionLabels[action]}
							</option>
						))}
					</select>
					<select
						className={styles.logsFilters__select}
						value={selectedStatus}
						onChange={(e) => {
							setSelectedStatus(e.target.value);
							setPage(1);
						}}
					>
						<option value="all">Wszystkie statusy</option>
						<option value="success">✓ Powodzenie</option>
						<option value="error">✗ Błąd</option>
						<option value="warning">⚠ Ostrzeżenie</option>
					</select>
				</div>
			</div>

			{loading ? (
				<div className={styles.logsLoading}>Ładowanie historii...</div>
			) : logs.length === 0 ? (
				<div className={styles.logsEmpty}>
					<Shield size={48} />
					<h3>Brak zapisanych działań</h3>
					<p>
						Nie znaleziono żadnych wpisów spełniających kryteria wyszukiwania.
					</p>
				</div>
			) : (
				<>
					<div className={styles.logsList}>
						{logs.map((log) => {
							const statusInfo =
								statusLabels[log.status] || statusLabels.success;
							const description = getHumanReadableDescription(log);
							const changes = getReadableChanges(log);
							const relativeTime = getRelativeTime(log.created_at);
							const fullTime = formatDateTime(log.created_at);

							return (
								<div key={log.id} className={styles.logItem}>
									<div className={styles.logItem__header}>
										<div className={styles.logItem__left}>
											<span
												className={styles.logItem__statusDot}
												style={{ backgroundColor: statusInfo.color }}
											/>
											<span className={styles.logItem__user}>
												{log.user_name}
											</span>
											<span className={styles.logItem__action}>
												{actionLabels[log.action_type] || log.action_type}
											</span>
											<span className={styles.logItem__category}>
												{categoryLabels[log.category] || log.category}
											</span>
										</div>
										<div className={styles.logItem__right}>
											<span className={styles.logItem__time} title={fullTime}>
												{relativeTime}
											</span>
										</div>
									</div>

									<div className={styles.logItem__body}>
										<div className={styles.logItem__description}>
											{description}
										</div>

										{changes && (
											<div className={styles.logItem__changes}>
												<span className={styles.logItem__changesLabel}>
													Szczegóły: {changes}
												</span>
											</div>
										)}

										{log.error_message && (
											<div className={styles.logItem__error}>
												Błąd: {log.error_message}
											</div>
										)}

										{log.entity_id && (
											<div className={styles.logItem__meta}>
												<span>Identyfikator: {log.entity_id}</span>
												{log.ip_address && (
													<span>Adres IP: {log.ip_address}</span>
												)}
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>

					<div className={styles.pagination}>
						<div className={styles.pagination__info}>
							Wyświetlono {(page - 1) * limit + 1} -{" "}
							{Math.min(page * limit, total)} z {total} wpisów
						</div>
						<div className={styles.pagination__controls}>
							<button
								className={styles.pagination__btn}
								onClick={() => setPage(page - 1)}
								disabled={page === 1}
							>
								Poprzednia strona
							</button>
							<span className={styles.pagination__current}>
								Strona {page} z {totalPages}
							</span>
							<button
								className={styles.pagination__btn}
								onClick={() => setPage(page + 1)}
								disabled={page === totalPages}
							>
								Następna strona
							</button>
						</div>
					</div>
				</>
			)}
		</section>
	);
}
interface Role {
	id: string;
	name: UserRole;
	label: string;
	permissions: Permission[];
	description: string;
}

interface TeamMember {
	id: string;
	user_id: string;
	team_id: string;
	first_name: string;
	last_name: string;
	email: string;
	functional_role: string;
	province: string;
	role_in_team: string;
	is_leader: boolean;
}

interface Team {
	id: string;
	name: string;
	description: string;
	role: string;
	icon: string;
	status: string;
	parent_id: string | null;
	email: string | null;
	members: TeamMember[];
	created_at: string;
}

interface AvailableUser {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	functional_role: string;
	province: string;
	team_ids: string[];
}

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

const ICON_OPTIONS = [
	{ value: "Users", label: "Użytkownicy", icon: Users },
	{ value: "UserCog", label: "Ustawienia użytkownika", icon: UserCog },
	{ value: "Building2", label: "Budynki", icon: Building2 },
	{ value: "Briefcase", label: "Teczka", icon: Briefcase },
	{ value: "Megaphone", label: "Megafon", icon: Megaphone },
	{ value: "GraduationCap", label: "Czapka", icon: GraduationCap },
];

// ---------------------------------------------------------------------------
// KOMPONENTY
// ---------------------------------------------------------------------------

// ---- Komponent zarządzania rolami ----
function RolesManagement({
	roles,
	canManage,
	onUpdatePermissions,
	onRefresh,
	refreshing,
}: {
	roles: Role[];
	canManage: boolean;
	onUpdatePermissions: (
		roleId: string,
		permissions: Permission[],
	) => Promise<void>;
	onRefresh: () => void;
	refreshing: boolean;
}) {
	const [expandedRole, setExpandedRole] = useState<string | null>(null);
	const [editingRole, setEditingRole] = useState<string | null>(null);
	const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
		[],
	);
	const [updating, setUpdating] = useState(false);

	const allPermissions: Permission[] = [
		"canViewAllLeaves",
		"canApproveLeaves",
		"canRejectLeaves",
		"canEditAllLeaves",
		"canDeleteAllLeaves",
		"canViewAllUsers",
		"canEditUsers",
		"canDeleteUsers",
		"canManageProjects",
		"canManageVacancies",
		"canEditVacancies",
		"canDeleteVacancies",
		"canCreateVacancies",
		"canViewVacancies",
		"canApplyVacancies",
		"canViewApplications",
		"canEditApplications",
		"canManageGuides",
		"canViewAllNotifications",
		"canManageTeams",
		"canViewStructure",
		"canEditProfile",
	];

	const handleEditStart = (role: Role) => {
		setEditingRole(role.id);
		setSelectedPermissions(role.permissions || []);
	};

	const handleEditCancel = () => {
		setEditingRole(null);
		setSelectedPermissions([]);
	};

	const handlePermissionToggle = (permission: Permission) => {
		setSelectedPermissions((prev) =>
			prev.includes(permission)
				? prev.filter((p) => p !== permission)
				: [...prev, permission],
		);
	};

	const handleSavePermissions = async (roleId: string) => {
		try {
			setUpdating(true);
			await onUpdatePermissions(roleId, selectedPermissions);
			setEditingRole(null);
			setSelectedPermissions([]);
			toast.success("Uprawnienia zaktualizowane!");
		} catch (error) {
			logger.error("❌ Błąd:", error);
			toast.error("Nie udało się zaktualizować uprawnień");
		} finally {
			setUpdating(false);
		}
	};

	return (
		<section className={styles.section}>
			<div className={styles.section__header}>
				<div className={styles.section__headerLeft}>
					<h2 className={styles.section__title}>Role i uprawnienia</h2>
					<p className={styles.section__subtitle}>
						Zarządzanie dostępami i uprawnieniami użytkowników.
					</p>
				</div>
				<div className={styles.section__headerRight}>
					<button
						className={styles.section__refreshBtn}
						onClick={onRefresh}
						disabled={refreshing}
						title="Odśwież uprawnienia"
					>
						<RefreshCw
							size={16}
							className={refreshing ? styles.spinning : ""}
						/>
					</button>
					{canManage && (
						<button className={styles.section__addBtn}>
							<Plus size={18} />
							Dodaj rolę
						</button>
					)}
				</div>
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
								<p className={styles.roleCard__description}>
									{role.description}
								</p>
							</div>
							<button
								className={styles.roleCard__expandBtn}
								onClick={() =>
									setExpandedRole(expandedRole === role.id ? null : role.id)
								}
							>
								{expandedRole === role.id ? (
									<ChevronDown size={18} />
								) : (
									<ChevronRight size={18} />
								)}
							</button>
						</div>
						{expandedRole === role.id && (
							<div className={styles.roleCard__body}>
								{editingRole === role.id ? (
									<div className={styles.roleCard__edit}>
										<h4 className={styles.roleCard__permissionsTitle}>
											Wybierz uprawnienia dla roli {role.label}:
										</h4>
										<div className={styles.roleCard__permissionsGrid}>
											{allPermissions.map((perm) => (
												<label
													key={perm}
													className={styles.roleCard__permissionCheckbox}
												>
													<input
														type="checkbox"
														checked={selectedPermissions.includes(perm)}
														onChange={() => handlePermissionToggle(perm)}
													/>
													<span>{PERMISSION_LABELS[perm] || perm}</span>
												</label>
											))}
										</div>
										<div className={styles.roleCard__editActions}>
											<button
												className={styles.roleCard__saveBtn}
												onClick={() => handleSavePermissions(role.id)}
												disabled={updating}
											>
												{updating ? "Zapisywanie..." : "Zapisz"}
											</button>
											<button
												className={styles.roleCard__cancelBtn}
												onClick={handleEditCancel}
												disabled={updating}
											>
												Anuluj
											</button>
										</div>
									</div>
								) : (
									<>
										<h4 className={styles.roleCard__permissionsTitle}>
											Uprawnienia:
										</h4>
										<div className={styles.roleCard__permissions}>
											{role.permissions && role.permissions.length > 0 ? (
												role.permissions.map((p) => (
													<span key={p} className={styles.roleCard__permission}>
														<CheckCircle size={14} />
														{PERMISSION_LABELS[p] || p}
													</span>
												))
											) : (
												<span className={styles.roleCard__noPermissions}>
													Brak uprawnień
												</span>
											)}
										</div>
										{canManage && (
											<div className={styles.roleCard__actions}>
												<button
													className={styles.roleCard__actionBtn}
													onClick={() => handleEditStart(role)}
												>
													<Edit size={16} />
													Edytuj uprawnienia
												</button>
												<button
													className={`${styles.roleCard__actionBtn} ${styles.roleCard__actionBtnDanger}`}
												>
													<Trash2 size={16} />
													Usuń rolę
												</button>
											</div>
										)}
									</>
								)}
							</div>
						)}
					</div>
				))}
			</div>
		</section>
	);
}

// ---- Komponent zarządzania strukturą ----
function StructureManagement({
	teams,
	canManage,
	availableUsers,
	onRefresh,
	onTeamUpdated,
}: {
	teams: Team[];
	canManage: boolean;
	availableUsers: AvailableUser[];
	onRefresh: () => void;
	onTeamUpdated: (teamId: string) => void;
}) {
	const [isAddingTeam, setIsAddingTeam] = useState(false);
	const [editingTeam, setEditingTeam] = useState<Team | null>(null);
	const [isAddingMember, setIsAddingMember] = useState<string | null>(null);
	const [selectedUser, setSelectedUser] = useState<string>("");
	const [selectedRole, setSelectedRole] = useState<string>("Członek");
	const [isLeader, setIsLeader] = useState(false);
	const [teamForm, setTeamForm] = useState({
		name: "",
		description: "",
		role: "Zespół",
		icon: "Users",
		email: "",
	});
	const [confirmDialog, setConfirmDialog] = useState<{
		isOpen: boolean;
		title: string;
		message: string;
		confirmText: string;
		onConfirm: () => void;
		onCancel: () => void;
	}>({
		isOpen: false,
		title: "",
		message: "",
		confirmText: "Potwierdź",
		onConfirm: () => {},
		onCancel: () => {},
	});

	const resetTeamForm = () => {
		setTeamForm({
			name: "",
			description: "",
			role: "Zespół",
			icon: "Users",
			email: "",
		});
		setIsAddingTeam(false);
		setEditingTeam(null);
		setIsAddingMember(null);
		setSelectedUser("");
		setSelectedRole("Członek");
		setIsLeader(false);
	};

	const handleAddTeam = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch("/api/admin/teams", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(teamForm),
			});

			if (!response.ok) throw new Error("Błąd dodawania zespołu");

			toast.success("Zespół dodany!");
			resetTeamForm();
			await onRefresh();
		} catch (error) {
			logger.error("❌ Błąd:", error);
			toast.error("Nie udało się dodać zespołu");
		}
	};

	const handleEditTeam = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingTeam) return;

		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch(`/api/admin/teams/${editingTeam.id}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(teamForm),
			});

			if (!response.ok) throw new Error("Błąd edycji zespołu");

			toast.success("Zespół zaktualizowany!");
			const teamId = editingTeam.id;
			resetTeamForm();
			await onRefresh();

			onTeamUpdated(teamId);
		} catch (error) {
			logger.error("❌ Błąd:", error);
			toast.error("Nie udało się zaktualizować zespołu");
		}
	};

	const showDeleteTeamConfirm = (teamId: string, teamName: string) => {
		setConfirmDialog({
			isOpen: true,
			title: "Usuń zespół",
			message: `Czy na pewno chcesz usunąć zespół "${teamName}"? Tej operacji nie można cofnąć.`,
			confirmText: "Usuń",
			onConfirm: async () => {
				try {
					const token = localStorage.getItem("accessToken");
					const response = await fetch(`/api/admin/teams/${teamId}`, {
						method: "DELETE",
						headers: {
							Authorization: `Bearer ${token}`,
						},
					});

					if (!response.ok) throw new Error("Błąd usuwania zespołu");

					toast.success("Zespół usunięty!");
					await onRefresh();
				} catch (error) {
					logger.error("❌ Błąd:", error);
					toast.error("Nie udało się usunąć zespołu");
				}
				setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
			},
			onCancel: () => {
				setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
			},
		});
	};

	const showRemoveMemberConfirm = (
		memberId: string,
		memberName: string,
		teamId: string,
	) => {
		setConfirmDialog({
			isOpen: true,
			title: "Usuń członka z zespołu",
			message: `Czy na pewno chcesz usunąć "${memberName}" z zespołu?`,
			confirmText: "Usuń",
			onConfirm: async () => {
				try {
					const token = localStorage.getItem("accessToken");
					const response = await fetch(`/api/admin/team-members/${memberId}`, {
						method: "DELETE",
						headers: {
							Authorization: `Bearer ${token}`,
						},
					});

					if (!response.ok) throw new Error("Błąd usuwania członka");

					toast.success("Członek usunięty z zespołu!");
					await onRefresh();
					onTeamUpdated(teamId);
				} catch (error) {
					logger.error("❌ Błąd:", error);
					toast.error("Nie udało się usunąć członka");
				}
				setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
			},
			onCancel: () => {
				setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
			},
		});
	};

	const handleAddMember = async (teamId: string) => {
		if (!selectedUser) {
			toast.error("Wybierz użytkownika");
			return;
		}

		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch("/api/admin/team-members", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					team_id: teamId,
					user_id: selectedUser,
					role: selectedRole,
					is_leader: isLeader,
				}),
			});

			if (!response.ok) throw new Error("Błąd dodawania członka");

			toast.success("Członek dodany!");
			setIsAddingMember(null);
			setSelectedUser("");
			setIsLeader(false);
			await onRefresh();
			onTeamUpdated(teamId);
		} catch (error) {
			logger.error("❌ Błąd:", error);
			toast.error("Nie udało się dodać członka");
		}
	};

	const handleChangeMemberRole = async (
		memberId: string,
		isLeader: boolean,
		teamId: string,
	) => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch(`/api/admin/team-members/${memberId}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ is_leader: isLeader }),
			});

			if (!response.ok) throw new Error("Błąd zmiany roli");

			toast.success(
				isLeader ? "Ustawiono jako lidera!" : "Usunięto z liderów!",
			);
			await onRefresh();
			onTeamUpdated(teamId);
		} catch (error) {
			logger.error("❌ Błąd:", error);
			toast.error("Nie udało się zmienić roli");
		}
	};

	const startEditTeam = (team: Team) => {
		setTeamForm({
			name: team.name,
			description: team.description || "",
			role: team.role || "Zespół",
			icon: team.icon || "Users",
			email: team.email || "",
		});
		setEditingTeam(team);
	};

	const getIconComponent = (iconName: string) => {
		const found = ICON_OPTIONS.find((i) => i.value === iconName);
		if (found) {
			const Icon = found.icon;
			return <Icon size={20} />;
		}
		return <Users size={20} />;
	};

	return (
		<section className={styles.section}>
			<ConfirmDialog
				isOpen={confirmDialog.isOpen}
				title={confirmDialog.title}
				message={confirmDialog.message}
				confirmText={confirmDialog.confirmText}
				onConfirm={confirmDialog.onConfirm}
				onCancel={confirmDialog.onCancel}
			/>

			<div className={styles.section__header}>
				<div className={styles.section__headerLeft}>
					<h2 className={styles.section__title}>Zespoły i członkowie</h2>
					<p className={styles.section__subtitle}>
						Zarządzanie zespołami oraz przypisywanie członków.
					</p>
				</div>
				{canManage && (
					<button
						className={styles.section__addBtn}
						onClick={() => setIsAddingTeam(true)}
					>
						<Plus size={18} />
						Dodaj zespół
					</button>
				)}
			</div>

			{(isAddingTeam || editingTeam) && (
				<div
					className={styles.modalOverlay}
					onClick={() => {
						if (isAddingTeam) setIsAddingTeam(false);
						if (editingTeam) setEditingTeam(null);
					}}
				>
					<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
						<div className={styles.modal__header}>
							<h2 className={styles.modal__title}>
								{editingTeam ? "Edytuj zespół" : "Dodaj nowy zespół"}
							</h2>
							<button
								className={styles.modal__close}
								onClick={() => {
									resetTeamForm();
									setEditingTeam(null);
								}}
							>
								<X size={20} />
							</button>
						</div>
						<form onSubmit={editingTeam ? handleEditTeam : handleAddTeam}>
							<div className={styles.modal__body}>
								<div className={styles.modal__field}>
									<label>Nazwa zespołu *</label>
									<input
										type="text"
										value={teamForm.name}
										onChange={(e) =>
											setTeamForm({ ...teamForm, name: e.target.value })
										}
										required
									/>
								</div>
								<div className={styles.modal__field}>
									<label>Email</label>
									<input
										type="email"
										value={teamForm.email}
										onChange={(e) =>
											setTeamForm({ ...teamForm, email: e.target.value })
										}
									/>
								</div>
								<div className={styles.modal__field}>
									<label>Opis</label>
									<textarea
										value={teamForm.description}
										onChange={(e) =>
											setTeamForm({ ...teamForm, description: e.target.value })
										}
										rows={3}
									/>
								</div>
								<div className={styles.modal__row}>
									<div className={styles.modal__field}>
										<label>Typ</label>
										<input
											type="text"
											value={teamForm.role}
											onChange={(e) =>
												setTeamForm({ ...teamForm, role: e.target.value })
											}
										/>
									</div>
									<div className={styles.modal__field}>
										<label>Ikona</label>
										<select
											value={teamForm.icon}
											onChange={(e) =>
												setTeamForm({ ...teamForm, icon: e.target.value })
											}
										>
											{ICON_OPTIONS.map((opt) => (
												<option key={opt.value} value={opt.value}>
													{opt.label}
												</option>
											))}
										</select>
									</div>
								</div>
								<div
									className={styles.modal__field}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "8px",
										marginTop: "8px",
									}}
								>
									<span>Podgląd ikony:</span>
									{getIconComponent(teamForm.icon)}
								</div>
							</div>
							<div className={styles.modal__actions}>
								<button
									type="button"
									className={styles.modal__btnCancel}
									onClick={() => {
										resetTeamForm();
										setEditingTeam(null);
									}}
								>
									Anuluj
								</button>
								<button type="submit" className={styles.modal__btnSave}>
									<Save size={16} />
									{editingTeam ? "Zapisz zmiany" : "Dodaj zespół"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			<div className={styles.teamsGrid}>
				{teams.map((team) => (
					<div key={team.id} id={`team-${team.id}`} className={styles.teamCard}>
						<div className={styles.teamCard__header}>
							<div className={styles.teamCard__icon}>
								{getIconComponent(team.icon)}
							</div>
							<div className={styles.teamCard__info}>
								<h3 className={styles.teamCard__name}>{team.name}</h3>
								<p className={styles.teamCard__description}>
									{team.description}
								</p>
							</div>
							<div className={styles.teamCard__actions}>
								{canManage && (
									<>
										<button
											className={styles.teamCard__editBtn}
											onClick={() => startEditTeam(team)}
											title="Edytuj zespół"
										>
											<Edit size={16} />
										</button>
										<button
											className={styles.teamCard__deleteBtn}
											onClick={() => showDeleteTeamConfirm(team.id, team.name)}
											title="Usuń zespół"
										>
											<Trash2 size={16} />
										</button>
									</>
								)}
							</div>
						</div>
						<div className={styles.teamCard__body}>
							<div className={styles.teamCard__meta}>
								{team.email && (
									<a
										href={`mailto:${team.email}`}
										className={styles.teamCard__email}
									>
										<Mail size={14} />
										{team.email}
									</a>
								)}
								<span className={styles.teamCard__memberCount}>
									<Users size={14} />
									{team.members.length} członków
								</span>
							</div>

							<div className={styles.teamCard__members}>
								{team.members.map((member) => (
									<div key={member.id} className={styles.memberItem}>
										<div className={styles.memberItem__avatar}>
											{member.first_name[0]}
											{member.last_name[0]}
										</div>
										<div className={styles.memberItem__info}>
											<span className={styles.memberItem__name}>
												{member.first_name} {member.last_name}
											</span>
											<span className={styles.memberItem__role}>
												{member.is_leader && <Crown size={12} />}
												{member.role_in_team}
												{member.functional_role &&
													` (${member.functional_role})`}
											</span>
										</div>
										<div className={styles.memberItem__actions}>
											{canManage && (
												<>
													{!member.is_leader && (
														<button
															className={styles.memberItem__makeLeader}
															onClick={() =>
																handleChangeMemberRole(member.id, true, team.id)
															}
															title="Ustaw jako lidera"
														>
															<Crown size={14} />
														</button>
													)}
													{member.is_leader && (
														<button
															className={styles.memberItem__removeLeader}
															onClick={() =>
																handleChangeMemberRole(
																	member.id,
																	false,
																	team.id,
																)
															}
															title="Usuń z liderów"
														>
															<User size={14} />
														</button>
													)}
													<button
														className={styles.memberItem__remove}
														onClick={() =>
															showRemoveMemberConfirm(
																member.id,
																`${member.first_name} ${member.last_name}`,
																team.id,
															)
														}
														title="Usuń z zespołu"
													>
														<X size={14} />
													</button>
												</>
											)}
										</div>
									</div>
								))}
							</div>

							{canManage && (
								<div className={styles.teamCard__addMember}>
									{isAddingMember === team.id ? (
										<div className={styles.addMemberForm}>
											<select
												value={selectedUser}
												onChange={(e) => setSelectedUser(e.target.value)}
												className={styles.addMemberForm__select}
											>
												<option value="">Wybierz użytkownika...</option>
												{availableUsers
													.filter(
														(u) =>
															!team.members.some((m) => m.user_id === u.id),
													)
													.map((user) => (
														<option key={user.id} value={user.id}>
															{user.first_name} {user.last_name} ({user.email})
														</option>
													))}
											</select>

											<input
												type="text"
												value={selectedRole}
												onChange={(e) => setSelectedRole(e.target.value)}
												placeholder="Rola w zespole (np. Koordynator, Specjalista)"
												className={styles.addMemberForm__input}
											/>

											<label className={styles.addMemberForm__leader}>
												<input
													type="checkbox"
													checked={isLeader}
													onChange={(e) => setIsLeader(e.target.checked)}
												/>
												Lider
											</label>
											<button
												className={styles.addMemberForm__save}
												onClick={() => handleAddMember(team.id)}
											>
												<Save size={14} />
											</button>
											<button
												className={styles.addMemberForm__cancel}
												onClick={() => {
													setIsAddingMember(null);
													setSelectedUser("");
													setSelectedRole("Członek");
													setIsLeader(false);
												}}
											>
												<X size={14} />
											</button>
										</div>
									) : (
										<button
											className={styles.teamCard__addMemberBtn}
											onClick={() => setIsAddingMember(team.id)}
										>
											<UserPlus size={16} />
											Dodaj członka
										</button>
									)}
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

// ---- Komponent statystyk ----
function ActivityMonitoring({
	teams,
	roles,
}: {
	teams: Team[];
	roles: Role[];
}) {
	const totalMembers = teams.reduce(
		(acc, team) => acc + team.members.length,
		0,
	);

	return (
		<section className={styles.section}>
			<div className={styles.section__header}>
				<div className={styles.section__headerLeft}>
					<h2 className={styles.section__title}>Statystyki organizacji</h2>
					<p className={styles.section__subtitle}>
						Podsumowanie danych organizacji.
					</p>
				</div>
			</div>

			<div className={styles.statsGrid}>
				<div className={styles.statCard}>
					<div
						className={styles.statCard__icon}
						style={{ background: "#dbeafe", color: "#1d4ed8" }}
					>
						<Users size={24} />
					</div>
					<div className={styles.statCard__content}>
						<span className={styles.statCard__value}>{totalMembers}</span>
						<span className={styles.statCard__label}>Członków</span>
					</div>
				</div>
				<div className={styles.statCard}>
					<div
						className={styles.statCard__icon}
						style={{ background: "#d1fae5", color: "#059669" }}
					>
						<FolderTree size={24} />
					</div>
					<div className={styles.statCard__content}>
						<span className={styles.statCard__value}>{teams.length}</span>
						<span className={styles.statCard__label}>Zespołów</span>
					</div>
				</div>
				<div className={styles.statCard}>
					<div
						className={styles.statCard__icon}
						style={{ background: "#fef3c7", color: "#d97706" }}
					>
						<Shield size={24} />
					</div>
					<div className={styles.statCard__content}>
						<span className={styles.statCard__value}>{roles.length}</span>
						<span className={styles.statCard__label}>Ról</span>
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
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [teams, setTeams] = useState<Team[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
	const [currentUser, setCurrentUser] = useState<any>(null);
	const [scrollToTeamId, setScrollToTeamId] = useState<string | null>(null);

	const fetchData = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("accessToken");

			const profileRes = await fetch("/api/profile", {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!profileRes.ok) {
				throw new Error("Błąd pobierania profilu");
			}

			const profileData = await profileRes.json();
			setCurrentUser(profileData);

			if (profileData.role !== "admin") {
				safeNavigate("/dashboard", navigate);
				return;
			}

			const teamsRes = await fetch("/api/admin/teams", {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (teamsRes.ok) {
				const teamsData = await teamsRes.json();
				setTeams(teamsData);
				logger.debug("🔍 [Admin] Zespoły pobrane:", teamsData);
			}

			const usersRes = await fetch("/api/admin/available-users", {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (usersRes.ok) {
				const usersData = await usersRes.json();
				setAvailableUsers(usersData);
			}

			const rolesRes = await fetch("/api/admin/roles", {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (rolesRes.ok) {
				const rolesData = await rolesRes.json();
				const mappedRoles: Role[] = rolesData.map((r: any) => ({
					id: r.id,
					name: r.name as UserRole,
					label: ROLE_LABELS[r.name as UserRole] || r.name,
					description: r.description || "",
					permissions: r.permissions || [],
				}));
				setRoles(mappedRoles);
			}

			clearPermissionsCache();
		} catch (error) {
			logger.error("❌ Błąd pobierania danych:", error);
			toast.error("Nie udało się pobrać danych");
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		await fetchData();
		setRefreshing(false);
		toast.success("Dane odświeżone");
	};

	const handleUpdatePermissions = async (
		roleId: string,
		permissions: Permission[],
	) => {
		try {
			const success = await updateRolePermissions(roleId, permissions);
			if (success) {
				setRoles((prev: Role[]) =>
					prev.map((role: Role) =>
						role.id === roleId ? { ...role, permissions } : role,
					),
				);
				clearPermissionsCache();
				toast.success("Uprawnienia zaktualizowane!");
			} else {
				throw new Error("Nie udało się zaktualizować uprawnień");
			}
		} catch (error) {
			logger.error("❌ Błąd:", error);
			toast.error("Nie udało się zaktualizować uprawnień");
			throw error;
		}
	};

	const handleTeamUpdated = (teamId: string) => {
		setScrollToTeamId(teamId);
	};

	useEffect(() => {
		if (scrollToTeamId) {
			const element = document.getElementById(`team-${scrollToTeamId}`);
			if (element) {
				element.scrollIntoView({ behavior: "smooth", block: "center" });

				element.style.transition = "background-color 0.5s";
				element.style.backgroundColor = "#dbeafe";
				setTimeout(() => {
					element.style.backgroundColor = "";
				}, 2000);
				setScrollToTeamId(null);
			}
		}
	}, [scrollToTeamId, teams]);

	useEffect(() => {
		fetchData();
	}, []);

	if (loading) {
		return (
			<div className={styles.loading}>
				<div className={styles.loading__spinner} />
				<span>Ładowanie panelu administracyjnego...</span>
			</div>
		);
	}

	if (!currentUser || currentUser.role !== "admin") {
		return null;
	}

	const canManage =
		hasPermission(currentUser?.role, "canEditVacancies") ||
		hasPermission(currentUser?.role, "canDeleteVacancies");

	return (
		<div className={styles.admin}>
			<div className={styles.header}>
				<div className={styles.header__left}>
					<h1 className={styles.header__title}>
						{title ?? "Administracja systemu"}
					</h1>
					<p className={styles.header__subtitle}>
						Panel zarządzania rolami, uprawnieniami, zespołami i członkami.
					</p>
				</div>
			</div>

			<RolesManagement
				roles={roles}
				canManage={canManage}
				onUpdatePermissions={handleUpdatePermissions}
				onRefresh={handleRefresh}
				refreshing={refreshing}
			/>

			<StructureManagement
				teams={teams}
				canManage={canManage}
				availableUsers={availableUsers}
				onRefresh={handleRefresh}
				onTeamUpdated={handleTeamUpdated}
			/>

			<ActivityMonitoring teams={teams} roles={roles} />
			<LogsManagement />
		</div>
	);
}
