import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { m } from '@/paraglide/messages';
import { Bot } from 'lucide-react';

import { AgentConnectionsSection } from './agent-connections-section';
import { McpServerSection } from './mcp-server-section';

/** AI agents (MCP): where they connect, and which ones have access */
export function AgentsTab() {
  return (
    <div className="space-y-6">
      <Alert>
        <Bot className="size-4" />
        <AlertTitle>{m.mcp_intro_title()}</AlertTitle>
        <AlertDescription>{m.mcp_intro_description()}</AlertDescription>
      </Alert>
      <McpServerSection />
      <AgentConnectionsSection />
    </div>
  );
}
