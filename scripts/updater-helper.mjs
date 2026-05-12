#!/usr/bin/env node
process.noAsar = true;

import { appendFileSync, copyFileSync, existsSync, renameSync, rmSync, statSync } from "node:fs";
import { dirname } from "node:path";
import { spawn } from "node:child_process";

const args = parseArgs(process.argv.slice(2));
const logPath = args.log;
const updateLogPath = args["update-log"];
const platform = args.platform || process.platform;

log(`Updater helper started for parent ${args["parent-pid"]} platform=${platform}`);
await waitForExit(Number(args["parent-pid"]));

try {
  const target = required("app-asar");
  const staged = required("staged-asar");
  const backup = required("backup-asar");
  const executable = required("executable");
  const targetTemp = `${target}.new`;

  assertReadablePayload(staged);
  log(`Validated staged payload: ${staged}`);

  retrySync(() => rmSync(targetTemp, { force: true }), "remove old target temp");
  retrySync(() => rmSync(backup, { force: true }), "remove old backup");
  retrySync(() => copyFileSync(staged, targetTemp), "copy staged payload beside target");
  log(`Copied staged payload to ${targetTemp}`);

  if (existsSync(target)) {
    retrySync(() => copyFileSync(target, backup), "backup current app.asar");
    log(`Backed up current app.asar to ${backup}`);
  }

  retrySync(() => rmSync(target, { force: true }), "remove current app.asar");
  retrySync(() => renameSync(targetTemp, target), "replace app.asar");
  log("app.asar replaced successfully");
  relaunch(executable);
} catch (error) {
  log(`update failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
  try {
    const backup = args["backup-asar"];
    const target = args["app-asar"];
    if (backup && target && existsSync(backup)) copyFileSync(backup, target);
    log("rollback completed");
  } catch (rollbackError) {
    log(`rollback failed: ${rollbackError instanceof Error ? rollbackError.stack ?? rollbackError.message : String(rollbackError)}`);
  }
  const executable = args.executable;
  if (executable) relaunch(executable);
}

function assertReadablePayload(filePath) {
  if (!existsSync(filePath)) throw new Error(`Staged payload missing: ${filePath}`);
  const stats = statSync(filePath);
  if (!stats.isFile()) throw new Error(`Staged payload is not a file: ${filePath}`);
  if (stats.size < 100 * 1024) throw new Error(`Staged payload is too small: ${stats.size} bytes`);
}

function retrySync(action, label) {
  const attempts = platform === "win32" ? 30 : 12;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      action();
      if (attempt > 1) log(`${label} succeeded after ${attempt} attempts`);
      return;
    } catch (error) {
      lastError = error;
      log(`${label} attempt ${attempt}/${attempts} failed: ${error instanceof Error ? error.message : String(error)}`);
      sleep(platform === "win32" ? 500 : 250);
    }
  }
  throw lastError;
}

function relaunch(executable) {
  if (platform === "darwin") {
    const appBundle = findMacAppBundle(executable);
    if (appBundle) {
      log(`Relaunching macOS app bundle: ${appBundle}`);
      spawn("/usr/bin/open", ["-n", appBundle], { detached: true, stdio: "ignore" }).unref();
      return;
    }
  }
  log(`Relaunching executable: ${executable}`);
  spawn(executable, [], { detached: true, stdio: "ignore", windowsHide: true }).unref();
}

function findMacAppBundle(executable) {
  let current = dirname(executable);
  while (current && current !== dirname(current)) {
    if (current.endsWith(".app")) return current;
    current = dirname(current);
  }
  return undefined;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index]?.replace(/^--/, "");
    const value = values[index + 1];
    if (key) parsed[key] = value;
  }
  return parsed;
}

function required(name) {
  const value = args[name];
  if (!value) throw new Error(`missing --${name}`);
  return value;
}

function waitForExit(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      try {
        process.kill(pid, 0);
      } catch {
        clearInterval(timer);
        resolve();
      }
    }, 500);
  });
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  if (logPath) appendFileSync(logPath, line);
  if (updateLogPath) appendFileSync(updateLogPath, `[helper] ${line}`);
}
