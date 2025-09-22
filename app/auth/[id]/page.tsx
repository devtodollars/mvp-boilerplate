import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/landing/Navbar';
import { EnhancedAuthForm } from '@/components/misc/enhancedAuthForm';
import { AuthState } from '@/utils/types';
import { getCachedUser } from '@/utils/supabase/serverAuth';

// Force dynamic rendering since we need cookies
export const dynamic = 'force-dynamic';

export default async function SignIn(
  props: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ disable_button: boolean }>;
  }
) {
  const params = await props.params;
  if (!Object.values(AuthState).includes(params.id as AuthState)) {
    redirect('/auth');
  }
  const currState = params.id as AuthState;

  // Check if the user is already logged in and redirect to the account page if so
  const user = await getCachedUser();

  if (user && currState !== AuthState.ProfileSetup) {
    return redirect('/');
  } else if (!user && currState === AuthState.ProfileSetup) {
    return redirect('/auth');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <EnhancedAuthForm state={currState} />
      </div>
    </div>
  );
}
