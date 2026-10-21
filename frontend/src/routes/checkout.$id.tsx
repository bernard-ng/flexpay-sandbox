import { createFileRoute } from "@tanstack/react-router";

import { CheckoutPage } from "@/pages/checkout-page";

export const Route = createFileRoute("/checkout/$id")({
  component: () => <CheckoutPage id={Route.useParams().id} />,
});
