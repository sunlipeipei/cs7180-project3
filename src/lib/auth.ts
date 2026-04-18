import { auth, currentUser } from '@clerk/nextjs/server';

export type AuthResult = { userId: string | null };

export type CurrentUserResult = {
  emailAddresses: { emailAddress: string }[];
} | null;

export function isDevBypass(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.DEV_AUTH_BYPASS === '1'
  );
}

export async function getAuth(): Promise<AuthResult> {
  if (isDevBypass()) {
    return { userId: process.env.DEV_USER_ID ?? 'dev_user_local' };
  }
  const { userId } = await auth();
  return { userId };
}

export async function getCurrentUser(): Promise<CurrentUserResult> {
  if (isDevBypass()) {
    return { emailAddresses: [{ emailAddress: 'dev@local' }] };
  }
  const user = await currentUser();
  if (!user) return null;
  return {
    emailAddresses: user.emailAddresses.map((e) => ({
      emailAddress: e.emailAddress,
    })),
  };
}
