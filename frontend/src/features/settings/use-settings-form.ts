import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api, type Settings } from "@/lib/api";
import { simulatorKeys } from "@/lib/queries";

import { settingsValidation } from "./rules-validation";

export function useSettingsForm(settings: Settings) {
  const client = useQueryClient();

  const mutation = useMutation({
    mutationFn: (value: Settings) =>
      api<Settings>("/api/simulator/settings", {
        method: "PUT",
        body: JSON.stringify({
          ...value,
          rules: value.rules.map((rule) => ({
            ...rule,
            value: rule.value.replace(/[\s-]/g, ""),
          })),
        }),
      }),

    onSuccess: (saved) => {
      client.setQueryData(simulatorKeys.settings, saved);
    },
  });

  const form = useForm({
    defaultValues: settings,

    validators: {
      onChange: settingsValidation,
    },

    onSubmit: async ({ value, formApi }) => {
      try {
        const saved = await mutation.mutateAsync(value);

        formApi.reset(saved);
      } catch {
        /* The editor displays mutation errors. */
      }
    },
  });

  return { form, mutation };
}

export type SettingsForm = ReturnType<typeof useSettingsForm>["form"];
