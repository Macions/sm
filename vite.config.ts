import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { visualizer } from "rollup-plugin-visualizer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⭐ WYKRYWA CZY JESTEŚMY NA GITHUB PAGES
const isGitHubPages =
	process.env.GITHUB_PAGES === "true" || process.env.NODE_ENV === "production";

// 🔒 LISTA PODEJRZANYCH WZORCÓW (blokowane zapytania)
const SUSPICIOUS_PATTERNS = [
	/\.\.\//,
	/%2e%2e%2f/i,
	/\.\.%2f/i,
	/WEB-INF/i,
	/system\.ini/i,
	/win\.ini/i,
	/\.env/i,
	/\.git/i,
	/sleep\+/i,
	/exec/i,
	/timeout/i,
	/\.\.\\/,
	/%5c%2e%2e%5c/i,
	/\/etc\/passwd/i,
	/\/proc\/self\/environ/i,
	/\/boot\.ini/i,
	/\.htaccess/i,
	/\.htpasswd/i,
];

export default defineConfig({
	plugins: [
		react(),
		visualizer({
			open: true,
			filename: "stats.html",
		}),
		// 🔒 MIDDLEWARE BLOKUJĄCY FUZZING I ATAKI
		{
			name: "security-middleware",
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					const url = req.url || "";

					// Sprawdź czy zapytanie zawiera podejrzane wzorce
					if (SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(url))) {
						console.warn(`🛡️ Zablokowano podejrzane zapytanie: ${url}`);
						res.statusCode = 403;
						res.setHeader("Content-Type", "text/plain");
						res.end("Forbidden - Suspicious request detected");
						return;
					}

					// 🔥 WARUNKOWY CSP - inne dla lokalnego, inne dla produkcji
					const isDevelopment = process.env.NODE_ENV === "development";

					let csp = [
						"default-src 'self'",
						"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
						"style-src 'self' 'unsafe-inline'",
						"img-src 'self' data: https:",
						"font-src 'self' data:",
						"connect-src 'self'",
						"base-uri 'self'",
						"form-action 'self'",
						"frame-ancestors 'none'",
					];

					if (isDevelopment) {
						// 🔓 DEVELOPMENT - bardziej liberalny dla lokalnych testów
						csp = [
							"default-src 'self'",
							"script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://*.ngrok-free.dev https://accounts.google.com https://apis.google.com",
							"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com https://accounts.google.com",
							"img-src 'self' data: https: http://localhost:*",
							"font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
							"connect-src 'self' http://localhost:* https://*.ngrok-free.dev https://sm-backend-po9k.onrender.com https://api.silamlodych.pl https://accounts.google.com https://*.googleapis.com",
							"frame-src https://accounts.google.com https://*.google.com",
							"base-uri 'self'",
							"form-action 'self'",
							"frame-ancestors 'none'",
						];
					} else {
						// 🔒 PRODUKCJA - restrykcyjny CSP
						csp = [
							"default-src 'self'",
							"script-src 'self' https://accounts.google.com https://apis.google.com",
							"style-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://accounts.google.com",
							"img-src 'self' data: https:",
							"font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
							"connect-src 'self' https://sm-backend-po9k.onrender.com https://api.silamlodych.pl https://accounts.google.com https://*.googleapis.com",
							"frame-src https://accounts.google.com https://*.google.com",
							"base-uri 'self'",
							"form-action 'self'",
							"frame-ancestors 'none'",
						];
					}

					res.setHeader("Content-Security-Policy", csp.join("; "));
					res.setHeader("X-Frame-Options", "DENY");
					res.setHeader("X-Content-Type-Options", "nosniff");
					res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
					res.setHeader(
						"Permissions-Policy",
						"geolocation=(), microphone=(), camera=()",
					);

					next();
				});
			},
		},
	],

	base: isGitHubPages ? "/sm/" : "/",

	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},

	server: {
		allowedHosts: ["turbine-protector-aluminum.ngrok-free.dev"],
		proxy: {
			"/api": {
				target: "https://sm-backend-po9k.onrender.com",
				changeOrigin: true,
				secure: false,
			},
		},
		// 🔒 Ograniczenia dostępu do plików
		fs: {
			strict: true,
			allow: [
				path.resolve(__dirname, "src"),
				path.resolve(__dirname, "public"),
				path.resolve(__dirname, "index.html"),
				path.resolve(__dirname, ".."), // Dla fontów z node_modules
			],
			deny: [
				".env",
				".env.*",
				"*.{crt,pem,key,p12,pfx,cer,der}",
				".npmrc",
				".yarnrc.yml",
				"**/.git/**",
				"**/system.ini",
				"**/win.ini",
				"**/WEB-INF/**",
				"**/etc/passwd/**",
				"**/proc/**",
			],
		},
	},

	build: {
		outDir: "dist",
		assetsDir: "assets",
		sourcemap: false,
		rollupOptions: {
			output: {
				manualChunks: undefined,
			},
		},
	},
	define: {
		"process.env.VITE_API_URL": JSON.stringify(
			"https://sm-backend-po9k.onrender.com",
		),
	},
});