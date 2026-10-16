import { useState } from "react";
import { attendanceApi } from "../../api/attendance.api";
import type { Subteam } from "../../api/attendance.api";
import styles from "./Attendance.module.css";

interface Props {
  pillarId: number;
  subteams: Subteam[];
  defaultSubteamId?: number | null;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateMeetingModal({
  pillarId,
  subteams,
  defaultSubteamId = null,
  onClose,
  onCreated,
}: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(today);
  const [subteamId, setSubteamId] = useState<number | null>(defaultSubteamId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Tytuł jest wymagany");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await attendanceApi.createMeeting({
        pillarId,
        subteamId,
        title: title.trim(),
        meetingDate,
      });
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.error || "Nie udało się utworzyć spotkania");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Nowe spotkanie</h2>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <label className={styles.modalField}>
            <span>Tytuł spotkania</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Spotkanie organizacyjne"
              autoFocus
              maxLength={200}
            />
          </label>

          <label className={styles.modalField}>
            <span>Data</span>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              required
            />
          </label>


          {subteams.length > 0 && (
            <label className={styles.modalField}>
              <span>Podzespół (opcjonalnie)</span>
              <select
                value={subteamId ?? ""}
                onChange={(e) =>
                  setSubteamId(e.target.value ? parseInt(e.target.value) : null)
                }
              >
                <option value="">Cały filar</option>
                {subteams.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={saving}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={saving || !title.trim()}
            >
              {saving ? "Tworzenie…" : "Utwórz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}