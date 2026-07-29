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

// ⭐ LISTA PUBLICZNYCH ENDPOINTÓW
const PUBLIC_ENDPOINTS = [
	"/api/auth/login",
	"/api/auth/google",
	"/api/auth/register",
	"/api/auth/refresh-token",
	"/api/auth/forgot-password",
	"/api/auth/reset-password",
	"/api/health",
	"/api/status",
];

// ⭐ FUNKCJA SPRAWDZAJĄCA
const isPublicPath = (path: string): boolean => {
	return PUBLIC_ENDPOINTS.some(
		(endpoint) => path === endpoint || path.startsWith(endpoint),
	);
};

export const authMiddleware = (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) => {
	// ⭐ SPRAWDŹ CZY TO PUBLICZNY ENDPOINT
	if (isPublicPath(req.path)) {
		console.log(
			`🔓 Publiczny endpoint: ${req.method} ${req.path} - pomijam autoryzację`,
		);
		return next();
	}

	// Reszta kodu - wymaga autoryzacji
	const token = req.headers.authorization?.split(" ")[1];

	if (!token) {
		console.log(`❌ Brak tokenu dla: ${req.method} ${req.path}`);
		return res.status(401).json({ error: "Brak tokenu autoryzacyjnego" });
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as any;
		req.user = {
			id: decoded.id,
			email: decoded.email,
			role: decoded.role,
		};
		console.log(
			`✅ Autoryzacja dla: ${req.method} ${req.path} - użytkownik: ${decoded.email}`,
		);
		next();
	} catch (error) {
		console.log(`❌ Błąd autoryzacji dla: ${req.method} ${req.path}`);
		return res.status(401).json({ error: "Nieprawidłowy token" });
	}
};

export const authenticateToken = authMiddleware;
