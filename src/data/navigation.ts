import {
	Home,
	Users,
	FolderKanban,
	BookOpen,
	User,
	CalendarOff,
	Megaphone,
	Settings,
} from "lucide-react";

export const NAV_ITEMS = [
	{ key: "dashboard", label: "Panel główny", icon: Home },
	{ key: "structure", label: "Struktura SM", icon: Users },
	{ key: "projects", label: "Projekty", icon: FolderKanban },
	{ key: "guides", label: "Poradniki", icon: BookOpen },
	{ key: "members", label: "Członkowie", icon: Users },
	{ key: "vacancies", label: "Wakaty", icon: Megaphone },
	{ key: "profile", label: "Mój profil", icon: User },
	{ key: "leave", label: "Urlop", icon: CalendarOff },
	{ key: "social", label: "Social Media", icon: Megaphone },
	{ key: "admin", label: "Administracja", icon: Settings },
];
