import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// Layer rules (docs/adr/0001): app -> features -> ui/domain.
// domain is framework-free; server/ is reachable only from app/ and server components.
const restrict = (patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: restrict([
      {
        group: ["next", "next/*", "react", "react/*", "react-dom", "react-dom/*", "server-only"],
        message: "domain/ is framework-free: plain TypeScript and zod only.",
      },
      {
        group: ["**/app/*", "**/features/*", "**/ui/*", "**/server/*", "**/content/*", "**/env/*"],
        message: "domain/ must not import outer layers.",
      },
    ]),
  },
  {
    files: ["src/ui/**/*.{ts,tsx}"],
    rules: restrict([
      {
        group: ["**/app/*", "**/features/*", "**/server/*", "**/content/*", "server-only"],
        message: "ui/ holds shared presentational components; pass data in as props.",
      },
    ]),
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: restrict([{ group: ["**/app/*"], message: "features/ must not import routes." }]),
  },
  {
    files: ["scripts/**/*.{ts,mts}"],
    rules: restrict([
      {
        group: ["next", "next/*", "react", "react/*", "**/app/*", "**/features/*", "**/ui/*"],
        message: "scripts/ may use domain/ and content loaders only.",
      },
    ]),
  },
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
