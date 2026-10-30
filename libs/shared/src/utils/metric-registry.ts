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
    sources: [
      {
        label: 'Wallace et al. 2014',
        url: 'https://doi.org/10.1007/s00421-013-2745-1',
      },
    ],
  },
  ctl: { verdict: 'estimate', sources: [CLARKE_SKIBA, IMBACH] },
  atl: { verdict: 'estimate', sources: [CLARKE_SKIBA, IMBACH] },
  tsb: { verdict: 'estimate', sources: [CLARKE_SKIBA, IMBACH] },
  criticalSpeed: {
    verdict: 'estimate',
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
  criticalPower: {
    verdict: 'reserved',
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
  gap: {
    verdict: 'reserved',
    sources: [
      {
        label: 'Minetti et al. 2002',
        url: 'https://doi.org/10.1152/japplphysiol.01177.2001',
      },
    ],
  },
} as const satisfies Record<string, MetricEntry>;

export type MetricKey = keyof typeof METRIC_REGISTRY;
