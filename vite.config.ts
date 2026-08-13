import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { visualizer } from "rollup-plugin-visualizer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export default defineConfig(({ mode }) => {
	// 🔥 AUTOMATYCZNE WYKRYWANIE ŚRODOWISKA
	const isDocker = process.env.DOCKER_ENV === 'true' || mode === 'production';
	const isDevelopment = mode === 'development';

	// URL API - dynamicznie dobierany
	const apiUrl = process.env.VITE_API_URL || (isDocker
		? 'http://backend:3000'  // w Dockerze/Portainerze
		: 'http://localhost:3000' // lokalnie
	);

	// 🔥 DODAJ LOGI:
	console.log('🚀 ===== KONFIGURACJA VITE =====');
	console.log('📌 Mode:', mode);
	console.log('📌 isDocker:', isDocker);
	console.log('📌 isDevelopment:', isDevelopment);
	console.log('📌 process.env.VITE_API_URL:', process.env.VITE_API_URL);
	console.log('📌 apiUrl:', apiUrl);
	console.log('📌 ================================');

	// Host i port
	const host = process.env.VITE_HOST || (isDocker ? '0.0.0.0' : 'localhost');
	const port = parseInt(process.env.PORT || '5173');

	// Dozwolone hosty
	const allowedHosts = [
		"turbine-protector-aluminum.ngrok-free.dev",
		"localhost",
		"127.0.0.1",
	];

	// Dodaj hosty z zmiennej środowiskowej
	if (process.env.VITE_ALLOWED_HOSTS) {
		allowedHosts.push(...process.env.VITE_ALLOWED_HOSTS.split(','));
	}

	return {
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
								`connect-src 'self' http://localhost:* http://backend:* https://*.ngrok-free.dev https://sm-backend-po9k.onrender.com https://api.silamlodych.pl https://accounts.google.com https://*.googleapis.com`,
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
								`connect-src 'self' https://sm-backend-po9k.onrender.com https://api.silamlodych.pl https://accounts.google.com https://*.googleapis.com ${apiUrl}`,
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

		base: "/",

		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},

		server: {
			host: host,
			port: port,
			allowedHosts: allowedHosts,
			proxy: {
				"/api": {
					target: apiUrl,
					changeOrigin: true,
					secure: false,
					rewrite: (path) => path,
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

		// ============================================================
		// 🔥 KONFIGURACJA TESTOW - POPRAWIONA
		// ============================================================
		test: {
			globals: true,
			environment: "jsdom",
			setupFiles: "./src/test/setup.ts",
			css: true,
			reporters: ["verbose"],
			coverage: {
				provider: "v8",
				reporter: ["text", "json", "html"],
				exclude: [
					"node_modules/",
					"src/test/",
					"**/*.test.ts",
					"**/*.test.tsx",
					"**/*.spec.ts",
					"**/*.spec.tsx",
				],
			},
		},

		define: {
			"process.env.VITE_API_URL": JSON.stringify(apiUrl),
		},
	};
});