import { CreditCard, Smartphone, ArrowUpRight } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextField, SelectField } from "@/components/shared/form-fields";
import {
  httpUrl,
  paymentAmount,
  phoneNumber,
  required,
} from "@/lib/validation";

import type { PaymentForm } from "./use-payment-form";
import type { PaymentKind } from "./payment-request";

export function PaymentFields({
  form,
  onMethodChange,
}: {
  form: PaymentForm;
  onMethodChange: () => void;
}) {
  return (
    <div className="grid gap-5">
      <form.Field name="kind">
        {(field) => (
          <Tabs
            value={field.state.value}
            onValueChange={(value) => {
              field.handleChange(value as PaymentKind);
              onMethodChange();
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="mobile">
                <Smartphone />
                Mobile money
              </TabsTrigger>
              <TabsTrigger value="card">
                <CreditCard />
                Card
              </TabsTrigger>
              <TabsTrigger value="payout">
                <ArrowUpRight />
                Payout
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="amount"
          validators={{ onChange: ({ value }) => paymentAmount(value) }}
        >
          {(field) => (
            <TextField
              field={field}
              label="Amount"
              required
              inputMode="decimal"
            />
          )}
        </form.Field>

        <form.Field name="currency">
          {(field) => (
            <SelectField
              field={field}
              label="Currency"
              options={[
                ["USD", "USD"],
                ["CDF", "CDF"],
              ]}
            />
          )}
        </form.Field>
      </div>

      <form.Field
        name="reference"
        validators={{ onChange: ({ value }) => required(value) }}
      >
        {(field) => (
          <TextField field={field} label="Payment reference" required />
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.kind}>
        {(kind) =>
          kind !== "card" ? (
            <form.Field
              name="phone"
              validators={{ onChange: ({ value }) => phoneNumber(value) }}
            >
              {(field) => (
                <TextField
                  field={field}
                  label="Mobile phone"
                  inputMode="tel"
                  required
                  description="12 digits, including the country code."
                />
              )}
            </form.Field>
          ) : null
        }
      </form.Subscribe>

      <form.Field
        name="callbackUrl"
        validators={{ onChange: ({ value }) => httpUrl(value) }}
      >
        {(field) => (
          <TextField
            field={field}
            label="Callback URL"
            type="url"
            required
            description="The simulator sends the final payment outcome here."
          />
        )}
      </form.Field>

      <form.Subscribe selector={(state) => state.values.kind}>
        {(kind) =>
          kind === "card" ? (
            <form.Field
              name="returnUrl"
              validators={{ onChange: ({ value }) => httpUrl(value) }}
            >
              {(field) => (
                <TextField
                  field={field}
                  label="Return URL"
                  type="url"
                  required
                  description="Used for approved, declined, and cancelled checkouts."
                />
              )}
            </form.Field>
          ) : null
        }
      </form.Subscribe>
    </div>
  );
}
