#!/usr/bin/env node
import { execSync } from "child_process";
import { existsSync, mkdirSync, copyFileSync } from "fs";
import { join } from "path";

const packages = [
  // Public packages
  "router6",
  "router6-react",
  "router6-helpers",
  "router6-plugin-browser",
  "router6-plugin-logger",
  "router6-plugin-persistent-params",
  // Private packages (for local development)
  "route-tree",
  "search-params",
  "type-guards",
  "router6-types",
];

for (const pkg of packages) {
  const pkgDir = join("packages", pkg);
  const srcEntry = join(pkgDir, "modules/index.ts");

  if (!existsSync(srcEntry)) {
    console.log(`Skipping ${pkg} (no modules/index.ts)`);
    continue;
  }

  console.log(`Generating .d.ts for ${pkg}...`);

  const cjsDir = join(pkgDir, "dist/cjs");
  const esmDir = join(pkgDir, "dist/esm");

  mkdirSync(cjsDir, { recursive: true });
  mkdirSync(esmDir, { recursive: true });

  const cjsOutput = join(cjsDir, "index.d.ts");

  execSync(`npx dts-bundle-generator --no-check -o ${cjsOutput} ${srcEntry}`, {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  // Copy to ESM with .d.mts extension
  copyFileSync(cjsOutput, join(esmDir, "index.d.mts"));

  console.log(`  ${pkg}: dist/cjs/index.d.ts, dist/esm/index.d.mts`);
}

console.log("\nAll .d.ts files generated!");
