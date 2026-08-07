export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="slides-kbd">{children}</kbd>;
}

export function Dot() {
  return <span className="slides-dim"> · </span>;
}
