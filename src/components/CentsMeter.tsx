interface CentsMeterProps {
  cents: number | null;
}

export function CentsMeter({ cents }: CentsMeterProps) {
  const normalizedCents = cents ?? 0;
  const clampedCents = Math.max(-50, Math.min(50, normalizedCents));
  const offset = (clampedCents / 50) * 50;

  let color = '#34d399';
  if (Math.abs(normalizedCents) > 20) color = '#fbbf24';
  if (Math.abs(normalizedCents) > 35) color = '#f87171';

  const hasValue = cents !== null;

  return (
    <div className="flex flex-col items-center gap-1 w-[180px]">
      <div className="text-xs text-[var(--c-text-muted)] font-medium">TUNING</div>
      <svg viewBox="0 0 120 32" className="w-[180px] h-8">
        {/* Track */}
        <rect x={10} y={13} width={100} height={6} rx={3} fill="var(--c-surface)" />

        {/* Center mark */}
        <line x1={60} y1={10} x2={60} y2={22} stroke="var(--c-inactive)" strokeWidth={2} />

        {/* Indicator */}
        <circle
          cx={60 + offset}
          cy={16}
          r={6}
          fill={hasValue ? color : 'var(--c-surface)'}
          stroke={hasValue ? 'none' : 'var(--c-border)'}
          strokeWidth={1}
        />

        {/* Labels */}
        <text x={4} y={28} fill="var(--c-line)" fontSize={8} textAnchor="start">&#9837;</text>
        <text x={116} y={28} fill="var(--c-line)" fontSize={8} textAnchor="end">&#9839;</text>
      </svg>
      <div className="text-xs font-mono h-[16px]" style={{ color: hasValue ? color : 'transparent' }}>
        {normalizedCents > 0 ? '+' : ''}{normalizedCents}&cent;
      </div>
    </div>
  );
}
