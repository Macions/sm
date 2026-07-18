import { useState, useMemo, useRef, useEffect } from "react";
import {
	Users,
	UserCog,
	Megaphone,
	Video,
	Briefcase,
	GraduationCap,
	ChevronDown,
	ChevronRight,
	Mail,
	Phone,
	MapPin,
	Building2,
	Users2,
	UserCheck,
	Search,
	X,
	ZoomIn,
	ZoomOut,
	Move,
	Home,
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
	personCount: number;
	status: "active" | "inactive";
	children: Node[];
	people?: Person[];
};

// ---------------------------------------------------------------------------
// DANE - ORGANIZATION_DATA
// ---------------------------------------------------------------------------

const ORGANIZATION_DATA: Node = {
	id: "board",
	name: "Zarząd",
	role: "Główne kierownictwo",
	icon: <UserCog size={24} />,
	description:
		"Kierowanie organizacją, podejmowanie kluczowych decyzji strategicznych",
	personCount: 5,
	status: "active",
	people: [
		{
			id: "1",
			firstName: "Anna",
			lastName: "Kowalska",
			role: "Prezes Zarządu",
			email: "anna.kowalska@sm.pl",
			phone: "+48 123 456 789",
			province: "Mazowieckie",
		},
		{
			id: "2",
			firstName: "Piotr",
			lastName: "Nowak",
			role: "Wiceprezes",
			email: "piotr.nowak@sm.pl",
			phone: "+48 123 456 788",
			province: "Małopolskie",
		},
	],
	children: [
		{
			id: "project",
			name: "Filar Projektowy",
			role: "Koordynacja projektów",
			icon: <Briefcase size={22} />,
			description: "Zarządzanie projektami i inicjatywami",
			personCount: 8,
			status: "active",
			people: [
				{
					id: "3",
					firstName: "Michał",
					lastName: "Lewandowski",
					role: "Koordynator",
					email: "michal.lewandowski@sm.pl",
					phone: "+48 123 456 787",
					province: "Pomorskie",
				},
			],
			children: [
				{
					id: "project-members",
					name: "Członkowie Filaru Projektowego",
					role: "Zespół projektowy",
					icon: <Users2 size={20} />,
					description: "Osoby realizujące projekty",
					personCount: 12,
					status: "active",
					people: [
						{
							id: "4",
							firstName: "Katarzyna",
							lastName: "Kamińska",
							role: "Specjalista ds. projektów",
							email: "katarzyna.kaminska@sm.pl",
							province: "Wielkopolskie",
						},
					],
					children: [],
				},
			],
		},
		{
			id: "conference",
			name: "Filar Konferencji i Debat",
			role: "Organizacja wydarzeń",
			icon: <Users size={22} />,
			description: "Organizacja konferencji i debat",
			personCount: 6,
			status: "active",
			people: [
				{
					id: "5",
					firstName: "Tomasz",
					lastName: "Adamski",
					role: "Koordynator",
					email: "tomasz.adamski@sm.pl",
					phone: "+48 123 456 786",
					province: "Dolnośląskie",
				},
			],
			children: [
				{
					id: "conference-members",
					name: "Członkowie Filaru Konferencji",
					role: "Zespół organizacyjny",
					icon: <Users2 size={20} />,
					description: "Osoby odpowiedzialne za organizację wydarzeń",
					personCount: 8,
					status: "active",
					people: [],
					children: [],
				},
			],
		},
		{
			id: "advocacy",
			name: "Filar Rzeczniczy",
			role: "Rzecznictwo i komunikacja",
			icon: <Megaphone size={22} />,
			description: "Reprezentowanie interesów organizacji",
			personCount: 4,
			status: "active",
			people: [
				{
					id: "6",
					firstName: "Natalia",
					lastName: "Szymańska",
					role: "Koordynator",
					email: "natalia.szymanska@sm.pl",
					phone: "+48 123 456 785",
					province: "Śląskie",
				},
			],
			children: [],
		},
		{
			id: "simulation",
			name: "Filar Symulacyjny",
			role: "Symulacje i szkolenia",
			icon: <GraduationCap size={22} />,
			description: "Przygotowanie symulacji i szkoleń",
			personCount: 5,
			status: "active",
			people: [
				{
					id: "7",
					firstName: "Krzysztof",
					lastName: "Zieliński",
					role: "Koordynator",
					email: "krzysztof.zielinski@sm.pl",
					phone: "+48 123 456 784",
					province: "Łódzkie",
				},
			],
			children: [],
		},
		{
			id: "social-media",
			name: "Social Media",
			role: "Media społecznościowe",
			icon: <Megaphone size={22} />,
			description: "Prowadzenie kanałów społecznościowych",
			personCount: 6,
			status: "active",
			people: [
				{
					id: "8",
					firstName: "Monika",
					lastName: "Woźniak",
					role: "Social Media Manager",
					email: "monika.wozniak@sm.pl",
					phone: "+48 123 456 783",
					province: "Mazowieckie",
				},
			],
			children: [
				{
					id: "tiktok",
					name: "Opiekun TikToka",
					role: "Content creator",
					icon: <Video size={20} />,
					description: "Tworzenie treści na TikToka",
					personCount: 2,
					status: "active",
					people: [
						{
							id: "9",
							firstName: "Karolina",
							lastName: "Kwiatkowska",
							role: "Opiekun TikToka",
							email: "karolina.kwiatkowska@sm.pl",
							province: "Pomorskie",
						},
					],
					children: [],
				},
				{
					id: "instagram",
					name: "Opiekun Instagrama",
					role: "Content creator",
					icon: <Video size={20} />,
					description: "Tworzenie treści na Instagrama",
					personCount: 2,
					status: "active",
					people: [
						{
							id: "10",
							firstName: "Olga",
							lastName: "Dąbrowska",
							role: "Opiekun Instagrama",
							email: "olga.dabrowska@sm.pl",
							province: "Małopolskie",
						},
					],
					children: [],
				},
			],
		},
		{
			id: "video",
			name: "Montażyści",
			role: "Produkcja wideo",
			icon: <Video size={22} />,
			description: "Montaż i produkcja materiałów wideo",
			personCount: 3,
			status: "active",
			people: [
				{
					id: "11",
					firstName: "Marcin",
					lastName: "Kowalski",
					role: "Montażysta",
					email: "marcin.kowalski@sm.pl",
					phone: "+48 123 456 782",
					province: "Wielkopolskie",
				},
			],
			children: [],
		},
		{
			id: "audit",
			name: "Komisja Rewizyjna",
			role: "Kontrola finansowa",
			icon: <Building2 size={22} />,
			description: "Kontrola działań finansowych i zgodności",
			personCount: 3,
			status: "active",
			people: [
				{
					id: "12",
					firstName: "Andrzej",
					lastName: "Nowicki",
					role: "Przewodniczący",
					email: "andrzej.nowicki@sm.pl",
					phone: "+48 123 456 781",
					province: "Śląskie",
				},
			],
			children: [],
		},
		{
			id: "court",
			name: "Sąd Koleżeński",
			role: "Rozstrzyganie sporów",
			icon: <Building2 size={22} />,
			description: "Rozstrzyganie sporów członkowskich",
			personCount: 3,
			status: "active",
			people: [
				{
					id: "13",
					firstName: "Ewa",
					lastName: "Malinowska",
					role: "Przewodnicząca",
					email: "ewa.malinowska@sm.pl",
					phone: "+48 123 456 780",
					province: "Pomorskie",
				},
			],
			children: [],
		},
		{
			id: "plenipotentiaries",
			name: "Pełnomocnicy",
			role: "Przedstawiciele lokalni",
			icon: <UserCheck size={22} />,
			description: "Przedstawiciele w poszczególnych regionach",
			personCount: 4,
			status: "active",
			people: [
				{
					id: "14",
					firstName: "Grzegorz",
					lastName: "Wiśniewski",
					role: "Pełnomocnik",
					email: "grzegorz.wisniewski@sm.pl",
					phone: "+48 123 456 779",
					province: "Dolnośląskie",
				},
			],
			children: [],
		},
	],
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
	const [isExpanded, setIsExpanded] = useState(isRoot || false);
	const hasChildren = node.children && node.children.length > 0;
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
		if (hasChildren) {
			setIsExpanded(!isExpanded);
		}
	};

	const cardScale = isRoot ? 1 : Math.max(0.85, scale * 0.9);

	return (
		<div
			className={styles.treeNode}
			style={{ transform: `scale(${cardScale})` }}
		>
			<div
				className={`${styles.nodeCard} ${isRoot ? styles.nodeRoot : ""} ${isHighlighted ? styles.nodeHighlighted : ""}`}
				onClick={toggleExpand}
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
					<span className={styles.nodeCard__count}>
						<Users size={14} />
						{node.personCount} osób
					</span>
					{hasChildren && (
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

			{isExpanded && node.people && node.people.length > 0 && (
				<div
					className={styles.peopleList}
					style={{ transform: `scale(${Math.min(1, cardScale * 1.1)})` }}
				>
					{node.people.map((person) => (
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

			{isExpanded && hasChildren && (
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

	const [pan, setPan] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [isDragging, setIsDragging] = useState(false);
	const [startPan, setStartPan] = useState({ x: 0, y: 0 });
	const [startMouse, setStartMouse] = useState({ x: 0, y: 0 });
	const [lastTouchDistance, setLastTouchDistance] = useState(0);

	const MIN_ZOOM = 0.3;
	const MAX_ZOOM = 2.5;

	const totalMembers = useMemo(() => {
		const countPeople = (node: Node): number => {
			let count = node.people?.length || 0;
			for (const child of node.children) {
				count += countPeople(child);
			}
			return count;
		};
		return countPeople(ORGANIZATION_DATA);
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

	const resetView = () => {
		setPan({ x: 0, y: 0 });
		setZoom(1);
	};

	const handleZoomIn = () => {
		setZoom((prev) => Math.min(prev + 0.1, MAX_ZOOM));
	};

	const handleZoomOut = () => {
		setZoom((prev) => Math.max(prev - 0.1, MIN_ZOOM));
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

				setPan((prev) => ({
					x:
						mouseX -
						(mouseX - prev.x) * scale -
						(mouseX - centerX) * (1 - scale),
					y:
						mouseY -
						(mouseY - prev.y) * scale -
						(mouseY - centerY) * (1 - scale),
				}));
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
		setPan({
			x: startPan.x + dx,
			y: startPan.y + dy,
		});
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
		setPan({
			x: startPan.x + dx,
			y: startPan.y + dy,
		});
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
					<div className={styles.header__stat}>
						<span className={styles.header__statValue}>4</span>
						<span className={styles.header__statLabel}>Funkcyjnych</span>
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
