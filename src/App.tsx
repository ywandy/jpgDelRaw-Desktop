import { useEffect, useMemo, useState } from "react";

import { DEFAULT_SETTINGS } from "../shared/constants";
import type { AppSettings, CompareResult, DeleteMode, DeleteResult, PlatformName, ScanResult } from "../shared/types";
import { AppLayout } from "./components/AppLayout";
import { api } from "./lib/api";
import { AboutPage } from "./pages/AboutPage";
import { HomePage } from "./pages/HomePage";
import { PendingDeletePage, selectedMediaFiles } from "./pages/PendingDeletePage";
import { ScanResultPage } from "./pages/ScanResultPage";
import { SettingsPage } from "./pages/SettingsPage";
import type { PageKey } from "./types/navigation";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>("home");
  const [platform, setPlatform] = useState<PlatformName>("darwin");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [rootPath, setRootPath] = useState<string>();
  const [mode, setMode] = useState<DeleteMode>("jpg_as_source_delete_raw");
  const [scanResult, setScanResult] = useState<ScanResult>();
  const [compareResult, setCompareResult] = useState<CompareResult>();
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [deleteResult, setDeleteResult] = useState<DeleteResult>();
  const [error, setError] = useState<string>();
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    void api
      .getSettings()
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_SETTINGS));
    void api
      .getPlatform()
      .then(setPlatform)
      .catch(() => setPlatform("darwin"));
  }, []);

  const selectedSize = useMemo(() => {
    return selectedMediaFiles(compareResult, selectedPaths).reduce((total, file) => total + file.size, 0);
  }, [compareResult, selectedPaths]);

  async function browseDirectory(): Promise<void> {
    const directory = await api.selectDirectory();
    if (directory) {
      setRootPath(directory);
      setError(undefined);
    }
  }

  function acceptDroppedFile(file: File): void {
    const filePath = api.getPathForFile(file);
    if (!filePath) {
      setError("无法读取拖入目录路径，请点击选择目录。");
      return;
    }
    setRootPath(filePath);
    setError(undefined);
  }

  async function startScan(): Promise<void> {
    if (!rootPath) {
      setError("请先选择照片目录。");
      return;
    }

    setScanning(true);
    setError(undefined);
    setDeleteResult(undefined);

    try {
      const nextScanResult = await api.scanDirectory(rootPath, settings.scan);

      if (nextScanResult.imageFiles.length === 0 || nextScanResult.rawFiles.length === 0) {
        setScanResult(nextScanResult);
        setCompareResult(undefined);
        setSelectedPaths(new Set());
        setError(getNoComparableFilesMessage(nextScanResult));
        setCurrentPage("home");
        return;
      }

      const nextCompareResult = await api.compareFiles(nextScanResult, mode);
      setScanResult(nextScanResult);
      setCompareResult(nextCompareResult);
      setSelectedPaths(new Set(nextCompareResult.deleteCandidates.map((file) => file.path)));
      setCurrentPage("scanResult");
    } catch (scanError) {
      setError(getErrorMessage(scanError));
      setCurrentPage("home");
    } finally {
      setScanning(false);
    }
  }

  function toggleFile(filePath: string): void {
    setSelectedPaths((current) => {
      const next = new Set(current);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  }

  function toggleAll(): void {
    if (!compareResult) return;
    const allPaths = compareResult.deleteCandidates.map((file) => file.path);
    const allSelected = allPaths.every((filePath) => selectedPaths.has(filePath));
    setSelectedPaths(allSelected ? new Set() : new Set(allPaths));
  }

  async function confirmDelete(): Promise<void> {
    if (!compareResult || !scanResult || selectedSize < 0) return;
    const files = selectedMediaFiles(compareResult, selectedPaths);
    if (files.length === 0) return;

    setDeleting(true);
    try {
      const result = await api.moveToTrash(files, {
        mode,
        rootPath: scanResult.rootPath
      });
      setDeleteResult(result);
      setSelectedPaths(new Set(result.items.filter((item) => item.status === "failed").map((item) => item.path)));
      setConfirmOpen(false);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }

  async function saveSettings(nextSettings: AppSettings): Promise<void> {
    setSavingSettings(true);
    setError(undefined);
    try {
      await api.saveSettings(nextSettings);
      setSettings(nextSettings);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <AppLayout currentPage={currentPage} platform={platform} onNavigate={setCurrentPage}>
      {currentPage === "home" && (
        <HomePage
          rootPath={rootPath}
          mode={mode}
          error={error}
          scanning={scanning}
          onModeChange={setMode}
          onBrowse={() => void browseDirectory()}
          onDropFile={acceptDroppedFile}
          onStartScan={() => void startScan()}
        />
      )}
      {currentPage === "scanResult" && (
        <ScanResultPage
          scanResult={scanResult}
          compareResult={compareResult}
          onRescan={() => void startScan()}
          onViewPending={() => setCurrentPage("pendingDelete")}
          onGoHome={() => setCurrentPage("home")}
        />
      )}
      {currentPage === "pendingDelete" && (
        <PendingDeletePage
          compareResult={compareResult}
          selectedPaths={selectedPaths}
          requireConfirmText={settings.delete.requireConfirmText}
          deleting={deleting}
          deleteResult={deleteResult}
          confirmOpen={confirmOpen}
          mode={mode}
          onToggleFile={toggleFile}
          onToggleAll={toggleAll}
          onOpenConfirm={() => setConfirmOpen(true)}
          onCloseConfirm={() => setConfirmOpen(false)}
          onConfirmDelete={() => void confirmDelete()}
          onCancel={() => setCurrentPage("scanResult")}
        />
      )}
      {currentPage === "settings" && <SettingsPage settings={settings} saving={savingSettings} onSave={(nextSettings) => void saveSettings(nextSettings)} />}
      {currentPage === "about" && <AboutPage />}
    </AppLayout>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "操作失败，请重试。";
}

function getNoComparableFilesMessage(scanResult: ScanResult): string {
  const imageCount = scanResult.imageFiles.length;
  const rawCount = scanResult.rawFiles.length;
  const modeLabel = scanResult.directoryMode === "separate_dirs" ? "已识别为双目录" : "已完成目录扫描";

  if (imageCount === 0 && rawCount === 0) {
    return `${modeLabel}，但没有找到可识别的 JPG 类图片或 RAW 文件。请检查文件扩展名、隐藏文件设置或目录层级。`;
  }

  if (imageCount === 0) {
    return `${modeLabel}，但没有找到可识别的 JPG 类图片文件；当前 RAW 文件 ${rawCount} 个。请检查 JPG 目录内容或扩展名。`;
  }

  return `${modeLabel}，但没有找到可识别的 RAW 文件；当前 JPG 类图片 ${imageCount} 个。请检查 RAW 目录内容或扩展名。`;
}
