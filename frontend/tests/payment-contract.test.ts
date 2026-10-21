import { describe, expect, test } from "bun:test";

import {
  paymentRequest,
  type PaymentValues,
} from "../src/features/gateway/payment-request";

import { FormApi, FieldApi } from "@tanstack/react-form";

import type { Settings } from "../src/lib/api";
import {
  settingsValidation,
  validateRules,
} from "../src/features/settings/rules-validation";
import { paymentAmount, httpUrl, integerRange } from "../src/lib/validation";

const info = {
  merchant: "TESTMERCHANT",
  token: "test-token",
  publicUrl: "http://localhost:8080",
};

const values: PaymentValues = {
  kind: "mobile",
  amount: "25.00",
  currency: "USD",
  reference: "test-reference",
  phone: "243810000001",
  callbackUrl: "http://localhost:9000/callback",
  returnUrl: info.publicUrl,
};

describe("gateway contract", () => {
  test("mobile and payout preserve decimal strings and omit card fields", () => {
    for (const kind of ["mobile", "payout"] as const) {
      const body = paymentRequest({ ...values, kind }, info);

      expect(body).toMatchObject({
        merchant: "TESTMERCHANT",
        amount: "25.00",
        phone: values.phone,
        type: 1,
        callbackUrl: values.callbackUrl,
      });
      expect(body).not.toHaveProperty("authorization");
      expect(body).not.toHaveProperty("approveUrl");
    }
  });
  test("cards include body authorization and all return URLs, and omit phone", () => {
    const body = paymentRequest({ ...values, kind: "card" }, info);

    expect(body).toMatchObject({
      authorization: "Bearer test-token",
      approveUrl: values.returnUrl,
      declineUrl: values.returnUrl,
      cancelUrl: values.returnUrl,
      homeUrl: values.returnUrl,
    });
    expect(body).not.toHaveProperty("phone");
  });
});

describe("configuration validation", () => {
  test("recognizes duplicate numbers after removing display formatting", () => {
    expect(
      validateRules([
        { kind: "card", value: "4242 4242 4242 4242", outcome: "success" },
        { kind: "card", value: "4242-4242-4242-4242", outcome: "failure" },
      ]),
    ).toContain("unique");
  });
  test("validates phone/card lengths and accepts valid rules", () => {
    expect(
      validateRules([{ kind: "phone", value: "123", outcome: "success" }]),
    ).toBeDefined();
    expect(
      validateRules([
        { kind: "phone", value: "243810000001", outcome: "success" },
        { kind: "card", value: "4242 4242 4242 4242", outcome: "pending" },
      ]),
    ).toBeUndefined();
  });
  test("rejects zero, negative, exponent, and excess precision amounts", () => {
    for (const value of ["0", "-1", "1e2", "1.001", "NaN", ""])
      expect(paymentAmount(value)).toBeDefined();

    for (const value of ["0.01", "25", "25.00"])
      expect(paymentAmount(value)).toBeUndefined();
  });
  test("rejects non-http callbacks and out-of-range configuration values", () => {
    expect(httpUrl("javascript:alert(1)")).toBeDefined();
    expect(httpUrl("http://localhost:9000/callback")).toBeUndefined();

    for (const value of [NaN, -1, 60001, 1.5])
      expect(integerRange(value, 0, 60000)).toBeDefined();

    expect(integerRange(60000, 0, 60000)).toBeUndefined();
  });
});

test("editing an individual rule updates array validation and blocks submission", async () => {
  const settings: Settings = {
    defaultOutcome: "success",
    delayMs: 1500,
    feeBasisPoints: 250,
    rules: [
      { kind: "phone", value: "243810000001", outcome: "success" },
      { kind: "phone", value: "243810000002", outcome: "failure" },
    ],
  };

  const form = new FormApi({
    defaultValues: settings,

    validators: { onChange: settingsValidation },
  });

  const unmountForm = form.mount();
  const rules = new FieldApi({ form, name: "rules" });
  const unmountRules = rules.mount();
  const number = new FieldApi({ form, name: "rules[1].value" });
  const unmountNumber = number.mount();

  try {
    number.setValue("243810000001");
    expect(rules.state.meta.errors.join(" ")).toContain("unique");
    expect(form.state.canSubmit).toBe(false);
    number.setValue("243810000002");
    expect(rules.state.meta.errors).toEqual([]);
    expect(form.state.canSubmit).toBe(true);
  } finally {
    unmountNumber();
    unmountRules();
    unmountForm();
  }
});
