import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const ALLOWED_DOMAIN = 'monstar-lab.com';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // Block sign-in from non-Monstarlab accounts
    signIn({ user }) {
      return user.email?.endsWith(`@${ALLOWED_DOMAIN}`) ?? false;
    },

    // Expose email in the client-side session
    session({ session }) {
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error:  '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge:   8 * 60 * 60, // 8 hours — typical working day
  },
};
