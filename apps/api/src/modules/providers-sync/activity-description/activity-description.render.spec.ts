import { SportType } from '@openathlete/database';

import { Language } from 'src/common/constants/languages.constant';

import {
  ActivityDescriptionFacts,
  summarizeWeather,
} from './activity-description.facts';
import {
  DESCRIPTION_SIGNATURE,
  apportion,
  formatClock,
  formatCost,
  mergeDescription,
  renderActivityDescription,
} from './activity-description.render';
import { descriptionTranslations } from './activity-description.translations';

const hotRun: ActivityDescriptionFacts = {
  seed: 0,
  sport: SportType.RUNNING,
  distanceM: 12000,
  movingTimeSec: 3720, // 5:10 /km
  elevationGainM: 180,
  weather: {
    temperatureC: 27.4,
    feelsLikeC: 29.2,
    humidityPct: 55,
    windKmh: 12,
    gustKmh: 31,
    sky: 'clear',
    isDay: true,
  },
  conditionCosts: { slopeSec: 125, temperatureSec: 102, altitudeSec: 2 },
  intensitySeconds: [2678, 781, 261],
  decouplingPercent: 3.24,
  personalBests: [],
  trimp: 86.4,
  kilojoules: null,
};

describe('renderActivityDescription', () => {
  it('tells the weather, what the conditions cost and the normalized pace', () => {
    expect(renderActivityDescription(hotRun, Language.FR)).toBe(
      [
        '🥵 Sortie sous la chaleur',
        '',
        '🌡️ 27 °C (ressenti 29 °C) · ☀️ Ciel dégagé · 💨 Vent 12 km/h (rafales 31) · 💧 Humidité 55 %',
        '⏱️ Ce que les conditions t’ont coûté : ⛰️ dénivelé 2 min 05 s · 🔥 chaleur 1 min 42 s',
        '🎯 Allure normalisée : 4:51 /km (réelle 5:10 /km)',
        '🫀 Intensité 🟩🟩🟩🟩🟩🟩🟩🟨🟨🟥 — 72 % facile · 21 % modéré · 7 % intense',
        '🔋 Dérive cardiaque : 3,2 % — endurance solide 💪',
        '📈 Charge d’entraînement : 86 TRIMP',
        '🗽 Dénivelé : 1,9× la statue de la Liberté',
        '🏃 28 % d’un marathon',
        '',
        '⚡ Analyse par OpenAthlete · openathlete.org',
      ].join('\n'),
    );
  });

  it('writes every language with the signature', () => {
    for (const language of Object.values(Language)) {
      const text = renderActivityDescription(hotRun, language);
      expect(text).toMatch(DESCRIPTION_SIGNATURE);
    }
    expect(renderActivityDescription(hotRun, Language.EN)).toContain(
      '🎯 Normalized pace: 4:51 /km (actual 5:10 /km)',
    );
  });

  it('falls back to English for an unknown language', () => {
    expect(renderActivityDescription(hotRun, 'DE')).toContain(
      '⚡ Analysis by OpenAthlete',
    );
  });

  it('says nothing when the activity gives too little to say', () => {
    expect(
      renderActivityDescription(
        {
          ...hotRun,
          sport: SportType.STRENGTH,
          distanceM: 0,
          elevationGainM: 0,
          weather: null,
          conditionCosts: null,
          intensitySeconds: null,
          decouplingPercent: null,
          trimp: 42,
        },
        Language.EN,
      ),
    ).toBeNull();
  });

  it('celebrates personal bests first', () => {
    const text = renderActivityDescription(
      {
        ...hotRun,
        personalBests: [
          { kind: 'distance', distanceM: 21097.5, timeSec: 6130 },
          { kind: 'distance', distanceM: 5000, timeSec: 1361 },
          { kind: 'distance', distanceM: 1000, timeSec: 245 },
        ],
      },
      Language.EN,
    )!;
    expect(text.split('\n')[0]).toMatch(/^🏆/);
    expect(text).toContain('🏅 Personal best — half marathon: 1:42:10');
    expect(text).toContain('🏅 Personal best — 5 km: 22:41');
    // Two at most: the description stays short
    expect(text).not.toContain('1 km: 4:05');
  });

  it('sizes the comparisons to the effort', () => {
    const ride: ActivityDescriptionFacts = {
      ...hotRun,
      sport: SportType.CYCLING,
      distanceM: 120000,
      movingTimeSec: 4.5 * 3600,
      elevationGainM: 2400,
      weather: null,
      conditionCosts: null,
      kilojoules: 2900,
      personalBests: [{ kind: 'power', durationSec: 1200, watts: 285 }],
    };
    const text = renderActivityDescription(ride, Language.EN)!;
    expect(text).toContain('🏔️ Climbing: 27% of Everest');
    expect(text).toContain('🍕 ≈ 10 slices of pizza burned');
    expect(text).toContain('🏅 Best power — 20 min: 285 W');
    // Conditions are only modelled for running
    expect(text).not.toContain('What the conditions cost');
    expect(text).not.toContain('marathon');

    const ultra = renderActivityDescription(
      { ...hotRun, distanceM: 101000, elevationGainM: 9500 },
      Language.EN,
    )!;
    expect(ultra).toContain('🏔️ Climbing: 1.1× Everest 🤯');
    expect(ultra).toContain('🏃 2.4× a marathon distance 🤯');

    const hilly = renderActivityDescription(
      { ...hotRun, elevationGainM: 840 },
      Language.EN,
    )!;
    expect(hilly).toContain('🗼 Climbing: 2.5× the Eiffel Tower');
  });

  it('counts lengths for a swim', () => {
    const text = renderActivityDescription(
      {
        ...hotRun,
        sport: SportType.SWIMMING,
        distanceM: 2000,
        elevationGainM: 0,
        weather: null,
        conditionCosts: null,
      },
      Language.ES,
    )!;
    expect(text).toContain('🏊 40 largos de piscina olímpica');
  });

  it('skips a drift measured on a short effort', () => {
    const text = renderActivityDescription(
      { ...hotRun, movingTimeSec: 1500, distanceM: 5000 },
      Language.EN,
    )!;
    expect(text).not.toContain('Cardiac drift');
    expect(text.split('\n')[0]).toMatch(/^🥵|^☀️/);
  });

  it('keeps every translation complete', () => {
    const keys = Object.keys(descriptionTranslations[Language.EN]).sort();
    for (const t of Object.values(descriptionTranslations)) {
      expect(Object.keys(t).sort()).toEqual(keys);
      for (const options of Object.values(t.headlines)) {
        expect(options.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('mergeDescription', () => {
  const block = renderActivityDescription(hotRun, Language.EN)!;

  it('appends the block after the athlete’s own words', () => {
    expect(mergeDescription('Easy run with Paul  \n', block)).toBe(
      `Easy run with Paul\n\n${block}`,
    );
    expect(mergeDescription('', block)).toBe(block);
    expect(mergeDescription(null, block)).toBe(block);
  });

  it('never writes the block twice', () => {
    const once = mergeDescription('Easy run', block)!;
    expect(mergeDescription(once, block)).toBeNull();
    // Even in another language
    const french = renderActivityDescription(hotRun, Language.FR)!;
    expect(mergeDescription(once, french)).toBeNull();
  });
});

describe('summarizeWeather', () => {
  it('averages the route and keeps the wettest hour', () => {
    expect(
      summarizeWeather([
        {
          temperatureC: 10,
          apparentTemperatureC: 8,
          humidityPct: 80,
          precipitationMm: 0,
          cloudCoverPct: 90,
          windSpeed10mKmh: 10,
          windGusts10mKmh: 20,
          isDay: true,
        },
        {
          temperatureC: 12,
          apparentTemperatureC: 10,
          humidityPct: 90,
          precipitationMm: 1.2,
          cloudCoverPct: 100,
          windSpeed10mKmh: 20,
          windGusts10mKmh: 35,
          isDay: true,
        },
      ]),
    ).toEqual({
      temperatureC: 11,
      feelsLikeC: 9,
      humidityPct: 85,
      windKmh: 15,
      gustKmh: 35,
      sky: 'rain',
      isDay: true,
    });
  });

  it('ignores missing or empty samples', () => {
    expect(summarizeWeather(null)).toBeNull();
    expect(summarizeWeather([])).toBeNull();
    expect(summarizeWeather([{ humidityPct: 50 }])).toBeNull();
    expect(summarizeWeather([{ temperatureC: 5, isDay: false }])).toMatchObject(
      { sky: 'clear', isDay: false, windKmh: null },
    );
  });
});

describe('formatting', () => {
  it('formats costs, clocks and shares', () => {
    expect(formatCost(42.4)).toBe('42 s');
    expect(formatCost(65)).toBe('1 min 05 s');
    expect(formatCost(3720)).toBe('1 h 02 min');
    expect(formatClock(1361)).toBe('22:41');
    expect(formatClock(6130)).toBe('1:42:10');
    expect(apportion([1, 1, 1], 100)).toEqual([34, 33, 33]);
    expect(apportion([0, 0, 0], 10)).toEqual([0, 0, 0]);
  });
});
