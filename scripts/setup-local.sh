#!/usr/bin/env bash
# One-shot local setup for the Throughline platform on PostgreSQL 16.
#
#   1. Starts the platform Postgres container (throughline-pg, host port 5433, db "platform")
#   2. Applies the Flyway migrations in platform-db/migrations (core + throughline schemas, functions)
#   3. If the legacy SQL Server container (epicenter-sql) is reachable, copies Epicenterv2 into
#      the throughline schema (scripts/copy-sqlserver-to-postgres.py) and projects it into core
#      (scripts/project-core-report.py)
#   4. Writes apps/throughline-web/.env.local and builds the API + UI
#
# Requires: docker, .NET 8 SDK (~/.dotnet is added to PATH), node/npm, python3 with
#           `pip install pymssql "psycopg[binary]"` for step 3.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.dotnet:$HOME/.dotnet/tools:$PATH"
export DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"

PG_CONTAINER="${PG_CONTAINER:-throughline-pg}"
PG_PORT="${PG_PORT:-5433}"
PG_PASSWORD="${PG_PASSWORD:-Your_strong_Pass1}"
PG_DB="${PG_DB:-platform}"
SQL_CONTAINER="${SQL_CONTAINER:-epicenter-sql}"

API="$ROOT/apps/throughline-api"
UI="$ROOT/apps/throughline-web"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
die() { printf '\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

have docker || die "docker not found"
have dotnet || die ".NET SDK not found (expected in ~/.dotnet)"
have npm    || die "npm not found"

log "1. PostgreSQL container ($PG_CONTAINER on port $PG_PORT)"
if ! docker ps --format '{{.Names}}' | grep -qx "$PG_CONTAINER"; then
  docker volume create "${PG_CONTAINER}-data" >/dev/null
  docker run -d --name "$PG_CONTAINER" -e POSTGRES_PASSWORD="$PG_PASSWORD" -e POSTGRES_DB="$PG_DB" \
    -p "${PG_PORT}:5432" -v "${PG_CONTAINER}-data:/var/lib/postgresql/data" postgres:16 >/dev/null
fi
for _ in $(seq 1 30); do docker exec "$PG_CONTAINER" pg_isready -U postgres -q && break; sleep 1; done
docker exec "$PG_CONTAINER" pg_isready -U postgres -q || die "Postgres did not become ready"

log "2. Flyway migrations"
PGPASSWORD="$PG_PASSWORD" "$ROOT/scripts/flyway.sh" migrate | grep -E 'Migrating|Successfully|No migration|ERROR' || true

log "3. Legacy data"
if docker ps --format '{{.Names}}' | grep -qx "$SQL_CONTAINER"; then
  echo "SQL Server container '$SQL_CONTAINER' found: copying Epicenterv2 -> throughline schema"
  PG_PORT="$PG_PORT" PG_PASSWORD="$PG_PASSWORD" python3 "$ROOT/scripts/copy-sqlserver-to-postgres.py" \
    > "$ROOT/scripts/.copy-report.json" 2> >(tail -1 >&2)
  echo "projecting throughline -> core"
  PG_PORT="$PG_PORT" PG_PASSWORD="$PG_PASSWORD" python3 "$ROOT/scripts/project-core-report.py" > "$ROOT/docs/db/core-migration-report.md"
  echo "report: docs/db/core-migration-report.md"
else
  echo "No '$SQL_CONTAINER' container: skipping legacy copy (schema is empty; log in needs at least one ADMIN user)"
fi

log "4. UI env + builds"
cat > "$UI/.env.local" <<EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:5084/api
EOF
( cd "$API" && dotnet build -c Debug -v q --nologo | tail -2 )
( cd "$UI" && [ -d node_modules ] || npm install --legacy-peer-deps --no-audit --no-fund )

log "Done. Start everything with: scripts/start-local.sh"
