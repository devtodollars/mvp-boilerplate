import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/landing/Navbar';
import { AuthForm } from '@/components/misc/AuthForm';
import { AuthState } from '@/utils/types';

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
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user && currState !== 'update_password') {
    return redirect('/');
  } else if (!user && currState === 'update_password') {
    return redirect('/auth');
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar user={user} />
      <div className="flex grow justify-center items-center">
        <AuthForm state={currState} />
      </div>
    </div>
  );
}
