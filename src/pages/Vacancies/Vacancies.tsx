import toast from "react-hot-toast";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { useState, useMemo, useEffect } from "react";
import { logger } from "@/utils/logger";

import {
	Briefcase,
	Search,
	X,
	Filter,
	Grid,
	List,
	User as UserIcon,
	Clock,
	CheckCircle,
	Eye,
	Edit,
	Trash2,
	Plus,
	Send,
	Users,
	Calendar,
	Mail,
	Sparkles,
	Video,
	Camera,
	Megaphone,
	Globe,
	Link2,
	Award,
	Target,
	TrendingUp,
	ChevronRight,
	Check,
	UserPlus,
	BookOpen,
	Code,
	Music,
	Palette,
	AlertCircle,
	Smartphone,
	Zap,
	Star,
	Heart,
	MessageCircle,
	Share2,
	FolderOpen,
	Settings,
	Tag,
	FileText,
	FormInput,
	MessageSquare,
	FileCheck,
} from "lucide-react";
import styles from "./Vacancies.module.css";

type VacancyStatus = "active" | "recruiting" | "filled";

type User = {
	id: string;
	name: string;
	role: "admin" | "board" | "coordinator" | "member";
	teamId?: string;
};

type RecruitmentType = "form" | "messenger" | "internal";

type FormQuestion = {
	id: string;
	question: string;
	type: "text" | "number" | "textarea" | "select" | "checkbox";
	required: boolean;
	options?: string[];
};

type Vacancy = {
	id: string;
	title: string;
	icon: string;
	description: string;
	responsibilities: string[];
	requirements: string[];
	niceToHave?: string[];
	team: string;
	teamId: string;
	pillar?: string;
	contactPerson: {
		name: string;
		email: string;
		phone?: string;
	};
	createdAt: string;
	status: VacancyStatus;
	applicants?: string[];
	filledBy?: string;
	attachments?: {
		id: string;
		name: string;
		size: number;
		type: string;
		url: string;
		uploadedAt: string;
	}[];

	recruitment: {
		type: RecruitmentType;
		formUrl?: string;
		messengerContact?: string;
		questions?: FormQuestion[];
		deadline: string;
	};
};

type Application = {
	id: string;
	vacancyId: string;
	userId: string;
	userName: string;
	userEmail: string;
	message?: string;
	appliedAt: string;
	status: "pending" | "reviewed" | "accepted" | "rejected";
	answers?: Record<string, string>;
};

const STATUS_LABELS: Record<VacancyStatus, string> = {
	active: "Aktywny",
	recruiting: "W trakcie rekrutacji",
	filled: "Obsadzony",
};

const STATUS_COLORS: Record<VacancyStatus, string> = {
	active: styles.statusActive,
	recruiting: styles.statusRecruiting,
	filled: styles.statusFilled,
};

const STATUS_ICONS: Record<VacancyStatus, React.ReactNode> = {
	active: <CheckCircle size={14} />,
	recruiting: <Clock size={14} />,
	filled: <Check size={14} />,
};

const ICON_MAP: Record<
	string,
	React.ComponentType<{ size?: number; className?: string }>
> = {
	Briefcase: Briefcase,
	Target: Target,
	Video: Video,
	Smartphone: Smartphone,
	Camera: Camera,
	Palette: Palette,
	Megaphone: Megaphone,
	MessageCircle: MessageCircle,
	Sparkles: Sparkles,
	Award: Award,
	Share2: Share2,
	Globe: Globe,
	Zap: Zap,
	Star: Star,
	Heart: Heart,
	TrendingUp: TrendingUp,
	Code: Code,
	Music: Music,
	BookOpen: BookOpen,
	Users: Users,
	UserPlus: UserPlus,
	FolderOpen: FolderOpen,
	Settings: Settings,
	Tag: Tag,
};
const ICON_LABELS: Record<string, string> = {
	Briefcase: "Teczka",
	Target: "Cel",
	Video: "Kamera wideo",
	Smartphone: "Telefon",
	Camera: "Aparat",
	Palette: "Paleta",
	Megaphone: "Megafon",
	MessageCircle: "Wiadomość",
	Sparkles: "Gwiazdy",
	Award: "Nagroda",
	Share2: "Udostępnianie",
	Globe: "Globus",
	Zap: "Błyskawica",
	Star: "Gwiazda",
	Heart: "Serce",
	TrendingUp: "Wzrost",
	Code: "Kod",
	Music: "Muzyka",
	BookOpen: "Książka",
	Users: "Grupa użytkowników",
	UserPlus: "Dodaj użytkownika",
	FolderOpen: "Otwarty folder",
	Settings: "Ustawienia",
	Tag: "Tag",
};

interface VacancyCardProps {
	vacancy: Vacancy;
	currentUser: User;
	onView: (vacancy: Vacancy) => void;
	onEdit?: (vacancy: Vacancy) => void;
	onDelete?: (vacancy: Vacancy) => void;
	onApply: (vacancy: Vacancy) => void;
	viewMode: "grid" | "list";
	hasApplied?: boolean;
}

function VacancyCard({
	vacancy,
	currentUser,
	onView,
	onEdit,
	onDelete,
	onApply,
	viewMode,
	hasApplied = false,
}: VacancyCardProps) {
	const IconComponent = ICON_MAP[vacancy.icon] || Briefcase;
	const canManage =
		currentUser.role === "admin" || currentUser.role === "board";

	const isFilled = vacancy.status === "filled";

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString("pl-PL", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	if (viewMode === "list") {
		return (
			<div className={`${styles.vacancyCard} ${styles.vacancyCardList}`}>
				<div className={styles.vacancyCard__iconWrapper}>
					<IconComponent size={32} className={styles.vacancyCard__icon} />
				</div>
				<div className={styles.vacancyCard__info}>
					<div className={styles.vacancyCard__header}>
						<h3 className={styles.vacancyCard__title}>{vacancy.title}</h3>
						<span
							className={`${styles.vacancyCard__status} ${STATUS_COLORS[vacancy.status]}`}
						>
							{STATUS_ICONS[vacancy.status]}
							{STATUS_LABELS[vacancy.status]}
						</span>
					</div>
					<p className={styles.vacancyCard__description}>
						{vacancy.description}
					</p>
					<div className={styles.vacancyCard__meta}>
						<span className={styles.vacancyCard__team}>
							<Users size={14} />
							{vacancy.team}
						</span>
						{vacancy.pillar && (
							<span className={styles.vacancyCard__pillar}>
								<Tag size={14} />
								{vacancy.pillar}
							</span>
						)}
						<span className={styles.vacancyCard__date}>
							<Calendar size={14} />
							Dodano: {formatDate(vacancy.createdAt)}
						</span>
						<span className={styles.vacancyCard__applicants}>
							<UserPlus size={14} />
							{vacancy.applicants?.length || 0} zgłoszeń
						</span>
					</div>

					{vacancy.recruitment && (
						<div className={styles.vacancyCard__recruitment}>
							{vacancy.recruitment.deadline && (
								<span className={styles.vacancyCard__deadline}>
									<Clock size={14} />
									Zgłoszenia do:{" "}
									{new Date(vacancy.recruitment.deadline).toLocaleString(
										"pl-PL",
									)}
								</span>
							)}
							<span
								className={`${styles.vacancyCard__recruitmentType} ${styles[`vacancyCard__recruitmentType--${vacancy.recruitment.type}`]}`}
							>
								{vacancy.recruitment.type === "form" && (
									<>
										<FormInput size={14} />
										Formularz
									</>
								)}
								{vacancy.recruitment.type === "messenger" && (
									<>
										<MessageSquare size={14} />
										Messenger
									</>
								)}
								{vacancy.recruitment.type === "internal" && (
									<>
										<FileCheck size={14} />
										Formularz
									</>
								)}
							</span>
						</div>
					)}
				</div>
				<div className={styles.vacancyCard__actions}>
					<button
						className={styles.vacancyCard__actionBtn}
						onClick={() => onView(vacancy)}
						title="Szczegóły"
					>
						<Eye size={16} />
					</button>
					{canManage && (
						<>
							<button
								className={styles.vacancyCard__actionBtn}
								onClick={() => onEdit?.(vacancy)}
								title="Edytuj"
							>
								<Edit size={16} />
							</button>
							<button
								className={`${styles.vacancyCard__actionBtn} ${styles.vacancyCard__actionBtnDanger}`}
								onClick={() => onDelete?.(vacancy)}
								title="Usuń"
							>
								<Trash2 size={16} />
							</button>
						</>
					)}

					{!isFilled && !hasApplied && vacancy.status !== "recruiting" && (
						<button
							className={styles.vacancyCard__applyBtn}
							onClick={() => onApply(vacancy)}
							disabled={isFilled}
						>
							<Send size={14} />
							Zgłoś się
						</button>
					)}
					{hasApplied && (
						<span className={styles.vacancyCard__appliedBadge}>
							<Check size={14} />
							Zgłoszono
						</span>
					)}
				</div>
			</div>
		);
	}

	return (
		<div
			className={`${styles.vacancyCard} ${isFilled ? styles.vacancyCardFilled : ""}`}
		>
			<div className={styles.vacancyCard__iconWrapper}>
				<IconComponent size={40} className={styles.vacancyCard__icon} />
			</div>
			<div className={styles.vacancyCard__content}>
				<div className={styles.vacancyCard__header}>
					<h3 className={styles.vacancyCard__title}>{vacancy.title}</h3>
					<span
						className={`${styles.vacancyCard__status} ${STATUS_COLORS[vacancy.status]}`}
					>
						{STATUS_ICONS[vacancy.status]}
						{STATUS_LABELS[vacancy.status]}
					</span>
				</div>
				<p className={styles.vacancyCard__description}>{vacancy.description}</p>
				<div className={styles.vacancyCard__meta}>
					<span className={styles.vacancyCard__team}>
						<Users size={14} />
						{vacancy.team}
					</span>
					{vacancy.pillar && (
						<span className={styles.vacancyCard__pillar}>
							<Tag size={14} />
							{vacancy.pillar}
						</span>
					)}
					<span className={styles.vacancyCard__applicants}>
						<UserPlus size={14} />
						{vacancy.applicants?.length || 0} zgłoszeń
					</span>
				</div>

				{vacancy.recruitment && (
					<div className={styles.vacancyCard__recruitment}>
						{vacancy.recruitment.deadline && (
							<span className={styles.vacancyCard__deadline}>
								<Clock size={14} />
								Zgłoszenia do:{" "}
								{new Date(vacancy.recruitment.deadline).toLocaleString("pl-PL")}
							</span>
						)}
						<span
							className={`${styles.vacancyCard__recruitmentType} ${styles[`vacancyCard__recruitmentType--${vacancy.recruitment.type}`]}`}
						>
							{vacancy.recruitment.type === "form" && (
								<>
									<FormInput size={14} />
									Formularz
								</>
							)}
							{vacancy.recruitment.type === "messenger" && (
								<>
									<MessageSquare size={14} />
									Messenger
								</>
							)}
							{vacancy.recruitment.type === "internal" && (
								<>
									<FileCheck size={14} />
									Formularz
								</>
							)}
						</span>
					</div>
				)}
				<div className={styles.vacancyCard__footer}>
					<span className={styles.vacancyCard__date}>
						<Calendar size={14} />
						{formatDate(vacancy.createdAt)}
					</span>
					<div className={styles.vacancyCard__actions}>
						<button
							className={styles.vacancyCard__actionBtn}
							onClick={() => onView(vacancy)}
							title="Szczegóły"
						>
							<Eye size={16} />
						</button>
						{canManage && (
							<>
								<button
									className={styles.vacancyCard__actionBtn}
									onClick={() => onEdit?.(vacancy)}
									title="Edytuj"
								>
									<Edit size={16} />
								</button>
								<button
									className={`${styles.vacancyCard__actionBtn} ${styles.vacancyCard__actionBtnDanger}`}
									onClick={() => onDelete?.(vacancy)}
									title="Usuń"
								>
									<Trash2 size={16} />
								</button>
							</>
						)}

						{!isFilled && !hasApplied && vacancy.status !== "recruiting" && (
							<button
								className={styles.vacancyCard__applyBtn}
								onClick={() => onApply(vacancy)}
								disabled={isFilled}
							>
								<Send size={14} />
								Zgłoś się
							</button>
						)}
						{hasApplied && (
							<span className={styles.vacancyCard__appliedBadge}>
								<Check size={14} />
								Zgłoszono
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

interface ApplyModalProps {
	isOpen: boolean;
	vacancy: Vacancy | null;
	currentUser: User;
	onClose: () => void;
	onSubmit: (
		vacancy: Vacancy,
		answers: Record<string, string>,
		message: string,
	) => void;
}

function ApplyModal({ isOpen, vacancy, onClose, onSubmit }: ApplyModalProps) {
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [message, setMessage] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});

	if (!isOpen || !vacancy) return null;

	const isInternal = vacancy.recruitment?.type === "internal";
	const questions = vacancy.recruitment?.questions || [];
	if (vacancy.status === "recruiting") {
		onClose();
		return null;
	}
	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (isInternal) {
			questions.forEach((q) => {
				if (q.required && !answers[q.id]?.trim()) {
					newErrors[q.id] = "To pytanie jest wymagane";
				}
			});
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};
	const isDeadlinePassed = vacancy.recruitment?.deadline
		? new Date(vacancy.recruitment.deadline) < new Date()
		: false;
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			const firstError = document.querySelector(".apply-error");
			if (firstError) {
				firstError.scrollIntoView({ behavior: "smooth", block: "center" });
			}
			return;
		}

		onSubmit(vacancy, answers, message);
		onClose();
	};

	if (!isOpen || !vacancy) return null;

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div
				className={`${styles.modal} ${styles.modalForm}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modal__header}>
					<div className={styles.modal__headerLeft}>
						<Briefcase size={24} className={styles.modal__icon} />
						<h2 className={styles.modal__title}>
							Zgłoszenie na stanowisko: {vacancy.title}
						</h2>
					</div>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>
				{isDeadlinePassed && (
					<div className={styles.modal__warning}>
						<AlertCircle size={20} />
						<span>Termin zgłoszeń już minął!</span>
					</div>
				)}
				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__body}>
						<div className={styles.modal__section}>
							<div className={styles.modal__infoGrid}>
								<div className={styles.modal__infoItem}>
									<Clock size={16} />
									<span>
										Zgłoszenia do:{" "}
										<strong>
											{new Date(vacancy.recruitment.deadline).toLocaleString(
												"pl-PL",
											)}
										</strong>
									</span>
								</div>
								<div className={styles.modal__infoItem}>
									<Briefcase size={16} />
									<span>
										Typ rekrutacji:{" "}
										<strong>
											{vacancy.recruitment.type === "form" &&
												"Formularz zewnętrzny"}
											{vacancy.recruitment.type === "messenger" &&
												"Wiadomość na Messengerze"}
											{vacancy.recruitment.type === "internal" &&
												"Formularz na stronie"}
										</strong>
									</span>
								</div>
							</div>
						</div>

						{vacancy.recruitment.type === "form" &&
							vacancy.recruitment.formUrl && (
								<div className={styles.modal__section}>
									<div className={styles.applyInfoBox}>
										<p>
											Rekrutacja odbywa się przez zewnętrzny formularz. Kliknij
											poniższy link, aby przejść do formularza.
										</p>
										<a
											href={vacancy.recruitment.formUrl}
											target="_blank"
											rel="noopener noreferrer"
											className={styles.applyExternalLink}
										>
											<Link2 size={16} />
											Przejdź do formularza
										</a>
										<button
											type="button"
											className={styles.modal__btnCancel}
											onClick={onClose}
											style={{ marginTop: "12px" }}
										>
											Zamknij
										</button>
									</div>
								</div>
							)}

						{vacancy.recruitment.type === "messenger" &&
							vacancy.recruitment.messengerContact && (
								<div className={styles.modal__section}>
									<div className={styles.applyInfoBox}>
										<p>
											Rekrutacja odbywa się przez Messenger. Skontaktuj się z
											osobą odpowiedzialną:
										</p>
										<div className={styles.applyContactInfo}>
											<UserIcon size={20} />
											<strong>{vacancy.recruitment.messengerContact}</strong>
										</div>
										<button
											type="button"
											className={styles.modal__btnCancel}
											onClick={onClose}
											style={{ marginTop: "12px" }}
										>
											Zamknij
										</button>
									</div>
								</div>
							)}

						{vacancy.recruitment.type === "internal" && (
							<>
								{questions.length > 0 && (
									<div className={styles.modal__section}>
										<h3 className={styles.modal__sectionTitle}>
											Pytania do kandydata
										</h3>
										{questions.map((q) => (
											<div key={q.id} className={styles.applyQuestion}>
												<label className={styles.modal__label}>
													{q.question}
													{q.required && (
														<span className={styles.requiredStar}>*</span>
													)}
												</label>

												{q.type === "text" && (
													<input
														type="text"
														className={`${styles.modal__input} ${errors[q.id] ? styles.modal__inputError : ""}`}
														value={answers[q.id] || ""}
														onChange={(e) => {
															setAnswers({
																...answers,
																[q.id]: e.target.value,
															});
															if (errors[q.id])
																setErrors({ ...errors, [q.id]: "" });
														}}
														placeholder="Twoja odpowiedź..."
													/>
												)}

												{q.type === "number" && (
													<input
														type="number"
														className={`${styles.modal__input} ${errors[q.id] ? styles.modal__inputError : ""}`}
														value={answers[q.id] || ""}
														onChange={(e) => {
															setAnswers({
																...answers,
																[q.id]: e.target.value,
															});
															if (errors[q.id])
																setErrors({ ...errors, [q.id]: "" });
														}}
														placeholder="Twoja odpowiedź..."
													/>
												)}

												{q.type === "textarea" && (
													<textarea
														className={`${styles.modal__input} ${styles.modal__textarea} ${errors[q.id] ? styles.modal__inputError : ""}`}
														value={answers[q.id] || ""}
														onChange={(e) => {
															setAnswers({
																...answers,
																[q.id]: e.target.value,
															});
															if (errors[q.id])
																setErrors({ ...errors, [q.id]: "" });
														}}
														rows={3}
														placeholder="Twoja odpowiedź..."
													/>
												)}

												{q.type === "select" && q.options && (
													<select
														className={`${styles.modal__select} ${errors[q.id] ? styles.modal__inputError : ""}`}
														value={answers[q.id] || ""}
														onChange={(e) => {
															setAnswers({
																...answers,
																[q.id]: e.target.value,
															});
															if (errors[q.id])
																setErrors({ ...errors, [q.id]: "" });
														}}
													>
														<option value="">Wybierz...</option>
														{q.options.map((opt) => (
															<option key={opt} value={opt}>
																{opt}
															</option>
														))}
													</select>
												)}

												{q.type === "checkbox" && (
													<div className={styles.applyCheckbox}>
														<input
															type="checkbox"
															checked={answers[q.id] === "true"}
															onChange={(e) => {
																setAnswers({
																	...answers,
																	[q.id]: e.target.checked ? "true" : "false",
																});
																if (errors[q.id])
																	setErrors({ ...errors, [q.id]: "" });
															}}
															id={`checkbox-${q.id}`}
														/>
														<label htmlFor={`checkbox-${q.id}`}>
															Tak, zgadzam się
														</label>
													</div>
												)}

												{errors[q.id] && (
													<span
														className={`${styles.modal__error} apply-error`}
													>
														{errors[q.id]}
													</span>
												)}
											</div>
										))}
									</div>
								)}

								<div className={styles.modal__section}>
									<h3 className={styles.modal__sectionTitle}>Wiadomość</h3>
									<div className={styles.modal__field}>
										<label className={styles.modal__label}>
											Dodatkowa wiadomość (opcjonalnie)
										</label>
										<textarea
											className={styles.modal__input}
											value={message}
											onChange={(e) => setMessage(e.target.value)}
											rows={3}
											placeholder="Napisz coś o sobie, dlaczego chcesz dołączyć... (opcjonalnie)"
										/>
									</div>
								</div>
							</>
						)}
					</div>

					{vacancy.recruitment.type === "internal" && (
						<div className={styles.modal__actions}>
							<div className={styles.modal__actionsRight}>
								<button
									type="button"
									className={styles.modal__btnCancel}
									onClick={onClose}
								>
									Anuluj
								</button>
								<button type="submit" className={styles.modal__btnSave}>
									<Send size={16} />
									Wyślij zgłoszenie
								</button>
							</div>
						</div>
					)}
				</form>
			</div>
		</div>
	);
}

interface VacancyDetailModalProps {
	isOpen: boolean;
	vacancy: Vacancy | null;
	currentUser: User;
	onClose: () => void;
	onApply: (vacancy: Vacancy) => void;
	onOpenApply?: (vacancy: Vacancy) => void;
	hasApplied?: boolean;
	applications?: Application[];
}

function VacancyDetailModal({
	isOpen,
	vacancy,
	currentUser,
	onClose,
	onOpenApply,
	hasApplied = false,
	applications = [],
}: VacancyDetailModalProps) {
	if (!isOpen || !vacancy) return null;

	const responsibilities = Array.isArray(vacancy.responsibilities)
		? vacancy.responsibilities
		: [];
	const requirements = Array.isArray(vacancy.requirements)
		? vacancy.requirements
		: [];
	const niceToHave = Array.isArray(vacancy.niceToHave)
		? vacancy.niceToHave
		: [];
	const IconComponent = ICON_MAP[vacancy.icon] || Briefcase;
	const isFilled = vacancy.status === "filled";
	const canManage =
		currentUser.role === "admin" || currentUser.role === "board";

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString("pl-PL", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};
	const formatFileSize = (bytes: number): string => {
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		return (bytes / (1024 * 1024)).toFixed(1) + " MB";
	};
	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<div className={styles.modal__header}>
					<div className={styles.modal__headerLeft}>
						<IconComponent size={32} className={styles.modal__icon} />
						<h2 className={styles.modal__title}>{vacancy.title}</h2>
					</div>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<div className={styles.modal__body}>
					<div className={styles.modal__statusRow}>
						<span
							className={`${styles.modal__status} ${STATUS_COLORS[vacancy.status]}`}
						>
							{STATUS_ICONS[vacancy.status]}
							{STATUS_LABELS[vacancy.status]}
						</span>
						<span className={styles.modal__date}>
							<Calendar size={14} />
							Dodano: {formatDate(vacancy.createdAt)}
						</span>
					</div>
					<div className={styles.modal__section}>
						<h3 className={styles.modal__sectionTitle}>Opis stanowiska</h3>
						<p className={styles.modal__description}>{vacancy.description}</p>
					</div>
					<div className={styles.modal__section}>
						<h3 className={styles.modal__sectionTitle}>Zakres obowiązków</h3>
						<ul className={styles.modal__list}>
							{responsibilities.length > 0 ? (
								responsibilities.map((item, index) => (
									<li key={index} className={styles.modal__listItem}>
										<ChevronRight size={16} />
										{item}
									</li>
								))
							) : (
								<li className={styles.modal__listItem}>Brak obowiązków</li>
							)}
						</ul>
					</div>
					<div className={styles.modal__section}>
						<h3 className={styles.modal__sectionTitle}>Wymagania</h3>
						<ul className={styles.modal__list}>
							{requirements.length > 0 ? (
								requirements.map((item, index) => (
									<li key={index} className={styles.modal__listItem}>
										<Check size={16} />
										{item}
									</li>
								))
							) : (
								<li className={styles.modal__listItem}>Brak wymagań</li>
							)}
						</ul>
					</div>
					{niceToHave.length > 0 && (
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>Mile widziane</h3>
							<ul className={styles.modal__list}>
								{niceToHave.map((item, index) => (
									<li key={index} className={styles.modal__listItem}>
										<Star size={16} />
										{item}
									</li>
								))}
							</ul>
						</div>
					)}
					<div className={styles.modal__section}>
						<h3 className={styles.modal__sectionTitle}>
							Informacje organizacyjne
						</h3>
						<div className={styles.modal__infoGrid}>
							<div className={styles.modal__infoItem}>
								<Users size={16} />
								<span>
									Zespół: <strong>{vacancy.team}</strong>
								</span>
							</div>
							{vacancy.pillar && (
								<div className={styles.modal__infoItem}>
									<Tag size={16} />
									<span>
										Filar: <strong>{vacancy.pillar}</strong>
									</span>
								</div>
							)}
							<div className={styles.modal__infoItem}>
								<UserIcon size={16} />{" "}
								<span>
									Kontakt: <strong>{vacancy.contactPerson.name}</strong>
								</span>
							</div>
							<div className={styles.modal__infoItem}>
								<Mail size={16} />
								<span>
									Email: <strong>{vacancy.contactPerson.email}</strong>
								</span>
							</div>
						</div>
					</div>

					{vacancy.recruitment && (
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>Rekrutacja</h3>
							<div className={styles.modal__infoGrid}>
								<div className={styles.modal__infoItem}>
									<Clock size={16} />
									<span>
										Termin zgłoszeń:{" "}
										<strong>
											{new Date(vacancy.recruitment.deadline).toLocaleString(
												"pl-PL",
											)}
										</strong>
									</span>
								</div>
								<div className={styles.modal__infoItem}>
									<Briefcase size={16} />
									<span>
										Typ:{" "}
										<strong>
											{vacancy.recruitment.type === "form" &&
												"Formularz zewnętrzny"}
											{vacancy.recruitment.type === "messenger" &&
												"Wiadomość na Messengerze"}
											{vacancy.recruitment.type === "internal" &&
												"Formularz na stronie"}
										</strong>
									</span>
								</div>
							</div>

							{vacancy.recruitment.type === "form" &&
								vacancy.recruitment.formUrl && (
									<div
										className={styles.modal__infoItem}
										style={{ marginTop: "8px" }}
									>
										<Link2 size={16} />
										<span>
											Link:{" "}
											<a
												href={vacancy.recruitment.formUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												{vacancy.recruitment.formUrl}
											</a>
										</span>
									</div>
								)}

							{vacancy.recruitment.type === "messenger" &&
								vacancy.recruitment.messengerContact && (
									<div
										className={styles.modal__infoItem}
										style={{ marginTop: "8px" }}
									>
										<UserIcon size={16} />
										<span>
											Kontakt na Messengerze:{" "}
											<strong>{vacancy.recruitment.messengerContact}</strong>
										</span>
									</div>
								)}

							{vacancy.recruitment.type === "internal" &&
								vacancy.recruitment.questions &&
								vacancy.recruitment.questions.length > 0 && (
									<div style={{ marginTop: "12px" }}>
										<h4
											className={styles.modal__sectionTitle}
											style={{ fontSize: "14px" }}
										>
											Pytania do kandydatów
										</h4>
										<ul className={styles.modal__list}>
											{vacancy.recruitment.questions.map((q) => (
												<li
													key={q.id}
													className={`${styles.modal__listItem} ${styles.q}`}
												>
													<ChevronRight size={16} />
													{q.question}
													{q.required && (
														<span style={{ color: "#ef4444" }}>*</span>
													)}
													<span
														style={{
															fontSize: "12px",
															color: "#94a3b8",
															marginLeft: "8px",
														}}
													>
														({q.type === "text" && "Tekst"}
														{q.type === "number" && "Liczba"}
														{q.type === "textarea" && "Dłuższy tekst"}
														{q.type === "select" && "Wybór"}
														{q.type === "checkbox" && "Checkbox"})
													</span>
												</li>
											))}
										</ul>
									</div>
								)}
						</div>
					)}

					{vacancy.attachments && vacancy.attachments.length > 0 && (
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>
								Załączniki ({vacancy.attachments.length})
							</h3>
							<div className={styles.modal__attachments}>
								{vacancy.attachments.map((file) => (
									<a
										key={file.id}
										href={file.url}
										target="_blank"
										rel="noopener noreferrer"
										className={styles.modal__attachment}
									>
										<FileText size={18} />
										<span className={styles.modal__attachmentName}>
											{file.name}
										</span>
										<span className={styles.modal__attachmentSize}>
											{formatFileSize(file.size)}
										</span>
										<span className={styles.modal__attachmentDate}>
											{formatDate(file.uploadedAt)}
										</span>
									</a>
								))}
							</div>
						</div>
					)}
					{vacancy.filledBy && (
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>
								Stanowisko obsadzone
							</h3>
							<div className={styles.modal__filledInfo}>
								<CheckCircle size={20} />
								<span>Stanowisko zostało już obsadzone.</span>
							</div>
						</div>
					)}
					{vacancy.applicants && vacancy.applicants.length > 0 && canManage && (
						<div className={styles.applicationsSection}>
							<div className={styles.applicationsHeader}>
								<h3 className={styles.applicationsTitle}>
									<Users size={18} />
									Zgłoszenia
									<span className={styles.applicationsBadge}>
										{vacancy.applicants.length}
									</span>
								</h3>
							</div>

							<div className={styles.applicationsList}>
								{(applications || [])
									.filter((app) => app.vacancyId === vacancy.id)
									.map((app) => (
										<div key={app.id} className={styles.applicationCard}>
											<div className={styles.applicationRow}>
												<div className={styles.applicationUser}>
													<div className={styles.applicationAvatar}>
														{app.userName.charAt(0).toUpperCase()}
													</div>
													<div className={styles.applicationUserInfo}>
														<div className={styles.applicationUserName}>
															{app.userName}
														</div>
														<div className={styles.applicationUserEmail}>
															<Mail size={12} />
															{app.userEmail}
														</div>
													</div>
												</div>

												<div className={styles.applicationMeta}>
													<span
														className={`${styles.applicationStatus} ${styles[`status${app.status.charAt(0).toUpperCase() + app.status.slice(1)}`]}`}
													>
														{app.status === "pending" && "Oczekuje"}
														{app.status === "reviewed" && "Przejrzane"}
														{app.status === "accepted" && "Zaakceptowane"}
														{app.status === "rejected" && "Odrzucone"}
													</span>
													<span className={styles.applicationDate}>
														<Clock size={12} />
														{new Date(app.appliedAt).toLocaleDateString(
															"pl-PL",
														)}
													</span>
													<button
														className={styles.applicationToggle}
														onClick={() => {
															const details = document.getElementById(
																`app-details-${app.id}`,
															);
															if (details) {
																const isOpen =
																	details.style.display === "block";
																details.style.display = isOpen
																	? "none"
																	: "block";
															}
														}}
													>
														<ChevronRight size={16} />
														Szczegóły
													</button>
												</div>
											</div>

											<div
												id={`app-details-${app.id}`}
												className={styles.applicationDetails}
												style={{ display: "none" }}
											>
												{app.message && (
													<div className={styles.applicationMessage}>
														<div className={styles.applicationMessageLabel}>
															Wiadomość od kandydata
														</div>
														<p>{app.message}</p>
													</div>
												)}

												{app.answers && Object.keys(app.answers).length > 0 && (
													<div className={styles.applicationAnswers}>
														<div className={styles.applicationAnswersLabel}>
															Odpowiedzi na pytania
														</div>
														<div className={styles.applicationAnswersGrid}>
															{vacancy.recruitment?.questions?.map((q) => {
																const answer = app.answers?.[q.id];
																if (!answer) return null;
																return (
																	<div
																		key={q.id}
																		className={styles.applicationAnswerItem}
																	>
																		<div
																			className={
																				styles.applicationAnswerQuestion
																			}
																		>
																			{q.question}
																			{q.required && (
																				<span className={styles.requiredStar}>
																					*
																				</span>
																			)}
																		</div>
																		<div
																			className={styles.applicationAnswerValue}
																		>
																			{q.type === "checkbox"
																				? answer === "true"
																					? "Tak"
																					: "Nie"
																				: answer}
																		</div>
																	</div>
																);
															})}
														</div>
													</div>
												)}

												<div className={styles.applicationActions}>
													<button className={styles.applicationActionAccept}>
														<Check size={14} />
														Zaakceptuj
													</button>
													<button className={styles.applicationActionReject}>
														<X size={14} />
														Odrzuć
													</button>
												</div>
											</div>
										</div>
									))}
							</div>
						</div>
					)}
				</div>

				<div className={styles.modal__footer}>
					<button className={styles.modal__btnCancel} onClick={onClose}>
						Zamknij
					</button>
					{!isFilled && !hasApplied && vacancy.status !== "recruiting" && (
						<button
							className={styles.modal__btnApply}
							onClick={() => {
								onClose();
								if (onOpenApply) {
									onOpenApply(vacancy);
								}
							}}
						>
							<Send size={16} />
							Zgłoś swoją kandydaturę
						</button>
					)}
					{hasApplied && (
						<span className={styles.modal__appliedBadge}>
							<Check size={16} />
							Już zgłoszono
						</span>
					)}
				</div>
			</div>
		</div>
	);
}

interface VacancyFormModalProps {
	isOpen: boolean;
	vacancy: Vacancy | null;
	currentUser: User;
	teams: string[];
	onClose: () => void;
	onSave: (vacancy: Vacancy) => void;
	onDelete?: (vacancy: Vacancy) => void;
	members: { id: string; name: string; email: string }[];
}
function VacancyFormModal({
	isOpen,
	vacancy,
	currentUser,
	teams,
	onClose,
	onSave,
	onDelete,
	members = [],
}: VacancyFormModalProps) {
	const formatDateForInput = (dateString: string) => {
		if (!dateString) return "";
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return "";

			return date.toISOString().slice(0, 16);
		} catch {
			return "";
		}
	};

	const [formData, setFormData] = useState<Partial<Vacancy>>({
		title: "",
		icon: "Briefcase",
		description: "",
		responsibilities: [],
		requirements: [],
		niceToHave: [],
		team: "",
		teamId: "",
		pillar: "",
		contactPerson: {
			name: currentUser.name || "",
			email: "",
			phone: "",
		},
		status: "active",
		recruitment: {
			type: "internal",
			deadline: "",
			questions: [],
		},
	});
	const generateEmail = (name: string): string => {
		if (!name.trim()) return "";

		const parts = name.trim().split(/\s+/);
		if (parts.length < 2) return "";

		const firstNameParts = parts.slice(0, -1);
		const lastName = parts[parts.length - 1];

		const firstName = firstNameParts.join(".");

		const normalize = (str: string) => {
			return str
				.toLowerCase()
				.replace(/[ąćęłńóśźż]/g, (char) => {
					const map: Record<string, string> = {
						ą: "a",
						ć: "c",
						ę: "e",
						ł: "l",
						ń: "n",
						ó: "o",
						ś: "s",
						ź: "z",
						ż: "z",
					};
					return map[char] || char;
				})
				.replace(/[^a-z.]/g, "");
		};

		const normalizedFirstName = normalize(firstName);
		const normalizedLastName = normalize(lastName);

		if (!normalizedFirstName || !normalizedLastName) return "";

		return `${normalizedFirstName}.${normalizedLastName}@silamlodych.pl`;
	};
	useEffect(() => {
		if (vacancy) {
			const contactName =
				vacancy.contactPerson?.name ||
				vacancy.recruitment?.messengerContact ||
				currentUser.name ||
				"Admin";

			const autoEmail = generateEmail(contactName);

			setFormData({
				...vacancy,
				responsibilities: Array.isArray(vacancy.responsibilities)
					? vacancy.responsibilities
					: [],
				requirements: Array.isArray(vacancy.requirements)
					? vacancy.requirements
					: [],
				niceToHave: Array.isArray(vacancy.niceToHave) ? vacancy.niceToHave : [],
				contactPerson: {
					name: contactName,

					email: vacancy.contactPerson?.email || autoEmail || "",
					phone: vacancy.contactPerson?.phone || "",
				},
				recruitment: {
					...vacancy.recruitment,
					deadline: formatDateForInput(vacancy.recruitment?.deadline || ""),
					questions: Array.isArray(vacancy.recruitment?.questions)
						? vacancy.recruitment.questions
						: [],
				},
			});
		}
	}, [vacancy, currentUser.name]);

	const [newResponsibility, setNewResponsibility] = useState("");
	const [newRequirement, setNewRequirement] = useState("");
	const [newNiceToHave, setNewNiceToHave] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [showCustomTeam, setShowCustomTeam] = useState(false);
	const [attachments, setAttachments] = useState<
		{
			id: string;
			name: string;
			size: number;
			type: string;
			url: string;
			uploadedAt: string;
		}[]
	>(vacancy?.attachments || []);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [_contactSearch, setContactSearch] = useState("");
	const [contactSuggestions, setContactSuggestions] = useState<
		{ id: string; name: string; email: string }[]
	>([]);

	if (!isOpen) return null;

	const isEdit = !!vacancy;
	const canManage =
		currentUser.role === "admin" || currentUser.role === "coordinator";

	const formatFileSize = (bytes: number): string => {
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		return (bytes / (1024 * 1024)).toFixed(1) + " MB";
	};

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const file = files[0];

		if (file.size > 10 * 1024 * 1024) {
			alert("Maksymalny rozmiar pliku to 10MB!");
			e.target.value = "";
			return;
		}

		const fileUrl = URL.createObjectURL(file);

		const newAttachment = {
			id: `att-${Date.now()}`,
			name: file.name,
			size: file.size,
			type: file.type,
			url: fileUrl,
			uploadedAt: new Date().toISOString().split("T")[0],
		};

		setAttachments([...attachments, newAttachment]);
		e.target.value = "";
	};

	const removeAttachment = (id: string) => {
		const attachment = attachments.find((a) => a.id === id);
		if (attachment) {
			URL.revokeObjectURL(attachment.url);
		}
		setAttachments(attachments.filter((a) => a.id !== id));
	};

	const filterMembers = (search: string) => {
		if (!search.trim()) {
			setContactSuggestions([]);
			setShowSuggestions(false);
			return;
		}
		const filtered = members.filter(
			(member: { id: string; name: string; email: string }) =>
				member.name.toLowerCase().includes(search.toLowerCase()),
		);
		setContactSuggestions(filtered);
		setShowSuggestions(filtered.length > 0);
	};
	const addItem = (
		list: string[],
		setList: (list: string[]) => void,
		item: string,
	) => {
		if (item.trim() && !list.includes(item.trim())) {
			setList([...list, item.trim()]);
			return true;
		}
		return false;
	};

	const removeItem = (
		list: string[],
		setList: (list: string[]) => void,
		item: string,
	) => {
		setList(list.filter((i) => i !== item));
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.title?.trim()) {
			newErrors.title = "Nazwa stanowiska jest wymagana";
		}

		if (!formData.description?.trim()) {
			newErrors.description = "Opis stanowiska jest wymagany";
		}

		if (!formData.team?.trim()) {
			newErrors.team = "Zespół jest wymagany";
		}

		if (!formData.contactPerson?.name?.trim()) {
			newErrors.contactName = "Imię i nazwisko osoby kontaktowej jest wymagane";
		}

		if (!formData.contactPerson?.email?.trim()) {
			newErrors.contactEmail = "Email osoby kontaktowej jest wymagany";
		} else if (
			!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactPerson.email)
		) {
			newErrors.contactEmail = "Podaj poprawny adres email";
		}

		if (formData.responsibilities && formData.responsibilities.length === 0) {
			newErrors.responsibilities = "Dodaj przynajmniej jeden obowiązek";
		}

		if (formData.requirements && formData.requirements.length === 0) {
			newErrors.requirements = "Dodaj przynajmniej jedno wymaganie";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			const firstError = document.querySelector(".modal__input--error");
			if (firstError) {
				firstError.scrollIntoView({ behavior: "smooth", block: "center" });
			}
			return;
		}

		const formatDateForBackend = (dateString: string) => {
			if (!dateString) return "";
			try {
				const date = new Date(dateString);
				if (isNaN(date.getTime())) return "";
				return date.toISOString();
			} catch {
				return "";
			}
		};

		const now = new Date().toISOString().split("T")[0];
		const saveData: Vacancy = {
			id: vacancy?.id || `vacancy-${Date.now()}`,
			title: formData.title!.trim(),
			icon: formData.icon || "Briefcase",
			description: formData.description!.trim(),
			responsibilities: formData.responsibilities || [],
			requirements: formData.requirements || [],
			niceToHave: formData.niceToHave || [],
			team: formData.team!.trim(),
			teamId: formData.teamId?.trim() || "",
			pillar: formData.pillar?.trim() || "",
			contactPerson: {
				name:
					formData.contactPerson?.name?.trim() || currentUser.name || "Admin",
				email: formData.contactPerson?.email?.trim() || "",
				phone: formData.contactPerson?.phone?.trim() || "",
			},
			createdAt: vacancy?.createdAt || now,
			status: (formData.status as VacancyStatus) || "active",
			applicants: vacancy?.applicants || [],
			filledBy: vacancy?.filledBy,
			attachments: attachments,
			recruitment: {
				type: formData.recruitment?.type || "internal",
				formUrl: formData.recruitment?.formUrl,
				messengerContact: formData.recruitment?.messengerContact,
				questions: formData.recruitment?.questions || [],

				deadline: formatDateForBackend(formData.recruitment?.deadline || ""),
			},
		};
		onSave(saveData);
		onClose();
	};

	const handleDelete = () => {
		if (vacancy && onDelete) {
			if (
				window.confirm(`Czy na pewno chcesz usunąć wakat "${vacancy.title}"?`)
			) {
				onDelete(vacancy);
				onClose();
			}
		}
	};

	const iconCategories = {
		Stanowiska: ["Briefcase", "Target", "Award", "Sparkles", "Star"],
		"Media i Social": [
			"Video",
			"Smartphone",
			"Camera",
			"Palette",
			"Megaphone",
			"MessageCircle",
			"Share2",
			"Globe",
		],
		Inne: [
			"Zap",
			"Heart",
			"TrendingUp",
			"Code",
			"Music",
			"BookOpen",
			"Users",
			"UserPlus",
			"FolderOpen",
			"Settings",
			"Tag",
		],
	};

	return (
		<div className={styles.modalOverlay} onClick={onClose}>
			<div
				className={`${styles.modal} ${styles.modalForm}`}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modal__header}>
					<div className={styles.modal__headerLeft}>
						<Briefcase size={24} className={styles.modal__icon} />
						<h2 className={styles.modal__title}>
							{isEdit ? "Edytuj wakat" : "Dodaj nowy wakat"}
						</h2>
					</div>
					<button className={styles.modal__close} onClick={onClose}>
						<X size={20} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className={styles.modal__form}>
					<div className={styles.modal__body}>
						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>
								Podstawowe informacje
							</h3>

							<div className={styles.modal__formGrid}>
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Nazwa stanowiska{" "}
										<span className={styles.modal__required}>*</span>
									</label>
									<input
										type="text"
										className={`${styles.modal__input} ${errors.title ? styles.modal__inputError : ""}`}
										value={formData.title || ""}
										onChange={(e) => {
											setFormData({ ...formData, title: e.target.value });
											if (errors.title) setErrors({ ...errors, title: "" });
										}}
										placeholder="np. Koordynator Filaru Projektowego"
										required
									/>
									{errors.title && (
										<span className={styles.modal__error}>{errors.title}</span>
									)}
								</div>

								<div className={styles.modal__field}>
									<label className={styles.modal__label}>Ikona</label>
									<select
										className={styles.modal__select}
										value={formData.icon || "Briefcase"}
										onChange={(e) =>
											setFormData({ ...formData, icon: e.target.value })
										}
									>
										<optgroup label="Stanowiska">
											{iconCategories["Stanowiska"].map((icon) => (
												<option key={icon} value={icon}>
													{ICON_LABELS[icon]}
												</option>
											))}
										</optgroup>
										<optgroup label="Media i Social">
											{iconCategories["Media i Social"].map((icon) => (
												<option key={icon} value={icon}>
													{ICON_LABELS[icon]}
												</option>
											))}
										</optgroup>
										<optgroup label="Inne">
											{iconCategories["Inne"].map((icon) => (
												<option key={icon} value={icon}>
													{ICON_LABELS[icon]}
												</option>
											))}
										</optgroup>
									</select>
									<div className={styles.modal__iconPreview}>
										{formData.icon && (
											<>
												{(() => {
													const IconComp = ICON_MAP[formData.icon!];
													return IconComp ? <IconComp size={24} /> : null;
												})()}
												<span className={styles.modal__iconPreviewLabel}>
													{ICON_LABELS[formData.icon] || formData.icon}
												</span>
											</>
										)}
									</div>
								</div>
							</div>

							<div className={styles.modal__field}>
								<label className={styles.modal__label}>
									Opis stanowiska{" "}
									<span className={styles.modal__required}>*</span>
								</label>
								<textarea
									className={`${styles.modal__input} ${styles.modal__textarea} ${errors.description ? styles.modal__inputError : ""}`}
									value={formData.description || ""}
									onChange={(e) => {
										setFormData({ ...formData, description: e.target.value });
										if (errors.description)
											setErrors({ ...errors, description: "" });
									}}
									rows={3}
									placeholder="Opisz krótko czym zajmuje się osoba na tym stanowisku..."
									required
								/>
								{errors.description && (
									<span className={styles.modal__error}>
										{errors.description}
									</span>
								)}
							</div>
						</div>

						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>
								Zakres obowiązków{" "}
								<span className={styles.modal__required}>*</span>
							</h3>
							<div className={styles.modal__field}>
								<div className={styles.modal__tagInput}>
									<input
										type="text"
										className={styles.modal__input}
										value={newResponsibility}
										onChange={(e) => setNewResponsibility(e.target.value)}
										placeholder="Dodaj obowiązek (np. Koordynacja prac zespołów)"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												addItem(
													formData.responsibilities || [],
													(list) =>
														setFormData({
															...formData,
															responsibilities: list,
														}),
													newResponsibility,
												);
												setNewResponsibility("");
												if (errors.responsibilities)
													setErrors({ ...errors, responsibilities: "" });
											}
										}}
									/>
									<button
										type="button"
										className={styles.modal__addBtn}
										onClick={() => {
											const added = addItem(
												formData.responsibilities || [],
												(list) =>
													setFormData({ ...formData, responsibilities: list }),
												newResponsibility,
											);
											if (added) {
												setNewResponsibility("");
												if (errors.responsibilities)
													setErrors({ ...errors, responsibilities: "" });
											}
										}}
									>
										<Plus size={16} />
									</button>
								</div>
								{errors.responsibilities && (
									<span className={styles.modal__error}>
										{errors.responsibilities}
									</span>
								)}
								<div className={styles.modal__tags}>
									{(formData.responsibilities || []).map((item) => (
										<span key={item} className={styles.modal__tag}>
											{item}
											<button
												type="button"
												className={styles.modal__removeTag}
												onClick={() =>
													removeItem(
														formData.responsibilities || [],
														(list) =>
															setFormData({
																...formData,
																responsibilities: list,
															}),
														item,
													)
												}
											>
												<X size={12} />
											</button>
										</span>
									))}
									{(formData.responsibilities || []).length === 0 && (
										<span className={styles.modal__emptyTags}>
											Dodaj obowiązki dla tego stanowiska
										</span>
									)}
								</div>
							</div>
						</div>

						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>
								Wymagania <span className={styles.modal__required}>*</span>
							</h3>
							<div className={styles.modal__field}>
								<div className={styles.modal__tagInput}>
									<input
										type="text"
										className={styles.modal__input}
										value={newRequirement}
										onChange={(e) => setNewRequirement(e.target.value)}
										placeholder="Dodaj wymaganie (np. Doświadczenie w zarządzaniu)"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												addItem(
													formData.requirements || [],
													(list) =>
														setFormData({ ...formData, requirements: list }),
													newRequirement,
												);
												setNewRequirement("");
												if (errors.requirements)
													setErrors({ ...errors, requirements: "" });
											}
										}}
									/>
									<button
										type="button"
										className={styles.modal__addBtn}
										onClick={() => {
											const added = addItem(
												formData.requirements || [],
												(list) =>
													setFormData({ ...formData, requirements: list }),
												newRequirement,
											);
											if (added) {
												setNewRequirement("");
												if (errors.requirements)
													setErrors({ ...errors, requirements: "" });
											}
										}}
									>
										<Plus size={16} />
									</button>
								</div>
								{errors.requirements && (
									<span className={styles.modal__error}>
										{errors.requirements}
									</span>
								)}
								<div className={styles.modal__tags}>
									{(formData.requirements || []).map((item) => (
										<span key={item} className={styles.modal__tag}>
											{item}
											<button
												type="button"
												className={styles.modal__removeTag}
												onClick={() =>
													removeItem(
														formData.requirements || [],
														(list) =>
															setFormData({ ...formData, requirements: list }),
														item,
													)
												}
											>
												<X size={12} />
											</button>
										</span>
									))}
									{(formData.requirements || []).length === 0 && (
										<span className={styles.modal__emptyTags}>
											Dodaj wymagania dla tego stanowiska
										</span>
									)}
								</div>
							</div>
						</div>

						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>Mile widziane</h3>
							<div className={styles.modal__field}>
								<div className={styles.modal__tagInput}>
									<input
										type="text"
										className={styles.modal__input}
										value={newNiceToHave}
										onChange={(e) => setNewNiceToHave(e.target.value)}
										placeholder="Dodaj umiejętność mile widzianą"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												addItem(
													formData.niceToHave || [],
													(list) =>
														setFormData({ ...formData, niceToHave: list }),
													newNiceToHave,
												);
												setNewNiceToHave("");
											}
										}}
									/>
									<button
										type="button"
										className={styles.modal__addBtn}
										onClick={() => {
											addItem(
												formData.niceToHave || [],
												(list) =>
													setFormData({ ...formData, niceToHave: list }),
												newNiceToHave,
											);
											setNewNiceToHave("");
										}}
									>
										<Plus size={16} />
									</button>
								</div>
								<div className={styles.modal__tags}>
									{(formData.niceToHave || []).map((item) => (
										<span key={item} className={styles.modal__tag}>
											{item}
											<button
												type="button"
												className={styles.modal__removeTag}
												onClick={() =>
													removeItem(
														formData.niceToHave || [],
														(list) =>
															setFormData({ ...formData, niceToHave: list }),
														item,
													)
												}
											>
												<X size={12} />
											</button>
										</span>
									))}
									{(formData.niceToHave || []).length === 0 && (
										<span className={styles.modal__emptyTags}>
											Brak dodatkowych wymagań
										</span>
									)}
								</div>
							</div>
						</div>

						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>
								Informacje organizacyjne
							</h3>

							<div className={styles.modal__formGrid}>
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Zespół <span className={styles.modal__required}>*</span>
									</label>
									<select
										className={styles.modal__select}
										value={formData.team || ""}
										onChange={(e) => {
											const value = e.target.value;
											if (value === "other") {
												setShowCustomTeam(true);
												setFormData({
													...formData,
													team: "",
													teamId: "",
												});
											} else if (value) {
												const teamId = value
													.toLowerCase()
													.replace(/[^a-z0-9]/g, "-")
													.replace(/-+/g, "-")
													.replace(/^-|-$/g, "");
												setShowCustomTeam(false);
												setFormData({
													...formData,
													team: value,
													teamId: teamId,
												});
											}
										}}
									>
										<option value="">Wybierz zespół...</option>
										{teams.map((t) => (
											<option key={t} value={t}>
												{t}
											</option>
										))}
										<option key="inny" value="Inny">
											Inny
										</option>
										<option value="other">Inny zespół</option>
									</select>
								</div>
								{showCustomTeam && (
									<div className={styles.modal__field}>
										<label className={styles.modal__label}>
											Nazwa zespołu{" "}
											<span className={styles.modal__required}>*</span>
										</label>
										<input
											type="text"
											className={styles.modal__input}
											value={formData.team || ""}
											onChange={(e) => {
												const value = e.target.value;
												const teamId = value
													.toLowerCase()
													.replace(/[^a-z0-9]/g, "-")
													.replace(/-+/g, "-")
													.replace(/^-|-$/g, "");
												setFormData({
													...formData,
													team: value,
													teamId: teamId,
												});
											}}
											placeholder="Wpisz nazwę nowego zespołu"
											required
										/>
									</div>
								)}

								<div
									className={styles.modal__field}
									style={{ display: "none" }}
								>
									<label className={styles.modal__label}>ID zespołu</label>
									<input
										type="text"
										className={styles.modal__input}
										value={formData.teamId || ""}
										onChange={(e) =>
											setFormData({ ...formData, teamId: e.target.value })
										}
										placeholder="np. social-media"
									/>
								</div>
							</div>
						</div>

						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>Osoba kontaktowa</h3>
							<p className={styles.modal__sectionDescription}>
								Osoba, do której mogą zgłaszać się zainteresowani kandydaci.
							</p>

							<div className={styles.modal__formGrid}>
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Imię i nazwisko{" "}
										<span className={styles.modal__required}>*</span>
									</label>
									<div className={styles.contactInputWrapper}>
										<input
											type="text"
											className={`${styles.modal__input} ${errors.contactName ? styles.modal__inputError : ""}`}
											value={formData.contactPerson?.name || ""}
											onChange={(e) => {
												const value = e.target.value;
												setContactSearch(value);

												const email = generateEmail(value);

												setFormData({
													...formData,
													contactPerson: {
														name: value,
														email: email || formData.contactPerson?.email || "",
														phone: formData.contactPerson?.phone || "",
													},
												});

												filterMembers(value);

												if (errors.contactName)
													setErrors({ ...errors, contactName: "" });
											}}
											onFocus={() => {
												if (contactSuggestions.length > 0) {
													setShowSuggestions(true);
												}
											}}
											onBlur={() => {
												setTimeout(() => {
													setShowSuggestions(false);
												}, 200);
											}}
											placeholder="np. Jan Kowalski"
											required
											autoComplete="off"
										/>

										{showSuggestions && contactSuggestions.length > 0 && (
											<ul className={styles.contactSuggestions}>
												{contactSuggestions.map((member) => (
													<li
														key={member.id}
														className={styles.contactSuggestionItem}
														onMouseDown={(e) => {
															e.preventDefault();
															const email = generateEmail(member.name);
															setFormData({
																...formData,
																contactPerson: {
																	name: member.name,
																	email: email,
																	phone: formData.contactPerson?.phone || "",
																},
															});
															setContactSearch(member.name);
															setContactSuggestions([]);
															setShowSuggestions(false);
															if (errors.contactName)
																setErrors({ ...errors, contactName: "" });
															if (errors.contactEmail)
																setErrors({ ...errors, contactEmail: "" });
														}}
													>
														<div className={styles.contactSuggestionName}>
															<UserIcon size={14} />
															{member.name}
														</div>
														<div className={styles.contactSuggestionEmail}>
															<Mail size={12} />
															{member.email}
														</div>
													</li>
												))}
											</ul>
										)}
									</div>
									{errors.contactName && (
										<span className={styles.modal__error}>
											{errors.contactName}
										</span>
									)}
								</div>

								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Email <span className={styles.modal__required}>*</span>
									</label>
									<input
										type="email"
										className={`${styles.modal__input} ${errors.contactEmail ? styles.modal__inputError : ""}`}
										value={formData.contactPerson?.email || ""}
										onChange={(e) => {
											setFormData({
												...formData,
												contactPerson: {
													name: formData.contactPerson?.name || "",
													email: e.target.value,
													phone: formData.contactPerson?.phone || "",
												},
											});
											if (errors.contactEmail)
												setErrors({ ...errors, contactEmail: "" });
										}}
										placeholder="jan.kowalski@silamlodych.pl"
										required
									/>
									{errors.contactEmail && (
										<span className={styles.modal__error}>
											{errors.contactEmail}
										</span>
									)}
								</div>
							</div>
						</div>

						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>Załączniki</h3>
							<p className={styles.modal__sectionDescription}>
								Dodaj plik z opisem stanowiska lub innymi dokumentami.
								Obsługiwane formaty: PDF, DOC, DOCX, JPG, PNG, itp.
							</p>

							<div className={styles.attachmentsArea}>
								<div className={styles.attachmentUpload}>
									<label
										htmlFor="file-upload"
										className={styles.attachmentUploadLabel}
									>
										<Plus size={20} />
										<span>Dodaj załącznik</span>
									</label>
									<input
										id="file-upload"
										type="file"
										onChange={handleFileUpload}
										className={styles.attachmentUploadInput}
										disabled={!canManage}
									/>
								</div>

								{attachments.length > 0 && (
									<div className={styles.attachmentsList}>
										{attachments.map((file) => (
											<div key={file.id} className={styles.attachmentItem}>
												<div className={styles.attachmentInfo}>
													<div className={styles.attachmentIcon}>
														<FileText size={20} />
													</div>
													<div className={styles.attachmentDetails}>
														<span className={styles.attachmentName}>
															{file.name}
														</span>
														<span className={styles.attachmentMeta}>
															{formatFileSize(file.size)} • {file.uploadedAt}
														</span>
													</div>
												</div>
												<div className={styles.attachmentActions}>
													<a
														href={file.url}
														target="_blank"
														rel="noopener noreferrer"
														className={styles.attachmentActionBtn}
														title="Podgląd"
													>
														<Eye size={16} />
													</a>
													{canManage && (
														<button
															type="button"
															className={`${styles.attachmentActionBtn} ${styles.attachmentActionBtnDanger}`}
															onClick={() => removeAttachment(file.id)}
															title="Usuń"
														>
															<Trash2 size={16} />
														</button>
													)}
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>
								Informacje o rekrutacji
							</h3>

							<div className={styles.modal__formGrid}>
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Typ rekrutacji{" "}
										<span className={styles.modal__required}>*</span>
									</label>
									<select
										className={styles.modal__select}
										value={formData.recruitment?.type || "internal"}
										onChange={(e) => {
											const type = e.target.value as RecruitmentType;
											setFormData({
												...formData,
												recruitment: {
													...formData.recruitment,
													type,
													questions: type === "internal" ? [] : undefined,
													formUrl: undefined,
													messengerContact: undefined,
													deadline: formData.recruitment?.deadline || "",
												},
											});
										}}
										required
									>
										<option value="form">Link do formularza</option>
										<option value="messenger">Wiadomość na Messengerze</option>
										<option value="internal">Formularz na stronie</option>
									</select>
								</div>

								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Termin zgłoszeń{" "}
										<span className={styles.modal__required}>*</span>
									</label>
									<input
										type="datetime-local"
										className={styles.modal__input}
										value={formData.recruitment?.deadline || ""}
										onChange={(e) => {
											setFormData({
												...formData,
												recruitment: {
													...formData.recruitment,
													deadline: e.target.value,
													type: formData.recruitment?.type || "internal",
												},
											});
										}}
										required
									/>
									<span className={styles.modal__helper}>
										Data i godzina, do której można zgłaszać kandydatury
									</span>
								</div>
							</div>

							{formData.recruitment?.type === "form" && (
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Link do formularza{" "}
										<span className={styles.modal__required}>*</span>
									</label>
									<input
										type="url"
										className={styles.modal__input}
										value={formData.recruitment?.formUrl || ""}
										onChange={(e) => {
											setFormData({
												...formData,
												recruitment: {
													...formData.recruitment,
													formUrl: e.target.value,
													type: "form",
													deadline: formData.recruitment?.deadline || "",
												},
											});
										}}
										placeholder="https://forms.google.com/..."
										required
									/>
								</div>
							)}

							{formData.recruitment?.type === "messenger" && (
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Osoba kontaktowa na Messengerze{" "}
										<span className={styles.modal__required}>*</span>
									</label>
									<input
										type="text"
										className={styles.modal__input}
										value={formData.recruitment?.messengerContact || ""}
										onChange={(e) => {
											setFormData({
												...formData,
												recruitment: {
													...formData.recruitment,
													messengerContact: e.target.value,
													type: "messenger",
													deadline: formData.recruitment?.deadline || "",
												},
											});
										}}
										placeholder="np. Jan Kowalski"
										required
									/>
									<span className={styles.modal__helper}>
										Podaj imię i nazwisko osoby, do której można napisać na
										Messengerze
									</span>
								</div>
							)}

							{formData.recruitment?.type === "internal" && (
								<div className={styles.modal__field}>
									<label className={styles.modal__label}>
										Pytania do kandydatów
									</label>
									<QuestionManager
										questions={formData.recruitment?.questions || []}
										onAdd={(q) => {
											setFormData({
												...formData,
												recruitment: {
													...formData.recruitment,
													questions: [
														...(formData.recruitment?.questions || []),
														q,
													],
													type: "internal",
													deadline: formData.recruitment?.deadline || "",
												},
											});
										}}
										onRemove={(id) => {
											setFormData({
												...formData,
												recruitment: {
													...formData.recruitment,
													questions: (
														formData.recruitment?.questions || []
													).filter((q) => q.id !== id),
													type: "internal",
													deadline: formData.recruitment?.deadline || "",
												},
											});
										}}
										onUpdate={(id, updates) => {
											setFormData({
												...formData,
												recruitment: {
													...formData.recruitment,
													questions: (
														formData.recruitment?.questions || []
													).map((q) =>
														q.id === id ? { ...q, ...updates } : q,
													),
													type: "internal",
													deadline: formData.recruitment?.deadline || "",
												},
											});
										}}
									/>
								</div>
							)}
						</div>

						<div className={styles.modal__section}>
							<h3 className={styles.modal__sectionTitle}>Podgląd wakatu</h3>
							<div className={styles.modal__preview}>
								<div className={styles.modal__previewCard}>
									<div className={styles.modal__previewHeader}>
										{formData.icon && (
											<div className={styles.modal__previewIcon}>
												{(() => {
													const IconComp = ICON_MAP[formData.icon!];
													return IconComp ? <IconComp size={24} /> : null;
												})()}
											</div>
										)}
										<div className={styles.modal__previewInfo}>
											<h4>{formData.title || "Nazwa stanowiska"}</h4>
											<span>{formData.team || "Zespół"}</span>
											{formData.pillar && <span>• {formData.pillar}</span>}
										</div>
										<span
											className={`${styles.modal__previewStatus} ${STATUS_COLORS[(formData.status as VacancyStatus) || "active"]}`}
										>
											{
												STATUS_ICONS[
													(formData.status as VacancyStatus) || "active"
												]
											}
											{
												STATUS_LABELS[
													(formData.status as VacancyStatus) || "active"
												]
											}
										</span>
									</div>
									<p className={styles.modal__previewDescription}>
										{formData.description ||
											"Opis stanowiska pojawi się tutaj..."}
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className={styles.modal__actions}>
						{isEdit && onDelete && canManage && (
							<button
								type="button"
								className={styles.modal__btnDelete}
								onClick={handleDelete}
							>
								<Trash2 size={16} />
								Usuń wakat
							</button>
						)}
						<div className={styles.modal__actionsRight}>
							<button
								type="button"
								className={styles.modal__btnCancel}
								onClick={onClose}
							>
								Anuluj
							</button>
							<button type="submit" className={styles.modal__btnSave}>
								{isEdit ? (
									<>
										<Edit size={16} />
										Zapisz zmiany
									</>
								) : (
									<>
										<Plus size={16} />
										Dodaj wakat
									</>
								)}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}

interface QuestionManagerProps {
	questions: FormQuestion[];
	onAdd: (question: FormQuestion) => void;
	onRemove: (id: string) => void;
	onUpdate: (id: string, updates: Partial<FormQuestion>) => void;
	disabled?: boolean;
}

function QuestionManager({
	questions,
	onAdd,
	onRemove,
	onUpdate,
	disabled = false,
}: QuestionManagerProps) {
	const [newQuestion, setNewQuestion] = useState("");
	const [newType, setNewType] = useState<FormQuestion["type"]>("text");
	const [newRequired, setNewRequired] = useState(false);
	const [newOptions, setNewOptions] = useState("");
	const [showAddForm, setShowAddForm] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editQuestion, setEditQuestion] = useState<Partial<FormQuestion>>({});
	const handleAdd = () => {
		if (!newQuestion.trim()) return;

		const question: FormQuestion = {
			id: `q-${Date.now()}`,
			question: newQuestion.trim(),
			type: newType,
			required: newRequired,
			options:
				newType === "select"
					? newOptions.split(",").map((s) => s.trim())
					: undefined,
		};

		onAdd(question);
		setNewQuestion("");
		setNewOptions("");
		setShowAddForm(false);
	};

	return (
		<div className={styles.questionManager}>
			{questions.length > 0 && (
				<div className={styles.questionsList}>
					{questions.map((q) => (
						<div key={q.id} className={styles.questionItem}>
							<div className={styles.questionInfo}>
								<span className={styles.questionText}>
									{q.question}
									{q.required && <span className={styles.requiredStar}>*</span>}
								</span>
								<span className={styles.questionType}>
									{q.type === "text" && "Tekst"}
									{q.type === "number" && "Liczba"}
									{q.type === "textarea" && "Dłuższy tekst"}
									{q.type === "select" && "Wybór"}
									{q.type === "checkbox" && "Checkbox"}
								</span>
								{q.options && q.options.length > 0 && (
									<span className={styles.questionOptions}>
										({q.options.join(", ")})
									</span>
								)}
							</div>

							{!disabled && (
								<div className={styles.questionActions}>
									<button
										type="button"
										className={styles.questionEdit}
										onClick={() => {
											setEditingId(q.id);
											setEditQuestion({
												question: q.question,
												type: q.type,
												required: q.required,
												options: q.options,
											});
										}}
									>
										<Edit size={14} />
									</button>
									<button
										type="button"
										className={styles.questionRemove}
										onClick={() => onRemove(q.id)}
									>
										<X size={16} />
									</button>
								</div>
							)}

							{editingId === q.id && (
								<div className={styles.editQuestionForm}>
									<div className={styles.formField}>
										<label className={styles.modal__label}>Treść pytania</label>
										<input
											type="text"
											className={styles.modal__input}
											value={editQuestion.question || ""}
											onChange={(e) =>
												setEditQuestion({
													...editQuestion,
													question: e.target.value,
												})
											}
										/>
									</div>

									<div className={styles.formRow}>
										<div className={styles.formField}>
											<label className={styles.modal__label}>
												Typ odpowiedzi
											</label>
											<select
												className={styles.modal__select}
												value={editQuestion.type || "text"}
												onChange={(e) =>
													setEditQuestion({
														...editQuestion,
														type: e.target.value as FormQuestion["type"],
													})
												}
											>
												<option value="text">Tekst</option>
												<option value="number">Liczba</option>
												<option value="textarea">Dłuższy tekst</option>
												<option value="select">Wybór z listy</option>
												<option value="checkbox">Checkbox</option>
											</select>
										</div>

										<div className={styles.formField}>
											<label className={styles.modal__label}>
												<input
													type="checkbox"
													checked={editQuestion.required || false}
													onChange={(e) =>
														setEditQuestion({
															...editQuestion,
															required: e.target.checked,
														})
													}
												/>
												Wymagane
											</label>
										</div>
									</div>

									{editQuestion.type === "select" && (
										<div className={styles.formField}>
											<label className={styles.modal__label}>
												Opcje (oddzielone przecinkami)
											</label>
											<input
												type="text"
												className={styles.modal__input}
												value={editQuestion.options?.join(", ") || ""}
												onChange={(e) =>
													setEditQuestion({
														...editQuestion,
														options: e.target.value
															.split(",")
															.map((s) => s.trim())
															.filter(Boolean),
													})
												}
												placeholder="np. Tak, Nie, Może"
											/>
										</div>
									)}

									<div className={styles.formActions}>
										<button
											type="button"
											className={styles.modal__btnCancel}
											onClick={() => setEditingId(null)}
										>
											Anuluj
										</button>
										<button
											type="button"
											className={styles.modal__btnSave}
											onClick={() => {
												if (editQuestion.question) {
													onUpdate(q.id, editQuestion);
													setEditingId(null);
												}
											}}
										>
											Zapisz zmiany
										</button>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{!disabled && (
				<button
					type="button"
					className={styles.addQuestionBtn}
					onClick={() => setShowAddForm(!showAddForm)}
				>
					<Plus size={16} />
					{showAddForm ? "Anuluj" : "Dodaj pytanie"}
				</button>
			)}

			{showAddForm && !disabled && (
				<div className={styles.addQuestionForm}>
					<div className={styles.formField}>
						<label className={styles.modal__label}>Treść pytania</label>
						<input
							type="text"
							className={styles.modal__input}
							value={newQuestion}
							onChange={(e) => setNewQuestion(e.target.value)}
							placeholder="np. Jakie masz doświadczenie?"
						/>
					</div>

					<div className={styles.formRow}>
						<div className={styles.formField}>
							<label className={styles.modal__label}>Typ odpowiedzi</label>
							<select
								className={styles.modal__select}
								value={newType}
								onChange={(e) =>
									setNewType(e.target.value as FormQuestion["type"])
								}
							>
								<option value="text">Tekst</option>
								<option value="number">Liczba</option>
								<option value="textarea">Dłuższy tekst</option>
								<option value="select">Wybór z listy</option>
								<option value="checkbox">Checkbox</option>
							</select>
						</div>

						<div className={styles.formField}>
							<label className={styles.modal__label}>
								<input
									type="checkbox"
									checked={newRequired}
									onChange={(e) => setNewRequired(e.target.checked)}
								/>
								Wymagane
							</label>
						</div>
					</div>

					{newType === "select" && (
						<div className={styles.formField}>
							<label className={styles.modal__label}>
								Opcje (oddzielone przecinkami)
							</label>
							<input
								type="text"
								className={styles.modal__input}
								value={newOptions}
								onChange={(e) => setNewOptions(e.target.value)}
								placeholder="np. Tak, Nie, Może"
							/>
						</div>
					)}

					<div className={styles.formActions}>
						<button
							type="button"
							className={styles.modal__btnCancel}
							onClick={() => setShowAddForm(false)}
						>
							Anuluj
						</button>
						<button
							type="button"
							className={styles.modal__btnSave}
							onClick={handleAdd}
						>
							Dodaj pytanie
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default function Vacancies({ title }: { title?: string }) {
	const [vacancies, setVacancies] = useState<Vacancy[]>([]);
	const [applications, setApplications] = useState<Application[]>([]);
	const [members, setMembers] = useState<
		{ id: string; name: string; email: string }[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedTeam, setSelectedTeam] = useState<string>("all");
	const [selectedStatus, setSelectedStatus] = useState<string>("all");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
	const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
	const [isApplyOpen, setIsApplyOpen] = useState(false);
	const [applyingVacancy, setApplyingVacancy] = useState<Vacancy | null>(null);

	const [confirmDialog, setConfirmDialog] = useState<{
		isOpen: boolean;
		vacancy: Vacancy | null;
	}>({ isOpen: false, vacancy: null });

	const [currentUser, setCurrentUser] = useState<User>({
		id: "",
		name: "",
		role: "member",
		teamId: "",
	});

	const canManage =
		currentUser.role === "admin" ||
		currentUser.role === "board" ||
		currentUser.role === "coordinator";

	const [teams, setTeams] = useState<string[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const token = localStorage.getItem("accessToken");

				if (!token) {
					logger.warn("⚠️ Brak tokenu - przekierowanie do logowania");
					setLoading(false);
					return;
				}

				const userResponse = await fetch("/api/profile", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (userResponse.ok) {
					const userData = await userResponse.json();
					setCurrentUser({
						id: userData.id?.toString() || "",
						name:
							`${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
							"Użytkownik",
						role: userData.role || "member",
						teamId: userData.teamId || "",
					});
				}

				const teamsResponse = await fetch("/api/teams", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (teamsResponse.ok) {
					const teamsData = await teamsResponse.json();
					const teamNames = (Array.isArray(teamsData) ? teamsData : []).map(
						(t: any) => t.name || t,
					);
					setTeams(teamNames.sort());
				}

				const membersResponse = await fetch("/api/members", {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (membersResponse.ok) {
					const membersData = await membersResponse.json();
					const mappedMembers = (
						Array.isArray(membersData) ? membersData : []
					).map((user: any) => ({
						id: user.id?.toString() || "",
						name:
							`${user.first_name || ""} ${user.last_name || ""}`.trim() ||
							user.email ||
							"Nieznany",
						email: user.email || "",
					}));
					setMembers(mappedMembers);
				}

				const vacanciesResponse = await fetch("/api/vacancies", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (vacanciesResponse.ok) {
					const vacanciesData = await vacanciesResponse.json();

					const parseJson = (data: any) => {
						if (!data) return [];
						if (Array.isArray(data)) return data;
						if (typeof data === "string") {
							try {
								let parsed = JSON.parse(data);

								if (typeof parsed === "string") {
									try {
										parsed = JSON.parse(parsed);
									} catch {
										return [];
									}
								}
								return Array.isArray(parsed) ? parsed : [];
							} catch {
								return [];
							}
						}
						return [];
					};

					const mapped = (
						Array.isArray(vacanciesData) ? vacanciesData : []
					).map((v: any) => ({
						id: v.id?.toString() || `vacancy-${Date.now()}`,
						title: v.title || "",
						icon: v.icon || "Briefcase",
						description: v.description || "",
						responsibilities: parseJson(v.responsibilities),
						requirements: parseJson(v.requirements),
						niceToHave: parseJson(v.nice_to_have),
						team: v.team || "",
						teamId: v.team_id || "",
						pillar: v.pillar || "",

						contactPerson: {
							name:
								v.contact_person?.first_name && v.contact_person?.last_name
									? `${v.contact_person.first_name} ${v.contact_person.last_name}`.trim()
									: v.contact_person?.name ||
										v.recruitment_messenger_contact ||
										currentUser.name ||
										"Admin",
							email: v.contact_person?.email || "",
							phone: v.contact_person?.phone || "",
						},
						createdAt:
							v.created_at ||
							v.createdAt ||
							new Date().toISOString().split("T")[0],
						status: v.status || "active",
						applicants: v.applicants || [],
						filledBy: v.filled_by || v.filledBy || undefined,
						attachments: v.attachments || [],
						recruitment: {
							type: v.recruitment_type || v.recruitment?.type || "internal",
							formUrl:
								v.recruitment_form_url || v.recruitment?.formUrl || undefined,
							messengerContact:
								v.recruitment_messenger_contact ||
								v.recruitment?.messengerContact ||
								undefined,
							questions: parseJson(v.questions || v.recruitment?.questions),
							deadline: v.recruitment_deadline || v.recruitment?.deadline || "",
						},
					}));

					setVacancies(mapped);
				} else {
					logger.warn("⚠️ Błąd pobierania wakatów:", vacanciesResponse.status);
					setVacancies([]);
				}
			} catch (error) {
				logger.error("❌ Błąd pobierania danych:", error);
				setVacancies([]);
				setApplications([]);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	useEffect(() => {
		const checkDeadlines = () => {
			const now = new Date();
			const updated = vacancies.map((v) => {
				if (v.recruitment?.deadline) {
					const deadline = new Date(v.recruitment.deadline);
					if (deadline < now && v.status === "active") {
						return { ...v, status: "recruiting" as VacancyStatus };
					}
					if (deadline >= now && v.status === "recruiting") {
						return { ...v, status: "active" as VacancyStatus };
					}
				}
				return v;
			});

			const hasChanges = updated.some(
				(v, i) => v.status !== vacancies[i].status,
			);
			if (hasChanges) {
				setVacancies(updated);
			}
		};

		checkDeadlines();
		const interval = setInterval(checkDeadlines, 60000);
		return () => clearInterval(interval);
	}, [vacancies]);

	const filteredVacancies = useMemo(() => {
		return vacancies
			.filter((vacancy) => {
				const matchesSearch =
					vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					vacancy.description
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					vacancy.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
					vacancy.responsibilities.some((r) =>
						r.toLowerCase().includes(searchTerm.toLowerCase()),
					) ||
					vacancy.requirements.some((r) =>
						r.toLowerCase().includes(searchTerm.toLowerCase()),
					);

				const matchesTeam =
					selectedTeam === "all" || vacancy.team === selectedTeam;
				const matchesStatus =
					selectedStatus === "all" || vacancy.status === selectedStatus;

				return matchesSearch && matchesTeam && matchesStatus;
			})
			.sort((a, b) => {
				const statusOrder = { active: 0, recruiting: 1, filled: 2 };
				const statusCompare = statusOrder[a.status] - statusOrder[b.status];
				if (statusCompare !== 0) return statusCompare;
				return (
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
			});
	}, [vacancies, searchTerm, selectedTeam, selectedStatus]);
	const activeCount = vacancies.filter((v) => v.status === "active").length;

	const handleViewVacancy = (vacancy: Vacancy) => {
		setSelectedVacancy(vacancy);
		setIsDetailOpen(true);
	};

	const handleAddVacancy = () => {
		setEditingVacancy(null);
		setIsFormOpen(true);
	};

	const handleOpenApply = (vacancy: Vacancy) => {
		setApplyingVacancy(vacancy);
		setIsApplyOpen(true);
	};

	const handleSubmitApplication = async (
		vacancy: Vacancy,
		answers: Record<string, string>,
		message: string,
	) => {
		try {
			const token = localStorage.getItem("accessToken");

			const existingApplication = applications.find(
				(a) => a.vacancyId === vacancy.id && a.userId === currentUser.id,
			);
			if (existingApplication) {
				toast.error("Już zgłosiłeś się na to stanowisko!");
				return;
			}

			const finalMessage =
				message && message.trim() !== "" ? message : undefined;

			const newApplication: Application = {
				id: `app-${crypto.randomUUID()}`,
				vacancyId: vacancy.id,
				userId: currentUser.id,
				userName: currentUser.name,
				userEmail: "jan.kowalski@silamlodych.pl",
				message: finalMessage,
				appliedAt: new Date().toISOString().split("T")[0],
				status: "pending",
				answers: answers,
			};

			setApplications([...applications, newApplication]);

			const updatedVacancies = vacancies.map((v) => {
				if (v.id === vacancy.id) {
					return {
						...v,
						applicants: [...(v.applicants || []), currentUser.id],
					};
				}
				return v;
			});
			setVacancies(updatedVacancies);

			setAppliedStatuses((prev) => ({
				...prev,
				[vacancy.id]: true,
			}));

			try {
				logger.debug(
					"📤 Wysyłam zgłoszenie do:",
					`/api/vacancies/${vacancy.id}/apply`,
				);
				logger.debug("📦 Dane:", {
					message: finalMessage || "",
					answers: answers || {},
				});

				const response = await fetch(`/api/vacancies/${vacancy.id}/apply`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						message: finalMessage || "",
						answers: answers || {},
					}),
				});

				logger.debug("📥 Status odpowiedzi:", response.status);

				if (!response.ok) {
					const errorText = await response.text();
					logger.warn("⚠️ Backend zwrócił błąd:", response.status, errorText);
				} else {
					const result = await response.json();
					logger.debug("✅ Zapisano w backendzie:", result);
				}
			} catch (error) {
				logger.warn("⚠️ Backend niedostępny, zapisano lokalnie:", error);
			}

			toast.success(
				`Zgłoszenie na stanowisko "${vacancy.title}" zostało wysłane!`,
			);

			setIsApplyOpen(false);
			setApplyingVacancy(null);
		} catch (error) {
			logger.error("Błąd zgłaszania:", error);
			toast.error("Nie udało się zgłosić na wakat");
		}
	};

	const handleEditVacancy = (vacancy: Vacancy) => {
		setEditingVacancy(vacancy);
		setIsFormOpen(true);
	};

	const handleDeleteVacancy = (vacancy: Vacancy) => {
		setConfirmDialog({ isOpen: true, vacancy });
	};

	const confirmDeleteVacancy = async () => {
		const vacancy = confirmDialog.vacancy;
		if (!vacancy) return;

		setConfirmDialog({ isOpen: false, vacancy: null });

		try {
			const token = localStorage.getItem("accessToken");
			const response = await fetch(`/api/vacancies/${vacancy.id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Błąd usuwania");
			}

			setVacancies(vacancies.filter((v) => v.id !== vacancy.id));
			toast.success(`Wakat "${vacancy.title}" został usunięty.`);
		} catch (error) {
			logger.error("Błąd usuwania:", error);

			setVacancies(vacancies.filter((v) => v.id !== vacancy.id));
			toast.success(`Wakat "${vacancy.title}" został usunięty lokalnie.`);
		}
	};

	const cancelDeleteVacancy = () => {
		setConfirmDialog({ isOpen: false, vacancy: null });
	};

	const handleSaveVacancy = async (vacancy: Vacancy) => {
		try {
			const token = localStorage.getItem("accessToken");
			const isEdit = vacancies.some((v) => v.id === vacancy.id);

			if (isEdit) {
				setVacancies(vacancies.map((v) => (v.id === vacancy.id ? vacancy : v)));
				toast.success(`Wakat "${vacancy.title}" został zaktualizowany!`);
			} else {
				const newVacancy = {
					...vacancy,
					id: `vacancy-${Date.now()}`,
				};
				setVacancies([newVacancy, ...vacancies]);
				toast.success(`Wakat "${vacancy.title}" został dodany!`);
			}

			try {
				const url = isEdit ? `/api/vacancies/${vacancy.id}` : "/api/vacancies";
				const method = isEdit ? "PUT" : "POST";

				await fetch(url, {
					method: method,
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						title: vacancy.title,
						icon: vacancy.icon,
						description: vacancy.description,
						responsibilities: JSON.stringify(vacancy.responsibilities),
						requirements: JSON.stringify(vacancy.requirements),
						nice_to_have: JSON.stringify(vacancy.niceToHave || []),
						team: vacancy.team,
						team_id: vacancy.teamId,
						pillar: vacancy.pillar || "",
						status: vacancy.status,
						recruitment_type: vacancy.recruitment.type,
						recruitment_deadline: vacancy.recruitment.deadline,
						recruitment_form_url: vacancy.recruitment.formUrl || "",
						recruitment_messenger_contact:
							vacancy.recruitment.messengerContact || "",
						questions: vacancy.recruitment.questions || [],
					}),
				});
			} catch (error) {
				logger.warn("⚠️ Backend niedostępny, zapisano lokalnie");
			}
		} catch (error) {
			logger.error("Błąd zapisywania:", error);
			toast.error("Nie udało się zapisać wakatu");
		}
	};

	const handleApply = (vacancy: Vacancy) => {
		const existingApplication = applications.find(
			(a) => a.vacancyId === vacancy.id && a.userId === currentUser.id,
		);
		if (existingApplication) {
			toast.error("Już zgłosiłeś się na to stanowisko!");
			return;
		}

		if (
			window.confirm(
				`Czy chcesz zgłosić swoją kandydaturę na stanowisko "${vacancy.title}"?`,
			)
		) {
			const newApplication: Application = {
				id: `app-${crypto.randomUUID()}`,
				vacancyId: vacancy.id,
				userId: currentUser.id,
				userName: currentUser.name,
				userEmail: "jan.kowalski@silamlodych.pl",
				message: "",
				appliedAt: new Date().toISOString().split("T")[0],
				status: "pending",
			};

			setApplications([...applications, newApplication]);

			const updatedVacancies = vacancies.map((v) => {
				if (v.id === vacancy.id) {
					return {
						...v,
						applicants: [...(v.applicants || []), currentUser.id],
					};
				}
				return v;
			});
			setVacancies(updatedVacancies);

			toast.success(
				`Zgłoszenie na stanowisko "${vacancy.title}" zostało wysłane!`,
			);
		}
	};

	const [appliedStatuses, setAppliedStatuses] = useState<
		Record<string, boolean>
	>({});

	const checkAllApplications = async () => {
		const statuses: Record<string, boolean> = {};
		for (const vacancy of vacancies) {
			try {
				const token = localStorage.getItem("accessToken");
				const response = await fetch(
					`/api/vacancies/${vacancy.id}/check-application`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				);
				if (response.ok) {
					const data = await response.json();
					statuses[vacancy.id] = data.hasApplied;
				}
			} catch (error) {
				console.error("Błąd sprawdzania:", error);
				statuses[vacancy.id] = false;
			}
		}
		setAppliedStatuses(statuses);
	};

	useEffect(() => {
		if (vacancies.length > 0 && currentUser.id) {
			checkAllApplications();
		}
	}, [vacancies, currentUser.id]);

	const hasApplied = (vacancyId: string) => {
		return appliedStatuses[vacancyId] || false;
	};

	const clearFilters = () => {
		setSearchTerm("");
		setSelectedTeam("all");
		setSelectedStatus("all");
	};

	if (loading) {
		return (
			<div className={styles.vacancies}>
				<div className={styles.loading}>
					<div className={styles.loading__spinner}></div>
				</div>
			</div>
		);
	}
	const getWakatLabel = (count: number) => {
		if (count === 1) return "aktywny wakat";
		if (
			count % 10 >= 2 &&
			count % 10 <= 4 &&
			(count % 100 < 12 || count % 100 > 14)
		) {
			return "aktywne wakaty";
		}
		return "aktywnych wakatów";
	};

	return (
		<div className={styles.vacancies}>
			<h1>{title ?? "Wakaty"}</h1>
			<div className={styles.header}>
				<div className={styles.header__left}>
					<h1 className={styles.header__title}>
						Wolne stanowiska w Sile Młodych
					</h1>
					<p className={styles.header__subtitle}>
						Sprawdź aktualnie dostępne funkcje i dołącz do zespołów, w których
						możesz rozwijać swoje umiejętności.
					</p>
					<div className={styles.header__stats}>
						<span className={styles.header__stat}>
							<Briefcase size={18} />
							{activeCount} {getWakatLabel(activeCount)}
						</span>
						<span className={styles.header__stat}>
							<Users size={18} />
							{vacancies.length} wszystkich wakatów
						</span>
					</div>
				</div>
				{canManage && (
					<button className={styles.header__addBtn} onClick={handleAddVacancy}>
						<Plus size={18} />
						Dodaj wakat
					</button>
				)}
			</div>

			<div className={styles.filters}>
				<div className={styles.filters__search}>
					<Search size={18} className={styles.filters__searchIcon} />
					<input
						type="text"
						className={styles.filters__searchInput}
						placeholder="Szukaj wakatów..."
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
						value={selectedStatus}
						onChange={(e) => setSelectedStatus(e.target.value)}
					>
						<option value="all">Wszystkie statusy</option>
						<option value="active">Aktywne</option>
						<option value="recruiting">W trakcie rekrutacji</option>
						<option value="filled">Obsadzone</option>
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

					{(selectedTeam !== "all" ||
						selectedStatus !== "all" ||
						searchTerm) && (
						<button className={styles.filters__reset} onClick={clearFilters}>
							Wyczyść filtry
						</button>
					)}
				</div>
			</div>

			<div
				className={`${styles.vacanciesGrid} ${viewMode === "list" ? styles.vacanciesGridList : ""}`}
			>
				{filteredVacancies.length === 0 ? (
					<div className={styles.emptyState}>
						<Briefcase size={48} className={styles.emptyState__icon} />
						<h3 className={styles.emptyState__title}>Brak wakatów</h3>
						<p className={styles.emptyState__description}>
							{searchTerm || selectedTeam !== "all" || selectedStatus !== "all"
								? "Nie znaleziono wakatów spełniających kryteria wyszukiwania."
								: canManage
									? "Nie ma jeszcze żadnych wakatów. Kliknij 'Dodaj wakat' aby utworzyć pierwszy."
									: "Nie ma jeszcze żadnych wakatów."}
						</p>
						{canManage &&
							filteredVacancies.length === 0 &&
							!searchTerm &&
							selectedTeam === "all" &&
							selectedStatus === "all" && (
								<button
									className={styles.emptyState__btn}
									onClick={handleAddVacancy}
								>
									<Plus size={16} />
									Dodaj pierwszy wakat
								</button>
							)}
					</div>
				) : (
					filteredVacancies.map((vacancy) => (
						<VacancyCard
							key={`${vacancy.id}-${hasApplied(vacancy.id)}`}
							vacancy={vacancy}
							currentUser={currentUser}
							onView={handleViewVacancy}
							onEdit={canManage ? handleEditVacancy : undefined}
							onDelete={canManage ? handleDeleteVacancy : undefined}
							onApply={handleOpenApply}
							viewMode={viewMode}
							hasApplied={hasApplied(vacancy.id)}
						/>
					))
				)}
			</div>

			<VacancyDetailModal
				isOpen={isDetailOpen}
				vacancy={selectedVacancy}
				currentUser={currentUser}
				onClose={() => {
					setIsDetailOpen(false);
					setSelectedVacancy(null);
				}}
				onApply={handleApply}
				onOpenApply={handleOpenApply}
				hasApplied={selectedVacancy ? hasApplied(selectedVacancy.id) : false}
				applications={applications}
			/>

			<VacancyFormModal
				isOpen={isFormOpen}
				vacancy={editingVacancy}
				currentUser={currentUser}
				teams={teams}
				onClose={() => {
					setIsFormOpen(false);
					setEditingVacancy(null);
				}}
				onSave={handleSaveVacancy}
				members={members}
				onDelete={canManage ? handleDeleteVacancy : undefined}
			/>

			<ApplyModal
				isOpen={isApplyOpen}
				vacancy={applyingVacancy}
				currentUser={currentUser}
				onClose={() => {
					setIsApplyOpen(false);
					setApplyingVacancy(null);
				}}
				onSubmit={handleSubmitApplication}
			/>

			<ConfirmDialog
				isOpen={confirmDialog.isOpen}
				title="Potwierdź usunięcie"
				message={`Czy na pewno chcesz usunąć wakat "${confirmDialog.vacancy?.title}"? Tej operacji nie można cofnąć.`}
				confirmText="Usuń"
				cancelText="Anuluj"
				onConfirm={confirmDeleteVacancy}
				onCancel={cancelDeleteVacancy}
			/>
		</div>
	);
}
