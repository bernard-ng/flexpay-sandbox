// Run: node scripts/typescript-smoke.mjs /absolute/path/to/flexpay
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const sdkPath = process.argv[2];
if (!sdkPath) throw new Error('Pass the TypeScript SDK checkout path (build its dist first).');
const { Client } = await import(pathToFileURL(resolve(sdkPath, 'dist/index.mjs')).href);
const base = process.env.FLEXPAY_SIMULATOR_URL || 'http://localhost:8080';
const client = new Client('TESTMERCHANT', 'test-token', 'dev', {
  apiBaseUrl: `${base}/api/rest/v1`,
  cardBaseUrl: `${base}/v1.1`,
});
const request = { amount: 25, reference: `ts-${Date.now()}`, currency: 'USD', callbackUrl: 'http://127.0.0.1:9000/callback', phone: '243810000001' };
const mobile = await client.mobile(request);
assert.equal(mobile.code, 0);
// Poll the simulator endpoint; SDK status parsing only supports final 0/1 states.
for (let attempt = 0; attempt < 100; attempt++) {
  const response = await fetch(`${base}/api/rest/v1/check/${mobile.orderNumber}`, { headers: { Authorization: 'Bearer test-token' } }).then(r => r.json());
  if (response.transaction.status !== '2') break;
  await new Promise(resolve => setTimeout(resolve, 100));
}
const checked = await client.check(mobile.orderNumber);
assert.equal(checked.transaction.status, 0);
assert.equal(checked.transaction.amountCustomer, 25.63);
const payout = await client.payout({ ...request, reference: `payout-${Date.now()}` });
assert.equal(payout.code, 0);
const card = await client.card({ amount: 5, reference: `card-${Date.now()}`, currency: 'USD', description: 'SDK compatibility', callbackUrl: request.callbackUrl, homeUrl: base, approveUrl: base, declineUrl: base, cancelUrl: base });
assert.equal(card.code, 0);
assert.ok(card.url.startsWith(`${base}/checkout/`));
console.log('TypeScript client: mobile, check, payout, card passed.');
