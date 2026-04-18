import { initParticlesEngine } from "@tsparticles/react";
import { loadEmittersPlugin } from "@tsparticles/plugin-emitters";
import { loadSlim } from "@tsparticles/slim";

let engineBoot: Promise<void> | null = null;

/** Single init for all tsparticles surfaces (ambient + confetti). */
export function ensureParticlesEngine(): Promise<void> {
  if (!engineBoot) {
    engineBoot = initParticlesEngine(async (engine) => {
      await loadSlim(engine);
      await loadEmittersPlugin(engine);
    });
  }
  return engineBoot;
}
