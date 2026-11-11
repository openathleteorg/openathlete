/**
 * The family of an MCP client, for analytics: a client registers itself with
 * any name it likes ("Claude", "claude.ai", "ChatGPT Connector"), and a
 * free-text name is not a property worth breaking charts down by.
 */
export type McpClientCategory =
  'claude' | 'chatgpt' | 'cursor' | 'mistral' | 'gemini' | 'other';

const PATTERNS: Array<[McpClientCategory, RegExp]> = [
  ['claude', /claude|anthropic/i],
  ['chatgpt', /chatgpt|openai/i],
  ['cursor', /cursor/i],
  ['mistral', /mistral|le ?chat/i],
  ['gemini', /gemini|google/i],
];

export function mcpClientCategory(name: string | null | undefined) {
  if (!name) return 'other';
  return PATTERNS.find(([, pattern]) => pattern.test(name))?.[0] ?? 'other';
}
