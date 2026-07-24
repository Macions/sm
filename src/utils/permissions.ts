// src/utils/permissions.ts

export type UserRole = "admin" | "board" | "zarząd" | "coordinator" | "member";

// ✅ UŻYJ as const
export const PERMISSIONS = {
	admin: {
		canViewAllLeaves: true,
		canApproveLeaves: true,
		canRejectLeaves: true,
		canEditAllLeaves: true,
		canDeleteAllLeaves: true,
		canViewAllUsers: true,
		canEditUsers: true,
		canDeleteUsers: true,
		canManageProjects: true,
		canManageVacancies: true,
		canEditVacancies: true,
		canDeleteVacancies: true,
		canCreateVacancies: true,
		canViewVacancies: true,
		canApplyVacancies: true,
		canViewApplications: true,
		canEditApplications: true,
		canManageGuides: true,
		canViewAllNotifications: true,
		canManageTeams: true,
		canViewStructure: true,
		canEditProfile: true,
	},
	board: {
		canViewAllLeaves: true,
		canApproveLeaves: true,
		canRejectLeaves: true,
		canEditAllLeaves: false,
		canDeleteAllLeaves: false,
		canViewAllUsers: true,
		canEditUsers: false,
		canDeleteUsers: false,
		canManageProjects: true,
		canManageVacancies: true,
		canEditVacancies: true,
		canDeleteVacancies: false,
		canCreateVacancies: true,
		canViewVacancies: true,
		canApplyVacancies: true,
		canViewApplications: true,
		canEditApplications: true,
		canManageGuides: false,
		canViewAllNotifications: true,
		canManageTeams: false,
		canViewStructure: true,
		canEditProfile: true,
	},
	// ✅ DODAJ "zarząd" jako alias
	zarząd: {
		canViewAllLeaves: true,
		canApproveLeaves: true,
		canRejectLeaves: true,
		canEditAllLeaves: false,
		canDeleteAllLeaves: false,
		canViewAllUsers: true,
		canEditUsers: false,
		canDeleteUsers: false,
		canManageProjects: true,
		canManageVacancies: true,
		canEditVacancies: true,
		canDeleteVacancies: false,
		canCreateVacancies: true,
		canViewVacancies: true,
		canApplyVacancies: true,
		canViewApplications: true,
		canEditApplications: true,
		canManageGuides: false,
		canViewAllNotifications: true,
		canManageTeams: false,
		canViewStructure: true,
		canEditProfile: true,
	},
	coordinator: {
		canViewAllLeaves: false,
		canApproveLeaves: false,
		canRejectLeaves: false,
		canEditAllLeaves: false,
		canDeleteAllLeaves: false,
		canViewAllUsers: false,
		canEditUsers: false,
		canDeleteUsers: false,
		canManageProjects: true,
		canManageVacancies: false,
		canEditVacancies: false,
		canDeleteVacancies: false,
		canCreateVacancies: false,
		canViewVacancies: true,
		canApplyVacancies: true,
		canViewApplications: true,
		canEditApplications: false,
		canManageGuides: false,
		canViewAllNotifications: false,
		canManageTeams: false,
		canViewStructure: true,
		canEditProfile: true,
	},
	member: {
		canViewAllLeaves: false,
		canApproveLeaves: false,
		canRejectLeaves: false,
		canEditAllLeaves: false,
		canDeleteAllLeaves: false,
		canViewAllUsers: false,
		canEditUsers: false,
		canDeleteUsers: false,
		canManageProjects: false,
		canManageVacancies: false,
		canEditVacancies: false,
		canDeleteVacancies: false,
		canCreateVacancies: false,
		canViewVacancies: true,
		canApplyVacancies: true,
		canViewApplications: true,
		canEditApplications: false,
		canManageGuides: false,
		canViewAllNotifications: false,
		canManageTeams: false,
		canViewStructure: true,
		canEditProfile: true,
	},
} as const;

// ✅ POPRAWNIEJ - użyj typeof
export type Permission = keyof typeof PERMISSIONS.admin;

// Funkcja pomocnicza do sprawdzania uprawnień
export function hasPermission(
	role: UserRole | string | undefined,
	permission: Permission,
): boolean {
	if (!role) return false;

	// ✅ Obsługa "zarząd" jako alias dla "board"
	let roleKey = role as UserRole;
	if (roleKey === "zarząd") {
		roleKey = "board" as UserRole;
	}

	const rolePermissions = PERMISSIONS[roleKey];
	if (!rolePermissions) return false;

	return rolePermissions[permission] || false;
}

// ============================================================
// ✅ DODAJ TE EKSPORTY - są potrzebne w innych plikach
// ============================================================

// Funkcja do sprawdzania czy użytkownik może zarządzać wnioskami urlopowymi
export function canManageLeaves(role: UserRole | string | undefined): boolean {
	return (
		hasPermission(role, "canApproveLeaves") ||
		hasPermission(role, "canRejectLeaves")
	);
}

// Funkcja do sprawdzania czy użytkownik może widzieć wszystkie wnioski
export function canViewAllLeaves(role: UserRole | string | undefined): boolean {
	return hasPermission(role, "canViewAllLeaves");
}

// Funkcja do sprawdzania czy użytkownik może zarządzać użytkownikami
export function canManageUsers(role: UserRole | string | undefined): boolean {
	return (
		hasPermission(role, "canViewAllUsers") ||
		hasPermission(role, "canEditUsers")
	);
}

// Funkcja do sprawdzania czy użytkownik może zarządzać projektami
export function canManageProjects(
	role: UserRole | string | undefined,
): boolean {
	return hasPermission(role, "canManageProjects");
}

// ✅ DODAJ FUNKCJE DLA WAKATÓW
export function canManageVacancies(
	role: UserRole | string | undefined,
): boolean {
	return (
		hasPermission(role, "canEditVacancies") ||
		hasPermission(role, "canDeleteVacancies") ||
		hasPermission(role, "canCreateVacancies")
	);
}

export function canViewVacancies(role: UserRole | string | undefined): boolean {
	return hasPermission(role, "canViewVacancies");
}

export function canApplyVacancies(
	role: UserRole | string | undefined,
): boolean {
	return hasPermission(role, "canApplyVacancies");
}

export function canViewApplications(
	role: UserRole | string | undefined,
): boolean {
	return hasPermission(role, "canViewApplications");
}

// Funkcja do sprawdzania czy użytkownik może zarządzać poradnikami
export function canManageGuides(role: UserRole | string | undefined): boolean {
	return hasPermission(role, "canManageGuides");
}

// Funkcja do sprawdzania czy użytkownik może zarządzać zespołami
export function canManageTeams(role: UserRole | string | undefined): boolean {
	return hasPermission(role, "canManageTeams");
}

// Funkcja do sprawdzania czy użytkownik może widzieć strukturę
export function canViewStructure(role: UserRole | string | undefined): boolean {
	return hasPermission(role, "canViewStructure");
}
