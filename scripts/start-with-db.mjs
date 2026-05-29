#!/usr/bin/env node
/**
 * Railway start: run idempotent Prisma bootstrap, then always launch Next so
 * /api/health can pass even when db push/seed is temporarily unavailable.
 */
import { spawn } from "node:child_process";

const PORT = process.env.PORT ?? "3060";
const HOST = "0.0.0.0";

function run(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit", env: process.env, shell: true });
    child.on("close", (code) => resolve(code ?? 0));
    child.on("error", () => resolve(1));
  });
}

async function main() {
  const dbCode = await run("npm", ["run", "deploy:db"]);
  if (dbCode !== 0) {
    console.log(
      "[start] WARN: deploy:db did not complete — starting Next anyway so healthcheck can respond",
    );
  }

  console.log(`[start] launching next start on ${HOST}:${PORT}`);
  const code = await run("npx", [
    "--no-install",
    "next",
    "start",
    "-p",
    String(PORT),
    "-H",
    HOST,
  ]);
  process.exit(code);
}

main().catch((err) => {
  console.error("[start] fatal:", err);
  process.exit(1);
});
