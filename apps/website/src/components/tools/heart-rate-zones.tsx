'use client';

import { Container } from '@/components/landing/container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { useMemo, useState } from 'react';

interface HeartRateZone {
  name: string;
  minPercent: number;
  maxPercent: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

const ZONES: HeartRateZone[] = [
  {
    name: 'zone_1',
    minPercent: 50,
    maxPercent: 60,
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    name: 'zone_2',
    minPercent: 60,
    maxPercent: 70,
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  {
    name: 'zone_3',
    minPercent: 70,
    maxPercent: 80,
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  {
    name: 'zone_4',
    minPercent: 80,
    maxPercent: 90,
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  {
    name: 'zone_5',
    minPercent: 90,
    maxPercent: 100,
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
  },
];

function calculateMaxHR(age: number): number {
  return 220 - age;
}

function calculateTargetHR(
  maxHR: number,
  restingHR: number,
  intensityPercent: number,
): number {
  // Karvonen formula: Target HR = ((Max HR - Resting HR) × Intensity%) + Resting HR
  return Math.round((maxHR - restingHR) * (intensityPercent / 100) + restingHR);
}

function calculateZoneRange(
  maxHR: number,
  restingHR: number,
  zone: HeartRateZone,
): { min: number; max: number } {
  return {
    min: calculateTargetHR(maxHR, restingHR, zone.minPercent),
    max: calculateTargetHR(maxHR, restingHR, zone.maxPercent),
  };
}

export function HeartRateZones() {
  const [age, setAge] = useState<number>(30);
  const [maxHR, setMaxHR] = useState<string>('');
  const [restingHR, setRestingHR] = useState<number>(60);

  const calculatedMaxHR = useMemo(() => calculateMaxHR(age), [age]);
  const effectiveMaxHR = useMemo(() => {
    return maxHR ? parseFloat(maxHR) || calculatedMaxHR : calculatedMaxHR;
  }, [maxHR, calculatedMaxHR]);

  const zones = useMemo(() => {
    return ZONES.map((zone) => {
      const range = calculateZoneRange(effectiveMaxHR, restingHR, zone);
      return {
        ...zone,
        range,
      };
    });
  }, [effectiveMaxHR, restingHR]);

  const getZoneName = (zoneName: string): string => {
    switch (zoneName) {
      case 'zone_1':
        return m.tool_heart_rate_zone_1();
      case 'zone_2':
        return m.tool_heart_rate_zone_2();
      case 'zone_3':
        return m.tool_heart_rate_zone_3();
      case 'zone_4':
        return m.tool_heart_rate_zone_4();
      case 'zone_5':
        return m.tool_heart_rate_zone_5();
      default:
        return '';
    }
  };

  return (
    <Container>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            {m.tool_heart_rate_title()}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {m.tool_heart_rate_description()}
          </p>
        </div>

        {/* Calculator */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Calculator</CardTitle>
            <CardDescription>
              Enter your age and resting heart rate to calculate your training
              zones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Age Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="age">{m.tool_heart_rate_input_age()}</Label>
                <span className="text-2xl font-bold text-primary">{age}</span>
              </div>
              <input
                id="age"
                type="range"
                min="15"
                max="80"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>15</span>
                <span>80</span>
              </div>
            </div>

            {/* Max HR Input */}
            <div>
              <Label htmlFor="max-hr">
                {m.tool_heart_rate_input_max_hr_optional()}
              </Label>
              <Input
                id="max-hr"
                type="number"
                inputMode="decimal"
                value={maxHR}
                onChange={(e) => setMaxHR(e.target.value)}
                placeholder={calculatedMaxHR.toString()}
                className="mt-2"
                min="120"
                max="220"
              />
              {!maxHR && (
                <p className="text-xs text-muted-foreground mt-1">
                  {m.tool_heart_rate_calculated_max()}: {calculatedMaxHR} bpm
                </p>
              )}
            </div>

            {/* Resting HR Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="resting-hr">
                  {m.tool_heart_rate_input_resting_hr()}
                </Label>
                <span className="text-2xl font-bold text-primary">
                  {restingHR}
                </span>
              </div>
              <input
                id="resting-hr"
                type="range"
                min="40"
                max="100"
                value={restingHR}
                onChange={(e) => setRestingHR(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>40</span>
                <span>100</span>
              </div>
            </div>

            {/* Zones Display */}
            <div className="pt-6 border-t space-y-4">
              <h3 className="text-lg font-semibold mb-4">
                {m.tool_heart_rate_zones_title()}
              </h3>
              {zones.map((zone) => {
                const isZone2 = zone.name === 'zone_2';
                return (
                  <div
                    key={zone.name}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all',
                      zone.bgColor,
                      zone.borderColor,
                      isZone2 && 'ring-2 ring-offset-2 ring-green-500',
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={cn('font-semibold text-lg', zone.color)}>
                        {getZoneName(zone.name)}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {zone.minPercent}-{zone.maxPercent}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold">
                      {m.tool_heart_rate_zone_range({
                        min: zone.range.min.toString(),
                        max: zone.range.max.toString(),
                      })}
                    </p>
                    {isZone2 && (
                      <p className="text-sm text-green-700 dark:text-green-300 mt-2 font-medium">
                        {m.tool_heart_rate_zone_2_note()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Explanations */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{m.tool_heart_rate_explanation_title()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {m.tool_heart_rate_explanation_content()}
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {m.tool_heart_rate_zones_explanation()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{m.tool_heart_rate_karvonen_title()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {m.tool_heart_rate_karvonen_content()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{m.tool_heart_rate_how_to_title()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {m.tool_heart_rate_how_to_content()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
