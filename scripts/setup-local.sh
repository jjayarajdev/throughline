#!/usr/bin/env bash
#
# EpiCenter — local bring-up orchestrator.
#
# What it does, idempotently:
#   1. Starts a local SQL Server 2025 (Developer) in Docker
#   2. Creates the Epicenterv2 DB and applies the real schema export
#      ("8. Database Schema.sql", a UTF-16 SSMS script: 68 tables, procs, views, UDTs)
#   3. Applies scripts/schema-drift-patch.sql (columns/tables the EF model expects
#      that the Oct-2025 export lacks)
#   4. Seeds an ADMIN role + user so you can log in (scripts/seed.sql)
#   4b. If "Migrated Data-Till-23rdJune2025.xlsx" is present, loads it via scripts/migrate-excel.py
#   5. Writes the UI .env.local (if missing)
#   6. Restores + builds the backend
#
# Then run:  ./scripts/start-local.sh
#
# Requires: docker, sqlcmd (brew install sqlcmd), .NET 8 SDK, node/npm.
# .NET 8 SDK without sudo:  curl -sSL https://dot.net/v1/dotnet-install.sh | bash -s -- --channel 8.0
#                           (installs to ~/.dotnet; start-local.sh adds it to PATH)
#
set -euo pipefail

SA_PASSWORD="${SA_PASSWORD:-Your_strong_Pass1}"
DB_NAME="${DB_NAME:-Epicenterv2}"
SQL_CONTAINER="${SQL_CONTAINER:-epicenter-sql}"
# NOTE: azure-sql-edge is retired and crashes on current Docker Desktop; 2025 runs on arm64 via Rosetta.
SQL_IMAGE="${SQL_IMAGE:-mcr.microsoft.com/mssql/server:2025-latest}"
SQL_PORT="${SQL_PORT:-1433}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/EpiCenter-backend-main"
UI="$ROOT/UI-Epicenter-main"
SCHEMA_SRC="$ROOT/8. Database Schema.sql"
SCHEMA_UTF8="$ROOT/scripts/.schema.utf8.sql"
PATCH="$ROOT/scripts/schema-drift-patch.sql"
SEED="$ROOT/scripts/seed.sql"

export PATH="$HOME/.dotnet:$HOME/.dotnet/tools:$PATH"
export DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m!! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31mxx %s\033[0m\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }
sql()  { sqlcmd -S "localhost,${SQL_PORT}" -U sa -P "$SA_PASSWORD" -C "$@"; }

have docker || die "docker not found. Install Docker Desktop and retry."
have sqlcmd || die "sqlcmd not found. Run: brew install sqlcmd"

# ---- 1. SQL Server ----------------------------------------------------------
say "Starting SQL Server container ($SQL_CONTAINER)"
if docker ps --format '{{.Names}}' | grep -qx "$SQL_CONTAINER"; then
  echo "Already running."
elif docker ps -a --format '{{.Names}}' | grep -qx "$SQL_CONTAINER"; then
  docker start "$SQL_CONTAINER" >/dev/null && echo "Restarted existing container."
else
  docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=${SA_PASSWORD}" -e "MSSQL_PID=Developer" \
    -p "${SQL_PORT}:1433" -d --name "$SQL_CONTAINER" "$SQL_IMAGE" >/dev/null
  echo "Created new container."
fi

say "Waiting for SQL Server to accept connections"
for i in $(seq 1 45); do
  if sql -Q "SELECT 1" >/dev/null 2>&1; then echo "SQL is up."; break; fi
  [ "$i" -eq 45 ] && die "SQL Server did not become ready. Check: docker logs $SQL_CONTAINER"
  sleep 2
done

# ---- 2. schema --------------------------------------------------------------
say "Creating database + applying schema export"
sql -Q "IF DB_ID('${DB_NAME}') IS NULL CREATE DATABASE [${DB_NAME}];"
if [ "$(sql -d "$DB_NAME" -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.tables")" -gt 10 ]; then
  echo "Tables already present — skipping schema export."
else
  [ -f "$SCHEMA_SRC" ] || die "Schema export not found: $SCHEMA_SRC"
  iconv -f UTF-16LE -t UTF-8 "$SCHEMA_SRC" > "$SCHEMA_UTF8"
  sql -d "$DB_NAME" -i "$SCHEMA_UTF8" >/dev/null
  echo "Schema applied."
fi

# ---- 3. drift patch ---------------------------------------------------------
say "Applying schema drift patch"
sql -d "$DB_NAME" -i "$PATCH" >/dev/null && echo "Patch applied."

# ---- 4. seed ----------------------------------------------------------------
say "Seeding ADMIN role + user"
sql -d "$DB_NAME" -i "$SEED"

# ---- 4b. legacy data (optional) ---------------------------------------------
XLSX="${XLSX:-$ROOT/Migrated Data-Till-23rdJune2025.xlsx}"
if [ -f "$XLSX" ]; then
  say "Loading legacy workbook: $(basename "$XLSX")"
  python3 -c "import openpyxl" 2>/dev/null || pip3 install --quiet openpyxl
  python3 "$ROOT/scripts/migrate-excel.py" "$XLSX" "$ROOT/scripts/.migrate.sql" | tail -25
  sql -d "$DB_NAME" -i "$ROOT/scripts/.migrate.sql" >/dev/null && echo "Legacy data loaded (replaces any previous load)."
else
  warn "No legacy workbook found at $XLSX — skipping data load (schema + admin user only)."
fi

# ---- 5. UI env --------------------------------------------------------------
say "Ensuring UI .env.local"
if [ -f "$UI/.env.local" ]; then echo "Already present."
else echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:5084/api" > "$UI/.env.local"; echo "Created."; fi

# ---- 6. build ---------------------------------------------------------------
if have dotnet; then
  say "Restoring + building backend"
  ( cd "$BACKEND" && dotnet build 2>&1 | tail -3 )
else
  warn "dotnet not found — skipping backend build. See header for a no-sudo install."
fi
if [ ! -d "$UI/node_modules" ]; then
  say "Installing UI dependencies"
  ( cd "$UI" && npm install --legacy-peer-deps )   # eslint peer conflict needs the flag
fi

cat <<MSG

------------------------------------------------------------------
Setup finished. Start both apps with:

  ./scripts/start-local.sh

Log in with:  jjayaraj@gmail.com   (any password — backend ignores it)
------------------------------------------------------------------
MSG
