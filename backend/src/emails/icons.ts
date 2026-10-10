// src/emails/icons.ts

interface IconOptions {
	size?: number;
	color?: string;
	strokeWidth?: number;
}

const DEFAULTS: Required<IconOptions> = {
	size: 16,
	color: "#46169D",
	strokeWidth: 2,
};

function wrapSvg(
	inner: string,
	{ size, color, strokeWidth }: Required<IconOptions>,
): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;" aria-hidden="true">${inner}</svg>`;
}

/** Bell — przypomnienie */
export function bellIcon(opts: IconOptions = {}): string {
	const o = { ...DEFAULTS, ...opts };
	return wrapSvg(
		`<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
     <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>`,
		o,
	);
}

/** Calendar — termin */
export function calendarIcon(opts: IconOptions = {}): string {
	const o = { ...DEFAULTS, ...opts };
	return wrapSvg(
		`<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
     <line x1="16" y1="2" x2="16" y2="6"/>
     <line x1="8" y1="2" x2="8" y2="6"/>
     <line x1="3" y1="10" x2="21" y2="10"/>`,
		o,
	);
}

/** Flag — priorytet */
export function flagIcon(opts: IconOptions = {}): string {
	const o = { ...DEFAULTS, ...opts };
	return wrapSvg(
		`<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
     <line x1="4" y1="22" x2="4" y2="15"/>`,
		o,
	);
}

/** User — zlecający */
export function userIcon(opts: IconOptions = {}): string {
	const o = { ...DEFAULTS, ...opts };
	return wrapSvg(
		`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
     <circle cx="12" cy="7" r="4"/>`,
		o,
	);
}

/** MessageCircle — wiadomość */
export function messageIcon(opts: IconOptions = {}): string {
	const o = { ...DEFAULTS, ...opts };
	return wrapSvg(`<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>`, o);
}

/** Clock — czas / przypomnienie */
export function clockIcon(opts: IconOptions = {}): string {
	const o = { ...DEFAULTS, ...opts };
	return wrapSvg(
		`<circle cx="12" cy="12" r="10"/>
     <polyline points="12 6 12 12 16 14"/>`,
		o,
	);
}

/** CheckCircle — sukces / ukończone */
export function checkIcon(opts: IconOptions = {}): string {
	const o = { ...DEFAULTS, ...opts };
	return wrapSvg(
		`<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
     <polyline points="22 4 12 14.01 9 11.01"/>`,
		o,
	);
}

/** Mail — koperta */
export function mailIcon(opts: IconOptions = {}): string {
	const o = { ...DEFAULTS, ...opts };
	return wrapSvg(
		`<rect x="2" y="4" width="20" height="16" rx="2"/>
     <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>`,
		o,
	);
}

/** Sparkles — ozdoba (bez emoji) */
export function sparklesIcon(opts: IconOptions = {}): string {
	const o = { ...DEFAULTS, ...opts };
	return wrapSvg(
		`<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>`,
		o,
	);
}
