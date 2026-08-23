export type UserRole =
	| "admin"
	| "board"
	| "zarząd"
	| "coordinator"
	| "functional"
	| "member";
import { logger } from "@/utils/logger";
export type Permission =
	| "canViewAllLeaves"
	| "canApproveLeaves"
	| "canRejectLeaves"
	| "canEditAllLeaves"
	| "canDeleteAllLeaves"
	| "canViewAllUsers"
	| "canEditUsers"
	| "canDeleteUsers"
	| "canManageProjects"
	| "canManageVacancies"
	| "canEditVacancies"
	| "canDeleteVacancies"
	| "canCreateVacancies"
	| "canViewVacancies"
	| "canApplyVacancies"
	| "canViewApplications"
	| "canEditApplications"
	| "canManageGuides"
	| "canViewAllNotifications"
	| "canManageTeams"
	| "canViewStructure"
	| "canEditProfile"
	| "canManageAllProjects" 
	| "canManagePillarProjects" 
	| "canManagePillarIdeas";

export const PERMISSION_LABELS: Record<Permission, string> = {
	canViewAllLeaves: "Podgląd wszystkich urlopów",
	canApproveLeaves: "Akceptowanie urlopów",
	canRejectLeaves: "Odrzucanie urlopów",
	canEditAllLeaves: "Edycja wszystkich urlopów",
	canDeleteAllLeaves: "Usuwanie wszystkich urlopów",
	canViewAllUsers: "Podgląd wszystkich użytkowników",
	canEditUsers: "Edycja użytkowników",
	canDeleteUsers: "Usuwanie użytkowników",
	canManageProjects: "Zarządzanie projektami",
	canManageVacancies: "Zarządzanie wakatami",
	canEditVacancies: "Edycja wakatów",
	canDeleteVacancies: "Usuwanie wakatów",
	canCreateVacancies: "Tworzenie wakatów",
	canViewVacancies: "Podgląd wakatów",
	canApplyVacancies: "Aplikowanie na wakaty",
	canViewApplications: "Podgląd aplikacji",
	canEditApplications: "Edycja aplikacji",
	canManageGuides: "Zarządzanie poradnikami",
	canViewAllNotifications: "Podgląd wszystkich powiadomień",
	canManageTeams: "Zarządzanie zespołami",
	canViewStructure: "Podgląd struktury",
	canEditProfile: "Edycja profilu",
	canManageAllProjects: "Zarządzanie wszystkimi projektami",
	canManagePillarProjects: "Zarządzanie projektami w swoim filarze",
	canManagePillarIdeas: "Zarządzanie pomysłami w swoim filarze",
};

export const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
	admin: [
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
		"canManageAllProjects",
		"canManagePillarProjects",
		"canManagePillarIdeas",
	],
	board: [
		"canViewAllLeaves",
		"canApproveLeaves",
		"canRejectLeaves",
		"canViewAllUsers",
		"canEditUsers",
		"canApproveLeaves",   
		"canRejectLeaves",
		"canDeleteAllLeaves",   
		"canEditAllLeaves",
		"canDeleteUsers",
		"canManageProjects",
		"canManageVacancies",
		"canEditVacancies",
		"canCreateVacancies",
		"canViewVacancies",
		"canApplyVacancies",
		"canViewApplications",
		"canEditApplications",
		"canViewAllNotifications",
		"canViewStructure",
		"canEditProfile",
		"canManageAllProjects",
		"canManagePillarProjects",
	],
	zarząd: [
		"canViewAllLeaves",
		"canApproveLeaves",
		"canRejectLeaves",
		"canViewAllUsers",
		"canManageProjects",
		"canManageVacancies",
		"canEditVacancies",
		"canCreateVacancies",
		"canViewVacancies",
		"canApplyVacancies",
		"canViewApplications",
		"canEditApplications",
		"canViewAllNotifications",
		"canViewStructure",
		"canEditProfile",
		"canManageAllProjects",
		"canManagePillarProjects",
	],
	coordinator: [
		"canManageProjects",
		"canViewVacancies",
		"canApplyVacancies",
		"canViewApplications",
		"canViewStructure",
		"canEditProfile",
		"canManagePillarProjects",
		"canManagePillarIdeas",
	],
	functional: [
		"canViewVacancies",
		"canApplyVacancies",
		"canViewApplications",
		"canViewStructure",
		"canEditProfile",
		"canManagePillarProjects",
		"canManagePillarIdeas",
	],
	member: [
		"canViewVacancies",
		"canApplyVacancies",
		"canViewApplications",
		"canViewStructure",
		"canEditProfile",
	],
};

let permissionsCache: Record<string, Permission[]> = {};

export function clearPermissionsCache(): void {
	permissionsCache = {};
}

export async function fetchPermissions(role: string): Promise<Permission[]> {
	logger.debug(
		`🔍 [fetchPermissions] Pobieranie uprawnień dla roli: "${role}"`,
	);

	try {
		const token = localStorage.getItem("accessToken");
		logger.debug(
			`🔍 [fetchPermissions] Token: ${token ? "Jest ✅" : "Brak ❌"}`,
		);

		const url = `/api/admin/permissions/${role}`;
		logger.debug(`🔍 [fetchPermissions] URL: ${url}`);

		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		});

		logger.debug(`🔍 [fetchPermissions] Status odpowiedzi: ${response.status}`);

		if (!response.ok) {
			const errorText = await response.text();
			logger.error(
				`❌ [fetchPermissions] Błąd: ${response.status} - ${errorText}`,
			);
			throw new Error("Błąd pobierania uprawnień");
		}

		const data = await response.json();
		logger.debug(
			`🔍 [fetchPermissions] Otrzymane dane:`,
			JSON.stringify(data, null, 2),
		);

		const permissions =
			data.permissions || DEFAULT_PERMISSIONS[role as UserRole] || [];
		logger.debug(`🔍 [fetchPermissions] Zwracane uprawnienia:`, permissions);

		return permissions;
	} catch (error) {
		logger.error("❌ [fetchPermissions] Błąd pobierania uprawnień:", error);
		const fallback = DEFAULT_PERMISSIONS[role as UserRole] || [];
		logger.debug(`🔍 [fetchPermissions] Używam fallback:`, fallback);
		return fallback;
	}
}

export async function getCachedPermissions(
	role: string,
): Promise<Permission[]> {
	if (permissionsCache[role]) {
		return permissionsCache[role];
	}
	const permissions = await fetchPermissions(role);
	permissionsCache[role] = permissions;
	return permissions;
}

export function hasPermission(
	role: string | undefined,
	permission: Permission,
): boolean {
	if (!role) return false;

	const permissions = permissionsCache[role];
	if (permissions) {
		return permissions.includes(permission);
	}

	const defaultPerms = DEFAULT_PERMISSIONS[role as UserRole];
	if (defaultPerms) {
		permissionsCache[role] = defaultPerms;
		return defaultPerms.includes(permission);
	}

	return false;
}

export function getPermissionsSync(role: string): Permission[] {
	return permissionsCache[role] || [];
}

export async function canManageLeaves(
	role: string | undefined,
): Promise<boolean> {
	if (!role) return false;
	const permissions = await getCachedPermissions(role);
	return (
		permissions.includes("canApproveLeaves") ||
		permissions.includes("canRejectLeaves")
	);
}

export async function canViewAllLeaves(
	role: string | undefined,
): Promise<boolean> {
	if (!role) return false;
	const permissions = await getCachedPermissions(role);
	return permissions.includes("canViewAllLeaves");
}

export async function canManageUsers(
	role: string | undefined,
): Promise<boolean> {
	if (!role) return false;
	const permissions = await getCachedPermissions(role);
	return (
		permissions.includes("canViewAllUsers") ||
		permissions.includes("canEditUsers")
	);
}

export async function canManageProjects(
	role: string | undefined,
): Promise<boolean> {
	if (!role) return false;
	const permissions = await getCachedPermissions(role);
	return permissions.includes("canManageProjects");
}

export async function canManageVacancies(
	role: string | undefined,
): Promise<boolean> {
	if (!role) return false;
	const permissions = await getCachedPermissions(role);
	return (
		permissions.includes("canEditVacancies") ||
		permissions.includes("canDeleteVacancies") ||
		permissions.includes("canCreateVacancies")
	);
}

export async function canViewVacancies(
	role: string | undefined,
): Promise<boolean> {
	if (!role) return false;
	const permissions = await getCachedPermissions(role);
	return permissions.includes("canViewVacancies");
}

export async function canApplyVacancies(
	role: string | undefined,
): Promise<boolean> {
	if (!role) return false;
	const permissions = await getCachedPermissions(role);
	return permissions.includes("canApplyVacancies");
}

export async function canViewApplications(
	role: string | undefined,
): Promise<boolean> {
	if (!role) return false;
	const permissions = await getCachedPermissions(role);
	return permissions.includes("canViewApplications");
}

export async function canManageGuides(
	role: string | undefined,
): Promise<boolean> {
	if (!role) return false;
	const permissions = await getCachedPermissions(role);
	return permissions.includes("canManageGuides");
}

export async function canManageTeams(
	role: string | undefined,
): Promise<boolean> {
	if (!role) return false;
	const permissions = await getCachedPermissions(role);
	return permissions.includes("canManageTeams");
}

export async function canViewStructure(
	role: string | undefined,
): Promise<boolean> {
	if (!role) return false;
	const permissions = await getCachedPermissions(role);
	return permissions.includes("canViewStructure");
}

export async function updateRolePermissions(
	roleId: string,
	permissions: Permission[],
): Promise<boolean> {
	try {
		const token = localStorage.getItem("accessToken");
		const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
			method: "PUT",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ permissions }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Błąd aktualizacji uprawnień");
		}

		clearPermissionsCache();
		return true;
	} catch (error) {
		logger.error("❌ Błąd aktualizacji uprawnień:", error);
		return false;
	}
}
export function isAdminOrBoard(role: string | undefined): boolean {
	if (!role) return false;
	return role === "admin" || role === "board" || role === "zarząd";
}

export function isCoordinator(
	role: string | undefined,
	isLeader?: boolean,
): boolean {
	if (!role) return false;

	if (role === "admin" || role === "board" || role === "zarząd") return true;

	return role === "coordinator" || isLeader === true;
}
