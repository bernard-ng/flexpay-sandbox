import { TextField } from "@/components/shared/form-fields";

import type { CheckoutForm } from "./use-checkout-form";

export function CardFields({ form }: { form: CheckoutForm }) {
  return (
    <div className="grid gap-5">
      <form.Field name="cardNumber">
        {(field) => (
          <TextField
            field={field}
            label="Card number"
            required
            inputMode="numeric"
            autoComplete="off"
          />
        )}
      </form.Field>

      <form.Field name="name">
        {(field) => (
          <TextField
            field={field}
            label="Name on card"
            required
            autoComplete="off"
          />
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="expiration">
          {(field) => (
            <TextField
              field={field}
              label="Expiration"
              required
              placeholder="MM/YY"
              autoComplete="off"
            />
          )}
        </form.Field>

        <form.Field name="cvv">
          {(field) => (
            <TextField
              field={field}
              label="CVV"
              type="password"
              required
              inputMode="numeric"
              autoComplete="off"
            />
          )}
        </form.Field>
      </div>

      <form.Field name="phone">
        {(field) => (
          <TextField
            field={field}
            label="Phone"
            inputMode="tel"
            autoComplete="off"
          />
        )}
      </form.Field>
    </div>
  );
}
