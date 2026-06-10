import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized({ token }) {
      // Allow access only if signed in with a @monstar-lab.com account
      return !!token && (token.email as string)?.endsWith('@monstar-lab.com');
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
});

// Protect every /admin route
export const config = {
  matcher: ['/admin/:path*'],
};
