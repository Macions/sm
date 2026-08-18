import { safeNavigate } from "@/utils/safeNavigation";
import { useNavigate } from "react-router-dom";
import React from "react";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { useState } from "react";
import { logger } from "@/utils/logger";
import {
	User,
	MapPin,
	Briefcase,
	Clock,
	CheckCircle,
	AlertCircle,
	Mail,
	Phone,
	Calendar,
	Edit,
	Save,
	X,
	Users,
	Star,
	Award,
	BookOpen,
	TrendingUp,
	Umbrella,
	CreditCard,
	Eye,
	Shield,
	Camera,
	Settings,
	Plus,
} from "lucide-react";
import styles from "./Profile.module.css";

type MemberStatus = "active" | "trial" | "mentor";
type DevelopmentArea =
	| "projects"
	| "conferences"
	| "advocacy"
	| "simulations"
	| "social_media"
	| "graphics"
	| "editing"
	| "it"
	| "event_organization";

type ContributionStatus = "paid" | "partial" | "unpaid";

interface Member {
	id: string;
	firstName: string;
	lastName: string;
	avatar?: string;
	function: string;
	team: string;
	province: string;
	status: MemberStatus;
	email: string;
	phone?: string;
	joinDate: string;
	mentor?: string;
	mentee?: string[];
	currentTasks: string[];
	projects: string[];
	developmentAreas: DevelopmentArea[];
	skills: string[];
	availability: string;
	description?: string;
	contacts?: {
		salaContacts: string[];
		mpContacts: string[];
		institutionContacts: string[];
		otherContacts: string[];
	};
	contributionInfo?: {
		arrears: number;
		status: ContributionStatus;
	};
	leave?: {
		isOnLeave: boolean;
		endDate?: string;
		history: {
			id: string;
			startDate: string;
			endDate: string;
			status: string;
		}[];
	};
}

const EMPTY_USER: Member = {
	id: "",
	firstName: "",
	lastName: "",
	function: "",
	team: "",
	province: "",
	status: "active",
	email: "",
	joinDate: "",
	currentTasks: [],
	projects: [],
	developmentAreas: [],
	skills: [],
	availability: "",
};

const STATUS_LABELS: Record<MemberStatus, string> = {
	active: "Pełnoprawny członek",
	trial: "Okres próbny",
	mentor: "Mentor",
};

const STATUS_COLORS: Record<MemberStatus, string> = {
	trial: styles.statusTrial,
	active: styles.statusFull,
	mentor: styles.statusMentor,
};

const STATUS_ICONS: Record<MemberStatus, React.ReactNode> = {
	trial: <Clock size={16} />,
	active: <CheckCircle size={16} />,
	mentor: <Star size={16} />,
};
const DEVELOPMENT_AREA_LABELS: Record<DevelopmentArea, string> = {
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

const DEVELOPMENT_AREA_ICONS: Record<DevelopmentArea, React.ReactNode> = {
	projects: <Briefcase size={14} />,
	conferences: <Users size={14} />,
	advocacy: <Shield size={14} />,
	simulations: <Award size={14} />,
	social_media: <Camera size={14} />,
	graphics: <Eye size={14} />,
	editing: <Edit size={14} />,
	it: <Settings size={14} />,
	event_organization: <Calendar size={14} />,
};

const CONTRIBUTION_STATUS_LABELS: Record<ContributionStatus, string> = {
	paid: "Opłacone",
	partial: "Częściowo opłacone",
	unpaid: "Nieopłacone",
};

const CONTRIBUTION_STATUS_COLORS: Record<ContributionStatus, string> = {
	paid: styles.contributionPaid,
	partial: styles.contributionPartial,
	unpaid: styles.contributionUnpaid,
};

export default function Profile({
	title,
	userId,
}: {
	title?: string;
	userId?: string;
}) {
	const [user, setUser] = useState<Member>(EMPTY_USER);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);

	const [editData, setEditData] = useState<Partial<Member>>({});
	const [selectedTab, setSelectedTab] = useState<string>("profile");
	const [contributionStats, setContributionStats] = useState<any>(null);
	const [contributionHistory, setContributionHistory] = useState<any[]>([]);

	// Dodaj na początku komponentu, obok innych useState
	const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
	const [newSkillName, setNewSkillName] = useState("");
	const [isAddingSkill, setIsAddingSkill] = useState(false);

	const [completedTasks, setCompletedTasks] = useState<any[]>([]);
	const [loadingTasks, setLoadingTasks] = useState(false);
	const [loadingContributions, setLoadingContributions] = useState(false);
	const [loadingHistory, _setLoadingHistory] = useState(false);

	const navigate = useNavigate();

	const fetchCompletedTasks = async (userId?: string) => {
		try {
			setLoadingTasks(true);
			const token = localStorage.getItem("accessToken");

			let targetUserId = userId;
			if (!targetUserId) {
				const profileRes = await fetch("/api/profile", {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (profileRes.ok) {
					const profile = await profileRes.json();
					targetUserId = profile.id;
				}
			}

			if (!targetUserId) {
				console.warn("Brak ID użytkownika");
				setLoadingTasks(false);
				return;
			}

			const url = `/api/tasks/completed/${targetUserId}`;

			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const data = await response.json();
				setCompletedTasks(data.tasks || []);
			} else {
				console.error("Błąd pobierania zadań:", response.status);
			}
		} catch (error) {
			console.error("Błąd:", error);
		} finally {
			setLoadingTasks(false);
		}
	};

	const fetchProfile = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem("accessToken");
			const url = userId ? `/api/profile/${userId}` : "/api/profile";

			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Nie udało się pobrać profilu");
			}

			const data = await response.json();
			setUser(data);
		} catch (error) {
			logger.error("Błąd pobierania profilu:", error);
			toast.error("Nie udało się pobrać profilu");
		} finally {
			setLoading(false);
		}
	};

	const fetchContributions = async (userId?: string) => {
		try {
			setLoadingContributions(true);
			const token = localStorage.getItem("accessToken");

			let targetUserId = userId;
			if (!targetUserId) {
				const profileRes = await fetch("/api/profile", {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (profileRes.ok) {
					const profile = await profileRes.json();
					targetUserId = profile.id;
				}
			}

			const url = targetUserId
				? `/api/contributions/history/${targetUserId}`
				: "/api/contributions/history/me";

			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const data = await response.json();

				if (data.history) {
					const groupedMap = new Map<string, { month: number; year: number; amount: number; status: string; months: number[] }>();

					data.history.forEach((item: any) => {
						const key = `${item.month}-${item.year}`;
						const amount = Number(item.amount) || 0;
						const isPaid = item.status === "paid" || item.status === "PAID";

						if (groupedMap.has(key)) {
							const existing = groupedMap.get(key)!;
							existing.amount += amount;
							if (isPaid) {
								existing.status = "PAID";
							}
						} else {
							groupedMap.set(key, {
								month: item.month,
								year: item.year,
								amount: amount,
								status: isPaid ? "PAID" : "PENDING",
								months: [item.month]
							});
						}
					});

					const groupedHistory = Array.from(groupedMap.values())
						.sort((a, b) => {
							if (a.year !== b.year) return b.year - a.year;
							return b.month - a.month;
						});

					setContributionHistory(groupedHistory);

					const totalPaid = groupedHistory.reduce((sum: number, item: any) => {
						const isPaid = item.status === "paid" || item.status === "PAID";
						return isPaid ? sum + item.amount : sum;
					}, 0);

					const currentDate = new Date();
					const currentMonth = currentDate.getMonth() + 1;
					const currentYear = currentDate.getFullYear();

					const currentMonthData = groupedHistory.find(
						(item: any) => item.month === currentMonth && item.year === currentYear
					);

					const isOverdue = !currentMonthData || currentMonthData.status !== "PAID";

					setContributionStats({
						currentMonth: currentMonthData || {
							month: currentMonth,
							year: currentYear,
							amount: 0,
							status: "PENDING",
							months: [currentMonth]
						},
						summary: {
							totalPaid: totalPaid,
							totalContributions: groupedHistory.length,
							overdueMonths: isOverdue ? 1 : 0
						}
					});
				}
			} else {
				console.error("Błąd:", response.status);
			}
		} catch (error) {
			console.error("Błąd:", error);
		} finally {
			setLoadingContributions(false);
		}
	};

	useEffect(() => {
		fetchProfile();
		if (userId) {
			fetchContributions(userId);
			fetchCompletedTasks(userId);
		} else {
			fetchContributions();
			fetchCompletedTasks();
		}
	}, [userId]);

	const handleEditToggle = async () => {
		if (isEditing) {
			try {
				const token = localStorage.getItem("accessToken");
				const response = await fetch("/api/profile", {
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						firstName: editData.firstName || user.firstName,
						lastName: editData.lastName || user.lastName,
						province: editData.province || user.province,
						description: editData.description || user.description,
						skills: editData.skills || user.skills,
						developmentAreas:
							editData.developmentAreas || user.developmentAreas,
						availability: editData.availability || user.availability,
						phone: editData.phone || user.phone || null,
					}),
				});

				if (!response.ok) {
					throw new Error("Nie udało się zapisać zmian");
				}

				setUser({
					...user,
					...editData,
				});
				setEditData({});
				toast.success("Profil zaktualizowany!");
			} catch (error) {
				logger.error("Błąd zapisu:", error);
				toast.error("Nie udało się zapisać zmian");
				return;
			}
		} else {
			setEditData({
				firstName: user.firstName,
				lastName: user.lastName,
				province: user.province,
				description: user.description,
				skills: user.skills,
				developmentAreas: user.developmentAreas,
				availability: user.availability,
				phone: user.phone || "",
			});
		}
		setIsEditing(!isEditing);
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
		setEditData({});
	};

	const handleInputChange = <K extends keyof Member>(
		field: K,
		value: Member[K],
	) => {
		setEditData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const toggleDevelopmentArea = (area: DevelopmentArea) => {
		const current = editData.developmentAreas || user.developmentAreas;
		if (current.includes(area)) {
			handleInputChange(
				"developmentAreas",
				current.filter((a) => a !== area),
			);
		} else {
			handleInputChange("developmentAreas", [...current, area]);
		}
	};

	const handleOpenSkillModal = () => {
		setNewSkillName("");
		setIsSkillModalOpen(true);
	};

	const handleCloseSkillModal = () => {
		setIsSkillModalOpen(false);
		setNewSkillName("");
	};

	const handleAddSkill = async () => {
		if (!newSkillName.trim()) {
			toast.error("Nazwa umiejętności jest wymagana");
			return;
		}

		try {
			setIsAddingSkill(true);
			const token = localStorage.getItem("accessToken");
			const response = await fetch("/api/profile/skills", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ skill: newSkillName.trim() }),
			});

			if (!response.ok) {
				throw new Error("Nie udało się dodać umiejętności");
			}

			const data = await response.json();
			if (isEditing) {
				handleInputChange("skills", data.skills);
			} else {
				setUser({ ...user, skills: data.skills });
			}
			toast.success("Umiejętność dodana!");
			handleCloseSkillModal();
		} catch (error) {
			logger.error("Błąd dodawania umiejętności:", error);
			toast.error("Nie udało się dodać umiejętności");
		} finally {
			setIsAddingSkill(false);
		}
	};

	const removeSkill = async (skill: string) => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch(
				`/api/profile/skills/${encodeURIComponent(skill)}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Nie udało się usunąć umiejętności");
			}

			const data = await response.json();
			if (isEditing) {
				handleInputChange("skills", data.skills);
			} else {
				setUser({ ...user, skills: data.skills });
			}
			toast.success("Umiejętność usunięta!");
		} catch (error) {
			logger.error("Błąd:", error);
			toast.error("Nie udało się usunąć umiejętności");
		}
	};

	const formatDate = (date: string) => {
		if (!date) return "Brak danych";
		return new Date(date).toLocaleDateString("pl-PL", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const canViewPrivate = true;

	const displayUser = isEditing ? { ...user, ...editData } : user;
	if (loading) {
		return (
			<div className={styles.loadingContainer}>
				<div className={styles.loading__spinner}></div>
			</div>
		);
	}

	const getMonthName = (monthNumber: number): string => {
		const months = [
			"Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
			"Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
		];
		return months[monthNumber - 1] || "Nieznany";
	};

	if (!user || !user.id) {
		return (
			<div className={styles.profile}>
				<div className={styles.error}>
					<AlertCircle size={48} />
					<h2>Nie znaleziono profilu</h2>
					<p>Użytkownik o podanym ID nie istnieje.</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.profile}>
			<div className={styles.header}>
				<div className={styles.header__left}>
					<h1 className={styles.header__title}>{title ?? "Mój profil"}</h1>
					<p className={styles.header__subtitle}>
						Twoje dane, funkcje, zespoły oraz informacje związane z
						działalnością w Stowarzyszeniu Siła Młodych.
					</p>
				</div>
				<div className={styles.header__actions}>
					<button className={styles.header__editBtn} onClick={handleEditToggle}>
						{isEditing ? <Save size={18} /> : <Edit size={18} />}
						{isEditing ? "Zapisz zmiany" : "Edytuj profil"}
					</button>
					{isEditing && (
						<button
							className={styles.header__cancelBtn}
							onClick={handleCancelEdit}
						>
							<X size={18} />
							Anuluj
						</button>
					)}
				</div>
			</div>

			<div className={styles.tabs}>
				<button
					className={`${styles.tab} ${selectedTab === "profile" ? styles.tabActive : ""}`}
					onClick={() => setSelectedTab("profile")}
				>
					<User size={16} />
					Profil
				</button>
				<button
					className={`${styles.tab} ${selectedTab === "activity" ? styles.tabActive : ""}`}
					onClick={() => setSelectedTab("activity")}
				>
					<TrendingUp size={16} />
					Aktywność
				</button>
				<button
					className={`${styles.tab} ${selectedTab === "contributions" ? styles.tabActive : ""}`}
					onClick={() => setSelectedTab("contributions")}
				>
					<CreditCard size={16} />
					Składki
				</button>
				<button
					className={`${styles.tab} ${selectedTab === "private" ? styles.tabActive : ""}`}
					onClick={() => setSelectedTab("private")}
				>
					<Shield size={16} />
					Prywatne
				</button>
			</div>

			<div className={styles.content}>
				<div className={styles.profileCard}>
					<div className={styles.profileCard__header}>
						<div className={styles.profileCard__avatarSection}>
							<div className={styles.profileCard__avatar}>
								{displayUser.avatar ||
									(displayUser.firstName?.[0] || "") +
									(displayUser.lastName?.[0] || "")}
							</div>
							<div className={styles.profileCard__userInfo}>
								<h2 className={styles.profileCard__name}>
									{displayUser.firstName} {displayUser.lastName}
								</h2>
								<p className={styles.profileCard__function}>
									<Briefcase size={16} />
									{displayUser.function}
								</p>
								<div className={styles.profileCard__meta}>
									<span>
										<Users size={14} />
										{displayUser.team}
									</span>
									<span>
										<MapPin size={14} />
										{displayUser.province}
									</span>
									<span
										className={`${styles.profileCard__status} ${STATUS_COLORS[displayUser.status]}`}
									>
										{STATUS_ICONS[displayUser.status]}
										{STATUS_LABELS[displayUser.status]}
									</span>
								</div>
							</div>
						</div>
						<div className={styles.profileCard__contact}>
							<div className={styles.profileCard__contactItem}>
								<Mail size={14} />
								<span>{displayUser.email}</span>
							</div>
							<div className={styles.profileCard__contactItem}>
								<Phone size={14} />
								<span>{displayUser.phone || "Brak numeru"}</span>
							</div>
							<div className={styles.profileCard__contactItem}>
								<Calendar size={14} />
								<span>Dołączył: {formatDate(displayUser.joinDate)}</span>
							</div>
						</div>
					</div>

					<div className={styles.profileCard__description}>
						{isEditing ? (
							<textarea
								className={styles.section__input}
								value={editData.description || user.description || ""}
								onChange={(e) =>
									handleInputChange("description", e.target.value)
								}
								rows={3}
								placeholder="Dodaj opis o sobie..."
							/>
						) : (
							<p>{displayUser.description || "Brak opisu"}</p>
						)}
					</div>
				</div>

				<div className={styles.sections}>
					{/* ZAKŁADKA: PROFIL */}
					{selectedTab === "profile" && (
						<>
							<div className={styles.section}>
								<h3 className={styles.section__title}>
									<Briefcase size={20} />
									Dane osobowe
								</h3>
								<div className={styles.section__grid}>
									<div className={styles.section__item}>
										<span className={styles.section__label}>Imię</span>
										{isEditing ? (
											<input
												type="text"
												className={styles.section__input}
												value={editData.firstName || user.firstName}
												onChange={(e) =>
													handleInputChange("firstName", e.target.value)
												}
											/>
										) : (
											<span className={styles.section__value}>
												{displayUser.firstName}
											</span>
										)}
									</div>

									<div className={styles.section__item}>
										<span className={styles.section__label}>Nazwisko</span>
										{isEditing ? (
											<input
												type="text"
												className={styles.section__input}
												value={editData.lastName || user.lastName}
												onChange={(e) =>
													handleInputChange("lastName", e.target.value)
												}
											/>
										) : (
											<span className={styles.section__value}>
												{displayUser.lastName}
											</span>
										)}
									</div>

									<div className={styles.section__item}>
										<span className={styles.section__label}>Funkcja</span>
										<span className={styles.section__value}>
											{displayUser.function}
										</span>
									</div>

									<div className={styles.section__item}>
										<span className={styles.section__label}>Zespół</span>
										<span className={styles.section__value}>
											{displayUser.team}
										</span>
									</div>

									<div className={styles.section__item}>
										<span className={styles.section__label}>Województwo</span>
										{isEditing ? (
											<input
												type="text"
												className={styles.section__input}
												value={editData.province || user.province}
												onChange={(e) =>
													handleInputChange("province", e.target.value)
												}
											/>
										) : (
											<span className={styles.section__value}>
												{displayUser.province}
											</span>
										)}
									</div>

									<div className={styles.section__item}>
										<span className={styles.section__label}>Telefon</span>
										{isEditing ? (
											<input
												type="tel"
												className={styles.section__input}
												value={editData.phone || user.phone || ""}
												onChange={(e) =>
													handleInputChange("phone", e.target.value)
												}
												placeholder="np. 123 456 789"
											/>
										) : (
											<span className={styles.section__value}>
												{displayUser.phone || "Brak numeru"}
											</span>
										)}
									</div>

									<div className={styles.section__item}>
										<span className={styles.section__label}>Data dołączenia</span>
										<span className={styles.section__value}>
											{formatDate(displayUser.joinDate)}
										</span>
									</div>
								</div>
							</div>

							<div className={styles.section}>
								<h3 className={styles.section__title}>
									<BookOpen size={20} />
									Rozwój i umiejętności
								</h3>

								<div className={styles.section__field}>
									<label className={styles.section__label}>Obszary rozwoju</label>
									<div className={styles.section__areas}>
										{Object.entries(DEVELOPMENT_AREA_LABELS).map(
											([key, label]) => {
												const area = key as DevelopmentArea;
												const isSelected = (
													editData.developmentAreas ||
													user.developmentAreas ||
													[]
												).includes(area);
												return (
													<button
														key={key}
														className={`${styles.section__area} ${isSelected ? styles.section__areaSelected : ""}`}
														onClick={() =>
															isEditing ? toggleDevelopmentArea(area) : null
														}
														disabled={!isEditing}
													>
														{DEVELOPMENT_AREA_ICONS[area]}
														{label}
														{isSelected && isEditing && (
															<CheckCircle size={12} />
														)}
													</button>
												);
											},
										)}
									</div>
								</div>

								<div className={styles.section__field}>
									<label className={styles.section__label}>Umiejętności</label>
									<div className={styles.section__skills}>
										{(editData.skills || user.skills || []).map((skill) => (
											<span key={skill} className={styles.section__skill}>
												{skill}
												{isEditing && (
													<button
														className={styles.section__removeSkill}
														onClick={() => removeSkill(skill)}
													>
														<X size={12} />
													</button>
												)}
											</span>
										))}
										{isEditing && (
											<button
												className={styles.section__addSkill}
												onClick={handleOpenSkillModal}
											>
												<Plus size={14} />
												Dodaj umiejętność
											</button>
										)}
									</div>
								</div>
								{/* MODAL DODAWANIA UMIEJĘTNOŚCI */}
								{isSkillModalOpen && (
									<div className={styles.modalOverlay} onClick={handleCloseSkillModal}>
										<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
											<div className={styles.modalHeader}>
												<h3 className={styles.modalTitle}>Dodaj umiejętność</h3>
												<button className={styles.modalClose} onClick={handleCloseSkillModal}>
													<X size={20} />
												</button>
											</div>
											<div className={styles.modalBody}>
												<p className={styles.modalDescription}>
													Wpisz nazwę umiejętności, którą chcesz dodać do swojego profilu.
												</p>
												<input
													type="text"
													className={styles.modalInput}
													value={newSkillName}
													onChange={(e) => setNewSkillName(e.target.value)}
													placeholder="np. Python, Projektowanie graficzne, Zarządzanie projektami"
													autoFocus
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															handleAddSkill();
														}
														if (e.key === "Escape") {
															handleCloseSkillModal();
														}
													}}
												/>
											</div>
											<div className={styles.modalFooter}>
												<button
													className={styles.modalBtnCancel}
													onClick={handleCloseSkillModal}
												>
													Anuluj
												</button>
												<button
													className={styles.modalBtnSave}
													onClick={handleAddSkill}
													disabled={isAddingSkill || !newSkillName.trim()}
												>
													{isAddingSkill ? "Dodawanie..." : "Dodaj umiejętność"}
												</button>
											</div>
										</div>
									</div>
								)}
								<div className={styles.section__field}>
									<label className={styles.section__label}>Dostępność</label>
									{isEditing ? (
										<input
											type="text"
											className={styles.section__input}
											value={editData.availability || user.availability}
											onChange={(e) =>
												handleInputChange("availability", e.target.value)
											}
										/>
									) : (
										<p className={styles.section__value}>
											{displayUser.availability}
										</p>
									)}
								</div>
							</div>

							<div className={styles.section}>
								<h3 className={styles.section__title}>
									<Umbrella size={20} />
									Dostępność
								</h3>
								{displayUser.leave?.isOnLeave ? (
									<div className={styles.section__leaveWarning}>
										<AlertCircle size={20} />
										<span>
											Nieobecny do: {formatDate(displayUser.leave.endDate!)}
										</span>
									</div>
								) : (
									<div className={styles.section__leaveActive}>
										<CheckCircle size={20} />
										<span>Aktywny</span>
									</div>
								)}
								<div className={styles.section__leaveHistory}>
									<h4 className={styles.section__subtitle}>Historia urlopów</h4>
									<div className={styles.section__leaveList}>
										{displayUser.leave?.history.map((leave) => (
											<div key={leave.id} className={styles.section__leaveItem}>
												<span>
													{formatDate(leave.startDate)} - {formatDate(leave.endDate)}
												</span>
												<span
													className={`${styles.section__leaveStatus} ${leave.status === "approved"
														? styles.leaveApproved
														: leave.status === "pending"
															? styles.leavePending
															: styles.leaveRejected
														}`}
												>
													{leave.status === "approved"
														? "Zatwierdzony"
														: leave.status === "pending"
															? "Oczekuje"
															: "Odrzucony"}
												</span>
											</div>
										))}
									</div>
									<button
										className={styles.section__leaveBtn}
										onClick={() => safeNavigate("/leave", navigate)}
									>
										<Plus size={16} />
										Zgłoś urlop
									</button>
								</div>
							</div>
						</>
					)}

					{/* ZAKŁADKA: AKTYWNOŚĆ */}
					{selectedTab === "activity" && (
						<>
							<div className={styles.section}>
								<h3 className={styles.section__title}>
									<TrendingUp size={20} />
									Ukończone zadania
									{loadingTasks && (
										<span className={styles.loadingSpinner} style={{ width: 20, height: 20, marginLeft: 8 }} />
									)}
									{!loadingTasks && completedTasks.length > 0 && (
										<span style={{ fontSize: "14px", fontWeight: "normal", color: "#6b7280", marginLeft: "8px" }}>
											({completedTasks.length})
										</span>
									)}
								</h3>

								{!loadingTasks && completedTasks.length > 0 && (
									<div className={styles.statsRow}>
										<div className={styles.statBox}>
											<span className={styles.statValue}>{completedTasks.length}</span>
											<span className={styles.statLabel}>Ukończone</span>
										</div>
										<div className={styles.statBox}>
											<span className={styles.statValue}>
												{completedTasks.filter((t: any) => t.rating && t.rating > 0).length}
											</span>
											<span className={styles.statLabel}>Ocenione</span>
										</div>
										<div className={styles.statBox}>
											<span className={styles.statValue}>
												{completedTasks.length > 0
													? (completedTasks.reduce((sum: number, t: any) => sum + (t.rating || 0), 0) / completedTasks.length).toFixed(1)
													: "—"}
											</span>
											<span className={styles.statLabel}>Średnia ocena</span>
										</div>
										<div className={styles.statBox}>
											<span className={styles.statValue} style={{ color: "#10b981" }}>
												{completedTasks.filter((t: any) => t.isEarly).length}
											</span>
											<span className={styles.statLabel}>Przed czasem</span>
										</div>
										<div className={styles.statBox}>
											<span className={styles.statValue} style={{ color: "#f59e0b" }}>
												{completedTasks.filter((t: any) => t.isOnTime).length}
											</span>
											<span className={styles.statLabel}>Na czas</span>
										</div>
										<div className={styles.statBox}>
											<span className={styles.statValue} style={{ color: "#ef4444" }}>
												{completedTasks.filter((t: any) => t.isLate).length}
											</span>
											<span className={styles.statLabel}>Po terminie</span>
										</div>
									</div>
								)}

								{loadingTasks ? (
									<div className={styles.emptyState}>Ładowanie zadań...</div>
								) : completedTasks.length === 0 ? (
									<div className={styles.emptyState}>Brak ukończonych zadań</div>
								) : (
									<div className={styles.tasksList}>
										{completedTasks.slice(0, 20).map((task: any, index: number) => {
											const getTimelineLabel = () => {
												if (task.isEarly) return { label: "Przed czasem", color: "#10b981" };
												if (task.isOnTime) return { label: "Na czas", color: "#f59e0b" };
												if (task.isLate) return { label: "Po terminie", color: "#ef4444" };
												return { label: "Brak terminu", color: "#6b7280" };
											};
											const timeline = getTimelineLabel();

											const getPriorityLabel = (priority: string) => {
												const map: Record<string, { label: string; color: string }> = {
													urgent: { label: "Krytyczny", color: "#ef4444" },
													high: { label: "Wysoki", color: "#f59e0b" },
													medium: { label: "Średni", color: "#3b82f6" },
													low: { label: "Niski", color: "#6b7280" },
												};
												return map[priority] || map.medium;
											};
											const priority = getPriorityLabel(task.priority);

											return (
												<div
													key={task.id || index}
													className={`${styles.taskCard} ${task.isLate ? styles.taskCardLate : styles.taskCardDone}`}
												>
													<div className={styles.taskCardHeader}>
														<div className={styles.taskCardInfo}>
															<span className={styles.taskCardTitle}>
																{task.title || "Bez tytułu"}
															</span>
															<div className={styles.taskCardTags}>
																{task.projectName && (
																	<span className={styles.taskCardTag}>
																		{task.projectName}
																	</span>
																)}
																{task.pillar && (
																	<span className={styles.taskCardTag}>
																		{task.pillar}
																	</span>
																)}
																<span className={styles.taskCardTag} style={{ color: priority.color }}>
																	{priority.label}
																</span>
															</div>
														</div>
														<div className={styles.taskCardRating}>
															{task.rating && task.rating > 0 && (
																<span className={styles.ratingStars}>
																	{'⭐'.repeat(Math.min(task.rating, 5))}
																</span>
															)}
														</div>
													</div>

													<div className={styles.taskCardDetails}>
														<span>Utworzono: {new Date(task.createdAt).toLocaleDateString("pl-PL")}</span>
														{task.dueDate && (
															<span>Termin: {new Date(task.dueDate).toLocaleDateString("pl-PL")}</span>
														)}
														<span>Ukończono: {new Date(task.completedAt).toLocaleDateString("pl-PL")}</span>
														<span>Czas: {task.daysToComplete} dni</span>
														<span style={{ color: timeline.color, fontWeight: 500 }}>
															{timeline.label}
															{task.daysDiff !== 0 && task.dueDate && (
																task.isEarly ? ` (${Math.abs(task.daysDiff)} dni wcześniej)` :
																	task.isLate ? ` (${Math.abs(task.daysDiff)} dni później)` :
																		""
															)}
														</span>
													</div>
												</div>
											);
										})}
										{completedTasks.length > 20 && (
											<div className={styles.tasksMore}>
												+ {completedTasks.length - 20} więcej zadań
											</div>
										)}
									</div>
								)}
							</div>
						</>
					)}

					{/* ZAKŁADKA: SKŁADKI */}
					{selectedTab === "contributions" && (
						<>
							<div className={styles.section}>
								<h3 className={styles.section__title}>
									<CreditCard size={20} />
									Podsumowanie składek
									{loadingContributions && (
										<span className={styles.loadingSpinner} style={{ width: 20, height: 20, marginLeft: 8 }} />
									)}
								</h3>

								<div className={styles.contributionsGrid}>
									<div className={styles.contributionItem}>
										<span className={styles.contributionLabel}>Bieżący miesiąc</span>
										<span className={styles.contributionValue}>
											{loadingContributions ? (
												"Ładowanie..."
											) : contributionStats?.currentMonth?.status === "paid" ? (
												<span className={styles.contributionPaid}>
													<CheckCircle size={14} />
													Opłacona ({Number(contributionStats.currentMonth.amount || 0).toFixed(2)} zł)
												</span>
											) : contributionStats?.currentMonth?.status === "pending" ? (
												<span className={styles.contributionPending}>
													<AlertCircle size={14} />
													Nieopłacona ({Number(contributionStats.currentMonth.amount || 0).toFixed(2)} zł)
												</span>
											) : (
												"Brak danych"
											)}
										</span>
									</div>

									<div className={styles.contributionItem}>
										<span className={styles.contributionLabel}>Zaległości</span>
										<span className={styles.contributionValue}>
											{loadingContributions ? (
												"Ładowanie..."
											) : contributionStats?.summary?.overdueMonths > 0 ? (
												<span className={styles.contributionOverdue}>
													<AlertCircle size={14} />
													{contributionStats.summary.overdueMonths} mies.
												</span>
											) : (
												"Brak zaległości"
											)}
										</span>
									</div>

									<div className={styles.contributionItem}>
										<span className={styles.contributionLabel}>Łącznie opłacone</span>
										<span className={styles.contributionValue}>
											{loadingContributions ? (
												"Ładowanie..."
											) : (
												`${Number(contributionStats?.summary?.totalPaid || 0).toFixed(2)} zł`
											)}
										</span>
									</div>
								</div>

								<div className={styles.historySection}>
									<h4 className={styles.historyTitle}>
										Historia składek
										{contributionHistory.length > 0 && (
											<span className={styles.historyRange}>
												({Math.min(...contributionHistory.map((i: any) => i.year))} - {Math.max(...contributionHistory.map((i: any) => i.year))})
											</span>
										)}
									</h4>

									{loadingHistory ? (
										<div className={styles.historyEmpty}>Ładowanie historii...</div>
									) : contributionHistory.length === 0 ? (
										<div className={styles.historyEmpty}>Brak historii składek</div>
									) : (
										<div className={styles.historyList}>
											{contributionHistory.map((item: any, index: number) => {
												const isPaid = item.status === "PAID" || item.status?.toLowerCase() === "paid";
												return (
													<div
														key={index}
														className={`${styles.historyItem} ${isPaid ? styles.historyItemPaid : styles.historyItemPending}`}
													>
														<span className={styles.historyMonth}>
															{getMonthName(item.month)} {item.year}
														</span>
														<span className={styles.historyStatus}>
															{isPaid ? "Opłacona" : "Nieopłacona"}
														</span>
														<span className={styles.historyAmount}>
															{Number(item.amount || 0).toFixed(2)} zł
														</span>
													</div>
												);
											})}
										</div>
									)}
								</div>
							</div>
						</>
					)}

					{/* ZAKŁADKA: PRYWATNE */}
					{selectedTab === "private" && (
						<>
							{canViewPrivate && displayUser.contacts && (
								<div className={styles.section}>
									<h3 className={styles.section__title}>
										<Shield size={20} />
										Kontakty i zasoby
									</h3>
									<div className={styles.privateNote}>
										<AlertCircle size={16} />
										<span>
											Te dane są prywatne i widoczne tylko dla Ciebie oraz osób
											posiadających odpowiednie uprawnienia.
										</span>
									</div>
									<div className={styles.contactsGrid}>
										{displayUser.contacts.salaContacts.length > 0 && (
											<div className={styles.contactGroup}>
												<span className={styles.contactLabel}>Kontakty do sal</span>
												<ul className={styles.contactList}>
													{displayUser.contacts.salaContacts.map((contact) => (
														<li key={contact}>{contact}</li>
													))}
												</ul>
											</div>
										)}
										{displayUser.contacts.mpContacts.length > 0 && (
											<div className={styles.contactGroup}>
												<span className={styles.contactLabel}>Kontakty do posłów</span>
												<ul className={styles.contactList}>
													{displayUser.contacts.mpContacts.map((contact) => (
														<li key={contact}>{contact}</li>
													))}
												</ul>
											</div>
										)}
										{displayUser.contacts.institutionContacts.length > 0 && (
											<div className={styles.contactGroup}>
												<span className={styles.contactLabel}>Kontakty do instytucji</span>
												<ul className={styles.contactList}>
													{displayUser.contacts.institutionContacts.map((contact) => (
														<li key={contact}>{contact}</li>
													))}
												</ul>
											</div>
										)}
										{displayUser.contacts.otherContacts.length > 0 && (
											<div className={styles.contactGroup}>
												<span className={styles.contactLabel}>Inne kontakty</span>
												<ul className={styles.contactList}>
													{displayUser.contacts.otherContacts.map((contact) => (
														<li key={contact}>{contact}</li>
													))}
												</ul>
											</div>
										)}
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}