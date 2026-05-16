import type { GameConfig } from "@/types/game";

export const dotsConfig: GameConfig = {
  gameType: "dots-and-boxes",
  title: "Dots & Boxes",
  description:
    "Draw lines, claim boxes, control the chain — solo vs AI, couch co-op, random matchmaking, or a private duel.",
  routePrefix: "/play/dots-and-boxes",
  modes: ["solo", "local", "online", "friend"],
};
