import { RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";

import type { AppSettings, FontScale, UpdateInfo, UpdateState } from "../../shared/types";

interface SettingsPageProps {
  settings: AppSettings;
  saving: boolean;
  updateInfo?: UpdateInfo;
  updateState: UpdateState;
  onSave: (settings: AppSettings) => void;
  onCheckUpdate: () => void;
}

export function SettingsPage({ settings, saving, updateInfo, updateState, onSave, onCheckUpdate }: SettingsPageProps) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  return (
    <div className="page">
      <div className="page-scroll">
        <div className="page-stack">
          <div className="page-title-group">
            <h1 className="type-page-title page-title">设置</h1>
            <p className="type-page-subtitle page-subtitle">扫描、安全确认、外观、更新与附属文件行为</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SettingsSection title="外观设置">
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-4 py-3">
              <div>
                <div className="type-ui text-[var(--color-text)]">字号</div>
                <div className="type-caption mt-1 text-[var(--color-muted)]">控制全局界面文字大小</div>
              </div>
              <FontScaleControl
                value={draft.appearance.fontScale}
                onChange={(fontScale) => setDraft({ ...draft, appearance: { ...draft.appearance, fontScale } })}
              />
            </div>
            </SettingsSection>

            <SettingsSection title="扫描设置">
            <ToggleRow
              label="递归扫描"
              checked={draft.scan.recursive}
              onChange={(value) => setDraft({ ...draft, scan: { ...draft.scan, recursive: value } })}
            />
            <ToggleRow
              label="忽略大小写"
              checked={draft.scan.ignoreCase}
              onChange={(value) => setDraft({ ...draft, scan: { ...draft.scan, ignoreCase: value } })}
            />
            <ToggleRow
              label="包含隐藏文件"
              checked={draft.scan.includeHiddenFiles}
              onChange={(value) => setDraft({ ...draft, scan: { ...draft.scan, includeHiddenFiles: value } })}
            />
            </SettingsSection>

            <SettingsSection title="删除设置">
            <ToggleRow
              label="输入确认文本"
              checked={draft.delete.requireConfirmText}
              onChange={(value) => setDraft({ ...draft, delete: { ...draft.delete, requireConfirmText: value } })}
            />
            <ToggleRow
              label="删除后生成日志"
              checked={draft.delete.generateLog}
              onChange={(value) => setDraft({ ...draft, delete: { ...draft.delete, generateLog: value } })}
            />
            </SettingsSection>

            <SettingsSection title="更新设置">
            <ToggleRow
              label="启动时自动检查更新"
              checked={draft.updates.autoCheckOnStartup}
              onChange={(value) => setDraft({ ...draft, updates: { ...draft.updates, autoCheckOnStartup: value } })}
            />
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-4 py-3">
              <div>
                <div className="type-ui text-[var(--color-text)]">手动检查更新</div>
                <div className="type-caption mt-1 text-[var(--color-muted)]">最近检查：{formatLastCheckedAt(draft.updates.lastCheckedAt)}</div>
                <div className={`type-caption mt-1 ${updateState.status === "error" ? "text-[#9d3f44]" : "text-[#2f688b]"}`}>
                  {getUpdateStatusMessage(updateState, updateInfo)}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary border-[#b8d1e0] text-[#2f688b] hover:bg-[#f4fbff]"
                disabled={updateState.status === "checking" || updateState.status === "downloading" || updateState.status === "installing"}
                onClick={onCheckUpdate}
              >
                <RefreshCw className={`h-4 w-4 ${updateState.status === "checking" ? "animate-spin" : ""}`} />
                {updateState.status === "checking" ? "检查中" : "检查更新"}
              </button>
            </div>
            </SettingsSection>

            <SettingsSection title="附属文件">
              <ToggleRow label="随 RAW 删除 XMP / DOP" checked={false} disabled onChange={() => undefined} />
            </SettingsSection>
          </div>
        </div>
      </div>

      <div className="page-actionbar">
        <div className="flex justify-end">
          <button
            className="btn btn-primary"
            disabled={saving}
            onClick={() => onSave(draft)}
          >
            <Save className="h-4 w-4" />
            {saving ? "保存中" : "保存设置"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel-compact">
      <h2 className="type-card-title mb-1 text-[var(--color-heading)]">{title}</h2>
      <div className="divide-y divide-[var(--color-border)]">{children}</div>
    </section>
  );
}

const FONT_SCALE_OPTIONS: Array<{ value: FontScale; label: string }> = [
  { value: "small", label: "小" },
  { value: "medium", label: "标准" },
  { value: "large", label: "大" }
];

function FontScaleControl({ value, onChange }: { value: FontScale; onChange: (value: FontScale) => void }) {
  return (
    <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-tint)] p-1">
      {FONT_SCALE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={[
            "type-ui h-8 rounded-[var(--radius-sm)] px-3 transition",
            value === option.value ? "bg-white text-[var(--color-primary-strong)] shadow-sm ring-1 ring-[var(--color-border)]" : "text-[var(--color-muted)] hover:text-[var(--color-heading)]"
          ].join(" ")}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  disabled,
  onChange
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className={`type-ui flex h-10 items-center justify-between ${disabled ? "opacity-50" : ""}`}>
      <span className="text-[var(--color-text)]">{label}</span>
      <input
        type="checkbox"
        className="form-check focus:ring-[var(--color-primary-ring)]"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function formatLastCheckedAt(value?: string): string {
  if (!value) return "尚未检查";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function getUpdateStatusMessage(state: UpdateState, info?: UpdateInfo): string {
  if (state.status === "checking") return "正在检查最新版本...";
  if (state.status === "available" && info) return `发现新版本 ${info.version}，当前版本 ${info.currentVersion}。`;
  if (state.status === "not-available") return "已经是最新版本。";
  if (state.status === "downloading") return info ? `正在下载 ${info.version}。` : "正在下载更新。";
  if (state.status === "ready") return info ? `${info.version} 已下载，重启后生效。` : "更新已下载，重启后生效。";
  if (state.status === "installing") return "正在准备重启安装。";
  if (state.status === "error") return state.error || "检查更新失败，请稍后重试。";
  return "点击检查后会显示最新版本状态。";
}
