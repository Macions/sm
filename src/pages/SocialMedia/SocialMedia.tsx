import { FaInstagram, FaTiktok, FaFacebook, FaYoutube } from "react-icons/fa";
import toast from "react-hot-toast";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { useState, useMemo, useEffect, useRef } from "react";
import {
	Users,
	Search,
	Plus,
	User,
	MapPin,
	Briefcase,
	Clock,
	AlertCircle,
	Calendar,
	Tag,
	Image as ImageIcon,
	Video as VideoIcon,
	FileText,
	Star,
	Mail,
	Phone,
	Camera,
	X,
	Edit, // ⭐ DODAJ
	Trash2,
} from "lucide-react";
import styles from "./SocialMedia.module.css";

// ---------------------------------------------------------------------------
// TYPY
// ---------------------------------------------------------------------------
type EditMode = "publication" | "task" | "contact" | null;
type SocialRole =
	| "instagram"
	| "tiktok"
	| "manager"
	| "graphic"
	| "editor"
	| "photographer"
	| "content_creator";

type Platform = "instagram" | "tiktok" | "facebook" | "youtube";
type ContentType = "reel" | "post" | "story" | "graphic" | "video";
type PublicationStatus =
	| "idea"
	| "preparation"
	| "editing"
	| "approval"
	| "scheduled"
	| "published";
type TaskStatus = "pending" | "in_progress" | "done";
type MaterialStage = "ideas" | "recording" | "editing" | "approval" | "ready";

// ---------------------------------------------------------------------------
// INTERFEJSY
// ---------------------------------------------------------------------------
interface MaterialFormData {
	name: string;
	description: string;
	responsible_id: string;
	deadline: string;
	priority: "low" | "medium" | "high";
	stage: MaterialStage;
}
// ⭐ DODAJ TYP DLA EDYCJI MATERIAŁU
interface EditMaterialModalProps {
	isOpen: boolean;
	material: Material | null;
	onClose: () => void;
	onSave: (id: string, data: MaterialFormData) => void;
	teamMembers: TeamMember[];
}

interface CreatorFormData {
	user_id: string;
	availability: string;
	experience: "none" | "beginner" | "intermediate" | "advanced";
	// topics: string[];
}

interface AddCreatorModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: CreatorFormData) => void;
	availableUsers: any[];
}

// ⭐ ZAKTUALIZUJ interfejs CreatorsSection
interface CreatorsSectionProps {
	creators: ContentCreator[];
	canManage: boolean;
	onAddCreator?: () => void;
}
interface TeamMember {
	id: string;
	user_id: string;
	firstName: string;
	lastName: string;
	role: SocialRole;
	avatar?: string;
	email: string;
	phone?: string;
	province: string;
	team: string;
	joinDate: string;
	status: 'active' | 'trial' | 'mentor' | 'vacation'; // ⭐ ZMIEŃ z active: boolean na status
}
// frontend/src/pages/SocialMedia/SocialMedia.tsx
// DODAJ PO INNYCH MODALACH

// ---------- MODAL DODAWANIA MATERIAŁU ----------
interface AddMaterialModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: MaterialFormData) => void;
	teamMembers: TeamMember[];
}

function AddMaterialModal({
	isOpen,
	onClose,
	onSave,
	teamMembers,
}: AddMaterialModalProps) {
	const [formData, setFormData] = useState<MaterialFormData>({
		name: "",
		description: "",
		responsible_id: "",
		deadline: "",
		priority: "medium",
		stage: "ideas",
	});

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name || !formData.responsible_id || !formData.deadline) {
			toast.error("Wypełnij wszystkie wymagane pola");
			return;
		}
		onSave(formData);
		onClose();
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modal__header}>
					<h2 className={styles.modal__title}>Dodaj materiał</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>
				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Nazwa materiału *</label>
						<input
							type="text"
							className={styles.modal__input}
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							required
						/>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Opis</label>
						<textarea
							className={`${styles.modal__input} ${styles.modal__textarea}`}
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							rows={3}
						/>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>
							Osoba odpowiedzialna *
						</label>
						<select
							className={styles.modal__select}
							value={formData.responsible_id}
							onChange={(e) =>
								setFormData({ ...formData, responsible_id: e.target.value })
							}
							required
						>
							<option value="">Wybierz osobę</option>
							{teamMembers.map((member) => (
								<option key={member.id} value={member.user_id}>
									{member.firstName} {member.lastName}
								</option>
							))}
						</select>
					</div>
					<div className={styles.modal__row}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Termin *</label>
							<input
								type="date"
								className={styles.modal__input}
								value={formData.deadline}
								onChange={(e) =>
									setFormData({ ...formData, deadline: e.target.value })
								}
								required
							/>
						</div>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Priorytet</label>
							<select
								className={styles.modal__select}
								value={formData.priority}
								onChange={(e) =>
									setFormData({
										...formData,
										priority: e.target.value as "low" | "medium" | "high",
									})
								}
							>
								<option value="low">Niski</option>
								<option value="medium">Średni</option>
								<option value="high">Wysoki</option>
							</select>
						</div>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Etap</label>
						<select
							className={styles.modal__select}
							value={formData.stage}
							onChange={(e) =>
								setFormData({
									...formData,
									stage: e.target.value as MaterialStage,
								})
							}
						>
							{Object.entries(STAGE_LABELS).map(([key, label]) => (
								<option key={key} value={key}>
									{label}
								</option>
							))}
						</select>
					</div>
					<div className={styles.modal__actions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={onClose}
						>
							Anuluj
						</button>
						<button type="submit" className={styles.modal__btnSave}>
							Dodaj materiał
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
// ---------- MODAL EDYCJI MATERIAŁU ----------
function EditMaterialModal({
	isOpen,
	material,
	onClose,
	onSave,
	teamMembers,
}: EditMaterialModalProps) {
	const [formData, setFormData] = useState<MaterialFormData>({
		name: "",
		description: "",
		responsible_id: "",
		deadline: "",
		priority: "medium",
		stage: "ideas",
	});

	// ⭐ WYPEŁNIJ FORMULARZ DANYMI MATERIAŁU
	useEffect(() => {
		if (material) {
			const responsible = teamMembers.find(
				(m) => `${m.firstName} ${m.lastName}` === material.responsible,
			);
			setFormData({
				name: material.name,
				description: material.description || "",
				responsible_id: responsible?.id || "",
				deadline: material.deadline,
				priority: material.priority,
				stage: material.stage,
			});
		}
	}, [material, teamMembers]);

	if (!isOpen || !material) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name || !formData.responsible_id || !formData.deadline) {
			toast.error("Wypełnij wszystkie wymagane pola");
			return;
		}
		onSave(material.id, formData);
		onClose();
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modal__header}>
					<h2 className={styles.modal__title}>Edytuj materiał</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>
				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Nazwa materiału *</label>
						<input
							type="text"
							className={styles.modal__input}
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							required
						/>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Opis</label>
						<textarea
							className={`${styles.modal__input} ${styles.modal__textarea}`}
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							rows={3}
						/>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>
							Osoba odpowiedzialna *
						</label>
						<select
							className={styles.modal__select}
							value={formData.responsible_id}
							onChange={(e) =>
								setFormData({ ...formData, responsible_id: e.target.value })
							}
							required
						>
							<option value="">Wybierz osobę</option>
							{teamMembers.map((member) => (
								<option key={member.id} value={member.user_id}>
									{member.firstName} {member.lastName}
								</option>
							))}
						</select>
					</div>
					<div className={styles.modal__row}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Termin *</label>
							<input
								type="date"
								className={styles.modal__input}
								value={formData.deadline}
								onChange={(e) =>
									setFormData({ ...formData, deadline: e.target.value })
								}
								required
							/>
						</div>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Priorytet</label>
							<select
								className={styles.modal__select}
								value={formData.priority}
								onChange={(e) =>
									setFormData({
										...formData,
										priority: e.target.value as "low" | "medium" | "high",
									})
								}
							>
								<option value="low">Niski</option>
								<option value="medium">Średni</option>
								<option value="high">Wysoki</option>
							</select>
						</div>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Etap</label>
						<select
							className={styles.modal__select}
							value={formData.stage}
							onChange={(e) =>
								setFormData({
									...formData,
									stage: e.target.value as MaterialStage,
								})
							}
						>
							{Object.entries(STAGE_LABELS).map(([key, label]) => (
								<option key={key} value={key}>
									{label}
								</option>
							))}
						</select>
					</div>
					<div className={styles.modal__actions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={onClose}
						>
							Anuluj
						</button>
						<button type="submit" className={styles.modal__btnSave}>
							Zapisz zmiany
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

interface EditPublicationModalProps {
	isOpen: boolean;
	publication: Publication | null;
	onClose: () => void;
	onSave: (id: string, data: PublicationFormData) => void;
	teamMembers: TeamMember[];
}
interface MaterialsBoardProps {
	materials: Material[];
	canManage?: boolean;
	onAddMaterial?: () => void;
	onEditMaterial?: (material: Material) => void; // ⭐ DODAJ
	onDeleteMaterial?: (id: string) => void; // ⭐ DODAJ
}
function EditPublicationModal({
	isOpen,
	publication,
	onClose,
	onSave,
	teamMembers,
}: EditPublicationModalProps) {
	const [formData, setFormData] = useState<PublicationFormData>({
		title: "",
		platform: "instagram",
		type: "post",
		responsible_id: "",
		due_date: "",
		status: "idea",
		description: "",
	});

	// ⭐ WYPEŁNIJ FORMULARZ DANYMI PUBLIKACJI
	useEffect(() => {
		if (publication) {
			const responsible = teamMembers.find(
				(m) => `${m.firstName} ${m.lastName}` === publication.responsible,
			);
			setFormData({
				title: publication.title,
				platform: publication.platform,
				type: publication.type,
				responsible_id: responsible?.id || "",
				due_date: publication.dueDate,
				status: publication.status,
				description: publication.description || "",
			});
		}
	}, [publication, teamMembers]);

	if (!isOpen || !publication) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.title || !formData.responsible_id || !formData.due_date) {
			toast.error("Wypełnij wszystkie wymagane pola");
			return;
		}
		onSave(publication.id, formData);
		onClose();
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modal__header}>
					<h2 className={styles.modal__title}>Edytuj publikację</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>
				<form onSubmit={handleSubmit} className={styles.modal__form}>
					{/* ⭐ TAKI SAM FORMULARZ JAK W AddPublicationModal */}
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Tytuł *</label>
						<input
							type="text"
							className={styles.modal__input}
							value={formData.title}
							onChange={(e) =>
								setFormData({ ...formData, title: e.target.value })
							}
							required
						/>
					</div>
					<div className={styles.modal__row}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Platforma *</label>
							<select
								className={styles.modal__select}
								value={formData.platform}
								onChange={(e) =>
									setFormData({
										...formData,
										platform: e.target.value as Platform,
									})
								}
								required
							>
								{Object.entries(PLATFORM_LABELS).map(([key, label]) => (
									<option key={key} value={key}>
										{label}
									</option>
								))}
							</select>
						</div>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Typ *</label>
							<select
								className={styles.modal__select}
								value={formData.type}
								onChange={(e) =>
									setFormData({
										...formData,
										type: e.target.value as ContentType,
									})
								}
								required
							>
								{Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
									<option key={key} value={key}>
										{label}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>
							Osoba odpowiedzialna *
						</label>
						<select
							className={styles.modal__select}
							value={formData.responsible_id}
							onChange={(e) =>
								setFormData({ ...formData, responsible_id: e.target.value })
							}
							required
						>
							<option value="">Wybierz osobę</option>
							{teamMembers.map((member) => (
								<option key={member.id} value={member.user_id}>
									{member.firstName} {member.lastName}
								</option>
							))}
						</select>
					</div>
					<div className={styles.modal__row}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Data publikacji *</label>
							<input
								type="date"
								className={styles.modal__input}
								value={formData.due_date}
								onChange={(e) =>
									setFormData({ ...formData, due_date: e.target.value })
								}
								required
							/>
						</div>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Status</label>
							<select
								className={styles.modal__select}
								value={formData.status}
								onChange={(e) =>
									setFormData({
										...formData,
										status: e.target.value as PublicationStatus,
									})
								}
							>
								{Object.entries(STATUS_LABELS).map(([key, label]) => (
									<option key={key} value={key}>
										{label}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Opis</label>
						<textarea
							className={`${styles.modal__input} ${styles.modal__textarea}`}
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							rows={3}
						/>
					</div>
					<div className={styles.modal__actions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={onClose}
						>
							Anuluj
						</button>
						<button type="submit" className={styles.modal__btnSave}>
							Zapisz zmiany
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

// ---------- MODAL EDYCJI ZADANIA ----------
interface EditTaskModalProps {
	isOpen: boolean;
	task: Task | null;
	onClose: () => void;
	onSave: (id: string, data: TaskFormData) => void;
	teamMembers: TeamMember[];
}

function EditTaskModal({
	isOpen,
	task,
	onClose,
	onSave,
	teamMembers,
}: EditTaskModalProps) {
	const [formData, setFormData] = useState<TaskFormData>({
		name: "",
		description: "",
		responsible_id: "",
		deadline: "",
		status: "pending",
	});

	useEffect(() => {
		if (task) {
			const responsible = teamMembers.find(
				(m) => `${m.firstName} ${m.lastName}` === task.responsible,
			);
			setFormData({
				name: task.name,
				description: task.description || "",
				responsible_id: responsible?.id || "",
				deadline: task.deadline,
				status: task.status,
			});
		}
	}, [task, teamMembers]);

	if (!isOpen || !task) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name || !formData.responsible_id || !formData.deadline) {
			toast.error("Wypełnij wszystkie wymagane pola");
			return;
		}
		onSave(task.id, formData);
		onClose();
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modal__header}>
					<h2 className={styles.modal__title}>Edytuj zadanie</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>
				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Nazwa zadania *</label>
						<input
							type="text"
							className={styles.modal__input}
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							required
						/>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>
							Osoba odpowiedzialna *
						</label>
						<select
							className={styles.modal__select}
							value={formData.responsible_id}
							onChange={(e) =>
								setFormData({ ...formData, responsible_id: e.target.value })
							}
							required
						>
							<option value="">Wybierz osobę</option>
							{teamMembers.map((member) => (
								<option key={member.id} value={member.user_id}>
									{member.firstName} {member.lastName}
								</option>
							))}
						</select>
					</div>
					<div className={styles.modal__row}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Termin *</label>
							<input
								type="date"
								className={styles.modal__input}
								value={formData.deadline}
								onChange={(e) =>
									setFormData({ ...formData, deadline: e.target.value })
								}
								required
							/>
						</div>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Status</label>
							<select
								className={styles.modal__select}
								value={formData.status}
								onChange={(e) =>
									setFormData({
										...formData,
										status: e.target.value as TaskStatus,
									})
								}
							>
								{Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
									<option key={key} value={key}>
										{label}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Opis</label>
						<textarea
							className={`${styles.modal__input} ${styles.modal__textarea}`}
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							rows={3}
						/>
					</div>
					<div className={styles.modal__actions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={onClose}
						>
							Anuluj
						</button>
						<button type="submit" className={styles.modal__btnSave}>
							Zapisz zmiany
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

// ---------- MODAL EDYCJI KONTAKTU ----------
interface EditContactModalProps {
	isOpen: boolean;
	contact: MediaContact | null;
	onClose: () => void;
	onSave: (id: string, data: ContactFormData) => void;
	teamMembers: TeamMember[];
}

function EditContactModal({
	isOpen,
	contact,
	onClose,
	onSave,
	teamMembers,
}: EditContactModalProps) {
	const [formData, setFormData] = useState<ContactFormData>({
		name: "",
		channel: "",
		responsible_id: "",
		email: "",
		phone: "",
		notes: "",
	});

	useEffect(() => {
		if (contact) {
			const responsible = teamMembers.find(
				(m) => `${m.firstName} ${m.lastName}` === contact.responsible,
			);
			setFormData({
				name: contact.name,
				channel: contact.channel,
				responsible_id: responsible?.id || "",
				email: contact.email || "",
				phone: contact.phone || "",
				notes: contact.notes || "",
			});
		}
	}, [contact, teamMembers]);

	if (!isOpen || !contact) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name || !formData.channel || !formData.responsible_id) {
			toast.error("Wypełnij wszystkie wymagane pola");
			return;
		}
		onSave(contact.id, formData);
		onClose();
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modal__header}>
					<h2 className={styles.modal__title}>Edytuj kontakt</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>
				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Nazwa kontaktu *</label>
						<input
							type="text"
							className={styles.modal__input}
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							required
						/>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Kanał *</label>
						<input
							type="text"
							className={styles.modal__input}
							value={formData.channel}
							onChange={(e) =>
								setFormData({ ...formData, channel: e.target.value })
							}
							placeholder="np. TVN, Prasa, Radio..."
							required
						/>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>
							Osoba odpowiedzialna *
						</label>
						<select
							className={styles.modal__select}
							value={formData.responsible_id}
							onChange={(e) =>
								setFormData({ ...formData, responsible_id: e.target.value })
							}
							required
						>
							<option value="">Wybierz osobę</option>
							{teamMembers.map((member) => (
								<option key={member.id} value={member.user_id}>
									{member.firstName} {member.lastName}
								</option>
							))}
						</select>
					</div>
					<div className={styles.modal__row}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Email</label>
							<input
								type="email"
								className={styles.modal__input}
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
							/>
						</div>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Telefon</label>
							<input
								type="tel"
								className={styles.modal__input}
								value={formData.phone}
								onChange={(e) =>
									setFormData({ ...formData, phone: e.target.value })
								}
							/>
						</div>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Notatki</label>
						<textarea
							className={`${styles.modal__input} ${styles.modal__textarea}`}
							value={formData.notes}
							onChange={(e) =>
								setFormData({ ...formData, notes: e.target.value })
							}
							rows={3}
						/>
					</div>
					<div className={styles.modal__actions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={onClose}
						>
							Anuluj
						</button>
						<button type="submit" className={styles.modal__btnSave}>
							Zapisz zmiany
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
interface ContentCreator {
	id: string;
	firstName: string;
	lastName: string;
	province: string;
	team: string;
	availability: string;
	experience: "none" | "beginner" | "intermediate" | "advanced";
	topics: string[];
	email: string;
	phone?: string;
	active: boolean;
}

interface Publication {
	id: string;
	title: string;
	platform: Platform;
	type: ContentType;
	responsible: string;
	dueDate: string;
	status: PublicationStatus;
	description?: string;
	createdAt: string;
	updatedAt?: string;
}

interface Material {
	id: string;
	name: string;
	description: string;
	responsible: string;
	deadline: string;
	priority: "low" | "medium" | "high";
	stage: MaterialStage;
	createdAt: string;
}

interface Task {
	id: string;
	name: string;
	responsible: string;
	deadline: string;
	status: TaskStatus;
	description?: string;
	createdAt: string;
}

interface MediaContact {
	id: string;
	name: string;
	channel: string;
	responsible: string;
	email?: string;
	phone?: string;
	notes?: string;
	createdAt: string;
}

// ---------------------------------------------------------------------------
// TYPY DLA FORMULARZY
// ---------------------------------------------------------------------------

interface MemberFormData {
	user_id: string;
	role: SocialRole;
}

interface PublicationFormData {
	title: string;
	platform: Platform;
	type: ContentType;
	responsible_id: string;
	due_date: string;
	status: PublicationStatus;
	description: string;
}

interface TaskFormData {
	name: string;
	description: string;
	responsible_id: string;
	deadline: string;
	status: TaskStatus;
}

interface ContactFormData {
	name: string;
	channel: string;
	responsible_id: string;
	email: string;
	phone: string;
	notes: string;
}

// ---------------------------------------------------------------------------
// INTERFEJSY DLA SEKCJI
// ---------------------------------------------------------------------------

interface TeamSectionProps {
	members: TeamMember[];
	canManage: boolean;
	onAddMember?: () => void;
}

interface PublicationsSectionProps {
	publications: Publication[];
	canManage: boolean;
	onAddPublication?: () => void;
	onEditPublication?: (publication: Publication) => void; // ⭐ DODAJ
	onDeletePublication?: (id: string) => void; // ⭐ DODAJ
}

interface TasksSectionProps {
	tasks: Task[];
	canManage: boolean;
	onAddTask?: () => void;
	onEditTask?: (task: Task) => void; // ⭐ DODAJ
	onDeleteTask?: (id: string) => void; // ⭐ DODAJ
}

interface ContactsSectionProps {
	contacts: MediaContact[];
	canManage: boolean;
	onAddContact?: () => void;
	onEditContact?: (contact: MediaContact) => void; // ⭐ DODAJ
	onDeleteContact?: (id: string) => void; // ⭐ DODAJ
}

// ---------------------------------------------------------------------------
// MAPOWANIA
// ---------------------------------------------------------------------------

const ROLE_ICONS: Record<SocialRole, React.ReactNode> = {
	instagram: <FaInstagram size={16} />,
	tiktok: <FaTiktok size={16} />,
	manager: <Users size={16} />,
	graphic: <ImageIcon size={16} />,
	editor: <VideoIcon size={16} />,
	photographer: <Camera size={16} />,
	content_creator: <FileText size={16} />,
};

const ROLE_LABELS: Record<SocialRole, string> = {
	instagram: "Opiekun Instagrama",
	tiktok: "Opiekun TikToka",
	manager: "Social Media Manager",
	graphic: "Grafik",
	editor: "Montażysta",
	photographer: "Fotograf",
	content_creator: "Twórca treści",
};

const PLATFORM_LABELS: Record<Platform, string> = {
	instagram: "Instagram",
	tiktok: "TikTok",
	facebook: "Facebook",
	youtube: "YouTube",
};

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
	instagram: <FaInstagram size={14} />,
	tiktok: <FaTiktok size={14} />,
	facebook: <FaFacebook size={14} />,
	youtube: <FaYoutube size={14} />,
};

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
	reel: "Rolka",
	post: "Post",
	story: "Relacja",
	graphic: "Grafika",
	video: "Film",
};

const STATUS_LABELS: Record<PublicationStatus, string> = {
	idea: "Pomysł",
	preparation: "W przygotowaniu",
	editing: "W trakcie montażu",
	approval: "Do akceptacji",
	scheduled: "Zaplanowane",
	published: "Opublikowane",
};

const STATUS_COLORS: Record<PublicationStatus, string> = {
	idea: "statusIdea",
	preparation: "statusPreparation",
	editing: "statusEditing",
	approval: "statusApproval",
	scheduled: "statusScheduled",
	published: "statusPublished",
};

const STAGE_LABELS: Record<MaterialStage, string> = {
	ideas: "Pomysły",
	recording: "Nagrywanie",
	editing: "Montaż",
	approval: "Akceptacja",
	ready: "Gotowe",
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
	pending: "Do zrobienia",
	in_progress: "W trakcie",
	done: "Zakończone",
};

// ============================================================
// MODALE
// ============================================================

// ---------- MODAL DODAWANIA CZŁONKA ----------
// ---------- MODAL DODAWANIA CZŁONKA ----------
// ---------- MODAL DODAWANIA CZŁONKA ----------
// ---------- MODAL DODAWANIA CZŁONKA ----------
interface AddMemberModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: MemberFormData) => void;
	availableUsers: any[];
}

function AddCreatorModal({
	isOpen,
	onClose,
	onSave,
	availableUsers, // ⭐ TERAZ availableUsers zamiast teamMembers
}: AddCreatorModalProps) {
	const [formData, setFormData] = useState<CreatorFormData>({
		user_id: "",
		availability: "",
		experience: "beginner",
		// topics: [],
	});
	// const [topicInput, setTopicInput] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// ⭐ FILTRUJ UŻYTKOWNIKÓW (pomiń adminów)
	const filteredUsers = useMemo(() => {
		const users = availableUsers.filter((user) => user.role !== "admin");

		if (!searchTerm.trim()) return users;
		const term = searchTerm.toLowerCase();
		return users.filter(
			(user) =>
				(user.name || "").toLowerCase().includes(term) ||
				(user.email || "").toLowerCase().includes(term)
		);
	}, [availableUsers, searchTerm]);

	const selectedUser = availableUsers.find((u) => u.id === formData.user_id);
	const inputValue = selectedUser
		? `${selectedUser.name} (${selectedUser.email})`
		: searchTerm;

	// Zamknij dropdown po kliknięciu poza
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.user_id) {
			toast.error("Wybierz użytkownika");
			return;
		}
		if (!formData.availability) {
			toast.error("Podaj dostępność");
			return;
		}
		onSave(formData);
		onClose();
	};

	const handleSelectUser = (userId: string) => {
		setFormData({ ...formData, user_id: userId });
		setSearchTerm("");
		setIsDropdownOpen(false);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchTerm(value);
		setIsDropdownOpen(true);
		if (formData.user_id) {
			setFormData({ ...formData, user_id: "" });
		}
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modal__header}>
					<h2 className={styles.modal__title}>Dodaj twórcę rolek</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>
				<form onSubmit={handleSubmit} className={styles.modal__form}>
					{/* Wybór użytkownika */}
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Użytkownik *</label>
						<div className={styles.searchableSelect} ref={dropdownRef}>
							<div className={styles.searchableSelect__inputWrapper}>
								<input
									type="text"
									className={styles.searchableSelect__input}
									placeholder="Szukaj użytkownika..."
									value={inputValue}
									onChange={handleInputChange}
									onFocus={() => {
										if (!formData.user_id) {
											setIsDropdownOpen(true);
										}
									}}
								/>
								{selectedUser && (
									<button
										type="button"
										className={styles.searchableSelect__clear}
										onClick={() => {
											setFormData({ ...formData, user_id: "" });
											setSearchTerm("");
										}}
										title="Wyczyść wybór"
									>
										<X size={14} />
									</button>
								)}
							</div>
							{isDropdownOpen && !selectedUser && (
								<div className={styles.searchableSelect__dropdown}>
									{filteredUsers.length === 0 ? (
										<div className={styles.searchableSelect__empty}>
											{searchTerm
												? "Nie znaleziono użytkownika"
												: "Wpisz aby wyszukać"}
										</div>
									) : (
										filteredUsers.map((user) => {
											const displayText = user.name
												? `${user.name} (${user.email})`
												: user.email;

											return (
												<div
													key={user.id}
													className={`${styles.searchableSelect__item} ${formData.user_id === user.id
														? styles.searchableSelect__itemSelected
														: ""
														}`}
													onClick={() => handleSelectUser(user.id)}
												>
													<span className={styles.searchableSelect__itemName}>
														{displayText}
													</span>
													{user.role && (
														<span className={styles.searchableSelect__itemRole}>
															{user.role}
														</span>
													)}
												</div>
											);
										})
									)}
								</div>
							)}
						</div>
					</div>

					{/* Dostępność */}
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Dostępność *</label>
						<input
							type="text"
							className={styles.modal__input}
							placeholder="np. Codziennie, Weekendy, Pon-Pt..."
							value={formData.availability}
							onChange={(e) =>
								setFormData({ ...formData, availability: e.target.value })
							}
							required
						/>
					</div>

					{/* Doświadczenie */}
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Doświadczenie</label>
						<select
							className={styles.modal__select}
							value={formData.experience}
							onChange={(e) =>
								setFormData({
									...formData,
									experience: e.target.value as "none" | "beginner" | "intermediate" | "advanced",
								})
							}
						>
							<option value="none">Brak</option>
							<option value="beginner">Początkujący</option>
							<option value="intermediate">Średniozaawansowany</option>
							<option value="advanced">Zaawansowany</option>
						</select>
					</div>

					<div className={styles.modal__actions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={onClose}
						>
							Anuluj
						</button>
						<button type="submit" className={styles.modal__btnSave}>
							Dodaj twórcę
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
function AddMemberModal({
	isOpen,
	onClose,
	onSave,
	availableUsers,
}: AddMemberModalProps) {
	const [formData, setFormData] = useState<MemberFormData>({
		user_id: "",
		role: "content_creator",
	});
	const [searchTerm, setSearchTerm] = useState("");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// ⭐ FILTRUJ UŻYTKOWNIKÓW PO SZUKANIU
	const filteredUsers = useMemo(() => {
		if (!searchTerm.trim()) return availableUsers;

		const term = searchTerm.toLowerCase();
		return availableUsers.filter(
			(user) =>
				(user.name || "").toLowerCase().includes(term) ||
				(user.email || "").toLowerCase().includes(term),
		);
	}, [availableUsers, searchTerm]);

	// ⭐ ZNAJDŹ WYBRANEGO UŻYTKOWNIKA
	const selectedUser = availableUsers.find((u) => u.id === formData.user_id);

	// ⭐ WARTOŚĆ DO WYŚWIETLENIA W POLU - jeśli wybrany, pokaż jego nazwę
	const inputValue = selectedUser
		? `${selectedUser.name} (${selectedUser.email})`
		: searchTerm;

	// ⭐ ZAMKNIJ DROPDOWN PO KLIKNIĘCIU POZA
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.user_id) {
			toast.error("Wybierz użytkownika");
			return;
		}
		onSave(formData);
		onClose();
	};

	const handleSelectUser = (userId: string) => {
		setFormData({ ...formData, user_id: userId });
		setSearchTerm(""); // ⭐ Czyścimy searchTerm
		setIsDropdownOpen(false);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchTerm(value);
		setIsDropdownOpen(true);

		// ⭐ Jeśli użytkownik zaczyna pisać, odznacz wybranego użytkownika
		if (formData.user_id) {
			setFormData({ ...formData, user_id: "" });
		}
	};

	const handleClearSelection = () => {
		setFormData({ ...formData, user_id: "" });
		setSearchTerm("");
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modal__header}>
					<h2 className={styles.modal__title}>Dodaj członka zespołu</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>
				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Użytkownik *</label>
						<div className={styles.searchableSelect} ref={dropdownRef}>
							<div className={styles.searchableSelect__inputWrapper}>
								<input
									type="text"
									className={styles.searchableSelect__input}
									placeholder="Szukaj użytkownika..."
									value={inputValue} // ⭐ UŻYJ inputValue
									onChange={handleInputChange} // ⭐ UŻYJ handleInputChange
									onFocus={() => {
										// ⭐ Jeśli nie ma wybranego użytkownika, otwórz dropdown
										if (!formData.user_id) {
											setIsDropdownOpen(true);
										}
									}}
								/>
								{selectedUser && (
									<button
										type="button"
										className={styles.searchableSelect__clear}
										onClick={handleClearSelection} // ⭐ UŻYJ handleClearSelection
										title="Wyczyść wybór"
									>
										<X size={14} />
									</button>
								)}
							</div>

							{/* ⭐ LISTA ROZWIJANA - pokaż tylko jeśli nie ma wybranego użytkownika */}
							{isDropdownOpen && !selectedUser && (
								<div className={styles.searchableSelect__dropdown}>
									{filteredUsers.length === 0 ? (
										<div className={styles.searchableSelect__empty}>
											{searchTerm
												? "Nie znaleziono użytkownika"
												: "Wpisz aby wyszukać"}
										</div>
									) : (
										filteredUsers.map((user) => {
											const displayText = user.name
												? `${user.name} (${user.email})`
												: user.email;

											return (
												<div
													key={user.id}
													className={`${styles.searchableSelect__item} ${formData.user_id === user.id
														? styles.searchableSelect__itemSelected
														: ""
														}`}
													onClick={() => handleSelectUser(user.id)}
												>
													<span className={styles.searchableSelect__itemName}>
														{displayText}
													</span>
												</div>
											);
										})
									)}
								</div>
							)}
						</div>
					</div>

					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Rola *</label>
						<select
							className={styles.modal__select}
							value={formData.role}
							onChange={(e) =>
								setFormData({ ...formData, role: e.target.value as SocialRole })
							}
							required
						>
							{Object.entries(ROLE_LABELS).map(([key, label]) => (
								<option key={key} value={key}>
									{label}
								</option>
							))}
						</select>
					</div>

					<div className={styles.modal__actions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={onClose}
						>
							Anuluj
						</button>
						<button type="submit" className={styles.modal__btnSave}>
							Dodaj członka
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
// ---------- MODAL DODAWANIA PUBLIKACJI ----------
interface AddPublicationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: PublicationFormData) => void;
	teamMembers: TeamMember[];
}

function AddPublicationModal({
	isOpen,
	onClose,
	onSave,
	teamMembers,
}: AddPublicationModalProps) {
	const [formData, setFormData] = useState<PublicationFormData>({
		title: "",
		platform: "instagram",
		type: "post",
		responsible_id: "",
		due_date: "",
		status: "idea",
		description: "",
	});

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.title || !formData.responsible_id || !formData.due_date) {
			toast.error("Wypełnij wszystkie wymagane pola");
			return;
		}
		onSave(formData);
		onClose();
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modal__header}>
					<h2 className={styles.modal__title}>Dodaj publikację</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>
				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Tytuł *</label>
						<input
							type="text"
							className={styles.modal__input}
							value={formData.title}
							onChange={(e) =>
								setFormData({ ...formData, title: e.target.value })
							}
							required
						/>
					</div>
					<div className={styles.modal__row}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Platforma *</label>
							<select
								className={styles.modal__select}
								value={formData.platform}
								onChange={(e) =>
									setFormData({
										...formData,
										platform: e.target.value as Platform,
									})
								}
								required
							>
								{Object.entries(PLATFORM_LABELS).map(([key, label]) => (
									<option key={key} value={key}>
										{label}
									</option>
								))}
							</select>
						</div>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Typ *</label>
							<select
								className={styles.modal__select}
								value={formData.type}
								onChange={(e) =>
									setFormData({
										...formData,
										type: e.target.value as ContentType,
									})
								}
								required
							>
								{Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
									<option key={key} value={key}>
										{label}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>
							Osoba odpowiedzialna *
						</label>
						<select
							className={styles.modal__select}
							value={formData.responsible_id}
							onChange={(e) =>
								setFormData({ ...formData, responsible_id: e.target.value })
							}
							required
						>
							<option value="">Wybierz osobę</option>
							{teamMembers.map((member) => (
								<option key={member.id} value={member.user_id}>
									{member.firstName} {member.lastName}
								</option>
							))}
						</select>
					</div>
					<div className={styles.modal__row}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Data publikacji *</label>
							<input
								type="date"
								className={styles.modal__input}
								value={formData.due_date}
								onChange={(e) =>
									setFormData({ ...formData, due_date: e.target.value })
								}
								required
							/>
						</div>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Status</label>
							<select
								className={styles.modal__select}
								value={formData.status}
								onChange={(e) =>
									setFormData({
										...formData,
										status: e.target.value as PublicationStatus,
									})
								}
							>
								{Object.entries(STATUS_LABELS).map(([key, label]) => (
									<option key={key} value={key}>
										{label}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Opis</label>
						<textarea
							className={`${styles.modal__input} ${styles.modal__textarea}`}
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							rows={3}
						/>
					</div>
					<div className={styles.modal__actions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={onClose}
						>
							Anuluj
						</button>
						<button type="submit" className={styles.modal__btnSave}>
							Dodaj publikację
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

// ---------- MODAL DODAWANIA ZADANIA ----------
interface AddTaskModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: TaskFormData) => void;
	teamMembers: TeamMember[];
}

function AddTaskModal({
	isOpen,
	onClose,
	onSave,
	teamMembers,
}: AddTaskModalProps) {
	const [formData, setFormData] = useState<TaskFormData>({
		name: "",
		description: "",
		responsible_id: "",
		deadline: "",
		status: "pending",
	});

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name || !formData.responsible_id || !formData.deadline) {
			toast.error("Wypełnij wszystkie wymagane pola");
			return;
		}
		onSave(formData);
		onClose();
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modal__header}>
					<h2 className={styles.modal__title}>Dodaj zadanie</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>
				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Nazwa zadania *</label>
						<input
							type="text"
							className={styles.modal__input}
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							required
						/>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>
							Osoba odpowiedzialna *
						</label>
						<select
							className={styles.modal__select}
							value={formData.responsible_id}
							onChange={(e) =>
								setFormData({ ...formData, responsible_id: e.target.value })
							}
							required
						>
							<option value="">Wybierz osobę</option>
							{teamMembers.map((member) => (
								<option key={member.id} value={member.user_id}>
									{member.firstName} {member.lastName}
								</option>
							))}
						</select>
					</div>
					<div className={styles.modal__row}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Termin *</label>
							<input
								type="date"
								className={styles.modal__input}
								value={formData.deadline}
								onChange={(e) =>
									setFormData({ ...formData, deadline: e.target.value })
								}
								required
							/>
						</div>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Status</label>
							<select
								className={styles.modal__select}
								value={formData.status}
								onChange={(e) =>
									setFormData({
										...formData,
										status: e.target.value as TaskStatus,
									})
								}
							>
								{Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
									<option key={key} value={key}>
										{label}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Opis</label>
						<textarea
							className={`${styles.modal__input} ${styles.modal__textarea}`}
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							rows={3}
						/>
					</div>
					<div className={styles.modal__actions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={onClose}
						>
							Anuluj
						</button>
						<button type="submit" className={styles.modal__btnSave}>
							Dodaj zadanie
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

// ---------- MODAL DODAWANIA KONTAKTU ----------
interface AddContactModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: ContactFormData) => void;
	teamMembers: TeamMember[];
}

function AddContactModal({
	isOpen,
	onClose,
	onSave,
	teamMembers,
}: AddContactModalProps) {
	const [formData, setFormData] = useState<ContactFormData>({
		name: "",
		channel: "",
		responsible_id: "",
		email: "",
		phone: "",
		notes: "",
	});

	if (!isOpen) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name || !formData.channel || !formData.responsible_id) {
			toast.error("Wypełnij wszystkie wymagane pola");
			return;
		}
		onSave(formData);
		onClose();
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modal__header}>
					<h2 className={styles.modal__title}>Dodaj kontakt</h2>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>
				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Nazwa kontaktu *</label>
						<input
							type="text"
							className={styles.modal__input}
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							required
						/>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Kanał *</label>
						<input
							type="text"
							className={styles.modal__input}
							value={formData.channel}
							onChange={(e) =>
								setFormData({ ...formData, channel: e.target.value })
							}
							placeholder="np. TVN, Prasa, Radio..."
							required
						/>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>
							Osoba odpowiedzialna *
						</label>
						<select
							className={styles.modal__select}
							value={formData.responsible_id}
							onChange={(e) =>
								setFormData({ ...formData, responsible_id: e.target.value })
							}
							required
						>
							<option value="">Wybierz osobę</option>
							{teamMembers.map((member) => (
								<option key={member.id} value={member.user_id}>
									{member.firstName} {member.lastName}
								</option>
							))}
						</select>
					</div>
					<div className={styles.modal__row}>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Email</label>
							<input
								type="email"
								className={styles.modal__input}
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
							/>
						</div>
						<div className={styles.modal__field}>
							<label className={styles.modal__label}>Telefon</label>
							<input
								type="tel"
								className={styles.modal__input}
								value={formData.phone}
								onChange={(e) =>
									setFormData({ ...formData, phone: e.target.value })
								}
							/>
						</div>
					</div>
					<div className={styles.modal__field}>
						<label className={styles.modal__label}>Notatki</label>
						<textarea
							className={`${styles.modal__input} ${styles.modal__textarea}`}
							value={formData.notes}
							onChange={(e) =>
								setFormData({ ...formData, notes: e.target.value })
							}
							rows={3}
						/>
					</div>
					<div className={styles.modal__actions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={onClose}
						>
							Anuluj
						</button>
						<button type="submit" className={styles.modal__btnSave}>
							Dodaj kontakt
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

// ============================================================
// SEKCJE
// ============================================================

// ---------- SEKCJA ZESPOŁU ----------
function TeamSection({ members, canManage, onAddMember }: TeamSectionProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedRole, setSelectedRole] = useState<SocialRole | "all">("all");
	const [editingPublication, setEditingPublication] =
		useState<Publication | null>(null);
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const [editingContact, setEditingContact] = useState<MediaContact | null>(
		null,
	);

	const [isEditPublicationModalOpen, setIsEditPublicationModalOpen] =
		useState(false);
	const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
	const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false);
	const filteredMembers = useMemo(() => {
		return members.filter((member) => {
			const matchesSearch =
				member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
				member.province.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesRole =
				selectedRole === "all" || member.role === selectedRole;
			return matchesSearch && matchesRole;
		});
	}, [members, searchTerm, selectedRole]);

	return (
		<section className={styles.section}>
			<div className={styles.section__header}>
				<div className={styles.section__headerLeft}>
					<h2 className={styles.section__title}>Zespół Social Media</h2>
					<p className={styles.section__subtitle}>
						Osoby odpowiedzialne za prowadzenie kanałów organizacji.
					</p>
				</div>
				{canManage && (
					<button className={styles.section__addBtn} onClick={onAddMember}>
						<Plus size={18} />
						Dodaj członka
					</button>
				)}
			</div>
			<div className={styles.section__filters}>
				<div className={styles.section__search}>
					<Search size={18} className={styles.section__searchIcon} />
					<input
						type="text"
						className={styles.section__searchInput}
						placeholder="Szukaj po imieniu, nazwisku, województwie..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				<select
					className={styles.section__select}
					value={selectedRole}
					onChange={(e) =>
						setSelectedRole(e.target.value as SocialRole | "all")
					}
				>
					<option value="all">Wszystkie role</option>
					{Object.entries(ROLE_LABELS).map(([key, label]) => (
						<option key={key} value={key}>
							{label}
						</option>
					))}
				</select>
			</div>
			<div className={styles.teamGrid}>
				{filteredMembers.map((member) => (
					<div key={member.id} className={styles.teamCard}>
						<div className={styles.teamCard__avatar}>
							{member.avatar || member.firstName[0] + member.lastName[0]}
						</div>
						<div className={styles.teamCard__info}>
							<h3 className={styles.teamCard__name}>
								{member.firstName} {member.lastName}
							</h3>
							<div className={styles.teamCard__role}>
								{ROLE_ICONS[member.role]}
								{ROLE_LABELS[member.role]}
							</div>
							<div className={styles.teamCard__details}>
								{member.province && (
									<span>
										<MapPin size={14} />
										{member.province}
									</span>
								)}
								{member.team && (
									<span>
										<Briefcase size={14} />
										{member.team}
									</span>
								)}
							</div>
							<div className={styles.teamCard__contact}>
								<a
									href={`mailto:${member.email}`}
									className={styles.teamCard__link}
									title={member.email}
								>
									<Mail size={14} />
									<span className={styles.teamCard__email}>{member.email}</span>
								</a>

								{member.phone && (
									<a
										href={`tel:${member.phone}`}
										className={styles.teamCard__link}
										title={member.phone}
									>
										<Phone size={14} />
										<span className={styles.teamCard__phone}>
											{member.phone}
										</span>
									</a>
								)}
							</div>
						</div>
						<div className={styles.teamCard__status}>
							<span
								className={
									member.status === 'vacation'
										? styles.statusVacation
										: styles.statusActive  // lub brak klasy dla domyślnego stylu
								}
							>
								{member.status === 'vacation' ? 'Urlop' : 'Aktywny'}
							</span>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

// ---------- SEKCJA TWÓRCÓW ROLEK ----------
function CreatorsSection({ creators, canManage, onAddCreator }: CreatorsSectionProps) {
	const [searchTerm, setSearchTerm] = useState("");

	const filteredCreators = useMemo(() => {
		return creators.filter((c) =>
			(c.firstName + " " + c.lastName)
				.toLowerCase()
				.includes(searchTerm.toLowerCase()),
		);
	}, [creators, searchTerm]);

	return (
		<section className={styles.section}>
			<div className={styles.section__header}>
				<div className={styles.section__headerLeft}>
					<h2 className={styles.section__title}>Twórcy rolek</h2>
					<p className={styles.section__subtitle}>
						Osoby, które chcą regularnie nagrywać materiały wideo.
					</p>
				</div>
				{/* ⭐ DODAJ PRZYCISK */}
				{canManage && (
					<button className={styles.section__addBtn} onClick={onAddCreator}>
						<Plus size={18} />
						Dodaj twórcę
					</button>
				)}
			</div>
			<div className={styles.section__filters}>
				<div className={styles.section__search}>
					<Search size={18} className={styles.section__searchIcon} />
					<input
						type="text"
						className={styles.section__searchInput}
						placeholder="Szukaj po imieniu, nazwisku..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>
			<div className={styles.creatorsGrid}>
				{filteredCreators.map((creator) => (
					<div key={creator.id} className={styles.creatorCard}>
						<div className={styles.creatorCard__avatar}>
							{creator.firstName[0] + creator.lastName[0]}
						</div>
						<div className={styles.creatorCard__info}>
							<h3 className={styles.creatorCard__name}>
								{creator.firstName} {creator.lastName}
							</h3>
							<div className={styles.creatorCard__details}>
								{creator.province && (
									<span>
										<MapPin size={14} />
										{creator.province}
									</span>
								)}
								{creator.team && (
									<span>
										<Briefcase size={14} />
										{creator.team}
									</span>
								)}
							</div>
							<div className={styles.creatorCard__availability}>
								<Clock size={14} />
								{creator.availability}
							</div>
							<div className={styles.creatorCard__experience}>
								<Star size={14} />
								Doświadczenie: {creator.experience === "none" && "Brak"}
								{creator.experience === "beginner" && "Początkujący"}
								{creator.experience === "intermediate" && "Średniozaawansowany"}
								{creator.experience === "advanced" && "Zaawansowany"}
							</div>

						</div>
					</div>
				))}
			</div>
		</section>
	);
}

// ---------- SEKCJA PUBLIKACJI ----------
// ---------- SEKCJA PUBLIKACJI ----------
function PublicationsSection({
	publications,
	canManage,
	onAddPublication,
	onEditPublication,
	onDeletePublication,
}: PublicationsSectionProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedStatus, setSelectedStatus] = useState<
		PublicationStatus | "all"
	>("all");
	const [selectedPlatform, setSelectedPlatform] = useState<Platform | "all">(
		"all",
	);

	const filteredPublications = useMemo(() => {
		return publications.filter((p) => {
			const matchesSearch = p.title
				.toLowerCase()
				.includes(searchTerm.toLowerCase());
			const matchesStatus =
				selectedStatus === "all" || p.status === selectedStatus;
			const matchesPlatform =
				selectedPlatform === "all" || p.platform === selectedPlatform;
			return matchesSearch && matchesStatus && matchesPlatform;
		});
	}, [publications, searchTerm, selectedStatus, selectedPlatform]);

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString("pl-PL", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<section className={styles.section}>
			<div className={styles.section__header}>
				<div className={styles.section__headerLeft}>
					<h2 className={styles.section__title}>Planowanie publikacji</h2>
					<p className={styles.section__subtitle}>
						Organizacja przyszłych publikacji w mediach społecznościowych.
					</p>
				</div>
				{canManage && (
					<button className={styles.section__addBtn} onClick={onAddPublication}>
						<Plus size={18} />
						Dodaj publikację
					</button>
				)}
			</div>
			<div className={styles.section__filters}>
				<div className={styles.section__search}>
					<Search size={18} className={styles.section__searchIcon} />
					<input
						type="text"
						className={styles.section__searchInput}
						placeholder="Szukaj po tytule..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				<select
					className={styles.section__select}
					value={selectedStatus}
					onChange={(e) =>
						setSelectedStatus(e.target.value as PublicationStatus | "all")
					}
				>
					<option value="all">Wszystkie statusy</option>
					{Object.entries(STATUS_LABELS).map(([key, label]) => (
						<option key={key} value={key}>
							{label}
						</option>
					))}
				</select>
				<select
					className={styles.section__select}
					value={selectedPlatform}
					onChange={(e) =>
						setSelectedPlatform(e.target.value as Platform | "all")
					}
				>
					<option value="all">Wszystkie platformy</option>
					{Object.entries(PLATFORM_LABELS).map(([key, label]) => (
						<option key={key} value={key}>
							{label}
						</option>
					))}
				</select>
			</div>
			<div className={styles.publicationsGrid}>
				{filteredPublications.map((pub) => (
					<div key={pub.id} className={styles.publicationCard}>
						<div className={styles.publicationCard__header}>
							<h3 className={styles.publicationCard__title}>{pub.title}</h3>
							<div className={styles.publicationCard__actions}>
								<span
									className={`${styles.publicationCard__status} ${styles[STATUS_COLORS[pub.status]]}`}
								>
									{STATUS_LABELS[pub.status]}
								</span>
								{canManage && (
									<>
										<button
											className={styles.publicationCard__editBtn}
											onClick={() => onEditPublication?.(pub)}
											title="Edytuj"
										>
											<Edit size={14} />
										</button>
										<button
											className={styles.publicationCard__deleteBtn}
											onClick={() => onDeletePublication?.(pub.id)}
											title="Usuń"
										>
											<Trash2 size={14} />
										</button>
									</>
								)}
							</div>
						</div>
						<div className={styles.publicationCard__body}>
							<div className={styles.publicationCard__meta}>
								<span>
									{PLATFORM_ICONS[pub.platform]}
									{PLATFORM_LABELS[pub.platform]}
								</span>
								<span>
									<Tag size={14} />
									{CONTENT_TYPE_LABELS[pub.type]}
								</span>
								<span>
									<User size={14} />
									{pub.responsible}
								</span>
								<span>
									<Calendar size={14} />
									{formatDate(pub.dueDate)}
								</span>
							</div>
							{pub.description && (
								<p className={styles.publicationCard__description}>
									{pub.description}
								</p>
							)}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

// ---------- SEKCJA MATERIAŁÓW ----------
// ---------- SEKCJA MATERIAŁÓW ----------
function MaterialsBoard({
	materials,
	canManage = false,
	onAddMaterial,
	onEditMaterial, // ⭐ DODAJ
	onDeleteMaterial, // ⭐ DODAJ
}: MaterialsBoardProps) {
	const stages: MaterialStage[] = [
		"ideas",
		"recording",
		"editing",
		"approval",
		"ready",
	];

	const getMaterialsByStage = (stage: MaterialStage) => {
		return materials.filter((m) => m.stage === stage);
	};
	// Funkcja do wyświetlania etykiety statusu
	const getStatusLabel = (status: string): string => {
		if (status === 'vacation') {
			return 'Urlop';
		}
		// Dla 'active', 'trial', 'mentor' - wszystkie pokazują "Aktywny"
		return 'Aktywny';
	};

	// Funkcja do określania klasy CSS
	const getStatusClass = (status: string): string => {
		if (status === 'vacation') {
			return styles.statusVacation; // Możesz dodać osobny styl dla urlopu
		}
		return styles.statusActive; // Dla wszystkich aktywnych
	};
	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high":
				return styles.priorityHigh;
			case "medium":
				return styles.priorityMedium;
			case "low":
				return styles.priorityLow;
			default:
				return "";
		}
	};

	return (
		<section className={styles.section}>
			<div className={styles.section__header}>
				<div className={styles.section__headerLeft}>
					<h2 className={styles.section__title}>Tablica materiałów</h2>
					<p className={styles.section__subtitle}>
						Organizacja pracy zespołu - etapy realizacji materiałów.
					</p>
				</div>
				{canManage && (
					<button className={styles.section__addBtn} onClick={onAddMaterial}>
						<Plus size={18} />
						Dodaj materiał
					</button>
				)}
			</div>
			<div className={styles.board}>
				{stages.map((stage) => (
					<div key={stage} className={styles.board__column}>
						<div className={styles.board__columnHeader}>
							<h3 className={styles.board__columnTitle}>
								{STAGE_LABELS[stage]}
							</h3>
							<span className={styles.board__columnCount}>
								{getMaterialsByStage(stage).length}
							</span>
						</div>
						<div className={styles.board__columnBody}>
							{getMaterialsByStage(stage).map((material) => (
								<div key={material.id} className={styles.board__card}>
									<div className={styles.board__cardHeader}>
										<h4 className={styles.board__cardTitle}>{material.name}</h4>
										{canManage && (
											<div className={styles.board__cardActions}>
												<button
													className={styles.board__cardEditBtn}
													onClick={() => onEditMaterial?.(material)}
													title="Edytuj"
												>
													<Edit size={14} />
												</button>
												<button
													className={styles.board__cardDeleteBtn}
													onClick={() => onDeleteMaterial?.(material.id)}
													title="Usuń"
												>
													<Trash2 size={14} />
												</button>
											</div>
										)}
									</div>
									<p className={styles.board__cardDescription}>
										{material.description}
									</p>
									<div className={styles.board__cardMeta}>
										<span>
											<User size={12} />
											{material.responsible}
										</span>
										<span>
											<Calendar size={12} />
											{new Date(material.deadline).toLocaleDateString("pl-PL", {
												day: '2-digit',
												month: '2-digit',
												year: 'numeric'
											})}
										</span>
									</div>
									<span
										className={`${styles.board__cardPriority} ${getPriorityColor(material.priority)}`}
									>
										{material.priority === "high" && "Wysoki"}
										{material.priority === "medium" && "Średni"}
										{material.priority === "low" && "Niski"}
									</span>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

// ---------- SEKCJA ZADAŃ ----------
function TasksSection({
	tasks,
	canManage,
	onAddTask,
	onEditTask,
	onDeleteTask,
}: TasksSectionProps & {
	onEditTask?: (task: Task) => void;
	onDeleteTask?: (id: string) => void;
}) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedStatus, setSelectedStatus] = useState<TaskStatus | "all">(
		"all",
	);

	const filteredTasks = useMemo(() => {
		return tasks.filter((t) => {
			const matchesSearch = t.name
				.toLowerCase()
				.includes(searchTerm.toLowerCase());
			const matchesStatus =
				selectedStatus === "all" || t.status === selectedStatus;
			return matchesSearch && matchesStatus;
		});
	}, [tasks, searchTerm, selectedStatus]);

	return (
		<section className={styles.section}>
			<div className={styles.section__header}>
				<div className={styles.section__headerLeft}>
					<h2 className={styles.section__title}>Zadania zespołu</h2>
					<p className={styles.section__subtitle}>
						Lista aktualnych zadań dla osób zajmujących się social mediami.
					</p>
				</div>
				{canManage && (
					<button className={styles.section__addBtn} onClick={onAddTask}>
						<Plus size={18} />
						Dodaj zadanie
					</button>
				)}
			</div>
			<div className={styles.section__filters}>
				<div className={styles.section__search}>
					<Search size={18} className={styles.section__searchIcon} />
					<input
						type="text"
						className={styles.section__searchInput}
						placeholder="Szukaj po nazwie..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				<select
					className={styles.section__select}
					value={selectedStatus}
					onChange={(e) =>
						setSelectedStatus(e.target.value as TaskStatus | "all")
					}
				>
					<option value="all">Wszystkie statusy</option>
					{Object.entries(TASK_STATUS_LABELS).map(([key, label]) => (
						<option key={key} value={key}>
							{label}
						</option>
					))}
				</select>
			</div>
			<div className={styles.tasksGrid}>
				{filteredTasks.map((task) => (
					<div key={task.id} className={styles.taskCard}>
						<div className={styles.taskCard__header}>
							<h3 className={styles.taskCard__title}>{task.name}</h3>
							<div className={styles.taskCard__actions}>
								<span
									className={`${styles.taskCard__status} ${task.status === "done"
										? styles.taskStatusDone
										: task.status === "in_progress"
											? styles.taskStatusInProgress
											: styles.taskStatusPending
										}`}
								>
									{TASK_STATUS_LABELS[task.status]}
								</span>
								{canManage && (
									<>
										<button
											className={styles.taskCard__editBtn}
											onClick={() => onEditTask?.(task)}
											title="Edytuj"
										>
											<Edit size={14} />
										</button>
										<button
											className={styles.taskCard__deleteBtn}
											onClick={() => onDeleteTask?.(task.id)}
											title="Usuń"
										>
											<Trash2 size={14} />
										</button>
									</>
								)}
							</div>
						</div>
						<div className={styles.taskCard__body}>
							<div className={styles.taskCard__meta}>
								<span>
									<User size={14} />
									{task.responsible}
								</span>
								<span>
									<Calendar size={14} />
									{new Date(task.deadline).toLocaleDateString("pl-PL")}
								</span>
							</div>
							{task.description && (
								<p className={styles.taskCard__description}>
									{task.description}
								</p>
							)}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

// ---------- SEKCJA KONTAKTÓW ----------
function ContactsSection({
	contacts,
	canManage,
	onAddContact,
	onEditContact, // ⭐ DODAJ
	onDeleteContact, // ⭐ DODAJ
}: ContactsSectionProps) {
	return (
		<section className={styles.section}>
			<div className={styles.section__header}>
				<div className={styles.section__headerLeft}>
					<h2 className={styles.section__title}>Współprace i kontakty</h2>
					<p className={styles.section__subtitle}>
						Osoby odpowiedzialne za kontakty medialne.
					</p>
				</div>
				{canManage && (
					<button className={styles.section__addBtn} onClick={onAddContact}>
						<Plus size={18} />
						Dodaj kontakt
					</button>
				)}
			</div>
			<div className={styles.contactsGrid}>
				{contacts.map((contact) => (
					<div key={contact.id} className={styles.contactCard}>
						<div className={styles.contactCard__header}>
							<h3 className={styles.contactCard__name}>{contact.name}</h3>
							<div className={styles.contactCard__actions}>
								<span className={styles.contactCard__channel}>
									{contact.channel}
								</span>
								{canManage && (
									<>
										<button
											className={styles.contactCard__editBtn}
											onClick={() => onEditContact?.(contact)}
											title="Edytuj"
										>
											<Edit size={14} />
										</button>
										<button
											className={styles.contactCard__deleteBtn}
											onClick={() => onDeleteContact?.(contact.id)}
											title="Usuń"
										>
											<Trash2 size={14} />
										</button>
									</>
								)}
							</div>
						</div>
						<div className={styles.contactCard__body}>
							<div className={styles.contactCard__responsible}>
								<User size={14} />
								Osoba odpowiedzialna: <strong>{contact.responsible}</strong>
							</div>
							{contact.email && (
								<a
									href={`mailto:${contact.email}`}
									className={styles.contactCard__link}
								>
									<Mail size={14} />
									{contact.email}
								</a>
							)}
							{contact.phone && (
								<a
									href={`tel:${contact.phone}`}
									className={styles.contactCard__link}
								>
									<Phone size={14} />
									{contact.phone}
								</a>
							)}
							{contact.notes && (
								<p className={styles.contactCard__notes}>{contact.notes}</p>
							)}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

// ============================================================
// GŁÓWNY KOMPONENT
// ============================================================

export default function SocialMedia({ title }: { title?: string }) {
	const [members, setMembers] = useState<TeamMember[]>([]);
	const [creators, setCreators] = useState<ContentCreator[]>([]);
	const [publications, setPublications] = useState<Publication[]>([]);
	const [materials, setMaterials] = useState<Material[]>([]);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [contacts, setContacts] = useState<MediaContact[]>([]);
	const [loading, setLoading] = useState(true);
	const [currentUser, setCurrentUser] = useState<any>(null);
	const [canManage, setCanManage] = useState(false);
	const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
	const [isPublicationModalOpen, setIsPublicationModalOpen] = useState(false);
	const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
	const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);

	const [isContactModalOpen, setIsContactModalOpen] = useState(false);
	const [availableUsers, setAvailableUsers] = useState<any[]>([]);
	const [editingPublication, setEditingPublication] =
		useState<Publication | null>(null);
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const [editingContact, setEditingContact] = useState<MediaContact | null>(
		null,
	);
	const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
	const [isEditMaterialModalOpen, setIsEditMaterialModalOpen] = useState(false);
	const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
	const handleEditMaterial = (material: Material) => {
		setEditingMaterial(material);
		setIsEditMaterialModalOpen(true);
	};
	const handleAddCreator = async (data: CreatorFormData) => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch("/api/social/creators", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!response.ok) throw new Error("Błąd dodawania twórcy");
			const newCreator = await response.json();
			setCreators([...creators, newCreator]);
			toast.success("Twórca dodany!");
		} catch (error) {
			console.error("❌ Błąd:", error);
			toast.error("Nie udało się dodać twórcy");
		}
	};
	const handleUpdateMaterial = async (id: string, data: MaterialFormData) => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch(`/api/social/materials/${id}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!response.ok) throw new Error("Błąd aktualizacji materiału");
			const updated = await response.json();
			setMaterials(materials.map((m) => (m.id === id ? updated : m)));
			toast.success("Materiał zaktualizowany!");
		} catch (error) {
			console.error("❌ Błąd:", error);
			toast.error("Nie udało się zaktualizować materiału");
		}
	};

	const handleDeleteMaterial = (id: string) => {
		showConfirm(
			"Usuń materiał",
			"Czy na pewno chcesz usunąć ten materiał? Tej operacji nie można cofnąć.",
			"Usuń",
			async () => {
				try {
					const token = localStorage.getItem("accessToken");
					const response = await fetch(`/api/social/materials/${id}`, {
						method: "DELETE",
						headers: { Authorization: `Bearer ${token}` },
					});
					if (!response.ok) throw new Error("Błąd usuwania materiału");
					setMaterials(materials.filter((m) => m.id !== id));
					toast.success("Materiał usunięty!");
				} catch (error) {
					console.error("❌ Błąd:", error);
					toast.error("Nie udało się usunąć materiału");
				}
			},
		);
	};
	const [isEditPublicationModalOpen, setIsEditPublicationModalOpen] =
		useState(false);
	const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
	const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false);
	// Pobierz wszystkie dane
	const handleAddMaterial = async (data: MaterialFormData) => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch("/api/social/materials", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!response.ok) throw new Error("Błąd dodawania materiału");
			const newMaterial = await response.json();
			setMaterials([...materials, newMaterial]);
			toast.success("Materiał dodany!");
		} catch (error) {
			console.error("❌ Błąd:", error);
			toast.error("Nie udało się dodać materiału");
		}
	};
	const [confirmDialog, setConfirmDialog] = useState<{
		isOpen: boolean;
		title: string;
		message: string;
		confirmText: string;
		onConfirm: () => void;
		onCancel: () => void;
	}>({
		isOpen: false,
		title: "",
		message: "",
		confirmText: "Potwierdź",
		onConfirm: () => { },
		onCancel: () => { },
	});
	useEffect(() => {
		const fetchAllData = async () => {
			try {
				setLoading(true);
				const token = localStorage.getItem("accessToken");

				const userRes = await fetch("/api/profile", {
					headers: { Authorization: `Bearer ${token}` },
				});
				const userData = await userRes.json();
				setCurrentUser(userData);
				setCanManage(
					userData.role === "admin" || userData.role === "coordinator",
				);

				const [
					membersRes,
					creatorsRes,
					publicationsRes,
					materialsRes,
					tasksRes,
					contactsRes,
					usersRes,
				] = await Promise.all([
					fetch("/api/social/members", {
						headers: { Authorization: `Bearer ${token}` },
					}),
					fetch("/api/social/creators", {
						headers: { Authorization: `Bearer ${token}` },
					}),
					fetch("/api/social/publications", {
						headers: { Authorization: `Bearer ${token}` },
					}),
					fetch("/api/social/materials", {
						headers: { Authorization: `Bearer ${token}` },
					}),
					fetch("/api/social/tasks", {
						headers: { Authorization: `Bearer ${token}` },
					}),
					fetch("/api/social/contacts", {
						headers: { Authorization: `Bearer ${token}` },
					}),
					fetch("/api/users", {
						headers: { Authorization: `Bearer ${token}` },
					}),
				]);

				if (membersRes.ok) setMembers(await membersRes.json());
				if (creatorsRes.ok) setCreators(await creatorsRes.json());
				if (publicationsRes.ok) setPublications(await publicationsRes.json());
				if (materialsRes.ok) setMaterials(await materialsRes.json());
				if (tasksRes.ok) setTasks(await tasksRes.json());
				if (contactsRes.ok) setContacts(await contactsRes.json());
				if (usersRes.ok) setAvailableUsers(await usersRes.json());
			} catch (error) {
				console.error("❌ Błąd pobierania danych:", error);
				toast.error("Nie udało się pobrać danych");
			} finally {
				setLoading(false);
			}
		};

		fetchAllData();
	}, []);

	// ============================================================
	// FUNKCJE ZAPISU
	// ============================================================
	const handleEditPublication = (publication: Publication) => {
		setEditingPublication(publication);
		setIsEditPublicationModalOpen(true);
	};

	const handleEditTask = (task: Task) => {
		setEditingTask(task);
		setIsEditTaskModalOpen(true);
	};

	const handleEditContact = (contact: MediaContact) => {
		setEditingContact(contact);
		setIsEditContactModalOpen(true);
	};

	// ⭐ FUNKCJE ZAPISU EDYCJI
	const handleUpdatePublication = async (
		id: string,
		data: PublicationFormData,
	) => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch(`/api/social/publications/${id}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!response.ok) throw new Error("Błąd aktualizacji publikacji");
			const updated = await response.json();
			setPublications(publications.map((p) => (p.id === id ? updated : p)));
			toast.success("Publikacja zaktualizowana!");
		} catch (error) {
			console.error("❌ Błąd:", error);
			toast.error("Nie udało się zaktualizować publikacji");
		}
	};

	const handleUpdateTask = async (id: string, data: TaskFormData) => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch(`/api/social/tasks/${id}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!response.ok) throw new Error("Błąd aktualizacji zadania");
			const updated = await response.json();
			setTasks(tasks.map((t) => (t.id === id ? updated : t)));
			toast.success("Zadanie zaktualizowane!");
		} catch (error) {
			console.error("❌ Błąd:", error);
			toast.error("Nie udało się zaktualizować zadania");
		}
	};

	const handleUpdateContact = async (id: string, data: ContactFormData) => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch(`/api/social/contacts/${id}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!response.ok) throw new Error("Błąd aktualizacji kontaktu");
			const updated = await response.json();
			setContacts(contacts.map((c) => (c.id === id ? updated : c)));
			toast.success("Kontakt zaktualizowany!");
		} catch (error) {
			console.error("❌ Błąd:", error);
			toast.error("Nie udało się zaktualizować kontaktu");
		}
	};
	const showConfirm = (
		title: string,
		message: string,
		confirmText: string,
		onConfirm: () => void,
		onCancel?: () => void,
	) => {
		setConfirmDialog({
			isOpen: true,
			title,
			message,
			confirmText,
			onConfirm: () => {
				onConfirm();
				setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
			},
			onCancel: () => {
				if (onCancel) onCancel();
				setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
			},
		});
	};
	// ⭐ FUNKCJE USUWANIA
	// ⭐ FUNKCJE USUWANIA - Z showConfirm
	const handleDeletePublication = (id: string) => {
		showConfirm(
			"Usuń publikację",
			"Czy na pewno chcesz usunąć tę publikację? Tej operacji nie można cofnąć.",
			"Usuń",
			async () => {
				try {
					const token = localStorage.getItem("accessToken");
					const response = await fetch(`/api/social/publications/${id}`, {
						method: "DELETE",
						headers: { Authorization: `Bearer ${token}` },
					});
					if (!response.ok) throw new Error("Błąd usuwania publikacji");
					setPublications(publications.filter((p) => p.id !== id));
					toast.success("Publikacja usunięta!");
				} catch (error) {
					console.error("❌ Błąd:", error);
					toast.error("Nie udało się usunąć publikacji");
				}
			},
		);
	};

	const handleDeleteTask = (id: string) => {
		showConfirm(
			"Usuń zadanie",
			"Czy na pewno chcesz usunąć to zadanie? Tej operacji nie można cofnąć.",
			"Usuń",
			async () => {
				try {
					const token = localStorage.getItem("accessToken");
					const response = await fetch(`/api/social/tasks/${id}`, {
						method: "DELETE",
						headers: { Authorization: `Bearer ${token}` },
					});
					if (!response.ok) throw new Error("Błąd usuwania zadania");
					setTasks(tasks.filter((t) => t.id !== id));
					toast.success("Zadanie usunięte!");
				} catch (error) {
					console.error("❌ Błąd:", error);
					toast.error("Nie udało się usunąć zadania");
				}
			},
		);
	};

	const handleDeleteContact = (id: string) => {
		showConfirm(
			"Usuń kontakt",
			"Czy na pewno chcesz usunąć ten kontakt? Tej operacji nie można cofnąć.",
			"Usuń",
			async () => {
				try {
					const token = localStorage.getItem("accessToken");
					const response = await fetch(`/api/social/contacts/${id}`, {
						method: "DELETE",
						headers: { Authorization: `Bearer ${token}` },
					});
					if (!response.ok) throw new Error("Błąd usuwania kontaktu");
					setContacts(contacts.filter((c) => c.id !== id));
					toast.success("Kontakt usunięty!");
				} catch (error) {
					console.error("❌ Błąd:", error);
					toast.error("Nie udało się usunąć kontaktu");
				}
			},
		);
	};
	const handleAddMember = async (data: MemberFormData) => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch("/api/social/members", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Błąd dodawania członka");
			}

			const newMember = await response.json();

			// ⭐ DODAJ NOWEGO CZŁONKA DO LISTY (ale to może nie działać jeśli dane są niekompletne)
			setMembers([...members, newMember]);

			// ⭐ LEPIEJ - pobierz świeżą listę z API
			const membersResponse = await fetch("/api/social/members", {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (membersResponse.ok) {
				const freshMembers = await membersResponse.json();
				setMembers(freshMembers);
			}

			toast.success("Członek dodany!");
		} catch (error) {
			console.error("❌ Błąd:", error);
			toast.error(
				error instanceof Error ? error.message : "Nie udało się dodać członka",
			);
		}
	};

	const handleAddPublication = async (data: PublicationFormData) => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch("/api/social/publications", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!response.ok) throw new Error("Błąd dodawania publikacji");
			const newPublication = await response.json();
			setPublications([...publications, newPublication]);
			toast.success("Publikacja dodana!");
		} catch (error) {
			console.error("❌ Błąd:", error);
			toast.error("Nie udało się dodać publikacji");
		}
	};

	const handleAddTask = async (data: TaskFormData) => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch("/api/social/tasks", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!response.ok) throw new Error("Błąd dodawania zadania");
			const newTask = await response.json();
			setTasks([...tasks, newTask]);
			toast.success("Zadanie dodane!");
		} catch (error) {
			console.error("❌ Błąd:", error);
			toast.error("Nie udało się dodać zadania");
		}
	};

	const handleAddContact = async (data: ContactFormData) => {
		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch("/api/social/contacts", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!response.ok) throw new Error("Błąd dodawania kontaktu");
			const newContact = await response.json();
			setContacts([...contacts, newContact]);
			toast.success("Kontakt dodany!");
		} catch (error) {
			console.error("❌ Błąd:", error);
			toast.error("Nie udało się dodać kontaktu");
		}
	};

	if (loading) {
		return <div className={styles.loading}>Ładowanie...</div>;
	}

	return (
		<div className={styles.socialMedia}>
			{/* Nagłówek */}
			<div className={styles.header}>
				<div className={styles.header__left}>
					<h1 className={styles.header__title}>{title ?? "Social Media"}</h1>
					<p className={styles.header__subtitle}>
						Centrum zarządzania działaniami komunikacyjnymi, tworzeniem treści
						oraz zespołem odpowiedzialnym za media społecznościowe
						Stowarzyszenia Siła Młodych.
					</p>
				</div>
			</div>

			{/* Zespół */}
			<TeamSection
				members={members}
				canManage={canManage}
				onAddMember={() => setIsMemberModalOpen(true)}
			/>
			{/* Twórcy rolek */}
			<CreatorsSection
				creators={creators}
				canManage={canManage}
				onAddCreator={() => setIsCreatorModalOpen(true)}
			/>

			{/* Tablica materiałów */}
			<MaterialsBoard
				materials={materials}
				canManage={canManage}
				onAddMaterial={() => setIsMaterialModalOpen(true)}
				onEditMaterial={handleEditMaterial} // ⭐ DODAJ
				onDeleteMaterial={handleDeleteMaterial} // ⭐ DODAJ
			/>
			<EditMaterialModal
				isOpen={isEditMaterialModalOpen}
				material={editingMaterial}
				onClose={() => {
					setIsEditMaterialModalOpen(false);
					setEditingMaterial(null);
				}}
				onSave={handleUpdateMaterial}
				teamMembers={members}
			/>
			<AddMaterialModal
				isOpen={isMaterialModalOpen}
				onClose={() => setIsMaterialModalOpen(false)}
				onSave={handleAddMaterial}
				teamMembers={members}
			/>
			<AddCreatorModal
				isOpen={isCreatorModalOpen}
				onClose={() => setIsCreatorModalOpen(false)}
				onSave={handleAddCreator}
				availableUsers={availableUsers} // ⭐ przekazujemy listę członków SM
			/>
			{/* Planowanie publikacji */}
			<PublicationsSection
				publications={publications}
				canManage={canManage}
				onAddPublication={() => setIsPublicationModalOpen(true)}
				onEditPublication={handleEditPublication} // ⭐ DODAJ
				onDeletePublication={handleDeletePublication} // ⭐ DODAJ
			/>

			{/* Zadania */}
			<TasksSection
				tasks={tasks}
				canManage={canManage}
				onAddTask={() => setIsTaskModalOpen(true)}
				onEditTask={handleEditTask} // ⭐ DODAJ
				onDeleteTask={handleDeleteTask} // ⭐ DODAJ
			/>

			{/* Współprace */}
			<ContactsSection
				contacts={contacts}
				canManage={canManage}
				onAddContact={() => setIsContactModalOpen(true)}
				onEditContact={handleEditContact} // ⭐ DODAJ
				onDeleteContact={handleDeleteContact} // ⭐ DODAJ
			/>

			{/* Informacje organizacyjne */}
			<section className={styles.section}>
				<div className={styles.infoBox}>
					<div className={styles.infoBox__icon}>
						<AlertCircle size={24} />
					</div>
					<div className={styles.infoBox__content}>
						<h3 className={styles.infoBox__title}>Informacje organizacyjne</h3>
						<p className={styles.infoBox__text}>
							Dostęp do zakładki posiadają osoby zajmujące się mediami
							społecznościowymi oraz osoby z odpowiednimi uprawnieniami.
							Administrator główny oraz zarząd mogą przydzielać role i
							uprawnienia. Zakładka służy do koordynacji działań medialnych,
							planowania publikacji oraz organizacji pracy zespołu.
						</p>
					</div>
				</div>
			</section>
			<AddMemberModal
				isOpen={isMemberModalOpen}
				onClose={() => setIsMemberModalOpen(false)}
				onSave={handleAddMember}
				availableUsers={availableUsers}
			/>

			<AddPublicationModal
				isOpen={isPublicationModalOpen}
				onClose={() => setIsPublicationModalOpen(false)}
				onSave={handleAddPublication}
				teamMembers={members}
			/>

			<AddTaskModal
				isOpen={isTaskModalOpen}
				onClose={() => setIsTaskModalOpen(false)}
				onSave={handleAddTask}
				teamMembers={members}
			/>

			<AddContactModal
				isOpen={isContactModalOpen}
				onClose={() => setIsContactModalOpen(false)}
				onSave={handleAddContact}
				teamMembers={members}
			/>
			<EditPublicationModal
				isOpen={isEditPublicationModalOpen}
				publication={editingPublication}
				onClose={() => {
					setIsEditPublicationModalOpen(false);
					setEditingPublication(null);
				}}
				onSave={handleUpdatePublication}
				teamMembers={members}
			/>
			<ConfirmDialog
				isOpen={confirmDialog.isOpen}
				title={confirmDialog.title}
				message={confirmDialog.message}
				confirmText={confirmDialog.confirmText}
				onConfirm={confirmDialog.onConfirm}
				onCancel={confirmDialog.onCancel}
			/>
			<EditTaskModal
				isOpen={isEditTaskModalOpen}
				task={editingTask}
				onClose={() => {
					setIsEditTaskModalOpen(false);
					setEditingTask(null);
				}}
				onSave={handleUpdateTask}
				teamMembers={members}
			/>

			<EditContactModal
				isOpen={isEditContactModalOpen}
				contact={editingContact}
				onClose={() => {
					setIsEditContactModalOpen(false);
					setEditingContact(null);
				}}
				onSave={handleUpdateContact}
				teamMembers={members}
			/>

		</div>
	);
}
