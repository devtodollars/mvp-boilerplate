import { createClient, getSafeUser } from './client';
import { createBrowserClient } from '@supabase/ssr';

// Declare process for TypeScript
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

// Mock the @supabase/ssr module
jest.mock('@supabase/ssr', () => ({
    createBrowserClient: jest.fn(),
}));
// Mock environment variables
const mockEnv = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
};

describe('Supabase Client Utils', () => {
    beforeEach(() => {
        // Reset environment variables
        process.env.NEXT_PUBLIC_SUPABASE_URL = mockEnv.NEXT_PUBLIC_SUPABASE_URL;
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('createClient', () => {
        it('should create a browser client with correct parameters', () => {
            const mockCreateBrowserClient = createBrowserClient as jest.MockedFunction<typeof createBrowserClient>;
            mockCreateBrowserClient.mockReturnValue({} as any);

            const client = createClient();

            expect(mockCreateBrowserClient).toHaveBeenCalledWith(
                mockEnv.NEXT_PUBLIC_SUPABASE_URL,
                mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );
            expect(client).toBeDefined();
        });

        it('should create client even if environment variables are missing (uses defaults)', () => {
            delete process.env.NEXT_PUBLIC_SUPABASE_URL;
            delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            // The function should still work but with undefined values
            expect(() => createClient()).not.toThrow();
        });
    });

    describe('getSafeUser', () => {
        let mockSupabaseClient: any;

        beforeEach(() => {
            mockSupabaseClient = {
                auth: {
                    getUser: jest.fn(),
                },
            };

            const mockCreateBrowserClient = createBrowserClient as jest.MockedFunction<typeof createBrowserClient>;
            mockCreateBrowserClient.mockReturnValue(mockSupabaseClient);
        });

        it('should return user when authentication is successful', async () => {
            const mockUser = { id: '123', email: 'test@example.com' };
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null,
            });

            const result = await getSafeUser();

            expect(result).toEqual({
                user: mockUser,
                error: null,
            });
        });

        it('should handle refresh token not found error gracefully', async () => {
            const refreshTokenError = {
                code: 'refresh_token_not_found',
                message: 'Invalid Refresh Token',
            };
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: refreshTokenError,
            });

            const result = await getSafeUser();

            expect(result).toEqual({
                user: null,
                error: null,
            });
        });

        it('should handle invalid refresh token error gracefully', async () => {
            const invalidTokenError = {
                code: 'auth_error',
                message: 'Invalid Refresh Token',
            };
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: invalidTokenError,
            });

            const result = await getSafeUser();

            expect(result).toEqual({
                user: null,
                error: null,
            });
        });

        it('should return error for other authentication errors', async () => {
            const authError = {
                code: 'auth_error',
                message: 'Network error',
            };
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: authError,
            });

            const result = await getSafeUser();

            expect(result).toEqual({
                user: null,
                error: authError,
            });
        });

        it('should handle unexpected errors', async () => {
            const unexpectedError = new Error('Unexpected error');
            mockSupabaseClient.auth.getUser.mockRejectedValue(unexpectedError);

            const result = await getSafeUser();

            expect(result).toEqual({
                user: null,
                error: unexpectedError,
            });
        });

        it('should handle null user with no error', async () => {
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: null,
            });

            const result = await getSafeUser();

            expect(result).toEqual({
                user: null,
                error: null,
            });
        });

        it('should handle undefined user with no error', async () => {
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: undefined },
                error: null,
            });

            const result = await getSafeUser();

            expect(result).toEqual({
                user: undefined,
                error: null,
            });
        });

        it('should handle error with null message', async () => {
            const authError = {
                code: 'auth_error',
                message: null,
            };
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: authError,
            });

            const result = await getSafeUser();

            expect(result).toEqual({
                user: null,
                error: authError,
            });
        });

        it('should handle error with undefined message', async () => {
            const authError = {
                code: 'auth_error',
                message: undefined,
            };
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: authError,
            });

            const result = await getSafeUser();

            expect(result).toEqual({
                user: null,
                error: authError,
            });
        });

        it('should handle refresh token error with different message format', async () => {
            const refreshTokenError = {
                code: 'auth_error',
                message: 'Refresh token is invalid',
            };
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: refreshTokenError,
            });

            const result = await getSafeUser();

            expect(result).toEqual({
                user: null,
                error: refreshTokenError,
            });
        });

        it('should handle network timeout errors', async () => {
            const networkError = {
                code: 'network_error',
                message: 'Request timeout',
            };
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: networkError,
            });

            const result = await getSafeUser();

            expect(result).toEqual({
                user: null,
                error: networkError,
            });
        });

        it('should handle malformed response', async () => {
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                data: { user: 'invalid-user-object' },
                error: null,
            });

            const result = await getSafeUser();

            expect(result).toEqual({
                user: 'invalid-user-object',
                error: null,
            });
        });

        it('should handle response with missing data property', async () => {
            mockSupabaseClient.auth.getUser.mockResolvedValue({
                error: null,
            });

            const result = await getSafeUser();

            expect(result).toEqual({
                user: null,
                error: new TypeError('Cannot read properties of undefined (reading \'user\')'),
            });
        });
    });
});
