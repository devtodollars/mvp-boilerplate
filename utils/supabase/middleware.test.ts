import { createClient, updateSession, validateRequest, safeUpdateSession } from './middleware';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Mock the @supabase/ssr module
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
};

describe('Middleware Utils', () => {
  let mockRequest: any;
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Reset environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = mockEnv.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      cookies: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
      },
    };

    // Create mock request
    mockRequest = {
      headers: new Headers(),
      cookies: {
        get: jest.fn(),
        set: jest.fn(),
      },
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('createClient', () => {
    it('should create client successfully with valid request', () => {
      const result = createClient(mockRequest);

      expect(result.supabase).toBe(mockSupabaseClient);
      expect(result.response).toBeInstanceOf(NextResponse);
      expect(createServerClient).toHaveBeenCalledWith(
        mockEnv.NEXT_PUBLIC_SUPABASE_URL,
        mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      );
    });

    it('should throw error when request is not provided', () => {
      expect(() => createClient(null as any)).toThrow('Request object is required');
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is not set', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      expect(() => createClient(mockRequest)).toThrow('NEXT_PUBLIC_SUPABASE_URL is not set or invalid');
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is not set', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createClient(mockRequest)).toThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or invalid');
    });

    it('should handle createServerClient errors', () => {
      const mockError = new Error('Supabase client creation failed');
      (createServerClient as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      expect(() => createClient(mockRequest)).toThrow('Failed to create Supabase client: Supabase client creation failed');
    });

    it('should handle cookie operations correctly', () => {
      const result = createClient(mockRequest);
      const { supabase } = result;

      // Test cookie get
      const cookieGet = supabase.cookies.get;
      expect(typeof cookieGet).toBe('function');

      // Test cookie set
      const cookieSet = supabase.cookies.set;
      expect(typeof cookieSet).toBe('function');

      // Test cookie remove
      const cookieRemove = supabase.cookies.remove;
      expect(typeof cookieRemove).toBe('function');
    });

    it('should handle invalid cookie names in get', () => {
      const result = createClient(mockRequest);
      const { supabase } = result;

      const cookieGet = supabase.cookies.get;
      const result1 = cookieGet('');
      const result2 = cookieGet(null as any);

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
    });

    it('should handle invalid cookie names in set', () => {
      const result = createClient(mockRequest);
      const { supabase } = result;

      const cookieSet = supabase.cookies.set;
      
      // Should not throw, just warn
      expect(() => cookieSet('', 'value', {})).not.toThrow();
      expect(() => cookieSet(null as any, 'value', {})).not.toThrow();
    });

    it('should handle invalid cookie values in set', () => {
      const result = createClient(mockRequest);
      const { supabase } = result;

      const cookieSet = supabase.cookies.set;
      
      // Should not throw, just warn
      expect(() => cookieSet('name', null as any, {})).not.toThrow();
      expect(() => cookieSet('name', 123 as any, {})).not.toThrow();
    });

    it('should handle invalid cookie names in remove', () => {
      const result = createClient(mockRequest);
      const { supabase } = result;

      const cookieRemove = supabase.cookies.remove;
      
      // Should not throw, just warn
      expect(() => cookieRemove('', {})).not.toThrow();
      expect(() => cookieRemove(null as any, {})).not.toThrow();
    });
  });

  describe('updateSession', () => {
    it('should update session successfully', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });

      const result = await updateSession(mockRequest);

      expect(result).toBeInstanceOf(NextResponse);
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
    });

    it('should handle null request', async () => {
      const result = await updateSession(null as any);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should handle refresh token not found error', async () => {
      const mockError = { code: 'refresh_token_not_found' };
      mockSupabaseClient.auth.getUser.mockRejectedValue(mockError);

      const result = await updateSession(mockRequest);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should handle invalid refresh token error', async () => {
      const mockError = { message: 'Invalid Refresh Token' };
      mockSupabaseClient.auth.getUser.mockRejectedValue(mockError);

      const result = await updateSession(mockRequest);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should handle other authentication errors', async () => {
      const mockError = new Error('Other auth error');
      mockSupabaseClient.auth.getUser.mockRejectedValue(mockError);

      // The function should handle the error and return a response instead of throwing
      const result = await updateSession(mockRequest);
      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should handle createClient errors', async () => {
      (createServerClient as jest.Mock).mockImplementation(() => {
        throw new Error('Client creation failed');
      });

      const result = await updateSession(mockRequest);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should handle cookie get method with invalid name', () => {
      const { supabase } = createClient(mockRequest);
      
      // Test the cookie get method with invalid name
      const cookieGet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.get;
      const cookieResult = cookieGet('');
      
      expect(cookieResult).toBeUndefined();
    });

    it('should handle cookie get method with null name', () => {
      const { supabase } = createClient(mockRequest);
      
      // Test the cookie get method with null name
      const cookieGet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.get;
      const cookieResult = cookieGet(null as any);
      
      expect(cookieResult).toBeUndefined();
    });

    it('should handle cookie get method successfully', () => {
      const { supabase } = createClient(mockRequest);
      
      // Mock cookie to return a value
      mockRequest.cookies.get.mockReturnValue({ value: 'test-value' });
      
      const cookieGet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.get;
      const cookieResult = cookieGet('test-cookie');
      
      expect(cookieResult).toBe('test-value');
    });

    it('should handle cookie set method with invalid name', () => {
      const { supabase } = createClient(mockRequest);
      
      // Test the cookie set method with invalid name
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      cookieSet('', 'value', {});
      
      // Should not throw, just warn - the function should return early without calling set
      expect(mockRequest.cookies.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with null name', () => {
      const { supabase } = createClient(mockRequest);
      
      // Test the cookie set method with null name
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      cookieSet(null as any, 'value', {});
      
      // Should not throw, just warn - the function should return early without calling set
      expect(mockRequest.cookies.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with invalid value', () => {
      const { supabase } = createClient(mockRequest);
      
      // Test the cookie set method with invalid value
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      cookieSet('test-cookie', null as any, {});
      
      // Should not throw, just warn - the function should return early without calling set
      expect(mockRequest.cookies.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method successfully', () => {
      const { supabase } = createClient(mockRequest);
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      cookieSet('test-cookie', 'test-value', { path: '/' });
      
      expect(mockRequest.cookies.set).toHaveBeenCalledWith({
        name: 'test-cookie',
        value: 'test-value',
        path: '/'
      });
    });

    it('should handle cookie remove method with invalid name', () => {
      const { supabase } = createClient(mockRequest);
      
      // Test the cookie remove method with invalid name
      const cookieRemove = (createServerClient as jest.Mock).mock.calls[0][2].cookies.remove;
      cookieRemove('', {});
      
      // Should not throw, just warn - the function should return early without calling set
      expect(mockRequest.cookies.set).not.toHaveBeenCalled();
    });

    it('should handle cookie remove method with null name', () => {
      const { supabase } = createClient(mockRequest);
      
      // Test the cookie remove method with null name
      const cookieRemove = (createServerClient as jest.Mock).mock.calls[0][2].cookies.remove;
      cookieRemove(null as any, {});
      
      // Should not throw, just warn - the function should return early without calling set
      expect(mockRequest.cookies.set).not.toHaveBeenCalled();
    });

    it('should handle cookie remove method successfully', () => {
      const { supabase } = createClient(mockRequest);
      
      const cookieRemove = (createServerClient as jest.Mock).mock.calls[0][2].cookies.remove;
      cookieRemove('test-cookie', { path: '/' });
      
      expect(mockRequest.cookies.set).toHaveBeenCalledWith({
        name: 'test-cookie',
        value: '',
        path: '/'
      });
    });
  });

  describe('validateRequest', () => {
    it('should return true for valid request', () => {
      const result = validateRequest(mockRequest);

      expect(result).toBe(true);
    });

    it('should return false for null request', () => {
      const result = validateRequest(null as any);

      expect(result).toBe(false);
    });

    it('should return false for request without headers', () => {
      const invalidRequest = { cookies: {} };
      const result = validateRequest(invalidRequest as any);

      expect(result).toBe(false);
    });

    it('should return false for request without cookies', () => {
      const invalidRequest = { headers: {} };
      const result = validateRequest(invalidRequest as any);

      expect(result).toBe(false);
    });
  });

  describe('safeUpdateSession', () => {
    it('should update session successfully with valid request', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null });

      const result = await safeUpdateSession(mockRequest);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should handle invalid request', async () => {
      const result = await safeUpdateSession(null as any);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should handle updateSession errors', async () => {
      (createServerClient as jest.Mock).mockImplementation(() => {
        throw new Error('Client creation failed');
      });

      const result = await safeUpdateSession(mockRequest);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should handle updateSession throwing error', async () => {
      // Mock createClient to throw an error
      jest.spyOn(require('./middleware'), 'createClient').mockImplementation(() => {
        throw new Error('Create client error');
      });

      const result = await safeUpdateSession(mockRequest);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should handle updateSession throwing error in getUser', async () => {
      // Mock supabase.auth.getUser to throw an error that's not a refresh token error
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Other auth error'));

      const result = await safeUpdateSession(mockRequest);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should handle updateSession throwing error in createClient', async () => {
      // Mock createClient to throw an error
      jest.spyOn(require('./middleware'), 'createClient').mockImplementation(() => {
        throw new Error('Create client error');
      });

      const result = await safeUpdateSession(mockRequest);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should handle updateSession throwing error in getUser', async () => {
      // Mock supabase.auth.getUser to throw an error that's not a refresh token error
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Other auth error'));

      const result = await safeUpdateSession(mockRequest);

      expect(result).toBeInstanceOf(NextResponse);
    });

    it('should handle updateSession throwing error in safeUpdateSession', async () => {
      // Mock updateSession to throw an error
      jest.spyOn(require('./middleware'), 'updateSession').mockRejectedValue(new Error('Update session error'));

      const result = await safeUpdateSession(mockRequest);

      expect(result).toBeInstanceOf(NextResponse);
    });
  });
});
