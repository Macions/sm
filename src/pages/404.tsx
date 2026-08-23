import { Link } from "react-router-dom";
import styles from "./404.module.css"; 

export default function NotFound() {
    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <h1 className={styles.title}>404</h1>
                <p className={styles.subtitle}>Fioletowa dziura!</p>
                <p className={styles.text}>
                    Ups! Ta strona wyparowała szybciej niż miska ryżu od Maksyma...
                </p>
                <div className={styles.buttons}>
                    <Link to="/dashboard" className={styles.link}>
                        Wracaj do roboty, zadania czekają!
                    </Link>
                </div>
            </div>
        </div>
    );
}