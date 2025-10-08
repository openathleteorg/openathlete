// Predefined color palette for cycles
// These colors are semantic and work well for training cycles
export const CYCLE_COLORS = [
  { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500' },
  { name: 'Green', value: '#22c55e', class: 'bg-green-500' },
  { name: 'Orange', value: '#f97316', class: 'bg-orange-500' },
  { name: 'Red', value: '#ef4444', class: 'bg-red-500' },
  { name: 'Purple', value: '#a855f7', class: 'bg-purple-500' },
  { name: 'Pink', value: '#ec4899', class: 'bg-pink-500' },
  { name: 'Indigo', value: '#6366f1', class: 'bg-indigo-500' },
  { name: 'Teal', value: '#14b8a6', class: 'bg-teal-500' },
  { name: 'Yellow', value: '#eab308', class: 'bg-yellow-500' },
  { name: 'Slate', value: '#64748b', class: 'bg-slate-500' },
] as const;

export const DEFAULT_CYCLE_COLOR = CYCLE_COLORS[0].value;
