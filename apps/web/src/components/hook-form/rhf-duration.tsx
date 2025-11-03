import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { ComponentProps, useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Input } from '../ui/input';
import { Label } from '../ui/label';

type Props = Omit<ComponentProps<'input'>, 'onChange'> & {
  name: string;
  label?: string;
  value?: number;
  onChange?: (value: number | undefined) => void;
  showSeconds?: boolean;
};

export const RHFDuration = ({
  name,
  type,
  label,
  value,
  onChange,
  showSeconds = false,
  ...other
}: Props) => {
  const { control } = useFormContext();

  return (
    <div className="grid gap-3">
      {label && (
        <Label htmlFor={name}>
          {label} {other.required ? '*' : ''}
        </Label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => {
          const [hoursInput, setHoursInput] = useState<string>(
            field.value ? Math.floor(field.value / 3600).toString() : '',
          );
          const [minutesInput, setMinutesInput] = useState<string>(
            field.value ? Math.floor((field.value % 3600) / 60).toString() : '',
          );
          const [secondsInput, setSecondsInput] = useState<string>(
            showSeconds && field.value
              ? Math.floor(field.value % 60).toString()
              : '',
          );

          useEffect(() => {
            if (field.value === undefined || field.value === null) {
              setHoursInput('');
              setMinutesInput('');
              if (showSeconds) {
                setSecondsInput('');
              }
            } else {
              setHoursInput(Math.floor(field.value / 3600).toString());
              setMinutesInput(Math.floor((field.value % 3600) / 60).toString());
              if (showSeconds) {
                setSecondsInput(Math.floor(field.value % 60).toString());
              }
            }
          }, [field.value, showSeconds]);

          const updateFormValue = (
            hours: string,
            minutes: string,
            seconds: string,
          ) => {
            const hoursNum = hours === '' ? 0 : parseInt(hours, 10);
            const minutesNum = minutes === '' ? 0 : parseInt(minutes, 10);
            const secondsNum =
              showSeconds && seconds !== '' ? parseInt(seconds, 10) : 0;

            if (
              hours === '' &&
              minutes === '' &&
              (!showSeconds || seconds === '')
            ) {
              field.onChange(undefined);
              onChange?.(undefined);
            } else {
              const totalSeconds =
                hoursNum * 3600 + minutesNum * 60 + secondsNum;
              field.onChange(totalSeconds);
              onChange?.(totalSeconds);
            }
          };

          return (
            <div className="flex items-center w-full">
              <div className="flex items-center flex-1">
                <Input
                  type="number"
                  min={0}
                  value={hoursInput}
                  onChange={(event) => {
                    const newHoursInput = event.target.value;
                    setHoursInput(newHoursInput);
                    updateFormValue(newHoursInput, minutesInput, secondsInput);
                  }}
                  {...other}
                  className={cn(
                    other.className,
                    'rounded-br-none rounded-tr-none flex-1',
                    error && 'border-red-500',
                  )}
                />
                <div className="rounded-none border border-l-0 shadow-xs py-1.25 px-3 text-base shrink-0">
                  <span className="text-md text-gray-500">{m.hours()}</span>
                </div>
              </div>
              <div className="flex items-center flex-1">
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={minutesInput}
                  onChange={(event) => {
                    const newMinutesInput = event.target.value;
                    setMinutesInput(newMinutesInput);
                    updateFormValue(hoursInput, newMinutesInput, secondsInput);
                  }}
                  {...other}
                  className={cn(
                    other.className,
                    'rounded-none border-l-0 flex-1',
                    error && 'border-red-500',
                  )}
                />
                <div
                  className={cn(
                    'rounded-none border border-l-0 shadow-xs py-1.25 px-3 text-base shrink-0',
                    !showSeconds && 'rounded-l-none rounded-r-md',
                  )}
                >
                  <span className="text-md text-gray-500">{m.minutes()}</span>
                </div>
              </div>
              {showSeconds && (
                <div className="flex items-center flex-1">
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={secondsInput}
                    onChange={(event) => {
                      const newSecondsInput = event.target.value;
                      setSecondsInput(newSecondsInput);
                      updateFormValue(
                        hoursInput,
                        minutesInput,
                        newSecondsInput,
                      );
                    }}
                    {...other}
                    className={cn(
                      other.className,
                      'rounded-none border-l-0 flex-1',
                      error && 'border-red-500',
                    )}
                  />
                  <div className="rounded-l-none rounded-r-md border border-l-0 shadow-xs py-1.25 px-3 text-base shrink-0">
                    <span className="text-md text-gray-500">
                      {m.unit_seconds()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
};
