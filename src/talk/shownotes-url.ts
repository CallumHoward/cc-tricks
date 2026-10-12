/** The talk's shownotes in Notion, readable by Checkbox staff on their phones. */
export const NOTION_SHOWNOTES =
  "https://app.notion.com/p/10-tips-for-saving-tokens-3f68183ab6f680e8970ff91270e16590";

/** Where the outro QR points: `VITE_SHOWNOTES_URL` when the site is hosted, otherwise Notion. */
export function shownotesUrl(override?: string): string {
  return override && /^https?:\/\//.test(override) ? override : NOTION_SHOWNOTES;
}

/** Short caption printed under the QR. */
export function shownotesLabel(url: string): string {
  const { host, pathname } = new URL(url);
  return host === "app.notion.com" ? "Notion · 10 tips for saving tokens" : `${host}${pathname}`;
}

// Optional chaining keeps this safe in the Remotion (webpack) bundle, which has no import.meta.env
export const SHOWNOTES_URL = shownotesUrl(
  import.meta.env?.VITE_SHOWNOTES_URL as string | undefined,
);
