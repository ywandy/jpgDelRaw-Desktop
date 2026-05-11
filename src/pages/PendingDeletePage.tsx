import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, Folder, Trash2, X } from "lucide-react";

import type { CompareResult, DeleteMode, DeleteResult, MediaFile } from "../../shared/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { FileTable } from "../components/FileTable";
import { WarningPanel } from "../components/WarningPanel";
import { createSelectedFileSummary } from "../lib/fileTree";
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
  onSetFilesSelected: (paths: string[], selected: boolean) => void;
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
  onSetFilesSelected,
  onOpenConfirm,
  onCloseConfirm,
  onConfirmDelete,
  onCancel
}: PendingDeletePageProps) {
  if (!compareResult) {
    return <EmptyState title="还没有待删除文件" description="完成扫描并生成候选文件后，列表会显示在这里。" />;
  }

  const selectedFiles = compareResult.deleteCandidates.filter((file) => selectedPaths.has(file.path));
  const allCandidatePaths = compareResult.deleteCandidates.map((file) => file.path);
  const totalSummary = createSelectedFileSummary(compareResult.deleteCandidates, new Set(allCandidatePaths));
  const selectedSummary = createSelectedFileSummary(compareResult.deleteCandidates, selectedPaths);
  const selectedSize = selectedSummary.size;
  const confirmDisabled = selectedSummary.count === 0 || deleting;

  function clearSelection(): void {
    onSetFilesSelected(allCandidatePaths, false);
  }

  return (
    <div className="flex h-full min-h-0 flex-col text-[#312c27]">
      <div className="min-h-0 flex-1 overflow-auto pr-1">
        <div className="mx-auto max-w-[1380px] space-y-5 pb-6">
          <section className="flex items-start justify-between gap-6">
            <div>
              <h1 className="type-page-title text-[#28231f]">待删除文件（{compareResult.deleteCandidates.length} 个）</h1>
              <p className="type-page-subtitle mt-3 text-[#7d7469]">以下文件将被移动到系统回收站，请仔细确认后执行删除操作。</p>
            </div>
          </section>

          {deleteResult && (
            <WarningPanel title={deleteResult.failed > 0 ? "部分文件移动失败" : "删除完成"} tone={deleteResult.failed > 0 ? "red" : "blue"}>
              成功 {deleteResult.success} 个，失败 {deleteResult.failed} 个{deleteResult.logPath ? `，日志：${deleteResult.logPath}` : ""}。
            </WarningPanel>
          )}

          <section className="grid grid-cols-1 gap-3 min-[760px]:grid-cols-3">
            <PendingMetric icon={FileText} label="待删除文件数" value={compareResult.deleteCandidates.length} tone="blue" />
            <PendingMetric icon={CheckCircle2} label="已选文件数" value={selectedSummary.count} tone="violet" />
            <PendingMetric icon={Folder} label="涉及文件夹" value={totalSummary.folderCount} tone="green" />
          </section>

          <FileTable
            files={compareResult.deleteCandidates}
            matchedPairs={compareResult.matchedPairs}
            selectedPaths={selectedPaths}
            onToggleFile={onToggleFile}
            onToggleAll={onToggleAll}
            onSetFilesSelected={onSetFilesSelected}
          />

          <section className="flex items-center gap-4 rounded-[18px] border border-[#f0b27d] bg-[#fff0df] px-5 py-4 text-[#8e4f1e] min-[1200px]:px-6 min-[1200px]:py-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ffdfa8] text-[#c8731c]">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="type-section-title">即将移动 {selectedSummary.count} 个文件到系统回收站</div>
              <div className="type-body mt-1">您可以在回收站中还原这些文件，或清空回收站后永久删除。</div>
            </div>
          </section>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#e5dccc] bg-[#fffdf8]/95 pt-4">
        <div className="mx-auto flex w-full max-w-[1380px] flex-wrap justify-end gap-3 min-[1200px]:gap-4">
          <button className="type-ui inline-flex h-12 items-center gap-2 rounded-xl border border-[#e1d7c8] bg-white px-5 text-[#3f372f] shadow-sm transition hover:bg-[#fbf7ef] min-[1200px]:px-7" onClick={onCancel}>
            <ArrowLeft className="h-5 w-5" />
            返回检查
          </button>
          <button
            className="type-ui inline-flex h-12 items-center gap-2 rounded-xl border border-[#e1d7c8] bg-white px-5 text-[#3f372f] shadow-sm transition hover:bg-[#fbf7ef] disabled:cursor-not-allowed disabled:opacity-50 min-[1200px]:px-6"
            disabled={deleting}
            onClick={clearSelection}
          >
            <X className="h-5 w-5" />
            取消
          </button>
          <button
            className="type-ui inline-flex h-12 items-center gap-2 rounded-xl bg-[#c95f64] px-6 text-white shadow-sm transition hover:bg-[#b54d52] disabled:cursor-not-allowed disabled:bg-[#ddb1b3] min-[1200px]:px-8"
            disabled={confirmDisabled}
            onClick={onOpenConfirm}
          >
            <Trash2 className="h-5 w-5" />
            确认删除（{selectedSummary.count} 个文件）
          </button>
        </div>
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

type MetricTone = "blue" | "green" | "violet";

const METRIC_TONES: Record<MetricTone, string> = {
  blue: "bg-[#e4f0f8] text-[#77a8c7]",
  green: "bg-[#e8f1e5] text-[#7ba17c]",
  violet: "bg-[#ece4f8] text-[#8c75cf]"
};

function PendingMetric({ icon: Icon, label, value, tone }: { icon: typeof FileText; label: string; value: string | number; tone: MetricTone }) {
  return (
    <div className="flex items-center gap-4 rounded-[18px] border border-[#e5dccc] bg-white px-4 py-5 shadow-[0_12px_40px_rgba(87,75,58,0.06)] min-[1200px]:px-5 min-[1200px]:py-6">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl min-[1200px]:h-14 min-[1200px]:w-14 ${METRIC_TONES[tone]}`}>
        <Icon className="h-6 w-6 min-[1200px]:h-7 min-[1200px]:w-7" />
      </div>
      <div className="min-w-0">
        <div className="type-stat break-words text-[#28231f]">{value}</div>
        <div className="type-caption mt-2 max-w-28 text-[#8b8175]">{label}</div>
      </div>
    </div>
  );
}
