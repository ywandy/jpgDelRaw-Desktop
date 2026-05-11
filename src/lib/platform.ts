import type { PlatformName } from "../../shared/types";

export function getPlatformLabel(platform: PlatformName): string {
  if (platform === "darwin") return "macOS";
  if (platform === "win32") return "Windows";
  if (platform === "linux") return "Linux";
  return String(platform);
}

export function getPlatformTone(platform: PlatformName): "mac" | "windows" | "linux" {
  if (platform === "win32") return "windows";
  if (platform === "linux") return "linux";
  return "mac";
}
