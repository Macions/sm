"use strict";
// A:\sm system\sm\backend\src\routes\dashboard.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const db_1 = __importDefault(require("../config/db"));
const router = (0, express_1.Router)();
// Wszystkie trasy wymagają autoryzacji
router.use(auth_middleware_1.authMiddleware);
// ===== PROFIL UŻYTKOWNIKA =====
router.get("/profile", async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Brak ID użytkownika" });
        }
        const [rows] = await db_1.default.query(`SELECT 
		id, 
		first_name, 
		last_name, 
		email, 
		role_id, 
		team, 
		status,
		province,
		phone,
		join_date,
		is_trial
	FROM users 
	WHERE id = ?`, [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: "Użytkownik nie znaleziony" });
        }
        const user = rows[0];
        let roleName = "Członek";
        if (user.role_id) {
            const [roleRows] = await db_1.default.query("SELECT name FROM roles WHERE id = ?", [user.role_id]);
            if (roleRows.length > 0) {
                roleName = roleRows[0].name;
            }
        }
        res.json({
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            name: `${user.first_name} ${user.last_name}`,
            role: roleName,
            team: user.team || "Brak",
            status: user.status || "Aktywny",
            email: user.email,
            province: user.province,
            phone: user.phone,
            joinDate: user.join_date,
            isTrial: user.is_trial === 1,
        });
    }
    catch (error) {
        console.error("Błąd pobierania profilu:", error);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
// ===== STATYSTYKI DASHBOARDU =====
router.get("/stats", async (req, res) => {
    try {
        const userId = req.user?.id;
        const [membersResult] = await db_1.default.query("SELECT COUNT(*) as count FROM users WHERE is_active = 1");
        const [projectsResult] = await db_1.default.query("SELECT COUNT(*) as count FROM projects WHERE status != 'completed'");
        let attendance = "92%";
        const [userResult] = await db_1.default.query("SELECT attendance_percentage FROM users WHERE id = ?", [userId]);
        if (userResult.length > 0 && userResult[0].attendance_percentage) {
            attendance = userResult[0].attendance_percentage + "%";
        }
        const announcementsCount = 3;
        const [guidesResult] = await db_1.default.query("SELECT COUNT(*) as count FROM guides WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)");
        res.json({
            members: membersResult[0]?.count || 0,
            projects: projectsResult[0]?.count || 0,
            attendance: attendance,
            announcements: announcementsCount,
            newGuides: guidesResult[0]?.count || 0,
        });
    }
    catch (error) {
        console.error("Błąd pobierania statystyk:", error);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
// ===== POWIADOMIENIA - POBIERANIE =====
router.get("/notifications", async (req, res) => {
    try {
        const userId = req.user?.id;
        const limit = parseInt(req.query.limit) || 20;
        const [rows] = await db_1.default.query(`SELECT 
				n.id, 
				n.title,
				n.message, 
				n.type, 
				COALESCE(un.\`read\`, 0) as \`read\`,
				n.link,
				n.created_at
			FROM notifications n
			LEFT JOIN user_notifications un ON n.id = un.notification_id AND un.user_id = ?
			WHERE n.target = 'all' OR n.user_id = ?
			ORDER BY n.created_at DESC 
			LIMIT ?`, [userId, userId, limit]);
        const notifications = rows.map((row) => ({
            id: row.id.toString(),
            title: row.title || "Powiadomienie",
            message: row.message,
            type: row.type || "info",
            read: row.read === 1,
            link: row.link || undefined,
            createdAt: new Date(row.created_at),
        }));
        res.json(notifications);
    }
    catch (error) {
        console.error("Błąd pobierania powiadomień:", error);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
// ===== OZNACZ JAKO PRZECZYTANE =====
router.put("/notifications/:id/read", async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        // Sprawdź czy istnieje wpis w user_notifications
        const [existing] = await db_1.default.query("SELECT id FROM user_notifications WHERE user_id = ? AND notification_id = ?", [userId, id]);
        if (existing.length > 0) {
            // Aktualizuj istniejący
            await db_1.default.query("UPDATE user_notifications SET `read` = 1, read_at = NOW() WHERE user_id = ? AND notification_id = ?", [userId, id]);
        }
        else {
            // Dodaj nowy wpis
            await db_1.default.query("INSERT INTO user_notifications (user_id, notification_id, `read`, read_at) VALUES (?, ?, 1, NOW())", [userId, id]);
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error("Błąd oznaczania jako przeczytane:", error);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
// ===== OZNACZ WSZYSTKIE JAKO PRZECZYTANE =====
router.put("/notifications/read-all", async (req, res) => {
    try {
        const userId = req.user?.id;
        // Pobierz wszystkie powiadomienia dla użytkownika
        const [notifications] = await db_1.default.query(`SELECT n.id 
			FROM notifications n
			WHERE n.target = 'all' OR n.user_id = ?`, [userId]);
        for (const notif of notifications) {
            const [existing] = await db_1.default.query("SELECT id FROM user_notifications WHERE user_id = ? AND notification_id = ?", [userId, notif.id]);
            if (existing.length > 0) {
                await db_1.default.query("UPDATE user_notifications SET `read` = 1, read_at = NOW() WHERE user_id = ? AND notification_id = ?", [userId, notif.id]);
            }
            else {
                await db_1.default.query("INSERT INTO user_notifications (user_id, notification_id, `read`, read_at) VALUES (?, ?, 1, NOW())", [userId, notif.id]);
            }
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error("Błąd oznaczania wszystkich:", error);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
// ===== USUŃ POWIADOMIENIE =====
router.delete("/notifications/:id", async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        // Usuń tylko wpis z user_notifications (nie kasuj całego powiadomienia)
        await db_1.default.query("DELETE FROM user_notifications WHERE user_id = ? AND notification_id = ?", [userId, id]);
        res.json({ success: true });
    }
    catch (error) {
        console.error("Błąd usuwania powiadomienia:", error);
        res.status(500).json({ error: "Błąd serwera" });
    }
});
exports.default = router;
