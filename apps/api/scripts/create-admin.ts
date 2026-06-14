/* eslint-disable no-console */
// Usage: pnpm tsx apps/api/scripts/create-admin.ts <email> <password>
// Bootstraps a PLATFORM_ADMIN on a fresh deployment (where no user exists yet
// to promote with make-admin). Idempotent: re-running updates the role +
// password and clears any soft-delete. Admins have no studentProfile.
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

async function main() {
  const email = process.argv[2]?.toLowerCase();
  const password = process.argv[3];
  if (!email || !password) {
    console.error('Usage: pnpm tsx apps/api/scripts/create-admin.ts <email> <password>');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.upsert({
      where: { email },
      update: { role: 'PLATFORM_ADMIN', passwordHash, emailVerified: new Date(), deletedAt: null },
      create: { email, role: 'PLATFORM_ADMIN', passwordHash, emailVerified: new Date() },
    });
    console.log(`Admin ready: ${user.email} (${user.role})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
