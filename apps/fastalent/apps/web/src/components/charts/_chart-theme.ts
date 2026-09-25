// Shared chart styling constants for consistent theming across light/dark mode

export const TOOLTIP_STYLE = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--card-foreground)',
  fontSize: '12px',
  padding: '6px 10px',
  lineHeight: '1.4',
};

export const TOOLTIP_CURSOR = {
  fill: 'var(--muted)',
};

export const AXIS_STYLE = {
  stroke: 'var(--muted-foreground)',
  fontSize: 12,
};

export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];
