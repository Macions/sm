// backend/src/services/revenue.service.ts
import { smPool, ewidencjaPool } from "../config/db";

interface MonthlyRevenue {
	month: string;
	year: number;
	revenue: number;
	expenses?: number;
	profit?: number;
	expensesFromInvoices?: number; // 👈 DODAJ
}

interface RevenueData {
	year: number;
	months: MonthlyRevenue[];
	totalRevenue: number;
	averageRevenue: number;
	totalExpenses?: number;
	totalExpensesFromInvoices?: number; // 👈 DODAJ
	netProfit?: number;
}

interface CategoryData {
	month: string;
	monthIndex: number;
	[key: string]: string | number;
}

export class RevenueService {
	async getMonthlyRevenue(
		year: number = new Date().getFullYear(),
	): Promise<RevenueData> {
		try {
			console.log(`📊 Pobieram dane przychodów i wydatków dla roku ${year}...`);

			// ============================================================
			// 1. Pobierz dane z tabeli payments (przychody + wydatki)
			// ============================================================
			const [paymentRows]: any[] = await smPool.query(
				`SELECT 
                    MONTH(payment_date) as month,
                    SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_revenue,
                    SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END) as total_expenses
                FROM payments
                WHERE 
                    YEAR(payment_date) = ?
                    AND blacklisted = 0
                GROUP BY MONTH(payment_date)
                ORDER BY month ASC`,
				[year],
			);

			// ============================================================
			// 2. Pobierz dane z tabeli invoices (faktury - wydatki)
			// ============================================================
			const [invoiceRows]: any[] = await ewidencjaPool.query(
				`SELECT 
                    MONTH(invoice_date) as month,
                    SUM(amount) as total_invoices
                FROM invoices
                WHERE 
                    YEAR(invoice_date) = ?
                    AND paid = 0  -- tylko niezapłacone faktury (lub wszystkie jeśli chcesz)
                GROUP BY MONTH(invoice_date)
                ORDER BY month ASC`,
				[year],
			);

			// ============================================================
			// 3. Połącz dane
			// ============================================================
			const monthNames = [
				"Styczeń",
				"Luty",
				"Marzec",
				"Kwiecień",
				"Maj",
				"Czerwiec",
				"Lipiec",
				"Sierpień",
				"Wrzesień",
				"Październik",
				"Listopad",
				"Grudzień",
			];

			// Mapy dla danych z payments
			const revenueMap = new Map<number, number>();
			const expensesMap = new Map<number, number>();

			if (Array.isArray(paymentRows)) {
				paymentRows.forEach((row: any) => {
					revenueMap.set(row.month, Number(row.total_revenue) || 0);
					expensesMap.set(row.month, Math.abs(Number(row.total_expenses)) || 0);
				});
			}

			// Mapa dla faktur
			const invoiceMap = new Map<number, number>();
			if (Array.isArray(invoiceRows)) {
				invoiceRows.forEach((row: any) => {
					invoiceMap.set(row.month, Number(row.total_invoices) || 0);
				});
			}

			// ============================================================
			// 4. Stwórz dane dla wszystkich miesięcy
			// ============================================================
			const months: MonthlyRevenue[] = monthNames.map((monthName, index) => {
				const monthNumber = index + 1;
				const revenue = revenueMap.get(monthNumber) || 0;
				const expensesFromPayments = expensesMap.get(monthNumber) || 0;
				const expensesFromInvoices = invoiceMap.get(monthNumber) || 0;
				const totalExpenses = expensesFromPayments + expensesFromInvoices;

				return {
					month: monthName,
					year: year,
					revenue: Math.round(revenue * 100) / 100,
					expenses: Math.round(totalExpenses * 100) / 100,
					profit: Math.round((revenue - totalExpenses) * 100) / 100,
					expensesFromInvoices: Math.round(expensesFromInvoices * 100) / 100,
				};
			});

			// ============================================================
			// 5. Oblicz sumy
			// ============================================================
			const totalRevenue = months.reduce((sum, m) => sum + m.revenue, 0);
			const totalExpenses = months.reduce(
				(sum, m) => sum + (m.expenses || 0),
				0,
			);
			const totalExpensesFromInvoices = months.reduce(
				(sum, m) => sum + (m.expensesFromInvoices || 0),
				0,
			);
			const averageRevenue =
				months.length > 0 ? totalRevenue / months.length : 0;

			return {
				year,
				months,
				totalRevenue: Math.round(totalRevenue * 100) / 100,
				averageRevenue: Math.round(averageRevenue * 100) / 100,
				totalExpenses: Math.round(totalExpenses * 100) / 100,
				totalExpensesFromInvoices:
					Math.round(totalExpensesFromInvoices * 100) / 100,
				netProfit: Math.round((totalRevenue - totalExpenses) * 100) / 100,
			};
		} catch (error) {
			console.error("❌ Błąd pobierania danych przychodów:", error);
			return this.getEmptyRevenueData(year);
		}
	}

	// ============================================================
	// 6. Kategorie przychodów z payments
	// ============================================================
	async getRevenueByCategory(year: number): Promise<CategoryData[]> {
		try {
			const [rows]: any[] = await smPool.query(
				`SELECT 
                    MONTH(payment_date) as month,
                    CASE 
                        WHEN title LIKE '%składka%' OR title LIKE '%Składka%' THEN 'Składki'
                        WHEN title LIKE '%grant%' OR title LIKE '%Grant%' THEN 'Granty'
                        WHEN title LIKE '%darowizna%' OR title LIKE '%Darowizna%' THEN 'Darowizny'
                        WHEN title LIKE '%Faktura%' OR title LIKE '%faktura%' THEN 'Faktury'
                        WHEN amount < 0 THEN 'Wydatki (payments)'
                        ELSE 'Inne przychody'
                    END as category,
                    SUM(amount) as total
                FROM payments
                WHERE 
                    YEAR(payment_date) = ?
                    AND blacklisted = 0
                    AND amount != 0
                GROUP BY month, category
                ORDER BY month ASC, category`,
				[year],
			);

			// ============================================================
			// 7. Dodaj wydatki z faktur do kategorii
			// ============================================================
			const [invoiceRows]: any[] = await ewidencjaPool.query(
				`SELECT 
                    MONTH(invoice_date) as month,
                    SUM(amount) as total_invoices
                FROM invoices
                WHERE 
                    YEAR(invoice_date) = ?
                    AND paid = 0
                GROUP BY MONTH(invoice_date)`,
				[year],
			);

			const monthNames = [
				"Styczeń",
				"Luty",
				"Marzec",
				"Kwiecień",
				"Maj",
				"Czerwiec",
				"Lipiec",
				"Sierpień",
				"Wrzesień",
				"Październik",
				"Listopad",
				"Grudzień",
			];

			const categories = [
				"Składki",
				"Granty",
				"Darowizny",
				"Faktury",
				"Inne przychody",
				"Wydatki (payments)",
				"Wydatki (faktury)",
			];
			const result: any = {};

			// Inicjalizuj dane dla każdego miesiąca
			monthNames.forEach((month, index) => {
				result[month] = { month, monthIndex: index + 1 };
				categories.forEach((cat) => {
					result[month][cat] = 0;
				});
			});

			// Wypełnij danymi z payments
			if (Array.isArray(rows)) {
				rows.forEach((row: any) => {
					const monthName = monthNames[row.month - 1];
					if (result[monthName]) {
						const value = Number(row.total);
						if (row.category === "Wydatki (payments)") {
							result[monthName]["Wydatki (payments)"] = Math.abs(value);
						} else {
							result[monthName][row.category] = Math.abs(value);
						}
					}
				});
			}

			// Wypełnij danymi z faktur
			if (Array.isArray(invoiceRows)) {
				invoiceRows.forEach((row: any) => {
					const monthName = monthNames[row.month - 1];
					if (result[monthName]) {
						result[monthName]["Wydatki (faktury)"] = Number(row.total_invoices);
					}
				});
			}

			return Object.values(result);
		} catch (error) {
			console.error("❌ Błąd pobierania kategorii:", error);
			return [];
		}
	}
	async getMonthlyDetails(year: number, month: number): Promise<any> {
		try {
			console.log(`📊 Pobieram szczegóły dla ${year}-${month}...`);

			// 1. Pobierz przychody z payments
			const [revenueRows]: any[] = await smPool.query(
				`SELECT 
                    id,
                    title as description,
                    amount,
                    payment_date as date,
                    'revenue' as type
                FROM payments
                WHERE 
                    YEAR(payment_date) = ?
                    AND MONTH(payment_date) = ?
                    AND amount > 0
                    AND blacklisted = 0
                ORDER BY payment_date DESC`,
				[year, month],
			);

			// 2. Pobierz wydatki z payments (ujemne kwoty)
			const [expenseRows]: any[] = await smPool.query(
				`SELECT 
                    id,
                    title as description,
                    ABS(amount) as amount,
                    payment_date as date,
                    'expense' as type
                FROM payments
                WHERE 
                    YEAR(payment_date) = ?
                    AND MONTH(payment_date) = ?
                    AND amount < 0
                    AND blacklisted = 0
                ORDER BY payment_date DESC`,
				[year, month],
			);

			// 3. Pobierz wydatki z faktur
			const [invoiceRows]: any[] = await ewidencjaPool.query(
				`SELECT 
                    id,
                    invoice_number as description,
                    amount,
                    invoice_date as date,
                    'invoice' as type
                FROM invoices
                WHERE 
                    YEAR(invoice_date) = ?
                    AND MONTH(invoice_date) = ?
                    AND paid = 0
                ORDER BY invoice_date DESC`,
				[year, month],
			);

			// 4. Połącz wszystkie dane
			const allTransactions = [
				...(Array.isArray(revenueRows) ? revenueRows : []),
				...(Array.isArray(expenseRows) ? expenseRows : []),
				...(Array.isArray(invoiceRows) ? invoiceRows : []),
			];

			// 5. Oblicz sumy
			const totalRevenue = allTransactions
				.filter((t: any) => t.type === "revenue")
				.reduce((sum: number, t: any) => sum + Number(t.amount), 0);

			const totalExpenses = allTransactions
				.filter((t: any) => t.type === "expense" || t.type === "invoice")
				.reduce((sum: number, t: any) => sum + Number(t.amount), 0);

			const totalExpensesFromInvoices = allTransactions
				.filter((t: any) => t.type === "invoice")
				.reduce((sum: number, t: any) => sum + Number(t.amount), 0);

			const monthNames = [
				"Styczeń",
				"Luty",
				"Marzec",
				"Kwiecień",
				"Maj",
				"Czerwiec",
				"Lipiec",
				"Sierpień",
				"Wrzesień",
				"Październik",
				"Listopad",
				"Grudzień",
			];

			return {
				year,
				month,
				monthName: monthNames[month - 1],
				transactions: allTransactions.map((t: any) => ({
					id: t.id?.toString() || "unknown",
					description: t.description || "Brak opisu",
					amount: Math.round(Number(t.amount) * 100) / 100,
					date: t.date ? new Date(t.date).toISOString().split("T")[0] : null,
					type: t.type,
				})),
				totalRevenue: Math.round(totalRevenue * 100) / 100,
				totalExpenses: Math.round(totalExpenses * 100) / 100,
				totalExpensesFromInvoices:
					Math.round(totalExpensesFromInvoices * 100) / 100,
				netProfit: Math.round((totalRevenue - totalExpenses) * 100) / 100,
				count: allTransactions.length,
			};
		} catch (error) {
			console.error("❌ Błąd pobierania szczegółów:", error);
			return {
				year,
				month,
				monthName: "Błąd",
				transactions: [],
				totalRevenue: 0,
				totalExpenses: 0,
				totalExpensesFromInvoices: 0,
				netProfit: 0,
				count: 0,
				error: error instanceof Error ? error.message : "Nieznany błąd",
			};
		}
	}
	private getEmptyRevenueData(year: number): RevenueData {
		const monthNames = [
			"Styczeń",
			"Luty",
			"Marzec",
			"Kwiecień",
			"Maj",
			"Czerwiec",
			"Lipiec",
			"Sierpień",
			"Wrzesień",
			"Październik",
			"Listopad",
			"Grudzień",
		];
		const months = monthNames.map((month) => ({
			month,
			year,
			revenue: 0,
			expenses: 0,
			profit: 0,
			expensesFromInvoices: 0,
		}));
		return {
			year,
			months,
			totalRevenue: 0,
			averageRevenue: 0,
			totalExpenses: 0,
			totalExpensesFromInvoices: 0,
			netProfit: 0,
		};
	}
}

export const revenueService = new RevenueService();
