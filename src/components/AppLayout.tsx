import type { PlatformName } from "../../shared/types";
import { AppSidebar } from "./AppSidebar";
import { AppTitleBar } from "./AppTitleBar";
import type { PageKey } from "../types/navigation";

interface AppLayoutProps {
  currentPage: PageKey;
  platform: PlatformName;
  onNavigate: (page: PageKey) => void;
  children: React.ReactNode;
}

export function AppLayout({ currentPage, platform, onNavigate, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen">
      <div className="flex h-full w-full min-w-[900px] flex-col overflow-hidden border border-slate-200 bg-slate-50">
        <AppTitleBar platform={platform} />
        <div className="flex min-h-0 flex-1">
          <AppSidebar currentPage={currentPage} onNavigate={onNavigate} />
          <main className="min-w-0 flex-1 overflow-auto p-6">
            <div className="min-h-full w-full">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
