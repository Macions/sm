import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from "react";
import type { ReactNode } from "react";
import { logger } from "@/utils/logger";
import api from "@/api/axios";

export interface User {
	id: string;
	name: string;
	email?: string;
	role: "admin" | "board" | "coordinator" | "member";
	teamId?: string;
	avatar?: string;
	first_name?: string;
	last_name?: string;
	isLeader?: boolean;
}

interface AuthState {
	user: User | null;
	loading: boolean;
	isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
	login: (
		email: string,
		password: string,
	) => Promise<{ success: boolean; user?: User; error?: string }>;
	logout: () => void;
	updateUser: (data: Partial<User>) => void;
	verifyToken: () => Promise<boolean>;
	hasRole: (roles: string | string[]) => boolean;
	isAdmin: () => boolean;
	isBoard: () => boolean;
	isCoordinator: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<AuthState>({
		user: null,
		loading: true,
		isAuthenticated: false,
	});

	const verifyToken = useCallback(async () => {
		const user = localStorage.getItem("user");

		if (!user) {
			setState({ user: null, loading: false, isAuthenticated: false });
			return false;
		}

		try {
			const response = await api.get("/auth/me");
			const userData = response.data;
			console.log(
				"[AuthContext] /auth/me response:",
				response.status,
				userData,
			);
			console.log(
				"[AuthContext] accessToken:",
				localStorage.getItem("accessToken")?.slice(0, 20),
			);
			console.log(
				"[AuthContext] localStorage user:",
				localStorage.getItem("user")?.slice(0, 100),
			);
			const newUser: User = {
				id: userData.id,
				name:
					userData.first_name && userData.last_name
						? `${userData.first_name} ${userData.last_name}`
						: userData.name || userData.email || "Użytkownik",
				email: userData.email,
				role: userData.role as "admin" | "board" | "coordinator" | "member",
				teamId: userData.teamId || userData.team || undefined,
				avatar: userData.avatar,
				first_name: userData.first_name,
				last_name: userData.last_name,
			};

			try {
				const coordRes = await api.get("/user/is-coordinator");
				newUser.isLeader = coordRes.data?.isLeader === true;
			} catch {
				newUser.isLeader = false;
			}

			setState({ user: newUser, loading: false, isAuthenticated: true });
			return true;
		} catch (error: any) {
			logger.warn("[AuthContext] Token nieważny:", error?.response?.status);
			localStorage.removeItem("user");
			setState({ user: null, loading: false, isAuthenticated: false });
			return false;
		}
	}, []);

	useEffect(() => {
		verifyToken();
	}, [verifyToken]);

	const login = useCallback(async (email: string, password: string) => {
		try {
			setState((prev) => ({ ...prev, loading: true }));

			const response = await api.post("/auth/login", { email, password });
			const { user: userData } = response.data;

			const newUser: User = {
				id: userData.id,
				name:
					userData.first_name && userData.last_name
						? `${userData.first_name} ${userData.last_name}`
						: userData.name || userData.email || "Użytkownik",
				email: userData.email,
				role: userData.role as "admin" | "board" | "coordinator" | "member",
				teamId: userData.teamId || userData.team || undefined,
				avatar: userData.avatar,
				first_name: userData.first_name,
				last_name: userData.last_name,
			};

			localStorage.setItem("user", JSON.stringify(userData));

			try {
				const coordRes = await api.get("/user/is-coordinator");
				newUser.isLeader = coordRes.data?.isLeader === true;
			} catch {
				newUser.isLeader = false;
			}

			setState({ user: newUser, loading: false, isAuthenticated: true });
			return { success: true, user: newUser };
		} catch (error: any) {
			setState((prev) => ({ ...prev, loading: false }));
			return {
				success: false,
				error:
					error?.response?.data?.message || "Nieprawidłowy email lub hasło",
			};
		}
	}, []);

	const logout = useCallback(() => {
		try {
			api.post("/auth/logout").catch(() => {});
		} catch {}
		localStorage.removeItem("user");
		setState({ user: null, loading: false, isAuthenticated: false });
	}, []);

	const updateUser = useCallback((data: Partial<User>) => {
		setState((prev) => ({
			...prev,
			user: prev.user ? { ...prev.user, ...data } : null,
		}));
	}, []);

	const hasRole = useCallback(
		(roles: string | string[]) => {
			if (!state.user) return false;
			const arr = Array.isArray(roles) ? roles : [roles];
			return arr.includes(state.user.role);
		},
		[state.user],
	);

	const isAdmin = useCallback(() => state.user?.role === "admin", [state.user]);
	const isBoard = useCallback(() => state.user?.role === "board", [state.user]);
	const isCoordinator = useCallback(
		() => state.user?.role === "coordinator" || state.user?.role === "admin",
		[state.user],
	);

	return (
		<AuthContext.Provider
			value={{
				...state,
				login,
				logout,
				updateUser,
				verifyToken,
				hasRole,
				isAdmin,
				isBoard,
				isCoordinator,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within <AuthProvider>");
	}
	return ctx;
}
