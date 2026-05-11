import { contextBridge, ipcRenderer, webUtils } from "electron";

contextBridge.exposeInMainWorld("rawPairCleaner", {
  selectDirectory: () => ipcRenderer.invoke("dialog:select-directory"),
  scanDirectory: (rootPath: string, options: unknown) => ipcRenderer.invoke("files:scan-directory", rootPath, options),
  compareFiles: (scanResult: unknown, mode: string) => ipcRenderer.invoke("files:compare", scanResult, mode),
  moveToTrash: (files: unknown[], context: unknown) => ipcRenderer.invoke("files:move-to-trash", files, context),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings: unknown) => ipcRenderer.invoke("settings:save", settings),
  getPlatform: () => ipcRenderer.invoke("platform:get"),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  windowMinimize: () => ipcRenderer.invoke("window:minimize"),
  windowMaximize: () => ipcRenderer.invoke("window:maximize"),
  windowClose: () => ipcRenderer.invoke("window:close")
});
