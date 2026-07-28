"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const db_1 = __importDefault(require("../config/db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db_1.default.execute(`
			SELECT 
				users.*,
				roles.name AS role
			FROM users
			JOIN roles ON users.role_id = roles.id
			WHERE users.email = ?
			`, [email]);
        if (rows.length === 0) {
            return res.status(401).json({
                message: "Nieprawidłowy email lub hasło",
            });
        }
        const user = rows[0];
        if (!user.is_active) {
            return res.status(403).json({
                message: "Konto jest nieaktywne",
            });
        }
        const passwordCorrect = await bcrypt_1.default.compare(password, user.password_hash);
        if (!passwordCorrect) {
            return res.status(401).json({
                message: "Nieprawidłowy email lub hasło",
            });
        }
        const accessToken = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            role: user.role,
        }, process.env.JWT_SECRET, {
            expiresIn: "24h",
        });
        const refreshToken = jsonwebtoken_1.default.sign({
            id: user.id,
        }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: "14d",
        });
        await db_1.default.execute(`
	INSERT INTO refresh_tokens
	(user_id, token, expires_at)
	VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 14 DAY))
	`, [user.id, refreshToken]);
        res.json({
            message: "Zalogowano",
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Błąd serwera",
        });
    }
};
exports.login = login;
