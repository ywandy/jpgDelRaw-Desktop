#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const expected = getExpectedVersion();
const checks = [
  ["package.json", readJson("package.json").version],
  ["shared/constants.ts", readSharedVersion()]
];

const mismatches = checks.filter(([, version]) => version !== expected);
if (mismatches.length > 0) {
  console.error(`Version check failed. Expected ${expected}.`);
  for (const [file, version] of mismatches) console.error(`- ${file}: ${version || "<missing>"}`);
  process.exit(1);
}

console.log(`Version check passed: ${expected}`);

function getExpectedVersion() {
  const tag = process.env.GITHUB_REF_NAME || process.argv[2];
  if (!tag) return readJson("package.json").version;
  const match = tag.match(/^v(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)$/);
  if (!match) {
    console.error(`Tag must use vX.Y.Z format, received: ${tag}`);
    process.exit(1);
  }
  return match[1];
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function readSharedVersion() {
  const content = fs.readFileSync(path.join(root, "shared/constants.ts"), "utf8");
  const match = content.match(/APP_VERSION\s*=\s*"([^"]+)"/);
  if (!match) {
    console.error("Could not find APP_VERSION in shared/constants.ts");
    process.exit(1);
  }
  return match[1];
}
