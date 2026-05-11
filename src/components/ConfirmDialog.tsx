import { Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { CONFIRM_DELETE_TEXT } from "../../shared/constants";
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

export function ConfirmDialog({ open, count, totalSize, mode, requireConfirmText, busy, onCancel, onConfirm }: ConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (open) setConfirmText("");
  }, [open]);

  if (!open) return null;

  const canConfirm = !busy && (!requireConfirmText || confirmText === CONFIRM_DELETE_TEXT);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-6">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-window">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">确认移动到系统回收站？</h2>
            <p className="mt-1 text-sm text-slate-500">{formatDeleteMode(mode)}</p>
          </div>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={onCancel} aria-label="关闭">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg bg-red-50 p-4 text-sm leading-6 text-red-900">
            你将移动 {count} 个文件到系统回收站，预计释放 {formatBytes(totalSize)}。
            此操作不会硬删除文件，但仍建议确认文件已备份或不再需要。
          </div>
          {requireConfirmText && (
            <label className="block">
              <span className="text-sm font-medium text-slate-700">请输入「确认删除」继续</span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                autoFocus
              />
            </label>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={onCancel}>
            取消
          </button>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
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
