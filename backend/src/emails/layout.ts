// src/emails/layout.ts

export interface LayoutOptions {
	title: string;
	/** Opcjonalny podtytuł pod tytułem (np. "Cześć Maciej, masz nowe zadanie w systemie.") */
	subtitle?: string;
	preheader?: string;
	bodyHtml: string;
	ctaText?: string;
	ctaUrl?: string;
	footerNote?: string;
}

const BRAND = {
	primary: "#43169C",
	secondary: "#632290",
	text: "#111827",
	textMuted: "#6b7280",
	textLight: "#9ca3af",
	bg: "#f3f4f6",
	cardBg: "#ffffff",
	cardMuted: "#f9fafb",
	border: "#e5e7eb",
	logoUrl:
		process.env.MAIL_LOGO_URL ||
		"https://panel.silamlodych.pl/assets/images/sm-logo.png",
	logoWidth: 150,
	siteUrl: "https://silamlodych.pl",
};

export function layout({
	title,
	subtitle,
	preheader = "",
	bodyHtml,
	ctaText,
	ctaUrl,
	footerNote = "",
}: LayoutOptions): string {
	const year = new Date().getFullYear();

	return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>${title}</title>
<!--[if mso]>
<style>
  body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
<style>
  /* Mobile – pełna szerokość, mniej paddingu */
  @media only screen and (max-width: 600px) {
    .email-bg { padding: 12px 6px !important; }
    .email-card { border-radius: 10px !important; }
    .email-header { padding: 16px 18px !important; }
    .email-body { padding: 24px 18px !important; }
    .email-footer { padding: 16px 18px !important; }
    .email-title { font-size: 18px !important; }
    .email-subtitle { font-size: 14px !important; }
    .email-logo { width: 130px !important; }
    .email-system-name { font-size: 10px !important; }
    .email-cta { padding: 12px 20px !important; font-size: 14px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};-webkit-font-smoothing:antialiased;">

  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:${BRAND.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${preheader}
  </div>

  <!-- Tło -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.bg};">
    <tr>
      <td align="center" class="email-bg" style="padding:28px 16px;">

        <!-- Karta -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-card" style="max-width:600px;background:${BRAND.cardBg};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">

          <!-- Pasek akcentu -->
          <tr>
            <td style="height:4px;background:${BRAND.primary};font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- HEADER: logo + nazwa systemu -->
          <tr>
            <td class="email-header" style="padding:18px 24px;border-bottom:1px solid ${BRAND.border};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle">
                    <a href="${BRAND.siteUrl}" style="text-decoration:none;display:inline-block;">
                      <img src="${BRAND.logoUrl}"
                           alt="Siła Młodych"
                           width="${BRAND.logoWidth}"
                           class="email-logo"
                           style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:${BRAND.logoWidth}px;" />
                    </a>
                  </td>
                  <td align="right" valign="middle"
                      class="email-system-name"
                      style="font-size:11px;font-weight:600;color:${BRAND.textLight};text-transform:uppercase;letter-spacing:0.5px;line-height:1.3;white-space:nowrap;">
                    System członka<br/>Siły Młodych
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td class="email-body" style="padding:32px 28px;">

              <!-- Tytuł -->
              <h1 class="email-title" style="margin:0 0 8px 0;font-size:22px;font-weight:700;line-height:1.25;color:${BRAND.secondary};letter-spacing:-0.3px;">
                ${title}
              </h1>

              ${
								subtitle
									? `<p class="email-subtitle" style="margin:0 0 22px 0;font-size:15px;line-height:1.55;color:${BRAND.textMuted};font-weight:500;">
                      ${subtitle}
                    </p>`
									: `<div style="margin-bottom:22px;"></div>`
							}

              <!-- Treść -->
              <div style="font-size:14px;line-height:1.65;color:#374151;">
                ${bodyHtml}
              </div>

              ${
								ctaText && ctaUrl
									? `
              <!-- CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;">
                <tr>
                  <td style="border-radius:8px;background:${BRAND.primary};">
                    <a href="${ctaUrl}"
                       target="_blank"
                       rel="noopener"
                       class="email-cta"
                       style="display:inline-block;padding:13px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:-0.1px;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-size:12px;color:${BRAND.textLight};line-height:1.5;">
                Jeśli przycisk nie działa, skopiuj ten link:<br/>
                <a href="${ctaUrl}" style="color:${BRAND.textMuted};word-break:break-all;text-decoration:underline;">${ctaUrl}</a>
              </p>`
									: ""
							}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="email-footer" style="padding:20px 24px;border-top:1px solid ${BRAND.border};background:${BRAND.cardMuted};">
              <p style="margin:0;font-size:12px;line-height:1.55;color:${BRAND.textLight};">
                Ta wiadomość została wysłana automatycznie z systemu członka Siły Młodych.<br/>
                Jeśli nie spodziewałeś się tego maila, zignoruj go.
                ${footerNote ? `<br/><br/>${footerNote}` : ""}
              </p>
            </td>
          </tr>

        </table>

        <!-- Podpis pod kartą -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;margin-top:16px;">
          <tr>
            <td align="center" style="font-size:11px;color:${BRAND.textLight};line-height:1.5;padding:0 8px;">
              © ${year} Siła Młodych · <a href="${BRAND.siteUrl}" style="color:${BRAND.textLight};text-decoration:underline;">silamlodych.pl</a>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}
