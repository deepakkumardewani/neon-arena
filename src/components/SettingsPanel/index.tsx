import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { useAudioStore } from "@/hooks/useAudioStore";
import { audioManager } from "@/lib/audio/audioManager";
import { hapticManager } from "@/lib/haptics/hapticManager";
import { useConnect4Settings } from "@/lib/connect4/state/useConnect4Settings";
import { useDotsSettings } from "@/lib/dotsAndBoxes/state/useDotsSettings";
import type { BoardSize } from "@/lib/dotsAndBoxes/types";

// ── Animation speed values (ms per row) ─────────────────────────────────────
const ANIMATION_SPEED_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "Slow", value: 120 },
  { label: "Normal", value: 60 },
  { label: "Fast", value: 30 },
] as const;

const AUTO_HINT_DELAY_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "15s", value: 15_000 },
  { label: "30s", value: 30_000 },
  { label: "60s", value: 60_000 },
] as const;

// ── Connect 4 settings section ───────────────────────────────────────────────

function C4Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4">
      <span
        className="text-sm text-(--na-text-muted)"
        style={{ fontFamily: "var(--na-font-display)" }}
      >
        {label}
      </span>
      <input
        id={id}
        type="checkbox"
        className="h-5 w-5 accent-(--na-cyan)"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function Connect4SettingsSection() {
  const showLastMove = useConnect4Settings((s) => s.showLastMove);
  const allowUndo = useConnect4Settings((s) => s.allowUndo);
  const hintsEnabled = useConnect4Settings((s) => s.hintsEnabled);
  const autoHintDelayMs = useConnect4Settings((s) => s.autoHintDelayMs);
  const animationSpeedMs = useConnect4Settings((s) => s.animationSpeedMs);
  const updateSetting = useConnect4Settings((s) => s.updateSetting);

  return (
    <div className="space-y-5">
      <p
        className="text-xs tracking-[0.22em] text-(--na-cyan) uppercase"
        style={{ fontFamily: "var(--na-font-display)" }}
      >
        Connect 4
      </p>
      <C4Toggle
        id="c4-show-last-move"
        label="Show last move"
        checked={showLastMove}
        onChange={(v) => updateSetting("showLastMove", v)}
      />
      <C4Toggle
        id="c4-allow-undo"
        label="Allow undo"
        checked={allowUndo}
        onChange={(v) => updateSetting("allowUndo", v)}
      />
      <C4Toggle
        id="c4-hints"
        label="Hints"
        checked={hintsEnabled}
        onChange={(v) => updateSetting("hintsEnabled", v)}
      />
      <div>
        <label
          htmlFor="c4-auto-hint-delay"
          className="mb-2 block text-sm text-(--na-text-muted)"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          Auto-hint delay
        </label>
        <select
          id="c4-auto-hint-delay"
          value={autoHintDelayMs}
          className="w-full rounded border border-(--na-border) bg-(--na-surface-2) px-3 py-2 text-sm text-(--na-text) accent-(--na-cyan)"
          style={{ fontFamily: "var(--na-font-display)" }}
          onChange={(e) => updateSetting("autoHintDelayMs", Number(e.target.value))}
        >
          {AUTO_HINT_DELAY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="c4-animation-speed"
          className="mb-2 block text-sm text-(--na-text-muted)"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          Animation speed
        </label>
        <select
          id="c4-animation-speed"
          value={animationSpeedMs}
          className="w-full rounded border border-(--na-border) bg-(--na-surface-2) px-3 py-2 text-sm text-(--na-text) accent-(--na-cyan)"
          style={{ fontFamily: "var(--na-font-display)" }}
          onChange={(e) => updateSetting("animationSpeedMs", Number(e.target.value))}
        >
          {ANIMATION_SPEED_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── Board size options for Dots & Boxes ─────────────────────────────────────

const BOARD_SIZE_OPTIONS: Array<{ label: string; value: BoardSize }> = [
  { label: "3×3", value: { rows: 3, cols: 3 } },
  { label: "4×4", value: { rows: 4, cols: 4 } },
  { label: "5×5", value: { rows: 5, cols: 5 } },
];

function DotsToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4">
      <span
        className="text-sm text-(--na-text-muted)"
        style={{ fontFamily: "var(--na-font-display)" }}
      >
        {label}
      </span>
      <input
        id={id}
        type="checkbox"
        className="h-5 w-5 accent-(--na-cyan)"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function DotsSettingsSection() {
  const defaultSize = useDotsSettings((s) => s.defaultSize);
  const showLastMove = useDotsSettings((s) => s.showLastMove);
  const allowUndo = useDotsSettings((s) => s.allowUndo);
  const hintsEnabled = useDotsSettings((s) => s.hintsEnabled);
  const autoHintDelayMs = useDotsSettings((s) => s.autoHintDelayMs);
  const updateSetting = useDotsSettings((s) => s.updateSetting);

  const currentSizeLabel = `${defaultSize.rows}×${defaultSize.cols}`;

  return (
    <div className="space-y-5">
      <p
        className="text-xs tracking-[0.22em] text-(--na-cyan) uppercase"
        style={{ fontFamily: "var(--na-font-display)" }}
      >
        Dots &amp; Boxes
      </p>
      <div>
        <p
          className="mb-2 text-sm text-(--na-text-muted)"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          Default size
        </p>
        <div className="flex gap-2">
          {BOARD_SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              className={[
                "flex-1 rounded border px-2 py-1 text-sm",
                currentSizeLabel === opt.label
                  ? "border-(--na-cyan) text-(--na-cyan)"
                  : "border-(--na-border) text-(--na-text-muted)",
              ].join(" ")}
              style={{ fontFamily: "var(--na-font-display)" }}
              onClick={() => updateSetting("defaultSize", opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <DotsToggle
        id="dots-show-last-move"
        label="Show last move"
        checked={showLastMove}
        onChange={(v) => updateSetting("showLastMove", v)}
      />
      <DotsToggle
        id="dots-allow-undo"
        label="Allow undo"
        checked={allowUndo}
        onChange={(v) => updateSetting("allowUndo", v)}
      />
      <DotsToggle
        id="dots-hints"
        label="Hints"
        checked={hintsEnabled}
        onChange={(v) => updateSetting("hintsEnabled", v)}
      />
      <div>
        <label
          htmlFor="dots-auto-hint-delay"
          className="mb-2 block text-sm text-(--na-text-muted)"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          Auto-hint delay
        </label>
        <select
          id="dots-auto-hint-delay"
          value={autoHintDelayMs}
          className="w-full rounded border border-(--na-border) bg-(--na-surface-2) px-3 py-2 text-sm text-(--na-text) accent-(--na-cyan)"
          style={{ fontFamily: "var(--na-font-display)" }}
          onChange={(e) => updateSetting("autoHintDelayMs", Number(e.target.value))}
        >
          {AUTO_HINT_DELAY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export interface SettingsPanelProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly children?: ReactNode;
}

export function SettingsPanel({ open, onClose, children }: SettingsPanelProps) {
  const masterMuted = useAudioStore((s) => s.masterMuted);
  const sfxVolume = useAudioStore((s) => s.sfxVolume);
  const musicVolume = useAudioStore((s) => s.musicVolume);
  const setMasterMuted = useAudioStore((s) => s.setMasterMuted);
  const setSfxVolume = useAudioStore((s) => s.setSfxVolume);
  const setMusicVolume = useAudioStore((s) => s.setMusicVolume);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close settings"
            className="fixed inset-0 z-[60] cursor-pointer bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              audioManager.play("click");
              hapticManager.tap();
              onClose();
            }}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="na-settings-title"
            className="fixed top-0 right-0 z-[70] flex h-full w-full max-w-sm flex-col border-l border-(--na-border) bg-(--na-surface) shadow-(--na-glow-grid)"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          >
            <div className="flex items-center justify-between border-b border-(--na-border) px-5 py-4">
              <h2
                id="na-settings-title"
                className="text-lg font-semibold tracking-wide text-(--na-text)"
                style={{ fontFamily: "var(--na-font-display)" }}
              >
                Settings
              </h2>
              <Button
                type="button"
                unstyled
                className="rounded-lg border border-(--na-border) px-3 py-1.5 text-sm text-(--na-cyan)"
                style={{ fontFamily: "var(--na-font-display)" }}
                onClick={() => {
                  audioManager.play("click");
                  hapticManager.tap();
                  onClose();
                }}
              >
                Done
              </Button>
            </div>
            <div className="flex flex-col gap-8 overflow-y-auto px-5 py-6">
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <span
                  className="text-sm text-(--na-text-muted)"
                  style={{ fontFamily: "var(--na-font-display)" }}
                >
                  Master mute
                </span>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-(--na-cyan)"
                  checked={masterMuted}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setMasterMuted(next);
                    audioManager.play("click");
                    hapticManager.tap();
                  }}
                />
              </label>
              <div>
                <label
                  htmlFor="na-sfx-vol"
                  className="mb-2 block text-sm text-(--na-text-muted)"
                  style={{ fontFamily: "var(--na-font-display)" }}
                >
                  SFX volume
                </label>
                <input
                  id="na-sfx-vol"
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(sfxVolume * 100)}
                  className="w-full accent-(--na-cyan)"
                  onChange={(e) => {
                    const v = Number(e.target.value) / 100;
                    setSfxVolume(v);
                    audioManager.setSfxVolume(v);
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="na-music-vol"
                  className="mb-2 block text-sm text-(--na-text-muted)"
                  style={{ fontFamily: "var(--na-font-display)" }}
                >
                  Music volume
                </label>
                <input
                  id="na-music-vol"
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(musicVolume * 100)}
                  className="w-full accent-(--na-purple)"
                  onChange={(e) => {
                    const v = Number(e.target.value) / 100;
                    setMusicVolume(v);
                    audioManager.setMusicVolume(v);
                  }}
                />
              </div>
              {children}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
