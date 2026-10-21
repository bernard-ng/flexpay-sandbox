import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, type CheckoutData } from "@/lib/api";
import { simulatorKeys } from "@/lib/queries";
import { phoneNumber, required } from "@/lib/validation";

interface CheckoutResult {
  status: number;
  redirectUrl: string | null;
  message?: string;
}

export function useCheckoutForm(id: string) {
  const client = useQueryClient();

  const mutation = useMutation({
    mutationFn: (value: { cardNumber: string; cancel: boolean }) =>
      api<CheckoutResult>(`/api/simulator/checkout/${encodeURIComponent(id)}`, {
        method: "POST",
        body: JSON.stringify(value),
      }),

    onSuccess: async (result) => {
      client.setQueryData<CheckoutData>(simulatorKeys.checkout(id), (old) =>
        old ? { ...old, status: result.status } : old,
      );
      await client.invalidateQueries({ queryKey: simulatorKeys.all });

      if (result.redirectUrl) window.location.assign(result.redirectUrl);
    },
  });

  const form = useForm({
    defaultValues: {
      cardNumber: "4242 4242 4242 4242",
      name: "Test Customer",
      expiration: "12/30",
      cvv: "123",
      phone: "243810000001",
    },

    validators: {
      onSubmit: ({ value }) => ({
        fields: {
          cardNumber: /^\d{13,19}$/.test(value.cardNumber.replace(/[\s-]/g, ""))
            ? undefined
            : "Enter 13–19 digits",
          name: required(value.name),
          expiration: /^(0[1-9]|1[0-2])\/\d{2}$/.test(value.expiration)
            ? undefined
            : "Use MM/YY",
          cvv: /^\d{3,4}$/.test(value.cvv) ? undefined : "Use 3 or 4 digits",
          phone: value.phone ? phoneNumber(value.phone) : undefined,
        },
      }),
    },

    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync({
          cardNumber: value.cardNumber,
          cancel: false,
        });
      } catch {
        /* The payment panel displays mutation errors. */
      }
    },
  });

  return { form, mutation };
}

export type CheckoutForm = ReturnType<typeof useCheckoutForm>["form"];
