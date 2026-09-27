import { useEffect, useState } from "react";
import { Mail, Phone, Crown } from "lucide-react";
import styles from "./BoardSection.module.css";

interface BoardMember {
	id: number;
	role_title: string;
	responsibilities: string | null;
	order: number;
	user: {
		id: number;
		first_name: string;
		last_name: string;
		email: string;
		phone: string | null;
		avatar: string | null;
		province: string | null;
		functional_role: string | null;
	};
}

export default function BoardSection() {
	const [board, setBoard] = useState<BoardMember[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const token =
			localStorage.getItem("accessToken") || localStorage.getItem("token");
		fetch("/api/board", {
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			credentials: "include",
		})
			.then((r) => r.json())
			.then((data) => setBoard(Array.isArray(data) ? data : []))
			.catch(() => setBoard([]))
			.finally(() => setLoading(false));
	}, []);

	if (loading || board.length === 0) return null;

	return (
		<section className={styles.section}>
			<div className={styles.sectionHeader}>
				<Crown size={22} className={styles.sectionIcon} />
				<h2 className={styles.sectionTitle}>Zarząd Siły Młodych</h2>
			</div>

			<div className={styles.grid}>
				{board.map((b) => (
					<div key={b.id} className={styles.card}>
						<div className={styles.cardHeader}>
							<div className={styles.avatar}>
								{b.user.avatar ? (
									<img src={b.user.avatar} alt="" />
								) : (
									<>
										{b.user.first_name?.[0] || "?"}
										{b.user.last_name?.[0] || ""}
									</>
								)}
							</div>
							<div className={styles.cardInfo}>
								<div className={styles.cardName}>
									{b.user.first_name} {b.user.last_name}
								</div>
								<div className={styles.cardRole}>{b.role_title}</div>
							</div>
						</div>

						{b.responsibilities && (
							<div className={styles.responsibilities}>
								{b.responsibilities}
							</div>
						)}

						<div className={styles.cardFooter}>
							{b.user.email && (
								<a href={`mailto:${b.user.email}`} className={styles.cardLink}>
									<Mail size={14} />
									<span>{b.user.email}</span>
								</a>
							)}
							{b.user.phone && (
								<a href={`tel:${b.user.phone}`} className={styles.cardLink}>
									<Phone size={14} />
									<span>{b.user.phone}</span>
								</a>
							)}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
