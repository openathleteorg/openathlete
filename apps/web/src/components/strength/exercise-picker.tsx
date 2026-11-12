import { useCreateCustomExerciseMutation } from '@/api/exercise';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Check, Loader2, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { WORKOUT_DURATION_TYPE } from '@openathlete/shared';

import {
  BODY_PARTS,
  EQUIPMENTS,
  bodyPartLabel,
  equipmentLabel,
  targetLabel,
} from './exercise-labels';
import { searchExercises } from './exercise-search';
import { ExerciseVisual } from './exercise-visual';
import { type ExerciseInfo, customInfo, useExercises } from './use-exercises';

const RECENT_KEY = 'openathlete_recent_exercises';
const PAGE = 60;

/** Exercises this browser picked lately: a convenience, never required */
function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}
function remember(refs: string[]) {
  try {
    const next = [
      ...refs,
      ...readRecent().filter((ref) => !refs.includes(ref)),
    ];
    localStorage.setItem(RECENT_KEY, JSON.stringify(next.slice(0, 40)));
  } catch {
    // Private mode: the list is only a shortcut
  }
}

function CustomExerciseForm({
  name: initialName,
  onCreated,
  onCancel,
}: {
  name: string;
  onCreated: (exercise: ExerciseInfo) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<WORKOUT_DURATION_TYPE>(
    WORKOUT_DURATION_TYPE.REPS,
  );
  const [mediaUrl, setMediaUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const create = useCreateCustomExerciseMutation({
    onSuccess: (exercise) => onCreated(customInfo(exercise)),
    onError: () => toast.error(m.exo_custom_error()),
  });
  const validUrl =
    !mediaUrl.trim() || /^https?:\/\/\S+\.\S+/.test(mediaUrl.trim());

  return (
    <div className="space-y-3" data-custom-exercise-form>
      <Input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={m.exo_custom_name()}
        aria-label={m.exo_custom_name()}
      />
      <div className="inline-flex rounded-lg bg-muted p-0.5">
        {[
          [WORKOUT_DURATION_TYPE.REPS, m.exo_custom_reps()],
          [WORKOUT_DURATION_TYPE.TIME, m.exo_custom_time()],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value as WORKOUT_DURATION_TYPE)}
            className={cn(
              'h-8 rounded-md px-3 text-sm text-muted-foreground',
              type === value && 'bg-background text-foreground shadow-sm',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <Input
        value={mediaUrl}
        onChange={(event) => setMediaUrl(event.target.value)}
        placeholder={m.exo_custom_media()}
        aria-label={m.exo_custom_media()}
        aria-invalid={!validUrl}
        inputMode="url"
      />
      <Textarea
        value={instructions}
        onChange={(event) => setInstructions(event.target.value)}
        placeholder={m.exo_custom_instructions()}
        aria-label={m.exo_custom_instructions()}
        className="h-24"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {m.cancel()}
        </Button>
        <Button
          type="button"
          disabled={!name.trim() || !validUrl || create.isPending}
          onClick={() =>
            create.mutate({
              name: name.trim(),
              instructions,
              mediaUrl: mediaUrl.trim() || null,
              defaultDurationType: type as WORKOUT_DURATION_TYPE.REPS,
            })
          }
        >
          {create.isPending && <Loader2 className="animate-spin" />}
          {m.exo_custom_create()}
        </Button>
      </div>
    </div>
  );
}

interface ExercisePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Several at once, for a superset or a circuit */
  multiple?: boolean;
  onPick: (exercises: ExerciseInfo[]) => void;
}

/**
 * The exercise library: 1,300 exercises searchable in every language,
 * filtered by body part and equipment, drawn when a drawing exists, and
 * the coach's own beside them.
 */
export function ExercisePicker({
  open,
  onOpenChange,
  multiple = false,
  onPick,
}: ExercisePickerProps) {
  const { all, isLoading, attribution } = useExercises();
  const [query, setQuery] = useState('');
  const [bodyPart, setBodyPart] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [picked, setPicked] = useState<ExerciseInfo[]>([]);
  const [creating, setCreating] = useState(false);
  const recent = useMemo(() => (open ? readRecent() : []), [open]);

  const results = useMemo(
    () => searchExercises(all, query, { bodyPart, equipment }, recent),
    [all, query, bodyPart, equipment, recent],
  );

  const close = () => {
    onOpenChange(false);
    setQuery('');
    setPicked([]);
    setLimit(PAGE);
    setCreating(false);
  };
  const finish = (exercises: ExerciseInfo[]) => {
    if (exercises.length === 0) return;
    remember(exercises.map((exercise) => exercise.ref));
    onPick(exercises);
    close();
  };
  const choose = (exercise: ExerciseInfo) => {
    if (!multiple) {
      finish([exercise]);
      return;
    }
    setPicked((list) =>
      list.some((item) => item.ref === exercise.ref)
        ? list.filter((item) => item.ref !== exercise.ref)
        : [...list, exercise],
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
    >
      <DialogContent
        mobileFullscreen
        className="grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto_minmax(0,1fr)_auto] sm:h-[min(88vh,860px)] sm:max-w-4xl"
        data-exercise-picker
      >
        <DialogHeader>
          <DialogTitle>
            {multiple ? m.exo_picker_title_many() : m.exo_picker_title()}
          </DialogTitle>
        </DialogHeader>

        {creating ? (
          <div className="row-span-2">
            <CustomExerciseForm
              name={query}
              onCancel={() => setCreating(false)}
              onCreated={(exercise) => finish([...picked, exercise])}
            />
          </div>
        ) : (
          <>
            <div className="min-w-0 space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setLimit(PAGE);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    if (!multiple && results[0]) choose(results[0]);
                  }}
                  placeholder={m.exo_picker_search()}
                  className="h-11 pl-9"
                  data-exercise-search
                />
              </div>
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                <button
                  type="button"
                  onClick={() => setBodyPart(null)}
                  className={cn(
                    'h-8 shrink-0 rounded-full border px-3 text-sm',
                    !bodyPart
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-accent',
                  )}
                >
                  {m.exo_picker_all()}
                </button>
                {BODY_PARTS.map((part) => (
                  <button
                    key={part}
                    type="button"
                    onClick={() => setBodyPart(part === bodyPart ? null : part)}
                    className={cn(
                      'h-8 shrink-0 rounded-full border px-3 text-sm',
                      part === bodyPart
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'hover:bg-accent',
                    )}
                  >
                    {bodyPartLabel(part)}
                  </button>
                ))}
                <Select
                  value={equipment ?? 'all'}
                  onValueChange={(value) =>
                    setEquipment(value === 'all' ? null : value)
                  }
                >
                  <SelectTrigger className="h-8 w-auto shrink-0 rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {m.exo_picker_any_equipment()}
                    </SelectItem>
                    {EQUIPMENTS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {equipmentLabel(key)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div
              className="-mx-1 min-h-0 overflow-y-auto px-1"
              data-exercise-results
            >
              {isLoading ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  <Loader2 className="animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {results.slice(0, limit).map((exercise) => {
                      const selected = picked.some(
                        (item) => item.ref === exercise.ref,
                      );
                      return (
                        <button
                          key={exercise.ref}
                          type="button"
                          onClick={() => choose(exercise)}
                          className={cn(
                            'group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-colors hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-ring',
                            selected && 'border-primary ring-2 ring-primary/30',
                          )}
                          data-exercise-option={exercise.ref}
                        >
                          <ExerciseVisual
                            exercise={exercise}
                            animate="hover"
                            className="aspect-[4/3] w-full bg-muted/40 [&>div]:m-2"
                          />
                          <div className="space-y-0.5 p-2">
                            <p className="line-clamp-2 text-sm font-medium leading-tight">
                              {exercise.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {exercise.custom
                                ? m.exo_picker_custom()
                                : [
                                    targetLabel(exercise.target),
                                    equipmentLabel(exercise.equipment),
                                  ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                          </div>
                          {selected && (
                            <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="size-4" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {results.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      {m.exo_picker_none()}
                    </p>
                  )}
                  {results.length > limit && (
                    <div className="py-3 text-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLimit(limit + PAGE)}
                      >
                        {m.exo_picker_more({ count: results.length - limit })}
                      </Button>
                    </div>
                  )}
                  {attribution && (
                    <p className="py-3 text-center text-[11px] text-muted-foreground">
                      {attribution.media}
                    </p>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {!creating && (
          <div className="flex items-center gap-2 border-t pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreating(true)}
            >
              <Plus />
              {query.trim()
                ? m.exo_picker_create_named({ name: query.trim() })
                : m.exo_picker_create()}
            </Button>
            {multiple && (
              <Button
                type="button"
                className="ml-auto"
                disabled={picked.length === 0}
                onClick={() => finish(picked)}
                data-exercise-picker-done
              >
                {m.exo_picker_add({ count: picked.length })}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
