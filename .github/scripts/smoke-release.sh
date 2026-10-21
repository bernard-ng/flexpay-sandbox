#!/usr/bin/env bash
set -euo pipefail

# Use a disposable project; never reset a developer's sandbox volume.
export COMPOSE_PROJECT_NAME=flexpay_release_smoke
export FLEXPAY_PORT=${FLEXPAY_PORT:-18082}
export FLEXPAY_IMAGE=${FLEXPAY_IMAGE:-flexpay-sandbox:smoke}

compose=(docker compose -f compose.prod.yaml)
artifacts=$(mktemp -d)

cleanup() {
  status=$?

  if [ "$status" -ne 0 ]; then
    "${compose[@]}" logs --no-color || true
  fi

  "${compose[@]}" down --volumes
  rm -rf "$artifacts"
  exit "$status"
}

trap cleanup EXIT

"${compose[@]}" config --quiet
"${compose[@]}" up --wait --wait-timeout 120 --pull never

base_url="http://127.0.0.1:$FLEXPAY_PORT"

curl --fail --silent --show-error "$base_url/health"
curl --fail --silent --show-error "$base_url/api/simulator/settings" > "$artifacts/settings.json"
curl --fail --silent --show-error "$base_url/" > "$artifacts/index.html"
curl --fail --silent --show-error "$base_url/settings" > "$artifacts/settings.html"
curl --fail --silent --show-error "$base_url/checkout/smoke-order" > "$artifacts/checkout.html"

# Check that deep links serve the SPA and its compiled JavaScript is available.
cmp "$artifacts/index.html" "$artifacts/settings.html"
cmp "$artifacts/index.html" "$artifacts/checkout.html"

asset=$(sed -nE 's/.*src="(\/assets\/[^" ]+\.js)".*/\1/p' "$artifacts/index.html" | head -n 1)
test -n "$asset"
curl --fail --silent --show-error --dump-header "$artifacts/asset.headers" \
  "$base_url$asset" > "$artifacts/app.js"
grep -Eiq '^content-type: (application|text)/javascript' "$artifacts/asset.headers"
test -s "$artifacts/app.js"

echo "Packaged dashboard, deep links, assets, and API passed."
