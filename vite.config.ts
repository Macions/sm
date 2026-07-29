import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⭐ WYKRYWA CZY JESTEŚMY NA GITHUB PAGES
const isGitHubPages = process.env.GITHUB_PAGES === 'true' || process.env.NODE_ENV === 'production';

export default defineConfig({
	plugins: [react()],


	base: isGitHubPages ? '/sm/' : '/',

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
	},

	build: {
		outDir: 'dist',
		assetsDir: 'assets',
		sourcemap: false,
		rollupOptions: {
			output: {
				manualChunks: undefined,
			},
		},
	},
	define: {
		'process.env.VITE_API_URL': JSON.stringify('https://sm-backend-po9k.onrender.com')
	}
});