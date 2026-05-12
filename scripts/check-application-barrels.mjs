import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const PACKAGES_DIR = path.join(ROOT, "packages");
const TARGET_DIRS = ["dtos", "ports", "use-cases"];

function isTargetSourceFile(dirName, fileName) {
  if (!fileName.endsWith(".ts")) return false;
  if (fileName === "index.ts") return false;
  if (fileName.endsWith(".spec.ts")) return false;
  if (fileName.endsWith(".absurd.spec.ts")) return false;

  if (dirName === "dtos") return fileName.endsWith(".dto.ts");
  if (dirName === "ports") return fileName.endsWith(".port.ts");
  if (dirName === "use-cases") return fileName.endsWith(".use-case.ts");
  return false;
}

async function safeReadDir(dir) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function run() {
  const packageEntries = await safeReadDir(PACKAGES_DIR);
  const failures = [];

  for (const pkg of packageEntries) {
    if (!pkg.isDirectory()) continue;
    const appDir = path.join(PACKAGES_DIR, pkg.name, "src", "application");

    for (const targetDir of TARGET_DIRS) {
      const fullTargetDir = path.join(appDir, targetDir);
      const entries = await safeReadDir(fullTargetDir);
      if (entries.length === 0) continue;

      const targetFiles = entries
        .filter((entry) => entry.isFile() && isTargetSourceFile(targetDir, entry.name))
        .map((entry) => entry.name);
      if (targetFiles.length === 0) continue;

      const indexPath = path.join(fullTargetDir, "index.ts");
      let indexContent;
      try {
        indexContent = await readFile(indexPath, "utf8");
      } catch {
        failures.push(`[missing-index] ${path.relative(ROOT, indexPath)}`);
        continue;
      }

      for (const fileName of targetFiles) {
        const sourceName = `./${fileName.replace(/\.ts$/, "")}`;
        if (!indexContent.includes(sourceName)) {
          failures.push(
            `[missing-export] ${path.relative(ROOT, indexPath)} must export ${sourceName}`
          );
        }
      }
    }
  }

  if (failures.length > 0) {
    console.error("Barrel consistency check failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log("Barrel consistency check passed.");
}

await run();
