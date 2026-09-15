import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// Proves the layer rules in eslint.config.mjs (docs/adr/0001) actually fire.
const eslint = new ESLint({ cwd: process.cwd() });

async function restrictedImportCount(code: string, filePath: string): Promise<number> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).filter((m) => m.ruleId === "no-restricted-imports").length;
}

describe("import boundaries", { timeout: 30_000 }, () => {
  it("blocks Next.js inside domain/", async () => {
    const code = 'import Link from "next/link";\nexport const x = Link;\n';
    expect(await restrictedImportCount(code, "src/domain/example.ts")).toBe(1);
  });

  it("blocks domain/ from importing features/", async () => {
    const code = 'import { x } from "@/features/landing-estimate/x";\nexport const y = x;\n';
    expect(await restrictedImportCount(code, "src/domain/example.ts")).toBe(1);
  });

  it("allows zod inside domain/", async () => {
    const code = 'import { z } from "zod";\nexport const s = z.string();\n';
    expect(await restrictedImportCount(code, "src/domain/example.ts")).toBe(0);
  });

  it("blocks ui/ from importing server/", async () => {
    const code = 'import { x } from "@/server/ai/config";\nexport const y = x;\n';
    expect(await restrictedImportCount(code, "src/ui/components/example.tsx")).toBe(1);
  });

  it("blocks scripts/ from importing features/", async () => {
    const code = 'import { x } from "../src/features/place/x";\nexport const y = x;\n';
    expect(await restrictedImportCount(code, "scripts/example.ts")).toBe(1);
  });
});
