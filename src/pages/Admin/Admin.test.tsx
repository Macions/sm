
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Admin from './Admin';





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
        loading: vi.fn(),
        dismiss: vi.fn(),
    },
    Toaster: () => null,
}));





const mockUser = {
    id: 1,
    firstName: 'Admin',
    lastName: 'System',
    email: 'admin@test.pl',
    role: 'admin',
    status: 'active',
};

const mockTeams = [
    {
        id: '1',
        name: 'Zarząd',
        description: 'Zarząd organizacji',
        role: 'Zarząd',
        icon: 'Users',
        status: 'active',
        parent_id: null,
        email: null,
        members: [],
        created_at: '2025-01-01',
    },
    {
        id: '2',
        name: 'Filar Projektowy',
        description: 'Filar projektowy',
        role: 'Filar',
        icon: 'Briefcase',
        status: 'active',
        parent_id: null,
        email: null,
        members: [],
        created_at: '2025-01-01',
    },
];

const mockRoles = [
    { id: '1', name: 'admin', description: 'Administrator', permissions: [] },
    { id: '2', name: 'member', description: 'Członek', permissions: [] },
];

const mockUsers = [
    { id: '1', first_name: 'Jan', last_name: 'Kowalski', email: 'jan@test.pl' },
    { id: '2', first_name: 'Anna', last_name: 'Nowak', email: 'anna@test.pl' },
];

const mockMemberAccess = [
    { id: '1', first_name: 'Jan', last_name: 'Kowalski', email: 'jan@test.pl', access: ['Instagram'] },
];

const mockLogs = {
    logs: [
        { id: '1', user_name: 'Admin', action_type: 'LOGIN', category: 'AUTH', created_at: '2025-01-01', status: 'success' },
    ],
    total: 1,
    page: 1,
    totalPages: 1,
    limit: 15,
};





describe('Admin Panel', () => {
    let useUserMock: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        mockNavigate.mockClear();


        globalThis.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('/api/profile')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockUser),
                });
            }
            if (url.includes('/api/admin/teams')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockTeams),
                });
            }
            if (url.includes('/api/admin/available-users')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockUsers),
                });
            }
            if (url.includes('/api/admin/roles')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockRoles),
                });
            }
            if (url.includes('/api/admin/member-access')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockMemberAccess),
                });
            }

            if (url.includes('/api/admin/logs')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockLogs),
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });

        localStorage.setItem('accessToken', 'fake-token');

        const { useUser } = await import('@/context/UserContext');
        useUserMock = useUser as any;
        useUserMock.mockReturnValue({
            user: mockUser,
            loading: false,
        });
    });





    it('powinien wyświetlić tytuł panelu administracyjnego', async () => {
        render(
            <BrowserRouter>
                <Admin />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Administracja systemu/i)).toBeInTheDocument();
        });
    });

    it('powinien wyświetlić sekcję "Role i uprawnienia"', async () => {
        render(
            <BrowserRouter>
                <Admin />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Role i uprawnienia')).toBeInTheDocument();
        });
    });

    it('powinien wyświetlić sekcję "Zespoły i członkowie"', async () => {
        render(
            <BrowserRouter>
                <Admin />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Zespoły i członkowie')).toBeInTheDocument();
        });
    });

    it('powinien wyświetlić sekcję "Zarządzanie dostępami"', async () => {
        render(
            <BrowserRouter>
                <Admin />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Zarządzanie dostępami')).toBeInTheDocument();
        });
    });

    it('powinien wyświetlić sekcję "Statystyki organizacji"', async () => {
        render(
            <BrowserRouter>
                <Admin />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Statystyki organizacji')).toBeInTheDocument();
        });
    });

    it('powinien wyświetlić sekcję "Historia działań"', async () => {
        render(
            <BrowserRouter>
                <Admin />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Historia działań')).toBeInTheDocument();
        });
    });





    it('powinien wyświetlić listę członków z dostępami', async () => {
        render(
            <BrowserRouter>
                <Admin />
            </BrowserRouter>
        );


        await waitFor(() => {
            expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
            expect(screen.getByText('Instagram')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('powinien mieć przycisk "Dodaj dostęp"', async () => {
        render(
            <BrowserRouter>
                <Admin />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Dodaj dostęp')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('powinien otworzyć modal "Dodaj dostęp" po kliknięciu', async () => {
        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <Admin />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Dodaj dostęp')).toBeInTheDocument();
        }, { timeout: 3000 });

        await user.click(screen.getByText('Dodaj dostęp'));

        expect(screen.getByText('Dodaj dostęp dla członka')).toBeInTheDocument();
    });





    it('powinien wyświetlić listę zespołów', async () => {
        render(
            <BrowserRouter>
                <Admin />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Zarząd')).toBeInTheDocument();
            expect(screen.getByText('Filar Projektowy')).toBeInTheDocument();
        });
    });

    it('powinien mieć przycisk "Dodaj zespół"', async () => {
        render(
            <BrowserRouter>
                <Admin />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Dodaj zespół')).toBeInTheDocument();
        });
    });





    it('powinien wyświetlić listę ról', async () => {
        render(
            <BrowserRouter>
                <Admin />
            </BrowserRouter>
        );

        await waitFor(() => {

            const adminElements = screen.getAllByText('Administrator główny');
            expect(adminElements.length).toBeGreaterThan(0);


            const memberElements = screen.getAllByText('Członek');
            expect(memberElements.length).toBeGreaterThan(0);
        });
    });





    it('powinien wyświetlić statystyki organizacji', async () => {
        render(
            <BrowserRouter>
                <Admin />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Członków')).toBeInTheDocument();
            expect(screen.getByText('Zespołów')).toBeInTheDocument();
            expect(screen.getByText('Ról')).toBeInTheDocument();
        });
    });





    it('nie powinien wyświetlić panelu admina dla zwykłego użytkownika', async () => {
        const { useUser } = await import('@/context/UserContext');
        (useUser as any).mockReturnValue({
            user: { ...mockUser, role: 'member' },
            loading: false,
        });

        render(
            <BrowserRouter>
                <Admin />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText('Administracja systemu')).not.toBeInTheDocument();
        });
    });
});