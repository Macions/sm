import { useState, useEffect } from "react";
import {
	Bar,
	BarChart,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from "recharts";
import toast from "react-hot-toast";

interface MeetingsChartProps {
	year?: number;
	title?: string;
}

interface MeetingData {
	year: number;
	month: number;
	count: number;
}

const MONTH_NAMES = [
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

const COLORS = {
	bar: "#4A6FE8",
	barHover: "#2563EB",
};

const CustomTooltip = ({ active, payload }: any) => {
	if (active && payload && payload.length) {
		const data = payload[0].payload;
		return (
			<div
				style={{
					backgroundColor: "white",
					padding: "16px",
					border: "1px solid #e5e7eb",
					borderRadius: "12px",
					boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
					minWidth: "180px",
				}}
			>
				<p
					style={{
						margin: "0 0 8px 0",
						fontWeight: "bold",
						fontSize: "16px",
						color: "#1f2937",
					}}
				>
					{data.monthName} {data.year}
				</p>
				<div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "8px" }}>
					<p style={{ margin: "4px 0", fontSize: "14px", color: "#4A6FE8" }}>
						Spotkania: <strong>{data.count}</strong>
					</p>
				</div>
			</div>
		);
	}
	return null;
};

export function MeetingsChart({
	year = 2026,
	title = "Spotkania w SM",
}: MeetingsChartProps) {
	const [data, setData] = useState<MeetingData[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedYear, setSelectedYear] = useState(year);
	const [error, setError] = useState<string | null>(null);
	const [hoveredBar, setHoveredBar] = useState<string | null>(null);

	const fetchData = async () => {
		try {
			setLoading(true);
			setError(null);

			const token = localStorage.getItem("accessToken");
			const response = await fetch("/api/admin/meetings-stats", {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const result = await response.json();

			if (!Array.isArray(result)) {
				throw new Error("Nieoczekiwany format danych");
			}

			// Mapuj na pełny rok — 12 miesięcy, brakujące = 0
			const byMonth = new Map<number, number>();
			result
				.filter((r: any) => r.year === selectedYear)
				.forEach((r: any) => {
					byMonth.set(r.month, r.count);
				});

			const mappedData: (MeetingData & { monthName: string })[] = [];
			for (let m = 1; m <= 12; m++) {
				mappedData.push({
					year: selectedYear,
					month: m,
					monthName: MONTH_NAMES[m - 1],
					count: byMonth.get(m) || 0,
				});
			}

			setData(mappedData as any);
		} catch (error) {
			console.error("[MeetingsChart] Błąd:", error);
			setError(
				error instanceof Error ? error.message : "Błąd pobierania danych",
			);
			toast.error("Nie udało się pobrać statystyk spotkań");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [selectedYear]);

	if (loading) {
		return (
			<div style={{ padding: "40px", textAlign: "center" }}>
				<div
					style={{
						width: "32px",
						height: "32px",
						border: "3px solid #e5e7eb",
						borderTopColor: "#4A6FE8",
						borderRadius: "50%",
						animation: "spin 0.8s linear infinite",
						margin: "0 auto 10px",
					}}
				/>
				<p style={{ color: "#6b7280" }}>Ładowanie danych...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div style={{ padding: "20px", textAlign: "center", color: "#dc2626" }}>
				<p>{error}</p>
				<button
					onClick={fetchData}
					style={{
						marginTop: "8px",
						padding: "6px 16px",
						background: "#4A6FE8",
						color: "white",
						border: "none",
						borderRadius: "6px",
						cursor: "pointer",
					}}
				>
					Spróbuj ponownie
				</button>
			</div>
		);
	}

	const totalMeetings = data.reduce((sum, d) => sum + d.count, 0);
	const maxMeetings = Math.max(...data.map((d) => d.count), 0);
	const bestMonth = data.find((d) => d.count === maxMeetings);
	const avgMeetings = totalMeetings / 12;

	return (
		<div
			style={{
				background: "white",
				borderRadius: "12px",
				padding: "24px",
				border: "1px solid #e5e7eb",
				boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
				marginBottom: "32px",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "20px",
					flexWrap: "wrap",
					gap: "12px",
				}}
			>
				<div>
					<h2
						style={{
							margin: 0,
							fontSize: "20px",
							fontWeight: "600",
							color: "#1f2937",
						}}
					>
						{title}
					</h2>
					<p
						style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#6b7280" }}
					>
						Rok {selectedYear}
					</p>
				</div>

				<div
					style={{
						display: "flex",
						gap: "12px",
						alignItems: "center",
						flexWrap: "wrap",
					}}
				>
					<select
						value={selectedYear}
						onChange={(e) => setSelectedYear(Number(e.target.value))}
						style={{
							padding: "6px 12px",
							border: "1px solid #e5e7eb",
							borderRadius: "6px",
							fontSize: "14px",
							background: "white",
							cursor: "pointer",
						}}
					>
						{[2023, 2024, 2025, 2026, 2027].map((y) => (
							<option key={y} value={y}>
								{y}
							</option>
						))}
					</select>

					<button
						onClick={fetchData}
						style={{
							padding: "6px 12px",
							border: "1px solid #e5e7eb",
							borderRadius: "6px",
							fontSize: "14px",
							background: "white",
							cursor: "pointer",
						}}
					>
						Odśwież
					</button>
				</div>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
					gap: "12px",
					marginBottom: "20px",
					padding: "16px",
					background: "#f9fafb",
					borderRadius: "8px",
				}}
			>
				<div style={{ textAlign: "center" }}>
					<p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
						Wszystkich spotkań
					</p>
					<p
						style={{
							margin: 0,
							fontSize: "22px",
							fontWeight: "bold",
							color: "#4A6FE8",
						}}
					>
						{totalMeetings}
					</p>
				</div>
				<div style={{ textAlign: "center" }}>
					<p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
						Średnia / miesiąc
					</p>
					<p
						style={{
							margin: 0,
							fontSize: "22px",
							fontWeight: "bold",
							color: "#10B981",
						}}
					>
						{avgMeetings.toFixed(1)}
					</p>
				</div>
				<div style={{ textAlign: "center" }}>
					<p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
						Najaktywniejszy miesiąc
					</p>
					<p
						style={{
							margin: 0,
							fontSize: "16px",
							fontWeight: "bold",
							color: "#F59E0B",
						}}
					>
						{bestMonth?.monthName || "—"} ({maxMeetings})
					</p>
				</div>
			</div>

			<div style={{ width: "100%", height: "400px" }}>
				<ResponsiveContainer>
					<BarChart
						data={data}
						margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="#e5e7eb"
							vertical={false}
						/>

						<XAxis
							dataKey="monthName"
							tick={{ fill: "#6b7280", fontSize: 12 }}
							axisLine={{ stroke: "#e5e7eb" }}
							tickLine={false}
						/>

						<YAxis
							allowDecimals={false}
							tick={{ fill: "#6b7280", fontSize: 12 }}
							axisLine={{ stroke: "#e5e7eb" }}
							tickLine={false}
						/>

						<Tooltip content={<CustomTooltip />} cursor={{ fill: "#f3f4f6" }} />

						<Bar
							dataKey="count"
							radius={[6, 6, 0, 0]}
							barSize={40}
							onMouseEnter={(data: any) => {
								if (data && data.monthName) {
									setHoveredBar(data.monthName);
								}
							}}
							onMouseLeave={() => setHoveredBar(null)}
						>
							{data.map((entry: any, index) => (
								<Cell
									key={`cell-${index}`}
									fill={
										hoveredBar === entry.monthName
											? COLORS.barHover
											: COLORS.bar
									}
									opacity={
										hoveredBar && hoveredBar !== entry.monthName ? 0.6 : 1
									}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</div>

			<style>{`
				@keyframes spin {
					to { transform: rotate(360deg); }
				}
			`}</style>
		</div>
	);
}
