// src/pages/Maintenance/Maintenance.tsx
import { Wrench, Clock, Mail, AlertTriangle } from "lucide-react";
import styles from "./Maintenance.module.css";

export default function Maintenance() {
    return (
        <div className={styles.maintenance}>
            <div className={styles.maintenance__overlay}>
                <div className={styles.maintenance__content}>
                    <div className={styles.maintenance__iconWrapper}>
                        <div className={styles.maintenance__icon}>
                            <Wrench size={48} />
                        </div>
                    </div>

                    <h1 className={styles.maintenance__title}>
                        Prace serwisowe
                    </h1>

                    <div className={styles.maintenance__badge}>
                        <AlertTriangle size={16} />
                        <span>Trwa aktualizacja systemu</span>
                    </div>

                    <p className={styles.maintenance__description}>
                        Przepraszamy za niedogodności. Strona jest obecnie w trakcie prac serwisowych.
                        Wrócimy wkrótce z nowymi funkcjonalnościami!
                    </p>

                    <div className={styles.maintenance__info}>
                        <div className={styles.maintenance__infoItem}>
                            <Clock size={18} />
                            <span>Szacowany czas: około 30 minut</span>
                        </div>
                        <div className={styles.maintenance__infoItem}>
                            <Mail size={18} />
                            <span>kontakt@silamlodych.pl</span>
                        </div>
                    </div>

                    <div className={styles.maintenance__progress}>
                        <div className={styles.maintenance__progressBar}>
                            <div className={styles.maintenance__progressFill}></div>
                        </div>
                        <span className={styles.maintenance__progressText}>Postęp prac</span>
                    </div>
                </div>
            </div>
        </div>
    );
}