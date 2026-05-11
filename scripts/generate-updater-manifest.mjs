#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const tag = requiredEnv("GITHUB_REF_NAME");
const repository = requiredEnv("GITHUB_REPOSITORY");
const artifactsDir = process.argv[2] || "artifacts";
const outputPath = process.argv[3] || path.join(artifactsDir, "latest.json");
const version = parseVersion(tag);
const files = walk(artifactsDir);
const expectedPlatforms = [
  ["darwin-x86_64", [".app.tar.gz"]],
  ["windows-x86_64", [".exe"]],
  ["linux-x86_64", [".AppImage"]]
];

const platforms = {};
for (const [target, extensions] of expectedPlatforms) {
  addPlatform(platforms, target, findAsset(files, target, extensions));
}

const manifest = {
  version,
  notes: process.env.RELEASE_NOTES || `Release ${tag}`,
  pub_date: new Date().toISOString(),
  platforms
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote updater manifest to ${outputPath}`);

function addPlatform(targets, platform, asset) {
  if (!asset) {
    console.error(`Missing updater asset for ${platform}.`);
    process.exit(1);
  }

  const signaturePath = `${asset}.sig`;
  if (!fs.existsSync(signaturePath)) {
    console.error(`Missing signature for ${platform}: ${signaturePath}`);
    process.exit(1);
  }

  const assetName = path.basename(asset);
  targets[platform] = {
    signature: fs.readFileSync(signaturePath, "utf8").trim(),
    url: `https://github.com/${repository}/releases/download/${tag}/${encodeURIComponent(assetName)}`
  };
}

function findAsset(allFiles, target, extensions) {
  const candidates = allFiles.filter((file) => file.includes(target) && extensions.some((ext) => file.endsWith(ext)));
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  console.error(`Multiple updater assets found for ${target}:`);
  for (const candidate of candidates) console.error(`- ${candidate}`);
  process.exit(1);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function parseVersion(value) {
  const match = value.match(/^v(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)$/);
  if (!match) {
    console.error(`Updater manifest can only be generated for vX.Y.Z tags, received: ${value}`);
    process.exit(1);
  }
  return match[1];
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}
