import { useEffect, useState } from "react";
import type { Connect4GameState } from "@/lib/connect4/types";

interface Scores {
  p1Wins: number;
  p2Wins: number;
  draws: number;
}

interface Connect4ScoreBoardProps {
  gameState: Connect4GameState;
  p1Label?: string;
  p2Label?: string;
}

export function Connect4ScoreBoard({
  gameState,
  p1Label = "Player 1",
  p2Label = "Player 2",
}: Connect4ScoreBoardProps) {
  const [scores, setScores] = useState<Scores>({ p1Wins: 0, p2Wins: 0, draws: 0 });
  // Track the last status so we only increment once per game finish
  const [lastStatus, setLastStatus] = useState<string>(gameState.status);

  useEffect(() => {
    if (gameState.status === "finished" && lastStatus !== "finished") {
      setScores((prev) => {
        if (gameState.isDraw) return { ...prev, draws: prev.draws + 1 };
        if (gameState.winResult?.winner === 1) return { ...prev, p1Wins: prev.p1Wins + 1 };
        if (gameState.winResult?.winner === 2) return { ...prev, p2Wins: prev.p2Wins + 1 };
        return prev;
      });
    }
    setLastStatus(gameState.status);
  }, [gameState.status, gameState.isDraw, gameState.winResult, lastStatus]);

  const items: { label: string; value: number; color: string }[] = [
    { label: p1Label, value: scores.p1Wins, color: "var(--na-cyan)" },
    { label: "Draws", value: scores.draws, color: "var(--na-text-muted, #888)" },
    { label: p2Label, value: scores.p2Wins, color: "var(--na-rose)" },
  ];

  return (
    <div
      className="flex items-center justify-center gap-4 rounded-lg border border-(--na-border) bg-(--na-surface) px-4 py-2"
      style={{ boxShadow: "var(--na-glow-grid)" }}
    >
      {items.map(({ label, value, color }) => (
        <div key={label} className="flex flex-col items-center gap-0.5">
          <span
            className="text-lg font-bold tabular-nums"
            style={{ color, fontFamily: "var(--na-font-display)" }}
          >
            {value}
          </span>
          <span className="text-[10px] text-(--na-text-muted) uppercase tracking-widest">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
