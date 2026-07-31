// src/server/routes/payments.ts
import express from "express";
import pool from "../config/database";

const router = express.Router();

// 📊 GET - status składek wszystkich członków
router.get("/status", async (req, res) => {
	try {
		console.log("🔄 [PAYMENTS] Pobieranie danych składek...");

		// 🔥 DOSTOSUJ TO ZAPYTANIE DO SWOJEJ BAZY!
		const [rows] = await pool.query(`
            SELECT 
                m.id,
                m.full_name AS fullName,
                m.email,
                m.pay_from AS payFrom,
                m.suspended_until AS suspendedUntil,
                m.suspended_months AS suspendedMonths,
                COUNT(p.id) AS paymentCount,
                COALESCE(SUM(p.amount), 0) AS totalPaid,
                MAX(p.payment_date) AS lastPaymentDate,
                TIMESTAMPDIFF(MONTH, m.pay_from, CURDATE()) AS monthsShouldPay,
                TIMESTAMPDIFF(MONTH, m.pay_from, CURDATE()) - COUNT(p.id) AS monthsArrears,
                CASE 
                    WHEN TIMESTAMPDIFF(MONTH, m.pay_from, CURDATE()) - COUNT(p.id) > 3 THEN 'high_arrears'
                    WHEN TIMESTAMPDIFF(MONTH, m.pay_from, CURDATE()) - COUNT(p.id) > 0 THEN 'arrears'
                    WHEN COUNT(p.id) = 0 THEN 'no_payments'
                    ELSE 'paid'
                END AS paymentStatus
            FROM 
                members m
            LEFT JOIN 
                payments p ON m.id = p.member_id
            WHERE 
                m.pay_from IS NOT NULL
            GROUP BY 
                m.id, m.full_name, m.email, m.pay_from, 
                m.suspended_until, m.suspended_months
            ORDER BY 
                monthsArrears DESC
        `);

		const members = rows as any[];

		// 📊 Podsumowanie
		const summary = {
			totalMembers: members.length,
			totalArrears: members.reduce(
				(sum, m) => sum + Math.max(0, m.monthsArrears || 0),
				0,
			),
			totalPaid: members.reduce(
				(sum, m) => sum + parseFloat(m.totalPaid || 0),
				0,
			),
			averageArrears:
				members.reduce((sum, m) => sum + Math.max(0, m.monthsArrears || 0), 0) /
					members.length || 0,
		};

		console.log(`✅ [PAYMENTS] Pobrano ${members.length} członków`);

		res.json({
			success: true,
			members,
			summary,
		});
	} catch (error) {
		console.error("❌ [PAYMENTS] Błąd:", error);
		res.status(500).json({
			success: false,
			error: "Nie udało się pobrać danych składek",
			details: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

// 📊 GET - składki konkretnego członka
router.get("/member/:id", async (req, res) => {
	try {
		const { id } = req.params;

		const [rows] = await pool.query(
			`
            SELECT 
                m.id,
                m.full_name AS fullName,
                m.email,
                m.pay_from AS payFrom,
                p.id AS paymentId,
                p.amount,
                p.payment_date AS paymentDate,
                p.assigned_months AS assignedMonths
            FROM 
                members m
            LEFT JOIN 
                payments p ON m.id = p.member_id
            WHERE 
                m.id = ?
            ORDER BY 
                p.payment_date DESC
        `,
			[id],
		);

		const data = rows as any[];

		if (data.length === 0) {
			return res.status(404).json({
				success: false,
				error: "Nie znaleziono członka",
			});
		}

		const member = {
			id: data[0].id,
			fullName: data[0].fullName,
			email: data[0].email,
			payFrom: data[0].payFrom,
			payments: data
				.filter((r) => r.paymentId)
				.map((r) => ({
					id: r.paymentId,
					amount: r.amount,
					date: r.paymentDate,
					assignedMonths: r.assignedMonths,
				})),
		};

		res.json({
			success: true,
			data: member,
		});
	} catch (error) {
		console.error("❌ [PAYMENTS] Błąd:", error);
		res.status(500).json({
			success: false,
			error: "Nie udało się pobrać danych",
		});
	}
});

export default router;
