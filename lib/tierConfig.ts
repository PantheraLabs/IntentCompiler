/**
 * Tier configuration for IntentCompiler
 * Defines feature limits and capabilities for free and premium users
 */

export type UserTier = "free" | "premium";

export interface TierConfig {
  name: string;
  description: string;
  maxSteps: number;
  allowUnlimitedSteps: boolean;
  allowCustomSteps: boolean;
  allowRoleEditing: boolean;
  enableValidation: boolean;
  enableLivePreview: boolean;
  enableAdvancedTools: boolean;
  enableBranching: boolean;
  enableParallelExecution: boolean;
  enableTemplateSharing: boolean;
  availableRoles: "basic" | "standard" | "premium" | "all";
  priorityProcessing: boolean;
  analytics: "basic" | "standard" | "advanced";
  supportLevel: "community" | "priority" | "dedicated";
}

export const TIER_CONFIGS: Record<UserTier, TierConfig> = {
  free: {
    name: "Free Tier",
    description: "Perfect for individual developers and small projects",
    maxSteps: 8,
    allowUnlimitedSteps: false,
    allowCustomSteps: false,
    allowRoleEditing: true,
    enableValidation: true,
    enableLivePreview: true,
    enableAdvancedTools: false,
    enableBranching: false,
    enableParallelExecution: false,
    enableTemplateSharing: false,
    availableRoles: "standard",
    priorityProcessing: false,
    analytics: "basic",
    supportLevel: "community"
  },
  premium: {
    name: "Premium Tier",
    description: "For professional teams and complex projects",
    maxSteps: 999,
    allowUnlimitedSteps: true,
    allowCustomSteps: true,
    allowRoleEditing: true,
    enableValidation: true,
    enableLivePreview: true,
    enableAdvancedTools: true,
    enableBranching: true,
    enableParallelExecution: true,
    enableTemplateSharing: true,
    availableRoles: "all",
    priorityProcessing: true,
    analytics: "advanced",
    supportLevel: "dedicated"
  }
};

export function getTierConfig(tier: UserTier): TierConfig {
  return TIER_CONFIGS[tier];
}

export function isFeatureAvailable(tier: UserTier, feature: keyof TierConfig): boolean {
  const config = TIER_CONFIGS[tier];
  const value = config[feature];
  
  if (typeof value === "boolean") {
    return value;
  }
  
  // For numeric limits, always return true (the limit is checked separately)
  if (typeof value === "number") {
    return true;
  }
  
  // For string enums, check if it's not the lowest tier
  if (typeof value === "string") {
    return value !== "basic" && value !== "community";
  }
  
  return true;
}

export function getStepLimit(tier: UserTier): number {
  return TIER_CONFIGS[tier].maxSteps;
}

export function canAddMoreSteps(tier: UserTier, currentStepCount: number): boolean {
  const limit = getStepLimit(tier);
  return currentStepCount < limit;
}

export function getAvailableRoleCount(tier: UserTier): number {
  const config = TIER_CONFIGS[tier];
  
  switch (config.availableRoles) {
    case "basic":
      return 15;
    case "standard":
      return 25;
    case "premium":
      return 40;
    case "all":
      return 50;
    default:
      return 25;
  }
}

export function getUpgradeMessage(feature: string): string {
  return `🔒 ${feature} is available in Premium. Upgrade to unlock unlimited workflows and advanced features.`;
}

export function getTierBadge(tier: UserTier): { label: string; color: string } {
  switch (tier) {
    case "premium":
      return { label: "PRO", color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white" };
    default:
      return { label: "FREE", color: "bg-slate-600 text-white" };
  }
}
