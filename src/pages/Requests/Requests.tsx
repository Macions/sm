import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarOff, Users } from "lucide-react";
import Leave from "../Leave/Leave";
import PillarChangeTab from "./tabs/PillarChangeTab";
import styles from "./Requests.module.css";

type Tab = "leave" | "pillar-change";

export default function Requests() {
	const [params, setParams] = useSearchParams();
	const urlTab = (params.get("tab") as Tab) || "leave";
	const [tab, setTab] = useState<Tab>(urlTab);

	useEffect(() => {
		setTab(urlTab);
	}, [urlTab]);

	const switchTab = (t: Tab) => {
		setTab(t);
		setParams({ tab: t }, { replace: true });
	};

	return (
		<div className={styles.page}>
			<div className={styles.tabs}>
				<button
					className={`${styles.tab} ${tab === "leave" ? styles.tabActive : ""}`}
					onClick={() => switchTab("leave")}
				>
					<CalendarOff size={16} />
					Urlop
				</button>
				<button
					className={`${styles.tab} ${
						tab === "pillar-change" ? styles.tabActive : ""
					}`}
					onClick={() => switchTab("pillar-change")}
				>
					<Users size={16} />
					Zmiana filaru
				</button>
			</div>

			<div className={styles.tabContent}>
				{tab === "leave" && <Leave />}
				{tab === "pillar-change" && <PillarChangeTab />}
			</div>
		</div>
	);
}
