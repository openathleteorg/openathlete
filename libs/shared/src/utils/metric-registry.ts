/**
 * Every derived figure the statistics show has an entry here: raw figures
 * (distance, time, heart rate) need none, and a derived one without an entry
 * is not shown. Rejected figures have no entry at all.
 *
 * `reserved`: backed by the literature, within limits the user can read.
 * `estimate`: useful but without solid validation, always labelled as such.
 */
export type MetricVerdict = 'validated' | 'reserved' | 'estimate';

export interface MetricEntry {
  verdict: MetricVerdict;
  /** Plain arithmetic: reads the same in every language */
  formula: string;
  sources: { label: string; url: string }[];
}

const CLARKE_SKIBA = {
  label: 'Clarke & Skiba 2013',
  url: 'https://doi.org/10.1152/advan.00078.2011',
};
const IMBACH = {
  label: 'Imbach et al. 2022',
  url: 'https://doi.org/10.1038/s41598-022-05392-8',
};

export const METRIC_REGISTRY = {
  sessionRpe: {
    verdict: 'validated',
    formula: 'RPE (0-10) × min',
    sources: [
      {
        label: 'Foster et al. 2001',
        url: 'https://doi.org/10.1519/00124278-200102000-00019',
      },
      {
        label: 'Haddad et al. 2017',
        url: 'https://doi.org/10.3389/fnins.2017.00612',
      },
    ],
  },
  trimp: {
    verdict: 'reserved',
    formula: 'min × ΔHR × 0.64 e^(1.92 ΔHR); ♀ 0.86 e^(1.67 ΔHR)',
    sources: [
      {
        label: 'Wallace et al. 2014',
        url: 'https://doi.org/10.1007/s00421-013-2745-1',
      },
    ],
  },
  ctl: {
    verdict: 'estimate',
    formula: 'CTL(d) = CTL(d-1) + (1 - e^(-1/42)) × (load - CTL(d-1))',
    sources: [CLARKE_SKIBA, IMBACH],
  },
  atl: {
    verdict: 'estimate',
    formula: 'ATL(d) = ATL(d-1) + (1 - e^(-1/7)) × (load - ATL(d-1))',
    sources: [CLARKE_SKIBA, IMBACH],
  },
  tsb: {
    verdict: 'estimate',
    formula: 'TSB = CTL - ATL',
    sources: [CLARKE_SKIBA, IMBACH],
  },
  intensityDistribution: {
    verdict: 'validated',
    formula: '5 zones: Z1-2 | Z3 | Z4-5',
    sources: [
      {
        label: 'Seiler & Kjerland 2006',
        url: 'https://doi.org/10.1111/j.1600-0838.2004.00418.x',
      },
      {
        label: 'Casado et al. 2022',
        url: 'https://doi.org/10.1123/ijspp.2021-0435',
      },
    ],
  },
  efficiency: {
    verdict: 'estimate',
    formula: 'output / HR',
    sources: [
      {
        label: 'Rothschild et al. 2025',
        url: 'https://doi.org/10.1007/s00421-025-05815-0',
      },
    ],
  },
  decoupling: {
    verdict: 'estimate',
    formula: '(EF1 - EF2) / EF1',
    sources: [
      {
        label: 'Rothschild et al. 2025',
        url: 'https://doi.org/10.1007/s00421-025-05815-0',
      },
      {
        label: 'Coyle & González-Alonso 2001',
        url: 'https://doi.org/10.1097/00003677-200104000-00009',
      },
    ],
  },
  longRun: {
    verdict: 'reserved',
    formula: 'distance > 1.1 × longest (30 d)',
    sources: [
      {
        label: 'Frandsen et al. 2025',
        url: 'https://doi.org/10.1136/bjsports-2024-109380',
      },
    ],
  },
  criticalSpeed: {
    verdict: 'estimate',
    formula: 'distance = D′ + CS × t (2-20 min)',
    sources: [
      {
        label: 'Smyth & Muniz-Pumares 2020',
        url: 'https://doi.org/10.1249/MSS.0000000000002412',
      },
      {
        label: 'Jones et al. 2010',
        url: 'https://doi.org/10.1249/MSS.0b013e3181d9cf7f',
      },
    ],
  },
  cardiacCost: {
    verdict: 'estimate',
    formula: 'median HR by band of grade adjusted speed or power',
    sources: [
      {
        label: 'Vesterinen et al. 2014',
        url: 'https://doi.org/10.1519/JSC.0000000000000349',
      },
    ],
  },
  drift: {
    verdict: 'estimate',
    formula: '(last third - first third) / first third, 60 min or more',
    sources: [
      {
        label: 'Smyth et al. 2022',
        url: 'https://doi.org/10.1007/s40279-022-01680-5',
      },
      {
        label: 'Coyle & González-Alonso 2001',
        url: 'https://doi.org/10.1097/00003677-200104000-00009',
      },
    ],
  },
  recordCoherence: {
    verdict: 'estimate',
    formula: 'T2 = T1 × (D2 / D1)^k, k 1.04-1.08 (to 1.15 for the marathon)',
    sources: [
      {
        label: 'Vickers & Vertosick 2016',
        url: 'https://doi.org/10.1186/s13102-016-0052-y',
      },
    ],
  },
  criticalSwimSpeed: {
    verdict: 'reserved',
    formula: 'CSS = (400 - 200) / (T400 - T200)',
    sources: [
      {
        label: 'Wakayoshi et al. 1992',
        url: 'https://doi.org/10.1007/bf00717953',
      },
      {
        label: 'Dekerle et al. 2005',
        url: 'https://doi.org/10.1055/s-2004-821227',
      },
    ],
  },
  criticalPower: {
    verdict: 'reserved',
    formula: 'work = W′ + CP × t (2-20 min)',
    sources: [
      {
        label: 'Jones et al. 2010',
        url: 'https://doi.org/10.1249/MSS.0b013e3181d9cf7f',
      },
      {
        label: 'Karsten et al. 2014',
        url: 'https://doi.org/10.1007/s00421-014-3001-z',
      },
    ],
  },
  monotony: {
    verdict: 'estimate',
    formula: 'mean(daily load, 7 d) / SD(daily load, 7 d)',
    sources: [
      {
        label: 'Foster 1998',
        url: 'https://doi.org/10.1097/00005768-199807000-00023',
      },
    ],
  },
  gap: {
    verdict: 'reserved',
    formula:
      'v × Cr(i) / Cr(0); Cr = 155.4i⁵ - 30.4i⁴ - 43.3i³ + 46.3i² + 19.5i + 3.6',
    sources: [
      {
        label: 'Minetti et al. 2002',
        url: 'https://doi.org/10.1152/japplphysiol.01177.2001',
      },
    ],
  },
} as const satisfies Record<string, MetricEntry>;

export type MetricKey = keyof typeof METRIC_REGISTRY;
