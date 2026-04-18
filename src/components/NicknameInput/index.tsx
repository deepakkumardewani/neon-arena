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
      <label htmlFor={inputId} className="text-sm font-medium text-(--na-text-muted)">
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
        className="rounded-md border border-(--na-border) bg-(--na-surface) px-3 py-2.5 text-(--na-text) outline-none transition-[box-shadow,border-color] focus:border-(--na-cyan) focus:shadow-[0_0_0_1px_var(--na-cyan),0_0_18px_color-mix(in_oklab,var(--na-cyan)_35%,transparent)]"
        style={{ fontFamily: "var(--na-font-body, sans-serif)" }}
        aria-invalid={error !== null}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-(--na-rose)" role="alert">
          {error}
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
