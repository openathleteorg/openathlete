import { useGenerateEventMutation } from '@/api/agent';
import { m } from '@/paraglide/messages';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { CreateEventDto } from '@openathlete/shared';

import { FormProvider } from '../hook-form';
import { RHFTextarea } from '../hook-form/rhf-textarea';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

type P = {
  open: boolean;
  onClose: () => void;
  date: Date;
  onEventGenerated: (event: CreateEventDto) => void;
};

const promptSchema = z.object({
  prompt: z.string().min(1, m.required()).max(500),
});

type PromptFormValues = z.infer<typeof promptSchema>;

export function AIGenerateEventDialog({
  open,
  onClose,
  date,
  onEventGenerated,
}: P) {
  const methods = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      prompt: '',
    },
  });

  const generateEventMutation = useGenerateEventMutation();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      methods.reset({ prompt: '' });
    }
  }, [open, methods]);

  const onSubmit = methods.handleSubmit(async (data) => {
    try {
      const generatedEvent = await generateEventMutation.mutateAsync({
        prompt: data.prompt,
        date,
      });

      toast.success(m.event_generated_successfully());
      onEventGenerated(generatedEvent);
      methods.reset();
      onClose();
    } catch (error) {
      toast.error(m.failed_to_generate_event());
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={`sm:max-w-2xl ${generateEventMutation.isPending ? 'overflow-visible' : ''}`}
      >
        <div
          className={
            generateEventMutation.isPending ? 'ai-rotating-brand-border' : ''
          }
        >
          <DialogHeader>
            <DialogTitle>{m.create_with_ai()}</DialogTitle>
            <DialogDescription>
              {m.ai_generate_event_dialog_description()}
            </DialogDescription>
          </DialogHeader>
          <FormProvider methods={methods} onSubmit={onSubmit}>
            <div className="space-y-4 pt-3">
              <RHFTextarea
                name="prompt"
                label={m.ai_generate_event_prompt_label()}
                placeholder={m.ai_generate_event_prompt_placeholder()}
                className="min-h-[120px]"
                required
                disabled={generateEventMutation.isPending}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={generateEventMutation.isPending}
                >
                  {m.cancel()}
                </Button>
                <Button
                  type="submit"
                  disabled={generateEventMutation.isPending}
                >
                  {generateEventMutation.isPending
                    ? m.generating_event()
                    : m.generate()}
                </Button>
              </div>
            </div>
          </FormProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
