"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// frontend/src/services/api.ts
const axios_1 = __importDefault(require("axios"));
// URL backendu - zmień na swój adres
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const api = axios_1.default.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});
// Interceptor dla tokenu JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
// Interceptor dla odpowiedzi - obsługa błędów
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    // Obsługa błędów autoryzacji
    if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Przekieruj do logowania
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
exports.default = api;
