/**
 * unblock-user — dev helper to manually activate a stuck account.
 *
 * When the console email provider scrolls past the verification link
 * (or was never seen), developers can end up with a
 * `pending_verification` account that the login gate rightly refuses
 * to let through. This script flips the account to `active` +
 * `emailVerified=true` and clears the verify token, mimicking a
 * successful click on the email link.
 *
 * Never use this in production — it bypasses email ownership proof.
 *
 * Usage:
 *   npx tsx apps/api/scripts/unblock-user.ts <email>
 */
import { prisma } from '../src/config/prisma.js';

async function main(): Promise<void> {
  const email = process.argv[2];
  if (!email) {
    console.error(
      'Usage: npx tsx apps/api/scripts/unblock-user.ts <email>',
    );
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    console.error(`No user found with email: ${email}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Before: email=${existing.email} status=${existing.status} emailVerified=${existing.emailVerified}`,
  );

  const updated = await prisma.user.update({
    where: { email },
    data: {
      status: 'active',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerifyToken: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  console.log(
    `After : email=${updated.email} status=${updated.status} emailVerified=${updated.emailVerified}`,
  );
  console.log('Account unblocked. You can now log in.');
}

main()
  .catch((err) => {
    console.error('unblock-user crashed:', err);
    process.exitCode = 2;
  })
  .finally(() => prisma.$disconnect());
