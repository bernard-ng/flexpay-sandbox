import { NumberField, SelectField } from "@/components/shared/form-fields";
import { outcomes } from "@/components/form-controls";
import { integerRange } from "@/lib/validation";

import type { SettingsForm } from "./use-settings-form";

export function BehaviorFields({ form }: { form: SettingsForm }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <form.Field name="defaultOutcome">
        {(field) => (
          <SelectField
            field={field}
            label="Default outcome"
            options={outcomes}
          />
        )}
      </form.Field>

      <form.Field
        name="delayMs"
        validators={{ onChange: ({ value }) => integerRange(value, 0, 60000) }}
      >
        {(field) => (
          <NumberField
            field={field}
            label="Mobile / payout delay (ms)"
            required
            min={0}
            max={60000}
          />
        )}
      </form.Field>

      <form.Field
        name="feeBasisPoints"
        validators={{ onChange: ({ value }) => integerRange(value, 0, 10000) }}
      >
        {(field) => (
          <NumberField
            field={field}
            label="Customer fee (basis points)"
            required
            min={0}
            max={10000}
          />
        )}
      </form.Field>
    </div>
  );
}
