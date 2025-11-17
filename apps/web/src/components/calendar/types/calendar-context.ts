import { Dispatch, SetStateAction } from 'react';

import {
  CalendarWeekLoadSummary,
  Cycle,
  EVENT_TYPE,
  Event,
} from '@openathlete/shared';

import { COLORED_BY } from './filter';

export type SummaryType = 'planned' | 'done' | 'planned-done';

export type CalendarContextType = {
  displayedMonth: Date;
  nextMonth: () => void;
  prevMonth: () => void;
  displayedWeeks: Date[][];
  createEvent: (date: Date, type: EVENT_TYPE) => void;
  createEventFromTemplate: (date: Date) => void;
  createEventWithAI: (date: Date) => void;
  editEvent: (eventId: Event['eventId']) => void;
  events: Event[];
  openEventDetails: (eventId: Event['eventId']) => void;
  eventDetailsOpened: Event['eventId'] | null;
  summaryType: SummaryType;
  setSummaryType: (type: SummaryType) => void;
  filter: (event: Event) => boolean;
  setFilter: Dispatch<SetStateAction<(event: Event) => boolean>>;
  athleteId?: number;
  allowCreate: boolean;
  coloredBy: COLORED_BY | null;
  setColoredBy: (coloredBy: COLORED_BY | null) => void;
  weeklyLoadSummary: Record<string, CalendarWeekLoadSummary>;
  weeklyLoadSummaryLoading: boolean;
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
