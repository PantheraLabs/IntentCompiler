"use client";

import { getTierBadge, getTierConfig, type UserTier } from "@/lib/tierConfig";

type TierBadgeProps = {
  tier: UserTier;
  showDetails?: boolean;
  onUpgrade?: () => void;
};

export default function TierBadge({ tier, showDetails = false, onUpgrade }: TierBadgeProps) {
  const badge = getTierBadge(tier);
  const config = getTierConfig(tier);

  return (
    <div className="inline-flex flex-col gap-1">
      <div className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${badge.color}`}>
        {badge.label}
      </div>
      
      {showDetails && (
        <div className="mt-2 rounded-lg border border-border bg-surfaceAlt/50 p-3 text-xs">
          <p className="font-semibold text-text">{config.name}</p>
          <p className="text-muted mt-1">{config.description}</p>
          
          <ul className="mt-2 space-y-1 text-muted">
            <li>• {config.allowUnlimitedSteps ? "Unlimited" : `Up to ${config.maxSteps}`} workflow steps</li>
            <li>• {config.availableRoles === "all" ? "50+" : config.availableRoles === "premium" ? "40+" : config.availableRoles === "standard" ? "25+" : "15"} roles available</li>
            {config.enableAdvancedTools && <li>• Advanced tools & integrations</li>}
            {config.enableBranching && <li>• Conditional branching</li>}
            {config.priorityProcessing && <li>• Priority AI processing</li>}
          </ul>
          
          {tier === "free" && onUpgrade && (
            <button
              onClick={onUpgrade}
              className="mt-3 w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2 text-xs font-bold text-white transition hover:opacity-90"
            >
              Upgrade to Premium
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type FeatureGateProps = {
  tier: UserTier;
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function FeatureGate({ tier, feature, children, fallback }: FeatureGateProps) {
  const config = getTierConfig(tier);
  
  // Check if feature is available based on tier
  const isAvailable = checkFeatureAvailability(config, feature);
  
  if (isAvailable) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200">
      <p className="font-semibold">🔒 {feature} - Premium Feature</p>
      <p className="mt-1 text-[10px] opacity-80">Upgrade to Premium to unlock this feature</p>
    </div>
  );
}

function checkFeatureAvailability(config: ReturnType<typeof getTierConfig>, feature: string): boolean {
  switch (feature) {
    case "unlimited_steps":
      return config.allowUnlimitedSteps;
    case "custom_steps":
      return config.allowCustomSteps;
    case "advanced_tools":
      return config.enableAdvancedTools;
    case "branching":
      return config.enableBranching;
    case "parallel_execution":
      return config.enableParallelExecution;
    case "template_sharing":
      return config.enableTemplateSharing;
    case "all_roles":
      return config.availableRoles === "all";
    case "priority_processing":
      return config.priorityProcessing;
    default:
      return true;
  }
}

type StepLimitWarningProps = {
  tier: UserTier;
  currentSteps: number;
  onUpgrade?: () => void;
};

export function StepLimitWarning({ tier, currentSteps, onUpgrade }: StepLimitWarningProps) {
  const config = getTierConfig(tier);
  
  if (tier === "premium" || currentSteps < config.maxSteps) {
    return null;
  }
  
  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200">
      <p className="font-semibold">⚠️ Step Limit Reached</p>
      <p className="mt-1 text-[10px]">
        You've reached the {config.maxSteps} step limit for the Free tier. 
        Upgrade to Premium for unlimited workflow steps.
      </p>
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="mt-2 rounded-md bg-amber-400/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition hover:bg-amber-400/30"
        >
          Upgrade Now
        </button>
      )}
    </div>
  );
}
