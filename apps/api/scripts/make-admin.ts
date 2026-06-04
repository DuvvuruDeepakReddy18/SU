/* eslint-disable no-console */
// Usage: pnpm tsx apps/api/scripts/make-admin.ts <email>
// Promotes the given email to PLATFORM_ADMIN. Idempotent — running twice
// on the same email is a no-op.

import { PrismaClient } from '@prisma/client';

async function main() {
  const email = process.argv[2]?.toLowerCase();
  if (!email) {
    console.error('Usage: pnpm tsx apps/api/scripts/make-admin.ts <email>');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`No user found with email ${email}. Sign up first.`);
      process.exit(1);
    }
    if (user.role === 'PLATFORM_ADMIN') {
      console.log(`${email} is already a PLATFORM_ADMIN.`);
      return;
    }
    await prisma.user.update({
      where: { email },
      data: { role: 'PLATFORM_ADMIN' },
    });
    console.log(`Promoted ${email} to PLATFORM_ADMIN.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
