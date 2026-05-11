import { AlertTriangle } from "lucide-react";

interface WarningPanelProps {
  title: string;
  children: React.ReactNode;
  tone?: "orange" | "red" | "blue";
}

const TONES = {
  orange: "border-[#f0b27d] bg-[#fff0df] text-[#8e4f1e]",
  red: "border-[#f0c6bd] bg-[#fff0df] text-[#9d3f44]",
  blue: "border-[#c5dceb] bg-[#e5f2fb] text-[#2f688b]"
};

export function WarningPanel({ title, children, tone = "orange" }: WarningPanelProps) {
  return (
    <div className={`flex gap-4 rounded-[18px] border p-5 ${TONES[tone]}`}>
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <div className="type-ui">{title}</div>
        <div className="type-body mt-1">{children}</div>
      </div>
    </div>
  );
}
