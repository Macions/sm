import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
	host: process.env.DB_HOST || "localhost",
	user: process.env.DB_USER || "root",
	password: process.env.DB_PASSWORD || "",
	database: process.env.DB_NAME || "sm_db",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

export const smPool = mysql.createPool({
	host: process.env.SM_DB_HOST || "127.0.0.1",
	port: parseInt(process.env.SM_DB_PORT || "13307"),
	user: process.env.SM_DB_USER || "maciej_legacy_ro",
	password: process.env.SM_DB_PASSWORD || "",
	database: "SM",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

export const ewidencjaPool = mysql.createPool({
	host: process.env.EWIDENCJA_DB_HOST || "127.0.0.1",
	port: parseInt(process.env.EWIDENCJA_DB_PORT || "13307"),
	user: process.env.EWIDENCJA_DB_USER || "maciej_legacy_ro",
	password: process.env.EWIDENCJA_DB_PASSWORD || "",
	database: "SM_Ewidencja",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});
export const frekwencjaPool = mysql.createPool({
	host: process.env.FREKWENCJA_DB_HOST || "127.0.0.1",
	port: parseInt(process.env.FREKWENCJA_DB_PORT || "13307"),
	user: process.env.FREKWENCJA_DB_USER || "maciej_legacy_ro",
	password: process.env.FREKWENCJA_DB_PASSWORD || "",
	database: "SM_Frekwencja",
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

export default pool;
