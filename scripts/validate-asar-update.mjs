#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import * as asar from "@electron/asar";

const filePath = process.argv[2];
const expectedVersion = readFlag("--version");
const expectedSize = readFlag("--size");

if (!filePath) {
  console.error("Usage: node scripts/validate-asar-update.mjs <app.asar> [--version X.Y.Z] [--size BYTES]");
  process.exit(1);
}

validateAppAsar(filePath, {
  version: expectedVersion,
  size: expectedSize ? Number(expectedSize) : undefined
});
console.log(`Validated app.asar: ${filePath}`);

function validateAppAsar(archivePath, expected) {
  const stats = fs.statSync(archivePath);
  if (stats.size < 100 * 1024) {
    throw new Error(`Archive is too small to be a valid app.asar: ${stats.size} bytes`);
  }
  if (expected.size !== undefined && stats.size !== expected.size) {
    throw new Error(`Archive size mismatch: expected ${expected.size}, received ${stats.size}`);
  }

  for (const requiredFile of ["package.json", "dist/index.html", "dist-electron/electron/main.js", "dist-electron/electron/preload.js"]) {
    asar.statFile(archivePath, requiredFile);
  }

  const pkg = JSON.parse(asar.extractFile(archivePath, "package.json").toString("utf8"));
  if (pkg.name !== "raw-pair-cleaner") throw new Error(`Unexpected package name: ${pkg.name}`);
  if (expected.version && pkg.version !== expected.version) throw new Error(`Unexpected package version: ${pkg.version}`);
  if (pkg.main !== "dist-electron/electron/main.js") throw new Error(`Unexpected package main: ${pkg.main}`);
}

function readFlag(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
