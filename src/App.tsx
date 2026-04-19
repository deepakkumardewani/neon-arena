import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { createBrowserRouter, Outlet, RouterProvider, useLocation } from "react-router-dom";

import { audioManager, primeAudioGestureUnlock } from "@/lib/audio/audioManager";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { authService } from "@/lib/services";
import { GamePage } from "@/pages/Game";
import { HomePage } from "@/pages/Home";
import { MatchmakingPage } from "@/pages/Matchmaking";
import { ModeSelectPage } from "@/pages/ModeSelect";
import { NicknameEntryPage } from "@/pages/NicknameEntry";
import { AppProviders } from "@/providers/AppProviders";

function PageTransitionLayout() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const isGame = path === "/play/tictactoe/game" || path.startsWith("/game/");
    audioManager.playMusic(isGame ? "bg-game" : "bg-home");
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="min-h-screen"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}

const router = createBrowserRouter([
  {
    element: <PageTransitionLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/play/tictactoe", element: <ModeSelectPage /> },
      { path: "/play/tictactoe/nickname", element: <NicknameEntryPage /> },
      { path: "/play/tictactoe/matchmaking", element: <MatchmakingPage /> },
      { path: "/play/tictactoe/game", element: <GamePage /> },
      { path: "/game/:gameId", element: <GamePage /> },
    ],
  },
]);

export function App() {
  useEffect(() => {
    primeAudioGestureUnlock();
  }, []);

  useEffect(() => {
    void authService
      .signInAnonymously()
      .then((u) => {
        usePlayerStore.getState().setUid(u.uid);
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
