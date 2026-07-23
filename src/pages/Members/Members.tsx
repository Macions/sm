import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import styles from "./Members.module.css";

// ---------------------------------------------------------------------------
// TYPY
// ---------------------------------------------------------------------------

type MemberStatus = "trial" | "full" | "mentor";
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
	trial: "Okres próbny",
	full: "Pełnoprawny członek",
	mentor: "Mentor",
};

const STATUS_COLORS: Record<MemberStatus, string> = {
	trial: styles.statusTrial,
	full: styles.statusFull,
	mentor: styles.statusMentor,
};

const STATUS_ICONS: Record<MemberStatus, React.ReactNode> = {
	trial: <Clock size={14} />,
	full: <CheckCircle size={14} />,
	mentor: <Star size={14} />,
};

// ---------------------------------------------------------------------------
// KOMPONENT KARTY CZŁONKA
// ---------------------------------------------------------------------------

interface MemberCardProps {
	member: Member;
	currentUser: User;
	onView: (member: Member) => void;
	onEdit: (member: Member) => void;
	viewMode: "grid" | "list";
}

function MemberCard({
	member,
	currentUser,
	onView,
	onEdit,
	viewMode,
}: MemberCardProps) {
	const getInitials = () => {
		return member.firstName[0] + member.lastName[0];
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
					{member.avatar || getInitials()}
				</div>
				<div className={styles.memberCard__info}>
					<div className={styles.memberCard__nameRow}>
						<h3 className={styles.memberCard__name}>
							{member.firstName} {member.lastName}
						</h3>
						<span
							className={`${styles.memberCard__status} ${STATUS_COLORS[member.status]}`}
						>
							{STATUS_ICONS[member.status]}
							{STATUS_LABELS[member.status]}
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
						<span className={styles.memberCard__detail}>
							<MapPin size={14} />
							{member.province}
						</span>
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
				{member.avatar || getInitials()}
			</div>
			<h3 className={styles.memberCard__name}>
				{member.firstName} {member.lastName}
			</h3>
			<p className={styles.memberCard__function}>{member.function}</p>
			<p className={styles.memberCard__team}>
				<Users size={14} />
				{member.team}
			</p>
			<p className={styles.memberCard__province}>
				<MapPin size={14} />
				{member.province}
			</p>
			<div className={styles.memberCard__status}>
				<span
					className={`${styles.memberCard__statusBadge} ${STATUS_COLORS[member.status]}`}
				>
					{STATUS_ICONS[member.status]}
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
			<div className={styles.memberCard__actions}>
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
}

function ProfileModal({
	isOpen,
	member,
	currentUser,
	isEdit = false,
	onClose,
	onSave,
}: ProfileModalProps) {
	const [formData, setFormData] = useState<Partial<Member>>({
		firstName: "",
		lastName: "",
		function: "",
		team: "",
		teamId: "",
		province: "",
		status: "active",
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
			console.log('📝 Member status:', member.status);
			console.log('📝 Member status type:', typeof member.status);

			const newFormData = {
				id: member.id,
				firstName: member.firstName || "",
				lastName: member.lastName || "",
				function: member.function || "",
				team: member.team || "",
				teamId: member.teamId || "",
				province: member.province || "",
				status: member.status || "active",  // <-- TO POWINNO DZIAŁAĆ
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

			console.log('📝 Nowy formData.status:', newFormData.status);
			setFormData(newFormData);

			// ⭐ Sprawdź czy formData się ustawiło po chwili
			setTimeout(() => {
				console.log('📝 formData.status po setTimeout:', formData.status);
			}, 100);
		} else {
			setFormData({
				firstName: "",
				lastName: "",
				function: "",
				team: "",
				teamId: "",
				province: "",
				status: "active",
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

	if (!isOpen) return null;

	// Sprawdzenie czy mamy member (dla podglądu) lub jesteśmy w trybie edycji/dodawania
	if (!member && !isEdit) return null;

	// Dla dodawania nowego (member null, isEdit true) - używamy domyślnych wartości
	const currentMember = member || {
		id: '',
		firstName: '',
		lastName: '',
		function: '',
		team: '',
		teamId: '',
		province: '',
		status: 'trial' as MemberStatus,
		interests: [],
		skills: [],
		smAreas: [],
		email: '',
		phone: '',
		joinDate: '',
		contacts: {
			salaContacts: [],
			mpContacts: [],
			otherContacts: [],
		},
		trainingAreas: [],
		contributionInfo: {
			status: 'paid' as const,
			arrears: 0,
		},
	};

	const canEdit = isEdit && (currentUser.id === currentMember.id || currentUser.role === "admin");

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
		if (onSave && canEdit) {
			        console.log('📝 formData w handleSubmit:', formData); // ⭐ DODAJ

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
			        console.log('📤 saveData:', saveData); // ⭐ DODAJ

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
						{!currentMember?.id ? "Dodaj nowego członka" :
							isEdit ? "Edytuj profil" :
								`Profil: ${currentMember.firstName} ${currentMember.lastName}`
						}
					</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className={styles.modal__form}>
					{/* Podstawowe informacje - zawsze widoczne */}
					<div className={styles.modal__section}>
						<h3 className={styles.modal__sectionTitle}>
							Podstawowe informacje
						</h3>
						<div className={styles.modal__row}>
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>Imię</label>
								<input
									type="text"
									className={styles.modal__input}
									value={formData.firstName || ""}
									onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}

									disabled={!canEdit}
								/>
							</div>
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>Nazwisko</label>
								<input
									type="text"
									className={styles.modal__input}
									value={formData.lastName || ""}
									onChange={(e) =>
										setFormData({ ...formData, lastName: e.target.value })
									}
									disabled={!canEdit}
								/>
							</div>
						</div>

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
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>Zespół</label>
								<input
									type="text"
									className={styles.modal__input}
									value={formData.team || currentMember.team}
									onChange={(e) =>
										setFormData({ ...formData, team: e.target.value })
									}
									disabled={!canEdit}
								/>
							</div>
						</div>

						<div className={styles.modal__row}>
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>Województwo</label>
								<input
									type="text"
									className={styles.modal__input}
									value={formData.province || currentMember.province}
									onChange={(e) =>
										setFormData({ ...formData, province: e.target.value })
									}
									disabled={!canEdit}
								/>
							</div>
							<div className={styles.modal__field}>
								<label className={styles.modal__label}>Status</label>
								<select
									className={styles.modal__select}
									value={formData.status || "active"}
									onChange={(e) =>
										setFormData({
											...formData,
											status: e.target.value as MemberStatus,
										})
									}
									disabled={!canEdit}
								>
									<option value="trial">Okres próbny</option>
									<option value="active">Pełnoprawny członek</option>
									<option value="mentor">Mentor</option>
								</select>
							</div>
						</div>

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
										{(formData.interests || currentMember.interests).map((item) => (
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
										))}
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
							<div className={styles.modal__section}>
								<h3 className={styles.modal__sectionTitle}>Dane kontaktowe</h3>
								<div className={styles.modal__row}>
									<div className={styles.modal__field}>
										<label className={styles.modal__label}>Email</label>
										<input
											type="email"
											className={styles.modal__input}
											value={formData.email || currentMember.email}
											onChange={(e) =>
												setFormData({ ...formData, email: e.target.value })
											}
											disabled={!canEdit}
										/>
									</div>
								</div>
							</div>

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
											{(currentMember.contacts?.salaContacts || []).map((item) => (
												<span key={item} className={styles.modal__tag}>
													{item}
												</span>
											))}
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
											{(currentMember.contacts?.mpContacts || []).map((item) => (
												<span key={item} className={styles.modal__tag}>
													{item}
												</span>
											))}
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
											{(currentMember.contacts?.otherContacts || []).map((item) => (
												<span key={item} className={styles.modal__tag}>
													{item}
												</span>
											))}
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
							<button type="submit" className={styles.modal__btnSave}>
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
	const [newMemberData, setNewMemberData] = useState<Partial<Member> | null>(null);
	const [sortBy, setSortBy] = useState<
		"name" | "function" | "province" | "status"
	>("name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
	// ⭐ POBIERANIE CZŁONKÓW Z BACKENDU
	// ⭐ DODAJ TO
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
				setMembers(data);
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
			status: "trial",
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
		try {
			console.log('📤 Wysyłanie danych:', JSON.stringify(member, null, 2)); // ⭐ DODAJ

			const token = localStorage.getItem("accessToken");

			const response = await fetch("/api/members", {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(member),
			});

			// ⭐ DODAJ WIĘCEJ INFO O BŁĘDZIE
			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Odpowiedź błędu:', errorText);
				throw new Error(`Błąd dodawania członka: ${response.status} - ${errorText}`);
			}

			const savedMember = await response.json();
			setMembers([savedMember, ...members]);
			setIsAddMemberOpen(false);
			setNewMemberData(null);
		} catch (error) {
			console.error('❌ Błąd dodawania członka:', error);
			alert('Nie udało się dodać członka: ' + (error as Error).message);
		}
	};

	// Unikalne województwa i zespoły dla filtrów
	const provinces = useMemo(() => {
		const unique = new Set(members.map((m) => m.province));
		return Array.from(unique).sort();
	}, [members]);

	const teams = useMemo(() => {
		const unique = new Set(members.map((m) => m.team));
		return Array.from(unique).sort();
	}, [members]);

	const filteredMembers = useMemo(() => {
		return members
			.filter((member) => {
				const matchesSearch =
					member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
					member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
					member.function.toLowerCase().includes(searchTerm.toLowerCase()) ||
					member.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
					member.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
						comparison = (a.firstName + a.lastName).localeCompare(
							b.firstName + b.lastName,
						);
						break;
					case "function":
						comparison = a.function.localeCompare(b.function);
						break;
					case "province":
						comparison = a.province.localeCompare(b.province);
						break;
					case "status":
						comparison = a.status.localeCompare(b.status);
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
	const handleDeleteMember = async (id: string) => {
		if (!window.confirm("Czy na pewno chcesz usunąć tego członka?")) return;

		try {
			const token = localStorage.getItem("accessToken");

			const response = await fetch(`/api/members/${id}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error('Błąd usuwania członka');
			}

			setMembers(members.filter((m) => m.id !== id));
		} catch (error) {
			console.error('❌ Błąd usuwania członka:', error);
			alert('Nie udało się usunąć członka');
		}
	};
	const handleEditMember = (member: Member) => {
		setSelectedMember(member);
		setIsEditOpen(true);
	};

	const handleSaveMember = async (updatedMember: Member) => {
		try {
			const token = localStorage.getItem("accessToken");

			const response = await fetch(`/api/members/${updatedMember.id}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updatedMember),
			});

			if (!response.ok) {
				throw new Error('Błąd aktualizacji członka');
			}

			const savedMember = await response.json();
			setMembers(
				members.map((m) => (m.id === savedMember.id ? savedMember : m)),
			);
			setIsEditOpen(false);
			setSelectedMember(null);
		} catch (error) {
			console.error('❌ Błąd aktualizacji członka:', error);
			alert('Nie udało się zaktualizować członka');
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
				}}
				onSave={handleAddNewMember}
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
		</div>
	);
}
