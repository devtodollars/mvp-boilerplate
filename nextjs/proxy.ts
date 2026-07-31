import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml (crawler metadata files)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     *
     * robots.txt and sitemap.xml are excluded deliberately. Auth session
     * refresh has no business running on them, and if the proxy ever fails
     * to invoke, a 5xx on robots.txt tells Google to stop crawling the whole
     * host. Keeping them off the matcher means they serve even when the proxy
     * is broken.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
