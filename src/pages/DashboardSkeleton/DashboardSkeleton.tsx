import styles from "../Dashboard/Dashboard.module.css";

export function DashboardSkeleton() {
	return (
		<>
			
			<div className={styles.welcomeCard}>
				<div className={styles.welcomeCard__content}>
					<div
						className={`${styles.skeleton} ${styles.skeletonCircle}`}
						style={{ width: 60, height: 60 }}
					/>
					<div className={styles.welcomeCard__text}>
						<div
							className={styles.skeleton}
							style={{ width: 200, height: 28, marginBottom: 8 }}
						/>
						<div
							className={styles.skeleton}
							style={{ width: 150, height: 18 }}
						/>
					</div>
				</div>
			</div>

			
			<div className={styles.stats}>
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className={styles.statCard}>
						<div
							className={`${styles.skeleton} ${styles.skeletonCircle}`}
							style={{ width: 48, height: 48 }}
						/>
						<div className={styles.statCard__content}>
							<div
								className={styles.skeleton}
								style={{ width: 80, height: 14, marginBottom: 6 }}
							/>
							<div
								className={styles.skeleton}
								style={{ width: 60, height: 24 }}
							/>
						</div>
					</div>
				))}
			</div>

			
			<div className={styles.bottomSection}>
				<div className={styles.notifications}>
					<div
						className={styles.skeleton}
						style={{ width: 150, height: 24, marginBottom: 16 }}
					/>
					{[1, 2, 3].map((i) => (
						<div key={i} className={styles.notification}>
							<div
								className={`${styles.skeleton} ${styles.skeletonCircle}`}
								style={{ width: 32, height: 32 }}
							/>
							<div className={styles.notification__content}>
								<div
									className={styles.skeleton}
									style={{ width: "80%", height: 14 }}
								/>
								<div
									className={styles.skeleton}
									style={{ width: "40%", height: 12 }}
								/>
							</div>
						</div>
					))}
				</div>

				<div className={styles.quickActions}>
					<div
						className={styles.skeleton}
						style={{ width: 120, height: 24, marginBottom: 16 }}
					/>
					<div className={styles.quickActions__grid}>
						{[1, 2, 3, 4].map((i) => (
							<div
								key={i}
								className={styles.skeleton}
								style={{ height: 80, borderRadius: 12 }}
							/>
						))}
					</div>
				</div>
			</div>
		</>
	);
}
