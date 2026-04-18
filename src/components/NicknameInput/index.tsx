import { useMemo } from "react";

import { validateNickname } from "@/components/NicknameInput/nicknameRules";

export interface NicknameInputProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly id?: string;
  readonly label: string;
}

export function NicknameInput({ value, onValueChange, id, label }: NicknameInputProps) {
  const error = useMemo(() => validateNickname(value), [value]);

  const inputId = id ?? "nickname-input";

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="text-xs font-semibold tracking-[0.18em] text-(--na-text-muted) uppercase"
        style={{ fontFamily: "var(--na-font-display)" }}
      >
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        autoComplete="off"
        spellCheck={false}
        maxLength={24}
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
        }}
        className={`rounded-lg border-2 bg-(--na-surface) px-4 py-3.5 text-(--na-text) outline-none transition-[border-color,box-shadow] ${
          error !== null
            ? "border-(--na-rose) shadow-[0_0_0_1px_color-mix(in_oklch,var(--na-rose)_45%,transparent),0_0_22px_color-mix(in_oklch,var(--na-rose)_22%,transparent)]"
            : "border-(--na-border) focus:border-(--na-cyan) focus:shadow-[0_0_0_1px_var(--na-cyan),0_0_26px_color-mix(in_oklch,var(--na-cyan)_32%,transparent)]"
        }`}
        style={{ fontFamily: "var(--na-font-body, sans-serif)" }}
        aria-invalid={error !== null}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
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
