import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET =
	process.env.JWT_SECRET || "your-secret-key-here-change-in-production";

export interface AuthRequest extends Request {
	user?: {
		id: number;
		email: string | null;
		role: string;
		isLeader?: boolean;
		pillarName?: string | null;
		leaderPillarNames?: string[];
	};
}

const PUBLIC_ENDPOINTS = [
	"/api/auth/login",
	"/api/auth/google",
	"/api/auth/google-token",
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
	"/uploads", // ✅ Dodaj publiczne ścieżki do plików
];

const isPublicPath = (path: string): boolean => {
	return PUBLIC_ENDPOINTS.some(
		(endpoint) => path === endpoint || path.startsWith(endpoint),
	);
};

export const authMiddleware = async (
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) => {
	// Pomijamy publiczne endpointy
	if (isPublicPath(req.path)) {
		logger.debug(
			`Publiczny endpoint: ${req.method} ${req.path} - pomijam autoryzację`,
		);
		return next();
	}

	// 🔥 POPRAWIONE: Pobieramy token z HEADER lub COOKIE
	let token = null;

	// 1. Sprawdź Authorization header
	const authHeader = req.headers.authorization;
	if (authHeader && authHeader.startsWith("Bearer ")) {
		token = authHeader.split(" ")[1];
		logger.debug(`🔐 Token pobrany z header`);
	}

	// 2. Jeśli nie ma w header, sprawdź cookie
	if (!token) {
		token = req.cookies?.accessToken;
		if (token) {
			logger.debug(`🔐 Token pobrany z cookie`);
		}
	}

	// 3. Jeśli nadal brak tokena - błąd
	if (!token) {
		logger.warn(`❌ Brak tokena dla: ${req.method} ${req.path}`);
		return res.status(401).json({ error: "Brak tokenu autoryzacyjnego" });
	}

	try {
		// Weryfikacja tokena
		const decoded = jwt.verify(token, JWT_SECRET) as any;
		logger.debug(`✅ Token zweryfikowany dla użytkownika: ${decoded.id}`);

		// Pobierz użytkownika z bazy
		const user = await prisma.user.findUnique({
			where: { id: decoded.id },
			include: {
				team_members: {
					where: { is_leader: true },
					include: {
						team: true,
					},
				},
			},
		});

		if (!user) {
			logger.warn(`❌ Użytkownik ${decoded.id} nie znaleziony`);
			return res.status(401).json({ error: "Użytkownik nie znaleziony" });
		}

		// Sprawdź czy użytkownik jest liderem
		const isLeader = user.team_members.length > 0;

		// Pobierz nazwy filarów, których jest liderem
		const leaderPillarNames = user.team_members
			.filter((tm: any) => tm.team?.name?.includes("Filar"))
			.map((tm: any) => tm.team?.name?.replace("Filar ", ""))
			.filter(Boolean);

		const pillarName =
			leaderPillarNames.length > 0 ? leaderPillarNames[0] : null;

		// Mapowanie roli
		const roleMap: Record<number, string> = {
			1: "admin",
			2: "board",
			3: "coordinator",
			4: "member",
		};

		// Ustaw użytkownika w req
		req.user = {
			id: user.id,
			email: user.email,
			role: roleMap[user.role_id || 4] || "member",
			isLeader: isLeader,
			pillarName: pillarName,
			leaderPillarNames: leaderPillarNames,
		};

		// Dodaj dodatkowe pola dla wygody (zgodność z istniejącym kodem)
		(req as any).user.first_name = user.first_name;
		(req as any).user.last_name = user.last_name;
		(req as any).user.team = user.team;
		(req as any).user.pillars = user.pillars;
		(req as any).user.status = user.status;
		(req as any).user.isLeader = isLeader;

		next();
	} catch (error: any) {
		logger.error(`❌ Błąd autoryzacji: ${error.message}`);

		if (error.name === "TokenExpiredError") {
			return res.status(401).json({ error: "Token wygasł" });
		}
		if (error.name === "JsonWebTokenError") {
			return res.status(401).json({ error: "Nieprawidłowy token" });
		}

		return res.status(401).json({ error: "Nieprawidłowy token" });
	}
};

export const authenticateToken = authMiddleware;
