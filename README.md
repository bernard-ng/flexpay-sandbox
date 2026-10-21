# FlexPay Sandbox

A small local FlexPay simulator for integration development: Rust/Axum API, SQLite transaction history, and a React + TanStack Start SPA dashboard with official shadcn/ui components built on Base UI (Nova preset). It implements the mobile and payout contracts from the supplied FlexPay v1.5 documentation and the card contract used by the `ngandu-dev/flexpay` TypeScript and PHP clients. It never forwards payments to FlexPay.

## Run

Install Docker with Compose v2.32+ (Docker Desktop includes it). From the repository root:

```sh
docker compose up
```

Open **http://localhost:8080**. Compose builds both projects: the frontend runs Vite, which serves the dashboard and proxies API requests to the Rust backend. Rust, Node, and Bun are installed inside the images; no local toolchains or setup command are needed.

SQLite data is stored in the `sandbox-data` named volume and survives container restarts and `docker compose down`. The dashboard's reset action clears transactions while keeping your test configuration.

### Watch source changes

```sh
docker compose up --watch
```

Frontend changes under `frontend/src/` are synced into the container for hot reload. Rust changes under `backend/src/` rebuild and restart the backend. Dependency manifests, lockfiles, Dockerfiles, and frontend build configuration also trigger rebuilds. Backend rebuilds keep the same SQLite volume.

After editing source without watch mode, use `docker compose up --build` to rebuild the images. Stop the stack with `docker compose down`.

### Configuration

No `.env` file is required. To customize the sandbox, copy `.env.example` to `.env` and edit the values:

| Setting | Default |
| --- | --- |
| Frontend port (`FLEXPAY_PORT`) | `8080` |
| Public URL (`FLEXPAY_PUBLIC_URL`) | `http://localhost:8080` |
| Merchant (`FLEXPAY_MERCHANT`) | `TESTMERCHANT` |
| Bearer token (`FLEXPAY_TOKEN`) | `test-token` |
| Log filter (`RUST_LOG`) | `flexpay_sandbox=info` |

The public URL is used for generated checkout links. Update it when changing the published port or hostname. Compose sets the backend bind address, database path, and frontend proxy target for the container network.

### Native development (optional)

For development outside Docker, install Rust 1.88+, Node 24+, and Bun 1.4.2+:

```sh
bun install --cwd frontend --frozen-lockfile
bun run --cwd frontend build
cargo run --manifest-path backend/Cargo.toml
```

The native backend serves the built frontend and uses `data/flexpay.db`, separate from the Docker volume. For frontend hot reload, run `bun run --cwd frontend dev` in another terminal and open http://localhost:3000. Set `FLEXPAY_PUBLIC_URL=http://localhost:3000` for checkout links, and use `FLEXPAY_API_URL` to override Vite's default proxy target of `http://127.0.0.1:8080`.

## Test a payment

```sh
curl http://localhost:8080/api/rest/v1/paymentService \
  -H 'Authorization: Bearer test-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "merchant": "TESTMERCHANT",
    "type": "1",
    "reference": "order-001",
    "phone": "243810000001",
    "amount": "25.00",
    "currency": "USD",
    "callbackUrl": "http://host.docker.internal:9000/callback"
  }'
```

The immediate response has `code: "0"` and an `orderNumber`. This means the request was accepted, not that the payment succeeded. Check its final result:

```sh
curl http://localhost:8080/api/rest/v1/check/ORDER_NUMBER \
  -H 'Authorization: Bearer test-token'
```

The **Gateway simulator** screen can create mobile payments, card checkouts, and payouts without writing a request. The **Transactions** screen refreshes every two seconds, supports search and status filters, and opens transaction details with callback payloads and delivery results. Pending payments can be marked successful, failed, or cancelled. Successful payments can move through refund pending to refunded.

### Default test values

| Method | Value | Result |
| --- | --- | --- |
| Phone | `243810000001` | Success |
| Phone | `243810000002` | Failure |
| Phone | `243810000003` | Pending until manually resolved |
| Card | `4242424242424242` | Success |
| Card | `4000000000000002` | Failure |
| Card | `4000000000003220` | Pending until manually resolved |

Configure exact phone/card values, the default result for unmatched values, a mobile/payout delay (default 1500ms), and the simulated customer fee (default 250 basis points = 2.5%) in **Test configuration**. The first matching rule wins; duplicate rules are rejected. Phone rules apply to both mobile collections and payouts. Card rules are evaluated when the hosted checkout is submitted. Mobile/payout behavior is captured when the request is accepted.

Amounts use integer minor units internally, accept JSON numbers or decimal strings, and support up to two decimal places. Customer fees round half up to the nearest minor unit. The fee is configurable simulation behavior, not a guarantee about FlexPay's real fees.

## API compatibility

| Method | Path | Behavior |
| --- | --- | --- |
| POST | `/api/rest/v1/paymentService` | Accept mobile payment, return order number, then resolve and callback |
| POST | `/api/rest/v1/merchantPayOutService` | Same lifecycle for mobile payout |
| GET | `/api/rest/v1/check/{orderNumber}` | Return transaction, or `code: "1", transaction: null` if absent |
| POST | `/v1.1/pay` | Create card transaction and return local hosted checkout URL |

All payment/check endpoints require the configured Bearer token; payment creation also validates the merchant. Card requests additionally support the Bearer `authorization` body field used by the SDKs (including body-only authentication). Both `callbackUrl`/`approveUrl`/`cancelUrl`/`declineUrl`/`homeUrl` and their snake_case forms are accepted. Mobile/payout `type` accepts `1` or `"1"`.

Card requests require `merchant`, `authorization` (or HTTP auth), `reference` (1–25 characters), `amount`, `currency`, `description`, and the five callback/return URLs. `POST /v1.1/pay` returns `code: 0`, `message`, `orderNumber`, and `url`. The local checkout evaluates the configured card outcome and redirects to `approveUrl`, `declineUrl`, or `cancelUrl`. Return URLs are used unchanged. Card numbers are used only to match rules; transaction records never retain submitted card numbers or Bearer tokens. Checkout name, expiration, CVV, and phone fields are UI-only test fields and are not submitted or stored.

Status codes follow the PDF:

| `transaction.status` | Meaning |
| --- | --- |
| `"0"` | Successful |
| `"1"` | Failed |
| `"2"` | Pending |
| `"3"` | Refund pending |
| `"4"` | Refunded |
| `"5"` | Cancelled |

**Existing SDK limitation:** both baseline clients currently model status as only 0/1. Their `check()` parsers will reject pending, cancelled, and refund statuses. The simulator preserves the documented status values. Wait for success/failure before calling the current SDK parser, or extend the SDK status model in your application. Request acceptance codes and transaction status codes have separate meanings.

### Callbacks

Completion sends a JSON POST to the supplied `callbackUrl`, using the v1.5 fields: `code`, `reference`, `orderNumber`, `provider_reference`, `amount`, `amountCustomer`, `phone`, `currency`, `createdAt`, and `channel`. Successful callback `code` is `"0"`; failure/cancellation uses `"1"`. Amounts are decimal strings; timestamps use `DD-MM-YYYY HH:mm:ss` in UTC. Phone prefixes select `mpesa`, `om`, `airtelmoney`, or fallback `afrimoney`; card channel is simulated as Visa or Mastercard.

Delivery runs in the background with a 10-second timeout and no automatic retries or redirects. Inspect the HTTP result/error in transaction details, and use **Replay callback** after fixing your receiver. The receiver must be running at the supplied URL; a closed localhost port produces a recorded delivery error. Refund transitions update check status without inventing an undocumented refund callback protocol.

With Compose, use `http://host.docker.internal:9000/callback` for a callback receiver on your host machine. Use the receiver service name when both containers share a Docker network. `localhost` inside the backend container refers to that container; it only reaches a host receiver when running the Rust server natively on the same machine.

### Point the existing SDKs at localhost

Both updated SDKs accept custom versioned base URLs, so no transport override is needed:

```ts
const client = new Client('TESTMERCHANT', 'test-token', 'dev', {
  apiBaseUrl: 'http://localhost:8080/api/rest/v1',
  cardBaseUrl: 'http://localhost:8080/v1.1',
});
```

```php
$client = new Client(
    new Credential('test-token', 'TESTMERCHANT'),
    apiBaseUrl: 'http://localhost:8080/api/rest/v1',
    cardBaseUrl: 'http://localhost:8080/v1.1',
);
```

## Storage and scope

**Reset transactions** in the dashboard deletes transaction history and callback logs, retaining your test rules/settings. Background completion cannot recreate deleted rows. Restarting preserves stored transactions/settings; timers and callback jobs are not durable. Payments interrupted before completion remain pending and can be resolved manually after restart.

This is a local development tool. Dashboard management endpoints under `/api/simulator` are unauthenticated and expose local test credentials. The server binds to loopback by default. Use test credentials and test card values. No real operator push, card processing, 3DS, balance accounting, settlements, or live FlexPay forwarding is implemented. Request error messages and provider references are simulated; the PDF/SDKs do not specify every behavior of the live service. This is contract-based compatibility, not certification against the live gateway.

## Verification

```sh
make check
```
