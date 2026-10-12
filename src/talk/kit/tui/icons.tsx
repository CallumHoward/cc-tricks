import { GLYPH_PATHS, type SpinnerGlyph } from "./glyph-data";

/** TUI glyphs the shipped mono subsets lack, drawn as SVG in one monospace cell. */
export function Chevron() {
  return (
    <svg className="tui-cell" viewBox="0 0 60 120" aria-hidden>
      <path d="M12 34 L46 60 L12 86" fill="none" stroke="currentColor" strokeWidth="12" />
    </svg>
  );
}

export function ToolDot() {
  return (
    <svg className="tui-cell" viewBox="0 0 60 120" aria-hidden>
      <circle cx="30" cy="62" r="15" fill="currentColor" />
    </svg>
  );
}

export function Bullet({ filled }: { filled: boolean }) {
  return (
    <svg className="tui-cell" viewBox="0 0 60 120" aria-hidden>
      <circle
        cx="30"
        cy="62"
        r={filled ? 16 : 14}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 5}
      />
    </svg>
  );
}

export function ReturnGlyph() {
  return (
    <svg className="tui-cell" viewBox="0 0 60 120" aria-hidden>
      <path
        d="M50 36 V70 H12 M28 54 L12 70 L28 86"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A static spinner glyph (two cells wide, like Claude Code reserves). */
export function StaticGlyph({ glyph }: { glyph: SpinnerGlyph }) {
  return (
    <svg className="tui-cell tui-cell--wide" viewBox="0 0 100 100" aria-hidden>
      <path d={GLYPH_PATHS[glyph]} fill="currentColor" />
    </svg>
  );
}
