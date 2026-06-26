"use client";

/**
 * useRubyReward
 *
 * Event-based ruby reward trigger. Works from any component anywhere
 * in the tree — no provider, no context, no prop drilling.
 *
 * Usage:
 *   const { triggerRubyReward } = useRubyReward();
 *   triggerRubyReward({ amount: 10 });
 *
 * The RubyReward overlay (in app/layout.tsx) listens for the
 * custom DOM event and plays the 3D flying-ruby animation.
 */

export const RUBY_REWARD_EVENT = "study-streak:ruby-reward" as const;

export interface RubyRewardPayload {
  /** How many rubies were earned — controls number of 3D models spawned */
  amount: number;
}

/**
 * Dispatch a ruby reward animation from any component.
 * Safe to call during SSR (no-ops on the server).
 */
export function triggerRubyReward(payload: RubyRewardPayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<RubyRewardPayload>(RUBY_REWARD_EVENT, { detail: payload })
  );
}

/** Hook wrapper for components that prefer the hook pattern */
export function useRubyReward() {
  return { triggerRubyReward };
}
