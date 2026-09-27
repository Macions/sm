import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
	roles: Array<"coordinator" | "board" | "admin">;
	children: React.ReactNode;
}

export default function RequireRole({ roles, children }: Props) {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
				Ładowanie…
			</div>
		);
	}

	if (!user) return <Navigate to="/login" replace />;

	const allowed =
		user.isLeader === true ||
		(roles.includes("admin") && user.role === "admin") ||
		(roles.includes("board") && user.role === "board") ||
		(roles.includes("coordinator") && user.role === "coordinator");

	if (!allowed) return <Navigate to="/dashboard" replace />;
	return <>{children}</>;
}
