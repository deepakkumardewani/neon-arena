import { Link } from "react-router-dom";

export function ModeSelectPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <h1 className="text-2xl text-[color:var(--na-purple)]">Mode select</h1>
      <nav className="flex flex-col gap-2 text-[color:var(--na-cyan)]">
        <Link to="/">Home</Link>
        <Link to="/play/tictactoe/nickname">Nickname</Link>
        <Link to="/play/tictactoe/game?mode=solo&difficulty=easy">vs AI — Easy</Link>
        <Link to="/play/tictactoe/game?mode=solo&difficulty=medium">vs AI — Medium</Link>
        <Link to="/play/tictactoe/game?mode=solo&difficulty=hard">vs AI — Hard</Link>
        <Link to="/play/tictactoe/game?mode=local">Local 2-player</Link>
      </nav>
    </main>
  );
}
