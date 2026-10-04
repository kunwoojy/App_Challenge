// Copies the liblouis browser build + braille tables from node_modules into
// public/liblouis/ so Vite serves them as static files.
// Runs automatically before `npm run dev` and `npm run build`.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const buildDir = join("node_modules", "liblouis-build");
const apiDir = join("node_modules", "liblouis");
const out = join("public", "liblouis");

function fail(msg) {
  console.error(`\n[liblouis] ${msg}\n`);
  process.exit(1);
}

if (!existsSync(buildDir) || !existsSync(apiDir)) {
  fail("Packages missing. Run: npm install liblouis liblouis-build");
}

// The C-API build (no bundled tables). Prefer the UTF-16 build.
const buildFiles = readdirSync(buildDir).filter((f) => /^build-no-tables.*\.js$/.test(f));
const buildFile = buildFiles.find((f) => f.includes("utf16")) ?? buildFiles[0];
if (!buildFile) {
  fail(`No build-no-tables*.js found in ${buildDir}. Files there: ${readdirSync(buildDir).join(", ")}`);
}

const easyApi = join(apiDir, "easy-api.js");
if (!existsSync(easyApi)) {
  fail(`easy-api.js not found in ${apiDir}. Files there: ${readdirSync(apiDir).join(", ")}`);
}

const tables = join(buildDir, "tables");
if (!existsSync(tables)) {
  fail(`tables/ folder not found in ${buildDir}.`);
}

mkdirSync(out, { recursive: true });
cpSync(join(buildDir, buildFile), join(out, "capi.js"));
cpSync(easyApi, join(out, "easy-api.js"));
cpSync(tables, join(out, "tables"), { recursive: true });
console.log(`[liblouis] copied ${buildFile}, easy-api.js and tables/ to ${out}`);
