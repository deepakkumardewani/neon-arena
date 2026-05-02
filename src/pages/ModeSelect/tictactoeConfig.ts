import type { GameConfig } from "@/types/game";

export const tictactoeConfig: GameConfig = {
  gameType: "tictactoe",
  title: "Tic Tac Toe",
  description:
    "Solo training, couch co-op, random matchmaking, or a private duel — pick how you want to play.",
  routePrefix: "/play/tictactoe",
  modes: ["solo", "local", "online", "friend"],
};
