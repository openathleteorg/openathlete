import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from '@/components/ui/label';
import { m } from '@/paraglide/messages';
import { useState } from 'react';
import { BetaAccessAPI } from '@/api/beta-access/beta-access.api';

interface RequestAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: {
    name: string;
    email: string;
    type: 'coach' | 'club';
    athletes: string;
    message?: string;
  }) => Promise<void>;
}

export function RequestAccessModal({
  open,
  onOpenChange,
  onSubmit,
}: RequestAccessModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<'coach' | 'club' | ''>('');
  const [athletes, setAthletes] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim()) {
      setError(m.landing_request_access_name_error());
      return;
    }

    if (!email.trim() || !validateEmail(email)) {
      setError(m.landing_request_access_email_error());
      return;
    }

    if (!type) {
      setError(m.landing_request_access_type_error());
      return;
    }

    if (!athletes.trim()) {
      setError(m.landing_request_access_athletes_error());
      return;
    }

    setIsLoading(true);

    try {
      if (onSubmit) {
        await onSubmit({
          name: name.trim(),
          email: email.trim(),
          type: type as 'coach' | 'club',
          athletes: athletes.trim(),
          message: message.trim() || undefined,
        });
      } else {
        // Call API
        await BetaAccessAPI.request({
          name: name.trim(),
          email: email.trim(),
          type: type as 'coach' | 'club',
          athletes: athletes.trim(),
          message: message.trim() || undefined,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
        setSuccess(false);
        setName('');
        setEmail('');
        setType('');
        setAthletes('');
        setMessage('');
      }, 2000);
    } catch (err) {
      setError(m.landing_request_access_error());
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m.landing_request_access_title()}</DialogTitle>
          <DialogDescription>
            {success
              ? m.landing_request_access_success()
              : m.landing_request_access_description()}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-4 text-center text-sm text-green-600">
            {m.landing_request_access_success()}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{m.landing_request_access_name()}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{m.landing_request_access_email()}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">{m.landing_request_access_type()}</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as 'coach' | 'club')}
                disabled={isLoading}
              >
                <SelectTrigger id="type" aria-required="true">
                  <SelectValue placeholder={m.landing_request_access_type_placeholder()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coach">
                    {m.landing_request_access_type_coach()}
                  </SelectItem>
                  <SelectItem value="club">
                    {m.landing_request_access_type_club()}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="athletes">
                {m.landing_request_access_athletes()}
              </Label>
              <Input
                id="athletes"
                type="number"
                min="1"
                value={athletes}
                onChange={(e) => setAthletes(e.target.value)}
                disabled={isLoading}
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                {m.landing_request_access_message()}
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {m.landing_request_access_cancel()}
          </Button>
          {!success && (
            <Button onClick={handleSubmit} disabled={isLoading} isLoading={isLoading}>
              {m.landing_request_access_submit()}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


