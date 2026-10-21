import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { Field, Choice } from "@/components/form-controls";

interface Binding<T> {
  name: string;
  state: { value: T; meta: { isTouched: boolean; errors: unknown[] } };
  handleChange: (value: T) => void;
  handleBlur: () => void;
}

function errorText(field: {
  state: { meta: { isTouched: boolean; errors: unknown[] } };
}) {
  return field.state.meta.isTouched
    ? field.state.meta.errors.map(String).join(". ")
    : undefined;
}

export function TextField({
  field,
  label,
  description,
  ...props
}: { field: Binding<string>; label: string; description?: string } & Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "onBlur"
>) {
  return (
    <Field label={label} description={description} error={errorText(field)}>
      <Input
        {...props}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
      />
    </Field>
  );
}

export function NumberField({
  field,
  label,
  ...props
}: { field: Binding<number>; label: string } & Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "onBlur"
>) {
  return (
    <Field label={label} error={errorText(field)}>
      <Input
        {...props}
        name={field.name}
        type="number"
        value={Number.isNaN(field.state.value) ? "" : field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) =>
          field.handleChange(
            event.target.value === "" ? NaN : Number(event.target.value),
          )
        }
      />
    </Field>
  );
}

export function SelectField<T extends string>({
  field,
  label,
  options,
}: {
  field: Binding<T>;
  label: string;
  options: readonly (readonly [T, string])[];
}) {
  return (
    <Field label={label} error={errorText(field)}>
      <Choice
        value={field.state.value}
        options={options}
        onChange={(value) => {
          field.handleChange(value as T);
          field.handleBlur();
        }}
      />
    </Field>
  );
}
