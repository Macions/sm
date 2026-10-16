import { useEffect, useState } from "react";
import { Users, Crown, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./Grants.module.css";

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    functionalRole: string | null;
    roleInTeam: string | null;
    isLeader: boolean;
}

export function GrantTeamSection() {
    const [members, setMembers] = useState<Member[]>([]);
    const [teamName, setTeamName] = useState<string>("Zespół grantowy");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        fetch("/api/grant-team/members", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => (r.ok ? r.json() : { members: [] }))
            .then((d) => {
                setMembers(d.members || []);
                if (d.teamName) setTeamName(d.teamName);
            })
            .catch(() => setMembers([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading || members.length === 0) return null;

    const getInitials = (m: Member) =>
        ((m.firstName?.[0] || "") + (m.lastName?.[0] || "")).toUpperCase() || "?";


    const sorted = [...members].sort((a, b) => {
        if (a.isLeader && !b.isLeader) return -1;
        if (!a.isLeader && b.isLeader) return 1;
        return (a.lastName || "").localeCompare(b.lastName || "");
    });

    return (
        <section className={styles.teamSection}>
            <header className={styles.teamSection__header}>
                <div className={styles.teamSection__titleWrap}>
                    <div className={styles.teamSection__icon}>
                        <Users size={18} />
                    </div>
                    <div>
                        <h2 className={styles.teamSection__title}>{teamName}</h2>
                        <p className={styles.teamSection__subtitle}>
                            {members.length}{" "}
                            {members.length === 1
                                ? "osoba pracuje"
                                : members.length < 5
                                    ? "osoby pracują"
                                    : "osób pracuje"}{" "}
                            nad grantami
                        </p>
                    </div>
                </div>

                <span className={styles.teamSection__count}>
                    {members.length}
                </span>
            </header>

            <div className={styles.teamSection__grid}>
                {sorted.map((m) => (
                    <button
                        key={m.id}
                        type="button"
                        className={styles.teamMember}
                        onClick={() => navigate(`/members/${m.id}`)}
                        title={`Zobacz profil: ${m.firstName} ${m.lastName}`}
                    >
                        <span className={styles.teamMember__avatar}>
                            {getInitials(m)}
                            {m.isLeader && (
                                <span
                                    className={styles.teamMember__crown}
                                    title="Lider zespołu"
                                >
                                    <Crown size={11} />
                                </span>
                            )}
                        </span>

                        <span className={styles.teamMember__body}>
                            <span className={styles.teamMember__name}>
                                {m.firstName} {m.lastName}
                            </span>

                            {m.functionalRole && (
                                <span className={styles.teamMember__role}>
                                    {m.functionalRole}
                                </span>
                            )}

                            {m.email && (
                                <span className={styles.teamMember__email}>
                                    <Mail size={11} />
                                    {m.email}
                                </span>
                            )}
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}