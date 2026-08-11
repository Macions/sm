// CAŁY PLIK: backend/src/services/revenue.service.ts
// Definicje typów lokalnie (bez importu)
interface MonthlyRevenue {
	month: string;
	year: number;
	revenue: number;
	expenses?: number;
	profit?: number;
}

interface RevenueData {
	year: number;
	months: MonthlyRevenue[];
	totalRevenue: number;
	averageRevenue: number;
}
// TYMCZASOWE DANE - później zastąp bazą
const mockMonthlyRevenue: MonthlyRevenue[] = [
	{ month: "Styczeń", year: 2026, revenue: 12500 },
	{ month: "Luty", year: 2026, revenue: 14800 },
	{ month: "Marzec", year: 2026, revenue: 16200 },
	{ month: "Kwiecień", year: 2026, revenue: 18900 },
	{ month: "Maj", year: 2026, revenue: 21300 },
	{ month: "Czerwiec", year: 2026, revenue: 24500 },
	{ month: "Lipiec", year: 2026, revenue: 27800 },
	{ month: "Sierpień", year: 2026, revenue: 31200 },
	{ month: "Wrzesień", year: 2026, revenue: 29800 },
	{ month: "Październik", year: 2026, revenue: 33400 },
	{ month: "Listopad", year: 2026, revenue: 36700 },
	{ month: "Grudzień", year: 2026, revenue: 41200 },
];

export class RevenueService {
	async getMonthlyRevenue(
		year: number = new Date().getFullYear(),
	): Promise<RevenueData> {
		const months = mockMonthlyRevenue.filter((m) => m.year === year);
		const totalRevenue = months.reduce((sum, m) => sum + m.revenue, 0);
		const averageRevenue = months.length > 0 ? totalRevenue / months.length : 0;

		return {
			year,
			months,
			totalRevenue,
			averageRevenue,
		};
	}
}

export const revenueService = new RevenueService();
