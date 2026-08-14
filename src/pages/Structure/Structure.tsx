import React, { useState, useMemo, useEffect, useRef } from "react";
import {
	Users,
	UserCog,
	Megaphone,
	Briefcase,
	GraduationCap,
	ChevronDown,
	ChevronRight,
	Mail,
	Building2,
	Search,
	X,
} from "lucide-react";
import styles from "./Structure.module.css";
import { logger } from "@/utils/logger";

type Person = {
	id: string;
	firstName: string;
	lastName: string;
	role: string;
	email: string;
	avatar?: string;
	province?: string;
};

type Node = {
	id: string;
	name: string;
	role: string;
	icon: React.ReactNode;
	description: string;
	status: "active" | "inactive";
	children: Node[];
	people?: Person[];
	email?: string;
};

const ORGANIZATION_DATA: Node = {
	id: "organization",
	name: "Siła Młodych",
	role: "Struktura organizacyjna",
	icon: <Users size={24} />,
	description: "Organizacja młodzieżowa",
	status: "active",
	people: [],
	children: [],
};

const countAllPeople = (node: Node): number => {
	let count = node.people?.length || 0;
	for (const child of node.children) {
		count += countAllPeople(child);
	}
	return count;
};

interface TreeNodeProps {
	node: Node;
	isRoot?: boolean;
	searchTerm?: string;
	level?: number;
}

function TreeNode({
	node,
	isRoot = false,
	searchTerm = "",
	level = 0,
}: TreeNodeProps) {
	const [isExpanded, setIsExpanded] = useState(isRoot);
	const [showPrompt, setShowPrompt] = useState(true);
	const hasExpandableContent =
		node.children.length > 0 || (node.people && node.people.length > 0);

	const directPeople = useMemo(() => node.people || [], [node]);
	const totalPeopleInNode = useMemo(() => countAllPeople(node), [node]);
	const cardRef = useRef<HTMLDivElement>(null);
	const isHighlighted = useMemo(() => {
		if (!searchTerm) return false;
		const search = searchTerm.toLowerCase();
		return (
			node.name.toLowerCase().includes(search) ||
			node.role.toLowerCase().includes(search) ||
			node.description.toLowerCase().includes(search) ||
			node.people?.some(
				(p) =>
					p.firstName.toLowerCase().includes(search) ||
					p.lastName.toLowerCase().includes(search) ||
					p.role.toLowerCase().includes(search) ||
					p.province?.toLowerCase().includes(search),
			)
		);
	}, [searchTerm, node]);

	const toggleExpand = () => {
		if (hasExpandableContent) {
			setIsExpanded((prev) => !prev);
		}
	};

	const getPeopleText = (count: number) => {
		if (count === 1) return "osoba";
		if (
			count % 10 >= 2 &&
			count % 10 <= 4 &&
			(count % 100 < 10 || count % 100 >= 20)
		) {
			return "osoby";
		}
		return "osób";
	};
	// 👇 DODAJ TEN HANDLER (przed useEffect)
	const handleCardClick = (e: React.MouseEvent) => {
		const target = e.target as HTMLElement;
		// Ignoruj kliknięcia w przyciski i linki
		if (target.closest("button") || target.closest("a")) {
			return;
		}
		toggleExpand();
		if (isRoot) setShowPrompt(false);
	};
	const isPersonHighlighted = useMemo(() => {
		if (!searchTerm) return false;
		const search = searchTerm.toLowerCase();
		return node.people?.some(
			(p) =>
				p.firstName.toLowerCase().includes(search) ||
				p.lastName.toLowerCase().includes(search) ||
				p.role.toLowerCase().includes(search) ||
				p.province?.toLowerCase().includes(search),
		);
	}, [searchTerm, node]);

	// Automatyczne rozwinięcie przy wyszukiwaniu - ZMIEŃ
	useEffect(() => {
		if (searchTerm && (isHighlighted || isPersonHighlighted)) {
			setIsExpanded(true);
		}
	}, [searchTerm, isHighlighted, isPersonHighlighted]);
	return (
		<div className={styles.treeNode}>
			{isRoot && showPrompt && (
				<div className={styles.promptWrapper}>
					<div className={styles.promptContainer}>
						<span className={styles.promptText}>
							Kliknij w blok, żeby go rozwinąć i poznać strukturę Siły Młodych
						</span>
						<div className={styles.promptArrowLine}>
							<div className={styles.promptLine}></div>
							<svg
								className={styles.promptArrowHead}
								width="24"
								height="24"
								viewBox="0 0 24 24"
							>
								<path
									d="M12 4L12 20M12 20L18 14M12 20L6 14"
									stroke="#7c3aed"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</div>
					</div>
				</div>
			)}

			<div
				ref={cardRef} // 👈 DODAJ ref
				className={`${styles.nodeCard} ${isRoot ? styles.nodeRoot : ""} ${isHighlighted ? styles.nodeHighlighted : ""}`}
				onClick={handleCardClick} // 👈 ZMIEŃ NA handleCardClick
			>
				<div className={styles.nodeCard__header}>
					<div
						className={styles.nodeCard__icon}
						style={{ color: isRoot ? "#fff" : "var(--purple-700)" }}
					>
						{node.icon}
					</div>
					<div className={styles.nodeCard__info}>
						<div className={styles.nodeCard__nameRow}>
							<h3 className={styles.nodeCard__name}>{node.name}</h3>
							<span className={styles.nodeCard__status}>
								<span className={styles.nodeCard__statusDot} />
								{node.status === "active" ? "Aktywny" : "Nieaktywny"}
							</span>
						</div>
						<p className={styles.nodeCard__role}>{node.role}</p>
						<p className={styles.nodeCard__description}>{node.description}</p>
					</div>
				</div>
				<div className={styles.nodeCard__footer}>
					<div className={styles.nodeCard__footerLeft}>
						<span className={styles.nodeCard__count}>
							<Users size={14} />
							{totalPeopleInNode} {getPeopleText(totalPeopleInNode)}
						</span>
						{node.email && (
							<a
								href={`mailto:${node.email}`}
								className={styles.nodeCard__email}
								onClick={(e) => e.stopPropagation()}
								title={`Wyślij email do ${node.name}`}
							>
								<Mail size={14} />
								<span>{node.email}</span>
							</a>
						)}
					</div>
					{hasExpandableContent && (
						<button
							className={styles.nodeCard__toggle}
							onClick={(e) => {
								e.stopPropagation();
								toggleExpand(); // 👈 DODAJ TO
							}}
						>
							{isExpanded ? (
								<ChevronDown size={18} />
							) : (
								<ChevronRight size={18} />
							)}
						</button>
					)}
				</div>
			</div>
			{isExpanded && directPeople.length > 0 && (
				<div className={styles.peopleList}>
					{directPeople.map((person) => {
						const isPersonMatched =
							searchTerm &&
							(person.firstName
								.toLowerCase()
								.includes(searchTerm.toLowerCase()) ||
								person.lastName
									.toLowerCase()
									.includes(searchTerm.toLowerCase()) ||
								person.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
								person.province
									?.toLowerCase()
									.includes(searchTerm.toLowerCase()));

						return (
							<div
								key={person.id}
								className={`${styles.personCard} ${isPersonMatched ? styles.personCardHighlighted : ""}`}
							>
								<div className={styles.personCard__avatar}>
									{person.avatar || person.firstName[0] + person.lastName[0]}
								</div>
								<div className={styles.personCard__info}>
									<h4 className={styles.personCard__name}>
										{person.firstName} {person.lastName}
									</h4>
									<p className={styles.personCard__role}>{person.role}</p>
								</div>
								<div className={styles.personCard__details}>
									{person.email && (
										<a
											href={`mailto:${person.email}`}
											className={styles.personCard__link}
											onClick={(e) => e.stopPropagation()}
										>
											<Mail size={14} />
										</a>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{isExpanded && node.children.length > 0 && (
				<div className={styles.childrenContainer}>
					{node.children.map((child) => (
						<TreeNode
							key={child.id}
							node={child}
							searchTerm={searchTerm}
							level={level + 1}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export default function Structure() {
	const [searchTerm, setSearchTerm] = useState("");
	const [structureData, setStructureData] = useState<Node | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchStructure = async () => {
			try {
				setLoading(true);
				const token = localStorage.getItem("accessToken");
				const response = await fetch("/api/structure", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					throw new Error("Błąd pobierania struktury");
				}

				const data = await response.json();
				const iconMap: Record<string, any> = {
					Users: Users,
					UserCog: UserCog,
					Building2: Building2,
					Briefcase: Briefcase,
					Megaphone: Megaphone,
					GraduationCap: GraduationCap,
				};

				const convertNode = (node: any): Node => ({
					...node,
					icon: iconMap[node.icon] ? (
						React.createElement(iconMap[node.icon], {
							size: node.icon === "Users" ? 24 : 22,
						})
					) : (
						<Users size={24} />
					),
					children: node.children?.map(convertNode) || [],
				});

				setStructureData(convertNode(data));
			} catch (error) {
				logger.error("Błąd pobierania struktury:", error);
				setStructureData(ORGANIZATION_DATA);
			} finally {
				setLoading(false);
			}
		};

		fetchStructure();
	}, []);

	const totalMembers = useMemo(() => {
		if (!structureData) return 0;
		return countAllPeople(structureData);
	}, [structureData]);

	const getPolishPlural = (
		count: number,
		singular: string,
		plural: string,
		genitive: string,
	) => {
		const lastDigit = count % 10;
		const lastTwoDigits = count % 100;

		if (count === 1) return singular;
		if (lastTwoDigits >= 12 && lastTwoDigits <= 14) return genitive;
		if (lastDigit >= 2 && lastDigit <= 4) return plural;
		return genitive;
	};

	const totalTeams = useMemo(() => {
		if (!structureData) return 0;
		const countTeams = (node: Node): number => {
			let count = 1;
			for (const child of node.children) {
				count += countTeams(child);
			}
			return count;
		};
		return countTeams(structureData);
	}, [structureData]);

	const totalFilars = useMemo(() => {
		if (!structureData) return 0;
		return structureData.children.length;
	}, [structureData]);

	if (loading) {
		return (
			<div className={styles.structure}>
				<div className={styles.loading}>
					<div className={styles.loading__spinner}></div>
					<p>Ładowanie struktury...</p>
				</div>
			</div>
		);
	}

	if (!structureData) {
		return (
			<div className={styles.structure}>
				<div className={styles.error}>
					<p>Nie udało się załadować struktury.</p>
					<button onClick={() => window.location.reload()}>
						Spróbuj ponownie
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.structure}>
			<div className={styles.header}>
				<div className={styles.header__left}>
					<h1 className={styles.header__title}>Struktura Siły Młodych</h1>
					<p className={styles.header__subtitle}>
						Poznaj strukturę organizacyjną oraz osoby odpowiedzialne za
						poszczególne obszary działalności.
					</p>
				</div>
				<div className={styles.header__stats}>
					<div className={styles.header__stat}>
						<span className={styles.header__statValue}>{totalMembers}</span>
						<span className={styles.header__statLabel}>
							Człon{getPolishPlural(totalMembers, "ek", "ków", "ków")}
						</span>
					</div>
					<div className={styles.header__stat}>
						<span className={styles.header__statValue}>{totalFilars}</span>
						<span className={styles.header__statLabel}>
							Fil{getPolishPlural(totalFilars, "ar", "ary", "arów")}
						</span>
					</div>
					<div className={styles.header__stat}>
						<span className={styles.header__statValue}>{totalTeams}</span>
						<span className={styles.header__statLabel}>
							Zesp{getPolishPlural(totalTeams, "ół", "oły", "ołów")}
						</span>
					</div>
				</div>
			</div>

			<div className={styles.searchWrapper}>
				<div className={styles.searchBox}>
					<Search size={18} className={styles.searchBox__icon} />
					<input
						type="text"
						className={styles.searchBox__input}
						placeholder="Szukaj po imieniu, nazwisku, funkcji, zespole lub województwie..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					{searchTerm && (
						<button
							className={styles.searchBox__clear}
							onClick={() => setSearchTerm("")}
						>
							<X size={16} />
						</button>
					)}
				</div>
			</div>

			<div className={styles.treeContainer}>
				<TreeNode node={structureData} isRoot searchTerm={searchTerm} />
			</div>
		</div>
	);
}
