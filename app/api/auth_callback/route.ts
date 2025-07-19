import { getURL } from '@/utils/helpers';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // The `/api/auth_callback` route is required for the server-side auth flow implemented
  // by the `@supabase/ssr` package. It exchanges an auth code for the user's session.
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const errorMessage = requestUrl.searchParams.get('error_description');

  try {
    if (code) {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;

      // Check if user has a complete profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        // If user doesn't have a profile or is missing essential fields, redirect to account creation
        if (!userProfile || !userProfile.first_name) {
          return NextResponse.redirect(getURL('/auth/account_creation'));
        }
      }

      // If user has a complete profile, redirect to home
      return NextResponse.redirect(getURL('/'));

    } else if (errorMessage) {
      throw new Error(errorMessage);
    }
  } catch (e) {
    if (!(e instanceof Error)) throw e;
    return NextResponse.redirect(
      getURL(
        `/auth/signin?toast_title=Error&toast_description=${e.message}&toast_variant=destructive`
      )
    );
  }

  return NextResponse.redirect(getURL('/'));
}
