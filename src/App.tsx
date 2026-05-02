import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useEffect, type ReactElement } from "react";
import { createBrowserRouter, Outlet, RouterProvider, useLocation } from "react-router-dom";

import { audioManager, primeAudioGestureUnlock } from "@/lib/audio/audioManager";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { usePresenceSession } from "@/hooks/usePresenceSession";
import { authService } from "@/lib/services/auth";
import { chessConfig } from "@/pages/Chess/chessConfig";
import { tictactoeConfig } from "@/pages/ModeSelect/tictactoeConfig";
import { AppProviders } from "@/providers/AppProviders";

const HomePage = lazy(async () => {
  const m = await import("@/pages/Home");
  return { default: m.HomePage };
});
const ModeSelectPage = lazy(async () => {
  const m = await import("@/pages/ModeSelect");
  return { default: m.ModeSelectPage };
});
const NicknameEntryPage = lazy(async () => {
  const m = await import("@/pages/NicknameEntry");
  return { default: m.NicknameEntryPage };
});
const MatchmakingPage = lazy(async () => {
  const m = await import("@/pages/Matchmaking");
  return { default: m.MatchmakingPage };
});
const GamePage = lazy(async () => {
  const m = await import("@/pages/Game");
  return { default: m.GamePage };
});
const ChessGamePage = lazy(async () => {
  const m = await import("@/pages/Chess/GamePage");
  return { default: m.ChessGamePage };
});

function RouteLoading(): ReactElement {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-(--na-bg) px-6 text-(--na-text-muted)"
      style={{ fontFamily: "var(--na-font-display)" }}
    >
      Loading…
    </div>
  );
}

function PageShell({ children }: { readonly children: React.ReactNode }): ReactElement {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
}

function PageTransitionLayout() {
  const location = useLocation();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const path = location.pathname;
    const isGame =
      path === "/play/tictactoe/game" || path === "/play/chess/game" || path.startsWith("/game/");
    audioManager.playMusic(isGame ? "bg-game" : "bg-home");
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="min-h-screen"
        initial={reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
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
      {
        path: "/",
        element: (
          <PageShell>
            <HomePage />
          </PageShell>
        ),
      },
      // — TicTacToe routes —
      {
        path: "/play/tictactoe",
        element: (
          <PageShell>
            <ModeSelectPage gameConfig={tictactoeConfig} />
          </PageShell>
        ),
      },
      {
        path: "/play/tictactoe/nickname",
        element: (
          <PageShell>
            <NicknameEntryPage gameConfig={tictactoeConfig} />
          </PageShell>
        ),
      },
      {
        path: "/play/tictactoe/matchmaking",
        element: (
          <PageShell>
            <MatchmakingPage gameConfig={tictactoeConfig} />
          </PageShell>
        ),
      },
      {
        path: "/play/tictactoe/game",
        element: (
          <PageShell>
            <GamePage />
          </PageShell>
        ),
      },
      {
        path: "/game/:gameId",
        element: (
          <PageShell>
            <GamePage />
          </PageShell>
        ),
      },
      // — Chess routes —
      {
        path: "/play/chess",
        element: (
          <PageShell>
            <ModeSelectPage gameConfig={chessConfig} />
          </PageShell>
        ),
      },
      {
        path: "/play/chess/nickname",
        element: (
          <PageShell>
            <NicknameEntryPage gameConfig={chessConfig} />
          </PageShell>
        ),
      },
      {
        path: "/play/chess/matchmaking",
        element: (
          <PageShell>
            <MatchmakingPage gameConfig={chessConfig} />
          </PageShell>
        ),
      },
      {
        path: "/play/chess/game",
        element: (
          <PageShell>
            <ChessGamePage />
          </PageShell>
        ),
      },
      {
        path: "/game/chess/:gameId",
        element: (
          <PageShell>
            <ChessGamePage />
          </PageShell>
        ),
      },
    ],
  },
]);

function PresenceSessionRoot(): null {
  usePresenceSession();
  return null;
}

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
      <PresenceSessionRoot />
      <RouterProvider router={router} />
    </AppProviders>
  );
}
