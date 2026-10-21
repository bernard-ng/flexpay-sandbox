import { cloneElement, isValidElement, useId, type ReactNode } from "react";

import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function Field({
  label,
  children,
  error,
  description,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  description?: string;
}) {
  const id = useId();

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>

      {isValidElement<{
        id?: string;
        "aria-invalid"?: boolean;
        "aria-describedby"?: string;
      }>(children)
        ? cloneElement(children, {
            id,
            "aria-invalid": !!error,
            "aria-describedby": error
              ? `${id}-error`
              : description
                ? `${id}-description`
                : undefined,
          })
        : children}

      {description && (
        <p id={`${id}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function Choice({
  id,
  label,
  value,
  options,
  onChange,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: {
  id?: string;
  label?: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  return (
    <Select
      items={options.map(([value, label]) => ({ value, label }))}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
    >
      <SelectTrigger
        id={id}
        aria-label={label}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className="w-full"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export const outcomes = [
  ["success", "Success"],
  ["failure", "Failure"],
  ["pending", "Pending"],
] as const;
