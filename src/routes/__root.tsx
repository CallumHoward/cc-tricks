import { TanStackDevtools } from "@tanstack/react-devtools";
import { HeadContent, Scripts, createRootRoute, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import { AppShell } from "#/components/app-shell";
import { NotFound } from "#/components/not-found";
import { getThemeServerFn } from "#/lib/theme";
import { content } from "#/talk/content";

import appCss from "../styles.css?url";

/** Only the show notes page gets the site chrome; the talk and presenter are full-bleed. */
const SHELL_PATHS = new Set(["/shownotes"]);

export const Route = createRootRoute({
  // Read the theme from the cookie on the server so the shell can render the
  // correct <html> class in the initial HTML, avoiding any flash.
  loader: () => getThemeServerFn(),

  head: () => ({
    meta: [
      { charSet: "utf8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "color-scheme", content: "light dark" },
      { title: content.title },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),

  notFoundComponent: NotFound,

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const theme = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const withShell = SHELL_PATHS.has(pathname);

  return (
    <html lang="en" className={theme}>
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col items-center">
        {withShell ? <AppShell theme={theme}>{children}</AppShell> : children}
        <ShellOnly show={withShell}>
          <TanStackDevtools
            config={{ position: "bottom-right" }}
            plugins={[{ name: "Tanstack Router", render: <TanStackRouterDevtoolsPanel /> }]}
          />
        </ShellOnly>
        <Scripts />
      </body>
    </html>
  );
}

// The devtools plugin strips <TanStackDevtools/> from builds, so it must sit in plain children
function ShellOnly({ show, children }: { show: boolean; children?: React.ReactNode }) {
  return show ? children : null;
}
