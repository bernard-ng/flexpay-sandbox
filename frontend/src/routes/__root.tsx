import { AppProviders } from "@/app/providers";

import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";

import styles from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FlexPay · Local sandbox" },
    ],
    links: [{ rel: "stylesheet", href: styles }],
  }),
  component: () => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>

      <body>
        <AppProviders>
          <Outlet />
        </AppProviders>

        <Scripts />
      </body>
    </html>
  ),
});
