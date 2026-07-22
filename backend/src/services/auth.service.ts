// frontend/src/services/auth.service.ts
import api from './api';

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
    };
    onboardingCompleted: boolean;
}

class AuthService {
    // Logowanie
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await api.post('/api/auth/login', credentials);
            const data = response.data;

            // Zapisz tokeny
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));

            return data;
        } catch (error) {
            console.error('❌ Błąd logowania:', error);
            throw error;
        }
    }

    // Rejestracja
    async register(data: RegisterData): Promise<any> {
        try {
            const response = await api.post('/api/auth/register', data);
            return response.data;
        } catch (error) {
            console.error('❌ Błąd rejestracji:', error);
            throw error;
        }
    }

    // Wylogowanie
    logout(): void {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    // Pobierz zalogowanego użytkownika
    getCurrentUser(): AuthResponse['user'] | null {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    // Sprawdź czy użytkownik jest zalogowany
    isAuthenticated(): boolean {
        return !!localStorage.getItem('accessToken');
    }

    // Odśwież token
    async refreshToken(): Promise<string> {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('Brak tokena odświeżania');
            }

            const response = await api.post('/api/auth/refresh', { refreshToken });
            const newToken = response.data.accessToken;
            localStorage.setItem('accessToken', newToken);
            return newToken;
        } catch (error) {
            console.error('❌ Błąd odświeżania tokena:', error);
            this.logout();
            throw error;
        }
    }
}

export const authService = new AuthService();