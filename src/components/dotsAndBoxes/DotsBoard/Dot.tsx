export function Dot() {
  return (
    <div
      className="rounded-full"
      style={{
        width: "clamp(6px, 1.8vw, 8px)",
        height: "clamp(6px, 1.8vw, 8px)",
        background: "var(--na-fg)",
        position: "relative",
        zIndex: 10,
        flexShrink: 0,
      }}
    />
  );
}
