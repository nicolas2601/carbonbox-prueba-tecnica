#!/usr/bin/env bash
set -euo pipefail

project="${COMPOSE_PROJECT_NAME:?Container smoke requires an explicit owned compose project}"
case "$project" in
  carbonbox-smoke-*|carbonbox-ci-*) ;;
  *) printf 'Refusing a non-smoke compose project\n' >&2; exit 1 ;;
esac
container=$(docker compose -p "$project" ps -q api)
[[ -n "$container" ]] || { printf 'Owned API container not found\n' >&2; exit 1; }
owner=$(docker inspect --format '{{index .Config.Labels "com.docker.compose.project"}}' "$container")
[[ "$owner" == "$project" ]] || { printf 'API project ownership mismatch\n' >&2; exit 1; }
published=$(docker compose -p "$project" port api 3001)
port="${published##*:}"
api_base_url="${API_BASE_URL:-http://127.0.0.1:$port}"
[[ "$api_base_url" == "http://127.0.0.1:$port" || "$api_base_url" == "http://localhost:$port" ]] || {
  printf 'API URL must match the owned published port\n' >&2; exit 1;
}
sample_csv="${SAMPLE_CSV:-sample-data.csv}"
ready_url="$api_base_url/health/ready"

for attempt in $(seq 1 60); do
  if curl --silent --show-error --fail "$ready_url" >/dev/null; then
    break
  fi
  if [[ "$attempt" == 60 ]]; then
    printf 'API did not become ready at %s\n' "$ready_url" >&2
    exit 1
  fi
  sleep 2
done

upload_id=$(curl --silent --show-error --fail \
  -F "file=@${sample_csv};type=text/csv" \
  "$api_base_url/api/v1/uploads" | jq --exit-status --raw-output '.id')

for attempt in $(seq 1 60); do
  upload=$(curl --silent --show-error --fail "$api_base_url/api/v1/uploads/$upload_id")
  status=$(jq --exit-status --raw-output '.status' <<<"$upload")
  case "$status" in
    COMPLETED)
      printf 'Container smoke passed: upload %s completed.\n' "$upload_id"
      exit 0
      ;;
    FAILED)
      printf 'Container smoke failed: upload %s failed\n' "$upload_id" >&2
      exit 1
      ;;
  esac
  sleep 2
done

printf 'Container smoke timed out waiting for upload %s (last status: %s).\n' "$upload_id" "$status" >&2
exit 1
