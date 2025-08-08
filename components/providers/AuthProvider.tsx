'use client';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

const AuthContext = createContext<{ 
  user: User | null; 
  isLoading: boolean;
  signOut: () => Promise<void>;
}>({ 
  user: null,
  isLoading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create a stable Supabase client instance
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT') {
        // Clear user state immediately on sign out
        setUser(null);
        setIsLoading(false);
      } else {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    // Check initial session with error handling
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Handle refresh token errors gracefully
        if (error.code === 'refresh_token_not_found' || 
            error.message?.includes('Invalid Refresh Token')) {
          console.log('No valid session found on initial load');
          setUser(null);
        } else {
          console.error('Session error:', error);
        }
      } else {
        setUser(session?.user ?? null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Remove the dependency array entirely since supabase is now stable

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = { user, isLoading, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
}; 