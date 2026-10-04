import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Eye, EyeOff } from 'lucide-react';
import { ComponentProps, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

type Props = Omit<ComponentProps<'input'>, 'type'> & {
  name: string;
  label?: string;
};

/**
 * Password input with a show/hide button, hidden by default. The button never
 * submits the form and leaves the focus in the field.
 */
export const RHFPasswordField = ({
  name,
  label,
  id = name,
  className,
  ...other
}: Props) => {
  const { control } = useFormContext();
  const [visible, setVisible] = useState(false);

  return (
    <div className="grid gap-3">
      {label && (
        <Label htmlFor={id}>
          {label} {other.required ? '*' : ''}
        </Label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <>
            <div className="relative">
              <Input
                {...field}
                value={field.value ?? ''}
                id={id}
                type={visible ? 'text' : 'password'}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                {...other}
                className={cn(
                  'h-11 pr-12',
                  className,
                  error && 'border-red-500',
                )}
                aria-invalid={!!error}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute inset-y-0 right-0 h-full w-11 text-muted-foreground"
                aria-label={visible ? m.hide_password() : m.show_password()}
                aria-controls={id}
                aria-pressed={visible}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setVisible((current) => !current)}
              >
                {visible ? (
                  <EyeOff className="size-5" aria-hidden="true" />
                ) : (
                  <Eye className="size-5" aria-hidden="true" />
                )}
              </Button>
            </div>
            {error?.message && (
              <p role="alert" className="text-sm text-red-500">
                {error.message}
              </p>
            )}
          </>
        )}
      />
    </div>
  );
};
