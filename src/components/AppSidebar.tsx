import { Camera, FileWarning, Home, Info, ListChecks, Settings, Trash2 } from "lucide-react";

import { APP_VERSION } from "../../shared/constants";
import type { PageKey } from "../types/navigation";

interface AppSidebarProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
}

const NAV_ITEMS = [
  { key: "home", label: "首页", icon: Home },
  { key: "scanResult", label: "扫描结果", icon: ListChecks },
  { key: "pendingDelete", label: "待删除文件", icon: Trash2 },
  { key: "settings", label: "设置", icon: Settings },
  { key: "about", label: "关于", icon: Info }
] satisfies Array<{ key: PageKey; label: string; icon: typeof FileWarning }>;

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  return (
    <aside className="flex w-52 shrink-0 flex-col rounded-[24px] border border-[#e5dccc] bg-[#fffdf8] px-4 py-6 shadow-[0_12px_44px_rgba(87,75,58,0.05)] min-[1200px]:w-60 min-[1200px]:px-5 min-[1200px]:py-7">
      <div className="mb-6 flex items-center gap-3 border-b border-[#e5dccc] pb-5 min-[1200px]:mb-7 min-[1200px]:gap-4 min-[1200px]:pb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7ba17c] text-white shadow-sm min-[1200px]:h-14 min-[1200px]:w-14">
          <Camera className="h-6 w-6 min-[1200px]:h-7 min-[1200px]:w-7" />
        </div>
        <div className="min-w-0">
          <div className="type-section-title truncate text-[#28231f]">RAW Pair</div>
          <div className="type-caption mt-1 truncate text-[#9a9185]">底片清理器</div>
        </div>
      </div>

      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.key === currentPage;
          return (
            <button
              key={item.key}
              className={[
                "type-nav flex h-12 w-full items-center gap-3 rounded-2xl px-3 transition min-[1200px]:h-14 min-[1200px]:gap-4 min-[1200px]:px-4",
                active ? "bg-[#e8f1e5] text-[#315b35] shadow-sm" : "text-[#6d6459] hover:bg-[#f4efe8] hover:text-[#28231f]"
              ].join(" ")}
              onClick={() => onNavigate(item.key)}
            >
              <Icon className="h-5 w-5 shrink-0 min-[1200px]:h-6 min-[1200px]:w-6" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="type-caption mt-auto px-2 pt-5 font-mono text-[#9a9185]">v{APP_VERSION}</div>
    </aside>
  );
}
