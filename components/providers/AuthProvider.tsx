'use client';
import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
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
  const initializedRef = useRef(false);
  const userRef = useRef<User | null>(null);
  
  // Create a stable Supabase client instance
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current) return;
    initializedRef.current = true;

    let mounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      const newUser = session?.user ?? null;
      
      // Only update state if user actually changed
      if (userRef.current?.id !== newUser?.id) {
        userRef.current = newUser;
        setUser(newUser);
      }
      
      if (event === 'SIGNED_OUT') {
        setIsLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        setIsLoading(false);
      }
    });

    // Get initial session without additional auth calls
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (error) {
          console.error('Session error:', error);
          const newUser = null;
          if (userRef.current !== newUser) {
            userRef.current = newUser;
            setUser(newUser);
          }
        } else {
          const newUser = session?.user ?? null;
          if (userRef.current?.id !== newUser?.id) {
            userRef.current = newUser;
            setUser(newUser);
          }
        }
      } catch (error) {
        console.error('Failed to get initial session:', error);
        setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    
    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Memoize signOut function to prevent unnecessary re-renders
  const signOut = useCallback(async () => {
    try {
      // Clear API cache for the current user before signing out
      if (user?.id) {
        const { apiCache } = await import('@/utils/cache/apiCache');
        apiCache.clearUser(user.id);
      }
      
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [supabase, user?.id]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ 
    user, 
    isLoading, 
    signOut 
  }), [user, isLoading, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
}; 