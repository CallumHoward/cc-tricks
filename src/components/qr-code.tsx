import { encode } from "uqr";

/** Renders a QR code as a single SVG path, sized by its container */
export function QrCode({ value, className }: { value: string; className?: string }) {
  const { data, size } = encode(value, { border: 2 });
  const path = data
    .flatMap((row, y) => row.map((dark, x) => (dark ? `M${x} ${y}h1v1h-1z` : "")))
    .join("");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} shapeRendering="crispEdges">
      <title>{`QR code linking to ${value}`}</title>
      <path d={path} fill="currentColor" />
    </svg>
  );
}
