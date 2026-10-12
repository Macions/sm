import { useEffect, useState } from "react";
import { attendanceApi } from "../../api/attendance.api";
import type { Pillar, Meeting, Subteam } from "../../api/attendance.api";
import MeetingDetails from "./MeetingDetails";
import Reports from "./Reports";
import CreateMeetingModal from "./CreateMeetingModal";
import styles from "./Attendance.module.css";

type Tab = "current" | "archive" | "reports";

export default function AttendancePage() {
  const [tab, setTab] = useState<Tab>("current");
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [selectedPillarId, setSelectedPillarId] = useState<number | null>(null);

  // ⬅️ NOWE — podzespoły
  const [subteams, setSubteams] = useState<Subteam[]>([]);
  const [selectedSubteamId, setSelectedSubteamId] = useState<number | null>(null);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ładuj filary raz przy montowaniu
  useEffect(() => {
    setLoading(true);
    attendanceApi
      .getPillars()
      .then((data) => {
        setPillars(data.pillars || []);
        if (data.pillars?.length > 0) {
          const firstWithMeetings = data.pillars.find(
            (p: Pillar) => p.meetings_count > 0,
          );
          setSelectedPillarId(
            firstWithMeetings?.pillar_id ?? data.pillars[0].pillar_id,
          );
        }
      })
      .catch((e) =>
        setError(e?.response?.data?.error || "Nie udało się pobrać filarów"),
      )
      .finally(() => setLoading(false));
  }, []);

  // Ładuj podzespoły gdy zmienia się filar
  useEffect(() => {
    if (!selectedPillarId) {
      setSubteams([]);
      setSelectedSubteamId(null);
      return;
    }

    attendanceApi
      .getSubteams(selectedPillarId)
      .then((data) => {
        setSubteams(data.subteams || []);
        setSelectedSubteamId(null); // reset filtra podzespołu
      })
      .catch(() => {
        setSubteams([]);
        setSelectedSubteamId(null);
      });
  }, [selectedPillarId]);

  // Ładuj spotkania gdy zmienia się filar, podzespół lub zakładka
  useEffect(() => {
    if (!selectedPillarId) return;
    if (selectedMeetingId) return;
    if (tab === "reports") return;

    setMeetingsLoading(true);
    attendanceApi
      .getMeetings({
        pillarId: selectedPillarId,
        subteamId: selectedSubteamId ?? undefined,   // ⬅️ NOWE
        scope: tab === "current" ? "current" : "archive",
      })
      .then((data) => setMeetings(data.meetings || []))
      .catch((e) =>
        setError(e?.response?.data?.error || "Nie udało się pobrać spotkań"),
      )
      .finally(() => setMeetingsLoading(false));
  }, [selectedPillarId, selectedSubteamId, selectedMeetingId, tab]);

  const reloadMeetings = () => {
    if (!selectedPillarId) return;
    if (tab === "reports") return;
    attendanceApi
      .getMeetings({
        pillarId: selectedPillarId,
        subteamId: selectedSubteamId ?? undefined,
        scope: tab === "current" ? "current" : "archive",
      })
      .then((d) => setMeetings(d.meetings || []));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Ładowanie filarów…</p>
      </div>
    );
  }

  if (error && pillars.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Frekwencja</h1>

      {/* Zakładki Aktualne / Archiwum / Raporty */}
      <div className={styles.tabs}>
        <button
          className={tab === "current" ? styles.tabActive : styles.tab}
          onClick={() => {
            setTab("current");
            setSelectedMeetingId(null);
          }}
        >
          Aktualne
        </button>
        <button
          className={tab === "archive" ? styles.tabActive : styles.tab}
          onClick={() => {
            setTab("archive");
            setSelectedMeetingId(null);
          }}
        >
          Archiwum
        </button>
        <button
          className={tab === "reports" ? styles.tabActive : styles.tab}
          onClick={() => {
            setTab("reports");
            setSelectedMeetingId(null);
          }}
        >
          Raporty
        </button>
      </div>

      {/* Raporty */}
      {tab === "reports" && <Reports />}

      {/* Aktualne / Archiwum */}
      {tab !== "reports" && (
        <>
          {/* Pasek filarów */}
          <div className={styles.pillarTabs}>
            {pillars.map((p) => (
              <button
                key={p.pillar_id}
                className={
                  selectedPillarId === p.pillar_id
                    ? styles.pillarActive
                    : styles.pillar
                }
                onClick={() => {
                  setSelectedPillarId(p.pillar_id);
                  setSelectedMeetingId(null);
                }}
              >
                <span>{p.pillar_label}</span>
                <span className={styles.pillarPercent}>
                  {p.attendance_percentage.toFixed(1)}%
                </span>
              </button>
            ))}
          </div>

          {/* ⬇️⬇️⬇️ NOWE — pasek podzespołów ⬇️⬇️⬇️ */}
          {subteams.length > 0 && (
            <div className={styles.subteamTabs}>
              <button
                className={
                  selectedSubteamId === null
                    ? styles.subteamActive
                    : styles.subteam
                }
                onClick={() => {
                  setSelectedSubteamId(null);
                  setSelectedMeetingId(null);
                }}
              >
                Cały filar
              </button>
              {subteams.map((st) => (
                <button
                  key={st.id}
                  className={
                    selectedSubteamId === st.id
                      ? styles.subteamActive
                      : styles.subteam
                  }
                  onClick={() => {
                    setSelectedSubteamId(st.id);
                    setSelectedMeetingId(null);
                  }}
                >
                  <span>{st.name}</span>
                  <span className={styles.subteamCount}>
                    {st.meetings_count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Szczegóły spotkania LUB lista spotkań */}
          {selectedMeetingId ? (
            <MeetingDetails
              meetingId={selectedMeetingId}
              onBack={() => {
                setSelectedMeetingId(null);
                reloadMeetings();
              }}
            />
          ) : meetingsLoading ? (
            <p className={styles.loading}>Ładowanie spotkań…</p>
          ) : (
            <>
              <div className={styles.meetingsHeader}>
                <span className={styles.meetingsHeaderTitle}>
                  {tab === "current" ? "Aktualne spotkania" : "Archiwum"} (
                  {meetings.length})
                </span>
                {tab === "current" && (
                  <button
                    className={styles.addMeetingBtn}
                    onClick={() => setShowCreateModal(true)}
                    disabled={!selectedPillarId}
                  >
                    + Nowe spotkanie
                  </button>
                )}
              </div>

              <div className={styles.meetingsList}>
                {meetings.length === 0 ? (
                  <p className={styles.empty}>
                    {tab === "current"
                      ? "Brak aktualnych spotkań."
                      : "Brak zarchiwizowanych spotkań."}
                  </p>
                ) : (
                  meetings.map((m) => (
                    <div
                      key={m.id}
                      className={styles.meetingRow}
                      onClick={() => setSelectedMeetingId(m.id)}
                    >
                      <div className={styles.meetingLeft}>
                        <div className={styles.meetingTitle}>{m.title}</div>
                        <div className={styles.meetingDate}>
                          {new Date(m.meeting_date).toLocaleDateString("pl-PL", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                          {m.subteam_name && (
                            <span className={styles.meetingSubteamBadge}>
                              {m.subteam_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={styles.meetingRight}>
                        {!m.attendance_checked && (
                          <span className={styles.statusBadgePending}>
                            Nie sprawdzone
                          </span>
                        )}
                        {m.attendance_checked && (
                          <span className={styles.statusBadgeChecked}>
                            Sprawdzone
                          </span>
                        )}

                        <div className={styles.meetingStats}>
                          <span className={styles.statPresent}>
                            ✓ {m.present_count}
                          </span>
                          <span className={styles.statAbsent}>
                            ✗ {m.absent_count}
                          </span>
                          <span className={styles.statExcused}>
                            ⊘ {m.excused_count}
                          </span>
                        </div>

                        <button
                          className={
                            m.attendance_checked
                              ? styles.actionBtnSecondary
                              : styles.actionBtnPrimary
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMeetingId(m.id);
                          }}
                        >
                          {m.attendance_checked ? "Edytuj" : "Sprawdź"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Modal tworzenia */}
      {showCreateModal && selectedPillarId && (
        <CreateMeetingModal
          pillarId={selectedPillarId}
          subteams={subteams}
          defaultSubteamId={selectedSubteamId}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            reloadMeetings();
          }}
        />
      )}
    </div>
  );
}