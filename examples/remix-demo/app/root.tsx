import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useMatches,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import type { DehydratedState } from "@mfestack/core";
import "./root.css";
import { QueryClientProviderWrapper } from "./lib/clientUtils";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "./root.css" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  // Get dehydrated state from route matches
  // Each route loader can provide dehydratedState
  const matches = useMatches();
  const dehydratedState = (matches.find((m: any) => m.data?.dehydratedState)?.data as any)?.dehydratedState as DehydratedState | undefined;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Inject dehydrated state into window for hydration */}
        {dehydratedState && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__MFESTACK_STATE__ = ${JSON.stringify(dehydratedState)}`,
            }}
          />
        )}
      </head>
      <body>
        <QueryClientProviderWrapper dehydratedState={dehydratedState}>
          {children}
        </QueryClientProviderWrapper>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
