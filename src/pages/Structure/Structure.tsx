import { useState, useMemo, useRef, useEffect } from "react";
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
// DANE - ORGANIZATION_DATA
// ---------------------------------------------------------------------------
const ORGANIZATION_DATA: Node = {
	id: "organization",
	name: "Siła Młodych",
	role: "Struktura organizacyjna",
	icon: <Users size={24} />,
	description:
		"Organizacja młodzieżowa działająca w obszarze projektów, debat, rzecznictwa oraz rozwoju młodych osób.",
	status: "active",

	people: [],

	children: [

		// =========================
		// ZARZĄD
		// =========================

		{
			id: "board",
			name: "Zarząd",
			role: "Najwyższy organ zarządzający",
			icon: <UserCog size={22} />,
			description:
				"Kierowanie organizacją, podejmowanie decyzji strategicznych i nadzór nad działaniami.",
			status: "active",
			email: "zarzad@silamlodych.pl",
			children: [],

			people: [
				{
					id: "1",
					firstName: "Maksym",
					lastName: "Marczak",
					role: "Prezes",
					email: "maksym.marczak@silamlodych.pl",
				},
				{
					id: "2",
					firstName: "Krzysztof",
					lastName: "Korbut",
					role: "Wiceprezes - odpowiedzialny za rekrutację",
					email: "krzysztof.korbut@silamlodych.pl",
				},
				{
					id: "3",
					firstName: "Kasper",
					lastName: "Brudniewicz",
					role: "Wiceprezes - dokumenty i składki",
					email: "kasper.brudniewicz@silamlodych.pl",
				},
				{
					id: "4",
					firstName: "Mai Lan",
					lastName: "Nguyen",
					role: "Członek Zarządu - media",
					email: "mailan.nguyen@silamlodych.pl",
				},
			],
		},


		// =========================
		// DYREKCJA
		// =========================

		{
			id: "directors",
			name: "Dyrekcja",
			role: "Zarządzanie operacyjne",
			icon: <Building2 size={22} />,
			description:
				"Nadzór nad bieżącym funkcjonowaniem organizacji.",
			status: "active",

			children: [],

			people: [
				{
					id: "5",
					firstName: "Jakub",
					lastName: "Patrowicz",
					role: "Główny Dyrektor Operacyjny",
					email: "jakub.patrowicz@silamlodych.pl",
				},
				{
					id: "6",
					firstName: "Oliwier",
					lastName: "Szulejko",
					role: "Rzecznik - odpowiedzialny za frekwencję",
					email: "oliwier.szulejko@silamlodych.pl",
				},
			],
		},


		// =========================
		// ORGANY KONTROLNE
		// =========================

		{
			id: "control",
			name: "Organy kontrolne",
			role: "Niezależny nadzór",
			icon: <Building2 size={22} />,
			description:
				"Organy odpowiedzialne za kontrolę oraz rozwiązywanie sporów.",
			status: "active",

			people: [],

			children: [

				{
					id: "audit",
					name: "Komisja Rewizyjna",
					role: "Kontrola działalności organizacji",
					icon: <Building2 size={20} />,
					description:
						"Sprawowanie kontroli nad działaniami organizacji.",
					status: "active",
					email: "kr@silamlodych.pl",
					children: [],

					people: [
						{
							id: "7",
							firstName: "Adam",
							lastName: "Kowalczyk",
							role: "Członek Komisji Rewizyjnej",
							email: "adam.kowalczyk@silamlodych.pl",
						},
						{
							id: "8",
							firstName: "Wiktoria",
							lastName: "Bryś",
							role: "Członek Komisji Rewizyjnej",
							email: "wiktoria.brys@silamlodych.pl",
						},
						{
							id: "9",
							firstName: "Iga",
							lastName: "Drzewiecka",
							role: "Członek Komisji Rewizyjnej",
							email: "iga.drzewiecka@silamlodych.pl",
						},
					],
				},


				{
					id: "court",
					name: "Sąd Koleżeński",
					role: "Rozwiązywanie sporów",
					icon: <Building2 size={20} />,
					description:
						"Organ zajmujący się sprawami członkowskimi.",
					status: "active",
					email: "sk@silamlodych.pl",
					children: [],

					people: [
						{
							id: "10",
							firstName: "Adrian",
							lastName: "Wróblewski",
							role: "Członek Sądu Koleżeńskiego",
							email: "adrian.wroblewski@silamlodych.pl",
						},
						{
							id: "11",
							firstName: "Jan",
							lastName: "Augustyniak",
							role: "Członek Sądu Koleżeńskiego",
							email: "jan.augustyniak@silamlodych.pl",
						},
						{
							id: "12",
							firstName: "Oliwier",
							lastName: "Szulejko",
							role: "Członek Sądu Koleżeńskiego",
							email: "oliwier.szulejko@silamlodych.pl",
						},
					],
				},
			],
		},


		// =========================
		// FILARY
		// =========================

		{
			id: "pillars",
			name: "Filary organizacji",
			role: "Główne obszary działalności",
			icon: <Briefcase size={22} />,
			description:
				"Najważniejsze obszary realizacji działań organizacji.",
			status: "active",

			people: [],

			children: [

				{
					id: "projects",
					name: "Filar Projektowy",
					role: "Projekty i inicjatywy",
					icon: <Briefcase size={20} />,
					description:
						"Tworzenie i prowadzenie projektów.",
					status: "active",
					children: [],

					people: [
						{
							id: "13",
							firstName: "Zosia",
							lastName: "Wartacz",
							role: "Koordynator Filaru Projektowego",
							email: "zosia.wartacz@silamlodych.pl"
						},
						{
							id: "14",
							firstName: "Zuzanna",
							lastName: "Wojtusiak",
							role: "Koordynator Filaru Projektowego",
							email: "zuzanna.wojtusiak@silamlodych.pl"
						}
					]
				},


				{
					id: "conference",
					name: "Filar Konferencyjny",
					role: "Konferencje i debaty",
					icon: <Users size={20} />,
					description: "Organizacja debat i wydarzeń.",
					status: "active",
					children: [],

					people: [
						{
							id: "15",
							firstName: "Adrian",
							lastName: "Wróblewski",
							role: "Koordynator Filaru Konferencyjnego",
							email: "adrian.wroblewski@silamlodych.pl"
						},
						{
							id: "16",
							firstName: "Wojciech",
							lastName: "Podolski",
							role: "Koordynator Filaru Konferencyjnego",
							email: "wojciech.podolski@silamlodych.pl"
						}
					]
				},


				{
					id: "advocacy",
					name: "Filar Rzeczniczy",
					role: "Rzecznictwo",
					icon: <Megaphone size={20} />,
					description: "Komunikacja i reprezentowanie organizacji.",
					status: "active",
					children: [],

					people: [
						{
							id: "17",
							firstName: "Jan",
							lastName: "Augustyniak",
							role: "Koordynator Filaru Rzeczniczego",
							email: "jan.augustyniak@silamlodych.pl"
						},
						{
							id: "18",
							firstName: "Nikola",
							lastName: "Socha",
							role: "Koordynator Filaru Rzeczniczego",
							email: "nikola.socha@silamlodych.pl"
						}
					]
				},


				{
					id: "simulation",
					name: "Filar Symulacyjny",
					role: "Symulacje",
					icon: <GraduationCap size={20} />,
					description: "Symulacje edukacyjne.",
					status: "active",
					children: [],

					people: [
						{
							id: "19",
							firstName: "Igor",
							lastName: "Piskórz",
							role: "Członek Filaru Symulacyjnego",
							email: "igor.piskorz@silamlodych.pl"
						},
						{
							id: "20",
							firstName: "Maksym",
							lastName: "Marczak",
							role: "Członek Filaru Symulacyjnego",
							email: "maksym.marczak@silamlodych.pl"
						}
					]
				}

			]
		}
	]
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

	// Liczy TYLKO osoby bezpośrednio w tym węźle (nie z dzieci)
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

		if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
			return "osoby";
		}

		return "osób";
	};
	const cardScale = 1;

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
				}}			>
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
								onClick={(e) => e.stopPropagation()} // <-- ZAPOBIEGA ROZWIJANIU
								title={`Wyślij email do ${node.name}`}
							>
								<Mail size={14} />
								<span>{node.email}</span>
							</a>
						)}
					</div>
					{hasExpandableContent && (
						<button className={styles.nodeCard__toggle}>
							{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
						</button>
					)}
				</div>
			</div>

			{/* Wyświetlanie bezpośrednich osób w węźle */}
			{isExpanded && directPeople.length > 0 && (
				<div
					className={styles.peopleList}
					style={{ transform: `scale(${Math.min(1, cardScale * 1.1)})` }}
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

			{/* Dzieci - rozwijane pod spodem */}
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
	const [searchTerm, setSearchTerm] = useState("");
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

	// Statystyki
	const totalMembers = useMemo(() => {
		return countAllPeople(ORGANIZATION_DATA);
	}, []);

	const totalTeams = useMemo(() => {
		const countTeams = (node: Node): number => {
			let count = 1;
			for (const child of node.children) {
				count += countTeams(child);
			}
			return count;
		};
		return countTeams(ORGANIZATION_DATA);
	}, []);

	const totalFilars = useMemo(() => {
		return ORGANIZATION_DATA.children.length;
	}, []);

	// Reset widoku (przycisk Home)
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

				const newX = mouseX - (mouseX - pan.x) * scale - (mouseX - centerX) * (1 - scale);
				const newY = mouseY - (mouseY - pan.y) * scale - (mouseY - centerY) * (1 - scale);

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
	}, [zoom, lastTouchDistance]);

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
						<span className={styles.header__statLabel}>Członków</span>
					</div>
					<div className={styles.header__stat}>
						<span className={styles.header__statValue}>{totalFilars}</span>
						<span className={styles.header__statLabel}>Filarów</span>
					</div>
					<div className={styles.header__stat}>
						<span className={styles.header__statValue}>{totalTeams}</span>
						<span className={styles.header__statLabel}>Zespołów</span>
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
						node={ORGANIZATION_DATA}
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