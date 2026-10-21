export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });

  const data = await response.json();

  if (!response.ok)
    throw new Error(data.message || `Request failed (${response.status})`);

  return data;
}

export type Outcome = "success" | "failure" | "pending";

export interface Settings {
  defaultOutcome: Outcome;
  delayMs: number;
  feeBasisPoints: number;
  rules: { kind: string; value: string; outcome: Outcome }[];
}

export interface Info {
  merchant: string;
  token: string;
  publicUrl: string;
}

export interface Transaction {
  orderNumber: string;
  kind: string;
  request: {
    merchant: string;
    reference: string;
    phone?: string;
    currency: string;
    description?: string;
    callbackUrl: string;
  };
  amount: string;
  amountCustomer: string;
  status: number;
  channel: string;
  providerReference: string;
  createdAt: string;
  callbackAttempts: {
    at: string;
    status: number | null;
    error: string | null;
    payload: unknown;
  }[];
}

export const statusNames = [
  "Succeeded",
  "Failed",
  "Pending",
  "Refund pending",
  "Refunded",
  "Cancelled",
];

export interface CheckoutData {
  orderNumber: string;
  merchant: string;
  reference: string;
  amount: string;
  amountCustomer: string;
  currency: string;
  description: string;
  status: number;
}
