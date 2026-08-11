import { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
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
}

const COLORS = ['#4A6FE8', '#5B7FF0', '#6C8FF8', '#7D9FFF', '#8EAFE8', '#9FBFF0'];

interface RevenueChartProps {
    year?: number;
    title?: string;
}

export function RevenueChart({ year = new Date().getFullYear(), title = 'Przychód miesięczny' }: RevenueChartProps) {
    const [data, setData] = useState<RevenueData | null>(null);
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
                
                const response = await api.get(`/api/revenue?year=${selectedYear}`);
                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    setError('Nie udało się pobrać danych');
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

    const chartData = data.months.map((item: MonthlyRevenue) => ({
        name: item.month.substring(0, 3),
        month: item.month,
        revenue: item.revenue,
    }));

    const maxValue = Math.max(...chartData.map((item: { revenue: number }) => item.revenue));
    const yAxisMax = Math.ceil(maxValue / 10000) * 10000 + 5000;

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
                    <div style={{ fontSize: '14px' }}>
                        <span style={{ color: '#6B7280' }}>Średnia: </span>
                        <span style={{ fontWeight: 'bold', color: '#10B981' }}>
                            {formatCurrency(data.averageRevenue)}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ width: '100%', height: '350px' }}>
                <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={false}
                        />
                        <YAxis 
                            tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={false}
                            domain={[0, yAxisMax]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                            dataKey="revenue" 
                            fill="#4A6FE8" 
                            radius={[6, 6, 0, 0]} 
                            name="Przychód"
                        >
                            {chartData.map((_entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

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
                <span>📊 {data.months.length} miesięcy</span>
                <span>
                    {data.months.length > 1 && 
                     data.months[data.months.length - 1].revenue > data.months[0].revenue 
                        ? '📈 Trend wzrostowy' 
                        : '📉 Trend spadkowy'
                    }
                </span>
                <span>💰 Łączny przychód: {formatCurrency(data.totalRevenue)}</span>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}