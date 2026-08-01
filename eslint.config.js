import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
	globalIgnores(["dist"]),
	{
		files: ["**/*.{ts,tsx}"],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			reactHooks.configs.flat.recommended,
			reactRefresh.configs.vite,
		],
		languageOptions: {
			globals: globals.browser,
		},
		rules: {
			// Wyłączone bo nie ma sensu poprawiać w istniejącym kodzie:
			"@typescript-eslint/no-explicit-any": "off",
			"react-hooks/set-state-in-effect": "off",
			"react-hooks/exhaustive-deps": "off",
			"react-refresh/only-export-components": "off",

			// Te warto zachować i ręcznie poprawić:
			"@typescript-eslint/no-unused-vars": "error",
			"no-irregular-whitespace": "error",
			"no-empty": "error",
			"prefer-const": "error",
			"no-useless-assignment": "error",
			"@typescript-eslint/no-require-imports": "error",
			"no-constant-binary-expression": "error",
		},
	},
]);
