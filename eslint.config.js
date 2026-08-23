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

			// ✅ ZMIEŃ TE REGUŁY:
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					ignoreRestSiblings: true,
				},
			],
			"no-irregular-whitespace": "warn",
			"no-empty": ["warn", { allowEmptyCatch: true }],
			"prefer-const": "warn",
			"no-useless-assignment": "warn",
			"@typescript-eslint/no-require-imports": "error",
			"no-constant-binary-expression": "error",
		},
	},
]);
