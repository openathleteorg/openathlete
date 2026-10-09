import { useCreatePersonalTokenMutation } from '@/api/mcp';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { m } from '@/paraglide/messages';
import { Copy, TriangleAlert } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';

import {
  CreatePersonalTokenDto,
  PERSONAL_TOKEN_LIFETIMES,
  createPersonalTokenDtoSchema,
} from '@openathlete/shared';

import { copyText } from './copy-text';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const NEVER = 'never';

/**
 * Creates a personal token, then shows it once: only its hash is kept, so
 * closing the dialog loses it for good.
 */
export function CreateTokenDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const [access, setAccess] = useState<'read' | 'write'>('write');
  const [expiry, setExpiry] = useState<string>('90');
  const [token, setToken] = useState<string | null>(null);
  const create = useCreatePersonalTokenMutation();

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setName('');
      setAccess('write');
      setExpiry('90');
      setToken(null);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = createPersonalTokenDtoSchema.safeParse({
      name,
      scopes: access === 'write' ? ['read', 'write'] : ['read'],
      expiresInDays: expiry === NEVER ? null : Number(expiry),
    } satisfies Record<keyof CreatePersonalTokenDto, unknown>);
    if (!parsed.success) return;
    try {
      const created = await create.mutateAsync(parsed.data);
      setToken(created.token);
    } catch {
      toast.error(m.mcp_token_create_failed());
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg" data-create-token-dialog>
        {token ? (
          <>
            <DialogHeader>
              <DialogTitle>{m.mcp_token_created_title()}</DialogTitle>
              <DialogDescription className="flex gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
                {m.mcp_token_created_description()}
              </DialogDescription>
            </DialogHeader>
            <div
              className="break-all rounded-sm border bg-muted p-3 font-mono text-sm select-all"
              data-created-token
            >
              {token}
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => copyText(token, m.mcp_token_copied())}
              >
                <Copy className="size-4" />
                {m.copy()}
              </Button>
              <Button onClick={() => close(false)}>{m.done()}</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{m.mcp_token_create()}</DialogTitle>
              <DialogDescription>
                {m.mcp_token_dialog_description()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="mcp-token-name">{m.name()}</Label>
              <Input
                id="mcp-token-name"
                value={name}
                maxLength={60}
                required
                autoFocus
                placeholder={m.mcp_token_name_placeholder()}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mcp-token-access">{m.mcp_token_access()}</Label>
                <Select
                  value={access}
                  onValueChange={(value) =>
                    setAccess(value as 'read' | 'write')
                  }
                >
                  <SelectTrigger id="mcp-token-access" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="write">{m.mcp_scope_write()}</SelectItem>
                    <SelectItem value="read">{m.mcp_scope_read()}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mcp-token-expiry">{m.mcp_token_expiry()}</Label>
                <Select value={expiry} onValueChange={setExpiry}>
                  <SelectTrigger id="mcp-token-expiry" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERSONAL_TOKEN_LIFETIMES.map((days) => (
                      <SelectItem key={days} value={String(days)}>
                        {days === 365
                          ? m.mcp_token_expiry_year()
                          : m.mcp_token_expiry_days({ days })}
                      </SelectItem>
                    ))}
                    <SelectItem value={NEVER}>
                      {m.mcp_token_expiry_never()}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => close(false)}
              >
                {m.cancel()}
              </Button>
              <Button type="submit" disabled={!name.trim() || create.isPending}>
                {m.create()}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
