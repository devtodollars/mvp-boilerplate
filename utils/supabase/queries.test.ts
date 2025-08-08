import { getUser, getSubscription, getProducts, getUserDetails } from './queries';

// Mock the cache function
jest.mock('react', () => ({
  cache: jest.fn((fn) => fn)
}));

describe('Queries', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn()
    };
  });

  describe('getUser', () => {
    it('should get user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockResponse = { data: { user: mockUser }, error: null };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue(mockResponse);

      const result = await getUser(mockSupabaseClient);

      expect(result).toEqual(mockUser);
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
    });

    it('should throw error when supabase client is not provided', async () => {
      await expect(getUser(null as any)).rejects.toThrow('Supabase client is required');
    });

    it('should handle authentication error', async () => {
      const mockError = new Error('Authentication failed');
      const mockResponse = { data: { user: null }, error: mockError };
      
      mockSupabaseClient.auth.getUser.mockResolvedValue(mockResponse);

      await expect(getUser(mockSupabaseClient)).rejects.toThrow('Authentication failed');
    });

    it('should handle network error', async () => {
      const mockError = new Error('Network error');
      
      mockSupabaseClient.auth.getUser.mockRejectedValue(mockError);

      await expect(getUser(mockSupabaseClient)).rejects.toThrow('Network error');
    });
  });

  describe('getSubscription', () => {
    it('should get subscription successfully', async () => {
      const mockSubscription = { id: 'sub-123', status: 'active' };
      const mockResponse = { data: mockSubscription, error: null };
      
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue(mockResponse)
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getSubscription(mockSupabaseClient);

      expect(result).toEqual(mockSubscription);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('subscriptions');
    });

    it('should throw error when supabase client is not provided', async () => {
      await expect(getSubscription(null as any)).rejects.toThrow('Supabase client is required');
    });

    it('should handle database error', async () => {
      const mockError = new Error('Database error');
      const mockResponse = { data: null, error: mockError };
      
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue(mockResponse)
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      await expect(getSubscription(mockSupabaseClient)).rejects.toThrow('Database error');
    });
  });

  describe('getProducts', () => {
    it('should get products successfully', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Product 1' },
        { id: 'prod-2', name: 'Product 2' }
      ];
      const mockResponse = { data: mockProducts, error: null };
      
      let orderCallCount = 0;
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockImplementation(() => {
          orderCallCount++;
          if (orderCallCount === 1) {
            return mockChain;
          } else {
            return Promise.resolve(mockResponse);
          }
        })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getProducts(mockSupabaseClient);

      expect(result).toEqual(mockProducts);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
    });

    it('should throw error when supabase client is not provided', async () => {
      await expect(getProducts(null as any)).rejects.toThrow('Supabase client is required');
    });

    it('should handle database error', async () => {
      const mockError = new Error('Database error');
      const mockResponse = { data: null, error: mockError };
      
      let orderCallCount = 0;
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockImplementation(() => {
          orderCallCount++;
          if (orderCallCount === 1) {
            return mockChain;
          } else {
            return Promise.resolve(mockResponse);
          }
        })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      await expect(getProducts(mockSupabaseClient)).rejects.toThrow('Database error');
    });
  });

  describe('getUserDetails', () => {
    it('should get user details successfully', async () => {
      const mockUserDetails = { 
        id: '123', 
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      };
      const mockResponse = { data: mockUserDetails, error: null };
      
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockResponse)
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getUserDetails(mockSupabaseClient);

      expect(result).toEqual(mockUserDetails);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
    });

    it('should throw error when supabase client is not provided', async () => {
      await expect(getUserDetails(null as any)).rejects.toThrow('Supabase client is required');
    });

    it('should handle database error', async () => {
      const mockError = new Error('Database error');
      const mockResponse = { data: null, error: mockError };
      
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockResponse)
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      await expect(getUserDetails(mockSupabaseClient)).rejects.toThrow('Database error');
    });
  });
});
