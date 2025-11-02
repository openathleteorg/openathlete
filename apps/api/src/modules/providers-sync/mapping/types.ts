/**
 * Base interface for provider-specific workout payloads
 * Each provider will extend this with their specific format
 */
export interface ProviderWorkoutPayload {
  date: string; // YYYY-MM-DD
  title?: string;
  description?: string;
  steps: ProviderWorkoutStep[];
}

/**
 * Simplified step structure for providers
 * Features are flattened based on provider capabilities
 */
export interface ProviderWorkoutStep {
  order: number;
  type: string; // Provider-specific step type
  name?: string;
  notes?: string;
  duration?: {
    type: string;
    value?: number;
  };
  target?: {
    type: string;
    min?: number;
    max?: number;
    value?: number;
    zone?: number;
    unit?: string;
  };
}

/**
 * Capability matrix per provider
 * Indicates which features are supported
 */
export interface ProviderCapabilities {
  supportsPaceTargets: boolean;
  supportsHeartRateTargets: boolean;
  supportsPowerTargets: boolean;
  supportsCadenceTargets: boolean;
  supportsRpeTargets: boolean;
  supportsDistanceDuration: boolean;
  supportsTimeDuration: boolean;
  supportsRepeatBlocks: boolean;
  supportsCustomNotes: boolean;
}
