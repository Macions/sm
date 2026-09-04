import api from "./api";
import { logger } from "../utils/logger";

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface RegisterData {
	email: string;
	password: string;
	first_name: string;
	last_name: string;
	username?: string;
}

export interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	user: {
		id: string;
		email: string;
		first_name: string;
		last_name: string;
		role: string;
		team: string | null;
		status: string;
		avatar?: string;
	};
	onboardingCompleted: boolean;
}

export interface RefreshTokenResponse {
	accessToken: string;
}

class AuthService {
	private readonly USER_KEY = "user";

	async login(credentials: LoginCredentials): Promise<AuthResponse> {
		try {
			logger.debug("🔐 [AuthService] Próba logowania dla:", credentials.email);

			const response = await api.post("/api/auth/login", credentials);
			const data = response.data;

			this.setUser(data.user);

			logger.debug("✅ [AuthService] Zalogowano pomyślnie:", data.user.email);
			return data;
		} catch (error: any) {
			const errorMessage =
				error?.response?.data?.message || error.message || "Błąd logowania";
			logger.error("❌ [AuthService] Błąd logowania:", errorMessage);

			localStorage.removeItem(this.USER_KEY);
			throw new Error(errorMessage);
		}
	}

	async register(data: RegisterData): Promise<any> {
		try {
			logger.debug("📝 [AuthService] Próba rejestracji dla:", data.email);

			const response = await api.post("/api/auth/register", data);

			logger.debug("✅ [AuthService] Zarejestrowano pomyślnie:", data.email);
			return response.data;
		} catch (error: any) {
			const errorMessage =
				error?.response?.data?.message || error.message || "Błąd rejestracji";
			logger.error("❌ [AuthService] Błąd rejestracji:", errorMessage);
			throw new Error(errorMessage);
		}
	}

	async logout(): Promise<void> {
		try {
			logger.debug("🔐 [AuthService] Wylogowywanie...");
			await api.post("/api/auth/logout").catch(() => {});
		} catch (error) {
		} finally {
			localStorage.removeItem(this.USER_KEY);
			logger.debug("✅ [AuthService] Wylogowano pomyślnie");
		}
	}

	async refreshToken(): Promise<string> {
		try {
			logger.debug("🔄 [AuthService] Odświeżanie tokena...");

			const response = await api.post<RefreshTokenResponse>(
				"/api/auth/refresh",
				{},
			);
			const newToken = response.data.accessToken;

			if (!newToken) {
				throw new Error("Brak nowego tokena w odpowiedzi");
			}

			logger.debug("✅ [AuthService] Token odświeżony pomyślnie");
			return newToken;
		} catch (error: any) {
			const errorMessage =
				error?.response?.data?.message ||
				error.message ||
				"Błąd odświeżania tokena";
			logger.error("❌ [AuthService] Błąd odświeżania tokena:", errorMessage);

			localStorage.removeItem(this.USER_KEY);
			throw new Error(errorMessage);
		}
	}

	getCurrentUser(): AuthResponse["user"] | null {
		try {
			const userStr = localStorage.getItem(this.USER_KEY);
			if (userStr) {
				return JSON.parse(userStr);
			}
			return null;
		} catch (error) {
			logger.error("❌ [AuthService] Błąd parsowania użytkownika:", error);
			return null;
		}
	}

	isAuthenticated(): boolean {
		return !!this.getCurrentUser();
	}

	private setUser(user: AuthResponse["user"]): void {
		localStorage.setItem(this.USER_KEY, JSON.stringify(user));
	}

	updateUser(userData: Partial<AuthResponse["user"]>): void {
		const currentUser = this.getCurrentUser();
		if (currentUser) {
			const updatedUser = { ...currentUser, ...userData };
			localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
			logger.debug("✅ [AuthService] Zaktualizowano dane użytkownika");
		}
	}

	hasRole(role: string | string[]): boolean {
		const user = this.getCurrentUser();
		if (!user) return false;

		const roles = Array.isArray(role) ? role : [role];
		return roles.includes(user.role);
	}

	isAdmin(): boolean {
		return this.hasRole("admin");
	}

	isCoordinator(): boolean {
		return this.hasRole(["admin", "coordinator"]);
	}
}

export const authService = new AuthService();
