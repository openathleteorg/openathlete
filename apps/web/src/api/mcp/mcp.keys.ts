export const mcpKeys = {
  all: ['mcp'] as const,
  info: () => [...mcpKeys.all, 'info'] as const,
  connections: () => [...mcpKeys.all, 'connections'] as const,
  authorize: (query: string) => [...mcpKeys.all, 'authorize', query] as const,
};
