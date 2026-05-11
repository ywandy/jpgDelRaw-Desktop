import { CheckCircle2, Circle } from "lucide-react";

import type { DeleteMode } from "../../shared/types";

interface ModeCardProps {
  mode: DeleteMode;
  title: string;
  description: string;
  active: boolean;
  onSelect: (mode: DeleteMode) => void;
}

export function ModeCard({ mode, title, description, active, onSelect }: ModeCardProps) {
  return (
    <button
      className={[
        "flex min-h-24 flex-1 gap-3 rounded-lg border bg-white p-4 text-left transition",
        active ? "border-indigo-500 bg-indigo-50/60 shadow-sm" : "border-slate-200 hover:border-indigo-300"
      ].join(" ")}
      onClick={() => onSelect(mode)}
    >
      {active ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-indigo-600" /> : <Circle className="mt-0.5 h-5 w-5 text-slate-400" />}
      <span>
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-500">{description}</span>
      </span>
    </button>
  );
}
