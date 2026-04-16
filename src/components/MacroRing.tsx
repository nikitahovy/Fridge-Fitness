type MacroRingProps = {
  value: number;
  target: number;
  label: string;
  unit?: string;
  color: string;
  size?: number;
};

export default function MacroRing({ value, target, label, unit = "g", color, size = 72 }: MacroRingProps) {
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-slate-200 dark:text-neutral-800" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-display text-sm">{Math.round(value)}</span>
        </div>
      </div>
      <p className="font-pixel text-[8px] text-muted uppercase">{label}</p>
      <p className="text-[10px] text-muted">/{target}{unit}</p>
    </div>
  );
}
