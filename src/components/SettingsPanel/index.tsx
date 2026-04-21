import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { useAudioStore } from "@/hooks/useAudioStore";
import { audioManager } from "@/lib/audio/audioManager";
import { hapticManager } from "@/lib/haptics/hapticManager";

export interface SettingsPanelProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
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
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
