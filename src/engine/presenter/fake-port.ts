import type { Port } from "./channel";

/** Test double for a presenter port: records sent messages and lets the test push received ones. */
export function fakePort() {
  const listeners = new Set<(event: MessageEvent) => void>();
  const sent: unknown[] = [];
  const port: Port = {
    postMessage: (message) => sent.push(message),
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
  };
  const receive = (data: unknown) => {
    for (const listener of listeners) listener(new MessageEvent("message", { data }));
  };
  return { port, sent, receive, listeners };
}
