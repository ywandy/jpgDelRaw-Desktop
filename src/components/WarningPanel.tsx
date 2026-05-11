import { AlertTriangle } from "lucide-react";

interface WarningPanelProps {
  title: string;
  children: React.ReactNode;
  tone?: "orange" | "red" | "blue";
}

const TONES = {
  orange: "border-orange-200 bg-orange-50 text-orange-900",
  red: "border-red-200 bg-red-50 text-red-900",
  blue: "border-blue-200 bg-blue-50 text-blue-900"
};

export function WarningPanel({ title, children, tone = "orange" }: WarningPanelProps) {
  return (
    <div className={`flex gap-4 rounded-lg border p-4 ${TONES[tone]}`}>
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <div className="font-semibold">{title}</div>
        <div className="mt-1 text-sm leading-6">{children}</div>
      </div>
    </div>
  );
}
