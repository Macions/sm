import React, { useState, useEffect, useRef } from "react";
import { safeNavigate } from "@/utils/safeNavigation";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { logger } from "@/utils/logger";
import { RevenueChart } from "@/components/RevenueChart";
import styles from "./Admin.module.css";

import {
	Users,
	Plus,
	Edit,
	Trash2,
	CheckCircle,
	ChevronDown,
	ChevronUp,
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
		success: { label: "Powodzenie", icon: "âś“", color: "#059669" },
		error: { label: "Błąd", icon: "âś—", color: "#dc2626" },
		warning: { label: "Ostrzeżenie", icon: "âš ", color: "#d97706" },
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
			logger.error("âťŚ Błąd:", error);
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
						<option value="success">âś“ Powodzenie</option>
						<option value="error">âś— Błąd</option>
						<option value="warning">âš  Ostrzeżenie</option>
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
interface AttendanceUser {
	id: number;
	first_name: string;
	last_name: string;
	fullName: string;
	email: string;
	attendance_percentage: number | null;
	functional_role: string;
	team: string;
	is_default: boolean;
	is_no_data?: boolean;
}

interface AttendanceRankingData {
	topFive: AttendanceUser[];
	bottomFive: AttendanceUser[];
	noDataUsers: AttendanceUser[];
	allUsers: AttendanceUser[];
	total: number;
	hasMore: boolean;
}
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
			logger.error("âťŚ Błąd:", error);
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
		parent_id: null as string | null,
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
		onConfirm: () => { },
		onCancel: () => { },
	});
	const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>(
		{},
	);

	const [editingMemberRole, setEditingMemberRole] = useState<{
		memberId: string;
		teamId: string;
		currentRole: string;
		memberName: string;
	} | null>(null);
	const [newRoleValue, setNewRoleValue] = useState<string>("");
	const scrollToTeamHeader = (teamId: string) => {
		const element = document.getElementById(`team-${teamId}`);
		if (element) {

			const header = element.querySelector(".teamCard__header");
			if (header) {

				const headerRect = header.getBoundingClientRect();
				const offset = 80;
				const scrollPosition = window.scrollY + headerRect.top - offset;

				window.scrollTo({
					top: scrollPosition,
					behavior: "smooth",
				});
			} else {

				element.scrollIntoView({
					behavior: "smooth",
					block: "start",
					inline: "nearest",
				});
			}
		}
	};

	const handleUpdateMemberRole = async (
		memberId: string,
		teamId: string,
		newRole: string,
	) => {
		const trimmed = newRole.trim();

		if (!trimmed) {
			toast.error("Nazwa roli nie może być pusta");
			return;
		}

		if (trimmed.length > 100) {
			toast.error("Nazwa roli nie może przekraczać 100 znaków");
			return;
		}

		try {
			const token = localStorage.getItem("accessToken");

			const response = await fetch(`/api/admin/team-members/${memberId}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					role_in_team: trimmed,
				}),
			});

			if (!response.ok) throw new Error("Błąd aktualizacji roli");

			toast.success("Rola zaktualizowana!");
			setEditingMemberRole(null);
			setNewRoleValue("");
			await onRefresh();
			onTeamUpdated(teamId);
		} catch (error) {
			logger.error("âťŚ Błąd:", error);
			toast.error("Nie udało się zaktualizować roli");
		}
	};

	const [isSectionExpanded, setIsSectionExpanded] = useState(true);
	const resetTeamForm = () => {
		setTeamForm({
			name: "",
			description: "",
			role: "Zespół",
			icon: "Users",
			email: "",
			parent_id: null,
		});
		setIsAddingTeam(false);
		setEditingTeam(null);
		setIsAddingMember(null);
		setSelectedUser("");
		setSelectedRole("Członek");
		setIsLeader(false);
	};

	const HIDDEN_TEAMS = [
		"Filary organizacji",
		"Organy kontrolne",
		"Siła młodych",
		"Siła Młodych",

	];

	const TEAM_ORDER = [
		"Zarząd",
		"Dyrekcja",
		"Komisja Rewizyjna",
		"Sąd Koleżeński",
	];

	const isPillar = (teamName: string): boolean => {
		return teamName.includes("Filar");
	};

	const getSortedTeams = (): Team[] => {

		const filtered = teams.filter((team) => !HIDDEN_TEAMS.includes(team.name));

		const pillars: Team[] = [];
		const others: Team[] = [];

		filtered.forEach((team) => {
			if (isPillar(team.name)) {
				pillars.push(team);
			} else {
				others.push(team);
			}
		});

		const sortedOthers = others.sort((a, b) => {
			const indexA = TEAM_ORDER.indexOf(a.name);
			const indexB = TEAM_ORDER.indexOf(b.name);
			if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
			if (indexA === -1) return 1;
			if (indexB === -1) return -1;
			return indexA - indexB;
		});

		const sortedPillars = pillars.sort((a, b) => a.name.localeCompare(b.name));

		return [...sortedOthers, ...sortedPillars];
	};

	const getDisplayMembers = (
		team: Team,
	): { display: TeamMember[]; hidden: TeamMember[]; total: number } => {
		const isTeamPillar = isPillar(team.name);
		const isExpanded = expandedTeams[team.id] || false;

		const members = [...team.members];

		if (isTeamPillar) {
			const leaders = members.filter((m) => m.is_leader === true);
			const nonLeaders = members.filter((m) => m.is_leader !== true);

			if (isExpanded) {
				return {
					display: members,
					hidden: [],
					total: members.length,
				};
			}

			return {
				display: leaders,
				hidden: nonLeaders,
				total: members.length,
			};
		}

		if (!isTeamPillar) {
			if (isExpanded) {
				return {
					display: members,
					hidden: [],
					total: members.length,
				};
			}

			if (members.length > 5) {
				const display = members.slice(0, 3);
				const hidden = members.slice(3);

				return { display, hidden, total: members.length };
			}

			return {
				display: members,
				hidden: [],
				total: members.length,
			};
		}

		return {
			display: members,
			hidden: [],
			total: members.length,
		};
	};

	const toggleShowAll = (teamId: string) => {
		const isCurrentlyExpanded = expandedTeams[teamId] || false;

		if (isCurrentlyExpanded) {

			setExpandedTeams((prev) => ({
				...prev,
				[teamId]: false,
			}));

			setTimeout(() => {
				scrollToTeamHeader(teamId);
			}, 100);
		} else {

			setExpandedTeams((prev) => ({
				...prev,
				[teamId]: true,
			}));
		}
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
			logger.error("âťŚ Błąd:", error);
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
			logger.error("âťŚ Błąd:", error);
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
					logger.error("âťŚ Błąd:", error);
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
					logger.error("âťŚ Błąd:", error);
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
					role_in_team: selectedRole,
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
			logger.error("âťŚ Błąd:", error);
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
			logger.error("âťŚ Błąd:", error);
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
			parent_id: team.parent_id || null,
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
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "12px",
							width: "100%",
						}}
					>
						<h2 className={styles.section__title} style={{ margin: 0 }}>
							Zespoły i członkowie
						</h2>
						<button
							onClick={() => setIsSectionExpanded(!isSectionExpanded)}
							style={{
								display: "inline-flex",
								alignItems: "center",
								justifyContent: "center",
								width: "32px",
								height: "32px",
								background: "#f3f4f6",
								border: "1px solid #e5e7eb",
								borderRadius: "6px",
								color: "#4b5563",
								cursor: "pointer",
								transition: "all 0.2s ease",
								flexShrink: 0,
								marginLeft: "auto",
							}}
							title={isSectionExpanded ? "Zwiń sekcję" : "Rozwiń sekcję"}
						>
							{isSectionExpanded ? (
								<ChevronDown size={20} />
							) : (
								<ChevronRight size={20} />
							)}
						</button>
					</div>
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
			{isSectionExpanded && (
				<>
					{(isAddingTeam || editingTeam) && (
						<div
							className={styles.modalOverlay}
							onClick={() => {
								if (isAddingTeam) setIsAddingTeam(false);
								if (editingTeam) setEditingTeam(null);
							}}
						>
							<div
								className={styles.modal}
								onClick={(e) => e.stopPropagation()}
							>
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
													setTeamForm({
														...teamForm,
														description: e.target.value,
													})
												}
												rows={3}
											/>
										</div>

										<div className={styles.modal__field}>
											<label>Zespół nadrzędny</label>
											<select
												value={teamForm.parent_id || ""}
												onChange={(e) =>
													setTeamForm({
														...teamForm,
														parent_id: e.target.value || null,
													})
												}
											>
												<option value="">Brak</option>
												{teams
													.filter((t) => t.id !== editingTeam?.id)
													.map((team) => (
														<option key={team.id} value={team.id}>
															{team.name}
														</option>
													))}
											</select>
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
						{getSortedTeams().map((team) => {
							const {
								display: displayMembers,
								hidden: hiddenMembers,
								total,
							} = getDisplayMembers(team);

							return (
								<div
									key={team.id}
									id={`team-${team.id}`}
									className={styles.teamCard}
								>
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
														onClick={() =>
															showDeleteTeamConfirm(team.id, team.name)
														}
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
												{total} członków
											</span>
										</div>

										<div className={styles.teamCard__members}>
											{displayMembers.map((member) => (
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

																{editingMemberRole?.memberId === member.id ? (

																	<div
																		className={
																			styles.memberItem__roleEditInline
																		}
																	>
																		<input
																			type="text"
																			value={newRoleValue}
																			onChange={(e) =>
																				setNewRoleValue(e.target.value)
																			}
																			className={
																				styles.memberItem__roleInputSmall
																			}
																			autoFocus
																			onFocus={(e) => e.target.select()}
																			onKeyDown={(e) => {
																				if (e.key === "Enter") {
																					handleUpdateMemberRole(
																						member.id,
																						team.id,
																						newRoleValue,
																					);
																				}
																				if (e.key === "Escape") {
																					setEditingMemberRole(null);
																					setNewRoleValue("");
																				}
																			}}
																		/>
																		<button
																			className={
																				styles.memberItem__roleSaveSmall
																			}
																			onClick={() =>
																				handleUpdateMemberRole(
																					member.id,
																					team.id,
																					newRoleValue,
																				)
																			}
																			title="Zapisz rolę"
																		>
																			<CheckCircle size={14} />
																		</button>
																		<button
																			className={
																				styles.memberItem__roleCancelSmall
																			}
																			onClick={() => {
																				setEditingMemberRole(null);
																				setNewRoleValue("");
																			}}
																			title="Anuluj"
																		>
																			<X size={14} />
																		</button>
																	</div>
																) : (

																	<button
																		className={styles.memberItem__editRole}
																		onClick={() => {
																			setEditingMemberRole({
																				memberId: member.id,
																				teamId: team.id,
																				currentRole: member.role_in_team,
																				memberName: `${member.first_name} ${member.last_name}`,
																			});
																			setNewRoleValue(member.role_in_team);
																		}}
																		title="Edytuj rolę w zespole"
																	>
																		<Edit size={14} />
																	</button>
																)}

																{!member.is_leader && (
																	<button
																		className={styles.memberItem__makeLeader}
																		onClick={() =>
																			handleChangeMemberRole(
																				member.id,
																				true,
																				team.id,
																			)
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

										{(() => {
											const hasMore = hiddenMembers.length > 0;
											const isExpanded = expandedTeams[team.id] || false;
											const showToggleButton = hasMore || isExpanded;

											return showToggleButton ? (
												<button
													className={styles.showAllBtn}
													onClick={() => {

														toggleShowAll(team.id);
													}}
												>
													{isExpanded ? (
														<>Pokaż mniej</>
													) : (
														<>
															Pokaż wszystkich ({hiddenMembers.length} więcej)
														</>
													)}
												</button>
											) : null;
										})()}

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
																		!team.members.some(
																			(m) => m.user_id === u.id,
																		),
																)
																.map((user) => (
																	<option key={user.id} value={user.id}>
																		{user.first_name} {user.last_name} (
																		{user.email})
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
							);
						})}
					</div>
				</>
			)}
		</section>
	);
}

function AccessManagement() {
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [members, setMembers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedMember, setSelectedMember] = useState<any>(null);
	const [accessItems, setAccessItems] = useState<string[]>([]);
	const [newAccess, setNewAccess] = useState("");
	const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
	const [showAddModal, setShowAddModal] = useState(false);
	const [selectedUserId, setSelectedUserId] = useState("");
	const [newAccessForUser, setNewAccessForUser] = useState("");
	const [userSearchInput, setUserSearchInput] = useState("");
	const [showUserSuggestions, setShowUserSuggestions] = useState(false);
	const [filterCategory, setFilterCategory] = useState<string>("all");

	const CATEGORY_COLORS: Record<string, string> = {
		"Social Media": "#1d4ed8",
		Sprzęt: "#059669",
		Platformy: "#7c3aed",
		Narzędzia: "#d97706",
		Systemy: "#dc2626",
		Marketing: "#ec4899",
		Programowanie: "#2563eb",
		Inne: "#6b7280",
	};

	const [entryType, setEntryType] = useState<"access" | "item">("access");
	const [itemName, setItemName] = useState("");
	const [itemValue, setItemValue] = useState("");
	const [itemNotes, setItemNotes] = useState("");

	const ACCESS_OPTIONS = [

		{ label: "Instagram", category: "Social Media" },
		{ label: "Facebook", category: "Social Media" },
		{ label: "Twitter / X", category: "Social Media" },
		{ label: "LinkedIn", category: "Social Media" },
		{ label: "YouTube", category: "Social Media" },
		{ label: "TikTok", category: "Social Media" },
		{ label: "Discord", category: "Social Media" },
		{ label: "WhatsApp", category: "Social Media" },
		{ label: "Telegram", category: "Social Media" },
		{ label: "Messenger", category: "Social Media" },
		{ label: "Snapchat", category: "Social Media" },
		{ label: "Pinterest", category: "Social Media" },
		{ label: "Reddit", category: "Social Media" },
		{ label: "Twitch", category: "Social Media" },

		{ label: "Mikrofon", category: "Sprzęt" },
		{ label: "Mikrofon bezprzewodowy", category: "Sprzęt" },
		{ label: "Kamera", category: "Sprzęt" },
		{ label: "Kamera 4K", category: "Sprzęt" },
		{ label: "Aparat fotograficzny", category: "Sprzęt" },
		{ label: "Statyw", category: "Sprzęt" },
		{ label: "Statyw z głowicą", category: "Sprzęt" },
		{ label: "Oświetlenie LED", category: "Sprzęt" },
		{ label: "Oświetlenie studyjne", category: "Sprzęt" },
		{ label: "Green screen", category: "Sprzęt" },
		{ label: "Laptop", category: "Sprzęt" },
		{ label: "Tablet", category: "Sprzęt" },
		{ label: "Gimbal", category: "Sprzęt" },
		{ label: "Gimbal do telefonu", category: "Sprzęt" },
		{ label: "Słuchawki", category: "Sprzęt" },
		{ label: "Słuchawki studyjne", category: "Sprzęt" },
		{ label: "Monitor", category: "Sprzęt" },
		{ label: "Drukarka", category: "Sprzęt" },
		{ label: "Skaner", category: "Sprzęt" },

		{ label: "Slack", category: "Platformy" },
		{ label: "Teams", category: "Platformy" },
		{ label: "Zoom", category: "Platformy" },
		{ label: "Google Meet", category: "Platformy" },
		{ label: "Asana", category: "Narzędzia" },
		{ label: "Trello", category: "Narzędzia" },
		{ label: "Jira", category: "Narzędzia" },
		{ label: "ClickUp", category: "Narzędzia" },
		{ label: "Monday.com", category: "Narzędzia" },
		{ label: "Notion", category: "Narzędzia" },
		{ label: "Miro", category: "Narzędzia" },
		{ label: "Figma", category: "Narzędzia" },

		{ label: "Google Drive", category: "Systemy" },
		{ label: "Dropbox", category: "Systemy" },
		{ label: "OneDrive", category: "Systemy" },
		{ label: "SharePoint", category: "Systemy" },
		{ label: "CRM", category: "Systemy" },
		{ label: "ERP", category: "Systemy" },

		{ label: "Mailchimp", category: "Marketing" },
		{ label: "Canva", category: "Marketing" },
		{ label: "Adobe Creative Cloud", category: "Marketing" },
		{ label: "Buffer", category: "Marketing" },
		{ label: "Hootsuite", category: "Marketing" },
		{ label: "Sendinblue", category: "Marketing" },

		{ label: "GitHub", category: "Programowanie" },
		{ label: "GitLab", category: "Programowanie" },
		{ label: "Bitbucket", category: "Programowanie" },
		{ label: "VS Code", category: "Programowanie" },
		{ label: "IntelliJ", category: "Programowanie" },
		{ label: "Postman", category: "Programowanie" },

		{ label: "Klucze do biura", category: "Inne" },
		{ label: "Karta dostępu", category: "Inne" },
		{ label: "Parking", category: "Inne" },
		{ label: "Magazyn", category: "Inne" },
	];

	const fetchMembers = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("accessToken");
			const response = await fetch("/api/admin/member-access", {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) throw new Error("Błąd pobierania członków");

			const data = await response.json();
			setMembers(data);
		} catch (error) {
			logger.error("âťŚ Błąd:", error);
			toast.error("Nie udało się pobrać członków");
		} finally {
			setLoading(false);
		}
	};

	const [allUsers, setAllUsers] = useState<any[]>([]);

	const fetchAllUsers = async () => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch("/api/admin/available-users", {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				const data = await response.json();
				setAllUsers(data);
			}
		} catch (error) {
			logger.error("âťŚ Błąd:", error);
		}
	};

	const getSuggestions = (input: string) => {
		if (!input.trim()) return [];

		const parts = input.split(/[,;，、\n]+/);
		const lastPart = parts[parts.length - 1]?.trim() || "";

		if (!lastPart) return [];

		const lowerInput = lastPart.toLowerCase();

		return ACCESS_OPTIONS.filter((opt) => {
			const matchesSearch = opt.label.toLowerCase().includes(lowerInput);
			const matchesCategory =
				filterCategory === "all" || opt.category === filterCategory;
			return matchesSearch && matchesCategory;
		});
	};
	const getUserSuggestions = (input: string) => {
		if (!input.trim()) return [];
		const lowerInput = input.toLowerCase();
		return allUsers
			.filter(
				(u) =>
					u.first_name.toLowerCase().includes(lowerInput) ||
					u.last_name.toLowerCase().includes(lowerInput) ||
					u.email.toLowerCase().includes(lowerInput),
			)
			.slice(0, 10);
	};

	const getSelectedUser = () => {
		return allUsers.find((u) => u.id === selectedUserId);
	};

	const getSelectedUserName = () => {
		const user = getSelectedUser();
		if (user) return `${user.first_name} ${user.last_name}`;
		return userSearchInput;
	};
	const resetModal = () => {
		setShowAddModal(false);
		setSelectedUserId("");
		setUserSearchInput("");
		setNewAccessForUser("");
		setItemName("");
		setItemValue("");
		setItemNotes("");
		setEntryType("access");
	};
	const handleAddAccessToUser = async () => {
		if (!selectedUserId) {
			toast.error("Wybierz osobę");
			return;
		}

		if (entryType === "access") {

			if (!newAccessForUser.trim()) {
				toast.error("Wpisz nazwę dostępu");
				return;
			}

			const accessNames = newAccessForUser
				.split(/[,;，、\n]+/)
				.map((name) => name.trim())
				.filter((name) => name.length > 0);

			if (accessNames.length === 0) {
				toast.error("Wpisz poprawną nazwę dostępu");
				return;
			}

			try {
				const token = localStorage.getItem("accessToken");
				let addedCount = 0;
				const errors: string[] = [];

				for (const name of accessNames) {
					try {
						const response = await fetch(
							`/api/members/${selectedUserId}/access`,
							{
								method: "POST",
								headers: {
									Authorization: `Bearer ${token}`,
									"Content-Type": "application/json",
								},
								body: JSON.stringify({ access_name: name }),
							},
						);

						if (response.ok) {
							addedCount++;
						} else {
							const error = await response.json();
							errors.push(`${name}: ${error.error || "błąd"}`);
						}
					} catch (e) {
						errors.push(`${name}: błąd sieci`);
					}
				}

				if (addedCount > 0) {
					toast.success(`Dodano ${addedCount} dostępów!`);
				}
				if (errors.length > 0) {
					toast.error(`Nie udało się dodać: ${errors.join(", ")}`);
				}

				resetModal();
				await fetchMembers();
			} catch (error) {
				logger.error("Błąd:", error);
				toast.error("Nie udało się dodać dostępów");
			}
		} else {

			if (!itemName.trim()) {
				toast.error("Podaj nazwę przedmiotu");
				return;
			}

			try {
				const token = localStorage.getItem("accessToken");
				const response = await fetch(`/api/members/${selectedUserId}/items`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: itemName.trim(),
						value: itemValue ? parseFloat(itemValue) : null,
						notes: itemNotes.trim() || null,
					}),
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.error || "Błąd dodawania przedmiotu");
				}

				toast.success("Przedmiot dodany!");
				resetModal();
				await fetchMembers();
			} catch (error) {
				logger.error("Błąd:", error);
				toast.error(
					error instanceof Error
						? error.message
						: "Nie udało się dodać przedmiotu",
				);
			}
		}
	};

	const handleEditAccess = (member: any) => {
		setSelectedMember(member);
		setAccessItems(member.access || []);
		setEditingMemberId(member.id);
	};

	const handleCloseEdit = () => {
		setEditingMemberId(null);
		setSelectedMember(null);
		setAccessItems([]);
		setNewAccess("");
	};

	const handleSaveEdit = async () => {
		if (!selectedMember) return;

		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch(`/api/members/${selectedMember.id}/access`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ access: accessItems }),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Błąd zapisu");
			}

			toast.success("Dostęp zaktualizowany!");
			handleCloseEdit();
			await fetchMembers();
		} catch (error) {
			logger.error("âťŚ Błąd:", error);
			toast.error(
				error instanceof Error ? error.message : "Nie udało się zapisać",
			);
		}
	};

	useEffect(() => {
		fetchMembers();
		fetchAllUsers();
	}, []);

	const membersWithAccess = members.filter(
		(m) => m.access && m.access.length > 0,
	);

	if (loading) {
		return (
			<section className={styles.section}>
				<div className={styles.loading}>
					<div className={styles.loading__spinner} />
					<span>Ładowanie członków...</span>
				</div>
			</section>
		);
	}

	return (
		<section className={styles.section}>
			<div className={styles.section__header}>
				<div className={styles.section__headerLeft}>
					<h2 className={styles.section__title}>Dostępy i zasoby SM</h2>
					<p className={styles.section__subtitle}>
						Przypisywanie dostępu do mediów społecznościowych, sprzętu, narzędzi
						i platform.
					</p>
				</div>
				<button
					className={styles.section__addBtn}
					onClick={() => setShowAddModal(true)}
				>
					<Plus size={18} />
					Dodaj dostęp
				</button>
			</div>

			{membersWithAccess.length === 0 ? (
				<div className={styles.accessEmpty}>
					<Shield size={48} />
					<h3>Brak przypisanych dostępów</h3>
					<p>
						Kliknij "Dodaj dostęp" aby przypisać pierwszy dostęp dla członka.
					</p>
				</div>
			) : (
				<div className={styles.accessList}>
					{membersWithAccess.map((member) => (
						<div key={member.id} className={styles.accessItem}>
							<div className={styles.accessItem__header}>
								<div className={styles.accessItem__avatar}>
									{member.first_name[0]}
									{member.last_name[0]}
								</div>
								<div className={styles.accessItem__info}>
									<span className={styles.accessItem__name}>
										{member.first_name} {member.last_name}
									</span>
									<span className={styles.accessItem__email}>
										{member.email}
									</span>
									<div className={styles.accessItem__tags}>
										{member.access && member.access.length > 0 ? (
											member.access.map((item: any) => {

												const label = typeof item === 'object' ? item.access_name || item.name || JSON.stringify(item) : item;
												const key = typeof item === 'object' ? item.id || label : label;
												return (
													<span key={key} className={styles.accessTag}>
														{label}
													</span>
												);
											})
										) : (
											<span className={styles.accessEmptyTag}>Brak dostępów</span>
										)}
									</div>
								</div>
								<button
									className={styles.accessItem__editBtn}
									onClick={() => handleEditAccess(member)}
								>
									<Edit size={16} />
									Edytuj dostęp
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{editingMemberId && selectedMember && (
				<div className={styles.modalOverlay} onClick={handleCloseEdit}>
					<div
						className={styles.modal}
						style={{ maxWidth: "600px" }}
						onClick={(e) => e.stopPropagation()}
					>
						<div className={styles.modal__header}>
							<h2 className={styles.modal__title}>
								Edytuj dostęp dla {selectedMember.first_name}{" "}
								{selectedMember.last_name}
							</h2>
							<button className={styles.modal__close} onClick={handleCloseEdit}>
								<X size={20} />
							</button>
						</div>

						<div
							className={styles.modal__field}
							style={{ padding: "0 24px", marginTop: "8px" }}
						>
							<label>Typ wpisu</label>
							<div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
								<label
									style={{
										display: "flex",
										alignItems: "center",
										gap: "6px",
										cursor: "pointer",
									}}
								>
									<input
										type="radio"
										value="access"
										checked={entryType === "access"}
										onChange={() => {
											setEntryType("access");
											setItemName("");
											setItemValue("");
											setItemNotes("");
										}}
									/>
									Dostęp
								</label>
								<label
									style={{
										display: "flex",
										alignItems: "center",
										gap: "6px",
										cursor: "pointer",
									}}
								>
									<input
										type="radio"
										value="item"
										checked={entryType === "item"}
										onChange={() => {
											setEntryType("item");
										}}
									/>
									Przedmiot
								</label>
							</div>
						</div>

						<div className={styles.modal__body}>

							<div className={styles.modal__field}>
								<label>Filtruj kategorię</label>
								<select
									value={filterCategory}
									onChange={(e) => setFilterCategory(e.target.value)}
									style={{
										width: "100%",
										padding: "8px 12px",
										borderRadius: "8px",
										border: "1px solid #e5e7eb",
									}}
								>
									<option value="all">Wszystkie kategorie</option>
									<option value="Social Media">Social Media</option>
									<option value="Sprzęt">Sprzęt</option>
									<option value="Platformy">Platformy</option>
									<option value="Narzędzia">Narzędzia</option>
									<option value="Systemy">Systemy</option>
									<option value="Marketing">Marketing</option>
									<option value="Programowanie">Programowanie</option>
									<option value="Inne">Inne</option>
								</select>
							</div>

							<div className={styles.modal__field}>
								<label>Dodaj nowy dostęp</label>
								<div
									style={{ display: "flex", gap: "8px", position: "relative" }}
								>
									<input
										type="text"
										placeholder="Wpisz nazwę dostępu (np. Instagram)..."
										value={newAccess}
										onChange={(e) => setNewAccess(e.target.value)}
										style={{ flex: 1 }}
									/>
									<button
										className={styles.modal__btnSave}
										onClick={() => {
											if (!newAccess.trim()) {
												toast.error("Wpisz nazwę dostępu");
												return;
											}
											if (accessItems.includes(newAccess.trim())) {
												toast.error("Ten dostęp już istnieje");
												return;
											}
											setAccessItems([...accessItems, newAccess.trim()]);
											setNewAccess("");
										}}
									>
										<Plus size={16} />
										Dodaj
									</button>
								</div>
							</div>

							<div className={styles.modal__field}>
								<label>Obecne dostępy ({accessItems.length})</label>
								<div
									style={{
										display: "flex",
										flexWrap: "wrap",
										gap: "8px",
										marginTop: "8px",
									}}
								>
									{accessItems.length === 0 ? (
										<span style={{ color: "#6b7280", fontSize: "14px" }}>
											Brak przypisanych dostępów
										</span>
									) : (
										accessItems.map((item) => (
											<span key={item} className={styles.accessTag}>
												{item}
												<button
													className={styles.accessTag__remove}
													onClick={() =>
														setAccessItems(
															accessItems.filter((i) => i !== item),
														)
													}
												>
													<X size={12} />
												</button>
											</span>
										))
									)}
								</div>
							</div>

							{newAccess.trim() && (
								<div
									className={styles.accessSuggestions}
									style={{
										position: "relative",
										marginTop: "-8px",
										marginBottom: "8px",
										background: "#fff",
										border: "1px solid #e5e7eb",
										borderRadius: "8px",
										boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
										maxHeight: "200px",
										overflowY: "auto",
										zIndex: 9999,
										padding: "8px 0",
									}}
								>
									{getSuggestions(newAccess).map((item) => (
										<button
											key={item.label}
											style={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												width: "100%",
												padding: "8px 16px",
												background: "none",
												border: "none",
												fontSize: "14px",
												color: "#1f2937",
												cursor: "pointer",
												textAlign: "left",
											}}
											onMouseDown={(e) => {
												e.preventDefault();
												if (!accessItems.includes(item.label)) {
													setAccessItems([...accessItems, item.label]);
													setNewAccess("");
												}
											}}
											onMouseEnter={(e) =>
												(e.currentTarget.style.background = "#f3f4f6")
											}
											onMouseLeave={(e) =>
												(e.currentTarget.style.background = "transparent")
											}
										>
											{item.label}
											<span
												style={{
													fontSize: "11px",
													color: "#fff",
													backgroundColor:
														CATEGORY_COLORS[item.category] || "#e5e7eb",
													padding: "2px 8px",
													borderRadius: "12px",
												}}
											>
												{item.category}
											</span>
										</button>
									))}
								</div>
							)}
						</div>

						<div className={styles.modal__actions}>
							<button
								type="button"
								className={styles.modal__btnCancel}
								onClick={handleCloseEdit}
							>
								Anuluj
							</button>
							<button
								type="submit"
								className={styles.modal__btnSave}
								onClick={handleSaveEdit}
								disabled={accessItems.length === 0}
							>
								<Save size={16} />
								Zapisz zmiany
							</button>
						</div>
					</div>
				</div>
			)}

			{showAddModal && (
				<div
					className={styles.modalOverlay}
					onClick={() => setShowAddModal(false)}
				>
					<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
						<div className={styles.modal__header}>
							<h2 className={styles.modal__title}>
								{entryType === "access"
									? "Dodaj dostęp dla członka"
									: "Dodaj przedmiot"}
							</h2>
							<button className={styles.modal__close} onClick={resetModal}>
								<X size={20} />
							</button>
						</div>

						<div className={styles.modal__body}>

							<div className={styles.modal__field}>
								<label>Typ wpisu</label>
								<div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
									<label
										style={{
											display: "flex",
											alignItems: "center",
											gap: "6px",
											cursor: "pointer",
										}}
									>
										<input
											type="radio"
											value="access"
											checked={entryType === "access"}
											onChange={() => {
												setEntryType("access");
												setItemName("");
												setItemValue("");
												setItemNotes("");
											}}
										/>
										Dostęp
									</label>
									<label
										style={{
											display: "flex",
											alignItems: "center",
											gap: "6px",
											cursor: "pointer",
										}}
									>
										<input
											type="radio"
											value="item"
											checked={entryType === "item"}
											onChange={() => {
												setEntryType("item");
											}}
										/>
										Przedmiot
									</label>
								</div>
							</div>

							<div className={styles.modal__field}>
								<label>Filtruj kategorię</label>
								<select
									value={filterCategory}
									onChange={(e) => setFilterCategory(e.target.value)}
									style={{
										width: "100%",
										padding: "8px 12px",
										borderRadius: "8px",
										border: "1px solid #e5e7eb",
									}}
								>
									<option value="all">Wszystkie kategorie</option>
									<option value="Social Media">Social Media</option>
									<option value="Sprzęt">Sprzęt</option>
									<option value="Platformy">Platformy</option>
									<option value="Narzędzia">Narzędzia</option>
									<option value="Systemy">Systemy</option>
									<option value="Marketing">Marketing</option>
									<option value="Programowanie">Programowanie</option>
									<option value="Inne">Inne</option>
								</select>
							</div>

							<div className={styles.modal__field}>
								<label>Wybierz członka *</label>
								<div style={{ position: "relative" }}>
									<input
										type="text"
										placeholder="Szukaj członka po imieniu, nazwisku lub email..."
										value={getSelectedUserName()}
										onChange={(e) => {
											const value = e.target.value;
											setUserSearchInput(value);
											setSelectedUserId("");
											setShowUserSuggestions(true);
										}}
										onFocus={() => setShowUserSuggestions(true)}
									/>
									{showUserSuggestions && userSearchInput.trim() && (
										<div className={styles.accessSuggestions}>
											{getUserSuggestions(userSearchInput).map((user) => (
												<button
													key={user.id}
													className={styles.accessSuggestions__item}
													onMouseDown={(e) => {
														e.preventDefault();
														setSelectedUserId(user.id);
														setUserSearchInput(
															`${user.first_name} ${user.last_name}`,
														);
														setShowUserSuggestions(false);
													}}
												>
													{user.first_name} {user.last_name}
													<span className={styles.accessSuggestions__category}>
														{user.email}
													</span>
												</button>
											))}
										</div>
									)}
								</div>
							</div>

							{entryType === "item" && (
								<div
									className={styles.modal__itemFields}
									style={{
										border: "1px solid #e5e7eb",
										borderRadius: "8px",
										padding: "16px",
										marginTop: "12px",
										background: "#f9fafb",
									}}
								>
									<h4
										style={{
											margin: "0 0 12px 0",
											fontSize: "14px",
											fontWeight: "600",
										}}
									>
										Dane przedmiotu
									</h4>

									<div className={styles.modal__field}>
										<label>Nazwa przedmiotu *</label>
										<input
											type="text"
											placeholder="np. Kamera Sony A7III, Mikrofon Rode..."
											value={itemName}
											onChange={(e) => setItemName(e.target.value)}
											required
										/>
									</div>

									<div className={styles.modal__field}>
										<label>Wartość (PLN)</label>
										<input
											type="number"
											placeholder="np. 2500"
											value={itemValue}
											onChange={(e) => setItemValue(e.target.value)}
											min="0"
											step="0.01"
										/>
									</div>

									<div className={styles.modal__field}>
										<label>Notatki</label>
										<textarea
											placeholder="Dodatkowe informacje o przedmiocie..."
											value={itemNotes}
											onChange={(e) => setItemNotes(e.target.value)}
											rows={2}
											style={{ resize: "vertical" }}
										/>
									</div>
								</div>
							)}

							{entryType === "access" && (
								<div className={styles.modal__field}>
									<label>Nazwa dostępu *</label>
									<div style={{ position: "relative" }}>
										<input
											type="text"
											placeholder="Wpisz nazwy oddzielone przecinkami (np. Instagram, Slack, GitHub)..."
											value={newAccessForUser}
											onChange={(e) => {
												setNewAccessForUser(e.target.value);
												setShowSuggestions(true);
											}}
											onFocus={() => setShowSuggestions(true)}
											onBlur={() =>
												setTimeout(() => setShowSuggestions(false), 200)
											}
										/>

										{showSuggestions && newAccessForUser.trim() && (
											<div className={styles.accessSuggestions}>
												{getSuggestions(newAccessForUser).map((item) => {
													const parts = newAccessForUser
														.split(/[,;，、\n]+/)
														.map((s) => s.trim())
														.filter((s) => s.length > 0);

													const existingNames = parts.slice(0, -1);

													if (existingNames.includes(item.label)) return null;

													return (
														<button
															key={item.label}
															className={styles.accessSuggestions__item}
															onMouseDown={(e) => {
																e.preventDefault();

																const allParts = newAccessForUser
																	.split(/[,;，、\n]+/)
																	.map((s) => s.trim())
																	.filter((s) => s.length > 0);

																allParts.pop();
																allParts.push(item.label);

																setNewAccessForUser(allParts.join(", "));
																setShowSuggestions(false);
															}}
														>
															{item.label}
															<span
																className={styles.accessSuggestions__category}
															>
																{item.category}
															</span>
														</button>
													);
												})}
											</div>
										)}
									</div>
								</div>
							)}
						</div>

						<div className={styles.modal__actions}>
							<button
								type="button"
								className={styles.modal__btnCancel}
								onClick={resetModal}
							>
								Anuluj
							</button>
							<button
								type="submit"
								className={styles.modal__btnSave}
								onClick={handleAddAccessToUser}
								disabled={
									entryType === "access"
										? !selectedUserId || !newAccessForUser.trim()
										: !selectedUserId || !itemName.trim()
								}
							>
								<Plus size={16} />
								{entryType === "access" ? "Dodaj dostęp" : "Dodaj przedmiot"}
							</button>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}

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
function AttendanceRanking() {
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<AttendanceRankingData | null>(null);
	const [showAllModal, setShowAllModal] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [allUsersFiltered, setAllUsersFiltered] = useState<AttendanceUser[]>([]);

	const fetchRanking = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("accessToken");
			const response = await fetch("/api/admin/attendance-ranking?limit=200", {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) throw new Error("Błąd pobierania rankingu");
			const result = await response.json();
			setData(result);
			setAllUsersFiltered(result.allUsers || []);
		} catch (error) {
			logger.error("Błąd pobierania rankingu:", error);
			toast.error("Nie udało się pobrać rankingu frekwencji");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRanking();
	}, []);

	useEffect(() => {
		if (data?.allUsers) {
			const filtered = data.allUsers.filter(
				(user) =>
					user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
					user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
					user.team.toLowerCase().includes(searchTerm.toLowerCase())
			);
			setAllUsersFiltered(filtered);
		}
	}, [searchTerm, data]);

	const getAttendanceColor = (percentage: number | null) => {
		if (percentage === null || percentage === 0) return "#9ca3af";
		if (percentage >= 90) return "#059669";
		if (percentage >= 75) return "#d97706";
		if (percentage >= 50) return "#dc2626";
		return "#b91c1c";
	};

	const getAttendanceLabel = (percentage: number | null) => {
		if (percentage === null || percentage === 0) return "Brak danych";
		return `${percentage.toFixed(1)}%`;
	};

	const renderUserItem = (user: AttendanceUser, showRank = false, rank = 0) => (
		<div key={user.id} className={styles.attendanceUserItem}>
			<div className={styles.attendanceUserItem__avatar}>
				{user.first_name?.[0]}
				{user.last_name?.[0]}
			</div>
			<div className={styles.attendanceUserItem__info}>
				<span className={styles.attendanceUserItem__name}>
					{user.fullName}
					{user.is_no_data && (
						<span className={styles.attendanceUserItem__badge}>Brak danych</span>
					)}
				</span>
				<span className={styles.attendanceUserItem__details}>
					{user.functional_role} • {user.team}
				</span>
			</div>
			<div className={styles.attendanceUserItem__percentage}>
				<span
					className={styles.attendanceUserItem__value}
					style={{ color: getAttendanceColor(user.attendance_percentage) }}
				>
					{getAttendanceLabel(user.attendance_percentage)}
				</span>
				{showRank && rank <= 3 && (
					<span className={styles.attendanceUserItem__rank}>
						{rank === 1 && ""}
						{rank === 2 && ""}
						{rank === 3 && ""}
					</span>
				)}
			</div>
		</div>
	);

	const renderSection = (title: string, users: AttendanceUser[], icon?: React.ReactNode) => {
		if (!users || users.length === 0) return null;
		return (
			<div className={styles.attendanceSection}>
				<h3 className={styles.attendanceSection__title}>
					{icon} {title}
				</h3>
				<div className={styles.attendanceSection__list}>
					{users.map((user, index) => renderUserItem(user, true, index + 1))}
				</div>
			</div>
		);
	};

	if (loading) {
		return (
			<section className={styles.section}>
				<div className={styles.loading}>
					<div className={styles.loading__spinner} />
					<span>Ładowanie rankingu frekwencji...</span>
				</div>
			</section>
		);
	}

	if (!data) return null;

	return (
		<section className={styles.section}>
			<div className={styles.section__header}>
				<div className={styles.section__headerLeft}>
					<h2 className={styles.section__title}>
						<Users size={20} style={{ display: "inline", marginRight: "8px" }} />
						Ranking frekwencji
					</h2>
					<p className={styles.section__subtitle}>
						Najlepsi i najsłabiej frekwentujący członkowie organizacji.
					</p>
				</div>
				<button
					className={styles.section__refreshBtn}
					onClick={fetchRanking}
					title="Odśwież"
				>
					<RefreshCw size={16} />
				</button>
			</div>

			<div className={styles.attendanceRankingGrid}>
				{renderSection("Najwyższa frekwencja", data.topFive)}
				{renderSection("Najniższa frekwencja", data.bottomFive)}
			</div>

			{/* Brak danych */}
			{data.noDataUsers && data.noDataUsers.length > 0 && (
				<div className={styles.attendanceSection} style={{ marginTop: "16px" }}>
					<h3 className={styles.attendanceSection__title}>
						<User size={18} /> Brak danych o frekwencji ({data.noDataUsers.length} osób)
					</h3>
					<div className={styles.attendanceSection__list}>
						{data.noDataUsers.slice(0, 10).map((user) => renderUserItem(user))}
						{data.noDataUsers.length > 10 && (
							<div className={styles.attendanceSection__more}>
								+ {data.noDataUsers.length - 10} więcej
							</div>
						)}
					</div>
				</div>
			)}

			<div className={styles.attendanceActions}>
				<button
					className={styles.attendanceShowAllBtn}
					onClick={() => setShowAllModal(true)}
				>
					Pokaż wszystkich ({data.total})
				</button>
			</div>

			{/* Modal ze wszystkimi użytkownikami */}
			{showAllModal && (
				<div className={styles.modalOverlay} onClick={() => setShowAllModal(false)}>
					<div
						className={`${styles.modal} ${styles.modalLarge}`}
						onClick={(e) => e.stopPropagation()}
					>
						<div className={styles.modal__header}>
							<h2 className={styles.modal__title}>Wszyscy członkowie - frekwencja</h2>
							<button
								className={styles.modal__close}
								onClick={() => setShowAllModal(false)}
							>
								<X size={20} />
							</button>
						</div>

						<div className={styles.modal__body}>
							<div className={styles.attendanceSearch}>
								<input
									type="text"
									placeholder="Szukaj po imieniu, nazwisku, emailu lub zespole..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className={styles.attendanceSearch__input}
								/>
								{searchTerm && (
									<button
										className={styles.attendanceSearch__clear}
										onClick={() => setSearchTerm("")}
									>
										<X size={14} />
									</button>
								)}
							</div>

							<div className={styles.attendanceModalList}>
								{allUsersFiltered.length === 0 ? (
									<div className={styles.attendanceEmpty}>
										<p>Nie znaleziono użytkowników spełniających kryteria</p>
									</div>
								) : (
									allUsersFiltered.map((user) => renderUserItem(user))
								)}
							</div>

							<div className={styles.attendanceModalFooter}>
								<span>
									Wyświetlono {allUsersFiltered.length} z {data.total} użytkowników
								</span>
							</div>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
export default function Admin({ title }: { title?: string }) {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [teams, setTeams] = useState<Team[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
	const [currentUser, setCurrentUser] = useState<any>(null);
	const [scrollToTeamId, setScrollToTeamId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<string>("roles");
	const [showScrollTop, setShowScrollTop] = useState(false);

	const rolesRef = useRef<HTMLDivElement>(null);
	const teamsRef = useRef<HTMLDivElement>(null);
	const accessRef = useRef<HTMLDivElement>(null);
	const statsRef = useRef<HTMLDivElement>(null);
	const logsRef = useRef<HTMLDivElement>(null);
	const mainContainerRef = useRef<HTMLDivElement>(null);

	const scrollToSection = (
		sectionRef: React.RefObject<HTMLDivElement | null>,
		tabId: string
	) => {
		setActiveTab(tabId);

		if (sectionRef.current) {
			// scrollIntoView z offsetem za pomocą scroll-margin-top
			// Najpierw dodajemy tymczasowy styl
			const element = sectionRef.current;
			const originalMarginTop = element.style.scrollMarginTop;
			element.style.scrollMarginTop = '100px'; // <- tyle px nad sekcją

			element.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			});

			// Przywracamy oryginalny styl po chwili
			setTimeout(() => {
				element.style.scrollMarginTop = originalMarginTop || '';
			}, 500);
		}
	};

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

			if (
				profileData.role !== "admin" &&
				profileData.role !== "board" &&
				profileData.role !== "zarząd"
			) {
				safeNavigate("/dashboard", navigate);
				return;
			}

			const teamsRes = await fetch("/api/admin/teams", {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (teamsRes.ok) {
				const teamsData = await teamsRes.json();
				setTeams(teamsData);
				logger.debug("đź”Ť [Admin] Zespoły pobrane:", teamsData);
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
			logger.error("âťŚ Błąd pobierania danych:", error);
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
			logger.error("âťŚ Błąd:", error);
			toast.error("Nie udało się zaktualizować uprawnień");
			throw error;
		}
	};

	const handleTeamUpdated = (teamId: string) => {
		setScrollToTeamId(teamId);
	};

	// DODAJ - funkcja powrotu na górę
	const scrollToTop = () => {
		const mainElement = document.querySelector('main._main_xe2ra_67') as HTMLElement;
		if (mainElement) {
			mainElement.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
		}
	};
	// DODAJ - wykrywanie która sekcja jest widoczna
	// ZOSTAW ten useEffect (już masz dobry):
	useEffect(() => {
		// Znajdź element MAIN
		const mainElement = document.querySelector('main._main_xe2ra_67') as HTMLElement;
		if (!mainElement) {
			console.log("❌ Nie znaleziono elementu MAIN");
			return;
		}

		console.log("✅ Nasłuchuję na MAIN");

		const handleScroll = () => {
			const scrollTop = mainElement.scrollTop;
			console.log('📜 scrollTop MAIN:', scrollTop);
			setShowScrollTop(scrollTop > 20);
		};

		mainElement.addEventListener('scroll', handleScroll);
		handleScroll();

		return () => {
			mainElement.removeEventListener('scroll', handleScroll);
		};
	}, []);

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
			</div>
		);
	}

	if (
		!currentUser ||
		(currentUser.role !== "admin" &&
			currentUser.role !== "board" &&
			currentUser.role !== "zarząd")
	) {
		return null;
	}

	const canManage =
		currentUser?.role === "admin" ||
		currentUser?.role === "board" ||
		currentUser?.role === "zarząd";

	return (
		<>
			{/* ✅ Panel nawigacyjny - POZA kontenerem .admin */}
			<div className={styles.tabsNav}>
				<div className={styles.tabsNav__list}>
					<button
						className={`${styles.tabsNav__tab} ${activeTab === "roles" ? styles.tabsNav__tabActive : ""}`}
						onClick={() => scrollToSection(rolesRef, "roles")}
					>
						<Shield size={16} />
						Role i uprawnienia
					</button>
					<button
						className={`${styles.tabsNav__tab} ${activeTab === "teams" ? styles.tabsNav__tabActive : ""}`}
						onClick={() => scrollToSection(teamsRef, "teams")}
					>
						<Users size={16} />
						Zespoły i członkowie
					</button>
					<button
						className={`${styles.tabsNav__tab} ${activeTab === "access" ? styles.tabsNav__tabActive : ""}`}
						onClick={() => scrollToSection(accessRef, "access")}
					>
						<UserCog size={16} />
						Dostępy i zasoby
					</button>
					<button
						className={`${styles.tabsNav__tab} ${activeTab === "stats" ? styles.tabsNav__tabActive : ""}`}
						onClick={() => scrollToSection(statsRef, "stats")}
					>
						<FolderTree size={16} />
						Statystyki
					</button>
					<button
						className={`${styles.tabsNav__tab} ${activeTab === "logs" ? styles.tabsNav__tabActive : ""}`}
						onClick={() => scrollToSection(logsRef, "logs")}
					>
						<RefreshCw size={16} />
						Historia działań
					</button>
				</div>
			</div>

			{/* ✅ Główna treść */}
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

				<div style={{ marginBottom: "32px" }}>
					<RevenueChart year={2026} title="Przychody i wydatki" />
				</div>

				{/* Sekcje z przypisanymi refami */}
				<div ref={rolesRef}>
					<RolesManagement
						roles={roles}
						canManage={canManage}
						onUpdatePermissions={handleUpdatePermissions}
						onRefresh={handleRefresh}
						refreshing={refreshing}
					/>
				</div>

				<div ref={teamsRef}>
					<StructureManagement
						teams={teams}
						canManage={canManage}
						availableUsers={availableUsers}
						onRefresh={handleRefresh}
						onTeamUpdated={handleTeamUpdated}
					/>
				</div>

				<div ref={accessRef}>
					<AccessManagement />
				</div>

				<div ref={statsRef}>
					<ActivityMonitoring teams={teams} roles={roles} />
				</div>

				<AttendanceRanking />

				<div ref={logsRef}>
					<LogsManagement />
				</div>

				<button
					className={`${styles.scrollTopBtn} ${showScrollTop ? styles.visible : ''}`}
					onClick={scrollToTop}
					aria-label="Powrót na górę"
				>
					<ChevronUp size={24} />
				</button>
			</div>
		</>
	);
}