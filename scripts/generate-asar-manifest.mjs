#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as asar from "@electron/asar";

const root = process.cwd();
const releaseDir = process.argv[2] || "release";
const outDir = process.argv[3] || releaseDir;
const tag = process.env.GITHUB_REF_NAME || `v${readPackageVersion()}`;
const repository = process.env.GITHUB_REPOSITORY || "ywandy/jpgDelRaw-Desktop";
const version = parseVersion(tag);
const asarPath = findAppAsar(releaseDir);
const assetName = `raw-pair-cleaner-${version}-app.asar`;
const assetPath = path.join(outDir, assetName);

validateAppAsar(asarPath, version);
fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(asarPath, assetPath);
validateAppAsar(assetPath, version);

const sha256 = sha256File(assetPath);
const size = fs.statSync(assetPath).size;
const manifest = {
  version,
  format: "full-app-asar-v1",
  notes: process.env.RELEASE_NOTES || `Release ${tag}`,
  pub_date: new Date().toISOString(),
  assets: {
    appAsar: {
      name: assetName,
      url: `https://github.com/${repository}/releases/download/${tag}/${encodeURIComponent(assetName)}`,
      sha256,
      size
    }
  }
};
fs.writeFileSync(path.join(outDir, "latest-asar.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${path.join(outDir, "latest-asar.json")}`);
console.log(`Copied ${assetName}`);

function readPackageVersion() {
  return JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
}

function parseVersion(value) {
  const match = value.match(/^v(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)$/);
  if (!match) {
    console.error(`Expected vX.Y.Z tag, received ${value}`);
    process.exit(1);
  }
  return match[1];
}

function findAppAsar(dir) {
  const files = walk(dir);
  const matches = files.filter((file) => {
    const normalized = file.split(path.sep).join("/");
    return normalized.endsWith("/resources/app.asar") || normalized.endsWith("/Resources/app.asar");
  });
  if (matches.length === 0) {
    console.error(`Could not find resources/app.asar under ${dir}`);
    process.exit(1);
  }
  if (matches.length > 1) {
    console.error("Multiple app.asar files found:");
    for (const match of matches) console.error(`- ${match}`);
    process.exit(1);
  }
  return matches[0];
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function sha256File(file) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
}

function validateAppAsar(archivePath, expectedVersion) {
  const stats = fs.statSync(archivePath);
  if (stats.size < 100 * 1024) {
    throw new Error(`Archive is too small to be a valid app.asar: ${stats.size} bytes`);
  }

  for (const requiredFile of ["package.json", "dist/index.html", "dist-electron/electron/main.js", "dist-electron/electron/preload.js"]) {
    asar.statFile(archivePath, requiredFile);
  }

  const pkg = JSON.parse(asar.extractFile(archivePath, "package.json").toString("utf8"));
  if (pkg.name !== "raw-pair-cleaner") throw new Error(`Unexpected package name: ${pkg.name}`);
  if (pkg.version !== expectedVersion) throw new Error(`Unexpected package version: ${pkg.version}`);
  if (pkg.main !== "dist-electron/electron/main.js") throw new Error(`Unexpected package main: ${pkg.main}`);
}
