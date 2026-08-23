import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";
import { logger } from "@/utils/logger";

type User = {
	id: string | number;
	firstName: string;
	lastName?: string;
	role: string;
	team: string;
	pillars: string;
	status: string;
	username?: string;
	email?: string;
	joinDate?: string;
	isTrial?: boolean;
};

type UserContextType = {
	user: User | null;
	loading: boolean;
	refetch: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchUser = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("accessToken");
			if (!token) {
				setUser(null);
				setLoading(false);
				return;
			}

			const cached = localStorage.getItem("user");
			if (cached) {
				try {
					const parsed = JSON.parse(cached);
					setUser(parsed);
				} catch (e) {

				}
			}

			const response = await fetch("/api/profile", {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const data = await response.json();

				let pillarsString = "";
				if (Array.isArray(data.pillars)) {
					pillarsString = data.pillars.join(", ");
				} else if (typeof data.pillars === "string") {
					pillarsString = data.pillars;
				}

				const userData = {
					id: data.id,
					firstName: data.firstName || "Użytkowniku",
					lastName: data.lastName || "",
					role: data.role || "member",
					team: data.team || "—",
					pillars: pillarsString,
					status: data.status || "active",
					username: data.username,
					email: data.email,
					joinDate:
						data.joinDate || data.created_at || new Date().toISOString(),
					isTrial: data.isTrial || false,
				};
				setUser(userData);
				localStorage.setItem("user", JSON.stringify(userData));
			}
		} catch (error) {
			logger.error("❌ Błąd pobierania profilu:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUser();
	}, []);

	return (
		<UserContext.Provider value={{ user, loading, refetch: fetchUser }}>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error("useUser must be used within a UserProvider");
	}
	return context;
}