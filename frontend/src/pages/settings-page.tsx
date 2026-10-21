import { PageHeading } from "@/components/shared/page-heading";
import { ApiConnection } from "@/features/settings/api-connection";
import { SettingsEditor } from "@/features/settings/settings-editor";

export function SettingsPage() {
  return (
    <>
      <PageHeading
        eyebrow="Sandbox settings"
        title="Test configuration"
        description="Connect your integration and decide how each test payment should behave."
      />

      <SettingsEditor />

      <ApiConnection />
    </>
  );
}
