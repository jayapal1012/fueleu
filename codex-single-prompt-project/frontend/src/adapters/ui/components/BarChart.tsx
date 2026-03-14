import { formatNumber } from "../../../shared/format";

interface BarChartProps {
  baseline: number;
  values: Array<{
    label: string;
    value: number;
  }>;
}

export function BarChart({ baseline, values }: BarChartProps) {
  const maxValue = Math.max(baseline, ...values.map((item) => item.value), 1);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
            GHG Intensity
          </p>
          <h3 className="font-serif text-2xl text-slate-900">Baseline vs comparison</h3>
        </div>
        <p className="text-sm text-slate-500">
          Baseline {formatNumber(baseline, 4)} gCO2e/MJ
        </p>
      </div>

      <div className="space-y-4">
        {values.map((item) => (
          <div key={item.label} className="grid gap-2">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>{item.label}</span>
              <span>{formatNumber(item.value, 4)}</span>
            </div>
            <div className="relative h-4 rounded-full bg-slate-100">
              <div
                className="absolute inset-y-0 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
              <div
                className="absolute inset-y-[-2px] w-0.5 bg-rose-500"
                style={{ left: `${(baseline / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

