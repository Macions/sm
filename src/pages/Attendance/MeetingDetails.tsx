import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  X,
  Minus,
  Pencil,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { attendanceApi } from "../../api/attendance.api";
import type { AttendanceRecord, Meeting } from "../../api/attendance.api";
import styles from "./Attendance.module.css";

interface Props {
  meetingId: number;
  onBack: () => void;
}

type EditStatus = "present" | "absent" | "excused" | null;

type LocalRecord = AttendanceRecord & {
  dirty?: boolean;
  editStatus?: EditStatus;
};

export default function MeetingDetails({ meetingId, onBack }: Props) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [records, setRecords] = useState<LocalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);

  const loadMeeting = () => {
    setLoading(true);
    setError(null);
    setIsEditing(false);
    attendanceApi
      .getMeeting(meetingId)
      .then((data) => {
        setMeeting(data.meeting);
        setRecords(
          (data.records || []).map((r: AttendanceRecord) => ({
            ...r,
            dirty: false,
            editStatus: undefined,
          })),
        );
      })
      .catch((e) => setError(e?.response?.data?.error || "Błąd ładowania"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMeeting();
  }, [meetingId]);

  const startEditing = () => {
    const alreadyChecked = meeting?.attendance_checked === true;

    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        editStatus: alreadyChecked ? r.status : null,
        dirty: false,
        is_late: alreadyChecked ? r.is_late : false,
        note: alreadyChecked ? r.note : "",
      })),
    );
    setIsEditing(true);
    setSuccessMsg(null);
    setError(null);
  };

  const updateRecord = (id: number, patch: Partial<LocalRecord>) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch, dirty: true } : r)),
    );
    setSuccessMsg(null);
  };


  const setAll = (status: EditStatus) => {
    setRecords((prev) =>
      prev.map((r) => ({ ...r, editStatus: status, dirty: true })),
    );
    setSuccessMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const toSend = records
        .filter((r) => r.editStatus !== null && r.editStatus !== undefined)
        .map((r) => ({
          id: r.id,
          status: r.editStatus as "present" | "absent" | "excused",
          is_late: r.is_late,
          note: r.note,
        }));

      if (toSend.length === 0) {
        setError("Nie zaznaczono żadnego statusu do zapisania");
        setSaving(false);
        return;
      }

      await attendanceApi.updateRecords(meetingId, toSend);

      setMeeting((prev) =>
        prev ? { ...prev, attendance_checked: true } : prev,
      );

      setRecords((prev) =>
        prev.map((r) => ({
          ...r,
          status: (r.editStatus ?? r.status) as AttendanceRecord["status"],
          dirty: false,
          editStatus: undefined,
        })),
      );

      setSuccessMsg(
        `Zapisano zmiany (${toSend.length} ${toSend.length === 1 ? "osoba" : "osób"
        })`,
      );
      setTimeout(() => setSuccessMsg(null), 3000);
      setIsEditing(false);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Nie udało się zapisać");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    loadMeeting();
  };

  if (loading) return <p className={styles.loading}>Ładowanie spotkania…</p>;
  if (error && !meeting) return <p className={styles.error}>Błąd: {error}</p>;
  if (!meeting) return null;

  const alreadyChecked = meeting.attendance_checked === true;

  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const excusedCount = records.filter((r) => r.status === "excused").length;

  const selectedCount = records.filter(
    (r) => r.editStatus !== null && r.editStatus !== undefined,
  ).length;

  const dirtyCount = records.filter((r) => r.dirty).length;

  return (
    <div className={styles.details}>
      <button className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} />
        <span>Wróć do listy</span>
      </button>

      <div className={styles.detailsHeader}>
        <div>
          <h2 className={styles.detailsTitle}>{meeting.title}</h2>
          <div className={styles.detailsMeta}>
            <span>{meeting.pillar_label}</span>
            {meeting.subteam_name && (
              <>
                <span>•</span>
                <span className={styles.subteamBadge}>
                  {meeting.subteam_name}
                </span>
              </>
            )}
            <span>•</span>
            <span>
              {new Date(meeting.meeting_date).toLocaleDateString("pl-PL", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className={styles.detailsSummary}>
          {alreadyChecked ? (
            <>
              <span className={styles.statPresent}>
                <Check size={16} /> {presentCount}
              </span>
              <span className={styles.statAbsent}>
                <X size={16} /> {absentCount}
              </span>
              <span className={styles.statExcused}>
                <Minus size={16} /> {excusedCount}
              </span>
            </>
          ) : (
            <span className={styles.statNotChecked}>
              <Clock size={16} />
              <span>Frekwencja nie została jeszcze sprawdzona</span>
            </span>
          )}
        </div>
      </div>


      {!isEditing && (
        <>
          <div className={styles.previewActions}>
            {alreadyChecked ? (
              <button
                className={styles.actionBtnPrimary}
                onClick={startEditing}
              >
                <Pencil size={16} />
                <span>Edytuj frekwencję</span>
              </button>
            ) : (
              <button
                className={styles.actionBtnPrimary}
                onClick={startEditing}
              >
                <CheckCircle2 size={16} />
                <span>Sprawdź frekwencję</span>
              </button>
            )}
          </div>

          <div className={styles.recordsHeader}>
            <span>Członek</span>
            <span>Status</span>
            <span>Spóźnienie</span>
            <span>Uwaga</span>
          </div>

          <div className={styles.recordsList}>
            {records.map((r) => (
              <div key={r.id} className={styles.recordRow}>
                <div className={styles.recordName}>
                  {r.last_name} {r.first_name}
                </div>

                <div className={styles.recordStatus}>
                  {alreadyChecked ? (
                    <span
                      className={
                        r.status === "present"
                          ? styles.statusBadgePresent
                          : r.status === "absent"
                            ? styles.statusBadgeAbsent
                            : styles.statusBadgeExcused
                      }
                    >
                      {r.status === "present" ? (
                        <>
                          <Check size={14} /> Obecny
                        </>
                      ) : r.status === "absent" ? (
                        <>
                          <X size={14} /> Nieobecny
                        </>
                      ) : (
                        <>
                          <Minus size={14} /> Usprawiedliwiony
                        </>
                      )}
                    </span>
                  ) : (
                    <span className={styles.statusNotChecked}>
                      <Circle size={12} /> nie sprawdzono
                    </span>
                  )}
                </div>

                <div className={styles.recordLate}>
                  {alreadyChecked && r.is_late ? (
                    <>
                      <AlertTriangle size={14} /> Spóźniony
                    </>
                  ) : (
                    "—"
                  )}
                </div>

                <div className={styles.recordNoteReadonly}>
                  {alreadyChecked ? r.note || "—" : "—"}
                </div>
              </div>
            ))}
          </div>

          {successMsg && <div className={styles.success}>{successMsg}</div>}
          {error && <div className={styles.error}>{error}</div>}
        </>
      )}


      {isEditing && (
        <>

          <div className={styles.bulkActions}>
            <button
              type="button"
              className={styles.bulkBtn}
              onClick={() => setAll("present")}
            >
              <Check size={14} /> Wszyscy obecni
            </button>
            <button
              type="button"
              className={styles.bulkBtn}
              onClick={() => setAll("absent")}
            >
              <X size={14} /> Wszyscy nieobecni
            </button>
            <button
              type="button"
              className={styles.bulkBtn}
              onClick={() => setAll("excused")}
            >
              <Minus size={14} /> Wszyscy usprawiedliwieni
            </button>
            <button
              type="button"
              className={styles.bulkBtnClear}
              onClick={() => setAll(null)}
            >
              <X size={14} /> Wyczyść
            </button>
          </div>

          <div className={styles.recordsHeader}>
            <span>Członek</span>
            <span>Status</span>
            <span>Spóźnienie</span>
            <span>Uwaga</span>
          </div>

          <div className={styles.recordsList}>
            {records.map((r) => (
              <div
                key={r.id}
                className={`${styles.recordRow} ${r.dirty ? styles.recordDirty : ""
                  }`}
              >
                <div className={styles.recordName}>
                  {r.last_name} {r.first_name}
                  {r.dirty && <span className={styles.dirtyDot}>●</span>}
                </div>

                <div className={styles.recordStatus}>
                  {(["present", "absent", "excused"] as const).map((s) => (
                    <label
                      key={s}
                      className={
                        r.editStatus === s
                          ? styles.statusActive
                          : styles.statusLabel
                      }
                    >
                      <input
                        type="radio"
                        name={`status-${r.id}`}
                        value={s}
                        checked={r.editStatus === s}
                        onChange={() =>
                          updateRecord(r.id, { editStatus: s })
                        }
                      />
                      {s === "present"
                        ? "Obecny"
                        : s === "absent"
                          ? "Nieobecny"
                          : "Uspraw."}
                    </label>
                  ))}

                  {(r.editStatus === null || r.editStatus === undefined) && (
                    <span className={styles.statusEmpty}>
                      <Circle size={12} /> nie wybrano
                    </span>
                  )}
                </div>

                <label className={styles.recordLate}>
                  <input
                    type="checkbox"
                    checked={r.is_late}
                    onChange={(e) =>
                      updateRecord(r.id, { is_late: e.target.checked })
                    }
                    disabled={r.editStatus !== "present"}
                  />
                  Spóźniony
                </label>

                <input
                  type="text"
                  className={styles.recordNote}
                  placeholder="Notatka…"
                  value={r.note}
                  onChange={(e) =>
                    updateRecord(r.id, { note: e.target.value })
                  }
                />
              </div>
            ))}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <div className={styles.actionsInfo}>
              Wybrano: <strong>{selectedCount}</strong> / {records.length}
              {dirtyCount > 0 && (
                <span className={styles.dirtyInfo}>
                  {" "}
                  • zmieniono: {dirtyCount}
                </span>
              )}
            </div>
            <button
              className={styles.cancelBtn}
              onClick={handleCancel}
              disabled={saving}
            >
              Anuluj
            </button>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving || selectedCount === 0}
            >
              {saving
                ? "Zapisywanie…"
                : selectedCount > 0
                  ? `Zapisz zmiany (${selectedCount})`
                  : "Zapisz zmiany"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}