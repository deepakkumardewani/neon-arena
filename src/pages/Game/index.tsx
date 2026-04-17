import { Link, useParams } from "react-router-dom";

export function GamePage() {
  const { gameId } = useParams();

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <h1 className="text-2xl text-[color:var(--na-text)]">Game</h1>
      {gameId ? <p className="text-[color:var(--na-text-muted)]">gameId: {gameId}</p> : null}
      <nav className="flex flex-col gap-2 text-[color:var(--na-cyan)]">
        <Link to="/">Home</Link>
        <Link to="/play/tictactoe">Modes</Link>
      </nav>
    </main>
  );
}
