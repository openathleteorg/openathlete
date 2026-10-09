import {
  useMcpConnectionsQuery,
  useRevokeMcpConnectionMutation,
} from '@/api/mcp';
import { ConfirmAction } from '@/components/confirm-action';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { Bot, KeyRound, Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { McpConnection } from '@openathlete/shared';

import { SettingsSection } from '../settings-section';
import { CreateTokenDialog } from './create-token-dialog';

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString(getLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

function details(connection: McpConnection): string[] {
  const expired =
    connection.expiresAt && new Date(connection.expiresAt) < new Date();
  return [
    connection.kind === 'PERSONAL_TOKEN'
      ? `${m.mcp_personal_token()} ••••${connection.tokenHint ?? ''}`
      : (connection.clientUri && new URL(connection.clientUri).host) || null,
    m.mcp_connected_on({ date: formatDate(connection.createdAt) }),
    connection.lastUsedAt
      ? m.mcp_last_used({ date: formatDate(connection.lastUsedAt) })
      : m.mcp_never_used(),
    connection.expiresAt
      ? expired
        ? m.mcp_expired()
        : m.mcp_expires_on({ date: formatDate(connection.expiresAt) })
      : null,
  ].filter((part): part is string => Boolean(part));
}

/** Agents with access, and the personal tokens the user created */
export function AgentConnectionsSection() {
  const { data: connections = [], isPending } = useMcpConnectionsQuery();
  const revoke = useRevokeMcpConnectionMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [toRevoke, setToRevoke] = useState<McpConnection | null>(null);

  return (
    <SettingsSection
      title={m.mcp_connections_title()}
      description={m.mcp_connections_description()}
      action={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {m.mcp_token_create()}
        </Button>
      }
      contentClassName="pt-4"
    >
      {isPending ? (
        <Skeleton className="h-16 w-full" />
      ) : connections.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {m.mcp_connections_empty()}
        </p>
      ) : (
        <ul
          className="divide-y"
          aria-label={m.mcp_connections_title()}
          data-mcp-connections
        >
          {connections.map((connection) => {
            const Icon = connection.kind === 'OAUTH' ? Bot : KeyRound;
            return (
              <li
                key={connection.mcpGrantId}
                className="flex items-start justify-between gap-3 py-3"
                data-mcp-connection={connection.name}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{connection.name}</p>
                      <Badge variant="secondary">
                        {connection.scopes.includes('write')
                          ? m.mcp_scope_write()
                          : m.mcp_scope_read()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {details(connection).join(' · ')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  // 44 px touch target on phones
                  className="h-11 min-w-11 shrink-0 sm:h-8 sm:min-w-0"
                  aria-label={`${m.mcp_revoke()} ${connection.name}`}
                  onClick={() => setToRevoke(connection)}
                >
                  <Trash className="size-4" />
                  <span className="hidden sm:inline">{m.mcp_revoke()}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <CreateTokenDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmAction
        open={toRevoke !== null}
        onClose={() => setToRevoke(null)}
        onConfirm={async () => {
          if (!toRevoke) return;
          try {
            await revoke.mutateAsync(toRevoke.mcpGrantId);
            toast.success(m.mcp_revoked());
            setToRevoke(null);
          } catch {
            toast.error(m.mcp_revoke_failed());
          }
        }}
        title={`${m.mcp_revoke()} ${toRevoke?.name ?? ''}`}
        message={m.mcp_revoke_confirm()}
        isLoading={revoke.isPending}
      />
    </SettingsSection>
  );
}
