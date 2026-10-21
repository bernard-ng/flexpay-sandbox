export function required(value: string) {
  return value.trim() ? undefined : "This field is required";
}

export function httpUrl(value: string) {
  try {
    const url = new URL(value);

    if (["http:", "https:"].includes(url.protocol) && url.hostname)
      return undefined;
  } catch {}

  return "Enter a valid http or https URL";
}

export function paymentAmount(value: string) {
  return /^\d+(\.\d{1,2})?$/.test(value) && Number(value) > 0
    ? undefined
    : "Enter an amount above zero with up to two decimal places";
}

export function phoneNumber(value: string) {
  return /^\d{12}$/.test(value)
    ? undefined
    : "Enter 12 digits, including the country code";
}

export function integerRange(value: number, min: number, max: number) {
  return Number.isInteger(value) && value >= min && value <= max
    ? undefined
    : `Enter a whole number from ${min} to ${max}`;
}
