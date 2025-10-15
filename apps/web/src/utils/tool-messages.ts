import { m } from '@/paraglide/messages';

/**
 * Tool action messages for a clean, conversational UX
 * Maps tool names to i18n message keys
 */

// Map tool names (both formats) to a normalized key
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
    // Fallback for unknown tools
    return status === 'processing'
      ? m.tool_unknown_processing({ toolName })
      : m.tool_unknown_completed({ toolName });
  }

  // Build the message key and call the corresponding function
  // Use direct access for known tools
  if (normalizedTool === 'get_recent_activities') {
    return status === 'processing'
      ? m.tool_get_recent_activities_processing()
      : m.tool_get_recent_activities_completed();
  }

  if (normalizedTool === 'get_activity_detail') {
    return status === 'processing'
      ? m.tool_get_activity_detail_processing()
      : m.tool_get_activity_detail_completed();
  }

  if (normalizedTool === 'create_training') {
    return status === 'processing'
      ? m.tool_create_training_processing()
      : m.tool_create_training_completed();
  }

  if (normalizedTool === 'get_training_period_overview') {
    return status === 'processing'
      ? m.tool_get_training_period_overview_processing()
      : m.tool_get_training_period_overview_completed();
  }

  if (normalizedTool === 'estimate_training_load') {
    return status === 'processing'
      ? m.tool_estimate_training_load_processing()
      : m.tool_estimate_training_load_completed();
  }

  // Fallback for any other tools
  return status === 'processing'
    ? m.tool_unknown_processing({ toolName })
    : m.tool_unknown_completed({ toolName });
}
