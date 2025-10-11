import { getToolMessage } from '@/utils/tool-messages';
import {
  Activity,
  AlertCircle,
  AreaChart,
  BarChart2,
  Brain,
  Calendar,
  Code,
  FileIcon,
  Image as ImageIcon,
  LineChart,
  Loader2,
  Map as MapIcon,
  PieChart,
  ScatterChart,
  Table as TableIcon,
} from 'lucide-react';

import { AgentMessageBlock } from '@openathlete/shared';

interface BlockRendererProps {
  block: AgentMessageBlock;
  isStreaming?: boolean;
}

export function BlockRenderer({ block, isStreaming }: BlockRendererProps) {
  switch (block.type) {
    case 'TEXT':
      return <TextBlock block={block} isStreaming={isStreaming} />;
    case 'THINKING':
      return <ThinkingBlock block={block} isStreaming={isStreaming} />;
    case 'TOOL_CALL':
      return <ToolCallBlock block={block} />;
    case 'TOOL_RESULT':
      return <ToolResultBlock />;
    case 'CODE':
      return <CodeBlock block={block} />;
    case 'ERROR':
      return <ErrorBlock block={block} />;
    case 'CHART_LINE':
    case 'CHART_BAR':
    case 'CHART_PIE':
    case 'CHART_SCATTER':
    case 'CHART_AREA':
      return <ChartBlock block={block} />;
    case 'TABLE':
      return <TableBlock block={block} />;
    case 'MAP':
      return <MapBlock block={block} />;
    case 'ACTIVITY_SUMMARY':
      return <ActivitySummaryBlock block={block} />;
    case 'ACTIVITY_LIST':
      return <ActivityListBlock block={block} />;
    case 'ACTIVITY_CREATED':
      return <ActivityCreatedBlock block={block} />;
    case 'TRAINING_PLAN':
      return <TrainingPlanBlock block={block} />;
    case 'IMAGE':
      return <ImageBlock block={block} />;
    case 'FILE':
      return <FileBlock block={block} />;
    default:
      return <TextBlock block={block} isStreaming={isStreaming} />;
  }
}

// ==================== Text Block ====================
function TextBlock({
  block,
  isStreaming,
}: {
  block: AgentMessageBlock;
  isStreaming?: boolean;
}) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <p className="whitespace-pre-wrap">{block.content}</p>
      {isStreaming && <span className="animate-pulse">▊</span>}
    </div>
  );
}

// ==================== Thinking Block ====================
function ThinkingBlock({
  block,
  isStreaming,
}: {
  block: AgentMessageBlock;
  isStreaming?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-muted">
      <Brain className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Thinking...</p>
        <p className="text-sm whitespace-pre-wrap">{block.content}</p>
        {isStreaming && <span className="animate-pulse">▊</span>}
      </div>
    </div>
  );
}

// ==================== Tool Call Block ====================
function ToolCallBlock({ block }: { block: AgentMessageBlock }) {
  const isProcessing = block.status === 'processing';
  const message = getToolMessage(
    block.toolName || 'unknown',
    isProcessing ? 'processing' : 'completed',
  );

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground italic py-1">
      {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
      <span>{message}</span>
    </div>
  );
}

// ==================== Tool Result Block ====================
// Tool results are now shown via enriched blocks (ACTIVITY_LIST, etc.)
// This block type is kept for backwards compatibility but hidden
function ToolResultBlock() {
  return null; // Don't display raw tool results
}

// ==================== Code Block ====================
function CodeBlock({ block }: { block: AgentMessageBlock }) {
  const language = block.metadata?.language || 'text';

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b border-border">
        <Code className="h-4 w-4" />
        <span className="text-xs font-medium">{String(language)}</span>
      </div>
      <pre className="p-4 bg-muted/50 rounded-b-lg overflow-auto">
        <code className="text-sm">{block.content}</code>
      </pre>
    </div>
  );
}

// ==================== Error Block ====================
function ErrorBlock({ block }: { block: AgentMessageBlock }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-red-900 dark:text-red-100">
          Error
        </p>
        <p className="text-sm text-red-800 dark:text-red-200">
          {block.error || block.content}
        </p>
      </div>
    </div>
  );
}

// ==================== Chart Block ====================
function ChartBlock({ block }: { block: AgentMessageBlock }) {
  const getChartIcon = () => {
    switch (block.type) {
      case 'CHART_LINE':
        return <LineChart className="h-5 w-5" />;
      case 'CHART_BAR':
        return <BarChart2 className="h-5 w-5" />;
      case 'CHART_PIE':
        return <PieChart className="h-5 w-5" />;
      case 'CHART_SCATTER':
        return <ScatterChart className="h-5 w-5" />;
      case 'CHART_AREA':
        return <AreaChart className="h-5 w-5" />;
      default:
        return <BarChart2 className="h-5 w-5" />;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b">
        {getChartIcon()}
        <span className="text-sm font-medium">
          {block.chartType || block.type.replace('CHART_', '')} Chart
        </span>
      </div>
      <div className="p-4 bg-background">
        {block.chartData ? (
          <div className="h-64 flex items-center justify-center bg-muted/20 rounded">
            <p className="text-sm text-muted-foreground">
              Chart visualization would render here
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{block.content}</p>
        )}
      </div>
    </div>
  );
}

// ==================== Table Block ====================
function TableBlock({ block }: { block: AgentMessageBlock }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b">
        <TableIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Table</span>
      </div>
      <div className="p-4 bg-background overflow-auto">
        {block.metadata?.data ? (
          <div className="text-sm text-muted-foreground">
            <p>Table would render here with data</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{block.content}</p>
        )}
      </div>
    </div>
  );
}

// ==================== Map Block ====================
function MapBlock({ block }: { block: AgentMessageBlock }) {
  // TODO: Implement map visualization with block.metadata coordinates
  console.log('Map block:', block);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b">
        <MapIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Map</span>
      </div>
      <div className="p-4 bg-background">
        <div className="h-64 flex items-center justify-center bg-muted/20 rounded">
          <p className="text-sm text-muted-foreground">
            Map visualization would render here
          </p>
        </div>
      </div>
    </div>
  );
}

// ==================== Activity Summary Block ====================
function ActivitySummaryBlock({ block }: { block: AgentMessageBlock }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b">
        <Activity className="h-5 w-5" />
        <span className="text-sm font-medium">Activity Summary</span>
      </div>
      <div className="p-4 bg-background space-y-2">
        <p className="text-sm whitespace-pre-wrap">{block.content}</p>
        {block.metadata && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {Object.entries(block.metadata).map(([key, value]) => (
              <div key={key} className="text-xs">
                <span className="font-medium text-muted-foreground">
                  {key}:{' '}
                </span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Training Plan Block ====================
function TrainingPlanBlock({ block }: { block: AgentMessageBlock }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b">
        <Calendar className="h-5 w-5" />
        <span className="text-sm font-medium">Training Plan</span>
      </div>
      <div className="p-4 bg-background">
        <p className="text-sm whitespace-pre-wrap">{block.content}</p>
      </div>
    </div>
  );
}

// ==================== Image Block ====================
function ImageBlock({ block }: { block: AgentMessageBlock }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-muted border-b">
        <ImageIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Image</span>
      </div>
      <div className="p-4 bg-background">
        {block.content ? (
          <img
            src={block.content}
            alt="Attachment"
            className="max-w-full h-auto rounded"
          />
        ) : (
          <div className="h-48 flex items-center justify-center bg-muted/20 rounded">
            <p className="text-sm text-muted-foreground">No image data</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== File Block ====================
function FileBlock({ block }: { block: AgentMessageBlock }) {
  const size =
    block.metadata?.size && typeof block.metadata.size === 'number'
      ? block.metadata.size
      : null;

  return (
    <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/20">
      <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{block.content}</p>
        {size !== null && (
          <p className="text-xs text-muted-foreground">{formatBytes(size)}</p>
        )}
      </div>
    </div>
  );
}

// ==================== Activity List Block ====================
function ActivityListBlock({ block }: { block: AgentMessageBlock }) {
  const activities = (block.metadata?.activities as any[]) || [];
  const totalCount =
    (block.metadata?.totalCount as number) || activities.length;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <span className="text-sm font-medium">Recent Activities</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {totalCount} total
        </span>
      </div>
      <div className="divide-y">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No activities found
          </div>
        ) : (
          activities.map((activity: any, index: number) => (
            <div
              key={activity.eventId || index}
              className="p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {activity.name}
                  </h4>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {activity.sport && (
                      <span className="inline-flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {activity.sport}
                      </span>
                    )}
                    {activity.distance && (
                      <span>{(activity.distance / 1000).toFixed(2)} km</span>
                    )}
                    {activity.duration && (
                      <span>
                        {Math.floor(activity.duration / 60)}h
                        {activity.duration % 60}min
                      </span>
                    )}
                    {activity.elevationGain && (
                      <span>{activity.elevationGain}m D+</span>
                    )}
                    {activity.startDate && (
                      <span className="text-xs">
                        {new Date(activity.startDate).toLocaleDateString(
                          'fr-FR',
                        )}
                      </span>
                    )}
                  </div>
                </div>
                {activity.eventId && (
                  <a
                    href={`/dashboard/calendar?eventId=${activity.eventId}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/dashboard/calendar?eventId=${activity.eventId}`;
                    }}
                  >
                    <Calendar className="h-3 w-3" />
                    View
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==================== Activity Created Block ====================
function ActivityCreatedBlock({ block }: { block: AgentMessageBlock }) {
  const activity = block.metadata?.activity as any;

  if (!activity) {
    return (
      <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
        <Activity className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">
            {block.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden border-green-200 dark:border-green-800">
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950/20 border-b border-green-200 dark:border-green-800">
        <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
        <span className="text-sm font-medium text-green-900 dark:text-green-100">
          Activity Created Successfully
        </span>
      </div>
      <div className="p-4 bg-background space-y-3">
        <div>
          <h4 className="font-semibold text-base mb-1">{activity.name}</h4>
          <p className="text-sm text-muted-foreground">
            {activity.sport && (
              <span className="capitalize">{activity.sport.toLowerCase()}</span>
            )}
            {activity.sport &&
              (activity.distance || activity.duration) &&
              ' • '}
            {activity.distance && (
              <span>{(activity.distance / 1000).toFixed(2)} km</span>
            )}
            {activity.distance && activity.duration && ' • '}
            {activity.duration && (
              <span>
                {Math.floor(activity.duration / 60)}h{activity.duration % 60}min
              </span>
            )}
          </p>
        </div>

        {activity.startDate && (
          <div className="text-sm">
            <span className="text-muted-foreground">Date: </span>
            <span>{new Date(activity.startDate).toLocaleString('fr-FR')}</span>
          </div>
        )}

        {activity.eventId && (
          <div className="flex gap-2 pt-2">
            <a
              href={`/dashboard/calendar?eventId=${activity.eventId}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/dashboard/calendar?eventId=${activity.eventId}`;
              }}
            >
              <Calendar className="h-4 w-4" />
              View in Calendar
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
