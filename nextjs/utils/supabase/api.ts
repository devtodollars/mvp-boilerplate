import { Database } from '@/types_db';
import { Provider, SupabaseClient } from '@supabase/supabase-js';
import { getURL } from '@/utils/helpers';

export const createApiClient = (supabase: SupabaseClient<Database>) => {
  // captchaToken is required by Supabase once CAPTCHA protection is enabled
  // (Auth > Attack Protection). It is optional here so local dev works without it.
  const passwordSignup = async (
    creds: { email: string; password: string },
    captchaToken?: string
  ) => {
    const res = await supabase.auth.signUp({
      ...creds,
      options: {
        emailRedirectTo: getURL('/api/auth_callback'),
        captchaToken
      }
    });
    if (res.error) throw res.error;
    return res.data;
  };
  const passwordSignin = async (
    creds: { email: string; password: string },
    captchaToken?: string
  ) => {
    const res = await supabase.auth.signInWithPassword({
      ...creds,
      options: { captchaToken }
    });
    if (res.error) throw res.error;
    return res.data;
  };
  const passwordReset = async (email: string, captchaToken?: string) => {
    const res = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getURL('/api/reset_password'),
      captchaToken
    });
    if (res.error) throw res.error;
    return res.data;
  };
  const passwordUpdate = async (password: string) => {
    const res = await supabase.auth.updateUser({ password });
    if (res.error) throw res.error;
    return res.data;
  };
  const oauthSignin = async (provider: Provider) => {
    const res = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getURL('/api/auth_callback')
      }
    });
    if (res.error) throw res.error;
    return res.data;
  };
  const signOut = async () => {
    const res = await supabase.auth.signOut();
    if (res.error) throw res.error;
    return res;
  };
  const resendEmailVerification = async (
    email: string,
    captchaToken?: string
  ) => {
    const res = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getURL('/api/auth_callback'),
        captchaToken
      }
    });
    if (res.error) throw res.error;
    return res.data;
  };

  return {
    passwordSignin,
    passwordSignup,
    passwordReset,
    passwordUpdate,
    oauthSignin,
    signOut,
    resendEmailVerification
  };
};
