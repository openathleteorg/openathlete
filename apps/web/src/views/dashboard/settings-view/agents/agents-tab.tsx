import { AgentConnectionsSection } from './agent-connections-section';
import { McpServerSection } from './mcp-server-section';

/** AI agents (MCP): where they connect, and which ones have access */
export function AgentsTab() {
  return (
    <div className="space-y-8">
      <McpServerSection />
      <AgentConnectionsSection />
    </div>
  );
}
