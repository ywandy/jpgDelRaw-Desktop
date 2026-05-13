import { AlertTriangle } from "lucide-react";

interface WarningPanelProps {
  title: string;
  children: React.ReactNode;
  tone?: "orange" | "red" | "blue";
}

const TONES = {
  orange: "alert-orange",
  red: "alert-red",
  blue: "alert-blue"
};

export function WarningPanel({ title, children, tone = "orange" }: WarningPanelProps) {
  return (
    <div className={`alert-panel ${TONES[tone]}`}>
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0">
        <div className="type-ui">{title}</div>
        <div className="type-body mt-1">{children}</div>
      </div>
    </div>
  );
}
