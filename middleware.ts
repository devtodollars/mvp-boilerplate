import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Only update session for pages that need authentication
  // Skip static files, API routes, and other non-page requests
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for static files, API routes, and other non-essential paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') || // Skip files with extensions
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return;
  }

  // Only update session for pages that actually need authentication
  const authRequiredPaths = [
    '/dashboard',
    '/applications',
    '/listroom',
    '/edit-listing',
    '/chat',
    '/account',
    '/profile'
  ];

  const needsAuth = authRequiredPaths.some(path => pathname.startsWith(path));
  
  if (needsAuth) {
    return await updateSession(request);
  }

  // For other pages, just continue without auth check
  return;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - golet-app.png (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|golet-app.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
