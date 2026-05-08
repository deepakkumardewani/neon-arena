import { useHintSystem } from "../../chess/hints/useHintSystem";
import { useConnect4Settings } from "../state/useConnect4Settings";
import { useConnect4Store } from "../state/useConnect4Store";

interface UseConnect4HintSystemOptions {
  /** False during AI thinking — prevents auto-hint from firing */
  isThinking: boolean;
}

export function useConnect4HintSystem({ isThinking }: UseConnect4HintSystemOptions) {
  const { state, requestHint } = useConnect4Store();
  const hintsEnabled = useConnect4Settings((s) => s.hintsEnabled);
  const autoHintDelayMs = useConnect4Settings((s) => s.autoHintDelayMs);

  const isPlayerTurn = state.status === "playing" && !isThinking;

  return useHintSystem({
    enabled: hintsEnabled,
    autoDelayMs: autoHintDelayMs,
    tokens: state.hintTokens,
    isPlayerTurn,
    onRequestHint: requestHint,
  });
}
