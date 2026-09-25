/*
  EpiCenter — minimal seed to enable login on a freshly-generated (Option B) schema.

  Creates:
    - an ADMIN role with RoleId = 1 (matches Domain/Enums ROLES.ADMIN = 1, and the
      UI gates on the role NAME 'ADMIN')
    - one user (default: jjayaraj@gmail.com)
    - the user<->ADMIN mapping in UserRolesMapping (DbSet name => table name)

  Auth note: the backend's AuthService ignores the password entirely, so no password
  hash is needed — any password works at the login screen for this email.

  Tables/columns below match the EF model with default conventions (schema = dbo,
  table = DbSet property name). If you restored a REAL database (Option A) instead of
  generating the schema, the table names may differ — adjust accordingly.

  Edit @Email below to use your own address if you don't want the default.
*/

SET NOCOUNT ON;

DECLARE @Email   NVARCHAR(256) = N'jjayaraj@gmail.com';
DECLARE @Name    NVARCHAR(256) = N'Local Admin';
DECLARE @RoleId  INT           = 1;            -- ROLES.ADMIN
DECLARE @UserId  INT;

-------------------------------------------------------------------------------
-- 1. ADMIN role (force RoleId = 1 via IDENTITY_INSERT so it matches the enum)
-------------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleId = @RoleId)
BEGIN
    SET IDENTITY_INSERT dbo.Roles ON;
    INSERT INTO dbo.Roles (RoleId, RoleName, IsActive, CanOnHold, CreatedBy, CreatedAt)
    VALUES (@RoleId, N'ADMIN', 1, 0, 1, SYSUTCDATETIME());
    SET IDENTITY_INSERT dbo.Roles OFF;
    PRINT 'Inserted ADMIN role (RoleId=1).';
END
ELSE
    PRINT 'ADMIN role already present — skipped.';

-------------------------------------------------------------------------------
-- 2. Admin user
-------------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Email = @Email)
BEGIN
    INSERT INTO dbo.Users (Username, Email, FullName, FirstName, IsActive, CreatedBy, CreatedAt)
    VALUES (N'admin', @Email, @Name, N'Local', 1, 1, SYSUTCDATETIME());
    PRINT 'Inserted user ' + @Email + '.';
END
ELSE
    PRINT 'User already present — skipped.';

SELECT @UserId = UserId FROM dbo.Users WHERE Email = @Email;

-------------------------------------------------------------------------------
-- 3. Map user -> ADMIN role
-------------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.UserRolesMapping WHERE UserId = @UserId AND RoleId = @RoleId)
BEGIN
    INSERT INTO dbo.UserRolesMapping (UserId, RoleId, PartnerId, IsActive, AssignedAt, CreatedBy, CreatedAt)
    VALUES (@UserId, @RoleId, NULL, 1, SYSUTCDATETIME(), 1, SYSUTCDATETIME());
    PRINT 'Mapped user to ADMIN.';
END
ELSE
    PRINT 'User-role mapping already present — skipped.';

PRINT 'Seed complete. Log in at the UI with ' + @Email + ' and any password.';
