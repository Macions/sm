// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthRequest extends Request {
	user?: {
		id: number;
		email: string;
		role: string;
	};
}

// ✅ DODAJ 'export' przed funkcją
export const authMiddleware = (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) => {
	const token = req.headers.authorization?.split(" ")[1];

	if (!token) {
		return res.status(401).json({ error: "Brak tokenu autoryzacyjnego" });
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as any;
		req.user = {
			id: decoded.id,
			email: decoded.email,
			role: decoded.role,
		};
		next();
	} catch (error) {
		return res.status(401).json({ error: "Nieprawidłowy token" });
	}
};

// ✅ Opcjonalnie - dodaj alias dla kompatybilności
export const authenticateToken = authMiddleware;
