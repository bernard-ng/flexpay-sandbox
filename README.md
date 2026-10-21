# FlexPay Sandbox

A local FlexPay testing environment with a transaction dashboard, configurable payment outcomes, and a hosted card checkout. Test mobile payments, card payments, payouts, and callbacks without contacting the real FlexPay service.

## Run with Docker

```yaml
name: your_app

services:
  flexpay_sandbox:
    image: ghcr.io/bernard-ng/flexpay-sandbox:latest
    ports:
      - "127.0.0.1:8080:8080"
    environment:
      FLEXPAY_PUBLIC_URL: http://localhost:8080
      FLEXPAY_MERCHANT: TESTMERCHANT
      FLEXPAY_TOKEN: test-token
    volumes:
      - sandbox-data:/app/data
    extra_hosts:
      - host.docker.internal:host-gateway

volumes:
  sandbox-data:
```

Start it and open **http://localhost:8080**:

```sh
docker compose up -d
```

Use a published version such as `:v0.1.0` instead of `:latest` to pin a version. Each [GitHub release](https://github.com/bernard-ng/flexpay-sandbox/releases) also includes a ready-to-use `compose.prod.yaml` pinned to that release's image digest.

Change the published port and `FLEXPAY_PUBLIC_URL` together when using a different address. Set `FLEXPAY_MERCHANT` and `FLEXPAY_TOKEN` to the test credentials your integration will use. This is a development simulator; keep it local and use test data only.

## Point your integration at the sandbox

Use these base URLs with the TypeScript or PHP clients:

| API | Base URL |
| --- | --- |
| Mobile payments, payouts, and status checks | `http://localhost:8080/api/rest/v1` |
| Card payments | `http://localhost:8080/v1.1` |

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

If your application runs in the same Docker network, use `http://flexpay_sandbox:8080` as the host in those URLs. The sandbox never forwards transactions to the live gateway.

## Testing use cases

- **Successful and failed payments:** use the test values below or configure your own phone/card rules in **Test configuration**.
- **Pending payments:** create a pending transaction, inspect it in **Transactions**, and manually resolve it as successful, failed, or cancelled.
- **Hosted card checkout:** create a card payment through your integration, open the returned checkout URL, and verify the success, decline, and cancellation redirects.
- **Mobile payouts:** test payout outcomes using the same phone rules as mobile collections.
- **Callbacks:** inspect the payload and delivery result in transaction details, then use **Replay callback** to retry delivery after fixing your receiver.
- **Refund states:** move successful transactions through refund pending and refunded to test status handling.
- **Fresh test runs:** reset transaction history from the dashboard while retaining your rules and settings.

The **Gateway simulator** page can create mobile payments, card checkouts, and payouts directly. **Test configuration** controls matching rules, default outcomes, completion delays, and simulated customer fees.

| Method | Test value | Result |
| --- | --- | --- |
| Phone | `243810000001` | Success |
| Phone | `243810000002` | Failure |
| Phone | `243810000003` | Pending |
| Card | `4242424242424242` | Success |
| Card | `4000000000000002` | Failure |
| Card | `4000000000003220` | Pending |

For a callback receiver on your host machine, use `http://host.docker.internal:9000/callback`. For a receiver in the same Docker network, use its service name. `localhost` inside the sandbox container refers to the sandbox itself.

Request acceptance does not mean payment success. Poll the status endpoint or wait for the callback. The baseline SDKs currently accept only success/failure status values; pending, cancelled, and refund states may require extending their status handling.

## Update or stop

```sh
docker compose pull
docker compose up -d
docker compose down
```

When using a digest-pinned release attachment, replace it with the next release's attachment before updating. Keep the same project and volume names to retain your data. Removing the volume deletes its transaction history and configuration.

## Community

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance and the [Code of Conduct](CODE_OF_CONDUCT.md) for community standards. Report vulnerabilities privately using [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) — Copyright (c) 2026-present Bernard Ngandu and contributors.
