import { WebHaptics } from "web-haptics";

const haptics = new WebHaptics();

function safeTrigger(input: number | number[]): void {
  try {
    void haptics.trigger(input).catch(() => {});
  } catch {
    /* unsupported or transient failure */
  }
}

export const hapticManager = {
  place: () => {
    safeTrigger(50);
  },
  win: () => {
    safeTrigger([80, 60, 80, 60, 80]);
  },
  tap: () => {
    safeTrigger(20);
  },
};
