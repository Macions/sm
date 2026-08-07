import { useState } from "react";
import { toast } from "react-hot-toast";
import { Star, X } from "lucide-react";
import styles from "./TaskRatingModal.module.css";

interface Task {
	id: string;
	title: string;
}

interface TaskRatingModalProps {
	isOpen: boolean;
	task: Task | null;
	onClose: () => void;
	onSubmit: (taskId: string, rating: number, comment: string) => void;
}

export function TaskRatingModal({
	isOpen,
	task,
	onClose,
	onSubmit,
}: TaskRatingModalProps) {
	const [rating, setRating] = useState(0);
	const [hoveredRating, setHoveredRating] = useState(0);
	const [comment, setComment] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (!isOpen || !task) return null;

	const handleSubmit = async () => {
		if (rating === 0) {
			toast.error("❌ Oceń zadanie gwiazdkami!");
			return;
		}

		setIsSubmitting(true);
		try {
			await onSubmit(task.id, rating, comment || "");
			// ✅ Toast i zamknięcie są teraz w onSubmit
		} catch (error) {
			// Error jest obsługiwany w onSubmit
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleClose = () => {
		setRating(0);
		setComment("");
		onClose();
	};

	const getRatingLabel = (value: number) => {
		const labels = {
			1: "Bardzo łatwe",
			2: "Łatwe",
			3: "Średnie",
			4: "Trudne",
			5: "Bardzo trudne",
		};
		return labels[value as keyof typeof labels] || "";
	};

	return (
		<div className={styles.overlay} onClick={handleClose}>
			<div className={styles.modal} onClick={(e) => e.stopPropagation()}>
				<button className={styles.closeBtn} onClick={handleClose}>
					<X size={20} />
				</button>

				<div className={styles.header}>
					<h2 className={styles.title}>Oceń wykonane zadanie</h2>
				</div>

				<div className={styles.body}>
					{/* Ocena ogólna */}
					<div className={styles.section}>
						<label className={styles.label}>
							Poziom trudności <span className={styles.required}>*</span>
						</label>
						<div className={styles.starsContainer}>
							{[1, 2, 3, 4, 5].map((star) => (
								<button
									key={star}
									className={`${styles.starBtn} ${star <= (hoveredRating || rating) ? styles.active : ""}`}
									onMouseEnter={() => setHoveredRating(star)}
									onMouseLeave={() => setHoveredRating(0)}
									onClick={() => setRating(star)}
								>
									<Star
										size={36}
										fill={
											star <= (hoveredRating || rating) ? "#f59e0b" : "none"
										}
										stroke={
											star <= (hoveredRating || rating) ? "#f59e0b" : "#d1d5db"
										}
									/>
								</button>
							))}
						</div>
						{rating > 0 && (
							<p className={styles.ratingLabel}>{getRatingLabel(rating)}</p>
						)}
					</div>

					{/* Komentarz */}
					<div className={styles.section}>
						<label className={styles.label}>
							Komentarz <span className={styles.optional}>(opcjonalnie)</span>
						</label>
						<textarea
							className={styles.textarea}
							value={comment}
							onChange={(e) => setComment(e.target.value)}
							placeholder="Co było dobre? Co można poprawić?"
							rows={4}
						/>
					</div>
				</div>

				<div className={styles.footer}>
					<button className={styles.cancelBtn} onClick={handleClose}>
						Anuluj
					</button>
					<button
						className={styles.submitBtn}
						onClick={handleSubmit}
						disabled={isSubmitting || rating === 0}
					>
						{isSubmitting ? "Zapisywanie..." : "Wyślij ocenę"}
					</button>
				</div>
			</div>
		</div>
	);
}
