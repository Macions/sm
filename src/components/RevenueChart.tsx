// frontend/src/components/RevenueChart.tsx
import { useState, useEffect } from "react";
import {
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
	ComposedChart,
	Line,
	Cell,
} from "recharts";
import toast from "react-hot-toast";

interface RevenueChartProps {
	year?: number;
	title?: string;
}

interface RevenueData {
	month: string;
	monthName: string;
	revenue: number;
	expenses: number;
	profit: number;
	skladki: number;
	granty: number;
	darowizny: number;
	faktury: number;
	inne: number;
	expensesFromInvoices: number;
	wydatkiBiurowe: number;
}

const COLORS = {
	skladki: "#4A6FE8",
	granty: "#8B5CF6",
	darowizny: "#F59E0B",
	faktury: "#EC4899",
	inne: "#6B7280",
	expenses: "#EF4444",
	revenue: "#22C55E",
	profit: "#10B981",
	wydatkiBiurowe: "#F97316",
};

// Niestandardowy tooltip z pełnymi danymi
const CustomTooltip = ({ active, payload }: any) => {
	if (active && payload && payload.length) {
		const data = payload[0].payload;
		return (
			<div style={{
				backgroundColor: 'white',
				padding: '16px',
				border: '1px solid #e5e7eb',
				borderRadius: '12px',
				boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
				minWidth: '220px',
				maxWidth: '300px',
			}}>
				<p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '16px', color: '#1f2937' }}>
					{data.monthName}
				</p>

				<div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '8px' }}>
					<p style={{ margin: '4px 0', fontSize: '14px', color: '#4A6FE8' }}>
						Przychód: <strong>{data.revenue.toFixed(2)} zł</strong>
					</p>
					<p style={{ margin: '4px 0', fontSize: '14px', color: '#EF4444' }}>
						Wydatki: <strong>{data.expenses.toFixed(2)} zł</strong>
					</p>
					<p style={{ margin: '4px 0', fontSize: '14px', color: '#10B981' }}>
						Zysk: <strong>{data.profit.toFixed(2)} zł</strong>
					</p>
				</div>

				<div style={{ borderTop: '1px solid #f3f4f6', marginTop: '8px', paddingTop: '8px' }}>
					<p style={{ margin: '2px 0', fontSize: '12px', color: '#6b7280' }}>
						Składki: <strong>{data.skladki.toFixed(2)} zł</strong>
					</p>
					<p style={{ margin: '2px 0', fontSize: '12px', color: '#6b7280' }}>
						Granty: <strong>{data.granty.toFixed(2)} zł</strong>
					</p>
					<p style={{ margin: '2px 0', fontSize: '12px', color: '#6b7280' }}>
						Darowizny: <strong>{data.darowizny.toFixed(2)} zł</strong>
					</p>
					<p style={{ margin: '2px 0', fontSize: '12px', color: '#6b7280' }}>
						Faktury: <strong>{data.faktury.toFixed(2)} zł</strong>
					</p>
					<p style={{ margin: '2px 0', fontSize: '12px', color: '#6b7280' }}>
						Inne: <strong>{data.inne.toFixed(2)} zł</strong>
					</p>
					<p style={{ margin: '2px 0', fontSize: '12px', color: '#F97316' }}>
						Wydatki biurowe: <strong>{data.wydatkiBiurowe.toFixed(2)} zł</strong>
					</p>
					{data.expensesFromInvoices > 0 && (
						<p style={{ margin: '2px 0', fontSize: '12px', color: '#6b7280' }}>
							Wydatki (faktury): <strong>{data.expensesFromInvoices.toFixed(2)} zł</strong>
						</p>
					)}
				</div>
			</div>
		);
	}
	return null;
};

// Formatowanie waluty
const formatCurrency = (value: number): string => {
	return new Intl.NumberFormat('pl-PL', {
		style: 'currency',
		currency: 'PLN',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
};

export function RevenueChart({ year = 2026, title = "Przychody i wydatki" }: RevenueChartProps) {
	const [data, setData] = useState<RevenueData[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedYear, setSelectedYear] = useState(year);
	const [error, setError] = useState<string | null>(null);
	const [chartType, setChartType] = useState<'bar' | 'stack'>('bar');
	const [showDetails, setShowDetails] = useState(false);
	const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
	const [hoveredBar, setHoveredBar] = useState<string | null>(null);

	const fetchData = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("accessToken");

			// console.log(`[RevenueChart] Pobieram dane dla roku ${selectedYear}...`);

			// ============================================
			// 1. Pobierz dane główne (przychody/wydatki)
			// ============================================
			const response = await fetch(`/api/revenue?year=${selectedYear}`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const result = await response.json();
			// console.log('[RevenueChart] Revenue data:', result);

			// ============================================
			// 2. Pobierz dane kategorii
			// ============================================
			let categoriesData = null;
			try {
				const categoriesResponse = await fetch(`/api/revenue/categories?year=${selectedYear}`, {
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					}
				});

				if (categoriesResponse.ok) {
					const categoriesResult = await categoriesResponse.json();
					// console.log('[RevenueChart] Categories data:', categoriesResult);
					categoriesData = categoriesResult.data;
				} else {
					console.warn('[RevenueChart] Nie udało się pobrać kategorii:', categoriesResponse.status);
				}
			} catch (err) {
				console.warn('[RevenueChart] Błąd pobierania kategorii:', err);
			}

			// ============================================
			// 3. Połącz dane
			// ============================================
			if (result.success && result.data && result.data.months) {
				const mappedData = result.data.months.map((item: any) => {
					// Znajdź dane kategorii dla tego miesiąca
					const categoryData = categoriesData?.find((c: any) => c.month === item.month);

					return {
						month: item.month,
						monthName: item.monthName || item.month,
						revenue: item.revenue || 0,
						expenses: item.expenses || 0,
						profit: (item.revenue || 0) - (item.expenses || 0),
						skladki: categoryData?.Składki || 0,
						granty: categoryData?.Granty || 0,
						darowizny: categoryData?.Darowizny || 0,
						faktury: categoryData?.Faktury || 0,
						inne: categoryData?.['Inne przychody'] || 0,
						expensesFromInvoices: categoryData?.['Wydatki (faktury)'] || 0,
						wydatkiBiurowe: categoryData?.['Wydatki biurowe'] || 0,
					};
				});

				// console.log('[RevenueChart] Mapped data:', mappedData);
				setData(mappedData);
			}
		} catch (error) {
			console.error('[RevenueChart] Błąd:', error);
			setError(error instanceof Error ? error.message : 'Błąd pobierania danych');
			toast.error('Nie udało się pobrać danych');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [selectedYear]);

	if (loading) {
		return (
			<div style={{ padding: '40px', textAlign: 'center' }}>
				<div style={{
					width: '32px',
					height: '32px',
					border: '3px solid #e5e7eb',
					borderTopColor: '#4A6FE8',
					borderRadius: '50%',
					animation: 'spin 0.8s linear infinite',
					margin: '0 auto 10px'
				}} />
				<p style={{ color: '#6b7280' }}>Ładowanie danych...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div style={{ padding: '20px', textAlign: 'center', color: '#dc2626' }}>
				<p>{error}</p>
				<button
					onClick={fetchData}
					style={{
						marginTop: '8px',
						padding: '6px 16px',
						background: '#4A6FE8',
						color: 'white',
						border: 'none',
						borderRadius: '6px',
						cursor: 'pointer'
					}}
				>
					Spróbuj ponownie
				</button>
			</div>
		);
	}

	if (!data || data.length === 0) {
		return (
			<div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
				<p>Brak danych dla roku {selectedYear}</p>
			</div>
		);
	}

	const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
	const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);
	const totalProfit = totalRevenue - totalExpenses;
	const totalSkladki = data.reduce((sum, d) => sum + d.skladki, 0);
	const totalGranty = data.reduce((sum, d) => sum + d.granty, 0);
	const totalDarowizny = data.reduce((sum, d) => sum + d.darowizny, 0);

	const handleBarClick = (data: any) => {
		if (data && data.activePayload) {
			const month = data.activePayload[0].payload.monthName;
			setSelectedMonth(selectedMonth === month ? null : month);
			setShowDetails(true);
		}
	};

	return (
		<div style={{
			background: 'white',
			borderRadius: '12px',
			padding: '24px',
			border: '1px solid #e5e7eb',
			boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
		}}>
			{/* Nagłówek */}
			<div style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				marginBottom: '20px',
				flexWrap: 'wrap',
				gap: '12px',
			}}>
				<div>
					<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
						{title}
					</h2>
					<p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
						Rok {selectedYear}
					</p>
				</div>

				<div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
					<select
						value={selectedYear}
						onChange={(e) => setSelectedYear(Number(e.target.value))}
						style={{
							padding: '6px 12px',
							border: '1px solid #e5e7eb',
							borderRadius: '6px',
							fontSize: '14px',
							background: 'white',
							cursor: 'pointer',
						}}
					>
						{[2023, 2024, 2025, 2026, 2027].map((y) => (
							<option key={y} value={y}>{y}</option>
						))}
					</select>

					<button
						onClick={() => setChartType(chartType === 'bar' ? 'stack' : 'bar')}
						style={{
							padding: '6px 12px',
							border: '1px solid #e5e7eb',
							borderRadius: '6px',
							fontSize: '14px',
							background: 'white',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '4px',
						}}
					>
						{chartType === 'bar' ? 'Grupowany' : 'Skumulowany'}
					</button>

					<button
						onClick={fetchData}
						style={{
							padding: '6px 12px',
							border: '1px solid #e5e7eb',
							borderRadius: '6px',
							fontSize: '14px',
							background: 'white',
							cursor: 'pointer',
						}}
					>
						Odśwież
					</button>
				</div>
			</div>

			{/* Podsumowanie */}
			<div style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
				gap: '12px',
				marginBottom: '20px',
				padding: '16px',
				background: '#f9fafb',
				borderRadius: '8px',
			}}>
				<div style={{ textAlign: 'center' }}>
					<p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Przychody</p>
					<p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#22C55E' }}>
						{formatCurrency(totalRevenue)}
					</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Wydatki</p>
					<p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#EF4444' }}>
						{formatCurrency(totalExpenses)}
					</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Zysk</p>
					<p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#10B981' }}>
						{formatCurrency(totalProfit)}
					</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Składki</p>
					<p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#4A6FE8' }}>
						{formatCurrency(totalSkladki)}
					</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Granty</p>
					<p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#8B5CF6' }}>
						{formatCurrency(totalGranty)}
					</p>
				</div>
				<div style={{ textAlign: 'center' }}>
					<p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Darowizny</p>
					<p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#F59E0B' }}>
						{formatCurrency(totalDarowizny)}
					</p>
				</div>
			</div>

			{/* Wykres */}
			<div style={{ width: '100%', height: '400px' }}>
				<ResponsiveContainer>
					<ComposedChart
						data={data}
						margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
						onClick={handleBarClick}
					>
						<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />

						<XAxis
							dataKey="monthName"
							tick={{ fill: '#6b7280', fontSize: 12 }}
							axisLine={{ stroke: '#e5e7eb' }}
							tickLine={false}
						/>

						<YAxis
							tickFormatter={(value) => `${value} zł`}
							tick={{ fill: '#6b7280', fontSize: 12 }}
							axisLine={{ stroke: '#e5e7eb' }}
							tickLine={false}
						/>

						<Tooltip content={<CustomTooltip />} />

						<Legend
							verticalAlign="top"
							height={36}
							formatter={(value) => {
								const labels: Record<string, string> = {
									skladki: 'Składki',
									granty: 'Granty',
									darowizny: 'Darowizny',
									faktury: 'Faktury',
									inne: 'Inne',
									wydatkiBiurowe: 'Wydatki biurowe',
								};
								return labels[value] || value;
							}}
						/>

						{chartType === 'bar' ? (
							// Wykres GRUPOWANY - BEZ stackId
							<>
								<Bar
									dataKey="skladki"
									fill={COLORS.skladki}           // <-- USUŃ stackId="a"
									name="skladki"
									radius={[4, 4, 0, 0]}
									barSize={30}
									onMouseEnter={(data: any) => {
										if (data && data.payload) {
											setHoveredBar(data.payload.monthName);
										}
									}}
									onMouseLeave={() => setHoveredBar(null)}
								>
									{data.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={entry.monthName === selectedMonth ? '#2563EB' : COLORS.skladki}
											opacity={hoveredBar && hoveredBar !== entry.monthName ? 0.6 : 1}
										/>
									))}
								</Bar>
								<Bar
									dataKey="granty"
									fill={COLORS.granty}            // <-- USUŃ stackId="a"
									name="granty"
									radius={[4, 4, 0, 0]}
									barSize={30}
								>
									{data.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={entry.monthName === selectedMonth ? '#7C3AED' : COLORS.granty}
											opacity={hoveredBar && hoveredBar !== entry.monthName ? 0.6 : 1}
										/>
									))}
								</Bar>
								<Bar
									dataKey="darowizny"
									fill={COLORS.darowizny}         // <-- USUŃ stackId="a"
									name="darowizny"
									radius={[4, 4, 0, 0]}
									barSize={30}
								>
									{data.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={entry.monthName === selectedMonth ? '#D97706' : COLORS.darowizny}
											opacity={hoveredBar && hoveredBar !== entry.monthName ? 0.6 : 1}
										/>
									))}
								</Bar>
								<Bar
									dataKey="faktury"
									fill={COLORS.faktury}           // <-- USUŃ stackId="a"
									name="faktury"
									radius={[4, 4, 0, 0]}
									barSize={30}
								>
									{data.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={entry.monthName === selectedMonth ? '#DB2777' : COLORS.faktury}
											opacity={hoveredBar && hoveredBar !== entry.monthName ? 0.6 : 1}
										/>
									))}
								</Bar>
								<Bar
									dataKey="inne"
									fill={COLORS.inne}              // <-- USUŃ stackId="a"
									name="inne"
									radius={[4, 4, 0, 0]}
									barSize={30}
								>
									{data.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={entry.monthName === selectedMonth ? '#4B5563' : COLORS.inne}
											opacity={hoveredBar && hoveredBar !== entry.monthName ? 0.6 : 1}
										/>
									))}
								</Bar>
								{/* DODAJ NOWY BAR DLA WYDATKÓW BIUROWYCH - BEZ stackId */}
								<Bar
									dataKey="wydatkiBiurowe"
									fill={COLORS.wydatkiBiurowe}    // <-- USUŃ stackId="a"
									name="Wydatki biurowe"
									radius={[4, 4, 0, 0]}
									barSize={30}
								>
									{data.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={entry.monthName === selectedMonth ? '#EA580C' : COLORS.wydatkiBiurowe}
											opacity={hoveredBar && hoveredBar !== entry.monthName ? 0.6 : 1}
										/>
									))}
								</Bar>
							</>
						) : (
							// Wykres SKUMULOWANY (stacked) - Z stackId="a"
							<>
								<Bar
									dataKey="skladki"
									stackId="a"                    // <-- stackId TYLKO tutaj!
									fill={COLORS.skladki}
									name="skladki"
									radius={[4, 4, 0, 0]}
									barSize={30}
								/>
								<Bar
									dataKey="granty"
									stackId="a"                    // <-- stackId TYLKO tutaj!
									fill={COLORS.granty}
									name="granty"
									radius={[4, 4, 0, 0]}
									barSize={30}
								/>
								<Bar
									dataKey="darowizny"
									stackId="a"                    // <-- stackId TYLKO tutaj!
									fill={COLORS.darowizny}
									name="darowizny"
									radius={[4, 4, 0, 0]}
									barSize={30}
								/>
								<Bar
									dataKey="faktury"
									stackId="a"                    // <-- stackId TYLKO tutaj!
									fill={COLORS.faktury}
									name="faktury"
									radius={[4, 4, 0, 0]}
									barSize={30}
								/>
								<Bar
									dataKey="inne"
									stackId="a"                    // <-- stackId TYLKO tutaj!
									fill={COLORS.inne}
									name="inne"
									radius={[4, 4, 0, 0]}
									barSize={30}
								/>
								<Bar
									dataKey="wydatkiBiurowe"
									stackId="a"                    // <-- stackId TYLKO tutaj!
									fill={COLORS.wydatkiBiurowe}
									name="Wydatki biurowe"
									radius={[4, 4, 0, 0]}
									barSize={30}
								/>
							</>
						)}

						{/* Linia zysku */}
						<Line
							type="monotone"
							dataKey="profit"
							stroke={COLORS.profit}
							strokeWidth={2}
							name="Zysk"
							dot={{
								fill: COLORS.profit,
								r: 4,
								onMouseEnter: (data: any) => setHoveredBar(data.monthName),
								onMouseLeave: () => setHoveredBar(null),
							}}
							activeDot={{ r: 6 }}
						/>
					</ComposedChart>
				</ResponsiveContainer>
			</div>

			{/* Szczegóły po kliknięciu */}
			{showDetails && selectedMonth && (
				<div style={{
					marginTop: '16px',
					padding: '16px',
					background: '#f0f4ff',
					borderRadius: '8px',
					border: '1px solid #dbeafe',
				}}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<h4 style={{ margin: 0, color: '#1f2937' }}>
							Szczegóły dla: {selectedMonth}
						</h4>
						<button
							onClick={() => { setShowDetails(false); setSelectedMonth(null); }}
							style={{
								background: 'none',
								border: 'none',
								fontSize: '18px',
								cursor: 'pointer',
								color: '#6b7280'
							}}
						>
							✕
						</button>
					</div>
					<div style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
						gap: '8px',
						marginTop: '8px',
					}}>
						{data.filter(d => d.monthName === selectedMonth).map((d, i) => (
							<div key={i}>
								<p style={{ margin: '4px 0', fontSize: '14px' }}>
									Przychód: <strong>{formatCurrency(d.revenue)}</strong>
								</p>
								<p style={{ margin: '4px 0', fontSize: '14px' }}>
									Wydatki: <strong>{formatCurrency(d.expenses)}</strong>
								</p>
								<p style={{ margin: '4px 0', fontSize: '14px', color: '#10B981' }}>
									Zysk: <strong>{formatCurrency(d.profit)}</strong>
								</p>
								<p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
									Składki: {formatCurrency(d.skladki)}
								</p>
								<p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
									Granty: {formatCurrency(d.granty)}
								</p>
								<p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
									Darowizny: {formatCurrency(d.darowizny)}
								</p>
								<p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>
									Faktury: {formatCurrency(d.faktury)}
								</p>
							</div>
						))}
					</div>
				</div>
			)}

			<style>{`
				@keyframes spin {
					to { transform: rotate(360deg); }
				}
				.recharts-bar-rectangle:hover {
					cursor: pointer;
					opacity: 0.8;
				}
			`}</style>
		</div>
	);
}