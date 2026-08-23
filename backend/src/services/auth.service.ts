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
	private readonly TOKEN_KEY = "accessToken";
	private readonly REFRESH_TOKEN_KEY = "refreshToken";
	private readonly USER_KEY = "user";

	async login(credentials: LoginCredentials): Promise<AuthResponse> {
		try {
			logger.debug("🔐 [AuthService] Próba logowania dla:", credentials.email);

			const response = await api.post("/api/auth/login", credentials);
			const data = response.data;


			this.setTokens(data.accessToken, data.refreshToken);
			this.setUser(data.user);

			logger.debug("✅ [AuthService] Zalogowano pomyślnie:", data.user.email);
			return data;
		} catch (error: any) {
			const errorMessage =
				error?.response?.data?.message || error.message || "Błąd logowania";
			logger.error("❌ [AuthService] Błąd logowania:", errorMessage);


			this.clearAuthData();
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


			const refreshToken = this.getRefreshToken();
			if (refreshToken) {
				await api.post("/api/auth/logout", { refreshToken }).catch(() => {

				});
			}
		} catch (error) {

		} finally {

			this.clearAuthData();
			logger.debug("✅ [AuthService] Wylogowano pomyślnie");
		}
	}

	async refreshToken(): Promise<string> {
		try {
			const refreshToken = this.getRefreshToken();
			if (!refreshToken) {
				throw new Error("Brak tokena odświeżania");
			}

			logger.debug("🔄 [AuthService] Odświeżanie tokena...");

			const response = await api.post<RefreshTokenResponse>(
				"/api/auth/refresh",
				{ refreshToken },
			);
			const newToken = response.data.accessToken;

			if (!newToken) {
				throw new Error("Brak nowego tokena w odpowiedzi");
			}

			localStorage.setItem(this.TOKEN_KEY, newToken);
			logger.debug("✅ [AuthService] Token odświeżony pomyślnie");
			return newToken;
		} catch (error: any) {
			const errorMessage =
				error?.response?.data?.message ||
				error.message ||
				"Błąd odświeżania tokena";
			logger.error("❌ [AuthService] Błąd odświeżania tokena:", errorMessage);


			this.clearAuthData();
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

	getAccessToken(): string | null {
		return localStorage.getItem(this.TOKEN_KEY);
	}

	getRefreshToken(): string | null {
		return localStorage.getItem(this.REFRESH_TOKEN_KEY);
	}

	isAuthenticated(): boolean {
		const token = this.getAccessToken();
		if (!token) return false;


		try {
			const payload = JSON.parse(atob(token.split(".")[1]));
			const exp = payload.exp * 1000;
			return Date.now() < exp;
		} catch {

			return false;
		}
	}

	isTokenExpired(): boolean {
		const token = this.getAccessToken();
		if (!token) return true;

		try {
			const payload = JSON.parse(atob(token.split(".")[1]));
			const exp = payload.exp * 1000;
			return Date.now() >= exp;
		} catch {
			return true;
		}
	}

	getTokenExpiryTime(): number | null {
		const token = this.getAccessToken();
		if (!token) return null;

		try {
			const payload = JSON.parse(atob(token.split(".")[1]));
			return payload.exp * 1000; 
		} catch {
			return null;
		}
	}


	private setTokens(accessToken: string, refreshToken: string): void {
		localStorage.setItem(this.TOKEN_KEY, accessToken);
		localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
	}

	private setUser(user: AuthResponse["user"]): void {
		localStorage.setItem(this.USER_KEY, JSON.stringify(user));
	}

	private clearAuthData(): void {
		localStorage.removeItem(this.TOKEN_KEY);
		localStorage.removeItem(this.REFRESH_TOKEN_KEY);
		localStorage.removeItem(this.USER_KEY);
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


	setupAutoRefresh(): () => void {
		let timeoutId: NodeJS.Timeout | null = null;

		const scheduleRefresh = () => {
			const expiryTime = this.getTokenExpiryTime();
			if (!expiryTime) return;


			const timeToExpiry = expiryTime - Date.now() - 60000;

			if (timeToExpiry > 0) {
				timeoutId = setTimeout(async () => {
					try {
						logger.debug("🔄 [AuthService] Automatyczne odświeżanie tokena...");
						await this.refreshToken();
					} catch (error) {
						logger.warn(
							"❌ [AuthService] Automatyczne odświeżanie nie powiodło się",
						);
					}
				}, timeToExpiry);
			}
		};

		scheduleRefresh();


		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		};
	}
}

export const authService = new AuthService();
