// backend/src/services/revenue.service.ts
import { smPool, ewidencjaPool } from "../config/db";

interface MonthlyRevenue {
	month: string;
	year: number;
	revenue: number;
	expenses?: number;
	profit?: number;
	expensesFromInvoices?: number;
	invoicesCount?: number;
	unpaidInvoices?: number;
}

interface RevenueData {
	year: number;
	months: MonthlyRevenue[];
	totalRevenue: number;
	averageRevenue: number;
	totalExpenses?: number;
	totalExpensesFromInvoices?: number;
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
			// console.log(`📊 Pobieram dane przychodów i wydatków dla roku ${year}...`);

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
				GROUP BY MONTH(invoice_date)
				ORDER BY month ASC`,
				[year],
			);

			const monthNames = [
				"Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
				"Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
			];

			const revenueMap = new Map<number, number>();
			const expensesMap = new Map<number, number>();

			if (Array.isArray(paymentRows)) {
				paymentRows.forEach((row: any) => {
					revenueMap.set(row.month, Number(row.total_revenue) || 0);
					expensesMap.set(row.month, Math.abs(Number(row.total_expenses)) || 0);
				});
			}

			const invoiceMap = new Map<number, number>();
			if (Array.isArray(invoiceRows)) {
				invoiceRows.forEach((row: any) => {
					invoiceMap.set(row.month, Number(row.total_invoices) || 0);
				});
			}

			// ============================================================
			// STAŁY MIESIĘCZNY WYDATEK NA BIURO - 100 zł miesięcznie
			// ============================================================
			const MONTHLY_OFFICE_COST = 60.27;

			const months: MonthlyRevenue[] = monthNames.map((monthName, index) => {
				const monthNumber = index + 1;
				const revenue = revenueMap.get(monthNumber) || 0;
				const expensesFromPayments = expensesMap.get(monthNumber) || 0;
				const expensesFromInvoices = invoiceMap.get(monthNumber) || 0;

				// DODAJ STAŁY WYDATEK NA BIURO DO KAŻDEGO MIESIĄCA
				const totalExpenses = expensesFromPayments + expensesFromInvoices + MONTHLY_OFFICE_COST;

				return {
					month: monthName,
					year: year,
					revenue: Math.round(revenue * 100) / 100,
					expenses: Math.round(totalExpenses * 100) / 100,
					profit: Math.round((revenue - totalExpenses) * 100) / 100,
					expensesFromInvoices: Math.round(expensesFromInvoices * 100) / 100,
				};
			});

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
	// Kategorie przychodów z payments - PEŁNA KATEGORYZACJA
	// ============================================================
	async getRevenueByCategory(year: number): Promise<CategoryData[]> {
		try {
			// console.log(`🔍 [KATEGORIE] Pobieram kategorie dla roku ${year}...`);

			// ============================================================
			// Pobierz dane z payments z pełną kategoryzacją
			// ============================================================
			const [rows]: any[] = await smPool.query(
				`SELECT 
					MONTH(payment_date) as month,
					CASE 
						-- SKŁADKI - rozszerzone o różne warianty
						WHEN LOWER(title) LIKE '%składka%' 
						  OR LOWER(title) LIKE '%skladka%'
						  OR LOWER(title) LIKE '%członkowskie%'
						  OR LOWER(title) LIKE '%członkowski%'
						  OR LOWER(title) LIKE '%składki%'
						  OR LOWER(title) LIKE '%skladki%'
						  OR LOWER(title) LIKE '%wpłata składki%'
						  OR LOWER(title) LIKE '%wplata skladki%'
						  OR LOWER(title) LIKE '%składka członkowska%'
						  OR LOWER(title) LIKE '%skladka czlonkowska%' THEN 'Składki'
						
						-- GRANTY
						WHEN LOWER(title) LIKE '%grant%' 
						  OR LOWER(title) LIKE '%granty%'
						  OR LOWER(title) LIKE '%dofinansowanie%'
						  OR LOWER(title) LIKE '%projekt%'
						  OR LOWER(title) LIKE '%program%'
						  OR LOWER(title) LIKE '%dotacja%' THEN 'Granty'
						
						-- DAROWIZNY
						WHEN LOWER(title) LIKE '%darowizna%'
						  OR LOWER(title) LIKE '%darowizny%'
						  OR LOWER(title) LIKE '%wpłata%'
						  OR LOWER(title) LIKE '%wplata%'
						  OR LOWER(title) LIKE '%datek%' THEN 'Darowizny'
						
						-- FAKTURY
						WHEN LOWER(title) LIKE '%faktura%'
						  OR LOWER(title) LIKE '%faktury%'
						  OR LOWER(title) LIKE '%invoice%' 
						  OR LOWER(title) LIKE '%faktura vat%' THEN 'Faktury'
						
						-- WYDATKI (ujemne kwoty) - to łapie wszystkie wydatki, w tym z "Biuro"
						WHEN amount < 0 THEN 'Wydatki (payments)'
						
						-- INNE (dodatnie kwoty)
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
			// LOGI - zobacz co zostało skategoryzowane
			// ============================================================
			// console.log(`📊 [KATEGORIE] Znaleziono ${rows.length} kategorii`);
			if (Array.isArray(rows) && rows.length > 0) {
				rows.forEach((row: any) => {
					// console.log(`  - Miesiąc: ${row.month}, Kategoria: ${row.category}, Kwota: ${row.total}`);
				});
			} else {
				// console.log(`⚠️ [KATEGORIE] Brak danych dla roku ${year}`);
			}

			// ============================================================
			// Dodaj wydatki z faktur do kategorii
			// ============================================================
			const [invoiceRows]: any[] = await ewidencjaPool.query(
				`SELECT 
					MONTH(invoice_date) as month,
					CASE 
						WHEN LOWER(contractor) LIKE '%biedronka%' 
						  OR LOWER(contractor) LIKE '%lidl%'
						  OR LOWER(contractor) LIKE '%kaufland%' THEN 'Wydatki (faktury - zakupy)'
						WHEN LOWER(contractor) LIKE '%orange%' 
						  OR LOWER(contractor) LIKE '%t-mobile%'
						  OR LOWER(contractor) LIKE '%play%' THEN 'Wydatki (faktury - telekomunikacja)'
						WHEN LOWER(contractor) LIKE '%media expert%' 
						  OR LOWER(contractor) LIKE '%x-kom%' THEN 'Wydatki (faktury - sprzęt)'
						ELSE 'Wydatki (faktury - inne)'
					END as category,
					SUM(amount) as total_invoices
				FROM invoices
				WHERE 
					YEAR(invoice_date) = ?
				GROUP BY month, category`,
				[year],
			);

			// console.log(`📄 [KATEGORIE] Znaleziono ${invoiceRows.length} miesięcy z fakturami`);

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
				"Wydatki biurowe",
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

			// ============================================================
			// DODAJ STAŁY WYDATEK BIUROWY DO KAŻDEGO MIESIĄCA
			// ============================================================
			const MONTHLY_OFFICE_COST = 60.27; // 100 zł miesięcznie

			monthNames.forEach((month) => {
				if (result[month]) {
					result[month]['Wydatki biurowe'] = MONTHLY_OFFICE_COST;
				}
			});

			// ============================================================
			// PODSUMOWANIE - zobacz końcowy wynik
			// ============================================================
			// console.log(`✅ [KATEGORIE] Dodano stały wydatek biurowy: ${MONTHLY_OFFICE_COST} zł/miesiąc`);
			// console.log(`✅ [KATEGORIE] Zakończono kategoryzację dla roku ${year}`);
			const resultValues = Object.values(result);
			// console.log(`📊 [KATEGORIE] Zwracam ${resultValues.length} miesięcy danych`);

			return resultValues as CategoryData[];
		} catch (error) {
			console.error("❌ [KATEGORIE] Błąd pobierania kategorii:", error);
			return [];
		}
	}

	async getMonthlyDetails(year: number, month: number): Promise<any> {
		try {
			// console.log(`📊 Pobieram szczegóły dla ${year}-${month}...`);

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

			const [invoiceRows]: any[] = await ewidencjaPool.query(
				`SELECT 
					id,
					invoice_number as description,
					amount,
					invoice_date as date,
					'invoice' as type,
					contractor,
					paid,
					paid_date,
					description as notes
				FROM invoices
				WHERE 
					YEAR(invoice_date) = ?
					AND MONTH(invoice_date) = ?
				ORDER BY invoice_date DESC`,
				[year, month],
			);

			const allTransactions = [
				...(Array.isArray(revenueRows) ? revenueRows : []),
				...(Array.isArray(expenseRows) ? expenseRows : []),
				...(Array.isArray(invoiceRows) ? invoiceRows : []),
			];

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