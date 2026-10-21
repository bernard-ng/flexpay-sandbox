import { useQuery } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LoadingPanel,
  RequestError,
  SuccessNotice,
} from "@/components/shared/feedback";
import { settingsQuery } from "@/lib/queries";
import type { Settings } from "@/lib/api";

import { useSettingsForm } from "./use-settings-form";
import { BehaviorFields } from "./behavior-fields";
import { RulesEditor } from "./rules-editor";

export function SettingsEditor() {
  const query = useQuery(settingsQuery);

  if (query.isPending) return <LoadingPanel />;

  if (query.isError)
    return (
      <RequestError error={query.error} retry={() => void query.refetch()} />
    );

  return <SettingsEditorForm settings={query.data} />;
}

function SettingsEditorForm({ settings }: { settings: Settings }) {
  const { form, mutation } = useSettingsForm(settings);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Simulation behavior</CardTitle>

          <CardDescription>
            Control payment outcomes, response timing, and customer fees.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6">
          <RequestError error={mutation.error} />

          <form.Subscribe selector={(state) => state.isDirty}>
            {(dirty) =>
              mutation.isSuccess && !dirty ? (
                <SuccessNotice>Test configuration saved</SuccessNotice>
              ) : null
            }
          </form.Subscribe>

          <fieldset disabled={mutation.isPending} className="grid gap-6">
            <BehaviorFields form={form} />

            <p className="text-xs text-muted-foreground">
              250 basis points = 2.5% customer fee. Timing applies to mobile
              payments and payouts.
            </p>

            <Separator />

            <RulesEditor form={form} />
          </fieldset>
        </CardContent>

        <CardFooter className="flex-wrap justify-between gap-3 border-t pt-4">
          <form.Subscribe selector={(state) => state.isDirty}>
            {(dirty) => (
              <span className="text-xs text-muted-foreground">
                {dirty
                  ? "You have unsaved changes"
                  : "Configuration is up to date"}
              </span>
            )}
          </form.Subscribe>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => {
                form.reset(settings);
                mutation.reset();
              }}
            >
              Discard changes
            </Button>

            <form.Subscribe
              selector={(state) =>
                [state.canSubmit, state.isSubmitting, state.isDirty] as const
              }
            >
              {([canSubmit, submitting, dirty]) => (
                <Button
                  disabled={!canSubmit || submitting || !dirty}
                  type="submit"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : <Save />}
                  Save configuration
                </Button>
              )}
            </form.Subscribe>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
