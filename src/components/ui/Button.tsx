import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";

export type ButtonTone = "cyan" | "purple" | "surface";

type FocusOffset = "bg" | "surface";

const focusRing = (offset: FocusOffset, ringAccent: "cyan" | "purple"): string => {
  const ring =
    ringAccent === "purple" ? "focus-visible:ring-(--na-purple)" : "focus-visible:ring-(--na-cyan)";
  return offset === "surface"
    ? `outline-none focus-visible:ring-2 ${ring} focus-visible:ring-offset-2 focus-visible:ring-offset-(--na-surface)`
    : `outline-none focus-visible:ring-2 ${ring} focus-visible:ring-offset-2 focus-visible:ring-offset-(--na-bg)`;
};

const toneClasses: Record<ButtonTone, string> = {
  cyan: "border-(--na-cyan) text-(--na-cyan)",
  purple: "border-(--na-purple) text-(--na-purple)",
  surface: "border-(--na-border) bg-(--na-surface) text-(--na-cyan)",
};

export type ButtonProps =
  | (Omit<ComponentPropsWithoutRef<"button">, "type"> & {
      readonly appearance?: "text";
      readonly tone?: ButtonTone;
      /** Only interaction + focus styles; supply layout and colors via `className`. */
      readonly unstyled?: boolean;
      readonly ringOffset?: FocusOffset;
      readonly type?: "button" | "submit" | "reset";
      readonly children: ReactNode;
    })
  | (Omit<ComponentPropsWithoutRef<"button">, "type"> & {
      readonly appearance: "icon";
      readonly "aria-label": string;
      readonly ringOffset?: FocusOffset;
      readonly type?: "button" | "submit" | "reset";
      readonly children: ReactNode;
    });

export function Button(props: ButtonProps): ReactElement {
  if (props.appearance === "icon") {
    const {
      appearance: _appearance,
      "aria-label": ariaLabel,
      children,
      className = "",
      disabled,
      type = "button",
      ringOffset = "bg",
      ...htmlRest
    } = props;
    const fr = focusRing(ringOffset, "cyan");
    const disabledCls = "disabled:cursor-not-allowed disabled:opacity-50";
    return (
      <button
        type={type}
        aria-label={ariaLabel}
        disabled={disabled}
        className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-(--na-border) bg-(--na-surface) text-lg text-(--na-text) shadow-(--na-glow-grid) ${fr} ${disabledCls} ${className}`}
        {...htmlRest}
      >
        {children}
      </button>
    );
  }

  const {
    appearance: _appearance,
    tone = "cyan",
    unstyled = false,
    children,
    className = "",
    disabled,
    type = "button",
    ringOffset = "bg",
    ...htmlRest
  } = props as Extract<ButtonProps, { appearance?: "text" }>;

  const ringAccent = tone === "purple" ? "purple" : "cyan";
  const fr = focusRing(ringOffset, ringAccent);
  const disabledCls = "disabled:cursor-not-allowed disabled:opacity-50";
  const preset = unstyled
    ? `cursor-pointer ${focusRing(ringOffset, "cyan")} ${disabledCls}`
    : `rounded-full border bg-(--na-surface) px-5 py-2 text-sm ${toneClasses[tone]} ${fr} cursor-pointer ${disabledCls}`;

  return (
    <button type={type} disabled={disabled} className={`${preset} ${className}`} {...htmlRest}>
      {children}
    </button>
  );
}
