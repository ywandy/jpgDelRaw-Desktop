import { ArrowRight, CheckCircle2, Circle, FileImage, ShieldCheck, Trash2 } from "lucide-react";

import type { DeleteMode } from "../../shared/types";

interface ModeCardProps {
  mode: DeleteMode;
  title: string;
  description: string;
  sourceLabel: "JPG" | "RAW";
  deleteLabel: "JPG" | "RAW";
  active: boolean;
  onSelect: (mode: DeleteMode) => void;
}

export function ModeCard({ mode, title, description, sourceLabel, deleteLabel, active, onSelect }: ModeCardProps) {
  return (
    <button
      className={[
        "group flex min-h-36 flex-1 gap-3 rounded-[18px] border bg-white p-4 text-left transition",
        active ? "border-indigo-500 bg-indigo-50/70 shadow-sm" : "border-slate-200 hover:border-indigo-300 hover:bg-[#fffdf8]"
      ].join(" ")}
      onClick={() => onSelect(mode)}
    >
      {active ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />}
      <span className="min-w-0 flex-1">
        <span className="type-ui block text-slate-900">{title}</span>
        <span className="type-body mt-1 block text-slate-500">{description}</span>
        <span className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2.5" aria-hidden="true">
          <ModeNode icon="source" label={`保留 ${sourceLabel}`} tone="source" />
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />
          <ModeNode icon="trash" label={`删除 ${deleteLabel}`} tone="delete" />
        </span>
      </span>
    </button>
  );
}

function ModeNode({ icon, label, tone }: { icon: "source" | "trash"; label: string; tone: "source" | "delete" }) {
  const isSource = tone === "source";
  const Icon = icon === "source" ? ShieldCheck : Trash2;

  return (
    <span
      className={[
        "flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2",
        isSource ? "bg-[#e8f1e5] text-[#547d55]" : "bg-[#fff0df] text-[#b15d22]"
      ].join(" ")}
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/70">
        <FileImage className="h-4 w-4 opacity-80" />
        <Icon className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white p-0.5" />
      </span>
      <span className="type-caption truncate">{label}</span>
    </span>
  );
}
