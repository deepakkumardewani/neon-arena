import { useCallback, useEffect, useRef, useState } from "react";
import { AUTO_HINT_INACTIVITY_MS } from "./hintConfig";

interface UseHintSystemOptions {
  /** From settings.hintsEnabled — suppresses auto-hint when false */
  enabled: boolean;
  /** From settings.autoHintDelayMs (0 = disabled) */
  autoDelayMs: number;
  tokens: number;
  /** True when it is the human player's turn and AI is not thinking */
  isPlayerTurn: boolean;
  onRequestHint: () => void;
}

interface UseHintSystemResult {
  /** Countdown seconds shown in HUD; null when timer is inactive */
  secondsUntilAutoHint: number | null;
  canHint: boolean;
  /** Call this on every user interaction (square click, mouse move on board) */
  onUserActivity: () => void;
}

/**
 * Manages inactivity-based auto-hint timer and the hint token economy display.
 * - Timer only runs on human's turn (never during AI thinking)
 * - Resets on every user interaction
 * - Fires auto-hint after `autoDelayMs` of inactivity when tokens > 0 and enabled
 */
export function useHintSystem({
  enabled,
  autoDelayMs,
  tokens,
  isPlayerTurn,
  onRequestHint,
}: UseHintSystemOptions): UseHintSystemResult {
  const canHint = tokens > 0 && enabled;

  // Effective delay: use the provided value or the global default
  const effectiveDelay = autoDelayMs > 0 ? autoDelayMs : AUTO_HINT_INACTIVITY_MS;

  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inactivityStartRef = useRef<number>(0);

  const onRequestHintRef = useRef(onRequestHint);
  onRequestHintRef.current = onRequestHint;

  const stopTimers = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current !== null) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setSecondsRemaining(null);
  }, []);

  const startTimer = useCallback(() => {
    stopTimers();

    if (!enabled || !canHint || autoDelayMs === 0) return;

    inactivityStartRef.current = Date.now();

    // Countdown ticker — updates every second
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - inactivityStartRef.current;
      const remaining = Math.max(0, Math.ceil((effectiveDelay - elapsed) / 1000));
      setSecondsRemaining(remaining);
    }, 1000);

    // Auto-hint fire
    timerRef.current = setTimeout(() => {
      stopTimers();
      onRequestHintRef.current();
    }, effectiveDelay);

    setSecondsRemaining(Math.ceil(effectiveDelay / 1000));
  }, [enabled, canHint, autoDelayMs, effectiveDelay, stopTimers]);

  // Start / stop timer based on whether it's the player's turn
  useEffect(() => {
    if (isPlayerTurn && canHint && enabled && autoDelayMs > 0) {
      startTimer();
    } else {
      stopTimers();
    }

    return stopTimers;
  }, [isPlayerTurn, canHint, enabled, autoDelayMs, startTimer, stopTimers]);

  const onUserActivity = useCallback(() => {
    if (isPlayerTurn && canHint && enabled && autoDelayMs > 0) {
      startTimer();
    }
  }, [isPlayerTurn, canHint, enabled, autoDelayMs, startTimer]);

  return {
    secondsUntilAutoHint: secondsRemaining,
    canHint,
    onUserActivity,
  };
}
