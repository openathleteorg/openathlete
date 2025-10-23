import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { useEffect, useState } from 'react';

import {
  CYCLE_COLORS,
  DEFAULT_CYCLE_COLOR,
} from '../calendar/constants/cycle-colors';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string, color: string) => void;
  initialName?: string;
  initialColor?: string;
  title: string;
  confirmText: string;
  isLoading?: boolean;
}

export function FolderDialog({
  open,
  onClose,
  onConfirm,
  initialName = '',
  initialColor = DEFAULT_CYCLE_COLOR,
  title,
  confirmText,
  isLoading = false,
}: Props) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setColor(initialColor);
    }
  }, [open, initialName, initialColor]);

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim(), color);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && name.trim()) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">{m.name()}</Label>
            <Input
              id="folder-name"
              placeholder={m.cycle_name_placeholder()}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>{m.color()}</Label>
            <div className="grid grid-cols-10 gap-2">
              {CYCLE_COLORS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setColor(colorOption.value)}
                  className={cn(
                    'h-10 rounded-md border-2 transition-all hover:scale-105',
                    color === colorOption.value
                      ? 'border-gray-900 ring-gray-900 border-3'
                      : 'border-gray-200',
                  )}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.name}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {m.cancel()}
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={isLoading || !name.trim()}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
