import type { CSSProperties, ReactNode } from "react";

/**
 * Slide text that opens its show notes link in a new tab. It keeps the surrounding type and adds a
 * quiet underline; clicks never advance the talk.
 */
export function ExtLink({
  href,
  children,
  className,
  style,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className ? `talk-link ${className}` : "talk-link"}
      style={style}
    >
      {children}
    </a>
  );
}
