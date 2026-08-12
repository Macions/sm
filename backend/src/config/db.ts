// backend/src/config/db.ts
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// ============================================================
// GŁÓWNA BAZA (serwer400062_silamlodych)
// ============================================================
const pool = mysql.createPool({
	host: process.env.DB_HOST || "localhost",
	user: process.env.DB_USER || "root",
	password: process.env.DB_PASSWORD || "",
	database: process.env.DB_NAME || "sm_db",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

// ============================================================
// BAZA SM
// ============================================================
export const smPool = mysql.createPool({
	host: process.env.SM_DB_HOST || "57.128.253.89",
	user: process.env.SM_DB_USER || "czarnecki",
	password: process.env.SM_DB_PASSWORD || "N7#vQ4!xLp9@Tw2K",
	database: "SM",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

// ============================================================
// BAZA SM_EWIDENCJA (dla faktur)
// ============================================================
export const ewidencjaPool = mysql.createPool({
	host: process.env.EWIDENCJA_DB_HOST || "57.128.253.89",
	user: process.env.EWIDENCJA_DB_USER || "czarnecki",
	password: process.env.EWIDENCJA_DB_PASSWORD || "N7#vQ4!xLp9@Tw2K",
	database: "SM_Ewidencja",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

// ============================================================
// BAZA FREKWENCJI (SM_Frekwencja)
// ============================================================
export const frekwencjaPool = mysql.createPool({
	host: process.env.FREKWENCJA_DB_HOST || "57.128.253.89",
	user: process.env.FREKWENCJA_DB_USER || "czarnecki",
	password: process.env.FREKWENCJA_DB_PASSWORD || "N7#vQ4!xLp9@Tw2K",
	database: "SM_Frekwencja",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

export default pool;