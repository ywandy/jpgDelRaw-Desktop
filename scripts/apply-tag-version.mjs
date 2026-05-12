#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const tag = process.env.GITHUB_REF_NAME || process.argv[2];
if (!tag) {
  console.error("Missing tag. Pass vX.Y.Z or set GITHUB_REF_NAME.");
  process.exit(1);
}

const version = parseTag(tag);
updatePackageVersion(version);
updateSharedVersion(version);
console.log(`Applied release tag version: ${version}`);

function parseTag(value) {
  const match = value.match(/^v(\d+\.\d+\.\d+)$/);
  if (!match) {
    console.error(`Release tag must use stable vX.Y.Z format, received: ${value}`);
    process.exit(1);
  }
  return match[1];
}

function updatePackageVersion(version) {
  const file = path.join(root, "package.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  data.version = version;
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function updateSharedVersion(version) {
  const file = path.join(root, "shared/constants.ts");
  const content = fs.readFileSync(file, "utf8");
  const next = content.replace(/APP_VERSION\s*=\s*"[^"]+"/, `APP_VERSION = "${version}"`);
  if (next === content) {
    console.error("Could not find APP_VERSION in shared/constants.ts");
    process.exit(1);
  }
  fs.writeFileSync(file, next);
}
