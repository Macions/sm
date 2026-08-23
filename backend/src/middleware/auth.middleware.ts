import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

// 🔥 UŻYJ TEGO SAMEGO JWT_SECRET CO W server.ts
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here-change-in-production";

export interface AuthRequest extends Request {
	user?: {
		id: number;
		email: string;
		role: string;
	};
}

const PUBLIC_ENDPOINTS = [
	"/api/auth/login",
	"/api/auth/google",
	"/api/auth/register",
	"/api/auth/refresh-token",
	"/api/auth/forgot-password",
	"/api/auth/reset-password",
	"/api/health",
	"/api/status",
	"/api/calendar/auth",
	"/api/calendar/callback",
	"/calendar/auth",
	"/calendar/callback",
	"/auth",
	"/callback",
];

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
	if (isPublicPath(req.path)) {
		logger.debug(
			`🔓 Publiczny endpoint: ${req.method} ${req.path} - pomijam autoryzację`,
		);
		return next();
	}

	const authHeader = req.headers.authorization;
	// console.log(`🔑 [authMiddleware] Authorization header: ${authHeader ? '✅ Jest' : '❌ Brak'}`);

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		// console.log(`❌ [authMiddleware] Brak tokena dla: ${req.method} ${req.path}`);
		return res.status(401).json({ error: "Brak tokenu autoryzacyjnego" });
	}

	const token = authHeader.split(' ')[1];
	// console.log(`🔑 [authMiddleware] Token: ${token.substring(0, 30)}...`);

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as any;
		// console.log(`✅ [authMiddleware] Token zweryfikowany dla: ${decoded.email}`);

		req.user = {
			id: decoded.id,
			email: decoded.email,
			role: decoded.role,
		};
		next();
	} catch (error: any) {
		// console.log(`❌ [authMiddleware] Błąd weryfikacji: ${error.message}`);
		return res.status(401).json({ error: "Nieprawidłowy token" });
	}
};

export const authenticateToken = authMiddleware;