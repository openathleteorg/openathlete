import { RHFTextField } from '@/components/hook-form';
import { FormProvider } from '@/components/hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { m } from '@/paraglide/messages';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import z from 'zod';

const inviteAthleteSchema = z.object({
  email: z.string().email(),
});

type InviteAthleteForm = z.infer<typeof inviteAthleteSchema>;

interface P {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string) => void;
  isLoading?: boolean;
}

export function InviteAthleteDialog({ open, onClose, onInvite, isLoading }: P) {
  const methods = useForm<InviteAthleteForm>({
    resolver: zodResolver(inviteAthleteSchema),
    defaultValues: { email: '' },
  });

  const { handleSubmit, reset } = methods;

  const onSubmit = handleSubmit((data) => {
    onInvite(data.email);
    reset();
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m.invite_athlete()}</DialogTitle>
        </DialogHeader>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {m.invite_athlete_instructions()}
            </p>
            <RHFTextField
              name="email"
              type="email"
              label={m.email()}
              placeholder={m.enter_athlete_email()}
              required
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  onClose();
                }}
                disabled={isLoading}
              >
                {m.cancel()}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? m.sending() : m.invite()}
              </Button>
            </div>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
