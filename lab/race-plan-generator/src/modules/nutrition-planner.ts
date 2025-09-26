import { ComputePlanResult } from "./compute-plan";
import { NutritionForm, NutritionItem, RacePlanConfig } from "./config";
import { sweatTempFactor } from "./temperature";
import { KmTemperatureSample, getNearestKmSampleByTime } from "./weather";
import { NutritionPlanResult } from "./compute-nutrition-plan";

export interface LegNutritionPlan {
  legIndex: number;
  legName: string;
  distanceKm: number;
  durationSec: number;
  carbsTargetG: number;
  carbsViaFlasksG: number;
  carbsViaFoodsG: number;
  hydrationLitres: number;
  carryLitres: number;
  flasksCount: number;
  drinkMixCarbsG: number; // grams of powder to dissolve for the leg
  selectedFoods: Array<{
    itemId: string;
    label: string;
    units: number;
    carbsG: number;
  }>;
  pickupAtStart: {
    flasksToFill: number;
    fillVolumeMl: number; // total water to carry at start
    items: Array<{
      itemId: string;
      label: string;
      units: number;
      carbsG: number;
    }>;
  };
}

export interface FullNutritionPlanPerLeg {
  legs: LegNutritionPlan[];
  totals: {
    carbsTargetG: number;
    carbsViaFlasksG: number;
    carbsViaFoodsG: number;
    hydrationLitres: number;
  };
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickFoods(
  needG: number,
  catalog: NutritionItem[],
  seed: number
): Array<{ itemId: string; label: string; units: number; carbsG: number }> {
  if (needG <= 12) return [];
  const rnd = mulberry32(0x9e3779b1 ^ (seed + 1));
  const solids = catalog.filter(
    (i) => i.form !== "liquid" && i.carbsPerUnit > 0
  );
  if (!solids.length) return [];
  const forms: NutritionForm[] = Array.from(
    new Set(solids.map((i) => i.form)) as Set<NutritionForm>
  );
  const formOrder: NutritionForm[] = shuffle(forms, rnd);
  const byForm = new Map<NutritionForm, NutritionItem[]>(
    formOrder.map((f) => [
      f,
      shuffle(
        solids.filter((i) => i.form === f),
        rnd
      ),
    ])
  );

  const picks: NutritionItem[] = [];
  let remaining = needG;
  let lastForm: string | null = null;
  let consecForm = 0;

  const maxPicks = 12;
  while (remaining > 6 && picks.length < maxPicks) {
    // Build candidate pool with form alternation
    const preferredForms: NutritionForm[] = formOrder
      .filter((f) => f !== lastForm)
      .concat((lastForm ? [lastForm] : []) as NutritionForm[]);
    let chosen: NutritionItem | undefined;
    for (const f of preferredForms) {
      const list = byForm.get(f) || [];
      // Prefer items that don't overshoot by more than 10g
      const eligible = list.filter((i) => i.carbsPerUnit <= remaining + 10);
      const sorted = eligible.length
        ? eligible
            .slice()
            .sort(
              (a, b) =>
                Math.abs(remaining - a.carbsPerUnit) -
                Math.abs(remaining - b.carbsPerUnit)
            )
        : list.slice().sort((a, b) => a.carbsPerUnit - b.carbsPerUnit);
      if (!sorted.length) continue;
      chosen =
        sorted[
          Math.min(
            sorted.length - 1,
            Math.floor(rnd() * Math.min(2, sorted.length))
          )
        ];
      // Enforce not repeating same form more than once in a row when alternatives exist
      if (lastForm === f && consecForm >= 1 && formOrder.length > 1) {
        continue;
      }
      break;
    }
    if (!chosen) {
      // Fallback: pick smallest
      chosen = solids
        .slice()
        .sort((a, b) => a.carbsPerUnit - b.carbsPerUnit)[0];
    }

    picks.push(chosen);
    remaining -= chosen.carbsPerUnit;
    if (chosen.form === lastForm) consecForm += 1;
    else {
      lastForm = chosen.form;
      consecForm = 1;
    }
  }

  // Aggregate picks by id
  const agg = new Map<
    string,
    { itemId: string; label: string; units: number; carbsG: number }
  >();
  for (const it of picks) {
    const cur = agg.get(it.id) || {
      itemId: it.id,
      label: it.label,
      units: 0,
      carbsG: 0,
    };
    cur.units += 1;
    cur.carbsG += it.carbsPerUnit;
    agg.set(it.id, cur);
  }
  return Array.from(agg.values());
}

function computeSweatRateLph(
  effort01: number,
  cfg: RacePlanConfig["nutrition"]
) {
  const base = cfg?.hydration?.sweatRateBaseLPerH ?? 0.6;
  const ef = cfg?.hydration?.effortFactor ?? 0.6;
  return base * (1 + ef * effort01);
}

export async function planNutritionPerLeg(args: {
  plan: ComputePlanResult;
  nutritionSegments: NutritionPlanResult;
  config: RacePlanConfig;
  // Effort proxy per leg (0..1). If not provided, use carbs/hour back-calculated.
  effort01PerLeg?: number[];
  kmSamples: KmTemperatureSample[];
}): Promise<FullNutritionPlanPerLeg> {
  const { plan, nutritionSegments, config } = args;
  const kmSamples = args.kmSamples || [];
  const nutCfg = config.nutrition || {};
  const flaskSizeMl = nutCfg.flaskSizeMl ?? 500;
  const carbsPerL = nutCfg.carbsPerLitre ?? 60;
  const enableChoDrink = nutCfg.enableCarbsInFlasks ?? false;
  const items = nutCfg.items || [];
  const startDate = config.startTime ? new Date(config.startTime) : new Date(0);

  const legs: LegNutritionPlan[] = [];
  let totalCarbsTarget = 0;
  let totalCarbsViaFlasks = 0;
  let totalCarbsViaFoods = 0;
  let totalHydration = 0;
  let totalCarry = 0;

  let nutCumulativeKm = 0;
  for (let i = 0; i < plan.legs.length; i++) {
    const leg = plan.legs[i];
    const legKm = leg.distance / 1000;
    const nutSegments = nutritionSegments.segments.filter(
      (s) =>
        s.cumulativeKmCenter >= (nutCumulativeKm || 0) &&
        s.cumulativeKmCenter <= nutCumulativeKm + legKm
    );
    nutCumulativeKm += legKm;
    const legChoTarget = nutSegments.reduce((acc, s) => acc + s.choGrams, 0);
    const durationH = Math.max(1e-6, leg.totalTimeSec / 3600);
    // Effort proxy: normalize carbs/hour to [0,1] around typical range 40..90 g/h
    const choPerH = legChoTarget / durationH;
    const effort01 = Math.max(0, Math.min(1, (choPerH - 40) / 50));
    // Weighted average temperature across nutSegments in this leg
    let tempWeighted = 0;
    let durWeighted = 0;
    let legTimeAcc = 0;
    for (const s of nutSegments) {
      const sDate = new Date(
        startDate.getTime() + (legTimeAcc + s.durationSec / 2) * 1000
      );
      const t =
        getNearestKmSampleByTime(kmSamples, legTimeAcc + s.durationSec / 2)
          ?.tempC ?? 10;
      tempWeighted += t * s.durationSec;
      durWeighted += s.durationSec;
      legTimeAcc += s.durationSec;
    }
    const tempC = durWeighted > 0 ? tempWeighted / durWeighted : 10;
    const sweatTempMult = sweatTempFactor(tempC);
    const sweatLph = computeSweatRateLph(effort01, nutCfg) * sweatTempMult;
    const hydrationL = sweatLph * durationH; // physiological need adjusted for temperature
    const desiredMl = hydrationL * 1000;
    // Round to nearest 0.5 flask (supports half flasks of 250ml when flaskSize=500)
    const desiredFlasks = desiredMl / flaskSizeMl;
    const roundedFlasks = Math.round(desiredFlasks * 2) / 2; // 0.0, 0.5, 1.0, 1.5, ...
    const carryMl = roundedFlasks * flaskSizeMl;

    const carbsViaDrink = enableChoDrink ? (carryMl / 1000) * carbsPerL : 0;
    const carbsViaFoods = Math.max(0, legChoTarget - carbsViaDrink);
    const foods = pickFoods(carbsViaFoods, items, i + 1);
    const drinkMixGrams = enableChoDrink ? carbsViaDrink : 0;

    legs.push({
      legIndex: i,
      legName: leg.name,
      distanceKm: legKm,
      durationSec: leg.totalTimeSec,
      carbsTargetG: legChoTarget,
      carbsViaFlasksG: carbsViaDrink,
      carbsViaFoodsG: Math.max(
        0,
        foods.reduce((a, x) => a + x.carbsG, 0)
      ),
      hydrationLitres: hydrationL,
      carryLitres: carryMl / 1000,
      flasksCount: roundedFlasks,
      drinkMixCarbsG: drinkMixGrams,
      selectedFoods: foods,
      pickupAtStart: {
        flasksToFill: roundedFlasks,
        fillVolumeMl: carryMl,
        items: foods,
      },
    });

    totalCarbsTarget += legChoTarget;
    totalCarbsViaFlasks += carbsViaDrink;
    totalCarbsViaFoods += foods.reduce((a, x) => a + x.carbsG, 0);
    totalHydration += hydrationL;
    totalCarry += carryMl / 1000;
  }

  return {
    legs,
    totals: {
      carbsTargetG: totalCarbsTarget,
      carbsViaFlasksG: totalCarbsViaFlasks,
      carbsViaFoodsG: totalCarbsViaFoods,
      hydrationLitres: totalHydration,
    },
  };
}
