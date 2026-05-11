import { RefreshCw, Trash2 } from "lucide-react";

import type { CompareResult, DeleteMode, DeleteResult, MediaFile } from "../../shared/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { FileTable } from "../components/FileTable";
import { WarningPanel } from "../components/WarningPanel";
import { formatBytes } from "../lib/format";

interface PendingDeletePageProps {
  compareResult?: CompareResult;
  selectedPaths: Set<string>;
  requireConfirmText: boolean;
  deleting: boolean;
  deleteResult?: DeleteResult;
  confirmOpen: boolean;
  mode: DeleteMode;
  onToggleFile: (path: string) => void;
  onToggleAll: () => void;
  onOpenConfirm: () => void;
  onCloseConfirm: () => void;
  onConfirmDelete: () => void;
  onCancel: () => void;
}

export function PendingDeletePage({
  compareResult,
  selectedPaths,
  requireConfirmText,
  deleting,
  deleteResult,
  confirmOpen,
  mode,
  onToggleFile,
  onToggleAll,
  onOpenConfirm,
  onCloseConfirm,
  onConfirmDelete,
  onCancel
}: PendingDeletePageProps) {
  if (!compareResult) {
    return <EmptyState title="还没有待删除文件" description="完成扫描并生成候选文件后，列表会显示在这里。" />;
  }

  const selectedFiles = compareResult.deleteCandidates.filter((file) => selectedPaths.has(file.path));
  const selectedSize = selectedFiles.reduce((total, file) => total + file.size, 0);

  return (
    <div className="space-y-5">
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">待删除文件（{selectedFiles.length} 个）</h1>
          <p className="mt-1 text-sm text-slate-500">以下文件将被移入系统回收站，请仔细确认后执行操作。</p>
        </div>
        <div className="rounded-lg bg-orange-50 px-4 py-2 text-right ring-1 ring-orange-200">
          <div className="text-xs font-medium text-orange-700">已选预计释放</div>
          <div className="mt-1 text-xl font-bold text-orange-600">{formatBytes(selectedSize)}</div>
        </div>
      </section>

      {deleteResult && (
        <WarningPanel title={deleteResult.failed > 0 ? "部分文件移动失败" : "删除完成"} tone={deleteResult.failed > 0 ? "red" : "blue"}>
          成功 {deleteResult.success} 个，失败 {deleteResult.failed} 个{deleteResult.logPath ? `，日志：${deleteResult.logPath}` : ""}。
        </WarningPanel>
      )}

      <FileTable
        files={compareResult.deleteCandidates}
        matchedPairs={compareResult.matchedPairs}
        selectedPaths={selectedPaths}
        onToggleFile={onToggleFile}
        onToggleAll={onToggleAll}
      />

      <WarningPanel title="将移动到系统回收站" tone="red">
        所选文件将被移动到系统回收站，您可以在回收站中恢复。此操作不会硬删除文件。
      </WarningPanel>

      <div className="flex justify-between">
        <button className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50" onClick={onCancel}>
          <RefreshCw className="h-4 w-4" />
          返回扫描结果
        </button>
        <button
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-red-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          disabled={selectedFiles.length === 0 || deleting}
          onClick={onOpenConfirm}
        >
          <Trash2 className="h-4 w-4" />
          确认删除（{selectedFiles.length} 个文件）
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        count={selectedFiles.length}
        totalSize={selectedSize}
        mode={mode}
        requireConfirmText={requireConfirmText}
        busy={deleting}
        onCancel={onCloseConfirm}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

export function selectedMediaFiles(compareResult: CompareResult | undefined, selectedPaths: Set<string>): MediaFile[] {
  return compareResult?.deleteCandidates.filter((file) => selectedPaths.has(file.path)) ?? [];
}
