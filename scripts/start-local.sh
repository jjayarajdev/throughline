#!/usr/bin/env bash
# Starts the Throughline API (http://localhost:5084) and UI (http://localhost:3000) against the
# platform PostgreSQL database. Run scripts/setup-local.sh first.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.dotnet:$HOME/.dotnet/tools:$PATH"
export DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"

PG_PORT="${PG_PORT:-5433}"
PG_PASSWORD="${PG_PASSWORD:-Your_strong_Pass1}"
PG_DB="${PG_DB:-platform}"

# The API reads these (user-secrets are ignored because the csproj sets GenerateAssemblyInfo=false).
export ConnectionStrings__EpicConnection="Host=localhost;Port=${PG_PORT};Database=${PG_DB};Username=postgres;Password=${PG_PASSWORD};Include Error Detail=true"
export Jwt__SecretKey="${JWT_SECRET:-local-dev-jwt-secret-key-change-me-0123456789abcdef}"

trap 'kill 0' EXIT
( cd "$ROOT/apps/throughline-api" && dotnet run --launch-profile http ) &
sleep 3
( cd "$ROOT/apps/throughline-web" && npm run dev ) &
wait
