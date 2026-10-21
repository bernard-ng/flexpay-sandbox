# FlexPay local sandbox

A small local FlexPay simulator for integration development: Rust/Axum API, SQLite transaction history, and a React + TanStack Start SPA dashboard with official shadcn/ui components built on Base UI (Nova preset). It implements the mobile and payout contracts from the supplied FlexPay v1.5 documentation and the card contract used by the `ngandu-dev/flexpay` TypeScript and PHP clients. It never forwards payments to FlexPay.

## Run

Requires Rust 1.88+, Node 24+, and Bun 1.4.2+. From the repository root:

```sh
make setup
make run
```

Frontend dependencies are managed with Bun and locked in `frontend/bun.lock`; `make setup` uses a frozen install. Frontend type checking uses TypeScript 7's native compiler.

Open **http://localhost:8080**. Rust serves the built dashboard and API together; no Node server is needed at runtime. Data is saved in `data/flexpay.db`.

Optional configuration: copy `.env.example` to `.env`, or pass CLI flags (`cargo run -- --help`). Defaults:

| Setting | Default |
| --- | --- |
| Bind address | `127.0.0.1:8080` |
| Public URL (checkout links) | `http://localhost:8080` |
| Merchant | `TESTMERCHANT` |
| Bearer token | `test-token` |
| Database | `data/flexpay.db` |
| Frontend assets | `frontend/dist/client` |

For UI development, run `cargo run` and `bun run --cwd frontend dev` in separate terminals. Open http://localhost:3000. The development server proxies API requests to Rust. Set `FLEXPAY_PUBLIC_URL=http://localhost:3000` if you want generated checkout links to open the live frontend. If the Rust port changes, update the development proxy in `frontend/vite.config.ts` too.

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
    "callbackUrl": "http://localhost:9000/callback"
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

Use `localhost` when the receiver runs on the same machine as this Rust process. If running inside containers, use a hostname reachable from that process instead.

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

Use the updated local SDK checkouts (or a release containing these options). Existing published versions may not have custom base URL support yet. The scripts below exercise the regular client transports directly:

```sh
# Start this simulator first with its default merchant/token/settings.
# Build the TypeScript SDK dist once if needed.
node scripts/typescript-smoke.mjs /absolute/path/to/flexpay
php scripts/php-smoke.php /absolute/path/to/flexpay-php
```

Both examples exercise mobile, check, payout, and card creation with the real clients and their normal HTTP transports. Set `FLEXPAY_SIMULATOR_URL` for a different local address. No SDK transport patching is performed.

## Storage and scope

**Reset transactions** in the dashboard deletes transaction history and callback logs, retaining your test rules/settings. Background completion cannot recreate deleted rows. Restarting preserves stored transactions/settings; timers and callback jobs are not durable. Payments interrupted before completion remain pending and can be resolved manually after restart.

This is a local development tool. Dashboard management endpoints under `/api/simulator` are unauthenticated and expose local test credentials. The server binds to loopback by default. Use test credentials and test card values. No real operator push, card processing, 3DS, balance accounting, settlements, or live FlexPay forwarding is implemented. Request error messages and provider references are simulated; the PDF/SDKs do not specify every behavior of the live service. This is contract-based compatibility, not certification against the live gateway.

## Verification

```sh
make check
```

Runs Rust formatting, Clippy, HTTP integration tests, frontend type checking, frontend contract/validation tests, and a production SPA build. Integration tests cover success/failure/pending, payout, both card URL naming styles, cancellation, callbacks/replay, auth/validation, refund transitions, decimal precision, SQLite persistence, and reset while completion is scheduled.

The frontend uses [TanStack Start SPA mode](https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode) and official [shadcn/ui registry components](https://ui.shadcn.com/docs/cli) with Base UI, the default Nova preset, neutral theme, and unchanged component variants. Only static client output is served by Rust.

### Rust structure

`src/lib.rs` exposes the application state, router, models, and store. The implementation is organized by responsibility:

- `src/http/` wires routes and extracts HTTP requests. Handlers are grouped into payment, checkout, transaction, and simulator endpoints; authorization has its own module.
- `src/payments/` coordinates payment creation, checkout decisions, delayed completion, and the callbacks triggered by a completed transaction.
- `src/model/` owns payment request validation, exact decimal amounts, simulation rules, transaction construction, state transitions, and FlexPay response payloads.
- `src/callbacks.rs` delivers callbacks and records delivery attempts. `src/store.rs` owns SQLite access and atomic transaction updates.
- `src/app.rs` constructs shared state and tracked tasks. `src/cli.rs` defines command-line configuration; `src/main.rs` starts the server and handles shutdown.

The `tests/flows.rs` test target assembles shared fixtures from `tests/common/` and scenarios from `tests/scenarios/`, grouped by payments, checkout, callbacks, persistence, and amounts. The public Rust entry points and FlexPay HTTP contracts are unchanged.

### Frontend structure

Routes in `frontend/src/routes/` connect URLs to the shared dashboard layout and page components. `/` shows transactions, `/gateway` creates test payments, `/settings` configures the simulator, and `/checkout/$id` hosts a card checkout. Components in `src/pages/` only compose feature components; they contain no requests, form state, or table logic.

Feature components and hooks live in `src/features/{transactions,gateway,settings,checkout}/`. Shared presentation components live in `src/components/shared/`, alongside the generated shadcn primitives in `src/components/ui/`.

- TanStack Query owns server data, request cancellation, polling, and mutation invalidation. Query definitions live in `src/lib/queries.ts`; forms keep their own mutation hooks with the corresponding feature.
- TanStack Table owns transaction sorting, filtering, and pagination. Columns, toolbar, pagination, details, and callbacks are separate components.
- TanStack Form owns payment, checkout, and settings values, validation, array rules, dirty state, and submission.
- TanStack Store owns shared UI state: transaction search/status, selection, the reset dialog, and live updates. Its provider creates a store per app instance; API data stays in Query.

`bun run --cwd frontend test` checks payment request compatibility and validation rules. `make check` includes these checks.

### UI generation

Use these commands from `frontend/` to initialize Base UI and generate the components and dashboard layout:

```sh
bunx --bun shadcn@latest init --base base --preset nova --template start --force --yes --no-monorepo --no-reinstall
bunx --bun shadcn@latest add button input label card badge table sheet alert-dialog select tabs alert separator --yes --overwrite
bunx --bun shadcn@latest add sidebar-07 --yes
```

`components.json` records `style: "base-nova"`. Files in `src/components/ui/` are generated from the official registry. The sidebar-07 application components are adapted to the simulator's pages and merchant details. Layout and page composition live outside the generated primitives. To add another component, run `bunx --bun shadcn@latest add <component>` from `frontend/`.

