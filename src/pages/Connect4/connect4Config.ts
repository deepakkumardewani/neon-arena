import type { GameConfig } from "@/types/game";

export const connect4Config: GameConfig = {
  gameType: "connect4",
  title: "Connect 4",
  description:
    "Drop discs, build four in a row — solo vs AI, couch co-op, random matchmaking, or a private duel.",
  routePrefix: "/play/connect4",
  modes: ["solo", "local", "online", "friend"],
};
