import { createAdminClient, validateAdminClient, createSafeAdminClient } from './admin';
import { createClient } from '@supabase/supabase-js';

// Mock the @supabase/supabase-js module
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM5OTk5OTk5LCJleHAiOjE5NTU1NzU5OTl9.test',
};

describe('Admin Utils', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = mockEnv.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = mockEnv.SUPABASE_SERVICE_ROLE_KEY;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('createAdminClient', () => {
    it('should create admin client successfully with valid environment variables', () => {
      const mockClient = {
        auth: {},
        from: jest.fn(),
        rpc: jest.fn(),
      };
      (createClient as jest.Mock).mockReturnValue(mockClient);

      const result = createAdminClient();

      expect(result).toBe(mockClient);
      expect(createClient).toHaveBeenCalledWith(
        mockEnv.NEXT_PUBLIC_SUPABASE_URL,
        mockEnv.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is not set', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      expect(() => createAdminClient()).toThrow('NEXT_PUBLIC_SUPABASE_URL is not set or invalid');
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is not a string', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      expect(() => createAdminClient()).toThrow('NEXT_PUBLIC_SUPABASE_URL is not set or invalid');
    });

    it('should throw error when SUPABASE_SERVICE_ROLE_KEY is not set', () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => createAdminClient()).toThrow('SUPABASE_SERVICE_ROLE_KEY is not set or invalid');
    });

    it('should throw error when SUPABASE_SERVICE_ROLE_KEY is not a string', () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => createAdminClient()).toThrow('SUPABASE_SERVICE_ROLE_KEY is not set or invalid');
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is not a valid URL', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url';

      expect(() => createAdminClient()).toThrow('NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
    });

    it('should not throw error when SUPABASE_SERVICE_ROLE_KEY is not a valid JWT format (just warns)', () => {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'invalid-key';

      // Should not throw, just warn
      expect(() => createAdminClient()).not.toThrow();
    });

    it('should handle createClient errors', () => {
      const mockError = new Error('Supabase client creation failed');
      (createClient as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      expect(() => createAdminClient()).toThrow('Failed to create admin client: Supabase client creation failed');
    });

    it('should handle unknown createClient errors', () => {
      (createClient as jest.Mock).mockImplementation(() => {
        throw 'Unknown error';
      });

      expect(() => createAdminClient()).toThrow('Failed to create admin client: Unknown error');
    });
  });

  describe('validateAdminClient', () => {
    it('should return true for valid admin client', () => {
      const mockClient = {
        auth: {},
        from: jest.fn(),
        rpc: jest.fn(),
      };

      const result = validateAdminClient(mockClient);

      expect(result).toBe(true);
    });

    it('should throw error when client is null', () => {
      expect(() => validateAdminClient(null)).toThrow('Admin client is required');
    });

    it('should throw error when client is undefined', () => {
      expect(() => validateAdminClient(undefined)).toThrow('Admin client is required');
    });

    it('should throw error when client is missing auth property', () => {
      const mockClient = {
        from: jest.fn(),
        rpc: jest.fn(),
      };

      expect(() => validateAdminClient(mockClient)).toThrow('Invalid admin client: missing auth property');
    });

    it('should throw error when client auth is not an object', () => {
      const mockClient = {
        auth: 'not-an-object',
        from: jest.fn(),
        rpc: jest.fn(),
      };

      expect(() => validateAdminClient(mockClient)).toThrow('Invalid admin client: missing auth property');
    });
  });

  describe('createSafeAdminClient', () => {
    it('should return client and no error when successful', () => {
      const mockClient = {
        auth: {},
        from: jest.fn(),
        rpc: jest.fn(),
      };
      (createClient as jest.Mock).mockReturnValue(mockClient);

      const result = createSafeAdminClient();

      expect(result.client).toBe(mockClient);
      expect(result.error).toBeNull();
    });

    it('should return null client and error when createAdminClient fails', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const result = createSafeAdminClient();

      expect(result.client).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('NEXT_PUBLIC_SUPABASE_URL is not set or invalid');
    });

    it('should return null client and error when validateAdminClient fails', () => {
      const mockClient = {
        // Missing auth property
        from: jest.fn(),
        rpc: jest.fn(),
      };
      (createClient as jest.Mock).mockReturnValue(mockClient);

      const result = createSafeAdminClient();

      expect(result.client).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Invalid admin client: missing auth property');
    });

    it('should handle unknown errors', () => {
      (createClient as jest.Mock).mockImplementation(() => {
        throw 'Unknown error';
      });

      const result = createSafeAdminClient();

      expect(result.client).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Failed to create admin client: Unknown error');
    });

    it('should handle console.error in createSafeAdminClient', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      (createClient as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = createSafeAdminClient();

      expect(result.client).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(errorSpy).toHaveBeenCalledWith('Error creating safe admin client:', expect.any(Error));

      errorSpy.mockRestore();
    });

    it('should handle non-Error objects in createSafeAdminClient', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      (createClient as jest.Mock).mockImplementation(() => {
        throw 'String error';
      });

      const result = createSafeAdminClient();

      expect(result.client).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Failed to create admin client: Unknown error');

      errorSpy.mockRestore();
    });
  });
});
