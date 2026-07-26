export const PPE_LABELS = {
  helmet: 'Hard hat',
  vest: 'Hi-vis vest',
  gloves: 'Safety gloves',
  goggles: 'Eye protection',
  boots: 'Safety boots',
  mask: 'Respirator',
  harness: 'Fall harness',
  earmuffs: 'Hearing protection',
};

export const STATUS_STYLE = {
  open:         { label: 'Awaiting action', cls: 'border-hivis/40 text-hivis bg-hivis/10' },
  acknowledged: { label: 'Acknowledged',    cls: 'border-go/40 text-go bg-go/10' },
  escalated:    { label: 'Escalated',       cls: 'border-signal/50 text-signal bg-signal/10' },
  resolved:     { label: 'Closed',          cls: 'border-line text-mist bg-ink-700' },
};

export const SEVERITY_STYLE = {
  low:      { cls: 'border-line text-mist bg-ink-700' },
  medium:   { cls: 'border-info/40 text-info bg-info/10' },
  high:     { cls: 'border-hivis/40 text-hivis bg-hivis/10' },
  critical: { cls: 'border-signal/50 text-signal bg-signal/10' },
};

// Chart palette — derived from the app's tokens, not Recharts defaults.
export const CHART = {
  hivis: '#F2C200',
  signal: '#FF4D3D',
  go: '#29C393',
  info: '#4DA3FF',
  mist: '#8E9AAA',
  line: '#2A3441',
  series: ['#F2C200', '#4DA3FF', '#29C393', '#FF4D3D', '#B08BFF', '#FF9F45', '#5FD3E0', '#E86AA8'],
};
