import { Wrench } from "lucide-react";
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
                    
                    <div className={styles.maintenance__progress}>
                        <div className={styles.maintenance__progressBar}>
                            <div className={styles.maintenance__progressFill}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}