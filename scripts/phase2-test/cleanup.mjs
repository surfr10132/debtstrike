import { readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const manifestPath =
  process.env.PHASE2_TEST_MANIFEST ||
  path.join(os.tmpdir(), "debtstrike-phase2-test-manifest.json");

let manifest = null;
try {
  const manifestRaw = await readFile(manifestPath, "utf8");
  manifest = JSON.parse(manifestRaw);
} catch {
  manifest = null;
}

const targets = [
  manifestPath,
  manifest?.uploadFilePath,
  manifest?.fulfillmentFilePath,
  manifest?.sessionFilePath,
].filter(Boolean);

for (const target of targets) {
  await rm(target, { force: true });
}

console.log(
  JSON.stringify(
    {
      success: true,
      removed: targets,
    },
    null,
    2
  )
);
