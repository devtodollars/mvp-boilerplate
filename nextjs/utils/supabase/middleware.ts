import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

// Refreshes the Supabase auth session and forwards any rotated auth cookies to
// both the request (so Server Components downstream see the new session) and the
// response (so the browser stores it).
//
// The response is rebuilt inside `setAll` and read from the closure at the very
// end, not captured up front. Reading it any earlier drops the refreshed
// cookies, because `getUser()` is what triggers the rotation.
export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          }
        }
      }
    );

    // Refreshes the session when expired. Required for Server Components, which
    // cannot write cookies themselves.
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    await supabase.auth.getUser();
  } catch {
    // Anything thrown here (missing env vars, Supabase unreachable, a bad SDK
    // upgrade) must not take the whole site down with a 500. Serve the request
    // unauthenticated instead: a proxy that 5xxs on robots.txt tells Google to
    // stop crawling the host entirely.
    return NextResponse.next({ request });
  }

  return response;
};
