import { PageHeading } from "@/components/shared/page-heading";
import { GatewayWorkspace } from "@/features/gateway/gateway-workspace";
import { TestValues } from "@/features/gateway/test-values";

export function GatewayPage() {
  return (
    <>
      <PageHeading
        eyebrow="Integration tools"
        title="Gateway simulator"
        description="Create mobile payments, card checkouts, and payouts without leaving the sandbox."
      />

      <GatewayWorkspace />

      <TestValues />
    </>
  );
}
