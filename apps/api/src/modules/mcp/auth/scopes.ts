import { MCP_SCOPES, McpScope } from '@openathlete/shared';

export const ALL_SCOPES: McpScope[] = [...MCP_SCOPES];

/**
 * Scopes of a request: the known ones it names, or all of them when it names
 * none. Agents rarely ask for less than everything, and the consent page
 * shows what they get.
 */
export function parseScopes(scope: string | undefined): McpScope[] | null {
  if (!scope?.trim()) return ALL_SCOPES;
  const asked = scope.trim().split(/\s+/);
  const known = ALL_SCOPES.filter((value) => asked.includes(value));
  return known.length ? known : null;
}
