#!/usr/bin/env python3
"""
Copy every table of the Throughline EF model from SQL Server (Epicenterv2) into the
`throughline` schema of the platform PostgreSQL database.

  - target tables are discovered from Postgres (information_schema); columns are matched
    by case-insensitive name, so columns that exist only on one side are reported, not fatal
  - foreign keys are bypassed for the duration of the load (session_replication_role=replica)
  - identity columns receive the original ids; sequences are reset afterwards
  - generated (computed) columns are skipped on write and compared afterwards

Env:  MSSQL_HOST/PORT/USER/PASSWORD/DB   PG_HOST/PORT/USER/PASSWORD/DB
"""
import os, sys, json, datetime, decimal, uuid
import pymssql, psycopg
from psycopg import sql

MS = dict(server=os.getenv("MSSQL_HOST", "localhost"), port=int(os.getenv("MSSQL_PORT", "1433")),
          user=os.getenv("MSSQL_USER", "sa"), password=os.getenv("MSSQL_PASSWORD", "Your_strong_Pass1"),
          database=os.getenv("MSSQL_DB", "Epicenterv2"))
PG = f"host={os.getenv('PG_HOST','localhost')} port={os.getenv('PG_PORT','5433')} dbname={os.getenv('PG_DB','platform')} " \
     f"user={os.getenv('PG_USER','postgres')} password={os.getenv('PG_PASSWORD','Your_strong_Pass1')}"
SCHEMA = "throughline"

def main():
    ms = pymssql.connect(**MS, as_dict=False)
    pg = psycopg.connect(PG, autocommit=False)
    mcur, pcur = ms.cursor(), pg.cursor()

    pcur.execute("""
        SELECT table_name, column_name, data_type, is_generated, is_identity
          FROM information_schema.columns WHERE table_schema=%s ORDER BY table_name, ordinal_position""", (SCHEMA,))
    pg_tables = {}
    for t, c, dt, gen, ident in pcur.fetchall():
        pg_tables.setdefault(t, []).append((c, dt, gen == 'ALWAYS', ident == 'YES'))

    mcur.execute("SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' ORDER BY TABLE_NAME, ORDINAL_POSITION")
    ms_tables = {}
    for t, c, dt in mcur.fetchall():
        ms_tables.setdefault(t, []).append((c, dt))
    ms_lower = {t.lower(): t for t in ms_tables}

    report = {"copied": {}, "missing_in_sqlserver": [], "only_in_sqlserver": sorted(set(ms_tables) - {t for t in ms_tables if t.lower() in {x.lower() for x in pg_tables}}),
              "columns_only_in_pg": {}, "columns_only_in_sqlserver": {}, "computed_mismatch": {}}

    pcur.execute("SET session_replication_role = replica")
    # Truncate every target table in ONE statement. A per-table TRUNCATE ... CASCADE would
    # also empty already-loaded tables that reference the one being truncated (e.g. truncating
    # Users last wiped Partners/Hiring/M_Cities... through their CreatedBy FKs).
    pcur.execute(sql.SQL("TRUNCATE TABLE {}").format(
        sql.SQL(", ").join(sql.SQL("{}.{}").format(sql.Identifier(SCHEMA), sql.Identifier(t)) for t in sorted(pg_tables))))
    for pt, pcols in sorted(pg_tables.items()):
        mt = ms_lower.get(pt.lower())
        if not mt:
            report["missing_in_sqlserver"].append(pt); continue
        mcols = {c.lower(): (c, dt) for c, dt in ms_tables[mt]}
        write_cols = [(c, dt) for c, dt, gen, _ in pcols if not gen]
        common = [(c, dt, mcols[c.lower()]) for c, dt in write_cols if c.lower() in mcols]
        only_pg = [c for c, _ in write_cols if c.lower() not in mcols]
        only_ms = [c for c in mcols if c not in {x.lower() for x, _ in write_cols} and c not in {x.lower() for x, _, g, _ in pcols if g}]
        if only_pg: report["columns_only_in_pg"][pt] = only_pg
        if only_ms: report["columns_only_in_sqlserver"][pt] = [mcols[c][0] for c in only_ms]
        if not common:
            report["copied"][pt] = 0; continue

        mcur.execute("SELECT " + ", ".join(f"[{mc}]" for _, _, (mc, _) in common) + f" FROM [dbo].[{mt}]")
        rows = mcur.fetchall()
        if rows:
            cols_sql = sql.SQL(", ").join(sql.Identifier(c) for c, _, _ in common)
            copy_stmt = sql.SQL("COPY {}.{} ({}) FROM STDIN").format(sql.Identifier(SCHEMA), sql.Identifier(pt), cols_sql)
            with pcur.copy(copy_stmt) as cp:
                for r in rows:
                    cp.write_row(tuple(convert(v, pdt) for v, (_, pdt, _) in zip(r, common)))
        report["copied"][pt] = len(rows)
        print(f"{pt:40s} {len(rows):6d}", file=sys.stderr)

    pcur.execute("SET session_replication_role = DEFAULT")

    # reset identity sequences to max(id)
    pcur.execute("""SELECT table_name, column_name FROM information_schema.columns
                    WHERE table_schema=%s AND is_identity='YES'""", (SCHEMA,))
    for t, c in pcur.fetchall():
        pcur.execute(sql.SQL("SELECT setval(pg_get_serial_sequence({}, {}), COALESCE((SELECT MAX({}) FROM {}.{}), 0) + 1, false)")
                     .format(sql.Literal(f'{SCHEMA}."{t}"'), sql.Literal(c), sql.Identifier(c), sql.Identifier(SCHEMA), sql.Identifier(t)))

    # computed columns: compare SQL Server stored value with Postgres generated value
    for pt, pcols in pg_tables.items():
        gen = [c for c, _, g, _ in pcols if g]
        mt = ms_lower.get(pt.lower())
        if not gen or not mt: continue
        for g in gen:
            mcur.execute(f"SELECT [Id], [{g}] FROM [dbo].[{mt}] ORDER BY [Id]")
            ms_vals = dict(mcur.fetchall())
            pcur.execute(sql.SQL("SELECT {}, {} FROM {}.{}").format(sql.Identifier("Id"), sql.Identifier(g), sql.Identifier(SCHEMA), sql.Identifier(pt)))
            diff = [(i, ms_vals.get(i), v) for i, v in pcur.fetchall() if ms_vals.get(i) != v]
            if diff: report["computed_mismatch"][f"{pt}.{g}"] = diff[:5]

    pg.commit()
    total = sum(report["copied"].values())
    report["total_rows"] = total
    print(json.dumps(report, indent=2, default=str))
    print(f"\nTOTAL rows copied: {total} across {len(report['copied'])} tables", file=sys.stderr)

def convert(v, pg_type):
    if v is None: return None
    if pg_type == "boolean":
        return bool(v)
    if pg_type == "ARRAY":                       # SQL Server stored these List<int> columns as JSON text: "[1,2]"
        if isinstance(v, str):
            v = v.strip()
            return json.loads(v) if v.startswith("[") else ([int(x) for x in v.split(",") if x.strip()] if v else [])
        return v
    if isinstance(v, (bytes, bytearray)):
        return bytes(v) if pg_type == "bytea" else v.decode("utf-8", "replace")
    if pg_type in ("text", "character varying") and not isinstance(v, str):
        return str(v)
    if pg_type in ("timestamp without time zone", "timestamp with time zone") and isinstance(v, datetime.datetime):
        return v.replace(tzinfo=None)
    if pg_type == "date" and isinstance(v, datetime.datetime):
        return v.date()
    if pg_type == "uuid" and isinstance(v, (bytes, str)):
        return uuid.UUID(bytes_le=v) if isinstance(v, bytes) else v
    return v

if __name__ == "__main__":
    main()
