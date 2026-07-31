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
	/\.\.\//, // path traversal
	/%2e%2e%2f/i, // URL encoded ../
	/\.\.%2f/i, // URL encoded ../
	/WEB-INF/i, // Java web files
	/system\.ini/i, // Windows system files
	/win\.ini/i, // Windows system files
	/\.env/i, // Environment variables
	/\.git/i, // Git repository
	/sleep\+/i, // Time-based attacks
	/exec/i, // Command execution
	/timeout/i, // Time-based attacks
	/\.\.\\/, // Windows path traversal
	/%5c%2e%2e%5c/i, // URL encoded Windows path traversal
	/\/etc\/passwd/i, // Linux system files
	/\/proc\/self\/environ/i, // Linux system files
	/\/boot\.ini/i, // Windows boot files
	/\.htaccess/i, // Apache config
	/\.htpasswd/i, // Apache passwords
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

					// Dodaj nagłówki bezpieczeństwa
					const csp = [
						"default-src 'self'",
						"script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://*.ngrok-free.dev",
						"style-src 'self' 'unsafe-inline'",
						"img-src 'self' data: https:",
						"font-src 'self' data:",
						"connect-src 'self' http://localhost:* https://*.ngrok-free.dev https://sm-backend-po9k.onrender.com https://api.silamlodych.pl",
						"base-uri 'self'",
						"form-action 'self'",
						"frame-ancestors 'none'",
					].join("; ");

					res.setHeader("Content-Security-Policy", csp);
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
