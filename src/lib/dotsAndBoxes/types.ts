export type PlayerId = 1 | 2;

export type EdgeOrientation = "horizontal" | "vertical";

export interface EdgeRef {
  readonly orientation: EdgeOrientation;
  readonly row: number;
  readonly col: number;
}

export interface DotsMove {
  readonly edge: EdgeRef;
  readonly player: PlayerId;
}

export interface BoxRef {
  readonly row: number;
  readonly col: number;
}

export type DotsStatus = "idle" | "playing" | "finished";

export interface BoardSize {
  readonly rows: 3 | 4 | 5;
  readonly cols: 3 | 4 | 5;
}

export interface DotsGameState {
  readonly horizontalEdges: ReadonlyArray<ReadonlyArray<boolean>>;
  readonly verticalEdges: ReadonlyArray<ReadonlyArray<boolean>>;
  readonly boxOwner: ReadonlyArray<ReadonlyArray<PlayerId | null>>;
  readonly currentPlayer: PlayerId;
  readonly status: DotsStatus;
  readonly winner: PlayerId | "draw" | null;
  readonly scores: { readonly 1: number; readonly 2: number };
  readonly hintTokens: number;
  readonly history: readonly DotsMove[];
  readonly hoveredEdge: EdgeRef | null;
  readonly hintEdge: EdgeRef | null;
  readonly lastClaimedBoxes: readonly BoxRef[];
  readonly size: BoardSize;
}

export interface DotsSettings {
  readonly defaultSize: BoardSize;
  readonly showLastMove: boolean;
  readonly allowUndo: boolean;
  readonly hintsEnabled: boolean;
  readonly autoHintDelayMs: number;
  readonly animationSpeedMs: number;
}
