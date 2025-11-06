import {
  useGetMyCoachedAthletesQuery,
  useInviteAthleteMutation,
  useRemoveAthleteMutation,
} from '@/api/athlete';
import { ConfirmAction } from '@/components/confirm-action';
import { InviteAthleteDialog } from '@/components/invite-athlete-dialog/invite-athlete.dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface P {}

export function AthletesTab({}: P) {
  const { data: athletes } = useGetMyCoachedAthletesQuery();
  const nav = useNavigate();
  const [deleteAthleteDialog, setDeleteAthleteDialog] = useState<number | null>(
    null,
  );
  const [inviteAthleteDialog, setInviteAthleteDialog] = useState(false);
  const removeAthleteMutation = useRemoveAthleteMutation();
  const inviteAthleteMutation = useInviteAthleteMutation({
    onSuccess: () => {
      setInviteAthleteDialog(false);
      toast.success(m.athlete_invited_successfully());
    },
  });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setInviteAthleteDialog(true)}>
          {m.invite_athlete()}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{m.name()}</TableHead>
            <TableHead>{m.email()}</TableHead>
            <TableHead className="text-right">{m.actions()}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {athletes?.map((athlete) => (
            <TableRow key={athlete.athleteId}>
              <TableCell>
                {athlete.user?.firstName} {athlete.user?.lastName}
              </TableCell>
              <TableCell>{athlete.user?.email}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() =>
                    nav(
                      getPath(['dashboard', 'calendar']) +
                        `/${athlete.athleteId}`,
                    )
                  }
                >
                  {m.view_calendar()}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDeleteAthleteDialog(athlete.athleteId);
                  }}
                >
                  {m.delete_()}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <InviteAthleteDialog
        open={inviteAthleteDialog}
        onClose={() => setInviteAthleteDialog(false)}
        onInvite={(email) => inviteAthleteMutation.mutate({ email })}
        isLoading={inviteAthleteMutation.isPending}
      />
      <ConfirmAction
        open={!!deleteAthleteDialog}
        onClose={() => setDeleteAthleteDialog(null)}
        onConfirm={() => {
          if (deleteAthleteDialog) {
            removeAthleteMutation.mutate(deleteAthleteDialog);
          }
          setDeleteAthleteDialog(null);
        }}
        title={m.delete_athlete()}
        message={m.confirm_delete_athlete()}
        isLoading={removeAthleteMutation.isPending}
      />
    </>
  );
}
