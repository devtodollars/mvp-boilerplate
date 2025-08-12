import { useAuth } from '@/components/providers/AuthProvider';

/**
 * Custom hook that returns the current user from AuthProvider context
 * This prevents unnecessary auth.getUser() calls throughout the app
 * Use this instead of calling supabase.auth.getUser() directly
 */
export const useAuthUser = () => {
  const { user, isLoading } = useAuth();
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user
  };
};