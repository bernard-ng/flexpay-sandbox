import type { Settings } from "@/lib/api";

export function validateRules(rules: Settings["rules"]) {
  const seen = new Set<string>();

  for (const rule of rules) {
    const normalized = rule.value.replace(/[\s-]/g, "");

    if (!(rule.kind === "phone" ? /^\d{12}$/ : /^\d{13,19}$/).test(normalized))
      return "Use 12 digits for phones and 13–19 digits for cards.";

    const key = `${rule.kind}:${normalized}`;

    if (seen.has(key))
      return "Each test number must be unique within its payment method.";

    seen.add(key);
  }

  return undefined;
}

export function settingsValidation({ value }: { value: Settings }) {
  return { fields: { rules: validateRules(value.rules) } };
}
