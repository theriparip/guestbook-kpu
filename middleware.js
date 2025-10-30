import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Get custom admin path from environment variable
  // Default to 'admin-kpu-2025' if not set
  const customAdminPath = process.env.NEXT_PUBLIC_ADMIN_PATH || 'admin-kpu-2025';
  const adminPath = `/${customAdminPath}`;

  // Debug logging
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Middleware Debug:');
  console.log('Requested pathname:', pathname);
  console.log('Custom admin path:', adminPath);
  console.log('Env ADMIN_PATH:', process.env.NEXT_PUBLIC_ADMIN_PATH);
  console.log('Match?', pathname === adminPath);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // If accessing custom admin path, rewrite to internal admin panel
  if (pathname === adminPath) {
    console.log('✅ REWRITING to /admin-internal');
    return NextResponse.rewrite(new URL('/admin-internal', request.url));
  }

  // Block direct access to internal admin panel
  if (pathname === '/admin-internal') {
    console.log('❌ BLOCKING direct access to /admin-internal');
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect old /admin path to home (security: don't reveal real path)
  if (pathname === '/admin') {
    console.log('❌ REDIRECTING /admin to home');
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.log('⏭️ NEXT - No middleware action');
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
