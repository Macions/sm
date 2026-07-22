// frontend/src/services/member.service.ts
import api from './api';

export interface Member {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    function: string;
    team: string;
    teamId: string;
    province: string;
    status: "trial" | "full" | "mentor";
    interests: string[];
    skills: string[];
    smAreas: string[];
    email: string;
    phone?: string;
    joinDate: string;
    vacation?: {
        startDate: string;
        endDate: string;
        type: "team" | "organization";
        teamId?: string;
    };
    contacts?: {
        salaContacts?: string[];
        mpContacts?: string[];
        otherContacts?: string[];
    };
    trainingAreas?: string[];
    contributionInfo?: {
        arrears?: number;
        status?: "paid" | "partial" | "unpaid";
    };
    formData?: Record<string, any>;
}

export interface User {
    id: string;
    name: string;
    role: "admin" | "coordinator" | "member";
    teamId?: string;
}

class MemberService {
    // Pobierz wszystkich członków
    async getMembers(): Promise<Member[]> {
        try {
            const response = await api.get('/api/users');
            return response.data.map((user: any) => this.mapToMember(user));
        } catch (error) {
            console.error('❌ Błąd pobierania członków:', error);
            throw error;
        }
    }

    // Pobierz członka po ID
    async getMemberById(id: string): Promise<Member> {
        try {
            const response = await api.get(`/api/users/${id}`);
            return this.mapToMember(response.data);
        } catch (error) {
            console.error('❌ Błąd pobierania członka:', error);
            throw error;
        }
    }

    // Utwórz nowego członka
    async createMember(data: Partial<Member>, password: string): Promise<Member> {
        try {
            const response = await api.post('/api/users', {
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email,
                username: data.username || `${data.firstName?.toLowerCase()}.${data.lastName?.toLowerCase()}`,
                password: password || 'temporary123', // Tymczasowe hasło
                role_id: data.role || 4,
                team: data.team,
                status: data.status === 'mentor' ? 'mentor' : 'active',
                province: data.province,
                phone: data.phone,
                functional_role: data.function,
                join_date: data.joinDate || new Date().toISOString().split('T')[0],
                is_active: 1,
            });
            return this.mapToMember(response.data);
        } catch (error) {
            console.error('❌ Błąd tworzenia członka:', error);
            throw error;
        }
    }

    // Aktualizuj członka
    async updateMember(id: string, data: Partial<Member>): Promise<Member> {
        try {
            const response = await api.put(`/api/users/${id}`, {
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email,
                team: data.team,
                status: data.status === 'inactive' ? 'inactive' : 'active',
                province: data.province,
                phone: data.phone,
                functional_role: data.function,
                join_date: data.joinDate,
                is_active: data.status !== 'inactive' ? 1 : 0,
            });
            return this.mapToMember(response.data);
        } catch (error) {
            console.error('❌ Błąd aktualizacji członka:', error);
            throw error;
        }
    }

    // Usuń członka (soft delete)
    async deleteMember(id: string): Promise<void> {
        try {
            await api.delete(`/api/users/${id}`);
        } catch (error) {
            console.error('❌ Błąd usuwania członka:', error);
            throw error;
        }
    }

    // Mapuj dane z backendu na format frontendu
    private mapToMember(data: any): Member {
        return {
            id: data.id?.toString() || '',
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            function: data.functional_role || data.role || 'Członek',
            team: data.team || '',
            teamId: data.team_id || data.team?.toLowerCase().replace(/\s/g, '-') || '',
            province: data.province || '',
            status: this.mapStatus(data.status),
            interests: [],
            skills: [],
            smAreas: [],
            email: data.email || '',
            phone: data.phone || '',
            joinDate: data.join_date || data.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        };
    }

    private mapStatus(status: string | null): "trial" | "full" | "mentor" {
        if (!status) return 'trial';
        if (status === 'mentor') return 'mentor';
        if (status === 'active' || status === 'full') return 'full';
        if (status === 'trial') return 'trial';
        return 'trial';
    }
}

export const memberService = new MemberService();