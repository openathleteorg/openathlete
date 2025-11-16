import { m } from '@/paraglide/messages';

const TOOL_NAME_MAP: Record<string, string> = {
  'get-recent-activities': 'get_recent_activities',
  getRecentActivities: 'get_recent_activities',
  'get-activity-detail': 'get_activity_detail',
  getActivityDetail: 'get_activity_detail',
  'create-training': 'create_training',
  createTraining: 'create_training',
  'get-training-period-overview': 'get_training_period_overview',
  getTrainingPeriodOverview: 'get_training_period_overview',
  'estimate-training-load': 'estimate_training_load',
  estimateTrainingLoad: 'estimate_training_load',
};

/**
 * Get a human-readable, localized message for a tool action
 * @param toolName - The name of the tool (kebab-case or camelCase)
 * @param status - The status of the action ('processing' or 'completed')
 * @returns A localized human-readable message
 */
export function getToolMessage(
  toolName: string,
  status: 'processing' | 'completed',
): string {
  const normalizedTool = TOOL_NAME_MAP[toolName];

  if (!normalizedTool) {
    return status === 'processing'
      ? m.tool_unknown_processing({ toolName })
      : m.tool_unknown_completed({ toolName });
  }

  return status === 'processing'
    ? m.tool_unknown_processing({ toolName })
    : m.tool_unknown_completed({ toolName });
}
