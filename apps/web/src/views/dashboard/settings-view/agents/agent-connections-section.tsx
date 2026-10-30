import {
  useMcpConnectionsQuery,
  useRevokeMcpConnectionMutation,
} from '@/api/mcp';
import { ConfirmAction } from '@/components/confirm-action';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { Bot, KeyRound, Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { McpConnection } from '@openathlete/shared';

import {
  SettingsEmpty,
  SettingsPanel,
  SettingsRow,
  SettingsRowsSkeleton,
  SettingsSection,
} from '../settings-section';
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
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {m.mcp_token_create()}
        </Button>
      }
    >
      {isPending ? (
        <SettingsRowsSkeleton count={1} />
      ) : connections.length === 0 ? (
        <SettingsEmpty>{m.mcp_connections_empty()}</SettingsEmpty>
      ) : (
        <SettingsPanel
          role="list"
          aria-label={m.mcp_connections_title()}
          data-mcp-connections
        >
          {connections.map((connection) => {
            const Icon = connection.kind === 'OAUTH' ? Bot : KeyRound;
            return (
              <SettingsRow
                key={connection.mcpGrantId}
                role="listitem"
                data-mcp-connection={connection.name}
                leading={<Icon className="size-5" />}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {connection.name}
                    <Badge variant="secondary">
                      {connection.scopes.includes('write')
                        ? m.mcp_scope_write()
                        : connection.scopes.includes('read')
                          ? m.mcp_scope_read()
                          : m.mcp_scope_import()}
                    </Badge>
                  </span>
                }
                description={details(connection).join(' · ')}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-w-11"
                  aria-label={`${m.mcp_revoke()} ${connection.name}`}
                  onClick={() => setToRevoke(connection)}
                >
                  <Trash className="size-4" />
                  <span className="hidden sm:inline">{m.mcp_revoke()}</span>
                </Button>
              </SettingsRow>
            );
          })}
        </SettingsPanel>
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
