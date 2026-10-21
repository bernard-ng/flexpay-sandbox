import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/shared/form-fields";
import { outcomes } from "@/components/form-controls";
import { required } from "@/lib/validation";

import type { SettingsForm } from "./use-settings-form";

export function RulesEditor({ form }: { form: SettingsForm }) {
  return (
    <form.Field name="rules" mode="array">
      {(array) => (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium">Test numbers and cards</h3>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Exact matches override the default outcome. Use a unique number
                for each method.
              </p>
            </div>

            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() =>
                array.pushValue({
                  kind: "phone",
                  value: "",
                  outcome: "success",
                })
              }
            >
              <Plus />
              Add rule
            </Button>
          </div>

          {array.state.value.length === 0 && (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No rules yet. All payments will use the default outcome.
            </p>
          )}

          {array.state.value.map((_, index) => (
            <div
              key={index}
              className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2 xl:grid-cols-[150px_1fr_150px_auto]"
            >
              <form.Field name={`rules[${index}].kind`}>
                {(field) => (
                  <SelectField
                    field={field}
                    label={`Rule ${index + 1} method`}
                    options={[
                      ["phone", "Mobile phone"],
                      ["card", "Card"],
                    ]}
                  />
                )}
              </form.Field>

              <form.Field
                name={`rules[${index}].value`}
                validators={{ onChange: ({ value }) => required(value) }}
              >
                {(field) => (
                  <TextField
                    field={field}
                    label={`Rule ${index + 1} number`}
                    required
                    inputMode="numeric"
                  />
                )}
              </form.Field>

              <form.Field name={`rules[${index}].outcome`}>
                {(field) => (
                  <SelectField
                    field={field}
                    label={`Rule ${index + 1} outcome`}
                    options={outcomes}
                  />
                )}
              </form.Field>

              <Button
                className="self-end"
                size="icon"
                variant="ghost"
                type="button"
                aria-label={`Remove rule ${index + 1}`}
                onClick={() => array.removeValue(index)}
              >
                <Trash2 />
              </Button>
            </div>
          ))}

          {array.state.meta.errors.length > 0 && (
            <p role="alert" className="text-sm text-destructive">
              {array.state.meta.errors.map(String).join(". ")}
            </p>
          )}
        </section>
      )}
    </form.Field>
  );
}
