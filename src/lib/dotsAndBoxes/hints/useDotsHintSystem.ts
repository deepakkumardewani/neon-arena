import { useHintSystem } from "@/lib/chess/hints/useHintSystem";
import { useDotsSettings } from "../state/useDotsSettings";
import { useDotsStore } from "../state/useDotsStore";

interface UseDotsHintSystemOptions {
  /** False during AI thinking or online opponent's turn */
  isPlayerTurn: boolean;
}

export function useDotsHintSystem({ isPlayerTurn }: UseDotsHintSystemOptions) {
  const requestHint = useDotsStore((s) => s.requestHint);
  const hintTokens = useDotsStore((s) => s.hintTokens);
  const hintsEnabled = useDotsSettings((s) => s.hintsEnabled);
  const autoHintDelayMs = useDotsSettings((s) => s.autoHintDelayMs);

  return useHintSystem({
    enabled: hintsEnabled,
    autoDelayMs: autoHintDelayMs,
    tokens: hintTokens,
    isPlayerTurn,
    onRequestHint: requestHint,
  });
}
