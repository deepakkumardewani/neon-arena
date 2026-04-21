import { useCallback } from "react";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast";
import { audioManager } from "@/lib/audio/audioManager";
import { buildGameShareUrl } from "@/lib/online/gameShareUrl";
import { hapticManager } from "@/lib/haptics/hapticManager";

export interface FriendLobbyProps {
  readonly gameId: string;
  /** Leave the lobby and return to the main menu (shown top-right in the card header). */
  readonly onHome: () => void;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText !== undefined) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function FriendLobby({ gameId, onHome }: FriendLobbyProps) {
  const toast = useToast();
  const shareUrl =
    typeof window !== "undefined" ? buildGameShareUrl(gameId, window.location.origin) : "";

  const handleCopy = useCallback(() => {
    audioManager.play("click");
    hapticManager.tap();
    void copyTextToClipboard(shareUrl).then((ok) => {
      if (ok) {
        toast.success("Link copied!");
        return;
      }
      window.prompt("Copy this link:", shareUrl);
    });
  }, [shareUrl, toast]);

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className="text-xs tracking-[0.25em] text-(--na-purple) uppercase"
          style={{ fontFamily: "var(--na-font-display)" }}
        >
          Friend lobby
        </p>
        <Button
          type="button"
          tone="surface"
          className="shrink-0 px-4"
          style={{ fontFamily: "var(--na-font-display)" }}
          onClick={onHome}
        >
          Home
        </Button>
      </div>
      <p
        className="mt-3 text-lg font-semibold text-(--na-cyan)"
        style={{ fontFamily: "var(--na-font-display)" }}
      >
        Waiting for friend…
      </p>
      <p
        className="mt-3 break-all text-sm leading-relaxed text-(--na-text)"
        style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
      >
        {shareUrl}
      </p>
      <Button
        type="button"
        className="mt-4"
        style={{ fontFamily: "var(--na-font-display)" }}
        onClick={handleCopy}
      >
        Copy link
      </Button>
    </div>
  );
}
