import { FormProvider, RHFTextField } from '@/components/hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { m } from '@/paraglide/messages';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  title: string;
  description?: string;
  label: string;
  submitLabel: string;
  maxLength: number;
  defaultValue?: string;
  isLoading?: boolean;
};

/** Asks for one name: a new club, a new group, a rename. */
export function NameDialog({
  open,
  onClose,
  onSubmit,
  title,
  description,
  label,
  submitLabel,
  maxLength,
  defaultValue = '',
  isLoading,
}: Props) {
  const methods = useForm<{ name: string }>({
    resolver: zodResolver(
      z.object({ name: z.string().trim().min(1).max(maxLength) }),
    ),
    defaultValues: { name: defaultValue },
  });
  const { reset, handleSubmit } = methods;

  useEffect(() => {
    if (open) reset({ name: defaultValue });
  }, [open, defaultValue, reset]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <FormProvider
          methods={methods}
          onSubmit={handleSubmit((data) => onSubmit(data.name.trim()))}
        >
          <div className="flex flex-col gap-4">
            <RHFTextField
              name="name"
              label={label}
              maxLength={maxLength}
              autoFocus
              required
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {m.cancel()}
              </Button>
              <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                {submitLabel}
              </Button>
            </div>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
