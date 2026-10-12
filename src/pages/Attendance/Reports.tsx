import { useEffect, useState } from "react";
import { attendanceApi } from "../../api/attendance.api";
import type { SummaryPillar } from "../../api/attendance.api";
import styles from "./Attendance.module.css";

export default function Reports() {
    const [months, setMonths] = useState(12);
    const [summary, setSummary] = useState<SummaryPillar[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        attendanceApi
            .getSummary({ months })
            .then((d) => setSummary(d.summary || []))
            .catch((e) =>
                setError(e?.response?.data?.error || "Nie udało się pobrać raportu"),
            )
            .finally(() => setLoading(false));
    }, [months]);

    const getBarColor = (pct: number) => {
        if (pct >= 75) return "#22c55e";
        if (pct >= 50) return "#eab308";
        return "#ef4444";
    };

    return (
        <div>
            <div className={styles.reportControls}>
                <label>
                    Zakres:
                    <select
                        value={months}
                        onChange={(e) => setMonths(parseInt(e.target.value))}
                    >
                        <option value={3}>Ostatnie 3 miesiące</option>
                        <option value={6}>Ostatnie 6 miesięcy</option>
                        <option value={12}>Ostatnie 12 miesięcy</option>
                        <option value={24}>Ostatnie 24 miesiące</option>
                    </select>
                </label>
            </div>

            {loading ? (
                <p className={styles.loading}>Ładowanie raportu…</p>
            ) : error ? (
                <p className={styles.error}>{error}</p>
            ) : summary.length === 0 ? (
                <p className={styles.empty}>Brak danych w tym zakresie.</p>
            ) : (
                <div className={styles.tableWrap}>
                    <table className={styles.reportTable}>
                        <thead>
                            <tr>
                                <th>Filar</th>
                                <th>Frekwencja</th>
                                <th>Spotkań</th>
                                <th>Członków</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.map((p) => (
                                <tr key={p.pillar_id}>
                                    <td className={styles.cellPillar}>{p.pillar_label}</td>
                                    <td>
                                        <div className={styles.barWrap}>
                                            <div
                                                className={styles.bar}
                                                style={{
                                                    width: `${Math.min(p.attendance_percentage ?? 0, 100)}%`,
                                                    background: getBarColor(p.attendance_percentage ?? 0),
                                                }}
                                            />
                                            <span className={styles.barLabel}>
                                                {(p.attendance_percentage ?? 0).toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className={styles.cellNumber}>{p.meetings_count}</td>
                                    <td className={styles.cellNumber}>{p.members_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}