/**
 * AI Model Constants
 *
 * This file contains constants for AI models used by Mastra agents.
 * Models can be configured via environment variables with fallbacks to default models.
 *
 * Note: These constants use process.env because they are used at module initialization time
 * when creating Mastra agents, before ConfigService is available. The values are validated
 * by envValidationSchema in the ConfigModule.
 *
 * For dynamic access to model names, use AiModelsService instead.
 */

/**
 * Model for event generation agent
 * Fallback: 'gpt-4o' (standard OpenAI model)
 */
export const EVENT_GENERATION_MODEL =
  process.env.AI_MODEL_EVENT_GENERATION || 'openai/gpt-5.1';

/**
 * Model for event modification agent
 * Fallback: 'gpt-4o' (standard OpenAI model)
 */
export const EVENT_MODIFICATION_MODEL =
  process.env.AI_MODEL_EVENT_MODIFICATION || 'openai/gpt-5.1';

/**
 * Model for injury extraction agent
 * Fallback: 'gpt-4o' (standard OpenAI model)
 */
export const EXTRACT_INJURY_MODEL =
  process.env.AI_MODEL_EXTRACT_INJURY || 'openai/gpt-5.1';

/**
 * Model for RPE extraction agent
 * Fallback: 'gpt-4o' (standard OpenAI model)
 */
export const EXTRACT_RPE_MODEL =
  process.env.AI_MODEL_EXTRACT_RPE || 'openai/gpt-5.1';

/**
 * Model for post-activity feedback agent
 * Fallback: 'google/gemini-3-pro-preview' (standard Google model)
 */
export const POST_ACTIVITY_FEEDBACK_MODEL =
  process.env.AI_MODEL_POST_ACTIVITY_FEEDBACK || 'google/gemini-3-pro-preview';

/**
 * Model for QnA agent
 * Fallback: 'gpt-4o' (standard OpenAI model)
 */
export const QNA_MODEL = process.env.AI_MODEL_QNA || 'openai/gpt-4o';

/**
 * Model for TRIMP estimation agent
 * Fallback: 'gpt-4o' (standard OpenAI model)
 */
export const TRIMP_ESTIMATION_MODEL =
  process.env.AI_MODEL_TRIMP_ESTIMATION || 'openai/gpt-5.1';
