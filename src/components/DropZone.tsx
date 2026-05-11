import { FolderOpen, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import type { UnlistenFn } from "@tauri-apps/api/event";

interface DropZoneProps {
  rootPath?: string;
  disabled?: boolean;
  onBrowse: () => void;
  onDropPath: (path: string) => void;
}

export function DropZone({ rootPath, disabled, onBrowse, onDropPath }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (disabled || !("__TAURI_INTERNALS__" in window)) return;

    let unlisten: UnlistenFn | undefined;
    void getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === "over") {
          setDragging(true);
          return;
        }
        if (event.payload.type === "drop") {
          setDragging(false);
          const firstPath = event.payload.paths[0];
          if (firstPath) onDropPath(firstPath);
          return;
        }
        setDragging(false);
      })
      .then((nextUnlisten) => {
        unlisten = nextUnlisten;
      });

    return () => {
      unlisten?.();
    };
  }, [disabled, onDropPath]);

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
      }}
    >
      <UploadCloud className="mb-3 h-10 w-10 text-indigo-600" />
      <div className="type-section-title text-indigo-700">拖入照片目录到这里</div>
      <div className="type-body mt-2 max-w-xl truncate text-slate-500">{rootPath || "支持拖拽文件夹到此处，或点击选择目录"}</div>
      <button
        className="type-ui mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
        disabled={disabled}
        onClick={onBrowse}
      >
        <FolderOpen className="h-4 w-4" />
        选择目录
      </button>
    </div>
  );
}
