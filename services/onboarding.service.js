"use strict";
// A:\sm system\sm\backend\src\services\onboarding.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingService = void 0;
const db_1 = __importDefault(require("../config/db"));
class OnboardingService {
    async saveOnboardingData(userId, data) {
        const connection = await db_1.default.getConnection();
        try {
            await connection.beginTransaction();
            // Sprawdź czy użytkownik już wypełnił onboarding
            const [existing] = await connection.query("SELECT id FROM onboarding_data WHERE user_id = ?", [userId]);
            if (existing.length > 0) {
                // Aktualizuj istniejące dane
                await connection.query(`UPDATE onboarding_data 
                     SET first_name = ?, last_name = ?, email = ?, phone = ?, 
                         province = ?, development_areas = ?, skills = ?, 
                         experience = ?, availability = ?, description = ?,
                         sala_contacts = ?, mp_contacts = ?, 
                         institution_contacts = ?, other_contacts = ?,
                         completed = true, updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = ?`, [
                    data.firstName,
                    data.lastName,
                    data.email,
                    data.phone || null,
                    data.province,
                    JSON.stringify(data.developmentAreas),
                    JSON.stringify(data.skills || []),
                    data.experience || "none",
                    data.availability || null,
                    data.description || null,
                    JSON.stringify(data.salaContacts || []),
                    JSON.stringify(data.mpContacts || []),
                    JSON.stringify(data.institutionContacts || []),
                    JSON.stringify(data.otherContacts || []),
                    userId,
                ]);
            }
            else {
                // Wstaw nowe dane
                await connection.query(`INSERT INTO onboarding_data 
                     (user_id, first_name, last_name, email, phone, province, 
                      development_areas, skills, experience, availability, description,
                      sala_contacts, mp_contacts, institution_contacts, other_contacts, completed)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`, [
                    userId,
                    data.firstName,
                    data.lastName,
                    data.email,
                    data.phone || null,
                    data.province,
                    JSON.stringify(data.developmentAreas),
                    JSON.stringify(data.skills || []),
                    data.experience || "none",
                    data.availability || null,
                    data.description || null,
                    JSON.stringify(data.salaContacts || []),
                    JSON.stringify(data.mpContacts || []),
                    JSON.stringify(data.institutionContacts || []),
                    JSON.stringify(data.otherContacts || []),
                ]);
            }
            // Zaktualizuj dane użytkownika - DODAJ join_date i is_trial
            await connection.query(`UPDATE users 
				 SET first_name = ?, last_name = ?, email = ?, phone = ?, province = ?,
					 join_date = ?, is_trial = ?
				 WHERE id = ?`, [
                data.firstName,
                data.lastName,
                data.email,
                data.phone || null,
                data.province,
                data.joinDate || null,
                data.isTrial ? 1 : 0,
                userId,
            ]);
            await connection.commit();
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    async getOnboardingData(userId) {
        const [rows] = await db_1.default.query("SELECT * FROM onboarding_data WHERE user_id = ?", [userId]);
        if (rows.length === 0) {
            return null;
        }
        const row = rows[0];
        return {
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            province: row.province,
            developmentAreas: JSON.parse(row.development_areas || "[]"),
            skills: JSON.parse(row.skills || "[]"),
            experience: row.experience || "none",
            availability: row.availability,
            description: row.description,
            salaContacts: JSON.parse(row.sala_contacts || "[]"),
            mpContacts: JSON.parse(row.mp_contacts || "[]"),
            institutionContacts: JSON.parse(row.institution_contacts || "[]"),
            otherContacts: JSON.parse(row.other_contacts || "[]"),
            joinDate: null, // onboarding_data nie ma tych kolumn
            isTrial: false,
        };
    }
    async checkOnboardingCompleted(userId) {
        const [rows] = await db_1.default.query("SELECT completed FROM onboarding_data WHERE user_id = ?", [userId]);
        if (rows.length === 0) {
            return false;
        }
        return rows[0].completed === 1;
    }
}
exports.OnboardingService = OnboardingService;
