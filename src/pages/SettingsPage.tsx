import { Save } from "lucide-react";
import { useEffect, useState } from "react";

import type { AppSettings } from "../../shared/types";

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
    <div className="w-full space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">设置</h1>
        <p className="mt-1 text-sm text-slate-500">扫描、安全确认与附属文件行为</p>
      </div>

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

      <div className="flex justify-end">
        <button
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          disabled={saving}
          onClick={() => onSave(draft)}
        >
          <Save className="h-4 w-4" />
          {saving ? "保存中" : "保存设置"}
        </button>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-slate-950">{title}</h2>
      <div className="divide-y divide-slate-100">{children}</div>
    </section>
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
    <label className={`flex h-12 items-center justify-between text-sm ${disabled ? "opacity-50" : ""}`}>
      <span className="font-medium text-slate-700">{label}</span>
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
