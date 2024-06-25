import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/landing/Navbar';
import { AuthForm } from '@/components/misc/AuthForm';
import { AuthState } from '@/utils/types';
import Image from 'next/image';
import Link from "next/link";

import FluidEvents from '@/components/icons/FluidEvents';


export default async function SignIn({
  params
}: {
  params: { id: string };
  searchParams: { disable_button: boolean };
}) {
  if (!Object.values(AuthState).includes(params.id as AuthState)) {
    redirect('/auth');
  }
  const currState = params.id as AuthState;

  // Check if the user is already logged in and redirect to the account page if so
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user && currState !== 'update_password') {
    return redirect('/');
  } else if (!user && currState === 'update_password') {
    return redirect('/auth');
  }

  return (
    // original code with state setup
    // <div className="flex flex-col h-screen">
    //   <Navbar user={user} />
    //   <div className="flex grow justify-center items-center">
    //     <AuthForm state={currState} />
    //   </div>
    // </div>

    <>
      <div className="md:hidden">
      <Image
        src="/examples/authentication-light.png"
        width={1280}
        height={843}
        alt="Authentication"
        className="block dark:hidden"
      />
      <Image
        src="/examples/authentication-dark.png"
        width={1280}
        height={843}
        alt="Authentication"
        className="hidden dark:block"
      />
      </div>
      <div className="container relative hidden h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href="/examples/authentication"
        className="absolute right-4 top-4 md:right-8 md:top-8"
          // changed this class name
        >
          Login
        </Link>
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-zinc-500" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <FluidEvents        
              width={200}
              height={40}
            />
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;Make your own events and invite the public to join your events.&rdquo;
              </p>
              <footer className="text-sm">Fluid Events</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Create an account
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your email below to create your account
              </p>
            </div>
            <AuthForm state={currState} />
            <p className="px-8 text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
