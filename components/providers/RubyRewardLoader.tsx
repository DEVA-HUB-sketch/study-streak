"use client";

/**
 * RubyRewardLoader — thin Client Component wrapper.
 *
 * next/dynamic with ssr:false is only allowed inside "use client" files.
 * app/layout.tsx is a Server Component, so we delegate the dynamic import here.
 */
import dynamic from "next/dynamic";

const RubyReward = dynamic(
  () => import("@/components/3d/RubyReward"),
  { ssr: false }
);

export default function RubyRewardLoader() {
  return <RubyReward />;
}
