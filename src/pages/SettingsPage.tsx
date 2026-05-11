import { Save } from "lucide-react";
import { useEffect, useState } from "react";

import type { AppSettings, FontScale } from "../../shared/types";

interface SettingsPageProps {
  settings: AppSettings;
  saving: boolean;
  onSave: (settings: AppSettings) => void;
}

export function SettingsPage({ settings, saving, onSave }: SettingsPageProps) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="min-h-0 flex-1 overflow-auto pr-1">
        <div className="space-y-5 pb-6">
          <div>
            <h1 className="type-page-title text-slate-950">设置</h1>
            <p className="type-page-subtitle mt-1 text-slate-500">扫描、安全确认、外观与附属文件行为</p>
          </div>

          <SettingsSection title="外观设置">
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-4 py-3">
              <div>
                <div className="type-ui text-slate-700">字号</div>
                <div className="type-caption mt-1 text-slate-500">控制全局界面文字大小</div>
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

          <SettingsSection title="附属文件">
            <ToggleRow label="随 RAW 删除 XMP / DOP" checked={false} disabled onChange={() => undefined} />
          </SettingsSection>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#e5dccc] bg-[#fffdf8]/95 pt-4">
        <div className="flex justify-end">
          <button
            className="type-ui inline-flex h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
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
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="type-card-title mb-2 text-slate-950">{title}</h2>
      <div className="divide-y divide-slate-100">{children}</div>
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
    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
      {FONT_SCALE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={[
            "type-ui h-9 rounded-lg px-4 transition",
            value === option.value ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:text-slate-950"
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
    <label className={`type-ui flex h-12 items-center justify-between ${disabled ? "opacity-50" : ""}`}>
      <span className="text-slate-700">{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
