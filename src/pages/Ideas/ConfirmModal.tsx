// frontend/src/pages/Ideas/ConfirmModal.tsx
import { AlertTriangle, X } from "lucide-react";
import styles from "./Ideas.module.css";

interface Props {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "danger";
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    isOpen,
    title = "Potwierdź",
    message,
    confirmLabel = "Tak",
    cancelLabel = "Anuluj",
    variant = "default",
    busy = false,
    onConfirm,
    onCancel,
}: Props) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={busy ? undefined : onCancel}>
            <div
                className={`${styles.modal} ${styles.confirmModal}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <h2 className={styles.confirmTitle}>
                        <AlertTriangle
                            size={18}
                            className={
                                variant === "danger"
                                    ? styles.confirmIconDanger
                                    : styles.confirmIcon
                            }
                        />
                        {title}
                    </h2>
                    <button
                        className={styles.closeBtn}
                        onClick={onCancel}
                        disabled={busy}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <p className={styles.confirmMessage}>{message}</p>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        className={styles.cancelBtn}
                        onClick={onCancel}
                        disabled={busy}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        className={
                            variant === "danger"
                                ? `${styles.saveBtn} ${styles.danger}`
                                : styles.saveBtn
                        }
                        onClick={onConfirm}
                        disabled={busy}
                    >
                        {busy ? "..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}