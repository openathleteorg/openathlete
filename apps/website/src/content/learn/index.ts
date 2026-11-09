import { aerobicDecoupling } from './aerobic-decoupling';
import { criticalSpeed } from './critical-speed';
import { ctlAtlTsb } from './ctl-atl-tsb';
import { ftp } from './ftp';
import { gradeAdjustedPace } from './grade-adjusted-pace';
import { heartRateReserve } from './heart-rate-reserve';
import { hrv } from './hrv';
import { kmEffort } from './km-effort';
import { lactateThreshold } from './lactate-threshold';
import { negativeSplit } from './negative-split';
import { polarizedTraining } from './polarized-training';
import { sessionRpe } from './session-rpe';
import { taper } from './taper';
import { trimp } from './trimp';
import type { LearnTerm } from './types';
import { vdot } from './vdot';
import { vma } from './vma';
import { vo2max } from './vo2max';
import { zone2 } from './zone-2';

/**
 * Every glossary term. One import and one entry per line, so terms can be
 * added without touching anyone else's lines; the order does not matter, as
 * the hub sorts terms by their localized name.
 */
export const learnTerms: LearnTerm[] = [
  // Keeps one entry per line once formatted: append yours anywhere below
  trimp,
  ctlAtlTsb,
  sessionRpe,
  zone2,
  ftp,
  heartRateReserve,
  negativeSplit,
  polarizedTraining,
  criticalSpeed,
  lactateThreshold,
  gradeAdjustedPace,
  kmEffort,
  vma,
  vo2max,
  hrv,
  aerobicDecoupling,
  taper,
  vdot,
];
