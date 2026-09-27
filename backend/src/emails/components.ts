// src/emails/components.ts

const BRAND = {
	primary: "#43169C",
	secondary: "#632290",
	bg: "#f9fafb",
	border: "#e5e7eb",
};

export interface DetailRow {
	label: string;
	value: string;
}

export function detailsCard(rows: (DetailRow | null | undefined)[]): string {
	const rowsHtml = rows
		.filter((r): r is DetailRow => Boolean(r))
		.map(
			({ label, value }) => `
    <tr>
      <td style="padding:6px 0;font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;width:110px;vertical-align:top;">
        ${label}
      </td>
      <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:500;vertical-align:top;line-height:1.5;">
        ${value}
      </td>
    </tr>`,
		)
		.join("");

	return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
    style="margin:20px 0;background:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:8px;">
    <tr>
      <td style="padding:16px 18px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          ${rowsHtml}
        </table>
      </td>
    </tr>
  </table>`;
}

export function p(text: string): string {
	return `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.65;color:#374151;">${text}</p>`;
}

export function callout(
	text: string,
	variant: "info" | "warning" = "info",
): string {
	const styles =
		variant === "warning"
			? { bg: "#fffbeb", border: "#fde68a", color: "#78350f" }
			: { bg: BRAND.bg, border: BRAND.border, color: "#374151" };

	return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
    style="margin:16px 0;background:${styles.bg};border:1px solid ${styles.border};border-radius:8px;">
    <tr>
      <td style="padding:12px 16px;font-size:13px;line-height:1.6;color:${styles.color};">
        ${text}
      </td>
    </tr>
  </table>`;
}

export function badge(
	text: string,
	variant: "neutral" | "brand" | "outline" = "neutral",
): string {
	const styles: Record<string, string> = {
		neutral: `background:#f3f4f6;color:#374151;border:1px solid ${BRAND.border};`,
		brand: `background:${BRAND.primary};color:#ffffff;border:1px solid ${BRAND.primary};`,
		outline: `background:#ffffff;color:${BRAND.secondary};border:1px solid ${BRAND.primary};`,
	};
	return `<span style="display:inline-block;padding:3px 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-radius:999px;${styles[variant] || styles.neutral}">${text}</span>`;
}

export function ul(items: string[]): string {
	return `
  <ul style="margin:12px 0 14px 0;padding-left:20px;font-size:14px;line-height:1.65;color:#374151;">
    ${items.map((i) => `<li style="margin-bottom:6px;">${i}</li>`).join("")}
  </ul>`;
}

export function hr(): string {
	return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
    <tr><td style="border-top:1px solid ${BRAND.border};font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`;
}
