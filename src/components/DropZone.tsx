import { FolderOpen, UploadCloud } from "lucide-react";
import { useState } from "react";

interface DropZoneProps {
  rootPath?: string;
  disabled?: boolean;
  onBrowse: () => void;
  onDropFile: (file: File) => void;
}

export function DropZone({ rootPath, disabled, onBrowse, onDropFile }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={[
        "flex min-h-44 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition",
        dragging ? "border-indigo-500 bg-indigo-50" : "border-indigo-300 bg-white",
        disabled ? "opacity-60" : "hover:border-indigo-500 hover:bg-indigo-50/60"
      ].join(" ")}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (disabled) return;
        const file = event.dataTransfer.files.item(0);
        if (file) onDropFile(file);
      }}
    >
      <UploadCloud className="mb-3 h-10 w-10 text-indigo-600" />
      <div className="text-lg font-semibold text-indigo-700">拖入照片目录到这里</div>
      <div className="mt-2 max-w-xl truncate text-sm text-slate-500">
        {rootPath || "支持拖拽文件夹到此处，或点击选择目录"}
      </div>
      <button
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
        disabled={disabled}
        onClick={onBrowse}
      >
        <FolderOpen className="h-4 w-4" />
        选择目录
      </button>
    </div>
  );
}
