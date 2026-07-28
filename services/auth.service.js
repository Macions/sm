"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
// frontend/src/services/auth.service.ts
const api_1 = __importDefault(require("./api"));
class AuthService {
    // Logowanie
    async login(credentials) {
        try {
            const response = await api_1.default.post('/api/auth/login', credentials);
            const data = response.data;
            // Zapisz tokeny
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        }
        catch (error) {
            console.error('❌ Błąd logowania:', error);
            throw error;
        }
    }
    // Rejestracja
    async register(data) {
        try {
            const response = await api_1.default.post('/api/auth/register', data);
            return response.data;
        }
        catch (error) {
            console.error('❌ Błąd rejestracji:', error);
            throw error;
        }
    }
    // Wylogowanie
    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
    // Pobierz zalogowanego użytkownika
    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
    // Sprawdź czy użytkownik jest zalogowany
    isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    }
    // Odśwież token
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('Brak tokena odświeżania');
            }
            const response = await api_1.default.post('/api/auth/refresh', { refreshToken });
            const newToken = response.data.accessToken;
            localStorage.setItem('accessToken', newToken);
            return newToken;
        }
        catch (error) {
            console.error('❌ Błąd odświeżania tokena:', error);
            this.logout();
            throw error;
        }
    }
}
exports.authService = new AuthService();
