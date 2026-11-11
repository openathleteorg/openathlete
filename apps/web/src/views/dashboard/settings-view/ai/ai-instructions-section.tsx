import {
  useAiAccessQuery,
  useAiCredentialsQuery,
  useAiCustomInstructionsQuery,
  useUpdateAiCustomInstructionsMutation,
} from '@/api/ai-settings';
import { aiTaskLabel } from '@/components/ai-settings/ai-labels';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { m } from '@/paraglide/messages';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  AI_CUSTOM_INSTRUCTIONS_MAX_LENGTH,
  AI_INSTRUCTION_TASKS,
  AiCustomInstructionDto,
  AiInstructionTask,
  AiTask,
  tasksFollowingInstructions,
} from '@openathlete/shared';

import { SettingsPanel, SettingsSection } from '../settings-section';

type Draft = Record<AiInstructionTask, string>;

function toDraft(instructions: AiCustomInstructionDto[]): Draft {
  const draft = Object.fromEntries(
    AI_INSTRUCTION_TASKS.map((task) => [task, '']),
  ) as Draft;
  for (const item of instructions) draft[item.task] = item.instructions;
  return draft;
}

/** Workout editing follows the instructions of workout generation */
function label(task: AiInstructionTask): string {
  return task === AiTask.EVENT_GENERATION
    ? m.ai_instructions_workouts()
    : aiTaskLabel(task);
}

/** An example of what the user might want, per feature. */
function placeholder(task: AiInstructionTask): string {
  switch (task) {
    case AiTask.EVENT_GENERATION:
      return m.ai_instructions_placeholder_workouts();
    case AiTask.POST_ACTIVITY_QUESTIONS:
      return m.ai_instructions_placeholder_post_activity_questions();
    case AiTask.ACTIVITY_SUMMARY:
      return m.ai_instructions_placeholder_activity_summary();
  }
}

/**
 * What each AI feature should do the user's way. Only the owner of a key can
 * write them, and they only apply to calls on the user's own keys.
 */
export function AiInstructionsSection() {
  const { data: credentials = [] } = useAiCredentialsQuery();
  const { data: instructions } = useAiCustomInstructionsQuery();
  const { data: access } = useAiAccessQuery();
  const updateInstructions = useUpdateAiCustomInstructionsMutation();

  const initial = useMemo(() => toDraft(instructions ?? []), [instructions]);
  const [draft, setDraft] = useState<Draft>(initial);
  useEffect(() => setDraft(initial), [initial]);

  const hasKeys = credentials.length > 0;
  const changed = AI_INSTRUCTION_TASKS.some(
    (task) => draft[task].trim() !== initial[task].trim(),
  );

  const handleSave = async () => {
    try {
      await updateInstructions.mutateAsync({
        instructions: AI_INSTRUCTION_TASKS.map((task) => ({
          task,
          instructions: draft[task].trim(),
        })).filter((item) => item.instructions),
      });
      toast.success(m.ai_instructions_saved());
    } catch {
      toast.error(m.ai_instructions_save_failed());
    }
  };

  return (
    <SettingsSection
      title={m.ai_instructions_title()}
      description={m.ai_instructions_description()}
    >
      {!hasKeys ? (
        <p className="px-1 text-sm text-muted-foreground">
          {m.ai_instructions_no_keys()}
        </p>
      ) : (
        <>
          <SettingsPanel>
            {AI_INSTRUCTION_TASKS.map((task) => {
              const id = `ai-instructions-${task}`;
              const value = draft[task];
              // Workouts: worth saying when either generation or editing
              // would leave the instructions out
              const notUsed =
                value.trim() !== '' &&
                access !== undefined &&
                tasksFollowingInstructions(task).some(
                  (feature) => access.tasks[feature].source !== 'own_key',
                );
              return (
                <div key={task} className="space-y-2 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor={id} className="text-sm font-medium">
                      {label(task)}
                    </label>
                    {value.length > AI_CUSTOM_INSTRUCTIONS_MAX_LENGTH * 0.8 && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {value.length}/{AI_CUSTOM_INSTRUCTIONS_MAX_LENGTH}
                      </span>
                    )}
                  </div>
                  <Textarea
                    id={id}
                    value={value}
                    maxLength={AI_CUSTOM_INSTRUCTIONS_MAX_LENGTH}
                    placeholder={placeholder(task)}
                    rows={2}
                    className="resize-y"
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [task]: event.target.value,
                      }))
                    }
                  />
                  {notUsed && (
                    <p className="text-xs text-muted-foreground">
                      {m.ai_instructions_not_used()}
                    </p>
                  )}
                </div>
              );
            })}
          </SettingsPanel>
          <div className="flex justify-end">
            <Button
              className="w-full sm:w-fit"
              onClick={handleSave}
              disabled={!changed || updateInstructions.isPending}
            >
              {m.ai_instructions_save()}
            </Button>
          </div>
        </>
      )}
    </SettingsSection>
  );
}
