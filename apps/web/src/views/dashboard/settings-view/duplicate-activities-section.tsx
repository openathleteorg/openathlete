import { useRemoveDuplicateActivitiesMutation } from '@/api/activity-import';
import { ConfirmAction } from '@/components/confirm-action';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { CopyMinus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { SettingsSection } from './settings-section';

/**
 * The same workout synced from two sources (a watch and Strava, or a
 * provider and a file) shows twice: this removes the copies already saved.
 * New imports skip them on their own.
 */
export function DuplicateActivitiesSection() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const removeDuplicates = useRemoveDuplicateActivitiesMutation({
    onSuccess: () => {
      setConfirmOpen(false);
      toast.success(m.duplicate_activities_removing());
    },
    onError: (error) => {
      toast.error(error.message || m.duplicate_activities_failed());
    },
  });

  return (
    <SettingsSection
      title={m.duplicate_activities_title()}
      description={m.duplicate_activities_description()}
    >
      <Button
        variant="outline"
        className="min-h-11"
        data-remove-duplicate-activities
        onClick={() => setConfirmOpen(true)}
      >
        <CopyMinus className="size-4" />
        {m.duplicate_activities_cta()}
      </Button>
      <ConfirmAction
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => removeDuplicates.mutate()}
        title={m.duplicate_activities_cta()}
        message={m.duplicate_activities_confirm()}
        confirmText={m.duplicate_activities_confirm_cta()}
        isLoading={removeDuplicates.isPending}
      />
    </SettingsSection>
  );
}
