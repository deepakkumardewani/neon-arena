import type { GameConfig } from "@/types/game";

export const chessConfig: GameConfig = {
  gameType: "chess",
  title: "Chess",
  description:
    "Solo tactics against the engine, couch co-op, random matchmaking, or a private duel — pick how you want to play.",
  routePrefix: "/play/chess",
  modes: ["solo", "local", "online", "friend"],
};
