#!/usr/bin/env bash
# Runs Flyway (Docker) against the local platform Postgres.  Usage: scripts/flyway.sh migrate|info|validate|repair
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
: "${PGPASSWORD:=Your_strong_Pass1}"
docker run --rm \
  -v "$ROOT/platform-db/migrations:/flyway/sql:ro" \
  -v "$ROOT/platform-db/flyway.conf:/flyway/conf/flyway.conf:ro" \
  -e PGPASSWORD="$PGPASSWORD" \
  flyway/flyway:10 -configFiles=/flyway/conf/flyway.conf "$@"
