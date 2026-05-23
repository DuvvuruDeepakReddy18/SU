/* eslint-disable no-console */
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

async function main() {
  const p = new PrismaClient();
  const hash = bcrypt.hashSync('password123', 10);
  const r = await p.user.updateMany({ where: {}, data: { passwordHash: hash } });
  console.log('updated', r.count, 'users; password is now "password123"');
  await p.$disconnect();
}
main();
