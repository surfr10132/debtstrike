import { access, copyFile } from "node:fs/promises";
import path from "node:path";
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
const examplePath = path.join(projectRoot, ".env.test.local.example");
const envPath = path.join(projectRoot, ".env.test.local");

if (!(await exists(examplePath))) {
  throw new Error("Missing .env.test.local.example");
}

if (await exists(envPath)) {
  console.log(
    JSON.stringify(
      {
        success: true,
        message: ".env.test.local already exists. Leaving it unchanged.",
        envPath,
      },
      null,
      2
    )
  );
  process.exit(0);
}

await copyFile(examplePath, envPath);

console.log(
  JSON.stringify(
    {
      success: true,
      message: "Created .env.test.local from template.",
      envPath,
    },
    null,
    2
  )
);
