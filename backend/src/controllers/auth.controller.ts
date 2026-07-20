import { Request, Response } from "express";
import { db } from "../config/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response) => {
	const { email, password } = req.body;

	try {
		const [rows]: any = await db.execute(
			`
			SELECT 
				users.*,
				roles.name AS role
			FROM users
			JOIN roles ON users.role_id = roles.id
			WHERE users.email = ?
			`,
			[email],
		);

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

		const passwordCorrect = await bcrypt.compare(
			password,
			user.password_hash
		);

		if (!passwordCorrect) {
			return res.status(401).json({
				message: "Nieprawidłowy email lub hasło",
			});
		}

		const token = jwt.sign(
			{
				id: user.id,
				email: user.email,
				role: user.role,
			},
			process.env.JWT_SECRET!,
			{
				expiresIn: "7d",
			},
		);

		res.json({
			message: "Zalogowano",
			token,
			user: {
				id: user.id,
				email: user.email,
				first_name: user.first_name,
				last_name: user.last_name,
				role: user.role,
			},
		});
	} catch (error) {
		console.error(error);

		res.status(500).json({
			message: "Błąd serwera",
		});
	}
};