# Contributing

Thank you for contributing to FlexPay Sandbox.

## Before starting

1. Search existing issues and pull requests.
2. Open an issue before beginning a large or breaking change.
3. Keep each pull request focused on one concern.

Report vulnerabilities privately using the [security policy](SECURITY.md).

## Development

Use Docker with Compose v5.1.4+ to run both projects with source watching:

```shell
docker compose -f compose.dev.yaml up --watch
```

Open http://localhost:8080. Frontend changes use hot reload; Rust changes rebuild
the backend. The SQLite volume persists between runs. Use test credentials and
test card values only.

For native development and checks, install Rust 1.88+ with rustfmt and Clippy,
Node 24+, Bun 1.4.2+, and Make. CI uses Rust 1.99.0. Install frontend dependencies
from the lockfile:

```shell
bun install --cwd frontend --frozen-lockfile
```

Format Rust before running the non-modifying checks:

```shell
cargo fmt --manifest-path backend/Cargo.toml
make check
```

`make check` runs backend and frontend checks in parallel: Rust formatting,
Clippy, backend tests, frontend dependency auditing, TypeScript checking,
frontend tests, and the frontend build. Both projects must pass. The one approved
audit exception is documented [below](#audit-exception); do not
add or broaden exceptions without maintainer agreement.

To check the packaged application locally:

```shell
docker buildx build --load --tag flexpay-sandbox:smoke .
bash .github/scripts/smoke-release.sh
```

The smoke test uses a disposable Compose project and volume. CI runs this test
and a separate development Compose smoke test.

### Audit exception

The audit excludes only [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm):
`shadcn` pulls in `braces@3.0.3` through its CLI's `fast-glob`/`micromatch`
dependencies. The advisory covers stack exhaustion from deeply nested brace
patterns and has no published patched version as of October 21, 2026. We retain
the official shadcn package for its stylesheet export and registry tooling. The
release runtime contains neither Node nor these dependencies; the affected CLI
is used only during development and builds.

Both CI and `make check` use the same explicit advisory exception. All other
findings fail the audit. Remove the exception once an upstream release removes
or fixes this dependency. Run `bun audit --cwd frontend` without the exception to
view the complete report.

## Project layout

- `backend/src/`: Rust API, simulation behavior, callbacks, and SQLite storage.
- `backend/tests/`: backend integration tests.
- `frontend/src/`: routes, composition-only pages, feature components, and shared UI.
- `frontend/tests/`: frontend tests.
- `Dockerfile`: combined release image with the API and compiled dashboard.
- `backend/Dockerfile` and `frontend/Dockerfile`: separate development images.
- `compose.dev.yaml`: source builds and watch configuration.
- `compose.prod.yaml`: installation using a published image.

## Changes and tests

- Add or update tests for observable behavior changes.
- Preserve the documented FlexPay request, response, status, and callback contracts.
- Update documentation and examples when configuration or API behavior changes.
- Keep Rust modules and frontend components focused on one responsibility.
- Keep route and page components focused on composing feature components.
- Use the official shadcn registry for shared UI components, retaining the Base UI
  preset and default variants declared in `frontend/components.json`.
- Keep blank lines between logical code sections and follow nearby formatting.
- Commit dependency lockfiles when dependencies change.
- Do not commit generated build artifacts, databases, credentials, or real payment data.
- Document breaking changes and include migration instructions.

## Commits

Use Conventional Commits, such as `feat:`, `fix:`, `docs:`, `test:`, `refactor:`,
`build:`, and `chore:`. Add `!` or a `BREAKING CHANGE:` footer when appropriate.

## Pull requests

Describe the problem, resulting behavior, and relevant validation. Ensure every
required check passes and respond to review feedback with focused commits.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Publishing a release

Push a version tag such as `v0.1.0` or `v0.2.0-rc.1`. The release workflow reruns
all checks before publishing `ghcr.io/bernard-ng/flexpay-sandbox` for
`linux/amd64` and `linux/arm64`. It then creates a GitHub release with generated
notes and a standalone `compose.prod.yaml` attachment pinned to the image digest.

Images receive both the Git tag (`:v0.1.0`) and the version without `v`
(`:0.1.0`). Stable tags also update `:latest`; prereleases are marked as
prereleases on GitHub and leave `:latest` unchanged. The workflow uses the
built-in `GITHUB_TOKEN` with package/release write permissions; no registry
secret is needed.

After the first publication, set the GHCR package visibility to **Public** so
users can pull without authentication. GitHub creates new packages as private
by default, even for public source repositories.

## License

Contributions are licensed under the project's [MIT License](LICENSE).
