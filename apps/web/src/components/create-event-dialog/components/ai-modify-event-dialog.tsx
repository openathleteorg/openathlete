import { useGenerateEventMutation, useModifyEventMutation } from '@/api/agent';
import { m } from '@/paraglide/messages';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import type { CreateEventDto, UpdateEventDto } from '@openathlete/shared';

import { FormProvider } from '../../hook-form';
import { RHFTextarea } from '../../hook-form/rhf-textarea';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';

type Props = {
  open: boolean;
  onClose: () => void;
  eventData: CreateEventDto;
  date?: Date;
  isCreateMode: boolean;
  onEventGenerated?: (event: CreateEventDto) => void;
  onEventModified?: (event: UpdateEventDto) => void;
};

const promptSchema = z.object({
  prompt: z.string().min(1, m.required()).max(500),
});

type PromptFormValues = z.infer<typeof promptSchema>;

export function AIModifyEventDialog({
  open,
  onClose,
  eventData,
  date,
  isCreateMode,
  onEventGenerated,
  onEventModified,
}: Props) {
  const methods = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      prompt: '',
    },
  });

  const generateEventMutation = useGenerateEventMutation();
  const modifyEventMutation = useModifyEventMutation();

  const isGenerating = generateEventMutation.isPending;
  const isModifying = modifyEventMutation.isPending;
  const isLoading = isGenerating || isModifying;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      methods.reset({ prompt: '' });
    }
  }, [open, methods]);

  const onSubmit = methods.handleSubmit(async (data) => {
    try {
      if (isCreateMode) {
        // Generate new event
        if (!date) {
          toast.error('Date is required for event generation');
          return;
        }
        const generatedEvent = await generateEventMutation.mutateAsync({
          prompt: data.prompt,
          date,
        });

        toast.success(m.event_generated_successfully());
        if (onEventGenerated) {
          onEventGenerated(generatedEvent);
        }
      } else {
        // Modify existing event
        const modifiedEvent = await modifyEventMutation.mutateAsync({
          prompt: data.prompt,
          eventData,
        });

        toast.success(m.event_modified_successfully());
        if (onEventModified) {
          onEventModified(modifiedEvent);
        }
      }
      methods.reset();
      onClose();
    } catch (error) {
      if (isCreateMode) {
        toast.error(m.failed_to_generate_event());
      } else {
        toast.error(m.failed_to_modify_event());
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={`sm:max-w-2xl ${isLoading ? 'overflow-visible' : ''}`}
      >
        <div className={isLoading ? 'ai-rotating-brand-border' : ''}>
          <DialogHeader>
            <DialogTitle>
              {isCreateMode ? m.create_with_ai() : m.modify_with_ai()}
            </DialogTitle>
            <DialogDescription>
              {isCreateMode
                ? m.ai_generate_event_dialog_description()
                : m.ai_modify_event_dialog_description()}
            </DialogDescription>
          </DialogHeader>
          <FormProvider methods={methods} onSubmit={onSubmit}>
            <div className="space-y-4 pt-3">
              <RHFTextarea
                name="prompt"
                label={
                  isCreateMode
                    ? m.ai_generate_event_prompt_label()
                    : m.ai_modify_event_prompt_label()
                }
                placeholder={
                  isCreateMode
                    ? m.ai_generate_event_prompt_placeholder()
                    : m.ai_modify_event_prompt_placeholder()
                }
                className="min-h-[120px]"
                required
                disabled={isLoading}
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? isCreateMode
                      ? m.generating_event()
                      : m.modifying_event()
                    : isCreateMode
                      ? m.generate()
                      : m.modify()}
                </Button>
              </div>
            </div>
          </FormProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
