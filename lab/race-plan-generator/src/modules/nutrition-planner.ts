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
    caffeineMgPerUnit?: number;
  }>;
  pickupAtStart: {
    flasksToFill: number;
    fillVolumeMl: number; // total water to carry at start
    items: Array<{
      itemId: string;
      label: string;
      units: number;
      carbsG: number;
      caffeineMgPerUnit?: number;
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
  seed: number,
  options?: {
    caffeinatedUnitsGoal?: number;
    preferCaffeine?: boolean;
    allowCaffeine?: boolean;
    remainingStock?: Map<string, number>;
    caffeinePreferHighDose?: boolean; // when dosing caffeine, prefer the higher mg unit (e.g., 100 mg) over lower (50 mg)
  }
): Array<{ itemId: string; label: string; units: number; carbsG: number }> {
  if (needG <= 12) return [];
  const rnd = mulberry32(0x9e3779b1 ^ (seed + 1));
  let solids = catalog.filter((i) => i.form !== "liquid" && i.carbsPerUnit > 0);
  // Apply stock filter if provided
  if (options?.remainingStock) {
    solids = solids.filter(
      (i) =>
        options.remainingStock!.get(i.id) === undefined ||
        options.remainingStock!.get(i.id)! > 0
    );
  }
  // If caffeine is not allowed in this window, remove caffeinated items from candidates
  if (options && options.allowCaffeine === false) {
    solids = solids.filter((i) => (i.caffeineMg || 0) <= 0);
  }
  if (!solids.length) return [];
  const caffeinated = solids.filter((i) => (i.caffeineMg || 0) > 0);
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
  // Phase 1: ensure a minimum number of caffeinated units if requested
  const goalCaf = Math.max(0, options?.caffeinatedUnitsGoal || 0);
  let addedCaf = 0;
  if (goalCaf > 0 && caffeinated.length) {
    // When requested, optionally prefer high-dose (100 mg) vs low-dose (50 mg). Default: prefer lower dose for smoother pacing.
    const cafPreferred = caffeinated.slice().sort((a, b) => {
      const cafA = a.caffeineMg || 0;
      const cafB = b.caffeineMg || 0;
      if (cafA !== cafB) {
        return options?.caffeinePreferHighDose ? cafB - cafA : cafA - cafB;
      }
      const gelA = a.form === "gel" ? 0 : 1;
      const gelB = b.form === "gel" ? 0 : 1;
      if (gelA !== gelB) return gelA - gelB;
      const target = 28;
      const da = Math.abs((a.carbsPerUnit || target) - target);
      const db = Math.abs((b.carbsPerUnit || target) - target);
      return da - db;
    });
    while (
      addedCaf < goalCaf &&
      picks.length < maxPicks &&
      remaining > 6 &&
      cafPreferred.length
    ) {
      // Pick first preferred item that fits remaining (<= +12g overshoot) and stock
      let chosen = cafPreferred.find(
        (it) =>
          it.carbsPerUnit <= remaining + 12 &&
          (options?.remainingStock
            ? (options.remainingStock.get(it.id) ?? Infinity) > 0
            : true)
      );
      if (!chosen) {
        // Fallback: ignore overshoot constraint but still respect stock and preference order
        chosen =
          cafPreferred.find((it) =>
            options?.remainingStock
              ? (options.remainingStock.get(it.id) ?? Infinity) > 0
              : true
          ) || cafPreferred[0];
      }
      picks.push(chosen);
      if (options?.remainingStock) {
        const left = options.remainingStock.get(chosen.id);
        if (left !== undefined)
          options.remainingStock.set(chosen.id, Math.max(0, left - 1));
      }
      remaining -= chosen.carbsPerUnit;
      if (chosen.form === lastForm) consecForm += 1;
      else {
        lastForm = chosen.form;
        consecForm = 1;
      }
      addedCaf += 1;
    }
  }

  while (remaining > 6 && picks.length < maxPicks) {
    // Build candidate pool with form alternation
    const preferredForms: NutritionForm[] = formOrder
      .filter((f) => f !== lastForm)
      .concat((lastForm ? [lastForm] : []) as NutritionForm[]);
    let chosen: NutritionItem | undefined;
    for (const f of preferredForms) {
      let list = byForm.get(f) || [];
      // If we already met the caffeine goal (or caffeine not allowed), exclude caffeinated items in general loop
      if (
        options?.allowCaffeine === false ||
        (goalCaf > 0 && addedCaf >= goalCaf)
      ) {
        list = list.filter((i) => (i.caffeineMg || 0) <= 0);
      } else if (options?.preferCaffeine) {
        // Optionally bias toward caffeinated items only when still under goal
        const caf = list.filter((i) => (i.caffeineMg || 0) > 0);
        const non = list.filter((i) => (i.caffeineMg || 0) <= 0);
        list = caf.concat(non);
      }
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
      // Pick among top candidates, but ensure stock availability
      const topIdx = Math.min(
        sorted.length - 1,
        Math.floor(rnd() * Math.min(2, sorted.length))
      );
      // Try up to first 3 sorted items to find one with stock
      let found: NutritionItem | undefined;
      for (let k = 0; k < Math.min(3, sorted.length); k++) {
        const cand = sorted[Math.min(sorted.length - 1, topIdx + k)];
        const ok = options?.remainingStock
          ? (options.remainingStock.get(cand.id) ?? Infinity) > 0
          : true;
        if (ok) {
          found = cand;
          break;
        }
      }
      chosen = found || sorted[0];
      // Enforce not repeating same form more than once in a row when alternatives exist
      if (lastForm === f && consecForm >= 1 && formOrder.length > 1) {
        continue;
      }
      break;
    }
    if (!chosen) {
      // Fallback: pick smallest
      chosen =
        solids
          .slice()
          .sort((a, b) => a.carbsPerUnit - b.carbsPerUnit)
          .find((it) =>
            options?.remainingStock
              ? (options.remainingStock.get(it.id) ?? Infinity) > 0
              : true
          ) || solids[0];
    }

    picks.push(chosen);
    if (options?.remainingStock) {
      const left = options.remainingStock.get(chosen.id);
      if (left !== undefined)
        options.remainingStock.set(chosen.id, Math.max(0, left - 1));
    }
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
  // Athlete caffeine budget (mg) based on weight
  const weightKg = config.weightKg || 70;
  const cafCapMg = Math.min(6 * weightKg, 500); // hard cap per day/event
  // Aim a bit higher to better cover 1 full night + finish: ~5 mg/kg, min 240 mg, but never over hard cap
  const cafTargetMg = Math.max(240, Math.min(5 * weightKg, cafCapMg));
  let remainingCaffeineBudgetMg = cafTargetMg;
  let caffeineConsumedMg = 0;
  let lastCaffeineTimeSec: number | null = null;
  // Build remaining stock map (undefined => unlimited)
  const remainingStock = new Map<string, number>();
  for (const it of items) {
    if (typeof it.maxUnitsAvailable === "number") {
      remainingStock.set(it.id, Math.max(0, Math.floor(it.maxUnitsAvailable)));
    }
  }

  const legs: LegNutritionPlan[] = [];
  let totalCarbsTarget = 0;
  let totalCarbsViaFlasks = 0;
  let totalCarbsViaFoods = 0;
  let totalHydration = 0;
  let totalCarry = 0;

  let nutCumulativeKm = 0;
  let raceTimeCumSec = 0; // from start, includes stops
  let finalBoosterTaken = false; // ensure only one end-of-race booster
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

    // Decide caffeine strategy for this leg
    const legCenterGlobalTimeSec = raceTimeCumSec + leg.totalTimeSec / 2;
    const legCenterDate = new Date(
      startDate.getTime() + legCenterGlobalTimeSec * 1000
    );
    const hour = legCenterDate.getHours();
    const isNightByClock = hour < 7 || hour >= 19;
    const raceElapsedH = legCenterGlobalTimeSec / 3600;
    const totalRaceTimeSec = plan.totals.totalTimeSec || 0;
    const hoursRemaining =
      totalRaceTimeSec > 0
        ? Math.max(0, (totalRaceTimeSec - legCenterGlobalTimeSec) / 3600)
        : 0;
    const hoursSinceLastCaf =
      lastCaffeineTimeSec == null
        ? Number.POSITIVE_INFINITY
        : Math.max(0, (legCenterGlobalTimeSec - lastCaffeineTimeSec) / 3600);

    // Compute target caffeinated units per strategy
    const caffeinatedInCatalog = (nutCfg.items || []).some(
      (it) => (it.caffeineMg || 0) > 0
    );
    let caffeinatedUnitsGoal = 0;
    let allowCaffeine = false;
    let caffeinePreferHighDose = false;
    // Allow planning if we still have target budget, or we're in the final window where a last booster is allowed under the hard cap
    if (
      caffeinatedInCatalog &&
      (remainingCaffeineBudgetMg > 0 || hoursRemaining <= 6)
    ) {
      if (raceElapsedH < 6) {
        // Early race: avoid caffeine (<5h)
        allowCaffeine = false;
      } else if (hour >= 6 && hour < 9 && remainingCaffeineBudgetMg > 0) {
        // Dawn window (06:00–09:00): allow a small reinforcement if sufficiently spaced
        if (hoursSinceLastCaf >= 2.0) {
          allowCaffeine = true;
          const cafItems = items.filter(
            (it) => (it.caffeineMg || 0) > 0 && it.form !== "liquid"
          );
          const has50 = cafItems.some((it) => (it.caffeineMg || 0) >= 45);
          if (remainingCaffeineBudgetMg >= 50 && has50) {
            caffeinatedUnitsGoal = 1; // 1x 50 mg
          }
        }
      } else if (isNightByClock) {
        // Night window: dose every 3–4h
        if (hoursSinceLastCaf >= 3) {
          allowCaffeine = true;
          // Option B: keep night doses at 50 mg by default (fallback to 100 mg only if 50 mg not available)
          caffeinePreferHighDose = false;
          const cafItems = items.filter(
            (it) => (it.caffeineMg || 0) > 0 && it.form !== "liquid"
          );
          const has50 = cafItems.some((it) => (it.caffeineMg || 0) >= 45);
          const has100 = cafItems.some((it) => (it.caffeineMg || 0) >= 90);
          if (remainingCaffeineBudgetMg >= 50 && has50) {
            caffeinatedUnitsGoal = 1; // 1x 50 mg
          } else if (remainingCaffeineBudgetMg >= 90 && has100) {
            caffeinatedUnitsGoal = 1; // fallback 1x 100 mg
            caffeinePreferHighDose = true;
          }
        }
      } else if (hoursRemaining <= 6) {
        // End of race booster (last 3–6h). Here we use ≤6h window for robustness
        if (
          hoursSinceLastCaf >= 2 &&
          !finalBoosterTaken &&
          hoursRemaining <= 3
        ) {
          allowCaffeine = true;
          caffeinePreferHighDose = true; // finish booster: prefer 100 mg if possible
          const cafItems = items.filter(
            (it) => (it.caffeineMg || 0) > 0 && it.form !== "liquid"
          );
          const has100 = cafItems.some((it) => (it.caffeineMg || 0) >= 90);
          const has50 = cafItems.some((it) => (it.caffeineMg || 0) >= 45);
          // Allow final booster even if the target is reached, as long as we stay under the hard cap
          const capRemaining = Math.max(0, cafCapMg - caffeineConsumedMg);
          if (capRemaining >= 90 && has100)
            caffeinatedUnitsGoal = 1; // 1x 100 mg
          else if (capRemaining >= 50 && has50) caffeinatedUnitsGoal = 1; // 1x 50 mg
        }
      }
      // Bounds and feasibility
      caffeinatedUnitsGoal = Math.max(0, Math.min(3, caffeinatedUnitsGoal));
      const minCafCarb = (nutCfg.items || [])
        .filter((it) => (it.caffeineMg || 0) > 0 && it.form !== "liquid")
        .reduce((m, it) => Math.min(m, it.carbsPerUnit || Infinity), Infinity);
      if (
        !Number.isFinite(minCafCarb) ||
        // Allow a small overshoot (<= ~12 g) to fit one caffeinated gel when solids target is slightly low
        carbsViaFoods + 12 < (minCafCarb as number)
      ) {
        caffeinatedUnitsGoal = 0;
      }
    }
    const foods = pickFoods(carbsViaFoods, items, i + 1, {
      caffeinatedUnitsGoal,
      // We don't bias further to caffeine outside the initial goal
      preferCaffeine: false,
      allowCaffeine,
      remainingStock,
      caffeinePreferHighDose,
    });
    const foodsWithCaffeine = foods.map((f) => {
      const meta = items.find((it) => it.id === f.itemId);
      return { ...f, caffeineMgPerUnit: meta?.caffeineMg };
    });
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
        foodsWithCaffeine.reduce((a, x) => a + x.carbsG, 0)
      ),
      hydrationLitres: hydrationL,
      carryLitres: carryMl / 1000,
      flasksCount: roundedFlasks,
      drinkMixCarbsG: drinkMixGrams,
      selectedFoods: foodsWithCaffeine,
      pickupAtStart: {
        flasksToFill: roundedFlasks,
        fillVolumeMl: carryMl,
        items: foodsWithCaffeine,
      },
    });

    totalCarbsTarget += legChoTarget;
    totalCarbsViaFlasks += carbsViaDrink;
    totalCarbsViaFoods += foodsWithCaffeine.reduce((a, x) => a + x.carbsG, 0);
    totalHydration += hydrationL;
    totalCarry += carryMl / 1000;

    // Track caffeine consumption and last intake time (use leg center time to mark)
    const legCafMg = foodsWithCaffeine.reduce(
      (a, x) => a + (x.caffeineMgPerUnit || 0) * x.units,
      0
    );
    if (legCafMg > 0) {
      caffeineConsumedMg += legCafMg;
      remainingCaffeineBudgetMg = Math.max(0, cafTargetMg - caffeineConsumedMg);
      lastCaffeineTimeSec = legCenterGlobalTimeSec;
      // If we are in final window (<=3h) and allowed caffeine, mark the final booster as taken
      if (allowCaffeine && hoursRemaining <= 3) {
        finalBoosterTaken = true;
      }
    }
    // Advance race cumulative time (includes the current leg total)
    raceTimeCumSec += leg.totalTimeSec;
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
