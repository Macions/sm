import React, { useState, useMemo, useRef, useEffect } from "react";
import {
	Users,
	UserCog,
	Megaphone,
	Briefcase,
	GraduationCap,
	ChevronDown,
	ChevronRight,
	Mail,
	Phone,
	MapPin,
	Building2,
	Search,
	X,
	ZoomIn,
	ZoomOut,
	Move,
	Home,
	ArrowDown,
} from "lucide-react";
import styles from "./Structure.module.css";

// ---------------------------------------------------------------------------
// TYPY
// ---------------------------------------------------------------------------
type Person = {
	id: string;
	firstName: string;
	lastName: string;
	role: string;
	email: string;
	phone?: string;
	province?: string;
	avatar?: string;
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

// ---------------------------------------------------------------------------
// DANE FALLBACK (gdy fetch nie działa)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// FUNKCJE POMOCNICZE
// ---------------------------------------------------------------------------
const countAllPeople = (node: Node): number => {
	let count = node.people?.length || 0;
	for (const child of node.children) {
		count += countAllPeople(child);
	}
	return count;
};

// ---------------------------------------------------------------------------
// Komponent węzła
// ---------------------------------------------------------------------------
interface TreeNodeProps {
	node: Node;
	isRoot?: boolean;
	searchTerm?: string;
	scale?: number;
}

function TreeNode({
	node,
	isRoot = false,
	searchTerm = "",
	scale = 1,
}: TreeNodeProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [showPrompt, setShowPrompt] = useState(true);
	const hasExpandableContent =
		node.children.length > 0 || (node.people && node.people.length > 0);

	const directPeople = useMemo(() => node.people || [], [node]);
	const totalPeopleInNode = useMemo(() => countAllPeople(node), [node]);

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
							<ArrowDown size={24} className={styles.promptArrowHead} />
						</div>
					</div>
				</div>
			)}

			<div
				className={`${styles.nodeCard} ${isRoot ? styles.nodeRoot : ""} ${isHighlighted ? styles.nodeHighlighted : ""}`}
				onClick={() => {
					toggleExpand();
					if (isRoot) setShowPrompt(false);
				}}
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
						<button className={styles.nodeCard__toggle}>
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
				<div
					className={styles.peopleList}
					style={{ transform: `scale(${Math.min(1, scale * 1.1)})` }}
				>
					{directPeople.map((person) => (
						<div key={person.id} className={styles.personCard}>
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
									>
										<Mail size={14} />
									</a>
								)}
								{person.phone && (
									<a
										href={`tel:${person.phone}`}
										className={styles.personCard__link}
									>
										<Phone size={14} />
									</a>
								)}
								{person.province && (
									<span className={styles.personCard__province}>
										<MapPin size={14} />
										{person.province}
									</span>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{isExpanded && node.children.length > 0 && (
				<div className={styles.childrenContainer}>
					{node.children.map((child) => (
						<TreeNode
							key={child.id}
							node={child}
							searchTerm={searchTerm}
							scale={scale * 0.95}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Główny komponent
// ---------------------------------------------------------------------------

export default function Structure() {
	// ===== WSZYSTKIE HOOKI NA POCZĄTKU (ZAWSZE PRZED WARUNKAMI) =====
	const [searchTerm, setSearchTerm] = useState("");
	const [structureData, setStructureData] = useState<Node | null>(null);
	const [loading, setLoading] = useState(true);
	const containerRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [pan, setPan] = useState({ x: -410, y: -300 });
	const [zoom, setZoom] = useState(1.2);
	const [isDragging, setIsDragging] = useState(false);
	const [startPan, setStartPan] = useState({ x: 0, y: 0 });
	const [startMouse, setStartMouse] = useState({ x: 0, y: 0 });
	const [lastTouchDistance, setLastTouchDistance] = useState(0);

	const MIN_ZOOM = 0.3;
	const MAX_ZOOM = 2.5;
	const PAN_BOUNDARY = 10000;

	// ===== FETCH - HOOK 1 =====
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
				console.error("Błąd pobierania struktury:", error);
				setStructureData(ORGANIZATION_DATA);
			} finally {
				setLoading(false);
			}
		};

		fetchStructure();
	}, []);

	// ===== STATYSTYKI - HOOKI useMemo =====
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

	// ===== PINCH-TO-ZOOM - HOOK 2 (TYLKO JEDEN!) =====
	useEffect(() => {
		const handleTouchMovePinch = (e: TouchEvent) => {
			if (e.touches.length === 2) {
				e.preventDefault();
				const touch1 = e.touches[0];
				const touch2 = e.touches[1];
				const dx = touch1.clientX - touch2.clientX;
				const dy = touch1.clientY - touch2.clientY;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (lastTouchDistance > 0) {
					const delta = (distance - lastTouchDistance) / 100;
					const newZoom = Math.min(Math.max(zoom + delta, MIN_ZOOM), MAX_ZOOM);
					setZoom(newZoom);
				}
				setLastTouchDistance(distance);
			}
		};

		const handleTouchEndPinch = () => {
			setLastTouchDistance(0);
		};

		const container = containerRef.current;
		if (container) {
			container.addEventListener("touchmove", handleTouchMovePinch, {
				passive: false,
			});
			container.addEventListener("touchend", handleTouchEndPinch);
		}

		return () => {
			if (container) {
				container.removeEventListener("touchmove", handleTouchMovePinch);
				container.removeEventListener("touchend", handleTouchEndPinch);
			}
		};
	}, [zoom, lastTouchDistance]); // Zależności

	// ===== TERAZ MOGĄ BYĆ WARUNKI =====
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

	// ===== FUNKCJE (po warunkach) =====
	const resetView = () => {
		setPan({ x: -410, y: -300 });
		setZoom(1.2);
	};

	const handleZoomIn = () => {
		setZoom((prev) => Math.min(prev + 0.1, MAX_ZOOM));
	};

	const handleZoomOut = () => {
		setZoom((prev) => Math.max(prev - 0.1, MIN_ZOOM));
	};

	const handlePan = (newX: number, newY: number) => {
		const boundedX = Math.max(-PAN_BOUNDARY, Math.min(PAN_BOUNDARY, newX));
		const boundedY = Math.max(-PAN_BOUNDARY, Math.min(PAN_BOUNDARY, newY));
		setPan({ x: boundedX, y: boundedY });
	};

	const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
		if (e.ctrlKey) {
			e.preventDefault();
			const delta = e.deltaY > 0 ? -0.1 : 0.1;
			const newZoom = Math.min(Math.max(zoom + delta, MIN_ZOOM), MAX_ZOOM);

			const rect = containerRef.current?.getBoundingClientRect();
			if (rect) {
				const mouseX = e.clientX - rect.left;
				const mouseY = e.clientY - rect.top;
				const centerX = rect.width / 2;
				const centerY = rect.height / 2;
				const scale = newZoom / zoom;

				const newX =
					mouseX - (mouseX - pan.x) * scale - (mouseX - centerX) * (1 - scale);
				const newY =
					mouseY - (mouseY - pan.y) * scale - (mouseY - centerY) * (1 - scale);

				handlePan(newX, newY);
			}
			setZoom(newZoom);
		}
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		if (e.button !== 0) return;
		if (
			e.target instanceof HTMLElement &&
			e.target.closest("." + styles.nodeCard)
		) {
			return;
		}
		setIsDragging(true);
		setStartMouse({ x: e.clientX, y: e.clientY });
		setStartPan({ x: pan.x, y: pan.y });
		document.body.style.cursor = "grabbing";
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging) return;
		const dx = e.clientX - startMouse.x;
		const dy = e.clientY - startMouse.y;
		handlePan(startPan.x + dx, startPan.y + dy);
	};

	const handleMouseUp = () => {
		setIsDragging(false);
		document.body.style.cursor = "";
	};

	const handleMouseLeave = () => {
		if (isDragging) {
			setIsDragging(false);
			document.body.style.cursor = "";
		}
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		if (
			e.target instanceof HTMLElement &&
			e.target.closest("." + styles.nodeCard)
		) {
			return;
		}
		if (e.touches.length === 1) {
			setIsDragging(true);
			setStartMouse({ x: e.touches[0].clientX, y: e.touches[0].clientY });
			setStartPan({ x: pan.x, y: pan.y });
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!isDragging || e.touches.length !== 1) return;
		e.preventDefault();
		const dx = e.touches[0].clientX - startMouse.x;
		const dy = e.touches[0].clientY - startMouse.y;
		handlePan(startPan.x + dx, startPan.y + dy);
	};

	const handleTouchEnd = () => {
		setIsDragging(false);
	};

	// ===== RENDER =====
	return (
		<div className={styles.structure}>
			{/* Nagłówek */}
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

			{/* Wyszukiwarka */}
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

			{/* Sterowanie mapą */}
			<div className={styles.mapControls}>
				<button
					onClick={resetView}
					className={styles.mapControls__btn}
					title="Reset widoku"
				>
					<Home size={18} />
				</button>
				<button
					onClick={handleZoomIn}
					className={styles.mapControls__btn}
					title="Przybliż"
				>
					<ZoomIn size={18} />
				</button>
				<button
					onClick={handleZoomOut}
					className={styles.mapControls__btn}
					title="Oddal"
				>
					<ZoomOut size={18} />
				</button>
				<div className={styles.mapControls__zoom}>
					{Math.round(zoom * 100)}%
				</div>
				<div className={styles.mapControls__hint}>
					<Move size={14} />
					<span>Przeciągnij + Ctrl</span>
				</div>
			</div>

			{/* Nieskończona mapa */}
			<div
				className={styles.mapContainer}
				ref={containerRef}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseLeave}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				onWheel={handleWheel}
			>
				<div className={styles.mapGrid} />

				<div
					className={styles.mapContent}
					ref={contentRef}
					style={{
						transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
						transformOrigin: "center center",
						transition: isDragging
							? "none"
							: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
					}}
				>
					<TreeNode
						node={structureData}
						isRoot
						searchTerm={searchTerm}
						scale={1}
					/>
				</div>
			</div>

			{/* Wskazówka */}
			<div className={styles.dragHint}>
				<span className={styles.dragHint__icon}>↔</span>
				<span>Przeciągnij aby przesuwać mapę • Ctrl + scroll aby zoom</span>
			</div>
		</div>
	);
}
