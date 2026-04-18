import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <h1 className="text-2xl text-(--na-cyan)" style={{ fontFamily: "var(--na-font-display)" }}>
        Home
      </h1>
      <p className="text-(--na-text-muted)">NeonArena portal stub.</p>
      <nav className="flex flex-col gap-2 text-(--na-cyan)">
        <Link to="/play/tictactoe">Mode select</Link>
      </nav>
    </main>
  );
}
