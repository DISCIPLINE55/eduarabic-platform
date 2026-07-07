/**
 * Shared Recharts style helpers — use CSS variables so charts
 * automatically adapt to light and dark mode.
 */

export const chartTooltipStyle: React.CSSProperties = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)',
};

export const chartAxisTick = {
  fontSize: 12,
  fill: 'hsl(var(--muted-foreground))',
};

export const chartGridStroke = 'hsl(var(--border))';
