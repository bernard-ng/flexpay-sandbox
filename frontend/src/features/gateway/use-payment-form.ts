import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, type Info } from "@/lib/api";
import { simulatorKeys } from "@/lib/queries";
import {
  httpUrl,
  paymentAmount,
  phoneNumber,
  required,
} from "@/lib/validation";

import { paymentRequest, type PaymentValues } from "./payment-request";

export function usePaymentForm(info: Info) {
  const client = useQueryClient();

  const [defaultValues] = useState<PaymentValues>(() => ({
    kind: "mobile",
    amount: "25.00",
    currency: "USD",
    reference: `test-${Date.now().toString().slice(-8)}`,
    phone: "243810000001",
    callbackUrl: "http://localhost:9000/callback",
    returnUrl: info.publicUrl,
  }));

  const mutation = useMutation({
    mutationFn: (value: PaymentValues) =>
      api<Record<string, unknown>>(
        value.kind === "card"
          ? "/v1.1/pay"
          : `/api/rest/v1/${value.kind === "payout" ? "merchantPayOutService" : "paymentService"}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${info.token}` },
          body: JSON.stringify(paymentRequest(value, info)),
        },
      ),

    onSuccess: () =>
      client.invalidateQueries({ queryKey: simulatorKeys.transactions }),
  });

  const form = useForm({
    defaultValues,

    validators: {
      onSubmit: ({ value }) => ({
        fields: {
          amount: paymentAmount(value.amount),
          reference:
            required(value.reference) ||
            (value.kind === "card" && value.reference.length > 25
              ? "Card references can have at most 25 characters"
              : undefined),
          callbackUrl: httpUrl(value.callbackUrl),
          ...(value.kind === "card"
            ? { returnUrl: httpUrl(value.returnUrl) }
            : { phone: phoneNumber(value.phone) }),
        },
      }),
    },

    onSubmit: async ({ value, formApi }) => {
      try {
        await mutation.mutateAsync(value);
        formApi.setFieldValue(
          "reference",
          `test-${Date.now().toString().slice(-8)}`,
        );
      } catch {
        /* The response panel displays mutation errors. */
      }
    },
  });

  return { form, mutation };
}

export type PaymentForm = ReturnType<typeof usePaymentForm>["form"];
