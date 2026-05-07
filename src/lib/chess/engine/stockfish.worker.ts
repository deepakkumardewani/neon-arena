/**
 * Stockfish Web Worker
 *
 * This file defines the message protocol between the main thread and the
 * stockfish engine. The actual engine is loaded from /engines/stockfish.js
 * (the lite-single build served from public/) which loads its own WASM.
 *
 * The engine script sets up `onmessage` / `postMessage` for raw UCI strings.
 * This worker wraps those into typed messages.
 */

export interface WorkerPositionMsg {
  type: "position";
  fen: string;
  depth: number;
  skillLevel: number;
}

export interface WorkerNewGameMsg {
  type: "ucinewgame";
}

export interface WorkerQuitMsg {
  type: "quit";
}

export type WorkerIncoming = WorkerPositionMsg | WorkerNewGameMsg | WorkerQuitMsg;

export interface WorkerBestMoveMsg {
  type: "bestmove";
  move: string;
}

export interface WorkerReadyMsg {
  type: "ready";
}

export type WorkerOutgoing = WorkerBestMoveMsg | WorkerReadyMsg;

// ── Worker runtime ────────────────────────────────────────────────────────────
// This block only runs in the worker context (not when imported as a module).

if (typeof self !== "undefined" && typeof window === "undefined") {
  // The stockfish-18-lite-single.js engine runs as a classic sub-worker.
  // It auto-detects it's in a worker context, loads WASM from stockfish.wasm
  // (relative to its own URL), and exposes standard onmessage/postMessage UCI.
  const STOCKFISH_URL = "/engines/stockfish.js";

  let engine: Worker | null = null;
  let isReady = false;
  const pending: string[] = [];

  function sendToEngine(cmd: string) {
    if (!isReady || !engine) {
      pending.push(cmd);
      return;
    }
    engine.postMessage(cmd);
  }

  function drainPending() {
    while (pending.length > 0) {
      const cmd = pending.shift();
      if (cmd !== undefined) engine!.postMessage(cmd);
    }
  }

  engine = new Worker(STOCKFISH_URL);

  engine.onmessage = (e: MessageEvent<string>) => {
    const line = e.data;

    if (!isReady && (line === "uciok" || line.includes("readyok"))) {
      isReady = true;
      drainPending();
      // eslint-disable-next-line no-restricted-globals
      (self as unknown as { postMessage(msg: WorkerReadyMsg): void }).postMessage({
        type: "ready",
      });
      return;
    }

    if (line.startsWith("bestmove ")) {
      const parts = line.split(" ");
      const move = parts[1];
      if (move && move !== "(none)") {
        // eslint-disable-next-line no-restricted-globals
        (self as unknown as { postMessage(msg: WorkerBestMoveMsg): void }).postMessage({
          type: "bestmove",
          move,
        });
      }
    }
  };

  engine.onerror = (err) => {
    console.error("[StockfishWorker] engine error:", err);
  };

  engine.postMessage("uci");
  engine.postMessage("isready");

  // eslint-disable-next-line no-restricted-globals
  self.onmessage = (e: MessageEvent<WorkerIncoming>) => {
    const msg = e.data;
    switch (msg.type) {
      case "ucinewgame":
        sendToEngine("stop");
        sendToEngine("ucinewgame");
        break;
      case "position":
        sendToEngine("stop");
        sendToEngine(`setoption name Skill Level value ${msg.skillLevel}`);
        sendToEngine(`position fen ${msg.fen}`);
        sendToEngine(`go depth ${msg.depth}`);
        break;
      case "quit":
        engine?.postMessage("quit");
        engine?.terminate();
        self.close();
        break;
    }
  };
}
