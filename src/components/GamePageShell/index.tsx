import { useState, type ReactNode } from "react";

import { SettingsPanel } from "@/components/SettingsPanel";

interface GamePageShellBag {
  readonly onOpenSettings: () => void;
}

interface GamePageShellProps {
  /** Render prop receives a bag with UI callbacks so the game content can trigger the settings panel. */
  readonly children: (bag: GamePageShellBag) => ReactNode;
  /** Tailwind max-width class — defaults to "max-w-lg" for TicTacToe; Chess overrides to wider. */
  readonly maxWidth?: string;
}

export function GamePageShell({ children, maxWidth = "max-w-lg" }: GamePageShellProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <main className={`mx-auto flex min-h-0 w-full ${maxWidth} flex-col p-4 sm:p-8`}>
      <h1 className="sr-only">Game</h1>
      {children({ onOpenSettings: () => setSettingsOpen(true) })}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
