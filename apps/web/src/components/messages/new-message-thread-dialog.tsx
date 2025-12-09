import {
  useGetMyCoachedAthletesQuery,
  useGetMyCoachesQuery,
} from '@/api/athlete';
import { useGetMeQuery } from '@/api/user';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { m } from '@/paraglide/messages';
import { useMemo, useState } from 'react';

import { User } from '@openathlete/shared';

interface NewMessageThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (participantUserIds: number[]) => void;
  isLoading?: boolean;
}

export function NewMessageThreadDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: NewMessageThreadDialogProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const { data: coaches } = useGetMyCoachesQuery();
  const { data: coachedAthletes } = useGetMyCoachedAthletesQuery();
  const { data: currentUser } = useGetMeQuery();

  // Combine coaches and athletes, excluding current user
  const availableUsers = useMemo(() => {
    const users: User[] = [];

    if (coaches) {
      users.push(...coaches);
    }

    if (coachedAthletes) {
      coachedAthletes.forEach((athlete) => {
        if (athlete.user) {
          users.push(athlete.user);
        }
      });
    }

    // Remove duplicates and current user
    const uniqueUsers = users.filter(
      (user, index, self) =>
        index === self.findIndex((u) => u.userId === user.userId) &&
        user.userId !== currentUser?.userId,
    );

    return uniqueUsers;
  }, [coaches, coachedAthletes, currentUser]);

  const handleToggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleConfirm = () => {
    if (currentUser?.userId) {
      // Always include current user
      const participantUserIds = [currentUser.userId, ...selectedUserIds];
      onConfirm(participantUserIds);
      setSelectedUserIds([]);
    }
  };

  const handleCancel = () => {
    setSelectedUserIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] z-[9999]">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
          <DialogDescription>
            Sélectionnez les personnes avec qui vous souhaitez dialoguer
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2 p-2">
            {availableUsers.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p className="text-sm">
                  Aucune personne disponible pour démarrer une conversation
                </p>
              </div>
            ) : (
              availableUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center space-x-3 rounded-lg p-3 hover:bg-accent cursor-pointer"
                  onClick={() => handleToggleUser(user.userId)}
                >
                  <Checkbox
                    checked={selectedUserIds.includes(user.userId)}
                    onCheckedChange={() => handleToggleUser(user.userId)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedUserIds.length === 0 || isLoading}
            isLoading={isLoading}
          >
            {m.create()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
