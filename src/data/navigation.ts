import {
	Home,
	Users,
	FolderKanban,
	BookOpen,
	User,
	FileText,
	Megaphone,
	Settings,
	UsersRound,
	CheckSquare,
	Calendar,
} from "lucide-react";

export const NAV_ITEMS = [
	{ key: "dashboard", label: "Panel główny", icon: Home },
	{ key: "structure", label: "Struktura SM", icon: Users },
	{ key: "myTeam", label: "Mój zespół", icon: UsersRound },
	{ key: "projects", label: "Projekty", icon: FolderKanban },
	{ key: "calendar", label: "Kalendarz", icon: Calendar },

	{ key: "tasks", label: "Zadania", icon: CheckSquare },
	{ key: "guides", label: "Poradniki", icon: BookOpen },
	{ key: "faq", label: "Najczęstsze pytania", icon: BookOpen },
	{ key: "members", label: "Członkowie", icon: Users },
	{ key: "vacancies", label: "Wakaty", icon: Megaphone },
	{ key: "profile", label: "Mój profil", icon: User },
	{ key: "requests", label: "Wnioski", icon: FileText },
	{ key: "social", label: "Social Media", icon: Megaphone },
	{ key: "admin", label: "Administracja", icon: Settings },
];
