import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
	plugins: [react()],

	// ⭐ DODAJ BASE - NAZWA TWOJEGO REPOZYTORIUM ⭐
	base: '/sm/', // ⬅️ TO JEST NAJWAŻNIEJSZE!

	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},

	server: {
		allowedHosts: ["turbine-protector-aluminum.ngrok-free.dev"],
		proxy: {
			"/api": {
				target: "https://sm-backend-po9k.onrender.com", // ⬅️ TWÓJ URL
				changeOrigin: true,
				secure: false,
			},
		},
	},

	// ⭐ OPCJONALNIE - skonfiguruj build ⭐
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
});