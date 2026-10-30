import { access, copyFile, rename, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFilePath), "../..");
const envTestPath = path.join(projectRoot, ".env.test.local");
const envLocalPath = path.join(projectRoot, ".env.local");
const envBackupPath = path.join(projectRoot, ".env.local.phase2-backup");
const port = process.env.PHASE2_TEST_PORT || "4010";

if (!(await exists(envTestPath))) {
  console.error(
    "Missing .env.test.local. Run `npm run phase2:test:init-env` first."
  );
  process.exit(1);
}

if (await exists(envBackupPath)) {
  console.error(
    "Found stale .env.local.phase2-backup. Restore/remove it before running phase2:test:dev."
  );
  process.exit(1);
}

const hadOriginalEnvLocal = await exists(envLocalPath);
if (hadOriginalEnvLocal) {
  await rename(envLocalPath, envBackupPath);
}
await copyFile(envTestPath, envLocalPath);

let restored = false;
async function restoreEnvFiles() {
  if (restored) return;
  restored = true;
  await rm(envLocalPath, { force: true });
  if (hadOriginalEnvLocal && (await exists(envBackupPath))) {
    await rename(envBackupPath, envLocalPath);
  }
}

const nextBinPath = path.join(
  projectRoot,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

const child = spawn(process.execPath, [nextBinPath, "dev", "-p", port], {
  cwd: projectRoot,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "development" },
});

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

child.on("error", async (error) => {
  console.error("[phase2:test:dev] Failed to start Next.js:", error);
  await restoreEnvFiles();
  process.exit(1);
});

child.on("exit", async (code) => {
  await restoreEnvFiles();
  process.exit(code ?? 0);
});
