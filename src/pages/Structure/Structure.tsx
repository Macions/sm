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
	List,
	LayoutGrid,
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

const collectAllPeople = (node: Node): Person[] => {
	let people: Person[] = [];

	if (node.people && node.people.length > 0) {
		people = [...people, ...node.people];
	}

	for (const child of node.children) {
		people = [...people, ...collectAllPeople(child)];
	}

	return people;
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

	const handleCardClick = (e: React.MouseEvent) => {
		const target = e.target as HTMLElement;

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
				ref={cardRef}
				className={`${styles.nodeCard} ${isRoot ? styles.nodeRoot : ""} ${isHighlighted ? styles.nodeHighlighted : ""}`}
				onClick={handleCardClick}
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
								toggleExpand();
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
function TextView({ structureData }: { structureData: Node }) {
	const allPeople = useMemo(
		() => collectAllPeople(structureData),
		[structureData],
	);

	// Grupujemy osoby po ID, żeby zebrać wszystkie ich role z kontekstem
	const peopleWithAllRoles = useMemo(() => {
		const peopleMap = new Map<
			string,
			Person & { allRoles: string[]; roleContexts: string[] }
		>();

		const collectWithRoles = (node: Node) => {
			if (node.people) {
				node.people.forEach((person) => {
					let contextualRole = person.role;

					// SPECJALNE PRZYPADKI - ważniejsze od reszty
					// Wiceprezesi - bez "Zarząd"
					if (person.role === "Wiceprezes ds. dokumentów i składek") {
						contextualRole = "Wiceprezes ds. dokumentów i składek";
					} else if (person.role === "Wiceprezes ds. rekrutacji") {
						contextualRole = "Wiceprezes ds. rekrutacji";
					}
					// Prezes
					else if (person.role === "Prezes") {
						contextualRole = "Prezes Zarządu";
					}
					// Członek zarządu
					else if (person.role === "Członek zarządu") {
						contextualRole = "Członek Zarządu";
					}
					// Dyrektor Operacyjny
					else if (person.role === "Dyrektor Operacyjny") {
						contextualRole = "Dyrektor Operacyjny";
					}
					// Rzecznik organizacji
					else if (person.role === "Rzecznik organizacji") {
						contextualRole = "Rzecznik organizacji";
					}
					// Koordynator
					else if (person.role === "Koordynator") {
						contextualRole = `Koordynator ${node.name}`;
					}
					// Pełnomocnicy - pomijamy nazwę węzła i zamieniamy na "Pełnomocnik"
					else if (
						person.role.startsWith("Peł.") ||
						person.role.startsWith("peł.") ||
						person.role.includes("Peł. ") ||
						person.role.includes("peł. ")
					) {
						// Zamieniamy "Peł." lub "peł." na "Pełnomocnik"
						contextualRole = person.role
							.replace(/Peł\.\s*/g, "Pełnomocnik ")
							.replace(/pe?eł\.\s*/g, "Pełnomocnik ")
							.replace(/Peł\s/g, "Pełnomocnik ")
							.replace(/pe?eł\s/g, "Pełnomocnik ");
					}
					// Jeśli ktoś jest w grupie "Pełnomocnicy" i ma rolę "Członek"
					else if (person.role === "Członek" && node.name === "Pełnomocnicy") {
						contextualRole = "Pełnomocnik";
					}
					// Mentorzy - zamieniamy na "Mentor"
					else if (person.role === "Członek" && node.name === "Mentorzy") {
						contextualRole = "Mentor";
					}
					// Inne przypadki - dodajemy kontekst
					else if (
						person.role === "Przewodniczący" ||
						person.role === "Przewodnicząca"
					) {
						contextualRole = `${node.name} (${person.role})`;
					} else if (
						person.role === "Wiceprzewodniczący" ||
						person.role === "Wiceprzewodnicząca"
					) {
						contextualRole = `${node.name} (${person.role})`;
					} else if (person.role === "Sekretarz") {
						contextualRole = `${node.name} (${person.role})`;
					} else if (person.role === "Członek") {
						// Dla zwykłego członka - pokazujemy kontekst
						contextualRole = `${node.name} (Członek)`;
					} else if (person.role.startsWith("Członek ")) {
						contextualRole = person.role;
					} else {
						// Dla innych ról
						contextualRole = `${node.name} (${person.role})`;
					}

					if (peopleMap.has(person.id)) {
						const existing = peopleMap.get(person.id)!;
						if (!existing.allRoles.includes(person.role)) {
							existing.allRoles.push(person.role);
							existing.roleContexts.push(contextualRole);
						}
					} else {
						peopleMap.set(person.id, {
							...person,
							allRoles: [person.role],
							roleContexts: [contextualRole],
						});
					}
				});
			}

			node.children.forEach((child) => collectWithRoles(child));
		};

		collectWithRoles(structureData);
		return Array.from(peopleMap.values());
	}, [structureData]);

	// Funkcja do filtrowania i czyszczenia ról
	const cleanAndFilterRoles = (roleContexts: string[]): string[] => {
		// 1. Najpierw sprawdzamy czy są jakieś ważne role
		const importantRoles = roleContexts.filter((role) => {
			// Pomijamy samego "Członka"
			if (role === "Członek") return false;
			// Pomijamy "Nazwa (Członek)" jeśli jest inna ważniejsza rola
			if (role.includes("(Członek)")) return false;
			return true;
		});

		// 2. Jeśli są ważne role, zwracamy tylko je
		if (importantRoles.length > 0) {
			return importantRoles;
		}

		// 3. Jeśli nie ma ważnych ról, ale jest "Członek" z kontekstem
		const memberRoles = roleContexts.filter((role) => {
			if (role === "Członek") return false;
			if (role.includes("(Członek)")) return true;
			return false;
		});

		if (memberRoles.length > 0) {
			return memberRoles;
		}

		// 4. Jeśli nie ma żadnej roli
		return ["Brak funkcji"];
	};

	// Funkcja do generowania tekstu listy
	const generateListText = useMemo(() => {
		return peopleWithAllRoles
			.map((person, index) => {
				const cleanedRoles = cleanAndFilterRoles(person.roleContexts);
				const roles = cleanedRoles.join(", ");
				return `${index + 1}. ${person.firstName} ${person.lastName}: ${roles}`;
			})
			.join("\n");
	}, [peopleWithAllRoles]);

	// Funkcja do kopiowania całego tekstu
	const copyAllToClipboard = () => {
		navigator.clipboard
			.writeText(generateListText)
			.then(() => {
				const btn = document.getElementById("copyAllBtn");
				if (btn) {
					const originalText = btn.textContent;
					btn.textContent = "Skopiowano!";
					btn.classList.add(styles.copiedSuccess);
					setTimeout(() => {
						btn.textContent = originalText;
						btn.classList.remove(styles.copiedSuccess);
					}, 2000);
				}
			})
			.catch((err) => {
				console.error("Błąd kopiowania:", err);
				alert("Nie udało się skopiować");
			});
	};

	return (
		<div className={styles.textView}>
			<div className={styles.textViewHeader}>
				<div>
					<h2>Lista członków w strukturze SM</h2>
					<p className={styles.textViewSubtitle}>
						Łącznie: {peopleWithAllRoles.length}{" "}
						{peopleWithAllRoles.length === 1
							? "osoba"
							: peopleWithAllRoles.length % 10 >= 2 &&
								  peopleWithAllRoles.length % 10 <= 4 &&
								  (peopleWithAllRoles.length % 100 < 10 ||
										peopleWithAllRoles.length % 100 >= 20)
								? "osoby"
								: "osób"}
					</p>
				</div>
				<button
					id="copyAllBtn"
					className={styles.copyAllButton}
					onClick={copyAllToClipboard}
				>
					Kopiuj listę
				</button>
			</div>

			<div className={styles.textViewBox}>
				<pre className={styles.textViewPre}>{generateListText}</pre>
			</div>
		</div>
	);
}
// Znajdź linię: export default function Structure() {
// ZMIEŃ całą funkcję Structure na poniższą:

export default function Structure() {
	const [searchTerm, setSearchTerm] = useState("");
	const [structureData, setStructureData] = useState<Node | null>(null);
	const [loading, setLoading] = useState(true);
	const [viewMode, setViewMode] = useState<"tree" | "text">("tree");

	// DODAJ tę sekcję:
	const currentUser = useMemo(() => {
		try {
			const userStr = localStorage.getItem("user");
			if (userStr) {
				return JSON.parse(userStr);
			}
		} catch (error) {
			logger.error("Błąd parsowania danych użytkownika:", error);
		}
		return null;
	}, []);

	const isKasperBrudniewicz = useMemo(() => {
		if (!currentUser) return false;
		// Sprawdzamy po emailu - to bezpieczniejsze
		return currentUser.email === "kasper.brudniewicz@silamlodych.pl";
	}, [currentUser]);

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

		const findFilaryNode = (node: Node): Node | null => {
			if (node.name === "Filary organizacji") {
				return node;
			}
			for (const child of node.children) {
				const found = findFilaryNode(child);
				if (found) return found;
			}
			return null;
		};

		const filaryNode = findFilaryNode(structureData);
		if (!filaryNode) return 0;

		return filaryNode.children.filter(
			(child) =>
				child.name.includes("Filar") && !child.name.includes("pozafilarowe"),
		).length;
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

	// ZMIEŃ sekcję return na poniższą:
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
				<div className={styles.header__right}>
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

					{/* DODAJ ten przycisk - tylko dla Kaspera Brudniewicza */}
					{isKasperBrudniewicz && (
						<div className={styles.viewToggle}>
							<button
								className={`${styles.viewToggleBtn} ${viewMode === "tree" ? styles.viewToggleBtnActive : ""}`}
								onClick={() => setViewMode("tree")}
								title="Widok drzewa"
							>
								<LayoutGrid size={18} />
							</button>
							<button
								className={`${styles.viewToggleBtn} ${viewMode === "text" ? styles.viewToggleBtnActive : ""}`}
								onClick={() => setViewMode("text")}
								title="Widok tekstowy"
							>
								<List size={18} />
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Ukryj wyszukiwarkę gdy widok tekstowy jest aktywny */}
			{viewMode === "tree" && (
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
			)}

			<div className={styles.treeContainer}>
				{/* ZMIEŃ to: */}
				{viewMode === "tree" ? (
					<TreeNode node={structureData} isRoot searchTerm={searchTerm} />
				) : (
					<TextView structureData={structureData} />
				)}
			</div>
		</div>
	);
}
