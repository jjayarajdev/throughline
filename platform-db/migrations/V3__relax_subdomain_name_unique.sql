-- Legacy data has the same sub-domain name under several domains (8 groups), so the
-- model's unique index on M_SubDomains.Name cannot hold. Keep it as a plain index.
DROP INDEX IF EXISTS throughline."IX_M_SubDomains_Name";
CREATE INDEX "IX_M_SubDomains_Name" ON throughline."M_SubDomains" ("Name");
