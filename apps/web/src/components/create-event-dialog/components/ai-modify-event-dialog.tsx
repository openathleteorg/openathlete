import { useGenerateEventMutation, useModifyEventMutation } from '@/api/agent';
import { m } from '@/paraglide/messages';
import { aiErrorMessage } from '@/utils/ai-errors';
import {
  AnalyticsEvent,
  analyticsErrorCodeFromUnknown,
} from '@/utils/analytics-events';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useRef } from 'react';
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
  /** PostHog funnel attribution (no PII). */
  analyticsSource?: string;
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
  analyticsSource = 'event_dialog',
  onEventGenerated,
  onEventModified,
}: Props) {
  const posthog = usePostHog();
  const requestStartedAtRef = useRef<number | null>(null);
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
      posthog?.capture(AnalyticsEvent.ai_event_generation_opened, {
        mode: isCreateMode ? 'create' : 'modify',
        source: analyticsSource,
      });
    }
  }, [open, isCreateMode, analyticsSource, posthog, methods]);

  const onSubmit = methods.handleSubmit(async (data) => {
    requestStartedAtRef.current = performance.now();
    try {
      if (isCreateMode) {
        // Generate new event
        if (!date) {
          toast.error(m.date_required_for_event_generation());
          return;
        }
        const generatedEvent = await generateEventMutation.mutateAsync({
          prompt: data.prompt,
          date,
          athleteId: eventData.athleteId,
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
      const durationMs =
        requestStartedAtRef.current !== null
          ? Math.round(performance.now() - requestStartedAtRef.current)
          : undefined;
      posthog?.capture(AnalyticsEvent.ai_event_generation_succeeded, {
        mode: isCreateMode ? 'create' : 'modify',
        source: analyticsSource,
        ...(durationMs !== undefined ? { duration_ms: durationMs } : {}),
      });
      methods.reset();
      onClose();
    } catch (err) {
      const durationMs =
        requestStartedAtRef.current !== null
          ? Math.round(performance.now() - requestStartedAtRef.current)
          : undefined;
      posthog?.capture(AnalyticsEvent.ai_event_generation_failed, {
        mode: isCreateMode ? 'create' : 'modify',
        source: analyticsSource,
        error_code: analyticsErrorCodeFromUnknown(err),
        ...(durationMs !== undefined ? { duration_ms: durationMs } : {}),
      });
      if (isCreateMode) {
        toast.error(aiErrorMessage(err) ?? m.failed_to_generate_event());
      } else {
        toast.error(aiErrorMessage(err) ?? m.failed_to_modify_event());
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        mobileFullscreen
        className={`sm:max-w-2xl ${isLoading ? 'overflow-visible' : ''}`}
      >
        <div className={isLoading ? 'ai-rotating-brand-border-dialog' : ''}>
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
                <Button type="submit" isLoading={isLoading}>
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
