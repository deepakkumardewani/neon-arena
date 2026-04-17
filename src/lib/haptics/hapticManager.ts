import { WebHaptics } from "web-haptics";

const haptics = new WebHaptics();

export const hapticManager = {
  place: () => {
    void haptics.trigger(50).catch(() => {});
  },
  win: () => {
    void haptics.trigger([80, 60, 80, 60, 80]).catch(() => {});
  },
  tap: () => {
    void haptics.trigger(20).catch(() => {});
  },
};
