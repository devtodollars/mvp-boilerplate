import { getURL } from '@/utils/helpers';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // The `/api/auth_callback` route is required for the server-side auth flow implemented
  // by the `@supabase/ssr` package. It exchanges an auth code for the user's session.
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const errorMessage = requestUrl.searchParams.get('error_description');

  try {
    if (code) {
      // Handle OAuth flow
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;

      // For OAuth users, always redirect to profile creation
      // This ensures all OAuth users go through the profile setup process
      console.log('OAuth user signed in, redirecting to profile creation');
      return NextResponse.redirect(getURL('/auth?toast_title=Welcome&toast_description=Please complete your profile setup&toast_variant=default'));

    } else if (token_hash && type) {
      // Handle email confirmation flow
      const supabase = await createClient();
      
      // Confirm the email
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });
      
      if (error) {
        console.error('Email confirmation error:', error);
        throw error;
      }

      // Check if we have a valid session
      if (!data.session) {
        console.error('No session after email confirmation');
        throw new Error('Failed to create session after email confirmation');
      }

      // Check if user has a complete profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const { data: userProfile } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();

          // If user doesn't have a profile or is missing essential fields, redirect to auth page
          if (!userProfile || !userProfile.first_name) {
            return NextResponse.redirect(getURL('/auth?toast_title=Welcome&toast_description=Please complete your profile setup&toast_variant=default'));
          }
        } catch (profileError) {
          console.error('Profile check error:', profileError);
          // If profile check fails, redirect to auth page
          return NextResponse.redirect(getURL('/auth?toast_title=Welcome&toast_description=Please complete your profile setup&toast_variant=default'));
        }
      }

      // If user has a complete profile, redirect to home with success message
      return NextResponse.redirect(getURL('/?toast_title=Success&toast_description=Email confirmed successfully!&toast_variant=default'));

    } else if (errorMessage) {
      throw new Error(errorMessage);
    }
  } catch (e) {
    console.error('Auth callback error:', e);
    if (!(e instanceof Error)) throw e;
    return NextResponse.redirect(
      getURL(
        `/auth/signin?toast_title=Error&toast_description=${encodeURIComponent(e.message)}&toast_variant=destructive`
      )
    );
  }

  return NextResponse.redirect(getURL('/'));
}
