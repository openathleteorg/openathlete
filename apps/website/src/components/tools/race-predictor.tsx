'use client';

import { Container } from '@/components/landing/container';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimeInput } from '@/components/ui/time-input';
import { APP_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { AlertCircle } from 'lucide-react';
import { useMemo, useState } from 'react';

declare global {
  interface Window {
    gtag_report_conversion?: (url?: string) => boolean;
  }
}

function parseTime(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    if (secs > 0) {
      return `${hours}h ${minutes}min ${secs}s`;
    }
    return `${hours}h ${minutes}min`;
  }
  if (secs > 0) {
    return `${minutes}min ${secs}s`;
  }
  return `${minutes}min`;
}

function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
}

function calculateRaceTime(
  referenceDistance: number,
  referenceTimeSeconds: number,
  targetDistance: number,
): number | null {
  if (
    !referenceDistance ||
    !referenceTimeSeconds ||
    !targetDistance ||
    referenceDistance <= 0 ||
    targetDistance <= 0 ||
    referenceTimeSeconds <= 0
  ) {
    return null;
  }

  // Riegel formula: T₂ = T₁ × (D₂/D₁)^1.06
  const ratio = targetDistance / referenceDistance;
  const estimatedTimeSeconds = referenceTimeSeconds * Math.pow(ratio, 1.06);

  return estimatedTimeSeconds;
}

function calculatePace(timeSeconds: number, distanceKm: number): number {
  return timeSeconds / distanceKm;
}

export function RacePredictor() {
  const [referenceDistance, setReferenceDistance] = useState<string>('10');
  const [referenceTime, setReferenceTime] = useState<string>('00:50:00');
  const [targetDistance, setTargetDistance] = useState<string>('42.2');

  const referenceTimeSeconds = useMemo(
    () => parseTime(referenceTime),
    [referenceTime],
  );
  const referenceDistanceNum = useMemo(
    () => parseFloat(referenceDistance) || 0,
    [referenceDistance],
  );
  const targetDistanceNum = useMemo(
    () => parseFloat(targetDistance) || 0,
    [targetDistance],
  );

  const estimatedTimeSeconds = useMemo(() => {
    return calculateRaceTime(
      referenceDistanceNum,
      referenceTimeSeconds,
      targetDistanceNum,
    );
  }, [referenceDistanceNum, referenceTimeSeconds, targetDistanceNum]);

  const targetPace = useMemo(() => {
    if (!estimatedTimeSeconds) return null;
    return calculatePace(estimatedTimeSeconds, targetDistanceNum);
  }, [estimatedTimeSeconds, targetDistanceNum]);

  const handleDistanceClick = (distance: string) => {
    setTargetDistance(distance);
  };

  const signupUrl = `${APP_URL}/auth/create-account`;

  const handleSignupClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && window.gtag_report_conversion) {
      window.gtag_report_conversion(signupUrl);
    } else {
      // Fallback if gtag is not loaded yet
      window.location.href = signupUrl;
    }
  };

  return (
    <Container>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            {m.tool_race_predictor_title()}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {m.tool_race_predictor_description()}
          </p>
        </div>

        {/* Calculator */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Calculator</CardTitle>
            <CardDescription>
              Enter your reference performance and target distance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="reference-distance">
                  {m.tool_race_predictor_input_reference_distance()}
                </Label>
                <Input
                  id="reference-distance"
                  type="number"
                  inputMode="decimal"
                  value={referenceDistance}
                  onChange={(e) => setReferenceDistance(e.target.value)}
                  placeholder="10"
                  className="mt-2"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <Label htmlFor="reference-time">
                  {m.tool_race_predictor_input_reference_time()}
                </Label>
                <TimeInput
                  id="reference-time"
                  value={referenceTime}
                  onChange={setReferenceTime}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="target-distance">
                {m.tool_race_predictor_input_target_distance()}
              </Label>
              <Input
                id="target-distance"
                type="number"
                inputMode="decimal"
                value={targetDistance}
                onChange={(e) => setTargetDistance(e.target.value)}
                placeholder="42.2"
                className="mt-2"
                min="0"
                step="0.1"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDistanceClick('5')}
                  type="button"
                >
                  {m.tool_race_predictor_distance_5km()}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDistanceClick('10')}
                  type="button"
                >
                  {m.tool_race_predictor_distance_10km()}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDistanceClick('21.1')}
                  type="button"
                >
                  {m.tool_race_predictor_distance_half_marathon()}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDistanceClick('42.2')}
                  type="button"
                >
                  {m.tool_race_predictor_distance_marathon()}
                </Button>
              </div>
            </div>

            {estimatedTimeSeconds && (
              <div className="pt-6 border-t">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    {m.tool_race_predictor_result_title()}
                  </p>
                  <p className="text-5xl font-bold text-primary">
                    {formatTime(estimatedTimeSeconds)}
                  </p>
                </div>

                {targetPace && (
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-2">
                      {m.tool_race_predictor_result_pace()}
                    </p>
                    <p className="text-2xl font-semibold">
                      {formatPace(targetPace)}
                    </p>
                  </div>
                )}

                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                        {m.tool_race_predictor_warning_title()}
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                        {m.tool_race_predictor_warning_content()}
                      </p>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                      >
                        <a
                          href={signupUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={handleSignupClick}
                        >
                          {m.tool_race_predictor_get_plan()}
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Explanations */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{m.tool_race_predictor_explanation_title()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {m.tool_race_predictor_explanation_content()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{m.tool_race_predictor_how_to_title()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {m.tool_race_predictor_how_to_content()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
