#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const expected = getExpectedVersion();
const checks = [
  ["package.json", readPackageVersion("package.json")],
  ["src-tauri/Cargo.toml", readCargoVersion("src-tauri/Cargo.toml")],
  ["src-tauri/tauri.conf.json", readJson("src-tauri/tauri.conf.json").version],
  ["shared/constants.ts", readSharedConstantVersion("shared/constants.ts")]
];

const mismatches = checks.filter(([, version]) => version !== expected);
if (mismatches.length > 0) {
  console.error(`Version check failed. Expected ${expected}.`);
  for (const [file, version] of mismatches) {
    console.error(`- ${file}: ${version || "<missing>"}`);
  }
  process.exit(1);
}

console.log(`Version check passed: ${expected}`);

function getExpectedVersion() {
  const tag = process.env.GITHUB_REF_NAME || process.argv[2];
  if (tag) {
    const match = tag.match(/^v(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)$/);
    if (!match) {
      console.error(`Tag must use vX.Y.Z format, received: ${tag}`);
      process.exit(1);
    }
    return match[1];
  }

  return readPackageVersion("package.json");
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readPackageVersion(relativePath) {
  return readJson(relativePath).version;
}

function readCargoVersion(relativePath) {
  const content = fs.readFileSync(path.join(root, relativePath), "utf8");
  return matchRequired(content, /^version\s*=\s*"([^"]+)"/m, relativePath);
}

function readSharedConstantVersion(relativePath) {
  const content = fs.readFileSync(path.join(root, relativePath), "utf8");
  return matchRequired(content, /APP_VERSION\s*=\s*"([^"]+)"/, relativePath);
}

function matchRequired(content, pattern, file) {
  const match = content.match(pattern);
  if (!match) {
    console.error(`Could not find version in ${file}`);
    process.exit(1);
  }
  return match[1];
}
