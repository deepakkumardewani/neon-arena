import { Howl, Howler } from "howler";

import { useAudioStore } from "@/hooks/useAudioStore";

export type SfxId = "place" | "win" | "lose" | "draw" | "click";
export type MusicId = "bg-home" | "bg-game";

const CROSSFADE_MS = 500;

const sfxPaths: Record<SfxId, string> = {
  place: "/audio/place.mp3",
  win: "/audio/win.mp3",
  lose: "/audio/lose.mp3",
  draw: "/audio/draw.mp3",
  click: "/audio/click.mp3",
};

const musicPaths: Record<MusicId, string> = {
  "bg-home": "/audio/bg-home.mp3",
  "bg-game": "/audio/bg-game.mp3",
};

let initialized = false;
let gestureListenersAttached = false;
let sfxBank: Record<SfxId, Howl> | null = null;
let musicBank: Record<MusicId, Howl> | null = null;
let activeMusicId: MusicId | null = null;
let pendingMusicId: MusicId | null = "bg-home";

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function sfxVolumeEffective(): number {
  const s = useAudioStore.getState();
  if (s.masterMuted) return 0;
  return clamp01(s.sfxVolume);
}

function musicVolumeEffective(): number {
  const s = useAudioStore.getState();
  if (s.masterMuted) return 0;
  return clamp01(s.musicVolume);
}

function applySfxVolumes(): void {
  if (sfxBank === null) return;
  const v = sfxVolumeEffective();
  for (const howl of Object.values(sfxBank)) {
    howl.volume(v);
  }
}

function applyActiveMusicVolume(): void {
  if (musicBank === null || activeMusicId === null) return;
  const howl = musicBank[activeMusicId];
  if (howl.playing()) howl.volume(musicVolumeEffective());
}

function buildBanks(): void {
  const s = useAudioStore.getState();
  Howler.mute(s.masterMuted);

  sfxBank = {
    place: new Howl({ src: [sfxPaths.place], volume: sfxVolumeEffective(), preload: true }),
    win: new Howl({ src: [sfxPaths.win], volume: sfxVolumeEffective(), preload: true }),
    lose: new Howl({ src: [sfxPaths.lose], volume: sfxVolumeEffective(), preload: true }),
    draw: new Howl({ src: [sfxPaths.draw], volume: sfxVolumeEffective(), preload: true }),
    click: new Howl({ src: [sfxPaths.click], volume: sfxVolumeEffective(), preload: true }),
  };

  musicBank = {
    "bg-home": new Howl({
      src: [musicPaths["bg-home"]],
      loop: true,
      volume: 0,
      preload: true,
      html5: true,
    }),
    "bg-game": new Howl({
      src: [musicPaths["bg-game"]],
      loop: true,
      volume: 0,
      preload: true,
      html5: true,
    }),
  };
}

function internalPlayMusic(id: MusicId, useCrossfade: boolean): void {
  if (musicBank === null) return;

  const next = musicBank[id];
  const vol = musicVolumeEffective();
  const prevId = activeMusicId;
  const prevHowl = prevId !== null ? musicBank[prevId] : null;
  const hadPlaying =
    useCrossfade && prevHowl !== null && prevId !== id && prevHowl.playing() && vol > 0;

  if (prevHowl !== null && prevId !== id) {
    if (hadPlaying) {
      const fromVol = prevHowl.volume();
      prevHowl.fade(fromVol, 0, CROSSFADE_MS);
      prevHowl.once("fade", () => {
        prevHowl.stop();
      });
    } else {
      prevHowl.stop();
    }
  }

  activeMusicId = id;
  next.stop();

  if (hadPlaying) {
    next.volume(0);
    next.play();
    next.fade(0, vol, CROSSFADE_MS);
  } else {
    next.volume(vol);
    next.play();
  }
}

function initOnFirstGesture(): void {
  if (initialized) return;
  initialized = true;
  void Howler.ctx?.resume();
  buildBanks();

  applySfxVolumes();

  useAudioStore.subscribe((state, prev) => {
    if (prev === undefined) return;
    if (state.masterMuted !== prev.masterMuted) {
      Howler.mute(state.masterMuted);
      applySfxVolumes();
      applyActiveMusicVolume();
    }
    if (state.sfxVolume !== prev.sfxVolume) {
      applySfxVolumes();
    }
    if (state.musicVolume !== prev.musicVolume) {
      applyActiveMusicVolume();
    }
  });

  if (pendingMusicId !== null) {
    const id = pendingMusicId;
    pendingMusicId = null;
    internalPlayMusic(id, false);
  }
}

/** Register listeners so the Howl singleton loads after the first user gesture (autoplay policy). */
export function primeAudioGestureUnlock(): void {
  if (gestureListenersAttached) return;
  gestureListenersAttached = true;

  const onGesture = (): void => {
    window.removeEventListener("pointerdown", onGesture, true);
    window.removeEventListener("keydown", onGesture, true);
    initOnFirstGesture();
  };

  window.addEventListener("pointerdown", onGesture, { capture: true });
  window.addEventListener("keydown", onGesture, { capture: true });
}

export const audioManager = {
  prime: primeAudioGestureUnlock,

  play(id: SfxId): void {
    if (!initialized || sfxBank === null) return;
    const howl = sfxBank[id];
    howl.stop();
    howl.volume(sfxVolumeEffective());
    howl.play();
  },

  playMusic(id: MusicId): void {
    if (!initialized) {
      pendingMusicId = id;
      return;
    }
    if (musicBank === null) return;
    if (activeMusicId === id) {
      const h = musicBank[id];
      if (h.playing()) {
        h.volume(musicVolumeEffective());
        return;
      }
    }
    internalPlayMusic(id, true);
  },

  setMuted(muted: boolean): void {
    useAudioStore.getState().setMasterMuted(muted);
    if (initialized) {
      Howler.mute(muted);
      applySfxVolumes();
      applyActiveMusicVolume();
    }
  },

  setSfxVolume(volume: number): void {
    useAudioStore.getState().setSfxVolume(clamp01(volume));
    if (initialized) applySfxVolumes();
  },

  setMusicVolume(volume: number): void {
    useAudioStore.getState().setMusicVolume(clamp01(volume));
    if (initialized) applyActiveMusicVolume();
  },
};
