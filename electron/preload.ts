import { contextBridge, ipcRenderer, webUtils } from "electron";

import type { UpdateProgress } from "../shared/types.js";

contextBridge.exposeInMainWorld("rawPairCleaner", {
  selectDirectory: () => ipcRenderer.invoke("dialog:select-directory"),
  scanDirectory: (rootPath: string, options: unknown) => ipcRenderer.invoke("files:scan-directory", rootPath, options),
  compareFiles: (scanResult: unknown, mode: string) => ipcRenderer.invoke("files:compare", scanResult, mode),
  moveToTrash: (files: unknown[], context: unknown) => ipcRenderer.invoke("files:move-to-trash", files, context),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings: unknown) => ipcRenderer.invoke("settings:save", settings),
  getPlatform: () => ipcRenderer.invoke("platform:get"),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  getUpdateState: () => ipcRenderer.invoke("updates:state"),
  checkForUpdates: () => ipcRenderer.invoke("updates:check"),
  downloadUpdate: () => ipcRenderer.invoke("updates:download"),
  downloadAndInstallUpdate: () => ipcRenderer.invoke("updates:download-and-install"),
  installUpdate: () => ipcRenderer.invoke("updates:install"),
  onUpdateProgress: (callback: (progress: UpdateProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: UpdateProgress) => callback(progress);
    ipcRenderer.on("updates:progress", listener);
    return () => ipcRenderer.removeListener("updates:progress", listener);
  },
  windowMinimize: () => ipcRenderer.invoke("window:minimize"),
  windowMaximize: () => ipcRenderer.invoke("window:maximize"),
  windowClose: () => ipcRenderer.invoke("window:close")
});
