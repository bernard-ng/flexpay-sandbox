#!/usr/bin/env bash
set -euo pipefail

sources=()

for digest_file in "$RUNNER_TEMP"/digests/*; do
  digest=${digest_file##*/}

  if [[ ! "$digest" =~ ^[a-f0-9]{64}$ ]]; then
    echo "Invalid image digest artifact: $digest" >&2
    exit 1
  fi

  sources+=("$IMAGE@sha256:$digest")
done

if [ "${#sources[@]}" -ne 2 ]; then
  echo "Expected one digest for each of AMD64 and ARM64" >&2
  exit 1
fi

tags=()

while IFS= read -r tag; do
  if [ -n "$tag" ]; then
    tags+=(--tag "$tag")
  fi
done <<< "$IMAGE_TAGS"

docker buildx imagetools create "${tags[@]}" "${sources[@]}" \
  --metadata-file "$RUNNER_TEMP/image-metadata.json"

digest=$(jq -er '."containerimage.descriptor".digest' "$RUNNER_TEMP/image-metadata.json")

docker buildx imagetools inspect "$IMAGE@$digest" --raw \
  | jq -e '([.manifests[].platform | select(.os == "linux") | .architecture] | sort) == ["amd64", "arm64"]'

echo "digest=$digest" >> "$GITHUB_OUTPUT"
