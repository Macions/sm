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
		isLeader?: boolean; // <-- DODAJ
		pillarName?: string | null;
		leaderPillarNames?: string[]; // <-- DODAJ (opcjonalnie)
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

export const authMiddleware = async (
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

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Brak tokenu autoryzacyjnego" });
	}

	const token = authHeader.split(" ")[1];

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as any;

		// Pobierz użytkownika z bazy wraz z informacją o byciu liderem
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
			return res.status(401).json({ error: "Użytkownik nie znaleziony" });
		}

		// Sprawdź czy użytkownik jest liderem jakiegokolwiek zespołu
		const isLeader = user.team_members.length > 0;

		// Znajdź nazwy filarów których użytkownik jest liderem
		const leaderPillarNames = user.team_members
			.filter((tm: any) => tm.team?.name?.includes("Filar"))
			.map((tm: any) => tm.team?.name?.replace("Filar ", ""))
			.filter(Boolean);

		// Weź pierwszy filar jako główny (dla kompatybilności z istniejącym kodem)
		const pillarName =
			leaderPillarNames.length > 0 ? leaderPillarNames[0] : null;

		// Mapowanie roli
		const roleMap: Record<number, string> = {
			1: "admin",
			2: "board",
			3: "coordinator",
			4: "member",
		};

		req.user = {
			id: user.id,
			email: user.email,
			role: roleMap[user.role_id || 4] || "member",
			isLeader: isLeader, // <-- KLUCZOWE!
			pillarName: pillarName, // <-- DODAJ
			leaderPillarNames: leaderPillarNames, // <-- DODAJ
		};

		logger.debug(
			`🔐 Użytkownik autoryzowany: ${user.email}, isLeader: ${isLeader}, pillarName: ${pillarName}`,
		);

		next();
	} catch (error: any) {
		logger.error(`❌ Błąd autoryzacji: ${error.message}`);
		return res.status(401).json({ error: "Nieprawidłowy token" });
	}
};

export const authenticateToken = authMiddleware;
