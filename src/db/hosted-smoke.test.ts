import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { directConnectionString, getDb, persistenceStatus } from "@/db/client";

function loadLocalEnv(): void {
  const text = readFileSync(".env.local", "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

describe("hosted database", () => {
  it("connects with the configured URL or records a redacted fallback", async () => {
    if (process.env.SMOKE_HOSTED !== "1") return;
    loadLocalEnv();
    const pooled = process.env.DATABASE_URL;
    expect(pooled).toBeTruthy();
    if (!pooled) return;
    const derived = new URL(directConnectionString(pooled, process.env.DIRECT_URL));
    expect(derived.hostname.includes("-pooler")).toBe(false);
    expect(derived.hostname.includes(".neon.neon.")).toBe(false);
    const db = await getDb();
    const result = await db.query<{ ok: number }>("SELECT 1 AS ok");
    expect(result.rows[0]?.ok).toBe(1);
    const status = persistenceStatus();
    expect(status.detail).not.toMatch(/postgres(?:ql)?:\/\//i);
    console.info(
      JSON.stringify({
        mode: status.mode,
        detail: status.detail,
        directHost: derived.hostname,
        model: process.env.LLM_MODEL ?? "",
        keySet: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
        providerSet: Boolean(process.env.LLM_PROVIDER?.trim()),
      }),
    );
  }, 30_000);
});
