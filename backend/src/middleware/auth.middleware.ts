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
			`Publiczny endpoint: ${req.method} ${req.path} - pomijam autoryzację`,
		);
		return next();
	}

	const token = req.cookies.accessToken;

	if (!token) {
		return res.status(401).json({ error: "Brak tokenu autoryzacyjnego" });
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET) as any;

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

		const isLeader = user.team_members.length > 0;

		const leaderPillarNames = user.team_members
			.filter((tm: any) => tm.team?.name?.includes("Filar"))
			.map((tm: any) => tm.team?.name?.replace("Filar ", ""))
			.filter(Boolean);

		const pillarName =
			leaderPillarNames.length > 0 ? leaderPillarNames[0] : null;

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
			isLeader: isLeader,
			pillarName: pillarName,
			leaderPillarNames: leaderPillarNames,
		};

		next();
	} catch (error: any) {
		logger.error(`Błąd autoryzacji: ${error.message}`);
		return res.status(401).json({ error: "Nieprawidłowy token" });
	}
};

export const authenticateToken = authMiddleware;