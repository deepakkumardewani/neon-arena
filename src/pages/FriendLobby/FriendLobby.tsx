import { audioManager } from "@/lib/audio/audioManager";
import { buildGameShareUrl } from "@/lib/online/gameShareUrl";
import { hapticManager } from "@/lib/haptics/hapticManager";

export interface FriendLobbyProps {
  readonly gameId: string;
}

export function FriendLobby({ gameId }: FriendLobbyProps) {
  const shareUrl =
    typeof window !== "undefined" ? buildGameShareUrl(gameId, window.location.origin) : "";

  return (
    <section className="mb-6 rounded-tl-xl rounded-br-xl border border-(--na-purple) bg-(--na-surface) p-5 shadow-(--na-glow-grid)">
      <p
        className="text-xs tracking-[0.25em] text-(--na-purple) uppercase"
        style={{ fontFamily: "var(--na-font-display)" }}
      >
        Friend lobby
      </p>
      <p
        className="mt-3 text-lg font-semibold text-(--na-cyan)"
        style={{ fontFamily: "var(--na-font-display)" }}
      >
        Waiting for friend…
      </p>
      <p className="mt-2 break-all text-sm text-(--na-text-muted)">{shareUrl}</p>
      <button
        type="button"
        className="mt-4 rounded-full border border-(--na-cyan) px-5 py-2 text-sm text-(--na-cyan)"
        style={{ fontFamily: "var(--na-font-display)" }}
        onClick={() => {
          audioManager.play("click");
          hapticManager.tap();
          void navigator.clipboard.writeText(shareUrl);
        }}
      >
        Copy link
      </button>
    </section>
  );
}
