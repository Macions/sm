export interface User {
    id: string;
    email: string;
    name: string;
    role: "admin" | "coordinator" | "member";
    teamId?: string;
    avatar?: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}
