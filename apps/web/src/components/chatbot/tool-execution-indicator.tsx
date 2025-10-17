import { m } from '@/paraglide/messages';
import { Loader2 } from 'lucide-react';

import { ToolExecutionState } from '@openathlete/shared';

interface ToolExecutionIndicatorProps {
  activeTools: ToolExecutionState[];
}

/**
 * Get translated tool name and status message
 */
function getToolTranslation(
  toolName: string,
  status: 'starting' | 'executing' | 'completed' | 'error',
): string {
  // Convert tool name to translation key format (camelCase to snake_case)
  const toolKey = `tool_${toolName}_${status === 'executing' ? 'processing' : status === 'completed' ? 'completed' : 'processing'}`;

  // Try to get specific translation, fallback to generic
  const translationFn = (m as any)[toolKey];
  if (translationFn && typeof translationFn === 'function') {
    return translationFn();
  }

  // Fallback to generic translation
  if (status === 'executing' || status === 'starting') {
    return m.tool_processing({ toolName });
  } else if (status === 'completed') {
    return m.tool_completed({ toolName });
  } else {
    return m.tool_error({ toolName });
  }
}

/**
 * Component that displays currently executing tools with their status
 * Shows a subtle indicator when tools are running in the background
 */
export function ToolExecutionIndicator({
  activeTools,
}: ToolExecutionIndicatorProps) {
  if (activeTools.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-2 text-sm">
      {activeTools.map((tool) => (
        <div
          key={tool.toolCallId}
          className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-muted-foreground"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="flex-1 text-xs">
            {getToolTranslation(tool.toolName, tool.status)}
          </span>
          {tool.startTime && (
            <span className="text-xs opacity-50">
              {Math.floor((Date.now() - tool.startTime) / 1000)}s
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
