import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      // Only lets the request through if there's a valid session token.
      // Anonymous users get redirected to /signin (pages.signIn in authOptions).
      authorized: ({ token }) => !!token
    }
  }
);

// Every route that touches user data or triggers a scan is protected here.
// Auth routes themselves and static assets are intentionally excluded.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/scan/:path*',
    '/api/user/:path*'
  ]
};