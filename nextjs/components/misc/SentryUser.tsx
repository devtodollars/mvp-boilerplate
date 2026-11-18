'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { setSentryUser } from '@/utils/sentry';

// Keeps the Sentry user on browser events in sync with the Supabase session,
// so issues show which user hit them and how many users are affected.
export default function SentryUser() {
  useEffect(() => {
    const {
      data: { subscription }
    } = createClient().auth.onAuthStateChange((_event, session) => {
      setSentryUser(session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  return null;
}
