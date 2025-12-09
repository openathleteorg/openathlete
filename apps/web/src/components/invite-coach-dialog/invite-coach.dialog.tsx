import { useInviteCoachMutation } from '@/api/athlete';
import { m } from '@/paraglide/messages';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';

interface P {
  open: boolean;
  onClose: () => void;
}

export function InviteCoachDialog({ open, onClose }: P) {
  const [email, setEmail] = useState<string>('');
  const inviteCoachMutation = useInviteCoachMutation({
    onSuccess: () => {
      setEmail('');
      onClose();
    },
    onError: () => {
      toast.error(m.failed_to_invite_coach());
    },
  });

  return (
    <Dialog onOpenChange={(o) => !o && onClose()} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{m.invite_a_coach()}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p>{m.invite_coach_instructions()}</p>
          <Input
            type="email"
            placeholder={m.enter_coach_email()}
            className="w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={inviteCoachMutation.isPending}
            >
              {m.cancel()}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                inviteCoachMutation.mutate({ email });
              }}
              isLoading={inviteCoachMutation.isPending}
            >
              {m.invite()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
