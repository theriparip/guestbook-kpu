import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Get custom admin path from environment variable
  // Default to 'admin-kpu-2025' if not set
  const customAdminPath = process.env.NEXT_PUBLIC_ADMIN_PATH || 'admin-kpu-2025';
  const adminPath = `/${customAdminPath}`;

 
  // If accessing custom admin path, rewrite to internal admin panel
  if (pathname === adminPath) {
    return NextResponse.rewrite(new URL('/admin-internal', request.url));
  }

  // Block direct access to internal admin panel
  if (pathname === '/admin-internal') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect old /admin path to home (security: don't reveal real path)
  if (pathname === '/admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
