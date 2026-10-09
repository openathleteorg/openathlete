import { Dispatch, SetStateAction } from 'react';

import {
  CalendarDisplay,
  CalendarWeekLoadSummary,
  Cycle,
  EVENT_TYPE,
  Event,
} from '@openathlete/shared';

import { CalendarView } from '../hooks/use-calendar-data';
import { COLORED_BY } from './filter';

export type CalendarContextType = {
  view: CalendarView;
  setView: (view: CalendarView) => void;
  weekStart: Date;
  goToWeek: (date: Date) => void;
  nextWeek: () => void;
  prevWeek: () => void;
  goToCurrentWeek: () => void;
  displayedMonth: Date;
  nextMonth: () => void;
  prevMonth: () => void;
  goToCurrentMonth: () => void;
  displayedWeeks: Date[][];
  createEvent: (date: Date, type: EVENT_TYPE) => void;
  createEventFromTemplate: (date: Date) => void;
  createEventWithAI: (date: Date) => void;
  editEvent: (eventId: Event['eventId']) => void;
  /** Opens the keyboard shortcuts help */
  showShortcuts: () => void;
  events: Event[];
  openEventDetails: (eventId: Event['eventId']) => void;
  eventDetailsOpened: Event['eventId'] | null;
  filter: (event: Event) => boolean;
  setFilter: Dispatch<SetStateAction<(event: Event) => boolean>>;
  athleteId?: number;
  allowCreate: boolean;
  coloredBy: COLORED_BY | null;
  setColoredBy: (coloredBy: COLORED_BY | null) => void;
  weeklyLoadSummary: Record<string, CalendarWeekLoadSummary>;
  weeklyLoadSummaryLoading: boolean;
  estimatingEvents: Set<number>;
  /** What cards and summaries show, saved with the account */
  display: CalendarDisplay;
  updateDisplay: (
    change: (current: CalendarDisplay) => CalendarDisplay,
  ) => void;
  // Cycle management
  cycles: Cycle[];
  createCycle: (startDate: Date, endDate: Date) => void;
  editCycle: (cycleId: Cycle['cycleId']) => void;
  viewCycle: (cycleId: Cycle['cycleId']) => void;
  updateCycleDates: (cycleId: number, startDate: Date, endDate: Date) => void;
  // Drag selection state
  dragSelection: { startDate: Date; endDate: Date } | null;
  setDragSelection: (
    selection: { startDate: Date; endDate: Date } | null,
  ) => void;
  // Cycle resize state
  cycleResize: {
    cycleId: number;
    edge: 'start' | 'end';
    originalStart: Date;
    originalEnd: Date;
    currentStart: Date;
    currentEnd: Date;
  } | null;
  setCycleResize: (
    resize: {
      cycleId: number;
      edge: 'start' | 'end';
      originalStart: Date;
      originalEnd: Date;
      currentStart: Date;
      currentEnd: Date;
    } | null,
  ) => void;
};
