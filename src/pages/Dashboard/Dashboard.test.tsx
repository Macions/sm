
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';





const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('@/context/UserContext', () => ({
    useUser: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
    Toaster: () => null,
}));





const mockUser = (overrides = {}) => ({
    id: 1,
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: 'jan@test.pl',
    role: 'member',
    status: 'active',
    team: 'Filar Projektowy',
    pillars: 'Konferencyjny, Projektowy',
    joinDate: '2023-01-15',
    isTrial: false,
    ...overrides,
});

const mockStats = {
    members: 42,
    projects: 8,
    attendance: '92%',
    announcements: 3,
    newGuides: 2,
};

const mockContributions = {
    hasContributions: true,
    currentMonth: {
        status: 'paid',
        amount: 30,
        monthName: 'Styczeń',
        month: 1,
        year: 2025,
        monthsPaid: 1,
    },
    summary: {
        overdueMonths: 0,
        totalPaid: 360,
        totalContributions: 12,
    },
    history: [],
};

const mockNotifications = [
    { id: '1', message: 'Nowy wniosek urlopowy', type: 'info', time: '2 min temu' },
    { id: '2', message: 'Projekt zakończony', type: 'success', time: '1 godz temu' },
];





describe('Dashboard', () => {
    let useUserMock: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        mockNavigate.mockClear();

        globalThis.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('/api/auth/onboarding-status')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ completed: true }),
                });
            }
            if (url.includes('/api/dashboard/stats')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockStats),
                });
            }
            if (url.includes('/api/dashboard/contributions')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockContributions),
                });
            }
            if (url.includes('/api/dashboard/notifications')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockNotifications),
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        localStorage.setItem('accessToken', 'fake-token');

        const { useUser } = await import('@/context/UserContext');
        useUserMock = useUser;
        useUserMock.mockReturnValue({
            user: mockUser(),
            loading: false,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });





    it('powinien wyświetlić powitanie', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Dzień dobry, Jan!/i)).toBeInTheDocument();
        });
    });

    it('powinien wyświetlić rolę użytkownika', async () => {
        useUserMock.mockReturnValue({
            user: mockUser({ role: 'admin' }),
            loading: false,
        });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Administrator')).toBeInTheDocument();
        });
    });

    it('powinien wyświetlić status', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Aktywny')).toBeInTheDocument();
        });
    });





    it('powinien wyświetlić statystyki', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('42')).toBeInTheDocument();
            expect(screen.getByText('8')).toBeInTheDocument();
            expect(screen.getByText('92%')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
        });
    });

    it('powinien wyświetlić składki', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Składka Styczeń 2025/i)).toBeInTheDocument();
            expect(screen.getByText('30.00 zł')).toBeInTheDocument();
        });
    });





    it('powinien wyświetlić powiadomienia', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Nowy wniosek urlopowy')).toBeInTheDocument();
            expect(screen.getByText('Projekt zakończony')).toBeInTheDocument();
        });
    });

    it('powinien wyświetlić "Brak powiadomień"', async () => {
        globalThis.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('/api/dashboard/notifications')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
            }
            if (url.includes('/api/dashboard/stats')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStats) });
            }
            if (url.includes('/api/dashboard/contributions')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve(mockContributions) });
            }
            if (url.includes('/api/auth/onboarding-status')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ completed: true }) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Brak nowych powiadomień')).toBeInTheDocument();
        });
    });





    it('powinien wyświetlić szybkie akcje', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Projekty')).toBeInTheDocument();
            expect(screen.getByText('Zgłoś urlop')).toBeInTheDocument();
            expect(screen.getByText('Wyszukaj członka')).toBeInTheDocument();
            expect(screen.getByText('Przeglądaj poradniki')).toBeInTheDocument();
        });
    });

    it('nie powinien wyświetlać "Dodaj projekt" dla członka', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText('Dodaj projekt')).not.toBeInTheDocument();
        });
    });

    it('powinien wyświetlić "Dodaj projekt" dla admina', async () => {
        useUserMock.mockReturnValue({
            user: mockUser({ role: 'admin' }),
            loading: false,
        });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Dodaj projekt')).toBeInTheDocument();
        });
    });





    it('powinien wyświetlić błąd gdy API zawiedzie', async () => {
        globalThis.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('/api/dashboard/stats')) {
                return Promise.reject(new Error('Błąd serwera'));
            }
            if (url.includes('/api/auth/onboarding-status')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ completed: true }) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Wystąpił błąd')).toBeInTheDocument();
            expect(screen.getByText('Nie udało się pobrać statystyk')).toBeInTheDocument();
        });
    });





    it.skip('powinien przekierować do onboardingu jeśli nie jest ukończony', async () => {
        globalThis.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('/api/auth/onboarding-status')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ completed: false }),
                });
            }
            if (url.includes('/api/dashboard/stats')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockStats),
                });
            }
            if (url.includes('/api/dashboard/contributions')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockContributions),
                });
            }
            if (url.includes('/api/dashboard/notifications')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockNotifications),
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );


        await waitFor(() => {
            expect(screen.queryByText(/Dzień dobry/i)).not.toBeInTheDocument();
        });


        expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
    });

    it('nie powinien przekierować jeśli onboarding ukończony', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(mockNavigate).not.toHaveBeenCalledWith('/onboarding');
        });
    });





    it('powinien wyświetlić filary użytkownika', async () => {
        useUserMock.mockReturnValue({
            user: mockUser({
                pillars: 'Konferencyjny, Projektowy',
                team: 'Filar Konferencyjny' 
            }),
            loading: false,
        });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {

            expect(screen.getByText('Filar Konferencyjny')).toBeInTheDocument();
        });
    });

    it('powinien wyświetlić "Zarząd / Administracja" dla admina', async () => {
        useUserMock.mockReturnValue({
            user: mockUser({
                role: 'admin',
                pillars: null,
                team: null
            }),
            loading: false,
        });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Zarząd / Administracja')).toBeInTheDocument();
        });
    });





    it('powinien wyświetlić czas członkostwa', async () => {
        const joinDate = new Date();
        joinDate.setFullYear(joinDate.getFullYear() - 2);
        joinDate.setMonth(joinDate.getMonth() - 3);

        useUserMock.mockReturnValue({
            user: mockUser({
                joinDate: joinDate.toISOString().split('T')[0],
                isTrial: false,
                team: null,
                pillars: null
            }),
            loading: false,
        });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );


        await waitFor(() => {
            expect(screen.getByText('Jesteś z nami')).toBeInTheDocument();
        });
    });

    it('nie powinien wyświetlać czasu członkostwa dla próbnego', async () => {
        useUserMock.mockReturnValue({
            user: mockUser({
                isTrial: true,
                joinDate: '2025-01-01',
                team: null,
                pillars: null
            }),
            loading: false,
        });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText('Jesteś z nami')).not.toBeInTheDocument();
        });
    });
});