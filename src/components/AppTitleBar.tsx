import { Camera, Maximize2, Minus, X } from "lucide-react";

import { APP_TITLE } from "../../shared/constants";
import type { PlatformName } from "../../shared/types";
import { api } from "../lib/api";
import { getPlatformTone } from "../lib/platform";

interface AppTitleBarProps {
  platform: PlatformName;
}

export function AppTitleBar({ platform }: AppTitleBarProps) {
  const tone = getPlatformTone(platform);
  const isMac = tone === "mac";

  return (
    <header
      className={[
        "titlebar drag-region flex shrink-0 items-center",
        tone === "linux" ? "bg-zinc-900 text-white" : ""
      ].join(" ")}
    >
      <div className={["drag-region flex h-full w-52 shrink-0 items-center px-4 min-[1200px]:w-56"].join(" ")}>
        {!isMac && <div className="type-ui flex items-center gap-2" />}
      </div>
      <div className="type-ui drag-region flex h-full flex-1 select-none items-center justify-center gap-2 text-[var(--color-muted)]">
        <span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-white">
          <Camera className={tone === "linux" ? "h-4 w-4 text-orange-400" : "h-4 w-4"} />
        </span>
        <span>{APP_TITLE}</span>
      </div>
      <div className="no-drag flex w-52 shrink-0 justify-end min-[1200px]:w-56">
        {!isMac && <WindowControls tone={tone} />}
      </div>
    </header>
  );
}

function WindowControls({ tone }: { tone: "windows" | "linux" | "mac" }) {
  const base = "flex h-10 w-11 items-center justify-center transition";
  const normal = tone === "linux" ? "hover:bg-white/10" : "hover:bg-[var(--color-surface-soft)]";

  return (
    <>
      <button className={`${base} ${normal}`} aria-label="最小化" onClick={() => void api.windowMinimize()}>
        <Minus className="h-4 w-4" />
      </button>
      <button className={`${base} ${normal}`} aria-label="最大化" onClick={() => void api.windowMaximize()}>
        <Maximize2 className="h-4 w-4" />
      </button>
      <button
        className={`${base} ${tone === "linux" ? "hover:bg-orange-600" : "hover:bg-red-600 hover:text-white"}`}
        aria-label="关闭"
        onClick={() => void api.windowClose()}
      >
        <X className="h-4 w-4" />
      </button>
    </>
  );
}
