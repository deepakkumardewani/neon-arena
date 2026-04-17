import { Link } from "react-router-dom";

export function MatchmakingPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <h1 className="text-2xl text-[color:var(--na-cyan)]">Matchmaking</h1>
      <nav className="flex flex-col gap-2 text-[color:var(--na-cyan)]">
        <Link to="/play/tictactoe/nickname">Back</Link>
        <Link to="/play/tictactoe/game">Game</Link>
      </nav>
    </main>
  );
}
