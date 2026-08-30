import { useState, useEffect, useCallback } from "react";
import { logger } from "@/utils/logger";
import api from "@/api/axios";

export interface User {
	id: string;
	name: string;
	email?: string;
	role: "admin" | "coordinator" | "member";
	teamId?: string;
	avatar?: string;
	first_name?: string;
	last_name?: string;
}

interface AuthState {
	user: User | null;
	loading: boolean;
	isAuthenticated: boolean;
}

export function useAuth() {
	const [state, setState] = useState<AuthState>({
		user: null,
		loading: true,
		isAuthenticated: false,
	});

	const verifyToken = useCallback(async () => {
		const user = localStorage.getItem("user");

		if (!user) {
			logger.debug("🔐 [useAuth] Brak użytkownika");
			setState({
				user: null,
				loading: false,
				isAuthenticated: false,
			});
			return false;
		}

		try {
			logger.debug("🔐 [useAuth] Weryfikacja tokena...");

			const response = await api.get("/auth/me");
			const userData = response.data;

			const user: User = {
				id: userData.id,
				name:
					userData.first_name && userData.last_name
						? `${userData.first_name} ${userData.last_name}`
						: userData.name || userData.email || "Użytkownik",
				email: userData.email,
				role: userData.role as "admin" | "coordinator" | "member",
				teamId: userData.teamId || userData.team || undefined,
				avatar: userData.avatar,
				first_name: userData.first_name,
				last_name: userData.last_name,
			};

			setState({
				user,
				loading: false,
				isAuthenticated: true,
			});

			logger.debug("✅ [useAuth] Użytkownik zalogowany:", user.name);
			return true;
		} catch (error: any) {
			logger.warn(
				"❌ [useAuth] Token wygasł lub jest nieprawidłowy",
				error?.response?.status,
			);

			localStorage.removeItem("user");

			setState({
				user: null,
				loading: false,
				isAuthenticated: false,
			});
			return false;
		}
	}, []);

	useEffect(() => {
		const loadUser = async () => {
			await verifyToken();
		};

		loadUser();
	}, [verifyToken]);

	const login = useCallback(async (email: string, password: string) => {
		try {
			setState((prev) => ({ ...prev, loading: true }));
			logger.debug("🔐 [useAuth] Próba logowania...");

			const response = await api.post("/auth/login", { email, password });
			const { user: userData } = response.data;

			const user: User = {
				id: userData.id,
				name:
					userData.first_name && userData.last_name
						? `${userData.first_name} ${userData.last_name}`
						: userData.name || userData.email || "Użytkownik",
				email: userData.email,
				role: userData.role as "admin" | "coordinator" | "member",
				teamId: userData.teamId || userData.team || undefined,
				avatar: userData.avatar,
				first_name: userData.first_name,
				last_name: userData.last_name,
			};

			localStorage.setItem("user", JSON.stringify(userData));

			setState({
				user,
				loading: false,
				isAuthenticated: true,
			});

			logger.debug("✅ [useAuth] Zalogowano pomyślnie:", user.name);
			return { success: true, user };
		} catch (error: any) {
			logger.error(
				"❌ [useAuth] Błąd logowania:",
				error?.response?.data?.message || error.message,
			);

			setState((prev) => ({ ...prev, loading: false }));
			return {
				success: false,
				error:
					error?.response?.data?.message || "Nieprawidłowy email lub hasło",
			};
		}
	}, []);

	const logout = useCallback(() => {
		logger.debug("🔐 [useAuth] Wylogowywanie...");

		try {
			api.post("/auth/logout").catch(() => { });
		} catch (error) { }

		localStorage.removeItem("user");

		setState({
			user: null,
			loading: false,
			isAuthenticated: false,
		});

		logger.debug("✅ [useAuth] Wylogowano pomyślnie");
	}, []);

	const updateUser = useCallback((updatedData: Partial<User>) => {
		setState((prev) => ({
			...prev,
			user: prev.user ? { ...prev.user, ...updatedData } : null,
		}));
	}, []);

	const hasRole = useCallback(
		(roles: string | string[]) => {
			if (!state.user) return false;

			const roleArray = Array.isArray(roles) ? roles : [roles];
			return roleArray.includes(state.user.role);
		},
		[state.user],
	);

	const isAdmin = useCallback(() => {
		return state.user?.role === "admin";
	}, [state.user]);

	const isCoordinator = useCallback(() => {
		return state.user?.role === "coordinator" || state.user?.role === "admin";
	}, [state.user]);

	return {
		user: state.user,
		loading: state.loading,
		isAuthenticated: state.isAuthenticated,

		login,
		logout,
		updateUser,
		verifyToken,

		hasRole,
		isAdmin,
		isCoordinator,
	};
}