// frontend/src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

export interface User {
    id: string;
    name: string;
    role: 'admin' | 'coordinator' | 'member';
    teamId?: string;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const currentUser = authService.getCurrentUser();
                if (currentUser) {
                    setUser({
                        id: currentUser.id,
                        name: `${currentUser.first_name} ${currentUser.last_name}`,
                        role: currentUser.role as 'admin' | 'coordinator' | 'member',
                        teamId: currentUser.team || undefined,
                    });
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('Błąd ładowania użytkownika:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    return { user, loading, isAuthenticated, logout };
}