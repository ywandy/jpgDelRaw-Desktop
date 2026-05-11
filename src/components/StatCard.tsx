interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "blue" | "green" | "orange" | "red" | "purple";
}

const TONE_CLASS: Record<NonNullable<StatCardProps["tone"]>, string> = {
  blue: "text-blue-600",
  green: "text-green-600",
  orange: "text-orange-500",
  red: "text-red-600",
  purple: "text-violet-600"
};

export function StatCard({ label, value, helper, tone = "blue" }: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className={`mt-3 text-3xl font-bold ${TONE_CLASS[tone]}`}>{value}</div>
      {helper && <div className="mt-2 text-xs text-slate-500">{helper}</div>}
    </div>
  );
}
