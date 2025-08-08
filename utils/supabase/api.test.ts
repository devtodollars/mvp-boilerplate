import { createApiClient } from './api';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock the helpers module
jest.mock('@/utils/helpers', () => ({
  getURL: jest.fn().mockReturnValue('http://localhost:3000/api/auth_callback'),
}));

// Mock fetch globally
(global as any).fetch = jest.fn();

describe('API Client', () => {
  let mockSupabaseClient: any;
  let apiClient: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock Supabase client
    mockSupabaseClient = {
      auth: {
        signUp: jest.fn(),
        verifyOtp: jest.fn(),
        signInWithPassword: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        updateUser: jest.fn(),
        signInWithOAuth: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
        upsert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn(),
        order: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
      }),
      rpc: jest.fn(),
    };

    apiClient = createApiClient(mockSupabaseClient);
  });

  describe('createApiClient', () => {
    it('should throw error when supabase client is not provided', () => {
      expect(() => createApiClient(null as any)).toThrow('Supabase client is required');
    });

    it('should create API client successfully', () => {
      expect(apiClient).toBeDefined();
      expect(typeof apiClient.passwordSignup).toBe('function');
      expect(typeof apiClient.passwordSignin).toBe('function');
      expect(typeof apiClient.signOut).toBe('function');
    });
  });

  describe('passwordSignup', () => {
    it('should sign up user successfully', async () => {
      const mockCredentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { data: { user: { id: '123' } }, error: null };
      
      mockSupabaseClient.auth.signUp.mockResolvedValue(mockResponse);

      const result = await apiClient.passwordSignup(mockCredentials);

      expect(result).toEqual(mockResponse.data);
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost:3000/api/auth_callback'
        }
      });
    });

    it('should throw error when credentials are not provided', async () => {
      await expect(apiClient.passwordSignup(null)).rejects.toThrow('Credentials are required for signup');
    });

    it('should throw error when email is not provided', async () => {
      const mockCredentials = { password: 'password123' };
      
      await expect(apiClient.passwordSignup(mockCredentials)).rejects.toThrow('Valid email is required for signup');
    });

    it('should throw error when password is not provided', async () => {
      const mockCredentials = { email: 'test@example.com' };
      
      await expect(apiClient.passwordSignup(mockCredentials)).rejects.toThrow('Valid password is required for signup');
    });

    it('should throw error when password is too short', async () => {
      const mockCredentials = { email: 'test@example.com', password: '123' };
      
      await expect(apiClient.passwordSignup(mockCredentials)).rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should handle user already registered error', async () => {
      const mockCredentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { 
        data: null, 
        error: { message: 'User already registered' } 
      };
      
      mockSupabaseClient.auth.signUp.mockResolvedValue(mockResponse);

      await expect(apiClient.passwordSignup(mockCredentials)).rejects.toThrow('An account with this email already exists. Please sign in instead.');
    });

    it('should handle email not confirmed error', async () => {
      const mockCredentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { 
        data: null, 
        error: { message: 'Email not confirmed' } 
      };
      
      mockSupabaseClient.auth.signUp.mockResolvedValue(mockResponse);

      await expect(apiClient.passwordSignup(mockCredentials)).rejects.toThrow('Please check your email and click the confirmation link to complete your registration.');
    });

    it('should handle signup disabled error', async () => {
      const mockCredentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { 
        data: null, 
        error: { message: 'Signup disabled' } 
      };
      
      mockSupabaseClient.auth.signUp.mockResolvedValue(mockResponse);

      await expect(apiClient.passwordSignup(mockCredentials)).rejects.toThrow('Signup is currently disabled. Please contact support.');
    });

    it('should handle invalid email error', async () => {
      const mockCredentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { 
        data: null, 
        error: { message: 'Invalid email' } 
      };
      
      mockSupabaseClient.auth.signUp.mockResolvedValue(mockResponse);

      await expect(apiClient.passwordSignup(mockCredentials)).rejects.toThrow('Please enter a valid email address.');
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      const mockResponse = { data: { user: { id: '123' } }, error: null };
      
      mockSupabaseClient.auth.verifyOtp.mockResolvedValue(mockResponse);

      const result = await apiClient.verifyOtp('test@example.com', '123456');

      expect(result).toEqual(mockResponse.data);
      expect(mockSupabaseClient.auth.verifyOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        token: '123456',
        type: 'email'
      });
    });

    it('should throw error when email is not provided', async () => {
      await expect(apiClient.verifyOtp('', '123456')).rejects.toThrow('Valid email is required for OTP verification');
    });

    it('should throw error when token is not provided', async () => {
      await expect(apiClient.verifyOtp('test@example.com', '')).rejects.toThrow('Valid token is required for OTP verification');
    });

    it('should handle invalid OTP error', async () => {
      const mockResponse = { 
        data: null, 
        error: { message: 'Invalid OTP' } 
      };
      
      mockSupabaseClient.auth.verifyOtp.mockResolvedValue(mockResponse);

      await expect(apiClient.verifyOtp('test@example.com', '123456')).rejects.toThrow('Invalid verification code. Please check your email and try again.');
    });

    it('should handle token expired error', async () => {
      const mockResponse = { 
        data: null, 
        error: { message: 'Token expired' } 
      };
      
      mockSupabaseClient.auth.verifyOtp.mockResolvedValue(mockResponse);

      await expect(apiClient.verifyOtp('test@example.com', '123456')).rejects.toThrow('Verification code has expired. Please request a new one.');
    });
  });

  describe('passwordSignin', () => {
    it('should sign in user successfully', async () => {
      const mockCredentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { data: { user: { id: '123' } }, error: null };
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockResponse);

      const result = await apiClient.passwordSignin(mockCredentials);

      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error when credentials are not provided', async () => {
      await expect(apiClient.passwordSignin(null)).rejects.toThrow('Credentials are required for signin');
    });

    it('should throw error when email is not provided', async () => {
      const mockCredentials = { password: 'password123' };
      
      await expect(apiClient.passwordSignin(mockCredentials)).rejects.toThrow('Valid email is required for signin');
    });

    it('should throw error when password is not provided', async () => {
      const mockCredentials = { email: 'test@example.com' };
      
      await expect(apiClient.passwordSignin(mockCredentials)).rejects.toThrow('Valid password is required for signin');
    });

    it('should handle invalid login credentials error', async () => {
      const mockCredentials = { email: 'test@example.com', password: 'wrongpassword' };
      const mockResponse = { 
        data: null, 
        error: { message: 'Invalid login credentials' } 
      };
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockResponse);

      await expect(apiClient.passwordSignin(mockCredentials)).rejects.toThrow('Invalid email or password. Please try again.');
    });
  });

  describe('passwordReset', () => {
    it('should reset password successfully', async () => {
      const mockResponse = { data: {}, error: null };
      
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue(mockResponse);

      const result = await apiClient.passwordReset('test@example.com');

      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error when email is not provided', async () => {
      await expect(apiClient.passwordReset('')).rejects.toThrow('Valid email is required for password reset');
    });

    it('should handle user not found error', async () => {
      const mockResponse = { 
        data: null, 
        error: { message: 'User not found' } 
      };
      
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue(mockResponse);

      await expect(apiClient.passwordReset('nonexistent@example.com')).rejects.toThrow('No account found with this email address.');
    });
  });

  describe('passwordUpdate', () => {
    it('should update password successfully', async () => {
      const mockResponse = { data: { user: { id: '123' } }, error: null };
      
      mockSupabaseClient.auth.updateUser.mockResolvedValue(mockResponse);

      const result = await apiClient.passwordUpdate('newpassword123');

      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error when password is not provided', async () => {
      await expect(apiClient.passwordUpdate('')).rejects.toThrow('Valid password is required for password update');
    });

    it('should throw error when password is too short', async () => {
      await expect(apiClient.passwordUpdate('123')).rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should handle password validation error', async () => {
      const mockResponse = { 
        data: null, 
        error: { message: 'Password should be at least 6 characters' } 
      };
      
      mockSupabaseClient.auth.updateUser.mockResolvedValue(mockResponse);

      await expect(apiClient.passwordUpdate('short')).rejects.toThrow('Password must be at least 6 characters long');
    });
  });

  describe('oauthSignin', () => {
    it('should sign in with OAuth successfully', async () => {
      const mockResponse = { data: { url: 'http://oauth.url' }, error: null };
      
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue(mockResponse);

      const result = await apiClient.oauthSignin('google');

      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error when provider is not provided', async () => {
      await expect(apiClient.oauthSignin('')).rejects.toThrow('Valid provider is required for OAuth signin');
    });

    it('should throw error when provider is invalid', async () => {
      await expect(apiClient.oauthSignin('invalid-provider')).rejects.toThrow('Invalid provider. Supported providers: google, github, facebook, twitter');
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      const mockResponse = { error: null };
      
      mockSupabaseClient.auth.signOut.mockResolvedValue(mockResponse);

      const result = await apiClient.signOut();

      expect(result).toEqual(mockResponse);
    });

    it('should handle sign out error', async () => {
      const mockError = new Error('Sign out failed');
      
      mockSupabaseClient.auth.signOut.mockRejectedValue(mockError);

      await expect(apiClient.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('createUserProfile', () => {
    it('should create user profile successfully', async () => {
      const mockUserData = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '1234567890',
        bio: 'Test bio',
        occupation: 'Developer',
        date_of_birth: '01/01/1990'
      };

      const mockUser = { id: '123' };
      const mockProfileData = { id: '123', first_name: 'John', last_name: 'Doe' };

      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Mock the database operations properly with method chaining
      const mockDb = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        }),
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: [mockProfileData], error: null })
        })
      };
      mockSupabaseClient.from.mockReturnValue(mockDb);

      const result = await apiClient.createUserProfile(mockUserData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProfileData);
    });

    it('should throw error when user data is not provided', async () => {
      await expect(apiClient.createUserProfile(null)).rejects.toThrow('User data is required');
    });

    it('should throw error when email is not provided', async () => {
      const mockUserData = { first_name: 'John', last_name: 'Doe' };
      
      await expect(apiClient.createUserProfile(mockUserData)).rejects.toThrow('Valid email is required');
    });

    it('should throw error when first name is not provided', async () => {
      const mockUserData = { email: 'test@example.com', last_name: 'Doe' };
      
      await expect(apiClient.createUserProfile(mockUserData)).rejects.toThrow('First name is required');
    });

    it('should throw error when last name is not provided', async () => {
      const mockUserData = { email: 'test@example.com', first_name: 'John' };
      
      await expect(apiClient.createUserProfile(mockUserData)).rejects.toThrow('Last name is required');
    });

    it('should handle user not authenticated error', async () => {
      const mockUserData = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(apiClient.createUserProfile(mockUserData)).rejects.toThrow('User not authenticated');
    });
  });

  describe('checkProfileCompletion', () => {
    it('should return completed false when user not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await apiClient.checkProfileCompletion();

      expect(result.completed).toBe(false);
    });

    it('should return completed false when profile does not exist', async () => {
      const mockUser = { id: '123' };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      });

      const result = await apiClient.checkProfileCompletion();

      expect(result.completed).toBe(false);
    });

    it('should return completed true when profile has all required fields', async () => {
      const mockUser = { id: '123' };
      const mockProfile = {
        first_name: 'John',
        last_name: 'Doe',
        phone: '1234567890',
        bio: 'Test bio',
        occupation: 'Developer',
        date_of_birth: '1990-01-01'
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
      });

      const result = await apiClient.checkProfileCompletion();

      expect(result.completed).toBe(true);
      expect(result.profile).toEqual(mockProfile);
    });
  });

  describe('applyToProperty', () => {
    it('should apply to property successfully', async () => {
      const mockUser = { id: '123' };
      const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({ applicationId: 'app-123' }) };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      ((global as any).fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiClient.applyToProperty('listing-123', 'Test notes');

      expect(result.success).toBe(true);
      expect(result.applicationId).toBe('app-123');
    });

    it('should throw error when listing ID is not provided', async () => {
      await expect(apiClient.applyToProperty('', 'Test notes')).rejects.toThrow('Valid listing ID is required');
    });

    it('should handle API error', async () => {
      const mockUser = { id: '123' };
      const mockResponse = { 
        ok: false, 
        json: jest.fn().mockResolvedValue({ error: 'Application failed' }) 
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      ((global as any).fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(apiClient.applyToProperty('listing-123', 'Test notes')).rejects.toThrow('Application failed');
    });
  });

  describe('getUserApplications', () => {
    it('should get user applications successfully', async () => {
      const mockUser = { id: '123' };
      const mockApplications = [{ id: 'app-1', listing: { id: 'listing-1' } }];
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockApplications, error: null })
      });

      const result = await apiClient.getUserApplications();

      expect(result.success).toBe(true);
      expect(result.applications).toEqual(mockApplications);
    });

    it('should throw error when user not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(apiClient.getUserApplications()).rejects.toThrow('User not authenticated');
    });
  });

  describe('getListingApplications', () => {
    it('should get listing applications successfully', async () => {
      const mockUser = { id: '123' };
      const mockListing = { user_id: '123' };
      const mockApplications = [{ id: 'app-1', user: { id: 'user-1' } }];
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockListing, error: null }),
        order: jest.fn().mockResolvedValue({ data: mockApplications, error: null })
      });

      const result = await apiClient.getListingApplications('listing-123');

      expect(result.success).toBe(true);
      expect(result.applications).toEqual(mockApplications);
    });

    it('should throw error when listing ID is not provided', async () => {
      await expect(apiClient.getListingApplications('')).rejects.toThrow('Valid listing ID is required');
    });

    it('should throw error when user not authorized', async () => {
      const mockUser = { id: '123' };
      const mockListing = { user_id: '456' }; // Different user
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockListing, error: null })
      });

      await expect(apiClient.getListingApplications('listing-123')).rejects.toThrow('Unauthorized: You can only view applications for your own listings');
    });
  });

  describe('updateApplicationStatus', () => {
    it('should update application status successfully', async () => {
      const mockUser = { id: '123' };
      const mockResponse = { data: { updated: true }, error: null };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.rpc.mockResolvedValue(mockResponse);

      const result = await apiClient.updateApplicationStatus('app-123', 'accepted', 'Good candidate');

      expect(result.success).toBe(true);
      expect(result.updated).toEqual(mockResponse.data);
    });

    it('should throw error when application ID is not provided', async () => {
      await expect(apiClient.updateApplicationStatus('', 'accepted')).rejects.toThrow('Valid application ID is required');
    });

    it('should throw error when status is invalid', async () => {
      await expect(apiClient.updateApplicationStatus('app-123', 'invalid-status')).rejects.toThrow('Valid status is required: accepted, rejected, or withdrawn');
    });
  });

  describe('withdrawApplication', () => {
    it('should withdraw application successfully', async () => {
      const mockUser = { id: '123' };
      const mockResponse = { data: { updated: true }, error: null };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.rpc.mockResolvedValue(mockResponse);

      const result = await apiClient.withdrawApplication('app-123');

      expect(result.success).toBe(true);
    });

    it('should throw error when application ID is not provided', async () => {
      await expect(apiClient.withdrawApplication('')).rejects.toThrow('Valid application ID is required');
    });
  });

  describe('checkUserApplication', () => {
    it('should return hasApplied true when user has applied', async () => {
      const mockUser = { id: '123' };
      const mockApplication = { id: 'app-123', status: 'pending' };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockApplication, error: null })
      });

      const result = await apiClient.checkUserApplication('listing-123');

      expect(result.hasApplied).toBe(true);
      expect(result.application).toEqual(mockApplication);
    });

    it('should return hasApplied false when user has not applied', async () => {
      const mockUser = { id: '123' };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
      });

      const result = await apiClient.checkUserApplication('listing-123');

      expect(result.hasApplied).toBe(false);
      expect(result.application).toBeNull();
    });

    it('should throw error when listing ID is not provided', async () => {
      await expect(apiClient.checkUserApplication('')).rejects.toThrow('Valid listing ID is required');
    });
  });

  describe('toggleLikeListing', () => {
    it('should like listing successfully', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: [] };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Mock the database operations properly with method chaining
      const mockSelectChain = {
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
        })
      };
      
      const mockUpdateChain = {
        eq: jest.fn().mockResolvedValue({ error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelectChain),
        update: jest.fn().mockReturnValue(mockUpdateChain)
      });

      const result = await apiClient.toggleLikeListing('listing-123');

      expect(result.success).toBe(true);
      expect(result.isLiked).toBe(true);
    });

    it('should unlike listing successfully', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: ['listing-123'] };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Mock the database operations properly with method chaining
      const mockSelectChain = {
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
        })
      };
      
      const mockUpdateChain = {
        eq: jest.fn().mockResolvedValue({ error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelectChain),
        update: jest.fn().mockReturnValue(mockUpdateChain)
      });

      const result = await apiClient.toggleLikeListing('listing-123');

      expect(result.success).toBe(true);
      expect(result.isLiked).toBe(false);
    });

    it('should throw error when listing ID is not provided', async () => {
      await expect(apiClient.toggleLikeListing('')).rejects.toThrow('Valid listing ID is required');
    });
  });

  describe('getUserLikedListings', () => {
    it('should get user liked listings successfully', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: ['listing-1', 'listing-2'] };
      const mockListings = [
        { id: 'listing-1', property_name: 'Property 1' },
        { id: 'listing-2', property_name: 'Property 2' }
      ];
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null }),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      });

      const result = await apiClient.getUserLikedListings();

      expect(result.success).toBe(true);
      expect(result.listings).toEqual(mockListings);
    });

    it('should return empty array when no liked listings', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: [] };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      });

      const result = await apiClient.getUserLikedListings();

      expect(result.success).toBe(true);
      expect(result.listings).toEqual([]);
    });

    it('should handle listings fetch error', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: ['listing-1'] };
      const mockError = new Error('Listings fetch error');
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null }),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValue(mockError)
      });

      await expect(apiClient.getUserLikedListings()).rejects.toThrow('Listings fetch error');
    });

    it('should handle user data error', async () => {
      const mockUser = { id: '123' };
      const mockError = new Error('User data error');
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError })
      });

      await expect(apiClient.getUserLikedListings()).rejects.toThrow('User data error');
    });

    it('should handle user not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(apiClient.getUserLikedListings()).rejects.toThrow('User not authenticated');
    });

    it('should handle user error', async () => {
      const mockError = new Error('User error');
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: mockError });

      await expect(apiClient.getUserLikedListings()).rejects.toThrow('User not authenticated');
    });

    it('should handle user data error', async () => {
      const mockUser = { id: '123' };
      const mockError = new Error('User data error');
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError })
      });

      await expect(apiClient.getUserLikedListings()).rejects.toThrow('User data error');
    });

    it('should handle listings fetch error', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: ['listing-1'] };
      const mockError = new Error('Listings fetch error');
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null }),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValue(mockError)
      });

      await expect(apiClient.getUserLikedListings()).rejects.toThrow('Listings fetch error');
    });

    it('should handle successful listing fetch with console logs', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: ['listing-1', 'listing-2'] };
      const mockListings = [
        { id: 'listing-1', title: 'Listing 1', active: true },
        { id: 'listing-2', title: 'Listing 2', active: false }
      ];
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Mock the first call to get user data
      const mockUserChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      };
      
      // Mock the second call to get all listings (without active filter)
      const mockAllListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      // Mock the third call to get ordered listings
      const mockOrderedListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      mockSupabaseClient.from
        .mockReturnValueOnce(mockUserChain)
        .mockReturnValueOnce(mockAllListingsChain)
        .mockReturnValueOnce(mockOrderedListingsChain);

      const result = await apiClient.getUserLikedListings();

      expect(result.success).toBe(true);
      expect(result.listings).toEqual(mockListings);
    });

    it('should handle successful listing fetch with empty listings', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: ['listing-1'] };
      const mockListings = [];
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Mock the first call to get user data
      const mockUserChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      };
      
      // Mock the second call to get all listings (without active filter)
      const mockAllListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      // Mock the third call to get ordered listings
      const mockOrderedListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      mockSupabaseClient.from
        .mockReturnValueOnce(mockUserChain)
        .mockReturnValueOnce(mockAllListingsChain)
        .mockReturnValueOnce(mockOrderedListingsChain);

      const result = await apiClient.getUserLikedListings();

      expect(result.success).toBe(true);
      expect(result.listings).toEqual([]);
    });

    it('should handle successful listing fetch with listings that have active status', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: ['listing-1'] };
      const mockListings = [
        { id: 'listing-1', title: 'Listing 1', active: true, created_at: '2023-01-01' }
      ];
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Mock the first call to get user data
      const mockUserChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      };
      
      // Mock the second call to get all listings (without active filter)
      const mockAllListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      // Mock the third call to get ordered listings
      const mockOrderedListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      mockSupabaseClient.from
        .mockReturnValueOnce(mockUserChain)
        .mockReturnValueOnce(mockAllListingsChain)
        .mockReturnValueOnce(mockOrderedListingsChain);

      const result = await apiClient.getUserLikedListings();

      expect(result.success).toBe(true);
      expect(result.listings).toEqual(mockListings);
    });

    it('should handle successful listing fetch with multiple listings and detailed logging', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: ['listing-1', 'listing-2', 'listing-3'] };
      const mockListings = [
        { id: 'listing-1', title: 'Listing 1', active: true, created_at: '2023-01-01', views_count: 10 },
        { id: 'listing-2', title: 'Listing 2', active: false, created_at: '2023-01-02', views_count: 5 },
        { id: 'listing-3', title: 'Listing 3', active: true, created_at: '2023-01-03', views_count: 15 }
      ];
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Mock the first call to get user data
      const mockUserChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      };
      
      // Mock the second call to get all listings (without active filter)
      const mockAllListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      // Mock the third call to get ordered listings
      const mockOrderedListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      mockSupabaseClient.from
        .mockReturnValueOnce(mockUserChain)
        .mockReturnValueOnce(mockAllListingsChain)
        .mockReturnValueOnce(mockOrderedListingsChain);

      const result = await apiClient.getUserLikedListings();

      expect(result.success).toBe(true);
      expect(result.listings).toEqual(mockListings);
    });

    it('should handle successful listing fetch with single listing and detailed logging', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: ['listing-1'] };
      const mockListings = [
        { id: 'listing-1', title: 'Single Listing', active: true, created_at: '2023-01-01', views_count: 25 }
      ];
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Mock the first call to get user data
      const mockUserChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      };
      
      // Mock the second call to get all listings (without active filter)
      const mockAllListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      // Mock the third call to get ordered listings
      const mockOrderedListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      mockSupabaseClient.from
        .mockReturnValueOnce(mockUserChain)
        .mockReturnValueOnce(mockAllListingsChain)
        .mockReturnValueOnce(mockOrderedListingsChain);

      const result = await apiClient.getUserLikedListings();

      expect(result.success).toBe(true);
      expect(result.listings).toEqual(mockListings);
    });

    it('should handle successful listing fetch with multiple listings and detailed logging', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: ['listing-1', 'listing-2', 'listing-3'] };
      const mockListings = [
        { id: 'listing-1', title: 'Listing 1', active: true, created_at: '2023-01-01', views_count: 10, description: 'First listing' },
        { id: 'listing-2', title: 'Listing 2', active: false, created_at: '2023-01-02', views_count: 5, description: 'Second listing' },
        { id: 'listing-3', title: 'Listing 3', active: true, created_at: '2023-01-03', views_count: 15, description: 'Third listing' }
      ];
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Mock the first call to get user data
      const mockUserChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      };
      
      // Mock the second call to get all listings (without active filter)
      const mockAllListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      // Mock the third call to get ordered listings
      const mockOrderedListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      mockSupabaseClient.from
        .mockReturnValueOnce(mockUserChain)
        .mockReturnValueOnce(mockAllListingsChain)
        .mockReturnValueOnce(mockOrderedListingsChain);

      const result = await apiClient.getUserLikedListings();

      expect(result.success).toBe(true);
      expect(result.listings).toEqual(mockListings);
    });

    it('should handle successful listing fetch with complex listing data and detailed logging', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: ['listing-1', 'listing-2'] };
      const mockListings = [
        { 
          id: 'listing-1', 
          title: 'Complex Listing 1', 
          active: true, 
          created_at: '2023-01-01', 
          views_count: 25,
          description: 'A very detailed listing with lots of information',
          price: 1500,
          location: 'Downtown',
          amenities: ['wifi', 'parking', 'gym'],
          images: ['image1.jpg', 'image2.jpg'],
          contact_info: {
            phone: '555-1234',
            email: 'contact@listing.com'
          }
        },
        { 
          id: 'listing-2', 
          title: 'Complex Listing 2', 
          active: false, 
          created_at: '2023-01-02', 
          views_count: 15,
          description: 'Another detailed listing',
          price: 1200,
          location: 'Uptown',
          amenities: ['wifi', 'laundry'],
          images: ['image3.jpg'],
          contact_info: {
            phone: '555-5678',
            email: 'contact2@listing.com'
          }
        }
      ];
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Mock the first call to get user data
      const mockUserChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      };
      
      // Mock the second call to get all listings (without active filter)
      const mockAllListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      // Mock the third call to get ordered listings
      const mockOrderedListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      mockSupabaseClient.from
        .mockReturnValueOnce(mockUserChain)
        .mockReturnValueOnce(mockAllListingsChain)
        .mockReturnValueOnce(mockOrderedListingsChain);

      const result = await apiClient.getUserLikedListings();

      expect(result.success).toBe(true);
      expect(result.listings).toEqual(mockListings);
    });

    it('should handle successful listing fetch with multiple listings and detailed logging', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: ['listing-1', 'listing-2', 'listing-3', 'listing-4'] };
      const mockListings = [
        { 
          id: 'listing-1', 
          title: 'Listing 1', 
          active: true, 
          created_at: '2023-01-01', 
          views_count: 10,
          description: 'First listing with detailed info',
          price: 1000,
          location: 'Downtown',
          amenities: ['wifi', 'parking'],
          images: ['image1.jpg'],
          contact_info: { phone: '555-1111', email: 'contact1@listing.com' }
        },
        { 
          id: 'listing-2', 
          title: 'Listing 2', 
          active: false, 
          created_at: '2023-01-02', 
          views_count: 5,
          description: 'Second listing with detailed info',
          price: 1200,
          location: 'Uptown',
          amenities: ['wifi', 'laundry', 'gym'],
          images: ['image2.jpg', 'image3.jpg'],
          contact_info: { phone: '555-2222', email: 'contact2@listing.com' }
        },
        { 
          id: 'listing-3', 
          title: 'Listing 3', 
          active: true, 
          created_at: '2023-01-03', 
          views_count: 15,
          description: 'Third listing with detailed info',
          price: 1500,
          location: 'Midtown',
          amenities: ['wifi', 'parking', 'gym', 'pool'],
          images: ['image4.jpg', 'image5.jpg', 'image6.jpg'],
          contact_info: { phone: '555-3333', email: 'contact3@listing.com' }
        },
        { 
          id: 'listing-4', 
          title: 'Listing 4', 
          active: true, 
          created_at: '2023-01-04', 
          views_count: 20,
          description: 'Fourth listing with detailed info',
          price: 1800,
          location: 'Suburbs',
          amenities: ['wifi', 'parking', 'garden'],
          images: ['image7.jpg'],
          contact_info: { phone: '555-4444', email: 'contact4@listing.com' }
        }
      ];
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Mock the first call to get user data
      const mockUserChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      };
      
      // Mock the second call to get all listings (without active filter)
      const mockAllListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      // Mock the third call to get ordered listings
      const mockOrderedListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      mockSupabaseClient.from
        .mockReturnValueOnce(mockUserChain)
        .mockReturnValueOnce(mockAllListingsChain)
        .mockReturnValueOnce(mockOrderedListingsChain);

      const result = await apiClient.getUserLikedListings();

      expect(result.success).toBe(true);
      expect(result.listings).toEqual(mockListings);
    });

    it('should handle successful listing fetch with single listing and detailed logging', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: ['listing-1'] };
      const mockListings = [
        { 
          id: 'listing-1', 
          title: 'Single Listing', 
          active: true, 
          created_at: '2023-01-01', 
          views_count: 25,
          description: 'A very detailed single listing',
          price: 2000,
          location: 'Premium Location',
          amenities: ['wifi', 'parking', 'gym', 'pool', 'spa'],
          images: ['image1.jpg', 'image2.jpg', 'image3.jpg', 'image4.jpg'],
          contact_info: { 
            phone: '555-9999', 
            email: 'premium@listing.com',
            website: 'https://premium-listing.com'
          },
          features: ['balcony', 'fireplace', 'hardwood-floors'],
          pet_policy: 'allowed',
          smoking_policy: 'not-allowed',
          parking_type: 'garage',
          utilities_included: ['water', 'electricity', 'internet']
        }
      ];
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      
      // Mock the first call to get user data
      const mockUserChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      };
      
      // Mock the second call to get all listings (without active filter)
      const mockAllListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      // Mock the third call to get ordered listings
      const mockOrderedListingsChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };
      
      mockSupabaseClient.from
        .mockReturnValueOnce(mockUserChain)
        .mockReturnValueOnce(mockAllListingsChain)
        .mockReturnValueOnce(mockOrderedListingsChain);

      const result = await apiClient.getUserLikedListings();

      expect(result.success).toBe(true);
      expect(result.listings).toEqual(mockListings);
    });
  });

  describe('checkIfListingLiked', () => {
    it('should return isLiked true when listing is liked', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: ['listing-123'] };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      });

      const result = await apiClient.checkIfListingLiked('listing-123');

      expect(result.success).toBe(true);
      expect(result.isLiked).toBe(true);
    });

    it('should return isLiked false when listing is not liked', async () => {
      const mockUser = { id: '123' };
      const mockUserData = { liked_listings: ['other-listing'] };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null })
      });

      const result = await apiClient.checkIfListingLiked('listing-123');

      expect(result.success).toBe(true);
      expect(result.isLiked).toBe(false);
    });

    it('should throw error when listing ID is not provided', async () => {
      await expect(apiClient.checkIfListingLiked('')).rejects.toThrow('Valid listing ID is required');
    });

    it('should handle user not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await apiClient.checkIfListingLiked('listing-123');

      expect(result.success).toBe(false);
      expect(result.isLiked).toBe(false);
    });

    it('should handle user data error', async () => {
      const mockUser = { id: '123' };
      const mockError = new Error('User data error');
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError })
      });

      await expect(apiClient.checkIfListingLiked('listing-123')).rejects.toThrow('User data error');
    });

    it('should handle user error', async () => {
      const mockError = new Error('User error');
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: mockError });

      const result = await apiClient.checkIfListingLiked('listing-123');

      expect(result.success).toBe(false);
      expect(result.isLiked).toBe(false);
    });

    it('should handle console.error in updateApplicationStatus', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
      mockSupabaseClient.rpc.mockRejectedValue(new Error('Database error'));

      await expect(apiClient.updateApplicationStatus('app-123', 'accepted')).rejects.toThrow('Database error');
      expect(errorSpy).toHaveBeenCalledWith('Error updating application status:', expect.any(Error));

      errorSpy.mockRestore();
    });

    it('should handle console.error in checkUserApplication', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const result = await apiClient.checkUserApplication('listing-123');

      expect(result.hasApplied).toBe(false);
      expect(result.application).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith('Error checking user application:', expect.any(Error));

      errorSpy.mockRestore();
    });

    it('should handle console.error in toggleLikeListing', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await expect(apiClient.toggleLikeListing('listing-123')).rejects.toThrow('Database error');
      expect(errorSpy).toHaveBeenCalledWith('Error toggling like listing:', expect.any(Error));

      errorSpy.mockRestore();
    });

    it('should handle console.error in getUserLikedListings', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { liked_listings: ['listing-123'] }, error: null }),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValue(new Error('Listings fetch error'))
      });

      await expect(apiClient.getUserLikedListings()).rejects.toThrow('Listings fetch error');
      expect(errorSpy).toHaveBeenCalledWith('Error fetching user liked listings:', expect.any(Error));

      errorSpy.mockRestore();
    });

    it('should handle console.error in checkIfListingLiked', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('User data error'))
      });

      await expect(apiClient.checkIfListingLiked('listing-123')).rejects.toThrow('User data error');
      expect(errorSpy).toHaveBeenCalledWith('Error checking if listing is liked:', expect.any(Error));

      errorSpy.mockRestore();
    });
  });
});
