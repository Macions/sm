"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.memberService = void 0;
// frontend/src/services/member.service.ts
const api_1 = __importDefault(require("./api"));
class MemberService {
    // Pobierz wszystkich członków
    async getMembers() {
        try {
            const response = await api_1.default.get("/api/users");
            return response.data.map((user) => this.mapToMember(user));
        }
        catch (error) {
            console.error("❌ Błąd pobierania członków:", error);
            throw error;
        }
    }
    // Pobierz członka po ID
    async getMemberById(id) {
        try {
            const response = await api_1.default.get(`/api/users/${id}`);
            return this.mapToMember(response.data);
        }
        catch (error) {
            console.error("❌ Błąd pobierania członka:", error);
            throw error;
        }
    }
    // Utwórz nowego członka
    async createMember(data, password) {
        try {
            const response = await api_1.default.post("/api/users", {
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email,
                username: data.username ||
                    `${data.firstName?.toLowerCase()}.${data.lastName?.toLowerCase()}`,
                password: password || "temporary123",
                role_id: data.role === "admin" ? 1 : data.role === "coordinator" ? 2 : 4,
                team: data.team,
                status: data.status === "mentor"
                    ? "mentor"
                    : data.status === "active"
                        ? "active"
                        : "trial",
                province: data.province,
                phone: data.phone,
                functional_role: data.function,
                join_date: data.joinDate || new Date().toISOString().split("T")[0],
                is_active: 1,
            });
            return this.mapToMember(response.data);
        }
        catch (error) {
            console.error("❌ Błąd tworzenia członka:", error);
            throw error;
        }
    }
    // Aktualizuj członka
    async updateMember(id, data) {
        try {
            const isActive = data.status === "inactive" ? 0 : 1;
            const response = await api_1.default.put(`/api/users/${id}`, {
                first_name: data.firstName,
                last_name: data.lastName,
                email: data.email,
                team: data.team,
                status: data.status === "mentor"
                    ? "mentor"
                    : data.status === "active"
                        ? "active"
                        : "trial", // ✅
                province: data.province,
                phone: data.phone,
                functional_role: data.function,
                join_date: data.joinDate,
                is_active: isActive,
            });
            return this.mapToMember(response.data);
        }
        catch (error) {
            console.error("❌ Błąd aktualizacji członka:", error);
            throw error;
        }
    }
    // Usuń członka (soft delete)
    async deleteMember(id) {
        try {
            await api_1.default.delete(`/api/users/${id}`);
        }
        catch (error) {
            console.error("❌ Błąd usuwania członka:", error);
            throw error;
        }
    }
    // Mapuj dane z backendu na format frontendu
    mapToMember(data) {
        return {
            id: data.id?.toString() || "",
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            username: data.username || "",
            role: data.role || "member",
            function: data.functional_role || data.role || "Członek",
            team: data.team || "",
            teamId: data.team_id || data.team?.toLowerCase().replace(/\s/g, "-") || "",
            province: data.province || "",
            status: this.mapStatus(data.status),
            interests: [],
            skills: [],
            smAreas: [],
            email: data.email || "",
            phone: data.phone || "",
            joinDate: data.join_date ||
                data.created_at?.split("T")[0] ||
                new Date().toISOString().split("T")[0],
        };
    }
    mapStatus(status) {
        if (!status)
            return "trial";
        if (status === "mentor")
            return "mentor";
        if (status === "inactive")
            return "inactive"; // ✅ DODANE
        if (status === "active" || status === "full")
            return "active";
        if (status === "trial")
            return "trial";
        return "trial";
    }
}
exports.memberService = new MemberService();
