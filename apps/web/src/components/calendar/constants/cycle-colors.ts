import { m } from '@/paraglide/messages';

// Predefined color palette for cycles
// These colors are semantic and work well for training cycles
export const CYCLE_COLORS = [
  { name: m.color_blue(), value: '#3b82f6', class: 'bg-blue-500' },
  { name: m.color_green(), value: '#22c55e', class: 'bg-green-500' },
  { name: m.color_orange(), value: '#f97316', class: 'bg-orange-500' },
  { name: m.color_red(), value: '#ef4444', class: 'bg-red-500' },
  { name: m.color_purple(), value: '#a855f7', class: 'bg-purple-500' },
  { name: m.color_pink(), value: '#ec4899', class: 'bg-pink-500' },
  { name: m.color_indigo(), value: '#6366f1', class: 'bg-indigo-500' },
  { name: m.color_teal(), value: '#14b8a6', class: 'bg-teal-500' },
  { name: m.color_yellow(), value: '#eab308', class: 'bg-yellow-500' },
  { name: m.color_slate(), value: '#64748b', class: 'bg-slate-500' },
] as const;

export const DEFAULT_CYCLE_COLOR = CYCLE_COLORS[0].value;
