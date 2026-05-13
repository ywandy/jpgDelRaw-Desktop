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
    <div className="modal-scrim">
      <div className="modal-panel max-w-lg">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-warning-soft)] text-[var(--color-warning-strong)]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="type-section-title text-[var(--color-heading)]">确认移动到系统回收站？</h2>
              <p className="type-caption mt-1 text-[var(--color-muted)]">{formatDeleteMode(mode)}</p>
            </div>
          </div>
          <button className="icon-btn text-[var(--color-subtle)] hover:bg-[#f1ece4] hover:text-[var(--color-text)]" onClick={onCancel} aria-label="关闭">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">
          <div className="type-body alert-panel alert-red">
            你将移动 {count} 个文件到系统回收站，预计释放 {formatBytes(totalSize)}。
            此操作不会硬删除文件，但仍建议确认文件已备份或不再需要。
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-5 py-4">
          <button className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button
            className="btn btn-danger"
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
