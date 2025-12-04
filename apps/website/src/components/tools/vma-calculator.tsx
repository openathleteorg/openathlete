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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { m } from '@/paraglide/messages';
import { useMemo, useState } from 'react';

type TestType = 'demi-cooper' | 'cooper' | '5km' | '10km';

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

function calculateVMA(
  distance: number,
  timeSeconds: number,
  testType: TestType,
): number | null {
  if (!distance || !timeSeconds || timeSeconds <= 0) {
    return null;
  }

  // For fixed time tests (Demi-Cooper, Cooper)
  if (testType === 'demi-cooper' || testType === 'cooper') {
    // VMA = Distance (m) / Time (s) × 3.6
    return (distance / timeSeconds) * 3.6;
  }

  // For race performances (5km, 10km)
  // VMA ≈ Average speed × 1.1
  const averageSpeedKmh = (distance / 1000 / timeSeconds) * 3600;
  return averageSpeedKmh * 1.1;
}

function calculateTrainingPace(vma: number, percentage: number): number {
  return vma * (percentage / 100);
}

export function VMACalculator() {
  const [distance, setDistance] = useState<string>('1400');
  const [time, setTime] = useState<string>('06:00');
  const [testType, setTestType] = useState<TestType>('demi-cooper');

  // Update default values when test type changes
  const handleTestTypeChange = (newTestType: TestType) => {
    setTestType(newTestType);

    // Set fixed time for time-based tests
    if (newTestType === 'demi-cooper') {
      setTime('06:00');
    } else if (newTestType === 'cooper') {
      setTime('12:00');
    }

    // Set fixed distance for race tests
    if (newTestType === '5km') {
      setDistance('5000');
    } else if (newTestType === '10km') {
      setDistance('10000');
    }
  };

  const timeSeconds = useMemo(() => parseTime(time), [time]);
  const distanceNum = useMemo(() => parseFloat(distance) || 0, [distance]);

  const vma = useMemo(() => {
    return calculateVMA(distanceNum, timeSeconds, testType);
  }, [distanceNum, timeSeconds, testType]);

  const endurancePace = useMemo(() => {
    if (!vma) return null;
    return calculateTrainingPace(vma, 65);
  }, [vma]);

  const thresholdPace = useMemo(() => {
    if (!vma) return null;
    return calculateTrainingPace(vma, 85);
  }, [vma]);

  return (
    <Container>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            {m.tool_vma_title()}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {m.tool_vma_description()}
          </p>
        </div>

        {/* Calculator */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Calculator</CardTitle>
            <CardDescription>
              Enter your test results to calculate your VMA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="test-type">{m.tool_vma_input_test_type()}</Label>
              <Select
                value={testType}
                onValueChange={(value) =>
                  handleTestTypeChange(value as TestType)
                }
              >
                <SelectTrigger id="test-type" className="w-full mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demi-cooper">
                    {m.tool_vma_test_demi_cooper()}
                  </SelectItem>
                  <SelectItem value="cooper">
                    {m.tool_vma_test_cooper()}
                  </SelectItem>
                  <SelectItem value="5km">{m.tool_vma_test_5km()}</SelectItem>
                  <SelectItem value="10km">{m.tool_vma_test_10km()}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="distance">{m.tool_vma_input_distance()}</Label>
                <Input
                  id="distance"
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder={
                    testType === '5km'
                      ? '5000'
                      : testType === '10km'
                        ? '10000'
                        : '1400'
                  }
                  className="mt-2"
                  min="0"
                  disabled={testType === '5km' || testType === '10km'}
                />
                {testType === '5km' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {m.tool_vma_fixed_distance_5km()}
                  </p>
                )}
                {testType === '10km' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {m.tool_vma_fixed_distance_10km()}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="time">{m.tool_vma_input_time()}</Label>
                <Input
                  id="time"
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder={
                    testType === 'demi-cooper'
                      ? '06:00'
                      : testType === 'cooper'
                        ? '12:00'
                        : '00:00:00'
                  }
                  className="mt-2"
                  pattern="[0-9]{1,2}:[0-5][0-9]:[0-5][0-9]"
                  disabled={testType === 'demi-cooper' || testType === 'cooper'}
                />
                {testType === 'demi-cooper' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {m.tool_vma_fixed_time_demi_cooper()}
                  </p>
                )}
                {testType === 'cooper' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {m.tool_vma_fixed_time_cooper()}
                  </p>
                )}
              </div>
            </div>

            {vma && (
              <div className="pt-6 border-t">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    {m.tool_vma_result_title()}
                  </p>
                  <p className="text-5xl font-bold text-primary">
                    {vma.toFixed(1)} km/h
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      {m.tool_vma_allure_endurance()}
                    </p>
                    <p className="text-2xl font-semibold">
                      {endurancePace?.toFixed(1)} km/h
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      {m.tool_vma_allure_seuil()}
                    </p>
                    <p className="text-2xl font-semibold">
                      {thresholdPace?.toFixed(1)} km/h
                    </p>
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
              <CardTitle>{m.tool_vma_explanation_title()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {m.tool_vma_explanation_content()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{m.tool_vma_how_to_title()}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">
                  {m.tool_vma_test_demi_cooper()}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {m.tool_vma_how_to_demi_cooper()}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  {m.tool_vma_test_cooper()}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {m.tool_vma_how_to_cooper()}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">
                  {m.tool_vma_test_5km()} / {m.tool_vma_test_10km()}
                </h4>
                <p className="text-muted-foreground text-sm">
                  {m.tool_vma_how_to_race()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{m.tool_vma_training_title()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {m.tool_vma_training_content()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
