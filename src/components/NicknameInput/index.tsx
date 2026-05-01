import { useEffect, useMemo, useRef, useState } from "react";

import { NICKNAME_MAX_LEN, validateNickname } from "@/components/NicknameInput/nicknameRules";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export interface NicknameInputProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly id?: string;
  readonly label: string;
}

const NEAR_LIMIT_CHARS = 6;

export function NicknameInput({ value, onValueChange, id, label }: NicknameInputProps) {
  const error = useMemo(() => validateNickname(value), [value]);
  const valid = error === null;
  const reducedMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const prevValidRef = useRef(valid);
  const [validBurstKey, setValidBurstKey] = useState(0);
  const prevLenRef = useRef(value.length);
  const [capPulseKey, setCapPulseKey] = useState(0);

  const inputId = id ?? "nickname-input";

  const showCounter = focused || value.length >= NICKNAME_MAX_LEN - NEAR_LIMIT_CHARS;

  useEffect(() => {
    if (valid && !prevValidRef.current) {
      setValidBurstKey((k) => k + 1);
    }
    prevValidRef.current = valid;
  }, [valid]);

  useEffect(() => {
    const prevLen = prevLenRef.current;
    prevLenRef.current = value.length;
    if (reducedMotion) return;
    if (value.length === NICKNAME_MAX_LEN && prevLen !== NICKNAME_MAX_LEN) {
      setCapPulseKey((k) => k + 1);
    }
  }, [reducedMotion, value.length]);

  const counterToneClass =
    value.length >= NICKNAME_MAX_LEN
      ? "text-(--na-rose)"
      : value.length >= 20
        ? "text-(--na-rose)"
        : "text-(--na-text-muted)";

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="text-xs font-semibold tracking-[0.18em] text-(--na-text-muted) uppercase"
        style={{ fontFamily: "var(--na-font-display)" }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          spellCheck={false}
          maxLength={NICKNAME_MAX_LEN}
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
          }}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
          }}
          className={`w-full rounded-lg border-2 bg-(--na-surface) py-3.5 pr-12 pl-4 text-(--na-text) outline-none transition-[border-color,box-shadow] duration-150 ease-out ${
            error !== null
              ? "border-(--na-rose) shadow-[0_0_0_1px_color-mix(in_oklch,var(--na-rose)_45%,transparent),0_0_22px_color-mix(in_oklch,var(--na-rose)_22%,transparent)]"
              : valid
                ? "border-(--na-cyan) shadow-[0_0_0_1px_color-mix(in_oklch,var(--na-cyan)_55%,transparent),0_0_22px_color-mix(in_oklch,var(--na-cyan)_28%,transparent)]"
                : "border-(--na-border) focus:border-(--na-cyan) focus:shadow-[0_0_0_1px_var(--na-cyan),0_0_26px_color-mix(in_oklch,var(--na-cyan)_32%,transparent)]"
          }`}
          style={{ fontFamily: "var(--na-font-body, sans-serif)" }}
          aria-invalid={error !== null}
          aria-describedby={
            [error !== null ? `${inputId}-error` : null, showCounter ? `${inputId}-counter` : null]
              .filter((x): x is string => x !== null)
              .join(" ") || undefined
          }
        />
        {valid ? (
          <span
            key={validBurstKey}
            className={`pointer-events-none absolute top-1/2 right-3 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-(--na-cyan) bg-(--na-bg) text-sm font-bold text-(--na-cyan) shadow-(--na-glow-grid) ${
              reducedMotion ? "" : "na-nickname-valid-check"
            }`}
            aria-hidden
          >
            ✓
          </span>
        ) : null}
      </div>
      {showCounter ? (
        <p
          key={capPulseKey}
          id={`${inputId}-counter`}
          className={`text-right text-[11px] tabular-nums transition-colors duration-150 ${counterToneClass} ${
            !reducedMotion && value.length === NICKNAME_MAX_LEN ? "na-counter-cap-pulse" : ""
          }`}
          aria-live="polite"
        >
          {value.length} / {NICKNAME_MAX_LEN}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${inputId}-error`}
          className="flex items-start gap-2 text-sm leading-snug text-(--na-rose)"
          role="alert"
        >
          <span
            aria-hidden
            className="mt-0.5 inline-block size-1.5 shrink-0 rounded-full bg-(--na-rose)"
          />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export {
  createGuestNickname,
  isNicknameValid,
  validateNickname,
} from "@/components/NicknameInput/nicknameRules";
