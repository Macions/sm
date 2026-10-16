import { useState, useEffect, useMemo, useCallback } from "react";
import { safeNavigate } from "@/utils/safeNavigation";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import toast from "react-hot-toast";
import { hasPermission } from "../../utils/permissions";
import { logger } from "@/utils/logger";
import { CreditCard } from "lucide-react";
import {
	Users,
	Search,
	X,
	Filter,
	Grid,
	List,
	User,
	MapPin,
	Star,
	Clock,
	CheckCircle,
	Edit,
	Eye,
	Umbrella,
	Plus,
	Trash2,
	Calendar,
	Award,
	Briefcase,
	Mail,
	Phone,
} from "lucide-react";
import styles from "./Members.module.css";

const PILLAR_MAP: Record<string, string> = {
	Konferencyjny: "Filar Konferencyjny",
	Projektowy: "Filar Projektowy",
	Rzeczniczy: "Filar Rzeczniczy",
	Symulacyjny: "Filar Symulacyjny",
};

const transformPillars = (pillars: string): string => {
	if (!pillars) return "";
	return pillars
		.split(", ")
		.filter(Boolean)
		.map((p: string) => PILLAR_MAP[p] || p)
		.join(", ");
};

const AREA_LABELS: Record<string, string> = {
	projects: "Projekty",
	conferences: "Konferencje i debaty",
	advocacy: "Rzecznictwo",
	simulations: "Symulacje",
	social_media: "Social Media",
	graphics: "Grafika",
	editing: "Montaż",
	it: "IT",
	event_organization: "Organizacja wydarzeń",
};

const mapAreas = (areas: string[]): string[] => {
	if (!areas || !Array.isArray(areas)) return [];
	return areas.map((area) => AREA_LABELS[area] || area);
};

type MemberStatus = "active" | "trial" | "mentor" | "vacation" | "";
type MemberVacation = {
	startDate: string;
	endDate: string;
	type: "team" | "organization";
	teamId?: string;
};

type Member = {
	id: string;
	firstName: string;
	lastName: string;
	avatar?: string;
	function: string;
	team: string;
	teamId: string;
	pillars: string;
	province: string;
	status: MemberStatus;
	interests: string[];
	skills: string[];
	smAreas: string[];
	email: string;
	phone?: string;
	joinDate: string;
	vacation?: MemberVacation;
	contacts?: {
		salaContacts?: string[];
		mpContacts?: string[];
		otherContacts?: string[];
	};
	trainingAreas?: string[];
	contributionInfo?: {
		arrears?: number;
		status?: "paid" | "partial" | "unpaid";
	};
	formData?: Record<string, any>;
};

type VerifiedSkill = {
	id: number;
	skill_name: string;
	category: string;
	description?: string | null;
	awarded_at: string;
	awarded_by_name: string;
};

type MemberBadge = {
	id: number;
	title: string;
	description?: string | null;
	month: number;
	year: number;
	awarded_at: string;
	awarded_by_name?: string | null;
};

type MemberChange = {
	id: number;
	field: "team" | "function" | "pillars";
	old_value: string | null;
	new_value: string | null;
	changed_at: string;
	changed_by_name: string;
};

type User = {
	id: string;
	name: string;
	role: "admin" | "board" | "coordinator" | "member";
	teamId?: string;
};

interface ApiUser {
	id: string | number;
	first_name: string;
	last_name: string;
	email: string;
	phone?: string;
	role?: string;
	functional_role?: string;
	team?: string;
	team_id?: string;
	province?: string;
	status?: string;
	join_date?: string;
	created_at?: string;
	pillars?: string;
	onboarding_data?: {
		development_areas?: string;
		skills?: string;
		sala_contacts?: string;
		mp_contacts?: string;
		institution_contacts?: string;
		other_contacts?: string;
	};
}

const SKILL_CATEGORIES = [
	"Prezentacja",
	"Negocjacje",
	"Debata",
	"Moderacja",
	"Social Media",
	"Grafika",
	"IT / Programowanie",
	"Organizacja wydarzeń",
	"Rzecznictwo",
	"Zarządzanie projektami",
	"Mentalność",
	"Inne",
] as const;

const mapApiUserToMember = (user: ApiUser): Member => {
	const onboarding = user.onboarding_data || {};
	const teamString = user.team || "Brak zespołu";
	const teams = user.team ? user.team.split(", ") : [];

	const hasOnboardingData =
		onboarding &&
		((onboarding.development_areas &&
			onboarding.development_areas !== "[]" &&
			onboarding.development_areas !== '[""]') ||
			(onboarding.skills &&
				onboarding.skills !== "[]" &&
				onboarding.skills !== '[""]') ||
			(onboarding.sala_contacts && onboarding.sala_contacts !== "[]") ||
			(onboarding.mp_contacts && onboarding.mp_contacts !== "[]"));

	return {
		id: user.id?.toString() || "",
		firstName: user.first_name || "",
		lastName: user.last_name || "",
		function: user.functional_role || user.role || "Członek",
		team: teamString,
		teamId: user.team_id || (teams.length > 0 ? teams.join("-") : ""),
		pillars: user.pillars || "",
		province: user.province || "",
		status: (user.status || "trial") as MemberStatus,
		interests:
			hasOnboardingData && onboarding.development_areas
				? (() => {
					try {
						return JSON.parse(onboarding.development_areas);
					} catch (e) {
						return [];
					}
				})()
				: [],
		skills:
			hasOnboardingData && onboarding.skills
				? (() => {
					try {
						return JSON.parse(onboarding.skills);
					} catch (e) {
						return [];
					}
				})()
				: [],
		smAreas:
			hasOnboardingData && onboarding.development_areas
				? (() => {
					try {
						return JSON.parse(onboarding.development_areas);
					} catch (e) {
						return [];
					}
				})()
				: [],
		email: user.email || "",
		phone: user.phone || "",
		joinDate: user.join_date
			? new Date(user.join_date).toISOString().split("T")[0]
			: user.created_at?.split("T")[0] ||
			new Date().toISOString().split("T")[0],
		contacts: {
			salaContacts:
				hasOnboardingData && onboarding.sala_contacts
					? (() => {
						try {
							return JSON.parse(onboarding.sala_contacts);
						} catch (e) {
							return [];
						}
					})()
					: [],
			mpContacts:
				hasOnboardingData && onboarding.mp_contacts
					? (() => {
						try {
							return JSON.parse(onboarding.mp_contacts);
						} catch (e) {
							return [];
						}
					})()
					: [],
			otherContacts: [
				...(hasOnboardingData && onboarding.institution_contacts
					? (() => {
						try {
							return JSON.parse(onboarding.institution_contacts);
						} catch (e) {
							return [];
						}
					})()
					: []),
				...(hasOnboardingData && onboarding.other_contacts
					? (() => {
						try {
							return JSON.parse(onboarding.other_contacts);
						} catch (e) {
							return [];
						}
					})()
					: []),
			],
		},
		trainingAreas:
			hasOnboardingData && onboarding.skills
				? (() => {
					try {
						return JSON.parse(onboarding.skills);
					} catch (e) {
						return [];
					}
				})()
				: [],
		contributionInfo: {
			status: "paid",
			arrears: 0,
		},
	};
};

const STATUS_LABELS: Record<MemberStatus, string> = {
	active: "Pełnoprawny",
	trial: "Okres próbny",
	mentor: "Mentor",
	vacation: "Na urlopie",
	"": "Nieznany",
};

const STATUS_COLORS: Record<MemberStatus, string> = {
	trial: styles.statusTrial,
	active: styles.statusFull,
	mentor: styles.statusMentor,
	vacation: styles.statusVacation,
	"": styles.statusTrial,
};

const STATUS_ICONS: Record<MemberStatus, React.ReactNode> = {
	trial: <Clock size={14} />,
	active: <CheckCircle size={14} />,
	mentor: <Star size={14} />,
	vacation: <Umbrella size={14} />,
	"": <Clock size={14} />,
};

/* ═══════════════════════════════════════════════════════════════
   KARTA CZŁONKA — pozioma, kompaktowa
   ═══════════════════════════════════════════════════════════════ */

interface MemberCardProps {
	member: Member;
	currentUser: User;
	onView: (member: Member) => void;
	onEdit: (member: Member) => void;
	onDelete: (member: Member) => void;
	viewMode: "grid" | "list";
	contributionBadge?: "paid" | "pending" | "none";
	badgesCount?: number;
}

function MemberCard({
	member,
	currentUser,
	onView,
	onEdit,
	onDelete,
	viewMode,
	contributionBadge,
	badgesCount,
}: MemberCardProps) {
	const getInitials = () => {
		return (
			((member.firstName || "")[0] || "") + ((member.lastName || "")[0] || "")
		);
	};

	const isOnVacation = member.status === "vacation";

	const visibleTeams = useMemo(() => {
		return member.team
			.split(", ")
			.filter((team) => team !== "Brak zespołu")
			.filter((team) => team !== "Mentorzy")
			.filter((team) => {
				if (member.pillars) {
					const pillars = member.pillars.split(", ");
					return !pillars.some((p) => PILLAR_MAP[p] === team || p === team);
				}
				return true;
			});
	}, [member.team, member.pillars]);

	const formatJoinDate = (date: string) => {
		if (!date) return "";
		const d = new Date(date);
		return `od ${d.toLocaleDateString("pl-PL", { month: "short", year: "numeric" })}`;
	};


	if (viewMode === "list") {
		return (
			<div
				className={`${styles.memberRow} ${isOnVacation ? styles.memberRowVacation : ""}`}
				onClick={() => onView(member)}
			>
				<div className={styles.memberRow__avatar}>
					{member.avatar || getInitials() || "?"}
				</div>

				<div className={styles.memberRow__identity}>
					<div className={styles.memberRow__name}>
						{member.firstName} {member.lastName}
						{contributionBadge && contributionBadge !== "none" && (
							<span
								className={`${styles.memberRow__dot} ${contributionBadge === "paid"
									? styles.memberRow__dotPaid
									: styles.memberRow__dotPending
									}`}
								title={
									contributionBadge === "paid"
										? "Opłacona składka"
										: "Nieopłacona składka"
								}
							/>
						)}
					</div>
					<div className={styles.memberRow__email}>{member.email}</div>
				</div>

				<div className={styles.memberRow__col}>
					<span className={styles.memberRow__colLabel}>Funkcja</span>
					<span className={styles.memberRow__colValue}>{member.function}</span>
				</div>

				<div className={styles.memberRow__col}>
					<span className={styles.memberRow__colLabel}>Zespół</span>
					<span className={styles.memberRow__colValue}>
						{visibleTeams.join(", ") || "—"}
					</span>
				</div>

				<div className={styles.memberRow__col}>
					<span className={styles.memberRow__colLabel}>Województwo</span>
					<span className={styles.memberRow__colValue}>
						{member.province || "—"}
					</span>
				</div>

				<div className={styles.memberRow__col}>
					<span className={styles.memberRow__colLabel}>Status</span>
					<span
						className={`${styles.memberRow__status} ${STATUS_COLORS[member.status || "trial"]}`}
					>
						{STATUS_ICONS[member.status || "trial"]}
						{STATUS_LABELS[member.status || "trial"]}
					</span>
				</div>

				{badgesCount !== undefined && badgesCount > 0 && (
					<div className={styles.memberRow__badge} title={`${badgesCount} wyróżnień`}>
						<Star size={14} />
						{badgesCount}
					</div>
				)}

				<div className={styles.memberRow__actions}>
					<button
						className={styles.memberRow__actionBtn}
						onClick={(e) => {
							e.stopPropagation();
							onView(member);
						}}
						title="Podgląd"
					>
						<Eye size={16} />
					</button>
					{hasPermission(currentUser?.role, "canEditUsers") && (
						<button
							className={styles.memberRow__actionBtn}
							onClick={(e) => {
								e.stopPropagation();
								onEdit(member);
							}}
							title="Edytuj"
						>
							<Edit size={16} />
						</button>
					)}
					{hasPermission(currentUser?.role, "canDeleteUsers") &&
						currentUser.id !== member.id && (
							<button
								className={`${styles.memberRow__actionBtn} ${styles.memberRow__actionBtnDanger}`}
								onClick={(e) => {
									e.stopPropagation();
									onDelete(member);
								}}
								title="Usuń"
							>
								<Trash2 size={16} />
							</button>
						)}
				</div>
			</div>
		);
	}


	return (
		<div
			className={`${styles.memberCard} ${isOnVacation ? styles.memberCardVacation : ""}`}
			onClick={() => onView(member)}
		>
			<div className={styles.memberCard__top}>
				<div className={styles.memberCard__avatar}>
					{member.avatar || getInitials() || "?"}
				</div>
				<div className={styles.memberCard__identity}>
					<div className={styles.memberCard__name}>
						{member.firstName} {member.lastName}
						{contributionBadge && contributionBadge !== "none" && (
							<span
								className={`${styles.memberCard__dot} ${contributionBadge === "paid"
									? styles.memberCard__dotPaid
									: styles.memberCard__dotPending
									}`}
								title={
									contributionBadge === "paid"
										? "Opłacona składka"
										: "Nieopłacona składka"
								}
							/>
						)}
					</div>
					<div className={styles.memberCard__function}>{member.function}</div>
				</div>
				{badgesCount !== undefined && badgesCount > 0 && (
					<div
						className={styles.memberCard__badge}
						title={`${badgesCount} wyróżnień`}
					>
						<Star size={13} />
						{badgesCount}
					</div>
				)}
			</div>

			<div className={styles.memberCard__meta}>
				{member.pillars && (
					<span className={styles.memberCard__metaItem}>
						<Users size={13} />
						{transformPillars(member.pillars)}
					</span>
				)}
				{visibleTeams.length > 0 && (
					<span className={styles.memberCard__metaItem}>
						<Briefcase size={13} />
						{visibleTeams.join(", ")}
					</span>
				)}
				{member.province &&
					member.province !== "Brak" &&
					member.province !== "Nieznane" && (
						<span className={styles.memberCard__metaItem}>
							<MapPin size={13} />
							{member.province}
						</span>
					)}
				{member.joinDate && (
					<span className={styles.memberCard__metaItem}>
						<Calendar size={13} />
						{formatJoinDate(member.joinDate)}
					</span>
				)}
			</div>

			{member.skills && member.skills.length > 0 && (
				<div className={styles.memberCard__skills}>
					{member.skills.slice(0, 3).map((skill) => (
						<span key={skill} className={styles.memberCard__skillTag}>
							{skill}
						</span>
					))}
					{member.skills.length > 3 && (
						<span className={styles.memberCard__skillTag}>
							+{member.skills.length - 3}
						</span>
					)}
				</div>
			)}

			<div className={styles.memberCard__footer}>
				<span
					className={`${styles.memberCard__status} ${STATUS_COLORS[member.status || "trial"]}`}
				>
					{STATUS_ICONS[member.status || "trial"]}
					{STATUS_LABELS[member.status || "trial"]}
				</span>

				<div className={styles.memberCard__actions}>
					<button
						className={styles.memberCard__actionBtn}
						onClick={(e) => {
							e.stopPropagation();
							onView(member);
						}}
						title="Podgląd"
					>
						<Eye size={15} />
					</button>
					{hasPermission(currentUser?.role, "canEditUsers") && (
						<button
							className={styles.memberCard__actionBtn}
							onClick={(e) => {
								e.stopPropagation();
								onEdit(member);
							}}
							title="Edytuj"
						>
							<Edit size={15} />
						</button>
					)}
					{hasPermission(currentUser?.role, "canDeleteUsers") &&
						currentUser.id !== member.id && (
							<button
								className={`${styles.memberCard__actionBtn} ${styles.memberCard__actionBtnDanger}`}
								onClick={(e) => {
									e.stopPropagation();
									onDelete(member);
								}}
								title="Usuń"
							>
								<Trash2 size={15} />
							</button>
						)}
				</div>
			</div>
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════════
   MODAL PROFILU — z zakładkami
   ═══════════════════════════════════════════════════════════════ */

type ProfileTab = "overview" | "achievements" | "contacts" | "history";

interface ProfileModalProps {
	isOpen: boolean;
	member: Member | null;
	currentUser: User;
	isEdit?: boolean;
	onClose: () => void;
	onSave?: (member: Member) => void;
	contributionStats?: any;
	loadingContributions?: boolean;
}

function ProfileModal({
	isOpen,
	member,
	currentUser,
	isEdit = false,
	onClose,
	onSave,
	contributionStats,
	loadingContributions,
}: ProfileModalProps) {
	const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
	const [formData, setFormData] = useState<Partial<Member>>({
		firstName: "",
		lastName: "",
		function: "",
		team: "",
		teamId: "",
		pillars: "",
		province: "",
		status: "",
		interests: [],
		skills: [],
		smAreas: [],
		email: "",
		phone: "",
		joinDate: "",
		vacation: undefined,
		contacts: {
			salaContacts: [],
			mpContacts: [],
			otherContacts: [],
		},
		trainingAreas: [],
		contributionInfo: {
			status: "paid",
			arrears: 0,
		},
		formData: {},
	});

	const [newInterest, setNewInterest] = useState("");
	const [newSkill, setNewSkill] = useState("");
	const [newArea, setNewArea] = useState("");
	const [newSalaContact, setNewSalaContact] = useState("");
	const [newMpContact, setNewMpContact] = useState("");
	const [newOtherContact, setNewOtherContact] = useState("");
	const [newTrainingArea, setNewTrainingArea] = useState("");

	const [badges, setBadges] = useState<MemberBadge[]>([]);
	const [badgesByMonth, setBadgesByMonth] = useState<Record<string, number>>({});
	const [loadingBadges, setLoadingBadges] = useState(false);
	const [newBadgeTitle, setNewBadgeTitle] = useState("");
	const [newBadgeDesc, setNewBadgeDesc] = useState("");
	const [newBadgeMonth, setNewBadgeMonth] = useState<number>(
		new Date().getMonth() + 1,
	);
	const [newBadgeYear, setNewBadgeYear] = useState<number>(
		new Date().getFullYear(),
	);

	const MONTHS_PL = [
		"Styczeń",
		"Luty",
		"Marzec",
		"Kwiecień",
		"Maj",
		"Czerwiec",
		"Lipiec",
		"Sierpień",
		"Wrzesień",
		"Październik",
		"Listopad",
		"Grudzień",
	];

	const fetchBadges = async (memberId: string) => {
		if (!memberId) return;
		try {
			setLoadingBadges(true);
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/members/${memberId}/badges`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				setBadges(data.badges || []);
				setBadgesByMonth(data.byMonth || {});
			}
		} catch (e) {
			console.error("Błąd pobierania odznak:", e);
		} finally {
			setLoadingBadges(false);
		}
	};

	useEffect(() => {
		if (isOpen && member?.id) {
			fetchBadges(member.id);
		}
	}, [isOpen, member?.id]);

	const canManageBadges =
		hasPermission(currentUser?.role, "canEditUsers") ||
		currentUser?.role === "admin" ||
		currentUser?.role === "board";

	const handleAddBadge = async () => {
		if (!member?.id) return;
		if (!newBadgeTitle.trim()) {
			toast.error("Podaj tytuł odznaki");
			return;
		}
		try {
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/members/${member.id}/badges`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: newBadgeTitle.trim(),
					description: newBadgeDesc.trim() || null,
					month: newBadgeMonth,
					year: newBadgeYear,
				}),
			});
			if (!res.ok) throw new Error("Błąd zapisu");
			toast.success("Odznaka dodana!");
			setNewBadgeTitle("");
			setNewBadgeDesc("");
			await fetchBadges(member.id);
		} catch (e) {
			toast.error("Nie udało się dodać odznaki");
		}
	};

	const handleDeleteBadge = async (badgeId: number) => {
		if (!member?.id) return;
		try {
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/badges/${badgeId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error();
			toast.success("Odznaka usunięta");
			await fetchBadges(member.id);
		} catch {
			toast.error("Nie udało się usunąć");
		}
	};


	const [verifiedSkills, setVerifiedSkills] = useState<VerifiedSkill[]>([]);
	const [loadingVerifiedSkills, setLoadingVerifiedSkills] = useState(false);
	const [newSkillName, setNewSkillName] = useState("");
	const [newSkillCategory, setNewSkillCategory] = useState<string>(
		SKILL_CATEGORIES[0],
	);
	const [newSkillDesc, setNewSkillDesc] = useState("");
	const [skillFilter, setSkillFilter] = useState<string>("all");

	const fetchVerifiedSkills = async (memberId: string) => {
		if (!memberId) return;
		try {
			setLoadingVerifiedSkills(true);
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/members/${memberId}/verified-skills`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				setVerifiedSkills(data.skills || []);
			}
		} catch (e) {
			console.error("Błąd pobierania umiejętności:", e);
		} finally {
			setLoadingVerifiedSkills(false);
		}
	};

	useEffect(() => {
		if (isOpen && member?.id) {
			fetchVerifiedSkills(member.id);
		}
	}, [isOpen, member?.id]);

	const canManageVerifiedSkills =
		hasPermission(currentUser?.role, "canEditUsers") ||
		currentUser?.role === "admin" ||
		currentUser?.role === "board";

	const handleAddVerifiedSkill = async () => {
		if (!member?.id) return;
		if (!newSkillName.trim()) {
			toast.error("Podaj nazwę umiejętności");
			return;
		}
		try {
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/members/${member.id}/verified-skills`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					skill_name: newSkillName.trim(),
					category: newSkillCategory,
					description: newSkillDesc.trim() || null,
				}),
			});
			if (!res.ok) throw new Error("Błąd zapisu");
			toast.success("Umiejętność dodana!");
			setNewSkillName("");
			setNewSkillDesc("");
			await fetchVerifiedSkills(member.id);
		} catch {
			toast.error("Nie udało się dodać umiejętności");
		}
	};

	const handleDeleteVerifiedSkill = async (skillId: number) => {
		if (!member?.id) return;
		try {
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/verified-skills/${skillId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error();
			toast.success("Umiejętność usunięta");
			await fetchVerifiedSkills(member.id);
		} catch {
			toast.error("Nie udało się usunąć");
		}
	};


	const [changeHistory, setChangeHistory] = useState<MemberChange[]>([]);
	const [loadingHistory, setLoadingHistory] = useState(false);
	const [showAllHistory, setShowAllHistory] = useState(false);

	const fetchChangeHistory = async (memberId: string) => {
		if (!memberId) return;
		try {
			setLoadingHistory(true);
			const token = localStorage.getItem("accessToken");
			const res = await fetch(`/api/members/${memberId}/change-history`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				setChangeHistory(data.history || []);
			}
		} catch (e) {
			console.error("Błąd pobierania historii:", e);
		} finally {
			setLoadingHistory(false);
		}
	};

	useEffect(() => {
		if (isOpen && member?.id) {
			fetchChangeHistory(member.id);
		}
	}, [isOpen, member?.id]);

	const canViewHistory =
		currentUser?.role === "admin" ||
		currentUser?.role === "board" ||
		currentUser?.role === "coordinator";

	const FIELD_LABELS: Record<string, string> = {
		team: "Zespół",
		function: "Stanowisko",
		pillars: "Filary",
	};

	const formatHistoryDate = (iso: string) => {
		return new Date(iso).toLocaleDateString("pl-PL", {
			day: "numeric",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	useEffect(() => {
		if (member) {
			const newFormData = {
				id: member.id,
				firstName: member.firstName || "",
				lastName: member.lastName || "",
				function: member.function || "",
				team: member.team || "",
				teamId: member.teamId || "",
				pillars: member.pillars || "",
				province: member.province || "",
				status: (member.status as MemberStatus) || "trial",
				interests: member.interests || [],
				skills: member.skills || [],
				smAreas: member.smAreas || [],
				email: member.email || "",
				phone: member.phone || "",
				joinDate: member.joinDate
					? new Date(member.joinDate).toISOString().split("T")[0]
					: "",
				vacation: member.vacation,
				contacts: member.contacts || {
					salaContacts: [],
					mpContacts: [],
					otherContacts: [],
				},
				trainingAreas: member.trainingAreas || [],
				contributionInfo: member.contributionInfo || {
					status: "paid",
					arrears: 0,
				},
				formData: member.formData || {},
			};

			setFormData(newFormData);
		} else {
			setFormData({
				firstName: "",
				lastName: "",
				function: "",
				team: "",
				teamId: "",
				pillars: "",
				province: "",
				status: "",
				interests: [],
				skills: [],
				smAreas: [],
				email: "",
				phone: "",
				joinDate: "",
				vacation: undefined,
				contacts: {
					salaContacts: [],
					mpContacts: [],
					otherContacts: [],
				},
				trainingAreas: [],
				contributionInfo: {
					status: "paid",
					arrears: 0,
				},
				formData: {},
			});
		}
	}, [member, isOpen]);

	useEffect(() => {
		if (isEdit) {
			const firstName = formData.firstName?.trim() || "";
			const lastName = formData.lastName?.trim() || "";

			if (firstName && lastName) {
				const normalize = (str: string) => {
					return str
						.normalize("NFD")
						.replace(/[\u0300-\u036f]/g, "")
						.replace(/ł/g, "l")
						.replace(/Ł/g, "L")
						.replace(/ /g, ".")
						.replace(/\.+/g, ".")
						.replace(/^\.|\.$/g, "");
				};

				const generatedEmail = `${normalize(firstName.toLowerCase())}.${normalize(lastName.toLowerCase())}@silamlodych.pl`;

				if (!formData.email || formData.email.endsWith("@silamlodych.pl")) {
					setFormData((prev) => ({
						...prev,
						email: generatedEmail,
					}));
				}
			}
		}
	}, [formData.firstName, formData.lastName, isEdit]);

	if (!isOpen) return null;
	if (!member && !isEdit) return null;

	const currentMember = member || {
		id: "",
		firstName: "",
		lastName: "",
		function: "",
		team: "",
		pillars: "",
		teamId: "",
		province: "",
		status: "trial" as MemberStatus,
		interests: [],
		skills: [],
		smAreas: [],
		email: "",
		phone: "",
		joinDate: "",
		vacation: undefined,
		contacts: {
			salaContacts: [],
			mpContacts: [],
			otherContacts: [],
		},
		trainingAreas: [],
		contributionInfo: {
			status: "paid" as const,
			arrears: 0,
		},
		formData: {},
	};

	const canEdit =
		isEdit &&
		(currentUser.id === currentMember.id ||
			hasPermission(currentUser?.role, "canEditUsers"));

	const canViewSensitive =
		hasPermission(currentUser?.role, "canViewAllUsers") ||
		(currentUser.role === "coordinator" &&
			currentUser.teamId === currentMember.teamId) ||
		currentUser.id === currentMember.id;

	const canViewContributions =
		!isEdit &&
		(hasPermission(currentUser?.role, "canViewAllUsers") ||
			currentUser.id === currentMember?.id);

	const addItem = (
		list: string[],
		setList: (list: string[]) => void,
		item: string,
	) => {
		if (item.trim() && !list.includes(item.trim())) {
			setList([...list, item.trim()]);
		}
	};

	const removeItem = (
		list: string[],
		setList: (list: string[]) => void,
		item: string,
	) => {
		setList(list.filter((i) => i !== item));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (isEdit && !formData.status) {
			toast.error("Wybierz status członka");
			return;
		}

		if (onSave && canEdit) {
			const saveData: Member = {
				...currentMember,
				...formData,
				status: (formData.status as MemberStatus) || "active",
			};

			onSave(saveData);
		}
		onClose();
	};

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString("pl-PL", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};


	const renderOverviewTab = () => (
		<div className={styles.tabContent}>

			<section className={styles.section}>
				<h3 className={styles.sectionTitle}>Dane podstawowe</h3>
				<div className={styles.sectionBody}>
					<div className={styles.fieldRow}>
						<div className={styles.field}>
							<label className={styles.fieldLabel}>Imię</label>
							{canEdit ? (
								<input
									type="text"
									className={styles.input}
									value={formData.firstName || ""}
									onChange={(e) =>
										setFormData({ ...formData, firstName: e.target.value })
									}
									required={isEdit}
								/>
							) : (
								<span className={styles.fieldValue}>
									{currentMember.firstName || "—"}
								</span>
							)}
						</div>
						<div className={styles.field}>
							<label className={styles.fieldLabel}>Nazwisko</label>
							{canEdit ? (
								<input
									type="text"
									className={styles.input}
									value={formData.lastName || ""}
									onChange={(e) =>
										setFormData({ ...formData, lastName: e.target.value })
									}
									required={isEdit}
								/>
							) : (
								<span className={styles.fieldValue}>
									{currentMember.lastName || "—"}
								</span>
							)}
						</div>
					</div>

					<div className={styles.fieldRow}>
						<div className={styles.field}>
							<label className={styles.fieldLabel}>
								<Mail size={14} /> Email
							</label>
							{canEdit ? (
								<input
									type="email"
									className={styles.input}
									value={formData.email || ""}
									onChange={(e) =>
										setFormData({ ...formData, email: e.target.value })
									}
									required
								/>
							) : (
								<span className={styles.fieldValue}>
									{currentMember.email || "—"}
								</span>
							)}
						</div>
						<div className={styles.field}>
							<label className={styles.fieldLabel}>
								<Phone size={14} /> Telefon
							</label>
							{canEdit ? (
								<input
									type="text"
									className={styles.input}
									value={formData.phone || ""}
									onChange={(e) =>
										setFormData({ ...formData, phone: e.target.value })
									}
								/>
							) : (
								<span className={styles.fieldValue}>
									{currentMember.phone || "—"}
								</span>
							)}
						</div>
					</div>

					<div className={styles.fieldRow}>
						<div className={styles.field}>
							<label className={styles.fieldLabel}>Funkcja</label>
							{canEdit ? (
								<input
									type="text"
									className={styles.input}
									value={formData.function || ""}
									onChange={(e) =>
										setFormData({ ...formData, function: e.target.value })
									}
								/>
							) : (
								<span className={styles.fieldValue}>
									{currentMember.function || "—"}
								</span>
							)}
						</div>
						<div className={styles.field}>
							<label className={styles.fieldLabel}>Status</label>
							{canEdit ? (
								<select
									className={styles.select}
									value={formData.status || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											status: e.target.value as MemberStatus,
										})
									}
									required={isEdit}
								>
									<option value="">Wybierz status</option>
									<option value="trial">Okres próbny</option>
									<option value="active">Pełnoprawny członek</option>
									<option value="mentor">Mentor</option>
								</select>
							) : (
								<span
									className={`${styles.statusBadge} ${STATUS_COLORS[currentMember.status]}`}
								>
									{STATUS_ICONS[currentMember.status]}
									{STATUS_LABELS[currentMember.status]}
								</span>
							)}
						</div>
					</div>

					<div className={styles.fieldRow}>
						<div className={styles.field}>
							<label className={styles.fieldLabel}>Data dołączenia</label>
							{canEdit ? (
								<input
									type="date"
									className={styles.input}
									value={formData.joinDate || ""}
									onChange={(e) =>
										setFormData({ ...formData, joinDate: e.target.value })
									}
								/>
							) : (
								<span className={styles.fieldValue}>
									{currentMember.joinDate
										? formatDate(currentMember.joinDate)
										: "—"}
								</span>
							)}
						</div>
						<div className={styles.field}>
							<label className={styles.fieldLabel}>Województwo</label>
							{canEdit ? (
								<input
									type="text"
									className={styles.input}
									value={formData.province || ""}
									onChange={(e) =>
										setFormData({ ...formData, province: e.target.value })
									}
								/>
							) : (
								<span className={styles.fieldValue}>
									{currentMember.province || "—"}
								</span>
							)}
						</div>
					</div>
				</div>
			</section>


			<section className={styles.section}>
				<h3 className={styles.sectionTitle}>Przynależność</h3>
				<div className={styles.sectionBody}>
					<div className={styles.field}>
						<label className={styles.fieldLabel}>Filary</label>
						{canEdit ? (
							<>
								<select
									className={styles.select}
									value=""
									onChange={(e) => {
										const value = e.target.value;
										if (value) {
											const currentPillars = formData.pillars
												? formData.pillars.split(", ")
												: [];
											if (currentPillars.length >= 2) {
												toast.error("Można dodać maksymalnie 2 filary");
												e.target.value = "";
												return;
											}
											if (!currentPillars.includes(value)) {
												const newPillars = [...currentPillars, value];
												setFormData({
													...formData,
													pillars: newPillars.join(", "),
												});
											}
											e.target.value = "";
										}
									}}
								>
									<option value="">Dodaj filar...</option>
									<option value="Konferencyjny">Filar Konferencyjny</option>
									<option value="Projektowy">Filar Projektowy</option>
									<option value="Rzeczniczy">Filar Rzeczniczy</option>
									<option value="Symulacyjny">Filar Symulacyjny</option>
								</select>
								<div className={styles.tags}>
									{(formData.pillars || "")
										.split(", ")
										.filter(Boolean)
										.map((pillar) => (
											<span key={pillar} className={styles.tag}>
												{PILLAR_MAP[pillar] || pillar}
												<button
													type="button"
													className={styles.tagRemove}
													onClick={() => {
														const currentPillars = formData.pillars
															? formData.pillars.split(", ")
															: [];
														const newPillars = currentPillars.filter(
															(p) => p !== pillar,
														);
														setFormData({
															...formData,
															pillars: newPillars.join(", "),
														});
													}}
												>
													<X size={12} />
												</button>
											</span>
										))}
								</div>
							</>
						) : (
							<div className={styles.tags}>
								{(currentMember.pillars || "")
									.split(", ")
									.filter(Boolean)
									.map((pillar) => (
										<span key={pillar} className={styles.tag}>
											{PILLAR_MAP[pillar] || pillar}
										</span>
									))}
							</div>
						)}
						{canEdit && (
							<small className={styles.hint}>
								Wymagany minimum 1 filar, maksymalnie 2 filary
							</small>
						)}
					</div>
				</div>
			</section>

			{/* Zespoły */}
			{(() => {
				const visibleTeams = (currentMember.team || "")
					.split(", ")
					.filter(Boolean)
					.filter((t) => t !== "Brak zespołu")
					.filter((t) => t !== "Mentorzy")
					.filter((t) => {
						if (currentMember.pillars) {
							const pillars = currentMember.pillars.split(", ");
							return !pillars.some((p) => PILLAR_MAP[p] === t || p === t);
						}
						return true;
					});

				// Mentorzy pokazujemy osobno (jeśli są)
				const isMentor = (currentMember.team || "")
					.split(", ")
					.includes("Mentorzy");

				if (visibleTeams.length === 0 && !isMentor) return null;

				return (
					<section className={styles.section}>
						<h3 className={styles.sectionTitle}>Zespoły i przynależność</h3>
						<div className={styles.sectionBody}>
							<div className={styles.field}>
								<label className={styles.fieldLabel}>Zespoły</label>
								<div className={styles.tags}>
									{visibleTeams.length === 0 && !isMentor && (
										<span className={styles.fieldValue}>—</span>
									)}
									{isMentor && (
										<span className={styles.tag}>
											<Star size={12} /> Mentorzy
										</span>
									)}
									{visibleTeams.map((team) => (
										<span key={team} className={styles.tag}>
											{team}
										</span>
									))}
								</div>
								{canEdit && (
									<small className={styles.hint}>
										Zespoły są zarządzane przez strukturę organizacji.
										Skontaktuj się z administratorem, aby zmienić przynależność.
									</small>
								)}
							</div>
						</div>
					</section>
				);
			})()}
			{(currentMember.interests?.length > 0 ||
				currentMember.skills?.length > 0 ||
				currentMember.smAreas?.length > 0 ||
				canEdit) && (
					<section className={styles.section}>
						<h3 className={styles.sectionTitle}>
							Zainteresowania i umiejętności
						</h3>
						<div className={styles.sectionBody}>
							<div className={styles.field}>
								<label className={styles.fieldLabel}>Zainteresowania</label>
								{canEdit ? (
									<>
										<div className={styles.tagInput}>
											<input
												type="text"
												className={styles.input}
												value={newInterest}
												onChange={(e) => setNewInterest(e.target.value)}
												placeholder="Dodaj zainteresowanie"
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														addItem(
															formData.interests || [],
															(list) =>
																setFormData({ ...formData, interests: list }),
															newInterest,
														);
														setNewInterest("");
													}
												}}
											/>
											<button
												type="button"
												className={styles.addBtn}
												onClick={() => {
													addItem(
														formData.interests || [],
														(list) =>
															setFormData({ ...formData, interests: list }),
														newInterest,
													);
													setNewInterest("");
												}}
											>
												<Plus size={16} />
											</button>
										</div>
										<div className={styles.tags}>
											{(formData.interests || []).map((item) => (
												<span key={item} className={styles.tag}>
													{AREA_LABELS[item] || item}
													<button
														type="button"
														className={styles.tagRemove}
														onClick={() =>
															removeItem(
																formData.interests || [],
																(list) =>
																	setFormData({ ...formData, interests: list }),
																item,
															)
														}
													>
														<X size={12} />
													</button>
												</span>
											))}
										</div>
									</>
								) : (
									<div className={styles.tags}>
										{mapAreas(currentMember.interests).map((item) => (
											<span key={item} className={styles.tag}>
												{item}
											</span>
										))}
									</div>
								)}
							</div>

							<div className={styles.field}>
								<label className={styles.fieldLabel}>Umiejętności</label>
								{canEdit ? (
									<>
										<div className={styles.tagInput}>
											<input
												type="text"
												className={styles.input}
												value={newSkill}
												onChange={(e) => setNewSkill(e.target.value)}
												placeholder="Dodaj umiejętność"
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														addItem(
															formData.skills || [],
															(list) =>
																setFormData({ ...formData, skills: list }),
															newSkill,
														);
														setNewSkill("");
													}
												}}
											/>
											<button
												type="button"
												className={styles.addBtn}
												onClick={() => {
													addItem(
														formData.skills || [],
														(list) =>
															setFormData({ ...formData, skills: list }),
														newSkill,
													);
													setNewSkill("");
												}}
											>
												<Plus size={16} />
											</button>
										</div>
										<div className={styles.tags}>
											{(formData.skills || []).map((item) => (
												<span key={item} className={styles.tag}>
													{item}
													<button
														type="button"
														className={styles.tagRemove}
														onClick={() =>
															removeItem(
																formData.skills || [],
																(list) =>
																	setFormData({ ...formData, skills: list }),
																item,
															)
														}
													>
														<X size={12} />
													</button>
												</span>
											))}
										</div>
									</>
								) : (
									<div className={styles.tags}>
										{currentMember.skills.map((item) => (
											<span key={item} className={styles.tag}>
												{item}
											</span>
										))}
									</div>
								)}
							</div>

							<div className={styles.field}>
								<label className={styles.fieldLabel}>
									Obszary działania w SM
								</label>
								{canEdit ? (
									<>
										<div className={styles.tagInput}>
											<input
												type="text"
												className={styles.input}
												value={newArea}
												onChange={(e) => setNewArea(e.target.value)}
												placeholder="Dodaj obszar"
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														addItem(
															formData.smAreas || [],
															(list) =>
																setFormData({ ...formData, smAreas: list }),
															newArea,
														);
														setNewArea("");
													}
												}}
											/>
											<button
												type="button"
												className={styles.addBtn}
												onClick={() => {
													addItem(
														formData.smAreas || [],
														(list) =>
															setFormData({ ...formData, smAreas: list }),
														newArea,
													);
													setNewArea("");
												}}
											>
												<Plus size={16} />
											</button>
										</div>
										<div className={styles.tags}>
											{(formData.smAreas || []).map((item) => (
												<span key={item} className={styles.tag}>
													{AREA_LABELS[item] || item}
													<button
														type="button"
														className={styles.tagRemove}
														onClick={() =>
															removeItem(
																formData.smAreas || [],
																(list) =>
																	setFormData({ ...formData, smAreas: list }),
																item,
															)
														}
													>
														<X size={12} />
													</button>
												</span>
											))}
										</div>
									</>
								) : (
									<div className={styles.tags}>
										{mapAreas(currentMember.smAreas).map((item) => (
											<span key={item} className={styles.tag}>
												{item}
											</span>
										))}
									</div>
								)}
							</div>
						</div>
					</section>
				)}


			{currentMember.vacation && (
				<section className={styles.section}>
					<h3 className={styles.sectionTitle}>Aktualny urlop</h3>
					<div className={styles.sectionBody}>
						<div className={styles.vacationInfo}>
							<Umbrella size={18} />
							<span>
								{formatDate(currentMember.vacation.startDate)} –{" "}
								{formatDate(currentMember.vacation.endDate)}
							</span>
							<span className={styles.vacationType}>
								{currentMember.vacation.type === "team"
									? "Urlop zespołowy"
									: "Urlop organizacyjny"}
							</span>
						</div>
					</div>
				</section>
			)}
		</div>
	);


	const renderAchievementsTab = () => {
		const filtered = verifiedSkills.filter(
			(s) => skillFilter === "all" || s.category === skillFilter,
		);
		const usedCategories = Array.from(
			new Set(verifiedSkills.map((s) => s.category)),
		);
		const hasBadges = badges.length > 0;
		const hasSkills = verifiedSkills.length > 0;

		return (
			<div className={styles.tabContent}>

				{(hasBadges || canManageBadges) && (
					<section className={styles.section}>
						<h3 className={styles.sectionTitle}>
							<Star size={18} />
							Wyróżnienia i odznaki
							{hasBadges && (
								<span className={styles.sectionCount}>{badges.length}</span>
							)}
						</h3>
						<div className={styles.sectionBody}>
							{loadingBadges ? (
								<div className={styles.loadingSpinner} />
							) : (
								<>
									{hasBadges && (
										<div className={styles.badgesSummary}>
											{Object.entries(badgesByMonth).map(([key, count]) => {
												const [y, m] = key.split("-");
												const monthName = MONTHS_PL[parseInt(m) - 1];
												return (
													<span key={key} className={styles.badgeSummaryItem}>
														{monthName} {y}: {count}{" "}
														{count === 1 ? "wyróżnienie" : "wyróżnienia"}
													</span>
												);
											})}
										</div>
									)}

									{hasBadges ? (
										<div className={styles.badgeList}>
											{badges.map((badge) => (
												<div key={badge.id} className={styles.badgeItem}>
													<div className={styles.badgeIcon}>
														<Star size={18} />
													</div>
													<div className={styles.badgeBody}>
														<div className={styles.badgeTitle}>
															{badge.title}
														</div>
														<div className={styles.badgeMeta}>
															{MONTHS_PL[badge.month - 1]} {badge.year}
															{badge.awarded_by_name &&
																` • przyznał: ${badge.awarded_by_name}`}
														</div>
														{badge.description && (
															<div className={styles.badgeDesc}>
																{badge.description}
															</div>
														)}
													</div>
													{canManageBadges && (
														<button
															type="button"
															className={styles.iconBtnDanger}
															onClick={() => handleDeleteBadge(badge.id)}
															title="Usuń odznakę"
														>
															<X size={16} />
														</button>
													)}
												</div>
											))}
										</div>
									) : (
										<p className={styles.emptyText}>Brak wyróżnień</p>
									)}

									{canManageBadges && (
										<div className={styles.addPanel}>
											<div className={styles.addPanelTitle}>
												<Plus size={14} />
												Dodaj wyróżnienie
											</div>
											<div className={styles.field}>
												<input
													type="text"
													className={styles.input}
													placeholder="Tytuł (np. Wyróżnienie miesiąca)"
													value={newBadgeTitle}
													onChange={(e) => setNewBadgeTitle(e.target.value)}
												/>
											</div>
											<div className={styles.field}>
												<textarea
													className={styles.textarea}
													placeholder="Opis (opcjonalnie)"
													value={newBadgeDesc}
													onChange={(e) => setNewBadgeDesc(e.target.value)}
													rows={2}
												/>
											</div>
											<div className={styles.fieldRow}>
												<div className={styles.field}>
													<label className={styles.fieldLabel}>Miesiąc</label>
													<select
														className={styles.select}
														value={newBadgeMonth}
														onChange={(e) =>
															setNewBadgeMonth(parseInt(e.target.value))
														}
													>
														{MONTHS_PL.map((m, i) => (
															<option key={m} value={i + 1}>
																{m}
															</option>
														))}
													</select>
												</div>
												<div className={styles.field}>
													<label className={styles.fieldLabel}>Rok</label>
													<input
														type="number"
														className={styles.input}
														value={newBadgeYear}
														onChange={(e) =>
															setNewBadgeYear(parseInt(e.target.value))
														}
														min={2000}
														max={2100}
													/>
												</div>
											</div>
											<button
												type="button"
												className={styles.primaryBtn}
												onClick={handleAddBadge}
											>
												<Plus size={14} />
												Dodaj odznakę
											</button>
										</div>
									)}
								</>
							)}
						</div>
					</section>
				)}


				{(hasSkills || canManageVerifiedSkills) && (
					<section className={styles.section}>
						<h3 className={styles.sectionTitle}>
							<Award size={18} />
							Umiejętności potwierdzone
							{hasSkills && (
								<span className={styles.sectionCount}>
									{verifiedSkills.length}
								</span>
							)}
						</h3>
						<div className={styles.sectionBody}>
							{loadingVerifiedSkills ? (
								<div className={styles.loadingSpinner} />
							) : (
								<>
									{hasSkills && usedCategories.length > 1 && (
										<div className={styles.filterChips}>
											<button
												type="button"
												className={`${styles.chip} ${skillFilter === "all" ? styles.chipActive : ""}`}
												onClick={() => setSkillFilter("all")}
											>
												Wszystkie ({verifiedSkills.length})
											</button>
											{usedCategories.map((cat) => {
												const count = verifiedSkills.filter(
													(s) => s.category === cat,
												).length;
												return (
													<button
														key={cat}
														type="button"
														className={`${styles.chip} ${skillFilter === cat ? styles.chipActive : ""}`}
														onClick={() => setSkillFilter(cat)}
													>
														{cat} ({count})
													</button>
												);
											})}
										</div>
									)}

									{filtered.length > 0 ? (
										<div className={styles.skillGrid}>
											{filtered.map((skill) => (
												<div key={skill.id} className={styles.skillItem}>
													<div className={styles.skillIcon}>
														<Award size={16} />
													</div>
													<div className={styles.skillBody}>
														<div className={styles.skillName}>
															{skill.skill_name}
														</div>
														<div className={styles.skillCategory}>
															{skill.category}
														</div>
														{skill.description && (
															<div className={styles.skillDesc}>
																{skill.description}
															</div>
														)}
														<div className={styles.skillMeta}>
															przyznał: {skill.awarded_by_name}
														</div>
													</div>
													{canManageVerifiedSkills && (
														<button
															type="button"
															className={styles.iconBtnDanger}
															onClick={() =>
																handleDeleteVerifiedSkill(skill.id)
															}
															title="Usuń"
														>
															<X size={16} />
														</button>
													)}
												</div>
											))}
										</div>
									) : (
										<p className={styles.emptyText}>
											Brak umiejętności w tej kategorii
										</p>
									)}

									{canManageVerifiedSkills && (
										<div className={styles.addPanel}>
											<div className={styles.addPanelTitle}>
												<Plus size={14} />
												Dodaj potwierdzoną umiejętność
											</div>
											<div className={styles.field}>
												<input
													type="text"
													className={styles.input}
													placeholder="Nazwa umiejętności (np. Prowadzenie panelu)"
													value={newSkillName}
													onChange={(e) => setNewSkillName(e.target.value)}
												/>
											</div>
											<div className={styles.field}>
												<label className={styles.fieldLabel}>Kategoria</label>
												<select
													className={styles.select}
													value={newSkillCategory}
													onChange={(e) => setNewSkillCategory(e.target.value)}
												>
													{SKILL_CATEGORIES.map((cat) => (
														<option key={cat} value={cat}>
															{cat}
														</option>
													))}
												</select>
											</div>
											<div className={styles.field}>
												<textarea
													className={styles.textarea}
													placeholder="Opis (opcjonalnie)"
													value={newSkillDesc}
													onChange={(e) => setNewSkillDesc(e.target.value)}
													rows={2}
												/>
											</div>
											<button
												type="button"
												className={styles.primaryBtn}
												onClick={handleAddVerifiedSkill}
											>
												<Plus size={14} />
												Dodaj umiejętność
											</button>
										</div>
									)}
								</>
							)}
						</div>
					</section>
				)}
			</div>
		);
	};


	const renderContactsTab = () => (
		<div className={styles.tabContent}>
			{canViewSensitive && (
				<section className={styles.section}>
					<h3 className={styles.sectionTitle}>Kontakty i znajomości</h3>
					<div className={styles.sectionBody}>
						<div className={styles.field}>
							<label className={styles.fieldLabel}>Kontakty z salami</label>
							{canEdit ? (
								<>
									<div className={styles.tagInput}>
										<input
											type="text"
											className={styles.input}
											value={newSalaContact}
											onChange={(e) => setNewSalaContact(e.target.value)}
											placeholder="Dodaj kontakt"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													addItem(
														formData.contacts?.salaContacts || [],
														(list) =>
															setFormData({
																...formData,
																contacts: {
																	...formData.contacts,
																	salaContacts: list,
																},
															}),
														newSalaContact,
													);
													setNewSalaContact("");
												}
											}}
										/>
										<button
											type="button"
											className={styles.addBtn}
											onClick={() => {
												addItem(
													formData.contacts?.salaContacts || [],
													(list) =>
														setFormData({
															...formData,
															contacts: {
																...formData.contacts,
																salaContacts: list,
															},
														}),
													newSalaContact,
												);
												setNewSalaContact("");
											}}
										>
											<Plus size={16} />
										</button>
									</div>
									<div className={styles.tags}>
										{(formData.contacts?.salaContacts || []).map((item) => (
											<span key={item} className={styles.tag}>
												{item}
												<button
													type="button"
													className={styles.tagRemove}
													onClick={() =>
														removeItem(
															formData.contacts?.salaContacts || [],
															(list) =>
																setFormData({
																	...formData,
																	contacts: {
																		...formData.contacts,
																		salaContacts: list,
																	},
																}),
															item,
														)
													}
												>
													<X size={12} />
												</button>
											</span>
										))}
									</div>
								</>
							) : (
								<div className={styles.tags}>
									{(currentMember.contacts?.salaContacts || []).map((item) => (
										<span key={item} className={styles.tag}>
											{item}
										</span>
									))}
								</div>
							)}
						</div>

						<div className={styles.field}>
							<label className={styles.fieldLabel}>Kontakty z posłami</label>
							{canEdit ? (
								<>
									<div className={styles.tagInput}>
										<input
											type="text"
											className={styles.input}
											value={newMpContact}
											onChange={(e) => setNewMpContact(e.target.value)}
											placeholder="Dodaj kontakt"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													addItem(
														formData.contacts?.mpContacts || [],
														(list) =>
															setFormData({
																...formData,
																contacts: {
																	...formData.contacts,
																	mpContacts: list,
																},
															}),
														newMpContact,
													);
													setNewMpContact("");
												}
											}}
										/>
										<button
											type="button"
											className={styles.addBtn}
											onClick={() => {
												addItem(
													formData.contacts?.mpContacts || [],
													(list) =>
														setFormData({
															...formData,
															contacts: {
																...formData.contacts,
																mpContacts: list,
															},
														}),
													newMpContact,
												);
												setNewMpContact("");
											}}
										>
											<Plus size={16} />
										</button>
									</div>
									<div className={styles.tags}>
										{(formData.contacts?.mpContacts || []).map((item) => (
											<span key={item} className={styles.tag}>
												{item}
												<button
													type="button"
													className={styles.tagRemove}
													onClick={() =>
														removeItem(
															formData.contacts?.mpContacts || [],
															(list) =>
																setFormData({
																	...formData,
																	contacts: {
																		...formData.contacts,
																		mpContacts: list,
																	},
																}),
															item,
														)
													}
												>
													<X size={12} />
												</button>
											</span>
										))}
									</div>
								</>
							) : (
								<div className={styles.tags}>
									{(currentMember.contacts?.mpContacts || []).map((item) => (
										<span key={item} className={styles.tag}>
											{item}
										</span>
									))}
								</div>
							)}
						</div>

						<div className={styles.field}>
							<label className={styles.fieldLabel}>
								Inne przydatne kontakty
							</label>
							{canEdit ? (
								<>
									<div className={styles.tagInput}>
										<input
											type="text"
											className={styles.input}
											value={newOtherContact}
											onChange={(e) => setNewOtherContact(e.target.value)}
											placeholder="Dodaj kontakt"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													addItem(
														formData.contacts?.otherContacts || [],
														(list) =>
															setFormData({
																...formData,
																contacts: {
																	...formData.contacts,
																	otherContacts: list,
																},
															}),
														newOtherContact,
													);
													setNewOtherContact("");
												}
											}}
										/>
										<button
											type="button"
											className={styles.addBtn}
											onClick={() => {
												addItem(
													formData.contacts?.otherContacts || [],
													(list) =>
														setFormData({
															...formData,
															contacts: {
																...formData.contacts,
																otherContacts: list,
															},
														}),
													newOtherContact,
												);
												setNewOtherContact("");
											}}
										>
											<Plus size={16} />
										</button>
									</div>
									<div className={styles.tags}>
										{(formData.contacts?.otherContacts || []).map((item) => (
											<span key={item} className={styles.tag}>
												{item}
												<button
													type="button"
													className={styles.tagRemove}
													onClick={() =>
														removeItem(
															formData.contacts?.otherContacts || [],
															(list) =>
																setFormData({
																	...formData,
																	contacts: {
																		...formData.contacts,
																		otherContacts: list,
																	},
																}),
															item,
														)
													}
												>
													<X size={12} />
												</button>
											</span>
										))}
									</div>
								</>
							) : (
								<div className={styles.tags}>
									{(currentMember.contacts?.otherContacts || []).map(
										(item) => (
											<span key={item} className={styles.tag}>
												{item}
											</span>
										),
									)}
								</div>
							)}
						</div>

						<div className={styles.field}>
							<label className={styles.fieldLabel}>
								Obszary szkoleniowe
							</label>
							{canEdit ? (
								<>
									<div className={styles.tagInput}>
										<input
											type="text"
											className={styles.input}
											value={newTrainingArea}
											onChange={(e) => setNewTrainingArea(e.target.value)}
											placeholder="Dodaj obszar szkoleniowy"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													addItem(
														formData.trainingAreas || [],
														(list) =>
															setFormData({
																...formData,
																trainingAreas: list,
															}),
														newTrainingArea,
													);
													setNewTrainingArea("");
												}
											}}
										/>
										<button
											type="button"
											className={styles.addBtn}
											onClick={() => {
												addItem(
													formData.trainingAreas || [],
													(list) =>
														setFormData({
															...formData,
															trainingAreas: list,
														}),
													newTrainingArea,
												);
												setNewTrainingArea("");
											}}
										>
											<Plus size={16} />
										</button>
									</div>
									<div className={styles.tags}>
										{(formData.trainingAreas || []).map((item) => (
											<span key={item} className={styles.tag}>
												{item}
												<button
													type="button"
													className={styles.tagRemove}
													onClick={() =>
														removeItem(
															formData.trainingAreas || [],
															(list) =>
																setFormData({
																	...formData,
																	trainingAreas: list,
																}),
															item,
														)
													}
												>
													<X size={12} />
												</button>
											</span>
										))}
									</div>
								</>
							) : (
								<div className={styles.tags}>
									{(currentMember.trainingAreas || []).map((item) => (
										<span key={item} className={styles.tag}>
											{item}
										</span>
									))}
								</div>
							)}
						</div>
					</div>
				</section>
			)}


			{canViewContributions && (
				<section className={styles.section}>
					<h3 className={styles.sectionTitle}>
						<CreditCard size={18} />
						Statystyki składek
					</h3>
					<div className={styles.sectionBody}>
						{loadingContributions ? (
							<div className={styles.loadingSpinner} />
						) : contributionStats ? (
							<div className={styles.statsGrid}>
								<div className={styles.statItem}>
									<span className={styles.statLabel}>Bieżący miesiąc</span>
									<span
										className={`${styles.statValue} ${contributionStats.currentMonth?.status === "paid"
											? styles.statPaid
											: contributionStats.hasContributions === false
												? styles.statNone
												: styles.statPending
											}`}
									>
										{contributionStats.currentMonth?.status === "paid"
											? "Opłacona"
											: contributionStats.hasContributions === false
												? "Brak danych"
												: "Nieopłacona"}
									</span>
								</div>
								<div className={styles.statItem}>
									<span className={styles.statLabel}>Kwota</span>
									<span className={styles.statValue}>
										{contributionStats.currentMonth?.amount > 0
											? `${contributionStats.currentMonth.amount.toFixed(2)} zł`
											: "0.00 zł"}
									</span>
								</div>
								<div className={styles.statItem}>
									<span className={styles.statLabel}>Zaległości</span>
									<span
										className={`${styles.statValue} ${contributionStats.summary?.overdueMonths > 0
											? styles.statOverdue
											: ""
											}`}
									>
										{contributionStats.summary?.overdueMonths > 0
											? `${contributionStats.summary.overdueMonths} mies.`
											: "Brak zaległości"}
									</span>
								</div>
								<div className={styles.statItem}>
									<span className={styles.statLabel}>Łącznie opłacone</span>
									<span className={styles.statValue}>
										{contributionStats.summary?.totalPaid > 0
											? `${contributionStats.summary.totalPaid.toFixed(2)} zł`
											: "0.00 zł"}
									</span>
								</div>
							</div>
						) : (
							<p className={styles.emptyText}>Brak danych o składkach</p>
						)}
					</div>
				</section>
			)}
		</div>
	);


	const renderHistoryTab = () => {
		const visibleHistory = showAllHistory
			? changeHistory
			: changeHistory.slice(0, 5);

		return (
			<div className={styles.tabContent}>
				<section className={styles.section}>
					<h3 className={styles.sectionTitle}>
						<Calendar size={18} />
						Historia zmian
						{changeHistory.length > 0 && (
							<span className={styles.sectionCount}>
								{changeHistory.length}
							</span>
						)}
					</h3>
					<div className={styles.sectionBody}>
						{loadingHistory ? (
							<div className={styles.loadingSpinner} />
						) : changeHistory.length === 0 ? (
							<p className={styles.emptyText}>Brak historii zmian</p>
						) : (
							<>
								<div className={styles.historyList}>
									{visibleHistory.map((change) => (
										<div key={change.id} className={styles.historyItem}>
											<div className={styles.historyHeader}>
												<strong className={styles.historyField}>
													{FIELD_LABELS[change.field] || change.field}
												</strong>
												<span className={styles.historyDate}>
													{formatHistoryDate(change.changed_at)}
												</span>
											</div>
											<div className={styles.historyChange}>
												<span className={styles.historyOld}>
													{change.old_value || "—"}
												</span>
												<span className={styles.historyArrow}>→</span>
												<strong className={styles.historyNew}>
													{change.new_value || "—"}
												</strong>
											</div>
											<div className={styles.historyMeta}>
												przez: {change.changed_by_name}
											</div>
										</div>
									))}
								</div>

								{changeHistory.length > 5 && (
									<button
										type="button"
										className={styles.linkBtn}
										onClick={() => setShowAllHistory(!showAllHistory)}
									>
										{showAllHistory
											? "Pokaż mniej"
											: `Pokaż wszystkie (${changeHistory.length})`}
									</button>
								)}
							</>
						)}
					</div>
				</section>
			</div>
		);
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div
				className={styles.modal}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modalHeader}>
					<div>
						<h2 className={styles.modalTitle}>
							{!currentMember?.id
								? "Dodaj nowego członka"
								: isEdit
									? "Edytuj profil"
									: `${currentMember.firstName} ${currentMember.lastName}`}
						</h2>
						{!isEdit && currentMember?.id && (
							<p className={styles.modalSubtitle}>
								{currentMember.function} • {currentMember.email}
							</p>
						)}
					</div>
					<button className={styles.modalClose} onClick={onClose}>
						<X size={20} />
					</button>
				</div>


				{currentMember?.id && !isEdit && (
					<div className={styles.tabs}>
						<button
							className={`${styles.tab} ${activeTab === "overview" ? styles.tabActive : ""}`}
							onClick={() => setActiveTab("overview")}
						>
							Przegląd
						</button>
						<button
							className={`${styles.tab} ${activeTab === "achievements" ? styles.tabActive : ""}`}
							onClick={() => setActiveTab("achievements")}
						>
							Osiągnięcia
						</button>
						{canViewSensitive && (
							<button
								className={`${styles.tab} ${activeTab === "contacts" ? styles.tabActive : ""}`}
								onClick={() => setActiveTab("contacts")}
							>
								Kontakty
							</button>
						)}
						{canViewHistory && (
							<button
								className={`${styles.tab} ${activeTab === "history" ? styles.tabActive : ""}`}
								onClick={() => setActiveTab("history")}
							>
								Historia
							</button>
						)}
					</div>
				)}

				<form onSubmit={handleSubmit} className={styles.modalBody}>
					{isEdit || !currentMember?.id ? (

						<>
							{renderOverviewTab()}
							{renderAchievementsTab()}
							{renderContactsTab()}
						</>
					) : (

						<>
							{activeTab === "overview" && renderOverviewTab()}
							{activeTab === "achievements" && renderAchievementsTab()}
							{activeTab === "contacts" && renderContactsTab()}
							{activeTab === "history" && renderHistoryTab()}
						</>
					)}

					<div className={styles.modalActions}>
						<button
							type="button"
							className={styles.btnCancel}
							onClick={onClose}
						>
							{isEdit ? "Anuluj" : "Zamknij"}
						</button>
						{isEdit && canEdit && (
							<button
								type="submit"
								className={styles.btnSave}
								disabled={!formData.status}
							>
								Zapisz zmiany
							</button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════════
   GŁÓWNY KOMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function Members({ title }: { title?: string }) {
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [members, setMembers] = useState<Member[]>([]);
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedProvince, setSelectedProvince] = useState<string>("all");
	const [selectedTeam, setSelectedTeam] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [selectedPillar, setSelectedPillar] = useState<string>("all");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState<Member | null>(null);
	const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
	const [selectedFunction, setSelectedFunction] = useState<string>("all");
	const [allContributions, setAllContributions] = useState<
		Record<string, { status: string; amount: number }>
	>({});
	const [_loadingAllContributions, setLoadingAllContributions] =
		useState(false);
	const [newMemberData, setNewMemberData] = useState<Partial<Member> | null>(
		null,
	);
	const [teamsList, setTeamsList] = useState<
		{ id: number; name: string; parent_id?: number | null }[]
	>([]);
	const [contributionStats, setContributionStats] = useState<any>(null);
	const [loadingContributions, setLoadingContributions] = useState(false);
	const [badgesCounts, setBadgesCounts] = useState<Record<string, number>>({});
	const [sortBy, setSortBy] = useState<
		"name" | "function" | "province" | "status"
	>("name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

	const fetchContributionStats = async (memberId?: string) => {
		try {
			setLoadingContributions(true);
			const token = localStorage.getItem("accessToken");

			const url = memberId
				? `/api/dashboard/contributions/${memberId}`
				: "/api/dashboard/contributions";

			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const data = await response.json();
				setContributionStats(data);
				setMembers((prev) => [...prev]);
			} else {
				console.error(" [fetch] Błąd:", response.status);
			}
		} catch (error) {
			console.error(" [fetch] Błąd:", error);
		} finally {
			setLoadingContributions(false);
		}
	};

	const fetchAllContributions = async () => {
		try {
			setLoadingAllContributions(true);
			const token = localStorage.getItem("accessToken");
			const response = await fetch("/api/contributions/all", {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});
			if (response.ok) {
				const data = await response.json();
				setAllContributions(data.contributions || {});
			}
		} catch (error) {
			console.error(" Błąd pobierania składek dla wszystkich:", error);
		} finally {
			setLoadingAllContributions(false);
		}
	};

	useEffect(() => {
		if (currentUser?.role === "admin" || currentUser?.role === "board") {
			fetchAllContributions();
		}
	}, [currentUser]);

	useEffect(() => {
		if (isProfileOpen || isEditOpen) {
			if (selectedMember?.id) {
				fetchContributionStats(selectedMember.id);
			}
		}
	}, [isProfileOpen, isEditOpen, selectedMember?.id]);

	const functions = useMemo(() => {
		const unique = new Set(
			members
				.map((m) => m.function)
				.filter((f) => f && f !== "" && f !== "Członek"),
		);
		return Array.from(unique).sort();
	}, [members]);

	useEffect(() => {
		const fetchAllData = async () => {
			try {
				setLoading(true);
				const token = localStorage.getItem("accessToken");
				if (!token) {
					logger.warn("Brak tokena - przekierowanie do logowania");
					safeNavigate("/login", navigate);
					return;
				}

				const userResponse = await fetch("/api/profile", {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (userResponse.status === 401) {
					localStorage.removeItem("accessToken");
					safeNavigate("/login", navigate);
					return;
				}
				if (!userResponse.ok) throw new Error("Błąd profilu");
				const userData = await userResponse.json();

				setCurrentUser({
					id: userData.id,
					name:
						`${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
						"Użytkownik",
					role: userData.role || "member",
					teamId: userData.teamId,
				});

				const teamsResponse = await fetch("/api/teams", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (teamsResponse.ok) {
					const teamsData = await teamsResponse.json();
					setTeamsList(teamsData);
				}

				const membersResponse = await fetch("/api/members", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!membersResponse.ok) throw new Error("Błąd członków");
				const membersData = await membersResponse.json();
				logger.debug("Dane z backendu:", membersData);

				const mappedMembers = membersData.map(mapApiUserToMember);

				logger.debug("Wszyscy członkowie po mapowaniu:", mappedMembers);
				logger.debug(
					" Lista zespołów:",
					mappedMembers.map((m: any) => m.team),
				);
				setMembers(mappedMembers);


				try {
					const badgesRes = await fetch("/api/members/badges-counts", {
						headers: { Authorization: `Bearer ${token}` },
					});
					if (badgesRes.ok) {
						const data = await badgesRes.json();
						setBadgesCounts(data.counts || {});
					}
				} catch (e) {
					logger.error("Błąd pobierania liczników odznak:", e);
				}
			} catch (error) {
				logger.error("Błąd:", error);
				setMembers([]);
			} finally {
				setLoading(false);
			}
		};

		fetchAllData();
	}, [navigate]);

	const handleAddMember = useCallback(() => {
		const newMember: Partial<Member> = {
			id: `member-${Date.now()}`,
			firstName: "",
			lastName: "",
			function: "",
			team: "",
			teamId: "",
			province: "",
			status: "",
			interests: [],
			skills: [],
			smAreas: [],
			email: "",
			phone: "",
			joinDate: new Date().toISOString().split("T")[0],
			contacts: {
				salaContacts: [],
				mpContacts: [],
				otherContacts: [],
			},
			trainingAreas: [],
			contributionInfo: {
				status: "paid",
				arrears: 0,
			},
		};
		setNewMemberData(newMember);
		setIsAddMemberOpen(true);
	}, []);

	const handleAddNewMember = useCallback(
		async (member: Member) => {
			const pillarsArray = member.pillars
				? member.pillars.split(", ").filter(Boolean)
				: [];
			if (member.pillars && pillarsArray.length > 2) {
				toast.error("Członek może być przypisany do maksymalnie 2 filarów");
				return;
			}
			if (!member.pillars || member.pillars.trim() === "") {
				toast.error(
					"Członek musi być przypisany do przynajmniej jednego filaru",
				);
				return;
			}

			if (!member.status) {
				toast.error("Wybierz status członka");
				return;
			}
			if (!member.email) {
				toast.error("Podaj adres email");
				return;
			}
			if (!member.firstName || !member.lastName) {
				toast.error("Imię i nazwisko są wymagane");
				return;
			}

			try {
				const token = localStorage.getItem("accessToken");
				if (!token) {
					logger.warn("Brak tokena - przekierowanie do logowania");
					safeNavigate("/login", navigate);
					return;
				}

				const teamName = member.team;
				if (teamName && !teamsList.some((t) => t.name === teamName)) {
					if (!teamName || !teamName.trim()) {
						toast.error("Nazwa nowego zespołu jest wymagana");
						return;
					}

					const teamData = {
						name: teamName.trim(),
						role: "Zespół",
						description: null,
						icon: "Users",
						status: "active",
						parent_id: null,
						email: null,
					};

					const createTeamResponse = await fetch("/api/teams", {
						method: "POST",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify(teamData),
					});

					if (!createTeamResponse.ok) {
						const errorText = await createTeamResponse.text();
						throw new Error(
							`Błąd tworzenia zespołu: ${createTeamResponse.status} - ${errorText}`,
						);
					}

					const newTeam = await createTeamResponse.json();
					setTeamsList([...teamsList, newTeam]);
					toast.success(`Nowy zespół "${teamName}" został utworzony!`);
				}

				const response = await fetch("/api/members", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(member),
				});

				if (!response.ok) {
					const errorText = await response.text();
					let errorMessage = "Nie udało się dodać członka";
					try {
						const errorData = JSON.parse(errorText);
						if (errorData.error) {
							errorMessage = errorData.error;
						}
					} catch (e) {
						errorMessage = errorText || "Nie udało się dodać członka";
					}
					toast.error(errorMessage);
					throw new Error(errorMessage);
				}

				const savedMember = await response.json();
				setMembers([savedMember, ...members]);
				setIsAddMemberOpen(false);
				setNewMemberData(null);
				toast.success(
					`Członek ${member.firstName} ${member.lastName} został dodany!`,
				);
			} catch (error) {
				logger.error("Błąd dodawania członka:", error);
				toast.error(
					error instanceof Error
						? error.message
						: "Nie udało się dodać członka",
				);
			}
		},
		[teamsList, members, navigate],
	);

	const provinces = useMemo(() => {
		const unique = new Set(
			members
				.map((m) => m.province)
				.filter((p) => p && p !== "" && p !== "Brak" && p !== "Nieznane"),
		);
		return Array.from(unique).sort();
	}, [members]);

	const teams = useMemo(() => {
		const allTeams = new Set<string>();
		members.forEach((member) => {
			const teamList = member.team.split(", ");
			teamList.forEach((team) => {
				if (team && team !== "Brak zespołu") {
					allTeams.add(team);
				}
			});

			if (member.pillars) {
				const pillarList = member.pillars.split(", ");
				pillarList.forEach((pillar) => {
					if (pillar) {
						allTeams.add(`Filar ${pillar}`);
					}
				});
			}
		});
		return Array.from(allTeams).sort();
	}, [members]);

	const [confirmDialog, setConfirmDialog] = useState<{
		isOpen: boolean;
		member: Member | null;
	}>({ isOpen: false, member: null });

	const handleDeleteMember = useCallback((member: Member) => {
		setConfirmDialog({ isOpen: true, member });
	}, []);

	const confirmDelete = useCallback(async () => {
		const member = confirmDialog.member;
		if (!member) return;

		setConfirmDialog({ isOpen: false, member: null });

		try {
			const token = localStorage.getItem("accessToken");
			if (!token) {
				logger.warn("Brak tokena - przekierowanie do logowania");
				safeNavigate("/login", navigate);
				return;
			}
			const response = await fetch(`/api/members/${member.id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Błąd usuwania: ${response.status} - ${errorText}`);
			}

			setMembers(members.filter((m) => m.id !== member.id));
			toast.success(
				`Członek ${member.firstName} ${member.lastName} został usunięty.`,
			);
		} catch (error) {
			logger.error("Błąd usuwania członka:", error);
			toast.error("Nie udało się usunąć członka");
		}
	}, [confirmDialog.member, members, navigate]);

	const cancelDelete = useCallback(() => {
		setConfirmDialog({ isOpen: false, member: null });
	}, []);

	const filteredMembers = useMemo(() => {
		const result = members
			.filter((member) => {
				const isSystemAdmin =
					member.email === "admin@system.pl" ||
					(member.firstName === "Admin" && member.lastName === "System");

				if (isSystemAdmin) {
					return false;
				}

				const searchLower = searchTerm.toLowerCase();

				const matchesFunction =
					selectedFunction === "all" || member.function === selectedFunction;

				const fullName =
					`${member.firstName || ""} ${member.lastName || ""}`.toLowerCase();

				const matchesSearch =
					fullName.includes(searchLower) ||
					(member.firstName || "").toLowerCase().includes(searchLower) ||
					(member.lastName || "").toLowerCase().includes(searchLower) ||
					(member.function || "").toLowerCase().includes(searchLower) ||
					(member.team || "").toLowerCase().includes(searchLower) ||
					(member.pillars || "").toLowerCase().includes(searchLower) ||
					(member.province || "").toLowerCase().includes(searchLower) ||
					member.skills.some((s) => s.toLowerCase().includes(searchLower)) ||
					member.interests.some((i) => i.toLowerCase().includes(searchLower)) ||
					member.smAreas.some((a) => a.toLowerCase().includes(searchLower));

				const matchesProvince =
					selectedProvince === "all" || member.province === selectedProvince;

				const matchesTeam =
					selectedTeam === "all" ||
					member.team.split(", ").includes(selectedTeam);

				const matchesStatus =
					selectedStatus === "all" || member.status === selectedStatus;

				const matchesPillar =
					selectedPillar === "all" ||
					member.pillars.split(", ").includes(selectedPillar);

				return (
					matchesSearch &&
					matchesProvince &&
					matchesTeam &&
					matchesFunction &&
					matchesStatus &&
					matchesPillar
				);
			})
			.map((member) => {
				let contributionBadge: "paid" | "pending" | "none" = "none";

				const contribution = allContributions[member.id];
				if (contribution) {
					contributionBadge =
						contribution.status === "PAID" ? "paid" : "pending";
				}

				return {
					...member,
					contributionBadge,
				};
			})
			.sort((a, b) => {
				let comparison = 0;
				switch (sortBy) {
					case "name":
						comparison = (
							(a.firstName || "") + (a.lastName || "")
						).localeCompare((b.firstName || "") + (b.lastName || ""));
						break;
					case "function":
						comparison = (a.function || "").localeCompare(b.function || "");
						break;
					case "province":
						comparison = (a.province || "").localeCompare(b.province || "");
						break;
					case "status":
						comparison = (a.status || "").localeCompare(b.status || "");
						break;
					default:
						comparison = 0;
				}
				return sortOrder === "asc" ? comparison : -comparison;
			});
		return result;
	}, [
		members,
		searchTerm,
		selectedProvince,
		selectedTeam,
		selectedFunction,
		selectedStatus,
		selectedPillar,
		sortBy,
		sortOrder,
		allContributions,
	]);


	const stats = useMemo(() => {
		const total = members.length;
		const active = members.filter((m) => m.status === "active").length;
		const trial = members.filter((m) => m.status === "trial").length;
		const mentors = members.filter((m) => m.status === "mentor").length;
		const onVacation = members.filter((m) => m.status === "vacation").length;
		const provincesCount = new Set(
			members.map((m) => m.province).filter((p) => p && p !== "Brak"),
		).size;

		return { total, active, trial, mentors, onVacation, provincesCount };
	}, [members]);

	const handleViewMember = useCallback((member: Member) => {
		setSelectedMember(member);
		setIsProfileOpen(true);
	}, []);

	const handleEditMember = useCallback((member: Member) => {
		setSelectedMember(member);
		setIsEditOpen(true);
	}, []);

	const handleStatusChange = useCallback(
		async (member: Member, newStatus: MemberStatus) => {
			try {
				const token = localStorage.getItem("accessToken");
				if (!token) {
					logger.warn("Brak tokena - przekierowanie do logowania");
					safeNavigate("/login", navigate);
					return;
				}

				const response = await fetch(`/api/members/${member.id}/status`, {
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ status: newStatus }),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Błąd zmiany statusu");
				}

				const membersResponse = await fetch("/api/members", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (membersResponse.ok) {
					const freshMembers = await membersResponse.json();
					const mappedMembers = freshMembers.map(mapApiUserToMember);
					setMembers(mappedMembers);
				}

				toast.success(`Status zmieniony na ${newStatus}`);
			} catch (error) {
				logger.error("Błąd zmiany statusu:", error);
				toast.error(
					error instanceof Error
						? error.message
						: "Nie udało się zmienić statusu",
				);
			}
		},
		[navigate],
	);

	const handleSaveMember = useCallback(
		async (updatedMember: Member) => {
			const pillarsArray = updatedMember.pillars
				? updatedMember.pillars.split(", ").filter(Boolean)
				: [];
			if (updatedMember.pillars && pillarsArray.length > 2) {
				toast.error("Członek może być przypisany do maksymalnie 2 filarów");
				return;
			}
			if (!updatedMember.pillars || updatedMember.pillars.trim() === "") {
				toast.error(
					"Członek musi być przypisany do przynajmniej jednego filaru",
				);
				return;
			}

			try {
				const token = localStorage.getItem("accessToken");
				if (!token) {
					logger.warn("Brak tokena - przekierowanie do logowania");
					safeNavigate("/login", navigate);
					return;
				}

				await handleStatusChange(updatedMember, updatedMember.status);

				const response = await fetch(`/api/members/${updatedMember.id}`, {
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						firstName: updatedMember.firstName,
						lastName: updatedMember.lastName,
						function: updatedMember.function,
						team: updatedMember.team,
						pillars: updatedMember.pillars,
						province: updatedMember.province,
						email: updatedMember.email,
						phone: updatedMember.phone,
						joinDate: updatedMember.joinDate,
					}),
				});

				if (!response.ok) {
					throw new Error("Błąd aktualizacji danych");
				}

				const membersResponse = await fetch("/api/members", {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (membersResponse.ok) {
					const freshMembers = await membersResponse.json();
					const mappedMembers = freshMembers.map(mapApiUserToMember);
					setMembers(mappedMembers);
				}

				setIsEditOpen(false);
				setSelectedMember(null);
				toast.success("Dane członka zostały zaktualizowane!");
			} catch (error) {
				logger.error("Błąd aktualizacji:", error);
				toast.error(
					error instanceof Error
						? error.message
						: "Nie udało się zaktualizować danych",
				);
			}
		},
		[navigate, handleStatusChange],
	);

	const clearFilters = useCallback(() => {
		setSearchTerm("");
		setSelectedProvince("all");
		setSelectedTeam("all");
		setSelectedFunction("all");
		setSelectedStatus("all");
		setSelectedPillar("all");
	}, []);

	const hasActiveFilters =
		selectedProvince !== "all" ||
		selectedTeam !== "all" ||
		selectedFunction !== "all" ||
		selectedStatus !== "all" ||
		selectedPillar !== "all" ||
		searchTerm !== "";

	if (loading || !currentUser) {
		return (
			<div className={styles.members}>
				<div className={styles.loadingState}>
					<div className={styles.loadingSpinner}></div>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.members}>

			<header className={styles.header}>
				<div className={styles.header__left}>
					<h1 className={styles.header__title}>
						{title ?? "Członkowie Siły Młodych"}
					</h1>
					<div className={styles.header__stats}>
						<span className={styles.header__stat}>
							<strong>{stats.total}</strong> członków
						</span>
						<span className={styles.header__statDivider}>·</span>
						<span className={styles.header__stat}>
							<strong>{stats.active}</strong> pełnoprawnych
						</span>
						<span className={styles.header__statDivider}>·</span>
						<span className={styles.header__stat}>
							<strong>{stats.mentors}</strong> mentorów
						</span>
						{stats.onVacation > 0 && (
							<>
								<span className={styles.header__statDivider}>·</span>
								<span className={styles.header__stat}>
									<strong>{stats.onVacation}</strong> na urlopie
								</span>
							</>
						)}
						<span className={styles.header__statDivider}>·</span>
						<span className={styles.header__stat}>
							<strong>{stats.provincesCount}</strong> okręgów
						</span>
					</div>
				</div>

				{hasPermission(currentUser?.role, "canEditUsers") && (
					<button className={styles.header__addBtn} onClick={handleAddMember}>
						<Plus size={18} />
						Dodaj członka
					</button>
				)}
			</header>


			<div className={styles.filters}>
				<div className={styles.filters__search}>
					<Search size={18} className={styles.filters__searchIcon} />
					<input
						type="text"
						className={styles.filters__searchInput}
						placeholder="Szukaj po imieniu, funkcji, zespole, umiejętnościach..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					{searchTerm && (
						<button
							className={styles.filters__clear}
							onClick={() => setSearchTerm("")}
						>
							<X size={14} />
						</button>
					)}
				</div>

				<div className={styles.filters__group}>
					<Filter size={16} className={styles.filters__groupIcon} />

					<select
						className={styles.filters__select}
						value={selectedFunction}
						onChange={(e) => setSelectedFunction(e.target.value)}
					>
						<option value="all">Wszystkie funkcje</option>
						<option value="Członek">Członek</option>
						{functions.map((f) => (
							<option key={f} value={f}>
								{f}
							</option>
						))}
					</select>

					<select
						className={styles.filters__select}
						value={selectedStatus}
						onChange={(e) => setSelectedStatus(e.target.value)}
					>
						<option value="all">Wszystkie statusy</option>
						<option value="active">Pełnoprawni</option>
						<option value="trial">Okres próbny</option>
						<option value="mentor">Mentorzy</option>
						<option value="vacation">Na urlopie</option>
					</select>

					<select
						className={styles.filters__select}
						value={selectedPillar}
						onChange={(e) => setSelectedPillar(e.target.value)}
					>
						<option value="all">Wszystkie filary</option>
						<option value="Konferencyjny">Filar Konferencyjny</option>
						<option value="Projektowy">Filar Projektowy</option>
						<option value="Rzeczniczy">Filar Rzeczniczy</option>
						<option value="Symulacyjny">Filar Symulacyjny</option>
					</select>

					<select
						className={styles.filters__select}
						value={selectedProvince}
						onChange={(e) => setSelectedProvince(e.target.value)}
					>
						<option value="all">Wszystkie województwa</option>
						{provinces.map((p) => (
							<option key={p} value={p}>
								{p}
							</option>
						))}
					</select>

					<select
						className={styles.filters__select}
						value={selectedTeam}
						onChange={(e) => setSelectedTeam(e.target.value)}
					>
						<option value="all">Wszystkie zespoły</option>
						{teams.map((t) => (
							<option key={t} value={t}>
								{t}
							</option>
						))}
					</select>

					<select
						className={styles.filters__select}
						value={`${sortBy}-${sortOrder}`}
						onChange={(e) => {
							const [field, order] = e.target.value.split("-") as [
								"name" | "function" | "province" | "status",
								"asc" | "desc",
							];
							setSortBy(field);
							setSortOrder(order);
						}}
					>
						<option value="name-asc">Nazwa A–Z</option>
						<option value="name-desc">Nazwa Z–A</option>
						<option value="function-asc">Funkcja A–Z</option>
						<option value="function-desc">Funkcja Z–A</option>
						<option value="province-asc">Województwo A–Z</option>
						<option value="province-desc">Województwo Z–A</option>
						<option value="status-asc">Status A–Z</option>
						<option value="status-desc">Status Z–A</option>
					</select>

					<div className={styles.filters__viewToggle}>
						<button
							className={`${styles.filters__viewBtn} ${viewMode === "grid" ? styles.filters__viewBtnActive : ""}`}
							onClick={() => setViewMode("grid")}
							title="Widok kart"
						>
							<Grid size={18} />
						</button>
						<button
							className={`${styles.filters__viewBtn} ${viewMode === "list" ? styles.filters__viewBtnActive : ""}`}
							onClick={() => setViewMode("list")}
							title="Widok listy"
						>
							<List size={18} />
						</button>
					</div>

					{hasActiveFilters && (
						<button className={styles.filters__reset} onClick={clearFilters}>
							Wyczyść
						</button>
					)}
				</div>
			</div>


			{loading ? (
				<div className={styles.loadingState}>
					<div className={styles.loadingSpinner}></div>
					<p>Ładowanie członków...</p>
				</div>
			) : filteredMembers.length === 0 ? (
				<div className={styles.emptyState}>
					<User size={48} className={styles.emptyState__icon} />
					<h3 className={styles.emptyState__title}>Brak członków</h3>
					<p className={styles.emptyState__description}>
						{hasActiveFilters
							? "Nie znaleziono członków spełniających kryteria wyszukiwania."
							: "Nie ma jeszcze żadnych członków w organizacji."}
					</p>
				</div>
			) : viewMode === "list" ? (
				<div className={styles.membersList}>
					<div className={styles.membersList__header}>
						<div className={styles.membersList__headerCell}>Członek</div>
						<div className={styles.membersList__headerCell}>Funkcja</div>
						<div className={styles.membersList__headerCell}>Zespół</div>
						<div className={styles.membersList__headerCell}>Województwo</div>
						<div className={styles.membersList__headerCell}>Status</div>
						<div className={styles.membersList__headerCell}></div>
						<div className={styles.membersList__headerCell}></div>
					</div>
					{filteredMembers.map((member) => (
						<MemberCard
							key={member.id}
							member={member}
							currentUser={currentUser}
							onView={handleViewMember}
							onEdit={handleEditMember}
							onDelete={handleDeleteMember}
							viewMode={viewMode}
							contributionBadge={member.contributionBadge}
							badgesCount={badgesCounts[member.id]}
						/>
					))}
				</div>
			) : (
				<div className={styles.membersGrid}>
					{filteredMembers.map((member) => (
						<MemberCard
							key={member.id}
							member={member}
							currentUser={currentUser}
							onView={handleViewMember}
							onEdit={handleEditMember}
							onDelete={handleDeleteMember}
							viewMode={viewMode}
							contributionBadge={member.contributionBadge}
							badgesCount={badgesCounts[member.id]}
						/>
					))}
				</div>
			)}


			<ProfileModal
				isOpen={isAddMemberOpen}
				member={newMemberData as Member}
				currentUser={currentUser}
				isEdit={true}
				onClose={() => {
					setIsAddMemberOpen(false);
					setNewMemberData(null);
				}}
				onSave={handleAddNewMember}
			/>

			<ProfileModal
				isOpen={isProfileOpen}
				member={selectedMember}
				currentUser={currentUser}
				isEdit={false}
				onClose={() => {
					setIsProfileOpen(false);
					setSelectedMember(null);
				}}
				contributionStats={contributionStats}
				loadingContributions={loadingContributions}
			/>

			<ProfileModal
				isOpen={isEditOpen}
				member={selectedMember}
				currentUser={currentUser}
				isEdit={true}
				onClose={() => {
					setIsEditOpen(false);
					setSelectedMember(null);
				}}
				onSave={handleSaveMember}
				contributionStats={contributionStats}
				loadingContributions={loadingContributions}
			/>

			<ConfirmDialog
				isOpen={confirmDialog.isOpen}
				title="Potwierdź usunięcie"
				message={`Czy na pewno chcesz usunąć członka ${confirmDialog.member?.firstName} ${confirmDialog.member?.lastName}?`}
				confirmText="Usuń"
				cancelText="Anuluj"
				onConfirm={confirmDelete}
				onCancel={cancelDelete}
			/>
		</div>
	);
}