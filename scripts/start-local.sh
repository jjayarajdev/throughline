#!/usr/bin/env bash
#
# EpiCenter — start backend (http://localhost:5084) + UI (http://localhost:3000).
#
# The backend's DB connection and JWT key are passed as ENVIRONMENT VARIABLES, not
# user-secrets: EpicenterX.csproj sets <GenerateAssemblyInfo>false</GenerateAssemblyInfo>,
# which suppresses the UserSecretsId assembly attribute, so `dotnet user-secrets` is
# silently ignored and the committed Azure connection string wins.
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SA_PASSWORD="${SA_PASSWORD:-Your_strong_Pass1}"
DB_NAME="${DB_NAME:-Epicenterv2}"
SQL_PORT="${SQL_PORT:-1433}"

export PATH="$HOME/.dotnet:$HOME/.dotnet/tools:$PATH"
export DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"
export ASPNETCORE_ENVIRONMENT=Development
export ConnectionStrings__EpicConnection="Server=localhost,${SQL_PORT};Initial Catalog=${DB_NAME};User ID=sa;Password=${SA_PASSWORD};Encrypt=True;TrustServerCertificate=True;Connection Timeout=30;"
export Jwt__SecretKey="${JWT_KEY:-dev-only-key-min-32-bytes-long-change-me!!}"

docker start epicenter-sql >/dev/null 2>&1 || true

( cd "$ROOT/EpiCenter-backend-main" && dotnet run --launch-profile http ) &
BACK=$!
( cd "$ROOT/UI-Epicenter-main" && npm run dev ) &
UIP=$!
trap 'kill $BACK $UIP 2>/dev/null' INT TERM EXIT
echo "Backend: http://localhost:5084/swagger   UI: http://localhost:3000   (Ctrl-C stops both)"
wait
