import { useState, useEffect, useMemo } from "react";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import toast from "react-hot-toast";
import {
	Users,
	Search,
	X,
	Filter,
	Grid,
	List,
	User,
	MapPin,
	Briefcase,
	// Tag,
	Star,
	Clock,
	CheckCircle,
	// GraduationCap,
	// Mail,
	// Phone,
	// Calendar,
	// AlertCircle,
	Edit,
	Eye,
	// ChevronDown,
	// ChevronRight,
	// UserPlus,
	// UserCheck,
	// UserX,
	Umbrella,
	// Building2,
	// Settings,
	Plus,
	ArrowUpDown,
	Trash2,
} from "lucide-react";
import styles from "./Members.module.css";

// ---------------------------------------------------------------------------
// TYPY
// ---------------------------------------------------------------------------

type MemberStatus = "active" | "trial" | "mentor" | ""; // ✅ TYLKO 3
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
	province: string;
	status: MemberStatus;
	interests: string[];
	skills: string[];
	smAreas: string[];
	email: string;
	phone?: string;
	joinDate: string;
	vacation?: MemberVacation;
	// Dodatkowe informacje (widoczne tylko dla użytkownika i koordynatorów)
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

type User = {
	id: string;
	name: string;
	role: "admin" | "coordinator" | "member";
	teamId?: string;
};

// ---------------------------------------------------------------------------
// DANE PRZYKŁADOWE
// ---------------------------------------------------------------------------

const MOCK_USER: User = {
	id: "1",
	name: "Jan Kowalski",
	role: "admin",
	teamId: "project",
};

// ---------------------------------------------------------------------------
// MAPOWANIE NA TEKSTY
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<MemberStatus, string> = {
	active: "Pełnoprawny członek", // ✅ zamiast "full"
	trial: "Okres próbny",
	mentor: "Mentor",
	"": "Nieznany",
};

const STATUS_COLORS: Record<MemberStatus, string> = {
	trial: styles.statusTrial,
	active: styles.statusFull, // ✅ "active" zamiast "full"
	mentor: styles.statusMentor,
	"": styles.statusTrial,
};

const STATUS_ICONS: Record<MemberStatus, React.ReactNode> = {
	trial: <Clock size={14} />,
	active: <CheckCircle size={14} />, // ✅ "active" zamiast "full"
	mentor: <Star size={14} />,
	"": <Clock size={14} />,
};

// ---------------------------------------------------------------------------
// KOMPONENT KARTY CZŁONKA
// ---------------------------------------------------------------------------

interface MemberCardProps {
	member: Member;
	currentUser: User;
	onView: (member: Member) => void;
	onEdit: (member: Member) => void;
	onDelete: (member: Member) => void;
	viewMode: "grid" | "list";
}

function MemberCard({
	member,
	currentUser,
	onView,
	onEdit,
	onDelete,
	viewMode,
}: MemberCardProps) {
	const getInitials = () => {
		return (
			((member.firstName || "")[0] || "") + ((member.lastName || "")[0] || "")
		);
	};

	const isOnVacation =
		member.vacation &&
		new Date(member.vacation.startDate) <= new Date() &&
		new Date(member.vacation.endDate) >= new Date();
	// const canViewSensitiveData = currentUser.role === "admin" ||
	//     (currentUser.role === "coordinator" && currentUser.teamId === member.teamId) ||
	//     currentUser.id === member.id;

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString("pl-PL", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	if (viewMode === "list") {
		return (
			<div className={`${styles.memberCard} ${styles.memberCardList}`}>
				<div className={styles.memberCard__avatar}>
					{member.avatar || getInitials() || "?"}
				</div>
				<div className={styles.memberCard__info}>
					<div className={styles.memberCard__nameRow}>
						<h3 className={styles.memberCard__name}>
							{member.firstName || ""} {member.lastName || ""}
						</h3>
						<span
							className={`${styles.memberCard__status} ${STATUS_COLORS[member.status || "trial"]}`}
						>
							{STATUS_ICONS[member.status || "trial"]}
							{STATUS_LABELS[member.status || "trial"]}
						</span>
					</div>
					<div className={styles.memberCard__details}>
						<span className={styles.memberCard__detail}>
							<Briefcase size={14} />
							{member.function}
						</span>
						<span className={styles.memberCard__detail}>
							<Users size={14} />
							{member.team}
						</span>
						{member.province &&
							member.province !== "" &&
							member.province !== "Brak" &&
							member.province !== "Nieznane" && (
								<span className={styles.memberCard__detail}>
									<MapPin size={14} />
									{member.province}
								</span>
							)}
					</div>
				</div>
				<div className={styles.memberCard__actions}>
					{isOnVacation && (
						<span className={styles.memberCard__vacationBadge}>
							<Umbrella size={14} />
							Na urlopie do {formatDate(member.vacation!.endDate)}
						</span>
					)}
					<button
						className={styles.memberCard__actionBtn}
						onClick={() => onView(member)}
						title="Podgląd profilu"
					>
						<Eye size={16} />
					</button>
					{(currentUser.id === member.id || currentUser.role === "admin") && (
						<button
							className={styles.memberCard__actionBtn}
							onClick={() => onEdit(member)}
							title="Edytuj profil"
						>
							<Edit size={16} />
						</button>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className={styles.memberCard}>
			<div className={styles.memberCard__avatar}>
				{member.avatar || getInitials() || "?"}
			</div>
			<h3 className={styles.memberCard__name}>
				{member.firstName || ""} {member.lastName || ""}
			</h3>
			<p className={styles.memberCard__function}>{member.function}</p>
			<p className={styles.memberCard__team}>
				<Users size={14} />
				{member.team}
			</p>
			{member.province &&
				member.province !== "" &&
				member.province !== "Brak" &&
				member.province !== "Nieznane" && (
					<p className={styles.memberCard__province}>
						<MapPin size={14} />
						{member.province}
					</p>
				)}
			<div className={styles.memberCard__status}>
				<span
					className={`${styles.memberCard__statusBadge} ${STATUS_COLORS[member.status]}`}
				>
					{STATUS_ICONS[member.status || "trial"]}
					{STATUS_LABELS[member.status]}
				</span>
			</div>
			{isOnVacation && (
				<div className={styles.memberCard__vacation}>
					<Umbrella size={14} />
					<span>Urlop do {formatDate(member.vacation!.endDate)}</span>
				</div>
			)}
			<div className={styles.memberCard__skills}>
				{(member.skills || []).slice(0, 3).map((skill) => (
					<span key={skill} className={styles.memberCard__skillTag}>
						{skill}
					</span>
				))}
				{(member.skills || []).length > 3 && (
					<span className={styles.memberCard__skillTag}>
						+{(member.skills || []).length - 3}
					</span>
				)}
			</div>
			<div className={styles.memberCard__actions}>
				<button
					className={styles.memberCard__actionBtn}
					onClick={() => onView(member)}
					title="Podgląd profilu"
				>
					<Eye size={16} color="#e5ac00" />
				</button>
				{(currentUser.id === member.id || currentUser.role === "admin") && (
					<button
						className={styles.memberCard__actionBtn}
						onClick={() => onEdit(member)}
						title="Edytuj profil"
					>
						<Edit size={16} color="#60A5FA" />
					</button>
				)}
				{currentUser.role === "admin" && currentUser.id !== member.id && (
					<button
						className={`${styles.memberCard__actionBtn} ${styles.memberCard__deleteBtn}`}
						onClick={() => onDelete(member)}
						title="Usuń członka"
					>
						<Trash2 size={16} color="#f86a6a" />
					</button>
				)}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// MODAL PROFILU
// ---------------------------------------------------------------------------

interface ProfileModalProps {
	isOpen: boolean;
	member: Member | null;
	currentUser: User;
	isEdit?: boolean;
	onClose: () => void;
	onSave?: (member: Member) => void;
	teamsList?: { id: number; name: string }[];
	showCustomTeam?: boolean; // ✅ DODAJ
	setShowCustomTeam?: (value: boolean) => void; // ✅ DODAJ
	customTeamName?: string; // ✅ DODAJ
	setCustomTeamName?: (value: string) => void; // ✅ DODAJ
	customTeamRole?: string;
	setCustomTeamRole?: (value: string) => void;
	customTeamDescription?: string;
	setCustomTeamDescription?: (value: string) => void;
	customTeamIcon?: string;
	setCustomTeamIcon?: (value: string) => void;
	customTeamParent?: string;
	setCustomTeamParent?: (value: string) => void;
	customTeamEmail?: string;
	setCustomTeamEmail?: (value: string) => void;
	parentTeamsList?: { id: number; name: string; parent_id: number | null }[];
}

function ProfileModal({
	isOpen,
	member,
	currentUser,
	isEdit = false,
	onClose,
	onSave,
	teamsList = [],
	showCustomTeam = false,
	setShowCustomTeam,
	customTeamName = "",
	setCustomTeamName,
	customTeamRole = "", // ✅ DODAJ
	setCustomTeamRole, // ✅ DODAJ
	customTeamDescription = "", // ✅ DODAJ
	setCustomTeamDescription, // ✅ DODAJ
	customTeamIcon = "Users", // ✅ DODAJ
	setCustomTeamIcon, // ✅ DODAJ
	customTeamParent = "", // ✅ DODAJ
	setCustomTeamParent, // ✅ DODAJ
	customTeamEmail = "", // ✅ DODAJ

	setCustomTeamEmail, // ✅ DODAJ
	parentTeamsList = [],
}: ProfileModalProps) {
	const [formData, setFormData] = useState<Partial<Member>>({
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
		joinDate: "",
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
	});
	// ✅ reszta kodu ProfileModal

	const [newInterest, setNewInterest] = useState("");
	const [newSkill, setNewSkill] = useState("");
	const [newArea, setNewArea] = useState("");
	const [newSalaContact, setNewSalaContact] = useState("");
	const [newMpContact, setNewMpContact] = useState("");
	const [newOtherContact, setNewOtherContact] = useState("");
	const [newTrainingArea, setNewTrainingArea] = useState("");

	// ⭐ useEffect do aktualizacji formData gdy member się zmienia
	useEffect(() => {
		if (member) {
			console.log("📝 Member status:", member.status);
			console.log("📝 Member status type:", typeof member.status);

			const newFormData = {
				id: member.id,
				firstName: member.firstName || "",
				lastName: member.lastName || "",
				function: member.function || "",
				team: member.team || "",
				teamId: member.teamId || "",
				province: member.province || "",
				status: member.status || "",
				interests: member.interests || [],
				skills: member.skills || [],
				smAreas: member.smAreas || [],
				email: member.email || "",
				phone: member.phone || "",
				joinDate: member.joinDate || "",
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

			console.log("📝 Nowy formData.status:", newFormData.status);
			setFormData(newFormData);

			// ⭐ Sprawdź czy formData się ustawiło po chwili
			setTimeout(() => {
				console.log("📝 formData.status po setTimeout:", formData.status);
			}, 100);
		} else {
			setFormData({
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
				joinDate: "",
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
			});
		}
	}, [member, isOpen]);
	useEffect(() => {
		// Generuj email tylko gdy jesteśmy w trybie edycji/dodawania
		if (isEdit) {
			const firstName = formData.firstName?.trim() || "";
			const lastName = formData.lastName?.trim() || "";

			// Jeśli oba pola są wypełnione, wygeneruj email
			if (firstName && lastName) {
				// Zamień polskie znaki na podstawowe
				const normalize = (str: string) => {
					return str
						.normalize("NFD")
						.replace(/[\u0300-\u036f]/g, "") // Usuń polskie znaki
						.replace(/ł/g, "l") // Ł → l
						.replace(/Ł/g, "L") // Ł → L
						.replace(/ /g, ".") // ✅ SPACJA → KROPKA
						.replace(/\.+/g, ".") // ✅ Zamień wiele kropek na jedną
						.replace(/^\.|\.$/g, ""); // ✅ Usuń kropki na początku i końcu
				};

				const generatedEmail = `${normalize(firstName.toLowerCase())}.${normalize(lastName.toLowerCase())}@silamlodych.pl`;

				// Aktualizuj email tylko jeśli jest pusty lub został wygenerowany automatycznie
				// (nie zmieniaj jeśli użytkownik ręcznie wpisał inny email)
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

	// Sprawdzenie czy mamy member (dla podglądu) lub jesteśmy w trybie edycji/dodawania
	if (!member && !isEdit) return null;

	// Dla dodawania nowego (member null, isEdit true) - używamy domyślnych wartości
	const currentMember = member || {
		id: "",
		firstName: "",
		lastName: "",
		function: "",
		team: "",
		teamId: "",
		province: "",
		status: "trial" as MemberStatus,
		interests: [],
		skills: [],
		smAreas: [],
		email: "",
		phone: "",
		joinDate: "",
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
	};

	const canEdit =
		isEdit &&
		(currentUser.id === currentMember.id || currentUser.role === "admin");

	const canViewSensitive =
		currentUser.role === "admin" ||
		(currentUser.role === "coordinator" &&
			currentUser.teamId === currentMember.teamId) ||
		currentUser.id === currentMember.id;

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

		// ⭐ WALIDACJA - sprawdź czy status jest wybrany
		if (isEdit && !formData.status) {
			alert("Wybierz status członka");
			return;
		}

		if (onSave && canEdit) {
			console.log("📝 formData w handleSubmit:", formData); // ⭐ DODAJ

			const saveData: Member = {
				id: currentMember.id,
				firstName: formData.firstName || currentMember.firstName,
				lastName: formData.lastName || currentMember.lastName,
				function: formData.function || currentMember.function,
				team: formData.team || currentMember.team,
				teamId: formData.teamId || currentMember.teamId,
				province: formData.province || currentMember.province,
				status: (formData.status as MemberStatus) || "active",
				interests: formData.interests || currentMember.interests,
				skills: formData.skills || currentMember.skills,
				smAreas: formData.smAreas || currentMember.smAreas,
				email: formData.email || currentMember.email,
				phone: formData.phone || currentMember.phone,
				joinDate: formData.joinDate || currentMember.joinDate,
				vacation: currentMember.vacation,
				contacts: canViewSensitive
					? formData.contacts || currentMember.contacts
					: undefined,
				trainingAreas: canViewSensitive
					? formData.trainingAreas || currentMember.trainingAreas
					: undefined,
				contributionInfo: canViewSensitive
					? formData.contributionInfo || currentMember.contributionInfo
					: undefined,
				formData: canViewSensitive
					? formData.formData || currentMember.formData
					: undefined,
			};
			console.log("📤 saveData:", saveData); // ⭐ DODAJ

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

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div
				className={`${styles.modal} ${isEdit ? styles.modalEdit : styles.modalView}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modal__header}>
					<h2 className={styles.modal__title}>
						{!currentMember?.id
							? "Dodaj nowego członka"
							: isEdit
								? "Edytuj profil"
								: `Profil: ${currentMember.firstName} ${currentMember.lastName}`}
					</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className={styles.modal__form}>
					{/* Podstawowe informacje - zawsze widoczne */}
					{/* Podstawowe informacje - zawsze widoczne */}
					<div className={styles.modal__section}>
						<h3 className={styles.modal__sectionTitle}>
							Podstawowe informacje
						</h3>

						{/* ⭐ WIERSZ 1: Imię i Nazwisko */}
						<div className={styles.modal__row}>
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>Imię *</label>
								<input
									type="text"
									className={styles.modal__input}
									value={formData.firstName || ""}
									onChange={(e) =>
										setFormData({ ...formData, firstName: e.target.value })
									}
									disabled={!canEdit}
									required={isEdit}
								/>
							</div>
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>Nazwisko *</label>
								<input
									type="text"
									className={styles.modal__input}
									value={formData.lastName || ""}
									onChange={(e) =>
										setFormData({ ...formData, lastName: e.target.value })
									}
									disabled={!canEdit}
									required={isEdit}
								/>
							</div>
						</div>

						{/* ⭐ WIERSZ 2: Email (tylko dla edycji/dodawania) */}
						{isEdit && (
							<div className={styles.modal__row}>
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>Email *</label>
									<input
										type="email"
										className={styles.modal__input}
										value={formData.email || ""}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
										disabled={!canEdit}
										required
									/>
									{isEdit && !member?.id && formData.email && (
										<small
											style={{
												color: "#6b7280",
												fontSize: "12px",
												display: "block",
												marginTop: "4px",
											}}
										>
											📧 Email wygenerowany automatycznie z imienia i nazwiska
										</small>
									)}
								</div>
								<div className={styles.modal__field}>
									{/* Puste pole dla wyrównania - lub telefon jeśli chcesz */}
									<label className={styles.modal__label}>Telefon</label>
									<input
										type="text"
										className={styles.modal__input}
										value={formData.phone || ""}
										onChange={(e) =>
											setFormData({ ...formData, phone: e.target.value })
										}
										disabled={!canEdit}
									/>
								</div>
							</div>
						)}

						{/* ⭐ WIERSZ 3: Funkcja i Zespół */}
						<div className={styles.modal__row}>
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>Funkcja</label>
								<input
									type="text"
									className={styles.modal__input}
									value={formData.function || currentMember.function}
									onChange={(e) =>
										setFormData({ ...formData, function: e.target.value })
									}
									disabled={!canEdit}
								/>
							</div>
							{/* Zespół - jako select */}
							{/* Zespół - jako select z opcją "Inny" */}
							{/* Zespół - jako select z opcją "Inny" */}
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>Zespół</label>
								<select
									className={styles.modal__select}
									value={formData.team || currentMember.team || ""}
									onChange={(e) => {
										const value = e.target.value;
										if (value === "other") {
											setShowCustomTeam?.(true);
											setFormData({ ...formData, team: "" });
										} else {
											setShowCustomTeam?.(false);
											setFormData({ ...formData, team: value });
										}
									}}
									disabled={!canEdit}
								>
									<option value="">Brak zespołu</option>
									{teamsList.map((team) => (
										<option key={team.id} value={team.name}>
											{team.name}
										</option>
									))}
									<option value="other">➕ Inny (dodaj nowy)</option>
								</select>

								{/* Pole do wpisania nowej nazwy zespołu */}
								{showCustomTeam && isEdit && (
									<div
										style={{
											marginTop: "12px",
											padding: "12px",
											border: "1px solid #e5e7eb",
											borderRadius: "8px",
											background: "#f9fafb",
										}}
									>
										<div
											style={{
												marginBottom: "8px",
												fontWeight: "500",
												color: "#374151",
											}}
										>
											➕ Dodawanie nowego zespołu
										</div>

										{/* Nazwa zespołu */}
										<div className={styles.modal__field}>
											<label className={styles.modal__label}>
												Nazwa zespołu *
											</label>
											<input
												type="text"
												className={styles.modal__input}
												value={customTeamName || ""}
												onChange={(e) => {
													setCustomTeamName?.(e.target.value);
													setFormData({ ...formData, team: e.target.value });
												}}
												placeholder="Wpisz nazwę nowego zespołu..."
												style={{
													borderColor: customTeamName ? "#22c55e" : "#ef4444",
												}}
											/>
										</div>

										{/* Rola */}
										<div className={styles.modal__field}>
											<label className={styles.modal__label}>Rola</label>
											<input
												type="text"
												className={styles.modal__input}
												value={customTeamRole || ""}
												onChange={(e) => setCustomTeamRole?.(e.target.value)}
												placeholder="np. Zespół, Filar, Dyrekcja..."
											/>
										</div>

										{/* Opis */}
										<div className={styles.modal__field}>
											<label className={styles.modal__label}>Opis</label>
											<textarea
												className={styles.modal__input}
												value={customTeamDescription || ""}
												onChange={(e) =>
													setCustomTeamDescription?.(e.target.value)
												}
												placeholder="Krótki opis zespołu..."
												rows={2}
												style={{ resize: "vertical" }}
											/>
										</div>

										{/* Ikona */}
										<div className={styles.modal__field}>
											<label className={styles.modal__label}>Ikona</label>
											<select
												className={styles.modal__select}
												value={customTeamIcon || "Users"}
												onChange={(e) => setCustomTeamIcon?.(e.target.value)}
											>
												<option value="Users">👥 Users</option>
												<option value="UserCog">⚙️ UserCog</option>
												<option value="Briefcase">💼 Briefcase</option>
												<option value="Building2">🏢 Building2</option>
												<option value="Megaphone">📢 Megaphone</option>
												<option value="GraduationCap">🎓 GraduationCap</option>
												<option value="Calendar">📅 Calendar</option>
												<option value="Settings">⚙️ Settings</option>
												<option value="Shield">🛡️ Shield</option>
												<option value="Star">⭐ Star</option>
											</select>
										</div>

										{/* Zespół nadrzędny */}
										{/* Zespół nadrzędny */}
										{/* Zespół nadrzędny */}
										<div className={styles.modal__field}>
											<label className={styles.modal__label}>
												Zespół nadrzędny
											</label>
											<select
												className={styles.modal__select}
												value={customTeamParent || ""}
												onChange={(e) => {
													const value = e.target.value;
													setCustomTeamParent?.(value);
												}}
											>
												<option value="">Brak (zespół główny)</option>
												{parentTeamsList.map((team) => (
													<option key={team.id} value={team.id.toString()}>
														{team.name}
													</option>
												))}
											</select>
										</div>

										{/* Email */}
										<div className={styles.modal__field}>
											<label className={styles.modal__label}>Email</label>
											<input
												type="email"
												className={styles.modal__input}
												value={customTeamEmail || ""}
												onChange={(e) => setCustomTeamEmail?.(e.target.value)}
												placeholder="email@domena.pl"
											/>
										</div>

										{!customTeamName && (
											<small
												style={{
													color: "#ef4444",
													fontSize: "12px",
													display: "block",
													marginTop: "4px",
												}}
											>
												⚠️ Nazwa zespołu jest wymagana
											</small>
										)}
									</div>
								)}
							</div>
						</div>

						{/* ⭐ WIERSZ 4: Województwo i Status */}
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Status *</label>
							<select
								className={styles.modal__select}
								value={formData.status || ""}
								onChange={(e) => {
									const value = e.target.value;
									setFormData({
										...formData,
										status: value as MemberStatus,
									});
									// ⬅️ Wyczyść komunikat błędu gdy coś wybrano
									e.target.setCustomValidity(
										value ? "" : "Wybierz status członka",
									);
								}}
								onInvalid={(e) => {
									e.target.setCustomValidity("Wybierz status członka");
								}}
								disabled={!canEdit}
								required={isEdit}
							>
								<option value="">Wybierz status</option>
								<option value="trial">Okres próbny</option>
								<option value="active">Pełnoprawny członek</option>
								<option value="mentor">Mentor</option>
							</select>
							{isEdit && !formData.status && (
								<small
									style={{
										color: "#a2a2a2",
										fontSize: "12px",
										display: "block",
										marginTop: "4px",
									}}
								>
									Wybierz status członka
								</small>
							)}
						</div>

						{/* ⭐ WIERSZ 5: Data dołączenia (pełna szerokość) */}
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Data dołączenia</label>
							<input
								type="date"
								className={styles.modal__input}
								value={formData.joinDate || currentMember.joinDate}
								onChange={(e) =>
									setFormData({ ...formData, joinDate: e.target.value })
								}
								disabled={!canEdit}
							/>
						</div>
					</div>

					{/* Urlopy */}
					{currentMember.vacation && (
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>Aktualny urlop</h3>
							<div className={styles.modal__vacationInfo}>
								<Umbrella size={18} />
								<span>
									{formatDate(currentMember.vacation.startDate)} -{" "}
									{formatDate(currentMember.vacation.endDate)}
								</span>
								<span className={styles.modal__vacationType}>
									{currentMember.vacation.type === "team"
										? "Urlop zespołowy"
										: "Urlop organizacyjny"}
								</span>
							</div>
						</div>
					)}

					{/* Zainteresowania i umiejętności */}
					<div className={styles.modal__section}>
						<h3 className={styles.modal__sectionTitle}>
							Zainteresowania i umiejętności
						</h3>

						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Zainteresowania</label>
							{canEdit ? (
								<>
									<div className={styles.modal__tagInput}>
										<input
											type="text"
											className={styles.modal__input}
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
											className={styles.modal__addBtn}
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
									<div className={styles.modal__tags}>
										{(formData.interests || currentMember.interests).map(
											(item) => (
												<span key={item} className={styles.modal__tag}>
													{item}
													<button
														type="button"
														className={styles.modal__removeTag}
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
											),
										)}
									</div>
								</>
							) : (
								<div className={styles.modal__tags}>
									{currentMember.interests.map((item) => (
										<span key={item} className={styles.modal__tag}>
											{item}
										</span>
									))}
								</div>
							)}
						</div>

						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Umiejętności</label>
							{canEdit ? (
								<>
									<div className={styles.modal__tagInput}>
										<input
											type="text"
											className={styles.modal__input}
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
											className={styles.modal__addBtn}
											onClick={() => {
												addItem(
													formData.skills || [],
													(list) => setFormData({ ...formData, skills: list }),
													newSkill,
												);
												setNewSkill("");
											}}
										>
											<Plus size={16} />
										</button>
									</div>
									<div className={styles.modal__tags}>
										{(formData.skills || currentMember.skills).map((item) => (
											<span key={item} className={styles.modal__tag}>
												{item}
												<button
													type="button"
													className={styles.modal__removeTag}
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
								<div className={styles.modal__tags}>
									{currentMember.skills.map((item) => (
										<span key={item} className={styles.modal__tag}>
											{item}
										</span>
									))}
								</div>
							)}
						</div>

						<div className={styles.modal__field}>
							<label className={styles.modal__label}>
								Obszary działania w SM
							</label>
							{canEdit ? (
								<>
									<div className={styles.modal__tagInput}>
										<input
											type="text"
											className={styles.modal__input}
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
											className={styles.modal__addBtn}
											onClick={() => {
												addItem(
													formData.smAreas || [],
													(list) => setFormData({ ...formData, smAreas: list }),
													newArea,
												);
												setNewArea("");
											}}
										>
											<Plus size={16} />
										</button>
									</div>
									<div className={styles.modal__tags}>
										{(formData.smAreas || currentMember.smAreas).map((item) => (
											<span key={item} className={styles.modal__tag}>
												{item}
												<button
													type="button"
													className={styles.modal__removeTag}
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
								<div className={styles.modal__tags}>
									{currentMember.smAreas.map((item) => (
										<span key={item} className={styles.modal__tag}>
											{item}
										</span>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Dane kontaktowe - tylko dla użytkownika i koordynatorów */}
					{canViewSensitive && (
						<>
							{/* Kontakty i znajomości */}
							<div className={styles.modal__section}>
								<h3 className={styles.modal__sectionTitle}>
									Kontakty i znajomości
								</h3>

								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Kontakty z salami
									</label>
									{canEdit ? (
										<>
											<div className={styles.modal__tagInput}>
												<input
													type="text"
													className={styles.modal__input}
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
													className={styles.modal__addBtn}
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
											<div className={styles.modal__tags}>
												{(
													formData.contacts?.salaContacts ||
													currentMember.contacts?.salaContacts ||
													[]
												).map((item) => (
													<span key={item} className={styles.modal__tag}>
														{item}
														<button
															type="button"
															className={styles.modal__removeTag}
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
										<div className={styles.modal__tags}>
											{(currentMember.contacts?.salaContacts || []).map(
												(item) => (
													<span key={item} className={styles.modal__tag}>
														{item}
													</span>
												),
											)}
										</div>
									)}
								</div>

								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Kontakty z posłami
									</label>
									{canEdit ? (
										<>
											<div className={styles.modal__tagInput}>
												<input
													type="text"
													className={styles.modal__input}
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
													className={styles.modal__addBtn}
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
											<div className={styles.modal__tags}>
												{(
													formData.contacts?.mpContacts ||
													currentMember.contacts?.mpContacts ||
													[]
												).map((item) => (
													<span key={item} className={styles.modal__tag}>
														{item}
														<button
															type="button"
															className={styles.modal__removeTag}
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
										<div className={styles.modal__tags}>
											{(currentMember.contacts?.mpContacts || []).map(
												(item) => (
													<span key={item} className={styles.modal__tag}>
														{item}
													</span>
												),
											)}
										</div>
									)}
								</div>

								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Inne przydatne kontakty
									</label>
									{canEdit ? (
										<>
											<div className={styles.modal__tagInput}>
												<input
													type="text"
													className={styles.modal__input}
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
													className={styles.modal__addBtn}
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
											<div className={styles.modal__tags}>
												{(
													formData.contacts?.otherContacts ||
													currentMember.contacts?.otherContacts ||
													[]
												).map((item) => (
													<span key={item} className={styles.modal__tag}>
														{item}
														<button
															type="button"
															className={styles.modal__removeTag}
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
										<div className={styles.modal__tags}>
											{(currentMember.contacts?.otherContacts || []).map(
												(item) => (
													<span key={item} className={styles.modal__tag}>
														{item}
													</span>
												),
											)}
										</div>
									)}
								</div>

								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Obszary szkoleniowe
									</label>
									{canEdit ? (
										<>
											<div className={styles.modal__tagInput}>
												<input
													type="text"
													className={styles.modal__input}
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
													className={styles.modal__addBtn}
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
											<div className={styles.modal__tags}>
												{(
													formData.trainingAreas ||
													currentMember.trainingAreas ||
													[]
												).map((item) => (
													<span key={item} className={styles.modal__tag}>
														{item}
														<button
															type="button"
															className={styles.modal__removeTag}
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
										<div className={styles.modal__tags}>
											{(currentMember.trainingAreas || []).map((item) => (
												<span key={item} className={styles.modal__tag}>
													{item}
												</span>
											))}
										</div>
									)}
								</div>
							</div>

							{/* Informacje o składkach */}
							<div className={styles.modal__section}>
								<h3 className={styles.modal__sectionTitle}>
									Informacje o składkach
								</h3>
								<div className={styles.modal__row}>
									<div className={styles.modal__field}>
										<label className={styles.modal__label}>Status</label>
										<select
											className={styles.modal__select}
											value={
												formData.contributionInfo?.status ||
												currentMember.contributionInfo?.status ||
												"paid"
											}
											onChange={(e) =>
												setFormData({
													...formData,
													contributionInfo: {
														...formData.contributionInfo,
														status: e.target.value as
															| "paid"
															| "partial"
															| "unpaid",
													},
												})
											}
											disabled={!canEdit}
										>
											<option value="paid">Opłacone</option>
											<option value="partial">Częściowo opłacone</option>
											<option value="unpaid">Nieopłacone</option>
										</select>
									</div>
									<div className={styles.modal__field}>
										<label className={styles.modal__label}>
											Zaległości (zł)
										</label>
										<input
											type="number"
											className={styles.modal__input}
											value={
												formData.contributionInfo?.arrears ||
												currentMember.contributionInfo?.arrears ||
												0
											}
											onChange={(e) =>
												setFormData({
													...formData,
													contributionInfo: {
														...formData.contributionInfo,
														arrears: parseFloat(e.target.value) || 0,
													},
												})
											}
											disabled={!canEdit}
										/>
									</div>
								</div>
							</div>
						</>
					)}

					<div className={styles.modal__actions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={onClose}
						>
							{isEdit ? "Anuluj" : "Zamknij"}
						</button>
						{isEdit && canEdit && (
							<button
								type="submit"
								className={styles.modal__btnSave}
								disabled={!formData.status} // ✅ Zablokuj jeśli status nie jest wybrany
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

// ---------------------------------------------------------------------------
// GŁÓWNY KOMPONENT
// ---------------------------------------------------------------------------

export default function Members({ title }: { title?: string }) {
	const [loading, setLoading] = useState(true);
	const [members, setMembers] = useState<Member[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedProvince, setSelectedProvince] = useState<string>("all");
	const [selectedTeam, setSelectedTeam] = useState<string>("all");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState<Member | null>(null);
	const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
	const [newMemberData, setNewMemberData] = useState<Partial<Member> | null>(
		null,
	);
	const [showCustomTeam, setShowCustomTeam] = useState(false); // ✅ DODAJ
	const [customTeamName, setCustomTeamName] = useState("");
	const [teamsList, setTeamsList] = useState<{ id: number; name: string }[]>(
		[],
	);
	const [customTeamRole, setCustomTeamRole] = useState("Zespół");
	const [customTeamDescription, setCustomTeamDescription] = useState("");
	const [customTeamIcon, setCustomTeamIcon] = useState("Users");
	const [customTeamParent, setCustomTeamParent] = useState("");
	const [customTeamEmail, setCustomTeamEmail] = useState("");
	const [sortBy, setSortBy] = useState<
		"name" | "function" | "province" | "status"
	>("name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	// ⭐ POBIERANIE CZŁONKÓW Z BACKENDU
	// ⭐ DODAJ TO
	useEffect(() => {
		const fetchTeams = async () => {
			try {
				const token = localStorage.getItem("accessToken");
				const response = await fetch("/api/teams", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				if (response.ok) {
					const data = await response.json();
					setTeamsList(data);
				}
			} catch (error) {
				console.error("❌ Błąd pobierania zespołów:", error);
			}
		};
		fetchTeams();
	}, []);

	useEffect(() => {
		const fetchMembers = async () => {
			try {
				setLoading(true);
				const token = localStorage.getItem("accessToken");

				const response = await fetch("/api/members", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					throw new Error("Błąd pobierania członków");
				}

				const data = await response.json();

				// ⭐ DODAJ MAPOWANIE DANYCH
				const mappedMembers = data.map((user: any) => {
					const onboarding = user.onboarding_data || {};

					// Sprawdź czy są jakieś dane onboardingowe
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
						team: user.team || "Brak zespołu",
						teamId:
							user.team_id ||
							user.team?.toLowerCase().replace(/\s/g, "-") ||
							"",
						province: user.province || "",
						status:
							user.status === "mentor"
								? "mentor"
								: user.status === "active"
									? "active"
									: "trial",
						// Tylko jeśli są dane, to parsuj, inaczej pusta tablica
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
						joinDate:
							user.join_date ||
							user.created_at?.split("T")[0] ||
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
						// Dodaj flagę czy ma dane onboardingowe
						hasOnboarding: hasOnboardingData,
					};
				});

				setMembers(mappedMembers);
			} catch (error) {
				console.error("❌ Błąd pobierania członków:", error);
				setMembers([]);
			} finally {
				setLoading(false);
			}
		};

		fetchMembers();
	}, []);
	const currentUser = MOCK_USER;
	// ===== DODANE FUNKCJE DLA NOWEGO CZŁONKA =====
	const handleAddMember = () => {
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
	};

	const handleAddNewMember = async (member: Member) => {
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

			// Sprawdź czy to nowy zespół
			let teamName = member.team;
			if (teamName && !teamsList.some((t) => t.name === teamName)) {
				// Walidacja - nazwa zespołu jest wymagana
				if (!teamName || !teamName.trim()) {
					toast.error("Nazwa nowego zespołu jest wymagana");
					return;
				}

				const teamData = {
					name: teamName.trim(),
					role: customTeamRole || "Zespół",
					description: customTeamDescription || null,
					icon: customTeamIcon || "Users",
					status: "active",
					parent_id: customTeamParent ? parseInt(customTeamParent) : null, // ✅ to powinno działać
					email: customTeamEmail || null,
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

				// Resetuj pola nowego zespołu
				setCustomTeamName("");
				setCustomTeamRole("Zespół");
				setCustomTeamDescription("");
				setCustomTeamIcon("Users");
				setCustomTeamParent("");
				setCustomTeamEmail("");
			}

			// Teraz utwórz członka
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

				// Jeśli użytkownik już istnieje, pokaż konkretny komunikat
				if (
					errorMessage.includes("już istnieje") ||
					errorMessage.includes("już jest przypisany")
				) {
					toast.error(errorMessage);
				} else {
					toast.error(errorMessage);
				}
				throw new Error(errorMessage);
			}

			const savedMember = await response.json();
			setMembers([savedMember, ...members]);
			setIsAddMemberOpen(false);
			setNewMemberData(null);
			setShowCustomTeam(false);
			setCustomTeamName("");
			setCustomTeamRole("Zespół");
			setCustomTeamDescription("");
			setCustomTeamIcon("Users");
			setCustomTeamParent("");
			setCustomTeamEmail("");
			toast.success(
				`Członek ${member.firstName} ${member.lastName} został dodany!`,
			);
		} catch (error) {
			console.error("❌ Błąd dodawania członka:", error);
			toast.error(
				error instanceof Error ? error.message : "Nie udało się dodać członka",
			);
		}
	};
	// Unikalne województwa i zespoły dla filtrów
	const provinces = useMemo(() => {
		const unique = new Set(
			members
				.map((m) => m.province)
				.filter((p) => p && p !== "" && p !== "Brak" && p !== "Nieznane"),
		);
		return Array.from(unique).sort();
	}, [members]);
	// Obok innych useMemo
	// Obok innych useMemo
	const parentTeams = useMemo(() => {
		// Tylko zespoły o ID: 1, 4, 7
		const allowedParentIds = [1, 4, 7];
		return teamsList.filter((team) => allowedParentIds.includes(team.id));
	}, [teamsList]);
	const teams = useMemo(() => {
		const unique = new Set(members.map((m) => m.team));
		return Array.from(unique).sort();
	}, [members]);
	// W Members, razem z innymi useState
	const [confirmDialog, setConfirmDialog] = useState<{
		isOpen: boolean;
		member: Member | null;
	}>({ isOpen: false, member: null });
	// Funkcja otwierająca dialog
	const handleDeleteMember = (member: Member) => {
		setConfirmDialog({ isOpen: true, member });
	};

	// Funkcja wykonująca usunięcie
	const confirmDelete = async () => {
		const member = confirmDialog.member;
		if (!member) return;

		setConfirmDialog({ isOpen: false, member: null });

		try {
			const token = localStorage.getItem("accessToken");
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
			console.error("❌ Błąd usuwania członka:", error);
			toast.error("Nie udało się usunąć członka");
		}
	};

	// Funkcja anulująca
	const cancelDelete = () => {
		setConfirmDialog({ isOpen: false, member: null });
	};
	const filteredMembers = useMemo(() => {
		return members
			.filter((member) => {
				const matchesSearch =
					(member.firstName || "")
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					(member.lastName || "")
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					(member.function || "")
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					(member.team || "")
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					(member.province || "")
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					member.skills.some((s) =>
						s.toLowerCase().includes(searchTerm.toLowerCase()),
					) ||
					member.interests.some((i) =>
						i.toLowerCase().includes(searchTerm.toLowerCase()),
					) ||
					member.smAreas.some((a) =>
						a.toLowerCase().includes(searchTerm.toLowerCase()),
					);

				const matchesProvince =
					selectedProvince === "all" || member.province === selectedProvince;
				const matchesTeam =
					selectedTeam === "all" || member.team === selectedTeam;

				return matchesSearch && matchesProvince && matchesTeam;
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
				}
				return sortOrder === "asc" ? comparison : -comparison;
			});
	}, [members, searchTerm, selectedProvince, selectedTeam, sortBy, sortOrder]);

	const handleViewMember = (member: Member) => {
		setSelectedMember(member);
		setIsProfileOpen(true);
	};
	// ⭐ USUWANIE CZŁONKA

	const handleEditMember = (member: Member) => {
		setSelectedMember(member);
		setIsEditOpen(true);
	};

	const handleSaveMember = async (updatedMember: Member) => {
		try {
			const token = localStorage.getItem("accessToken");

			const response = await fetch(`/api/members/${updatedMember.id}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updatedMember),
			});

			if (!response.ok) {
				throw new Error("Błąd aktualizacji członka");
			}

			const savedMember = await response.json();
			setMembers(
				members.map((m) => (m.id === savedMember.id ? savedMember : m)),
			);
			setIsEditOpen(false);
			setSelectedMember(null);
			toast.success("Dane członka zostały zaktualizowane!");
		} catch (error) {
			toast.error("Nie udało się zaktualizować danych");
		}
	};

	const clearFilters = () => {
		setSearchTerm("");
		setSelectedProvince("all");
		setSelectedTeam("all");
	};

	const toggleSort = (field: "name" | "function" | "province" | "status") => {
		if (sortBy === field) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortBy(field);
			setSortOrder("asc");
		}
	};

	return (
		<div className={styles.members}>
			{/* Nagłówek */}
			<div className={styles.header}>
				<div className={styles.header__left}>
					<h1 className={styles.header__title}>
						{title ?? "Członkowie Siły Młodych"}
					</h1>
					<p className={styles.header__subtitle}>
						{members.length} członków w organizacji
					</p>
				</div>
				{/* DODAJ TEN PRZYCISK */}
				{currentUser.role === "admin" && (
					<button className={styles.header__addBtn} onClick={handleAddMember}>
						<Plus size={18} />
						Dodaj członka
					</button>
				)}
			</div>

			{/* Filtry i wyszukiwarka */}
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

					<div className={styles.filters__viewToggle}>
						<button
							className={`${styles.filters__viewBtn} ${viewMode === "grid" ? styles.filters__viewBtnActive : ""}`}
							onClick={() => setViewMode("grid")}
							title="Widok kafelków"
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

					{(selectedProvince !== "all" ||
						selectedTeam !== "all" ||
						searchTerm) && (
						<button className={styles.filters__reset} onClick={clearFilters}>
							Wyczyść filtry
						</button>
					)}
				</div>
			</div>

			{/* Sortowanie */}
			<div className={styles.sorting}>
				<span className={styles.sorting__label}>Sortuj według:</span>
				<button
					className={`${styles.sorting__btn} ${sortBy === "name" ? styles.sorting__btnActive : ""}`}
					onClick={() => toggleSort("name")}
				>
					Nazwy
					{sortBy === "name" && (
						<ArrowUpDown
							size={14}
							className={
								sortOrder === "asc" ? styles.sorting__asc : styles.sorting__desc
							}
						/>
					)}
				</button>
				<button
					className={`${styles.sorting__btn} ${sortBy === "function" ? styles.sorting__btnActive : ""}`}
					onClick={() => toggleSort("function")}
				>
					Funkcji
					{sortBy === "function" && (
						<ArrowUpDown
							size={14}
							className={
								sortOrder === "asc" ? styles.sorting__asc : styles.sorting__desc
							}
						/>
					)}
				</button>
				<button
					className={`${styles.sorting__btn} ${sortBy === "province" ? styles.sorting__btnActive : ""}`}
					onClick={() => toggleSort("province")}
				>
					Województwa
					{sortBy === "province" && (
						<ArrowUpDown
							size={14}
							className={
								sortOrder === "asc" ? styles.sorting__asc : styles.sorting__desc
							}
						/>
					)}
				</button>
				<button
					className={`${styles.sorting__btn} ${sortBy === "status" ? styles.sorting__btnActive : ""}`}
					onClick={() => toggleSort("status")}
				>
					Statusu
					{sortBy === "status" && (
						<ArrowUpDown
							size={14}
							className={
								sortOrder === "asc" ? styles.sorting__asc : styles.sorting__desc
							}
						/>
					)}
				</button>
			</div>

			{/* Lista członków */}
			<div
				className={`${styles.membersGrid} ${viewMode === "list" ? styles.membersGridList : ""}`}
			>
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
							{searchTerm ||
							selectedProvince !== "all" ||
							selectedTeam !== "all"
								? "Nie znaleziono członków spełniających kryteria wyszukiwania."
								: "Nie ma jeszcze żadnych członków w organizacji."}
						</p>
					</div>
				) : (
					filteredMembers.map((member) => (
						<MemberCard
							key={member.id}
							member={member}
							currentUser={currentUser}
							onView={handleViewMember}
							onEdit={handleEditMember}
							onDelete={handleDeleteMember}
							viewMode={viewMode}
						/>
					))
				)}
			</div>
			{/* ===== MODAL DODAWANIA NOWEGO CZŁONKA ===== */}
			<ProfileModal
				isOpen={isAddMemberOpen}
				member={newMemberData as Member}
				currentUser={currentUser}
				isEdit={true}
				onClose={() => {
					setIsAddMemberOpen(false);
					setNewMemberData(null);
					setShowCustomTeam(false); // ✅ DODAJ
					setCustomTeamName("");
				}}
				onSave={handleAddNewMember}
				teamsList={teamsList}
				parentTeamsList={parentTeams}
				showCustomTeam={showCustomTeam} // ✅ DODAJ
				setShowCustomTeam={setShowCustomTeam} // ✅ DODAJ
				customTeamName={customTeamName} // ✅ DODAJ
				setCustomTeamName={setCustomTeamName}
				customTeamRole={customTeamRole}
				setCustomTeamRole={setCustomTeamRole}
				customTeamDescription={customTeamDescription}
				setCustomTeamDescription={setCustomTeamDescription}
				customTeamIcon={customTeamIcon}
				setCustomTeamIcon={setCustomTeamIcon}
				customTeamParent={customTeamParent}
				setCustomTeamParent={setCustomTeamParent}
				customTeamEmail={customTeamEmail}
				setCustomTeamEmail={setCustomTeamEmail}
			/>

			{/* Modal podglądu profilu */}
			<ProfileModal
				isOpen={isProfileOpen}
				member={selectedMember}
				currentUser={currentUser}
				isEdit={false}
				onClose={() => {
					setIsProfileOpen(false);
					setSelectedMember(null);
				}}
			/>

			{/* Modal edycji profilu */}
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
