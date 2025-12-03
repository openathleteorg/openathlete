import { z } from 'zod';

/**
 * Subscription plans available in the system
 */
export enum SubscriptionPlan {
  FREE = 'FREE',
  ATHLETE_PRO = 'ATHLETE_PRO',
  COACH_PRO = 'COACH_PRO',
  COACH_ULTRA = 'COACH_ULTRA',
  CLUB_PRO = 'CLUB_PRO',
  CLUB_ULTRA = 'CLUB_ULTRA',
}

/**
 * Subscription status
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  UNPAID = 'unpaid',
}

/**
 * Plan configuration with limits and features
 */
export interface PlanConfig {
  plan: SubscriptionPlan;
  name: string;
  price: number; // Price in euros (TTC)
  maxAthletes: number | null; // null = unlimited
  hasAIFeatures: boolean;
  description: string;
}

/**
 * Plan configurations mapping
 */
export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanConfig> = {
  [SubscriptionPlan.FREE]: {
    plan: SubscriptionPlan.FREE,
    name: 'Free',
    price: 0,
    maxAthletes: 3,
    hasAIFeatures: false,
    description: 'Plan gratuit avec fonctionnalités de base',
  },
  [SubscriptionPlan.ATHLETE_PRO]: {
    plan: SubscriptionPlan.ATHLETE_PRO,
    name: 'Athlete Pro',
    price: 5.99,
    maxAthletes: 0, // 0 = cannot coach athletes
    hasAIFeatures: true,
    description: 'Accès aux fonctionnalités IA pour les athlètes',
  },
  [SubscriptionPlan.COACH_PRO]: {
    plan: SubscriptionPlan.COACH_PRO,
    name: 'Coach Pro',
    price: 19.99,
    maxAthletes: 20,
    hasAIFeatures: true,
    description: "Jusqu'à 20 athlètes + fonctionnalités IA",
  },
  [SubscriptionPlan.COACH_ULTRA]: {
    plan: SubscriptionPlan.COACH_ULTRA,
    name: 'Coach Ultra',
    price: 39.99,
    maxAthletes: null, // unlimited
    hasAIFeatures: true,
    description: 'Athlètes illimités + fonctionnalités IA',
  },
  [SubscriptionPlan.CLUB_PRO]: {
    plan: SubscriptionPlan.CLUB_PRO,
    name: 'Club Pro',
    price: 49.99,
    maxAthletes: 80,
    hasAIFeatures: true,
    description: "Jusqu'à 80 licenciés + fonctionnalités IA",
  },
  [SubscriptionPlan.CLUB_ULTRA]: {
    plan: SubscriptionPlan.CLUB_ULTRA,
    name: 'Club Ultra',
    price: 89.99,
    maxAthletes: null, // unlimited
    hasAIFeatures: true,
    description: 'Licenciés illimités + fonctionnalités IA',
  },
};

/**
 * Get plan configuration
 */
export function getPlanConfig(plan: SubscriptionPlan): PlanConfig {
  return PLAN_CONFIGS[plan];
}

/**
 * Check if plan has AI features
 */
export function planHasAIFeatures(plan: SubscriptionPlan): boolean {
  return PLAN_CONFIGS[plan].hasAIFeatures;
}

/**
 * Get max athletes for a plan
 */
export function getMaxAthletes(plan: SubscriptionPlan): number | null {
  return PLAN_CONFIGS[plan].maxAthletes;
}

/**
 * Feature names that can be restricted
 */
export enum FeatureName {
  AI_GENERATION = 'ai-generation',
  AI_RPE_QUESTIONS = 'ai-rpe-questions',
}

/**
 * Zod schema for subscription plan
 */
export const subscriptionPlanSchema = z.nativeEnum(SubscriptionPlan);

/**
 * Zod schema for subscription status
 */
export const subscriptionStatusSchema = z.nativeEnum(SubscriptionStatus);

// DTOs are exported from ./dtos/subscription
