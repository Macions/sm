// scripts/migrate-attendance.ts
import { PrismaClient } from '@prisma/client'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import fs from 'fs'
import 'dotenv/config'

const prisma = new PrismaClient()
const OLD_DB_URL = process.env.SM_FREKWENCJA_DATABASE_URL
if (!OLD_DB_URL) throw new Error('Brak SM_FREKWENCJA_DATABASE_URL w .env')

// ============================================================
// MAPOWANIE FILARÓW
// ============================================================
const PILLAR_MAPPING = [
  { sourcePillarId: 1, name: 'Wszyscy',       teamId: null },
  { sourcePillarId: 2, name: 'Rzeczniczy',    teamId: 10 },
  { sourcePillarId: 3, name: 'Konferencyjny', teamId: 9  },
  { sourcePillarId: 4, name: 'Projektowy',    teamId: 8  },
  { sourcePillarId: 5, name: 'Symulacyjny',   teamId: 11 },
  { sourcePillarId: 8, name: 'OSOM',          teamId: 29 },
  { sourcePillarId: 9, name: 'Forum Młodych', teamId: 30 },
]

// ============================================================
// MAPOWANIE CZŁONKÓW (att_members.id → sm.users.id)
// ============================================================
const MEMBER_MAPPING: Record<number, number> = {
  2: 354, 3: 308, 6: 324, 7: 539, 8: 392, 11: 301, 13: 335, 14: 302,
  17: 317, 18: 288, 20: 287, 23: 0, 24: 393, 25: 289, 26: 281, 27: 304,
  28: 326, 29: 286, 31: 327, 32: 282, 33: 357, 35: 285, 38: 280, 39: 297,
  41: 314, 43: 313, 46: 356, 48: 319, 50: 405, 51: 294, 52: 0, 53: 290,
  55: 395, 56: 323, 57: 316, 59: 298, 61: 291, 62: 309, 63: 338, 64: 396,
  67: 331, 69: 278, 70: 333, 71: 300, 74: 303, 76: 283, 77: 397, 78: 398,
  79: 533, 81: 320, 83: 292, 84: 306, 85: 339, 86: 299, 87: 305, 88: 279,
  90: 307, 91: 318, 92: 329, 94: 293, 96: 310, 98: 1, 99: 348, 100: 343,
  101: 344, 102: 347, 103: 349, 105: 352, 106: 350, 107: 345, 108: 353,
  110: 341, 111: 351, 112: 346, 113: 360, 114: 361, 115: 363, 116: 366,
  117: 364, 118: 362, 119: 368, 120: 390, 121: 389, 122: 374, 123: 378,
  124: 382, 125: 380, 126: 377, 127: 375, 128: 371, 129: 388, 130: 391,
  131: 384, 132: 383, 133: 385, 134: 358, 135: 381, 136: 376, 137: 372,
  138: 386, 139: 370, 140: 536, 141: 369, 142: 379, 143: 365, 144: 367,
}

const STATUS_MAPPING: Record<string, 'PRESENT' | 'ABSENT' | 'EXCUSED'> = {
  present: 'PRESENT',
  absent: 'ABSENT',
  excused: 'EXCUSED',
}

const MISSING_USERS = [
  { oldMemberId: 23, username: 'euzebiusz.kaczmarek',  email: 'euzebiusz.kaczmarek@silamlodych.pl',  firstName: 'Euzebiusz',   lastName: 'Kaczmarek' },
  { oldMemberId: 52, username: 'maksymilian.nowaczyk', email: 'maksymilian.nowaczyk@silamlodych.pl', firstName: 'Maksymilian', lastName: 'Nowaczyk' },
]

// ============================================================
// 0. TWORZENIE BRAKUJĄCYCH KONT
// ============================================================
async function createMissingUsers() {
  console.log('\n=== 0. Tworzenie brakujących kont ===')
  for (const u of MISSING_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (existing) {
      console.log(`  [SKIP] ${u.email} już istnieje (id=${existing.id})`)
      MEMBER_MAPPING[u.oldMemberId] = existing.id
      continue
    }
    const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10)
    const created = await prisma.user.create({
      data: {
        username: u.username,
        email: u.email,
        password_hash: passwordHash,
        first_name: u.firstName,
        last_name: u.lastName,
        status: 'active',
        is_active: true,
        functional_role: 'Członek',
      },
    })
    console.log(`  [OK] Utworzono ${u.email} (id=${created.id})`)
    MEMBER_MAPPING[u.oldMemberId] = created.id
  }
}

// ============================================================
// 1. FILARY
// ============================================================
async function importPillars() {
  console.log('\n=== 1. Import filarów ===')
  for (const p of PILLAR_MAPPING) {
    const r = await prisma.attendancePillar.upsert({
      where: { sourcePillarId: p.sourcePillarId },
      update: { name: p.name, teamId: p.teamId },
      create: { name: p.name, teamId: p.teamId, sourcePillarId: p.sourcePillarId },
    })
    console.log(`  [OK] sourcePillarId=${p.sourcePillarId} → id=${r.id} (${p.name})`)
  }
}

// ============================================================
// 2. SPOTKANIA
// ============================================================
async function importMeetings(conn: mysql.Connection) {
  console.log('\n=== 2. Import spotkań ===')

  const dbPillars = await prisma.attendancePillar.findMany()
  const pillarMap = new Map<number, number>()
  for (const p of dbPillars) if (p.sourcePillarId !== null) pillarMap.set(p.sourcePillarId, p.id)

  const users = await prisma.user.findMany({ select: { id: true, email: true } })
  const userByEmail = new Map<string, number>()
  for (const u of users) if (u.email) userByEmail.set(u.email.toLowerCase(), u.id)

  const [meetings] = await conn.query<mysql.RowDataPacket[]>(`
    SELECT m.id, m.pillar_id, m.title, m.meeting_date, m.created_by, u.email AS creator_email
    FROM att_meetings m
    LEFT JOIN att_users u ON u.id = m.created_by
    ORDER BY m.id
  `)

  let imported = 0, skipped = 0
  for (const m of meetings) {
    const pillarId = pillarMap.get(m.pillar_id)
    if (!pillarId) { console.log(`  [SKIP] meeting ${m.id} — brak filaru ${m.pillar_id}`); skipped++; continue }

    let createdBy: number | null = null
    let sourceCreatedByEmail: string | null = null
    if (m.creator_email) {
      const em = String(m.creator_email).toLowerCase().trim()
      const uid = userByEmail.get(em)
      if (uid) createdBy = uid
      else sourceCreatedByEmail = em
    }

    await prisma.attendanceMeeting.upsert({
      where: { sourceMeetingId: m.id },
      update: { title: m.title, meetingDate: new Date(m.meeting_date), pillarId, createdBy, sourceCreatedByEmail },
      create: { title: m.title, meetingDate: new Date(m.meeting_date), pillarId, createdBy, sourceCreatedByEmail, sourceMeetingId: m.id },
    })
    imported++
  }
  console.log(`  [OK] Zaimportowano ${imported} spotkań, pominięto ${skipped}`)
}

// ============================================================
// 3. REKORDY FREKWENCJI
// ============================================================
async function importRecords(conn: mysql.Connection) {
  console.log('\n=== 3. Import rekordów frekwencji ===')

  const meetings = await prisma.attendanceMeeting.findMany({ select: { id: true, sourceMeetingId: true } })
  const meetingMap = new Map<number, number>()
  for (const m of meetings) if (m.sourceMeetingId !== null) meetingMap.set(m.sourceMeetingId, m.id)

  const [rows] = await conn.query<mysql.RowDataPacket[]>(`
    SELECT id, meeting_id, member_id, status, updated_at FROM att_attendance ORDER BY id
  `)

  let imported = 0, skipped = 0
  const skippedList: any[] = []

  for (const r of rows) {
    const meetingId = meetingMap.get(r.meeting_id)
    const userId = MEMBER_MAPPING[r.member_id]
    const status = STATUS_MAPPING[r.status]

    if (!meetingId || !userId || !status) {
      skipped++
      skippedList.push({
        source_record_id: r.id,
        meeting_id: r.meeting_id,
        member_id: r.member_id,
        status: r.status,
        reason: !meetingId ? 'brak mapowania spotkania' : !userId ? 'brak mapowania członka' : 'nieznany status',
      })
      continue
    }

    await prisma.attendanceRecord.upsert({
      where: { sourceRecordId: r.id },
      update: { meetingId, userId, status, sourceUpdatedAt: r.updated_at ? new Date(r.updated_at) : null },
      create: { meetingId, userId, status, sourceRecordId: r.id, sourceUpdatedAt: r.updated_at ? new Date(r.updated_at) : null },
    })
    imported++
  }
  console.log(`  [OK] Zaimportowano ${imported} rekordów, pominięto ${skipped}`)
  if (skippedList.length) {
    fs.writeFileSync('scripts/skipped_records.json', JSON.stringify(skippedList, null, 2))
    console.log('  [INFO] Pominięte rekordy → scripts/skipped_records.json')
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('=== ETL: Migracja frekwencji SM_Frekwencja → sm ===')
  const conn = await mysql.createConnection(OLD_DB_URL!)
  try {
    await createMissingUsers()
    await importPillars()
    await importMeetings(conn)
    await importRecords(conn)
  } finally {
    await conn.end()
    await prisma.$disconnect()
  }
  console.log('\n=== ETL zakończony ===')
}

main().catch((e) => { console.error('BŁĄD ETL:', e); process.exit(1) })