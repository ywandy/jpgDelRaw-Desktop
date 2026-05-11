import { AlertTriangle, Trash2, X } from "lucide-react";

import type { DeleteMode } from "../../shared/types";
import { formatBytes, formatDeleteMode } from "../lib/format";

interface ConfirmDialogProps {
  open: boolean;
  count: number;
  totalSize: number;
  mode: DeleteMode;
  requireConfirmText: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, count, totalSize, mode, requireConfirmText: _requireConfirmText, busy, onCancel, onConfirm }: ConfirmDialogProps) {
  void _requireConfirmText;

  if (!open) return null;

  const canConfirm = !busy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d2823]/45 p-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[22px] border border-[#e5dccc] bg-[#fffdf8] shadow-window">
        <div className="flex items-center justify-between border-b border-[#e5dccc] px-7 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0df] text-[#c8731c]">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="type-section-title text-[#28231f]">确认移动到系统回收站？</h2>
              <p className="type-caption mt-1 text-[#8b8175]">{formatDeleteMode(mode)}</p>
            </div>
          </div>
          <button className="rounded-xl p-2 text-[#9a9185] transition hover:bg-[#f1ece4] hover:text-[#3f372f]" onClick={onCancel} aria-label="关闭">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 px-7 py-6">
          <div className="type-body rounded-2xl border border-[#f0c6bd] bg-[#fff0df] p-5 text-[#8e4f1e]">
            你将移动 {count} 个文件到系统回收站，预计释放 {formatBytes(totalSize)}。
            此操作不会硬删除文件，但仍建议确认文件已备份或不再需要。
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#e5dccc] px-7 py-5">
          <button className="type-ui h-11 rounded-xl border border-[#e1d7c8] bg-white px-6 text-[#3f372f] transition hover:bg-[#fbf7ef]" onClick={onCancel}>
            取消
          </button>
          <button
            className="type-ui inline-flex h-11 items-center gap-2 rounded-xl bg-[#c95f64] px-6 text-white shadow-sm transition hover:bg-[#b54d52] disabled:cursor-not-allowed disabled:bg-[#ddb1b3]"
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            <Trash2 className="h-4 w-4" />
            {busy ? "正在移动" : `确认删除（${count} 个文件）`}
          </button>
        </div>
      </div>
    </div>
  );
}
