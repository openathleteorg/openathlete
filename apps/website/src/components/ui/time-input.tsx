'use client';

import { cn } from '@/utils/shadcn';
import * as React from 'react';

interface TimeInputProps
  extends Omit<React.ComponentProps<'input'>, 'type' | 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export function TimeInput({
  value,
  onChange,
  className,
  ...props
}: TimeInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const formatTime = (input: string, previousValue: string): string => {
    // If input already has colons, allow manual entry but validate format
    if (input.includes(':')) {
      // If user is deleting, allow partial input
      if (input.length < previousValue.length) {
        return input;
      }

      const parts = input.split(':');
      // Extract only digits from all parts
      const numbers = parts.join('').replace(/\D/g, '').slice(0, 6);

      if (numbers.length === 0) {
        return '';
      }

      // Only auto-format if we have enough digits (at least 4 for MM:SS)
      if (numbers.length >= 4) {
        const padded = numbers.padEnd(6, '0');
        return `${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`;
      }

      // Otherwise, allow partial format
      return input;
    }

    // Remove all non-numeric characters
    const numbers = input.replace(/\D/g, '');

    // If empty, allow empty string (will show placeholder)
    if (numbers.length === 0) {
      return '';
    }

    // Only auto-format if we have at least 2 digits
    if (numbers.length >= 2) {
      // Limit to 6 digits (HHMMSS)
      const limited = numbers.slice(0, 6);
      const padded = limited.padEnd(6, '0');

      // Format as HH:MM:SS
      const hours = padded.slice(0, 2);
      const minutes = padded.slice(2, 4);
      const seconds = padded.slice(4, 6);

      return `${hours}:${minutes}:${seconds}`;
    }

    // Allow single digit input
    return numbers;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatTime(input, value);
    onChange(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow all control keys
    if (
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      // Allow backspace, delete, tab, escape, enter
      [8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
      // Allow home, end, left, right, up, down
      (e.keyCode >= 35 && e.keyCode <= 40)
    ) {
      return;
    }

    // Allow colon for manual entry
    if (e.key === ':' || e.keyCode === 186) {
      return;
    }

    // Allow numbers (both main keyboard and numpad)
    if (
      (e.keyCode >= 48 && e.keyCode <= 57) ||
      (e.keyCode >= 96 && e.keyCode <= 105)
    ) {
      return;
    }

    // Block everything else
    e.preventDefault();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="00:00:00"
      maxLength={8}
      className={cn(
        'border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}
