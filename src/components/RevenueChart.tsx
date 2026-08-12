import { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ComposedChart,
    Line,
} from 'recharts';
import api from '@/api/axios';
import { logger } from '@/utils/logger';

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
    totalExpenses?: number;
    netProfit?: number;
}

interface RevenueChartProps {
    year?: number;
    title?: string;
}

const COLORS = {
    revenue: '#4A6FE8',
    expenses: '#EF4444',
    profit: '#10B981',
    składki: '#4A6FE8',
    granty: '#8B5CF6',
    darowizny: '#F59E0B',
    faktury: '#EC4899',
    inne: '#6B7280',
    wydatki: '#EF4444',
};

export function RevenueChart({ year = new Date().getFullYear(), title = 'Przychody i wydatki' }: RevenueChartProps) {
    const [data, setData] = useState<RevenueData | null>(null);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState(year);
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Pobierz główne dane
                const response = await api.get(`/revenue?year=${selectedYear}`);
                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    setError('Nie udało się pobrać danych');
                }

                // Pobierz dane kategorii
                const categoryResponse = await api.get(`/revenue/categories?year=${selectedYear}`);
                if (categoryResponse.data.success) {
                    setCategoryData(categoryResponse.data.data);
                }
            } catch (err: any) {
                setError(err.message || 'Błąd pobierania danych');
                logger.error('❌ Błąd pobierania przychodów:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedYear]);

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: 'PLN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-block',
                    width: '32px',
                    height: '32px',
                    border: '4px solid #e5e7eb',
                    borderTopColor: '#4A6FE8',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <p style={{ marginTop: '12px', color: '#6B7280' }}>Ładowanie danych...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#EF4444' }}>
                <p>❌ {error}</p>
            </div>
        );
    }

    if (!data || !data.months || data.months.length === 0) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                <p>Brak danych przychodów dla roku {selectedYear}</p>
            </div>
        );
    }

    // Przygotuj dane dla wykresu warstwowego
    const chartData = data.months.map((item: MonthlyRevenue) => ({
        name: item.month.substring(0, 3),
        month: item.month,
        revenue: item.revenue,
        expenses: item.expenses || 0,
        profit: item.profit || 0,
    }));

    const maxValue = Math.max(
        ...chartData.map((item) => Math.max(item.revenue, item.expenses || 0))
    );
    const yAxisMax = Math.ceil(maxValue * 1.2);

    // W tooltip - dodaj informację o wydatkach z faktur
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{
                    backgroundColor: 'white',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{data.month}</p>
                    <p style={{ margin: '4px 0', color: '#4A6FE8' }}>
                        Przychód: {formatCurrency(data.revenue)}
                    </p>
                    <p style={{ margin: '4px 0', color: '#EF4444' }}>
                        Wydatki (payments): {formatCurrency(data.expenses - (data.expensesFromInvoices || 0))}
                    </p>
                    {data.expensesFromInvoices > 0 && (
                        <p style={{ margin: '4px 0', color: '#F59E0B' }}>
                            Wydatki (faktury): {formatCurrency(data.expensesFromInvoices)}
                        </p>
                    )}
                    <p style={{ margin: '4px 0', color: '#EF4444' }}>
                        Wydatki łącznie: {formatCurrency(data.expenses || 0)}
                    </p>
                    <p style={{ margin: '4px 0', color: '#10B981' }}>
                        Zysk: {formatCurrency(data.profit || 0)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '12px',
            }}>
                <div>
                    <h2 style={{
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#1f2937',
                    }}>
                        {title}
                    </h2>
                    <p style={{
                        margin: '4px 0 0 0',
                        fontSize: '14px',
                        color: '#6B7280',
                    }}>
                        Rok {data.year}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                        {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <div style={{ fontSize: '14px' }}>
                        <span style={{ color: '#6B7280' }}>Suma: </span>
                        <span style={{ fontWeight: 'bold', color: '#4A6FE8' }}>
                            {formatCurrency(data.totalRevenue)}
                        </span>
                    </div>
                    {data.totalExpenses !== undefined && (
                        <div style={{ fontSize: '14px' }}>
                            <span style={{ color: '#6B7280' }}>Wydatki: </span>
                            <span style={{ fontWeight: 'bold', color: '#EF4444' }}>
                                {formatCurrency(data.totalExpenses)}
                            </span>
                        </div>
                    )}
                    {data.netProfit !== undefined && (
                        <div style={{ fontSize: '14px' }}>
                            <span style={{ color: '#6B7280' }}>Zysk netto: </span>
                            <span style={{ fontWeight: 'bold', color: '#10B981' }}>
                                {formatCurrency(data.netProfit)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ width: '100%', height: '400px' }}>
                <ResponsiveContainer>
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={(value: number) => `${value} zł`}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={false}
                            domain={[0, yAxisMax]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />

                        {/* Przychody - słupki */}
                        <Bar
                            dataKey="revenue"
                            fill={COLORS.revenue}
                            radius={[4, 4, 0, 0]}
                            name="Przychody"
                            barSize={30}
                        />

                        {/* Wydatki - słupki (ujemne) */}
                        <Bar
                            dataKey="expenses"
                            fill={COLORS.expenses}
                            radius={[4, 4, 0, 0]}
                            name="Wydatki"
                            barSize={30}
                        />

                        {/* Linia zysku */}
                        <Line
                            type="monotone"
                            dataKey="profit"
                            stroke={COLORS.profit}
                            strokeWidth={2}
                            name="Zysk netto"
                            dot={{ fill: COLORS.profit }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Sekcja z kategoriami */}
            {categoryData.length > 0 && (
                <div style={{ marginTop: '32px', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>
                        Struktura przychodów według kategorii
                    </h3>
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer>
                            <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    axisLine={{ stroke: '#e5e7eb' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    tickFormatter={(value: number) => `${value} zł`}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    axisLine={{ stroke: '#e5e7eb' }}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(Number(value))}
                                />
                                <Legend />
                                <Bar dataKey="Składki" stackId="a" fill={COLORS.składki} />
                                <Bar dataKey="Granty" stackId="a" fill={COLORS.granty} />
                                <Bar dataKey="Darowizny" stackId="a" fill={COLORS.darowizny} />
                                <Bar dataKey="Faktury" stackId="a" fill={COLORS.faktury} />
                                <Bar dataKey="Inne przychody" stackId="a" fill={COLORS.inne} />
                                <Bar dataKey="Wydatki" stackId="b" fill={COLORS.wydatki} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                color: '#6B7280',
                fontSize: '13px',
                flexWrap: 'wrap',
                gap: '8px',
            }}>
                <span>{data.months.filter(m => m.revenue > 0).length} miesięcy z przychodami</span>
                <span>
                    {data.netProfit && data.netProfit > 0 ? 'Zyskowny rok' : '📉 Stratny rok'}
                </span>
                <span>Łączny przychód: {formatCurrency(data.totalRevenue)}</span>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}