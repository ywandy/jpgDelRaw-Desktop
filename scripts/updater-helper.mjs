#!/usr/bin/env node
import { appendFileSync, copyFileSync, existsSync, renameSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";

const args = parseArgs(process.argv.slice(2));
const logPath = args.log;

log(`Updater helper started for parent ${args["parent-pid"]}`);
await waitForExit(Number(args["parent-pid"]));

try {
  const target = required("app-asar");
  const staged = required("staged-asar");
  const backup = required("backup-asar");
  const executable = required("executable");

  if (!existsSync(staged)) throw new Error(`Staged app.asar missing: ${staged}`);
  rmSync(backup, { force: true });
  if (existsSync(target)) copyFileSync(target, backup);
  renameSync(staged, target);
  log("app.asar replaced successfully");
  spawn(executable, [], { detached: true, stdio: "ignore" }).unref();
} catch (error) {
  log(`update failed: ${error instanceof Error ? error.message : String(error)}`);
  try {
    const backup = args["backup-asar"];
    const target = args["app-asar"];
    if (backup && target && existsSync(backup)) copyFileSync(backup, target);
    log("rollback completed");
  } catch (rollbackError) {
    log(`rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
  }
  const executable = args.executable;
  if (executable) spawn(executable, [], { detached: true, stdio: "ignore" }).unref();
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

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  if (logPath) appendFileSync(logPath, line);
}
