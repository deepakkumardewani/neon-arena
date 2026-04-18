import { Link } from "react-router-dom";

export function ModeSelectPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <h1 className="text-2xl text-(--na-purple)" style={{ fontFamily: "var(--na-font-display)" }}>
        Mode select
      </h1>
      <nav className="flex flex-col gap-2 text-(--na-cyan)">
        <Link to="/">Home</Link>
        <Link to="/play/tictactoe/nickname?mode=solo&difficulty=easy">vs AI — Easy</Link>
        <Link to="/play/tictactoe/nickname?mode=solo&difficulty=medium">vs AI — Medium</Link>
        <Link to="/play/tictactoe/nickname?mode=solo&difficulty=hard">vs AI — Hard</Link>
        <Link to="/play/tictactoe/nickname?mode=local">Local 2-player</Link>
        <Link to="/play/tictactoe/nickname?mode=online">Online — Matchmaking</Link>
      </nav>
    </main>
  );
}
