import api from "./axios";

export const attendanceApi = {
  getPillars: () => api.get("/attendance/pillars").then((r) => r.data),

  getMeetings: (params?: {
    pillarId?: number;
    subteamId?: number;                                        // ⬅️ NOWE
    dateFrom?: string;
    dateTo?: string;
    scope?: "all" | "current" | "archive";
  }) => api.get("/attendance/meetings", { params }).then((r) => r.data),

  getMeeting: (id: number) =>
    api.get(`/attendance/meetings/${id}`).then((r) => r.data),

  updateRecords: (
    meetingId: number,
    records: Array<{
      id: number;
      status: "present" | "absent" | "excused";
      is_late: boolean;
      note: string;
    }>,
  ) =>
    api
      .put(`/attendance/meetings/${meetingId}/records`, { records })
      .then((r) => r.data),

  createMeeting: (data: {
    pillarId: number;
    subteamId?: number | null;                                 // ⬅️ NOWE
    title: string;
    meetingDate: string;
  }) => api.post("/attendance/meetings", data).then((r) => r.data),

  updateMeetingSubteam: (meetingId: number, subteamId: number | null) => // ⬅️ NOWE
    api
      .put(`/attendance/meetings/${meetingId}/subteam`, { subteamId })
      .then((r) => r.data),

  getSummary: (params?: { months?: number }) =>
    api.get("/attendance/reports/summary", { params }).then((r) => r.data),

  // ═══════════════ PODZESPOŁY (NOWE) ═══════════════
  getSubteams: (pillarId?: number) =>
    api
      .get("/attendance/subteams", { params: { pillarId } })
      .then((r) => r.data),

  createSubteam: (data: {
    pillarId: number;
    name: string;
    description?: string;
  }) => api.post("/attendance/subteams", data).then((r) => r.data),

  updateSubteam: (id: number, data: { name?: string; description?: string }) =>
    api.put(`/attendance/subteams/${id}`, data).then((r) => r.data),

  deleteSubteam: (id: number) =>
    api.delete(`/attendance/subteams/${id}`).then((r) => r.data),
};

export interface Pillar {
  pillar_id: number;
  pillar_name: string;
  pillar_label: string;
  members_count: number;
  meetings_count: number;
  attendance_percentage: number;
}

export interface Subteam {                                       // ⬅️ NOWE
  id: number;
  name: string;
  description: string | null;
  pillar_id: number | null;
  pillar_name: string | null;
  meetings_count: number;
}

export interface Meeting {
  id: number;
  pillar_id: number;
  pillar_name: string;
  pillar_label: string;
  subteam_id: number | null;                                     // ⬅️ NOWE
  subteam_name: string | null;                                   // ⬅️ NOWE
  title: string;
  meeting_date: string;
  attendance_checked: boolean;
  description: string | null;
  records_count: number;
  present_count: number;
  absent_count: number;
  excused_count: number;
}

export interface AttendanceRecord {
  id: number;
  member_id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: "present" | "absent" | "excused";
  is_late: boolean;
  note: string;
}

export interface SummaryPillar {
  pillar_id: number;
  pillar_name: string;
  pillar_label: string;
  attendance_percentage: number;
  meetings_count: number;
  members_count: number;
}