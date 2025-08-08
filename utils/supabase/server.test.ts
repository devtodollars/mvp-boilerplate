import { createClient, validateServerClient, createSafeServerClient } from './server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Mock the @supabase/ssr module
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

// Mock the next/headers module
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
};

describe('Server Utils', () => {
  let mockCookieStore: any;
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Reset environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = mockEnv.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock cookie store
    mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
    };

    // Create mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
      cookies: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
      },
    };

    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);
    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('createClient', () => {
    it('should create client successfully with valid environment variables', async () => {
      const result = await createClient();

      expect(result).toBe(mockSupabaseClient);
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

    it('should throw error when cookie store is not available', async () => {
      (cookies as jest.Mock).mockImplementation(() => {
        throw new Error('Cookie store not available');
      });

      await expect(createClient()).rejects.toThrow('Failed to create server client: Cookie store not available');
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      await expect(createClient()).rejects.toThrow('NEXT_PUBLIC_SUPABASE_URL is not set or invalid');
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is not set', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      await expect(createClient()).rejects.toThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or invalid');
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is not a valid URL', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url';

      await expect(createClient()).rejects.toThrow('NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
    });

    it('should handle createServerClient errors', async () => {
      const mockError = new Error('Supabase client creation failed');
      (createServerClient as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      await expect(createClient()).rejects.toThrow('Failed to create server client: Supabase client creation failed');
    });

    it('should handle cookie operations correctly', async () => {
      const result = await createClient();
      const { cookies: cookieMethods } = result;

      // Test cookie get
      const cookieGet = cookieMethods.get;
      expect(typeof cookieGet).toBe('function');

      // Test cookie set
      const cookieSet = cookieMethods.set;
      expect(typeof cookieSet).toBe('function');

      // Test cookie remove
      const cookieRemove = cookieMethods.remove;
      expect(typeof cookieRemove).toBe('function');
    });

    it('should handle invalid cookie names in get', async () => {
      const result = await createClient();
      const { cookies: cookieMethods } = result;

      const cookieGet = cookieMethods.get;
      const result1 = await cookieGet('');
      const result2 = await cookieGet(null as any);

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
    });

    it('should handle invalid cookie names in set', async () => {
      const result = await createClient();
      const { cookies: cookieMethods } = result;

      const cookieSet = cookieMethods.set;
      
      // Should not throw, just warn
      expect(cookieSet('', 'value', {})).toBeUndefined();
      expect(cookieSet(null as any, 'value', {})).toBeUndefined();
    });

    it('should handle invalid cookie values in set', async () => {
      const result = await createClient();
      const { cookies: cookieMethods } = result;

      const cookieSet = cookieMethods.set;
      
      // Should not throw, just warn
      expect(cookieSet('name', null as any, {})).toBeUndefined();
      expect(cookieSet('name', 123 as any, {})).toBeUndefined();
    });

    it('should handle invalid cookie names in remove', async () => {
      const result = await createClient();
      const { cookies: cookieMethods } = result;

      const cookieRemove = cookieMethods.remove;
      
      // Should not throw, just warn
      expect(cookieRemove('', {})).toBeUndefined();
      expect(cookieRemove(null as any, {})).toBeUndefined();
    });

    it('should handle cookie store errors in get', async () => {
      const result = await createClient();
      const { cookies: cookieMethods } = result;

      const cookieGet = cookieMethods.get;
      mockCookieStore.get.mockRejectedValue(new Error('Cookie store error'));

      const result1 = await cookieGet('test-cookie');
      expect(result1).toBeUndefined();
    });

    it('should handle cookie store errors in set', async () => {
      const result = await createClient();
      const { cookies: cookieMethods } = result;

      const cookieSet = cookieMethods.set;
      mockCookieStore.set.mockRejectedValue(new Error('Cookie store error'));

      // Should not throw, just warn
      expect(cookieSet('test-cookie', 'test-value', {})).toBeUndefined();
    });

    it('should handle cookie store errors in remove', async () => {
      const result = await createClient();
      const { cookies: cookieMethods } = result;

      const cookieRemove = cookieMethods.remove;
      mockCookieStore.set.mockRejectedValue(new Error('Cookie store error'));

      // Should not throw, just warn
      expect(cookieRemove('test-cookie', {})).toBeUndefined();
    });
  });

  describe('validateServerClient', () => {
    it('should return true for valid server client', () => {
      const result = validateServerClient(mockSupabaseClient);

      expect(result).toBe(true);
    });

    it('should throw error when client is null', () => {
      expect(() => validateServerClient(null)).toThrow('Server client is required');
    });

    it('should throw error when client is undefined', () => {
      expect(() => validateServerClient(undefined)).toThrow('Server client is required');
    });

    it('should throw error when client is missing auth property', () => {
      const invalidClient = {
        from: jest.fn(),
      };

      expect(() => validateServerClient(invalidClient)).toThrow('Invalid server client: missing auth property');
    });

    it('should throw error when client auth is not an object', () => {
      const invalidClient = {
        auth: 'not-an-object',
        from: jest.fn(),
      };

      expect(() => validateServerClient(invalidClient)).toThrow('Invalid server client: missing auth property');
    });

    it('should throw error when client is missing from method', () => {
      const invalidClient = {
        auth: {},
      };

      expect(() => validateServerClient(invalidClient)).toThrow('Invalid server client: missing from method');
    });

    it('should throw error when client from is not a function', () => {
      const invalidClient = {
        auth: {},
        from: 'not-a-function',
      };

      expect(() => validateServerClient(invalidClient)).toThrow('Invalid server client: missing from method');
    });
  });

  describe('createSafeServerClient', () => {
    it('should return client and no error when successful', async () => {
      const result = await createSafeServerClient();

      expect(result.client).toBe(mockSupabaseClient);
      expect(result.error).toBeNull();
    });

    it('should return null client and error when createClient fails', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const result = await createSafeServerClient();

      expect(result.client).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Failed to create server client: NEXT_PUBLIC_SUPABASE_URL is not set or invalid');
    });

    it('should return null client and error when validateServerClient fails', async () => {
      const invalidClient = {
        auth: {},
      };
      (createServerClient as jest.Mock).mockReturnValue(invalidClient);

      const result = await createSafeServerClient();

      expect(result.client).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Invalid server client: missing from method');
    });

    it('should handle unknown errors', async () => {
      (createServerClient as jest.Mock).mockImplementation(() => {
        throw 'Unknown error';
      });

      const result = await createSafeServerClient();

      expect(result.client).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Failed to create server client: Unknown error');
    });

    it('should handle cookie get method with error', async () => {
      const result = await createClient();
      
      // Mock cookie store to throw error
      mockCookieStore.get.mockImplementation(() => {
        throw new Error('Cookie get error');
      });
      
      const cookieGet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.get;
      const cookieResult = await cookieGet('test-cookie');
      
      expect(cookieResult).toBeUndefined();
    });

    it('should handle cookie set method with error', async () => {
      const result = await createClient();
      
      // Mock cookie store to throw error
      mockCookieStore.set.mockImplementation(() => {
        throw new Error('Cookie set error');
      });
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', 'test-value', {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).toHaveBeenCalled();
    });

    it('should handle cookie remove method with error', async () => {
      const result = await createClient();
      
      // Mock cookie store to throw error
      mockCookieStore.set.mockImplementation(() => {
        throw new Error('Cookie remove error');
      });
      
      const cookieRemove = (createServerClient as jest.Mock).mock.calls[0][2].cookies.remove;
      await cookieRemove('test-cookie', {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).toHaveBeenCalled();
    });

    it('should handle cookie get method with null cookie value', async () => {
      const result = await createClient();
      
      // Mock cookie store to return null
      mockCookieStore.get.mockReturnValue(null);
      
      const cookieGet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.get;
      const cookieResult = await cookieGet('test-cookie');
      
      expect(cookieResult).toBeUndefined();
    });

    it('should handle cookie get method with cookie without value', async () => {
      const result = await createClient();
      
      // Mock cookie store to return cookie without value
      mockCookieStore.get.mockReturnValue({});
      
      const cookieGet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.get;
      const cookieResult = await cookieGet('test-cookie');
      
      expect(cookieResult).toBeUndefined();
    });

    it('should handle cookie set method with non-string value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', null as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with number value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', 123 as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with boolean value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', true as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with object value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', {} as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with array value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', [] as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with function value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', (() => {}) as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with undefined value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', undefined as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with number value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', 123 as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with boolean value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', true as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with object value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', {} as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with array value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', [] as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with function value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', (() => {}) as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with symbol value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', Symbol('test') as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with bigint value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', BigInt(123) as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with date value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', new Date() as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with regex value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', /test/ as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with null value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', null as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with NaN value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', NaN as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with Infinity value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', Infinity as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with -Infinity value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', -Infinity as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with undefined value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', undefined as any, {});
      
      // Should not throw, just warn
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it('should handle cookie set method with empty string value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', '', {});
      
      // Should work with empty string
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: '', ...{} });
    });

    it('should handle cookie set method with whitespace string value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', '   ', {});
      
      // Should work with whitespace string
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: '   ', ...{} });
    });

    it('should handle cookie set method with special characters string value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', '!@#$%^&*()', {});
      
      // Should work with special characters
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: '!@#$%^&*()', ...{} });
    });

    it('should handle cookie set method with unicode string value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', '🎉🚀✨', {});
      
      // Should work with unicode characters
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: '🎉🚀✨', ...{} });
    });

    it('should handle cookie set method with very long string value', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      const longString = 'a'.repeat(1000);
      await cookieSet('test-cookie', longString, {});
      
      // Should work with long strings
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: longString, ...{} });
    });

    it('should handle cookie set method with newline characters', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', 'line1\nline2\r\nline3', {});
      
      // Should work with newline characters
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: 'line1\nline2\r\nline3', ...{} });
    });

    it('should handle cookie set method with tab characters', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', 'tab\tseparated\tvalues', {});
      
      // Should work with tab characters
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: 'tab\tseparated\tvalues', ...{} });
    });

    it('should handle cookie set method with carriage return characters', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', 'carriage\rreturn', {});
      
      // Should work with carriage return characters
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: 'carriage\rreturn', ...{} });
    });

    it('should handle cookie set method with form feed characters', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', 'form\ffeed', {});
      
      // Should work with form feed characters
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: 'form\ffeed', ...{} });
    });

    it('should handle cookie set method with vertical tab characters', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', 'vertical\vtab', {});
      
      // Should work with vertical tab characters
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: 'vertical\vtab', ...{} });
    });

    it('should handle cookie set method with backspace characters', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', 'backspace\bchar', {});
      
      // Should work with backspace characters
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: 'backspace\bchar', ...{} });
    });

    it('should handle cookie set method with escape characters', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', 'escape\x1bchar', {});
      
      // Should work with escape characters
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: 'escape\x1bchar', ...{} });
    });

    it('should handle cookie set method with bell characters', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', 'bell\achar', {});
      
      // Should work with bell characters
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: 'bell\achar', ...{} });
    });

    it('should handle cookie set method with null terminator characters', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', 'null\0char', {});
      
      // Should work with null terminator characters
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: 'null\0char', ...{} });
    });

    it('should handle cookie set method with unicode characters', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', '🎉🚀✨', {});
      
      // Should work with unicode characters
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: '🎉🚀✨', ...{} });
    });

    it('should handle cookie set method with emoji characters', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', '😀🎊🎈', {});
      
      // Should work with emoji characters
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: '😀🎊🎈', ...{} });
    });

    it('should handle cookie set method with special unicode characters', async () => {
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', 'áéíóúñü', {});
      
      // Should work with special unicode characters
      expect(mockCookieStore.set).toHaveBeenCalledWith({ name: 'test-cookie', value: 'áéíóúñü', ...{} });
    });

    it('should handle console.error in createClient', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      (createServerClient as jest.Mock).mockImplementation(() => {
        throw new Error('Server client creation error');
      });

      await expect(createClient()).rejects.toThrow('Failed to create server client: Server client creation error');
      expect(errorSpy).toHaveBeenCalledWith('Error creating server client:', expect.any(Error));

      errorSpy.mockRestore();
    });

    it('should handle console.warn in cookie get method', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = await createClient();
      
      const cookieGet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.get;
      await cookieGet(''); // Invalid cookie name
      
      expect(warnSpy).toHaveBeenCalledWith('Invalid cookie name provided to get:', '');
      warnSpy.mockRestore();
    });

    it('should handle console.error in cookie get method', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockCookieStore.get.mockImplementation(() => {
        throw new Error('Cookie get error');
      });
      
      const result = await createClient();
      
      const cookieGet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.get;
      const value = await cookieGet('test-cookie');
      
      expect(value).toBeUndefined();
      expect(errorSpy).toHaveBeenCalledWith('Error getting cookie:', expect.any(Error));
      errorSpy.mockRestore();
    });

    it('should handle console.warn in cookie set method', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('', 'value', {}); // Invalid cookie name
      
      expect(warnSpy).toHaveBeenCalledWith('Invalid cookie name provided to set:', '');
      warnSpy.mockRestore();
    });

    it('should handle console.warn for invalid cookie value in set method', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', 123 as any, {}); // Invalid cookie value
      
      expect(warnSpy).toHaveBeenCalledWith('Invalid cookie value provided to set:', 123);
      warnSpy.mockRestore();
    });

    it('should handle console.warn in cookie remove method', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = await createClient();
      
      const cookieRemove = (createServerClient as jest.Mock).mock.calls[0][2].cookies.remove;
      await cookieRemove('', {}); // Invalid cookie name
      
      expect(warnSpy).toHaveBeenCalledWith('Invalid cookie name provided to remove:', '');
      warnSpy.mockRestore();
    });

    it('should handle console.warn in cookie set method error', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockCookieStore.set.mockImplementation(() => {
        throw new Error('Cookie set error');
      });
      
      const result = await createClient();
      
      const cookieSet = (createServerClient as jest.Mock).mock.calls[0][2].cookies.set;
      await cookieSet('test-cookie', 'test-value', {});
      
      expect(warnSpy).toHaveBeenCalledWith('Error setting cookie (this may be expected in some contexts):', expect.any(Error));
      warnSpy.mockRestore();
    });
  });
});
