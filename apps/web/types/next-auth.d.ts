// Module augmentation so our custom fields are typed everywhere instead of
// requiring `session.accessToken`. These are populated in the
// callbacks in lib/auth.ts (authorize → jwt → session).
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    userId?: string;
    role?: string;
  }

  // The object returned from `authorize` / OAuth, before it's folded into the JWT.
  interface User {
    id?: string;
    role?: string;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    userId?: string;
    role?: string;
  }
}
