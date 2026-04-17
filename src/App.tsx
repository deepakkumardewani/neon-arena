import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { useAudioStore } from "@/hooks/useAudioStore";
import { useGameStore } from "@/hooks/useGameStore";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { authService } from "@/lib/services";
import { GamePage } from "@/pages/Game";
import { HomePage } from "@/pages/Home";
import { MatchmakingPage } from "@/pages/Matchmaking";
import { ModeSelectPage } from "@/pages/ModeSelect";
import { NicknameEntryPage } from "@/pages/NicknameEntry";
import { AppProviders } from "@/providers/AppProviders";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/play/tictactoe", element: <ModeSelectPage /> },
  { path: "/play/tictactoe/nickname", element: <NicknameEntryPage /> },
  { path: "/play/tictactoe/matchmaking", element: <MatchmakingPage /> },
  { path: "/play/tictactoe/game", element: <GamePage /> },
  { path: "/game/:gameId", element: <GamePage /> },
]);

export function App() {
  useEffect(() => {
    void useGameStore.getState().bootstrapped;
    void usePlayerStore.getState().bootstrapped;
    void useAudioStore.getState().bootstrapped;

    void authService
      .signInAnonymously()
      .then((u) => {
        console.log("[NeonArena] Firebase anonymous UID:", u.uid);
      })
      .catch((e) => {
        console.warn("[NeonArena] Anonymous auth failed (configure .env):", e);
      });
  }, []);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
