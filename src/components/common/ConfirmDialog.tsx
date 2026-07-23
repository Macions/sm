import { useEffect } from "react";
import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
	isOpen: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({
	isOpen,
	title,
	message,
	confirmText = "Usuń",
	cancelText = "Anuluj",
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCancel();
		};
		if (isOpen) {
			document.addEventListener("keydown", handleEsc);
		}
		return () => document.removeEventListener("keydown", handleEsc);
	}, [isOpen, onCancel]);

	if (!isOpen) return null;

	return (
		<div className={styles.overlay} onClick={onCancel}>
			<div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
				<h3 className={styles.title}>{title}</h3>
				<p className={styles.message}>{message}</p>
				<div className={styles.actions}>
					<button className={styles.cancelBtn} onClick={onCancel}>
						{cancelText}
					</button>
					<button className={styles.confirmBtn} onClick={onConfirm}>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	);
}
