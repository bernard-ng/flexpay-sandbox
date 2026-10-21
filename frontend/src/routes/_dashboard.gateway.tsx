import { createFileRoute } from "@tanstack/react-router";

import { GatewayPage } from "@/pages/gateway-page";

export const Route = createFileRoute("/_dashboard/gateway")({
  component: GatewayPage,
});
