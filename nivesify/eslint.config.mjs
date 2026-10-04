import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	{
		ignores: [".next/**", ".open-next/**", "node_modules/**", "cloudflare-env.d.ts"],
	},
	...compat.extends("next/core-web-vitals", "next/typescript"),
	{
		rules: {
			// The current content-heavy codebase contains many deliberate apostrophes
			// and legacy API payloads without stable upstream schemas. Keep these
			// rules non-blocking while new code is held to typed adapters.
			"react/no-unescaped-entities": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@next/next/no-html-link-for-pages": "off",
			"@typescript-eslint/ban-ts-comment": "warn",
		},
	},
];

export default eslintConfig;
