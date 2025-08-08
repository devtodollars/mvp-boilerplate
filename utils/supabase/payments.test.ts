import { 
  getListingPaymentInfo, 
  extendListingPayment, 
  createPaymentRecord, 
  updatePaymentStatus, 
  getUserPayments, 
  getListingPayments, 
  checkListingPaymentNeeded, 
  simulatePaymentCompletion, 
  getPaymentStats 
} from './payments';

// Mock the client module
jest.mock('./client', () => ({
  createClient: jest.fn()
}));

// Mock fetch for simulatePaymentCompletion
global.fetch = jest.fn();

describe('Payments Utils', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = {
      rpc: jest.fn(),
      from: jest.fn()
    };
  });

  describe('getListingPaymentInfo', () => {
    beforeEach(() => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);
    });

    it('should get payment info successfully', async () => {
      const mockPaymentInfo = {
        listing_id: 'listing-123',
        payment_status: 'paid',
        payment_expires_at: '2024-12-31',
        payment_amount: 100,
        days_remaining: 30,
        is_active: true,
        can_renew: true
      };
      
      mockSupabaseClient.rpc.mockResolvedValue({ data: [mockPaymentInfo], error: null });

      const result = await getListingPaymentInfo('listing-123');

      expect(result).toEqual(mockPaymentInfo);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_listing_payment_info', {
        listing_uuid: 'listing-123'
      });
    });

    it('should return null when listing ID is invalid', async () => {
      const result = await getListingPaymentInfo('');

      expect(result).toBeNull();
    });

    it('should return null when listing ID is null', async () => {
      const result = await getListingPaymentInfo(null as any);

      expect(result).toBeNull();
    });

    it('should return null when no payment info found', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null });

      const result = await getListingPaymentInfo('listing-123');

      expect(result).toBeNull();
    });

    it('should return null when RPC error occurs', async () => {
      const mockError = new Error('RPC error');
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: mockError });

      const result = await getListingPaymentInfo('listing-123');

      expect(result).toBeNull();
    });

    it('should return null when client creation fails', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const result = await getListingPaymentInfo('listing-123');

      expect(result).toBeNull();
    });
  });

  describe('extendListingPayment', () => {
    beforeEach(() => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);
    });

    it('should extend payment successfully', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: true, error: null });

      const result = await extendListingPayment('listing-123', 30);

      expect(result).toBe(true);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('extend_listing_payment', {
        listing_uuid: 'listing-123',
        days_to_add: 30
      });
    });

    it('should return false when listing ID is invalid', async () => {
      const result = await extendListingPayment('', 30);

      expect(result).toBe(false);
    });

    it('should return false when days parameter is invalid', async () => {
      const result = await extendListingPayment('listing-123', -5);

      expect(result).toBe(false);
    });

    it('should use default days when days parameter is invalid', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: true, error: null });

      const result = await extendListingPayment('listing-123', 0);

      expect(result).toBe(true);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('extend_listing_payment', {
        listing_uuid: 'listing-123',
        days_to_add: 30
      });
    });

    it('should return false when RPC error occurs', async () => {
      const mockError = new Error('RPC error');
      mockSupabaseClient.rpc.mockResolvedValue({ data: false, error: mockError });

      const result = await extendListingPayment('listing-123', 30);

      expect(result).toBe(false);
    });

    it('should return false when client creation fails', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const result = await extendListingPayment('listing-123', 30);

      expect(result).toBe(false);
    });
  });

  describe('createPaymentRecord', () => {
    beforeEach(() => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);
    });

    it('should create payment record successfully', async () => {
      const mockPaymentData = {
        listing_id: 'listing-123',
        user_id: 'user-123',
        amount: 100,
        currency: 'EUR',
        payment_method: 'stripe' as const,
        description: 'Test payment',
        metadata: { test: 'data' }
      };

      const mockResponse = { id: 'payment-123', ...mockPaymentData };
      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockResponse, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await createPaymentRecord(mockPaymentData);

      expect(result.data).toEqual(mockResponse);
      expect(result.error).toBeNull();
    });

    it('should return error when payment data is null', async () => {
      const result = await createPaymentRecord(null as any);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Payment data is required');
    });

    it('should return error when listing ID is invalid', async () => {
      const mockPaymentData = {
        listing_id: '',
        user_id: 'user-123',
        amount: 100
      };

      const result = await createPaymentRecord(mockPaymentData);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid listing ID is required');
    });

    it('should return error when user ID is invalid', async () => {
      const mockPaymentData = {
        listing_id: 'listing-123',
        user_id: '',
        amount: 100
      };

      const result = await createPaymentRecord(mockPaymentData);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid user ID is required');
    });

    it('should return error when amount is invalid', async () => {
      const mockPaymentData = {
        listing_id: 'listing-123',
        user_id: 'user-123',
        amount: -10
      };

      const result = await createPaymentRecord(mockPaymentData);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid amount is required');
    });

    it('should return error when client creation fails', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const mockPaymentData = {
        listing_id: 'listing-123',
        user_id: 'user-123',
        amount: 100
      };

      const result = await createPaymentRecord(mockPaymentData);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Failed to create Supabase client');
    });
  });

  describe('updatePaymentStatus', () => {
    beforeEach(() => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);
    });

    it('should update payment status successfully', async () => {
      const mockResponse = { id: 'payment-123', status: 'completed' };
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockResponse, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await updatePaymentStatus('payment-123', 'completed');

      expect(result.data).toEqual(mockResponse);
      expect(result.error).toBeNull();
    });

    it('should return error when payment ID is invalid', async () => {
      const result = await updatePaymentStatus('', 'completed');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid payment ID is required');
    });

    it('should return error when status is invalid', async () => {
      const result = await updatePaymentStatus('payment-123', 'invalid-status' as any);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Invalid payment status');
    });

    it('should return error when client creation fails', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const result = await updatePaymentStatus('payment-123', 'completed');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Failed to create Supabase client');
    });
  });

  describe('getUserPayments', () => {
    beforeEach(() => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);
    });

    it('should get user payments successfully', async () => {
      const mockPayments = [
        { id: 'payment-1', amount: 100 },
        { id: 'payment-2', amount: 200 }
      ];
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockPayments, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getUserPayments('user-123');

      expect(result.data).toEqual(mockPayments);
      expect(result.error).toBeNull();
    });

    it('should return error when user ID is invalid', async () => {
      const result = await getUserPayments('');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid user ID is required');
    });

    it('should return error when client creation fails', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const result = await getUserPayments('user-123');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Failed to create Supabase client');
    });
  });

  describe('getListingPayments', () => {
    beforeEach(() => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);
    });

    it('should get listing payments successfully', async () => {
      const mockPayments = [
        { id: 'payment-1', listing_id: 'listing-123' },
        { id: 'payment-2', listing_id: 'listing-123' }
      ];
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockPayments, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getListingPayments('listing-123');

      expect(result.data).toEqual(mockPayments);
      expect(result.error).toBeNull();
    });

    it('should return error when listing ID is invalid', async () => {
      const result = await getListingPayments('');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid listing ID is required');
    });

    it('should return error when client creation fails', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const result = await getListingPayments('listing-123');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Failed to create Supabase client');
    });
  });

  describe('checkListingPaymentNeeded', () => {
    beforeEach(() => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);
    });

    it('should return needs payment when listing ID is invalid', async () => {
      const result = await checkListingPaymentNeeded('');

      expect(result.needsPayment).toBe(true);
      expect(result.paymentInfo).toBeNull();
      expect(result.reason).toBe('Invalid listing ID provided');
    });

    it('should return needs payment when payment info not found', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null });

      const result = await checkListingPaymentNeeded('listing-123');

      expect(result.needsPayment).toBe(true);
      expect(result.paymentInfo).toBeNull();
      expect(result.reason).toBe('Payment information not found');
    });

    it('should return needs payment when status is unpaid', async () => {
      const mockPaymentInfo = {
        listing_id: 'listing-123',
        payment_status: 'unpaid',
        payment_expires_at: null,
        payment_amount: 100,
        days_remaining: null,
        is_active: false,
        can_renew: true
      };
      mockSupabaseClient.rpc.mockResolvedValue({ data: [mockPaymentInfo], error: null });

      const result = await checkListingPaymentNeeded('listing-123');

      expect(result.needsPayment).toBe(true);
      expect(result.paymentInfo).toEqual(mockPaymentInfo);
      expect(result.reason).toBe('Listing has not been paid for');
    });

    it('should return needs payment when status is expired', async () => {
      const mockPaymentInfo = {
        listing_id: 'listing-123',
        payment_status: 'expired',
        payment_expires_at: '2024-01-01',
        payment_amount: 100,
        days_remaining: -5,
        is_active: false,
        can_renew: true
      };
      mockSupabaseClient.rpc.mockResolvedValue({ data: [mockPaymentInfo], error: null });

      const result = await checkListingPaymentNeeded('listing-123');

      expect(result.needsPayment).toBe(true);
      expect(result.paymentInfo).toEqual(mockPaymentInfo);
      expect(result.reason).toBe('Payment has expired');
    });

    it('should return needs payment when days remaining <= 7', async () => {
      const mockPaymentInfo = {
        listing_id: 'listing-123',
        payment_status: 'paid',
        payment_expires_at: '2024-12-31',
        payment_amount: 100,
        days_remaining: 5,
        is_active: true,
        can_renew: true
      };
      mockSupabaseClient.rpc.mockResolvedValue({ data: [mockPaymentInfo], error: null });

      const result = await checkListingPaymentNeeded('listing-123');

      expect(result.needsPayment).toBe(true);
      expect(result.paymentInfo).toEqual(mockPaymentInfo);
      expect(result.reason).toBe('Payment expires in 5 days');
    });

    it('should return no payment needed when payment is current', async () => {
      const mockPaymentInfo = {
        listing_id: 'listing-123',
        payment_status: 'paid',
        payment_expires_at: '2024-12-31',
        payment_amount: 100,
        days_remaining: 30,
        is_active: true,
        can_renew: true
      };
      mockSupabaseClient.rpc.mockResolvedValue({ data: [mockPaymentInfo], error: null });

      const result = await checkListingPaymentNeeded('listing-123');

      expect(result.needsPayment).toBe(false);
      expect(result.paymentInfo).toEqual(mockPaymentInfo);
      expect(result.reason).toBe('Payment is current');
    });
  });

  describe('simulatePaymentCompletion', () => {
    it('should simulate payment completion successfully', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await simulatePaymentCompletion('listing-123');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: 'listing-123' })
      });
    });

    it('should return false when listing ID is invalid', async () => {
      const result = await simulatePaymentCompletion('');

      expect(result).toBe(false);
    });

    it('should return false when API call fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'API error' })
      });

      const result = await simulatePaymentCompletion('listing-123');

      expect(result).toBe(false);
    });

    it('should return false when network error occurs', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await simulatePaymentCompletion('listing-123');

      expect(result).toBe(false);
    });
  });

  describe('getPaymentStats', () => {
    beforeEach(() => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);
    });

    it('should get payment stats successfully', async () => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const mockPayments = [
        { status: 'completed', amount: 100, created_at: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01` },
        { status: 'pending', amount: 200, created_at: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-02` },
        { status: 'completed', amount: 300, created_at: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-03` }
      ];
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockPayments, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getPaymentStats('user-123');

      expect(result.data).toEqual({
        totalPayments: 3,
        totalAmount: 600,
        completedPayments: 2,
        pendingPayments: 1,
        failedPayments: 0,
        thisMonth: 3
      });
      expect(result.error).toBeNull();
    });

    it('should return error when user ID is invalid', async () => {
      const result = await getPaymentStats('');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid user ID is required');
    });

    it('should return error when client creation fails', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const result = await getPaymentStats('user-123');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Failed to create Supabase client');
    });

    it('should handle invalid payment data', async () => {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const mockPayments = [
        { status: 'completed', amount: 'invalid', created_at: 'invalid-date' },
        { status: 'pending', amount: 200, created_at: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-02` }
      ];
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockPayments, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getPaymentStats('user-123');

      expect(result.data).toEqual({
        totalPayments: 2,
        totalAmount: 200,
        completedPayments: 1,
        pendingPayments: 1,
        failedPayments: 0,
        thisMonth: 1
      });
      expect(result.error).toBeNull();
    });

    it('should handle client creation failure in getListingPaymentInfo', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const result = await getListingPaymentInfo('listing-123');

      expect(result).toBeNull();
    });

    it('should handle client creation failure in extendListingPayment', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const result = await extendListingPayment('listing-123', 30);

      expect(result).toBe(false);
    });

    it('should handle client creation failure in createPaymentRecord', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const paymentData = {
        listing_id: 'listing-123',
        user_id: 'user-123',
        amount: 100
      };

      const result = await createPaymentRecord(paymentData);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Failed to create Supabase client');
    });

    it('should handle client creation failure in updatePaymentStatus', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const result = await updatePaymentStatus('payment-123', 'completed');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Failed to create Supabase client');
    });

    it('should handle client creation failure in getUserPayments', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const result = await getUserPayments('user-123');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Failed to create Supabase client');
    });

    it('should handle client creation failure in getListingPayments', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const result = await getListingPayments('listing-123');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Failed to create Supabase client');
    });

    it('should handle client creation failure in checkListingPaymentNeeded', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const result = await checkListingPaymentNeeded('listing-123');

      expect(result.needsPayment).toBe(true);
      expect(result.paymentInfo).toBeNull();
      expect(result.reason).toBe('Payment information not found');
    });

    it('should handle client creation failure in simulatePaymentCompletion', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const result = await simulatePaymentCompletion('listing-123');

      expect(result).toBe(false);
    });

    it('should handle client creation failure in getPaymentStats', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const result = await getPaymentStats('user-123');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Failed to create Supabase client');
    });

    it('should handle invalid listing ID in getListingPaymentInfo', async () => {
      const result = await getListingPaymentInfo('');

      expect(result).toBeNull();
    });

    it('should handle invalid listing ID type in getListingPaymentInfo', async () => {
      const result = await getListingPaymentInfo(123 as any);

      expect(result).toBeNull();
    });

    it('should handle invalid listing ID in extendListingPayment', async () => {
      const result = await extendListingPayment('');

      expect(result).toBe(false);
    });

    it('should handle invalid listing ID type in extendListingPayment', async () => {
      const result = await extendListingPayment(123 as any);

      expect(result).toBe(false);
    });

    it('should handle invalid days parameter in extendListingPayment', async () => {
      const result = await extendListingPayment('listing-123', -5);

      expect(result).toBe(false);
    });

    it('should handle zero days parameter in extendListingPayment', async () => {
      const result = await extendListingPayment('listing-123', 0);

      expect(result).toBe(false);
    });

    it('should handle null payment data in createPaymentRecord', async () => {
      const result = await createPaymentRecord(null as any);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Payment data is required');
    });

    it('should handle undefined payment data in createPaymentRecord', async () => {
      const result = await createPaymentRecord(undefined as any);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Payment data is required');
    });

    it('should handle empty listing ID in createPaymentRecord', async () => {
      const paymentData = {
        listing_id: '',
        user_id: 'user-123',
        amount: 100
      };

      const result = await createPaymentRecord(paymentData);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid listing ID is required');
    });

    it('should handle empty user ID in createPaymentRecord', async () => {
      const paymentData = {
        listing_id: 'listing-123',
        user_id: '',
        amount: 100
      };

      const result = await createPaymentRecord(paymentData);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid user ID is required');
    });

    it('should handle zero amount in createPaymentRecord', async () => {
      const paymentData = {
        listing_id: 'listing-123',
        user_id: 'user-123',
        amount: 0
      };

      const result = await createPaymentRecord(paymentData);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid amount is required');
    });

    it('should handle negative amount in createPaymentRecord', async () => {
      const paymentData = {
        listing_id: 'listing-123',
        user_id: 'user-123',
        amount: -100
      };

      const result = await createPaymentRecord(paymentData);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid amount is required');
    });

    it('should handle invalid amount type in createPaymentRecord', async () => {
      const paymentData = {
        listing_id: 'listing-123',
        user_id: 'user-123',
        amount: 'invalid' as any
      };

      const result = await createPaymentRecord(paymentData);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid amount is required');
    });

    it('should handle invalid listing ID in simulatePaymentCompletion', async () => {
      const result = await simulatePaymentCompletion('');

      expect(result).toBe(false);
    });

    it('should handle invalid listing ID type in simulatePaymentCompletion', async () => {
      const result = await simulatePaymentCompletion(123 as any);

      expect(result).toBe(false);
    });

    it('should handle empty user ID in getPaymentStats', async () => {
      const result = await getPaymentStats('');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid user ID is required');
    });

    it('should handle invalid user ID type in getPaymentStats', async () => {
      const result = await getPaymentStats(123 as any);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid user ID is required');
    });

    it('should handle null user ID in getPaymentStats', async () => {
      const result = await getPaymentStats(null as any);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid user ID is required');
    });

    it('should handle undefined user ID in getPaymentStats', async () => {
      const result = await getPaymentStats(undefined as any);

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Valid user ID is required');
    });

    it('should handle invalid payment data in getPaymentStats', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getPaymentStats('user-123');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Invalid payment data received');
    });

    it('should handle non-array payment data in getPaymentStats', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: 'not-an-array', error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getPaymentStats('user-123');

      expect(result.data).toBeNull();
      expect(result.error.message).toBe('Invalid payment data received');
    });

    it('should handle payment data with invalid dates in getPaymentStats', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);

      const mockPayments = [
        { status: 'completed', amount: 100, created_at: 'invalid-date' },
        { status: 'pending', amount: 200, created_at: '2023-13-45' },
        { status: 'completed', amount: 300, created_at: '2023-01-01' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockPayments, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getPaymentStats('user-123');

      expect(result.data).toBeDefined();
      expect(result.data.totalPayments).toBe(3);
      expect(result.data.totalAmount).toBe(600);
      expect(result.data.completedPayments).toBe(2);
      expect(result.data.pendingPayments).toBe(1);
      expect(result.data.failedPayments).toBe(0);
      expect(result.error).toBeNull();
    });

    it('should handle payment data with null amounts in getPaymentStats', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);

      const mockPayments = [
        { status: 'completed', amount: null, created_at: '2023-01-01' },
        { status: 'pending', amount: undefined, created_at: '2023-01-02' },
        { status: 'completed', amount: 300, created_at: '2023-01-03' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockPayments, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getPaymentStats('user-123');

      expect(result.data).toBeDefined();
      expect(result.data.totalPayments).toBe(3);
      expect(result.data.totalAmount).toBe(300); // Only the valid amount should be counted
      expect(result.data.completedPayments).toBe(2);
      expect(result.data.pendingPayments).toBe(1);
      expect(result.data.failedPayments).toBe(0);
      expect(result.error).toBeNull();
    });

    it('should handle payment data with string amounts in getPaymentStats', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);

      const mockPayments = [
        { status: 'completed', amount: '100', created_at: '2023-01-01' },
        { status: 'pending', amount: '200', created_at: '2023-01-02' },
        { status: 'completed', amount: '300', created_at: '2023-01-03' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockPayments, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getPaymentStats('user-123');

      expect(result.data).toBeDefined();
      expect(result.data.totalPayments).toBe(3);
      expect(result.data.totalAmount).toBe(600); // String amounts should be converted to numbers
      expect(result.data.completedPayments).toBe(2);
      expect(result.data.pendingPayments).toBe(1);
      expect(result.data.failedPayments).toBe(0);
      expect(result.error).toBeNull();
    });

    it('should handle payment data with mixed statuses in getPaymentStats', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);

      const mockPayments = [
        { status: 'completed', amount: 100, created_at: '2023-01-01' },
        { status: 'pending', amount: 200, created_at: '2023-01-02' },
        { status: 'failed', amount: 300, created_at: '2023-01-03' },
        { status: 'refunded', amount: 400, created_at: '2023-01-04' },
        { status: 'cancelled', amount: 500, created_at: '2023-01-05' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockPayments, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getPaymentStats('user-123');

      expect(result.data).toBeDefined();
      expect(result.data.totalPayments).toBe(5);
      expect(result.data.totalAmount).toBe(1500);
      expect(result.data.completedPayments).toBe(1);
      expect(result.data.pendingPayments).toBe(1);
      expect(result.data.failedPayments).toBe(1);
      expect(result.error).toBeNull();
    });

    it('should handle payment data with current month dates in getPaymentStats', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const mockPayments = [
        { status: 'completed', amount: 100, created_at: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01` },
        { status: 'pending', amount: 200, created_at: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-02` },
        { status: 'completed', amount: 300, created_at: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-03` }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockPayments, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getPaymentStats('user-123');

      expect(result.data).toBeDefined();
      expect(result.data.totalPayments).toBe(3);
      expect(result.data.totalAmount).toBe(600);
      expect(result.data.completedPayments).toBe(2);
      expect(result.data.pendingPayments).toBe(1);
      expect(result.data.failedPayments).toBe(0);
      expect(result.data.thisMonth).toBe(3);
      expect(result.error).toBeNull();
    });

    it('should handle payment data with different months in getPaymentStats', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const mockPayments = [
        { status: 'completed', amount: 100, created_at: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01` },
        { status: 'pending', amount: 200, created_at: `${previousYear}-${String(previousMonth + 1).padStart(2, '0')}-15` },
        { status: 'completed', amount: 300, created_at: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-20` }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockPayments, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getPaymentStats('user-123');

      expect(result.data).toBeDefined();
      expect(result.data.totalPayments).toBe(3);
      expect(result.data.totalAmount).toBe(600);
      expect(result.data.completedPayments).toBe(2);
      expect(result.data.pendingPayments).toBe(1);
      expect(result.data.failedPayments).toBe(0);
      expect(result.data.thisMonth).toBe(2); // Only 2 payments in current month
      expect(result.error).toBeNull();
    });

    it('should handle payment data with edge case dates in getPaymentStats', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const mockPayments = [
        { status: 'completed', amount: 100, created_at: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01` },
        { status: 'pending', amount: 200, created_at: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-31` },
        { status: 'completed', amount: 300, created_at: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15` }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockPayments, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getPaymentStats('user-123');

      expect(result.data).toBeDefined();
      expect(result.data.totalPayments).toBe(3);
      expect(result.data.totalAmount).toBe(600);
      expect(result.data.completedPayments).toBe(2);
      expect(result.data.pendingPayments).toBe(1);
      expect(result.data.failedPayments).toBe(0);
      expect(result.data.thisMonth).toBe(3);
      expect(result.error).toBeNull();
    });

    it('should handle payment data with all status types in getPaymentStats', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);

      const mockPayments = [
        { status: 'completed', amount: 100, created_at: '2023-01-01' },
        { status: 'pending', amount: 200, created_at: '2023-01-02' },
        { status: 'failed', amount: 300, created_at: '2023-01-03' },
        { status: 'refunded', amount: 400, created_at: '2023-01-04' },
        { status: 'cancelled', amount: 500, created_at: '2023-01-05' },
        { status: 'completed', amount: 600, created_at: '2023-01-06' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockPayments, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getPaymentStats('user-123');

      expect(result.data).toBeDefined();
      expect(result.data.totalPayments).toBe(6);
      expect(result.data.totalAmount).toBe(2100);
      expect(result.data.completedPayments).toBe(2);
      expect(result.data.pendingPayments).toBe(1);
      expect(result.data.failedPayments).toBe(1);
      expect(result.error).toBeNull();
    });

    it('should handle payment data with zero amounts in getPaymentStats', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);

      const mockPayments = [
        { status: 'completed', amount: 0, created_at: '2023-01-01' },
        { status: 'pending', amount: 0, created_at: '2023-01-02' },
        { status: 'completed', amount: 100, created_at: '2023-01-03' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockPayments, error: null })
      };
      mockSupabaseClient.from.mockReturnValue(mockChain);

      const result = await getPaymentStats('user-123');

      expect(result.data).toBeDefined();
      expect(result.data.totalPayments).toBe(3);
      expect(result.data.totalAmount).toBe(100); // Only the non-zero amount should be counted
      expect(result.data.completedPayments).toBe(2);
      expect(result.data.pendingPayments).toBe(1);
      expect(result.data.failedPayments).toBe(0);
      expect(result.error).toBeNull();
    });

    it('should handle console.error in getListingPayments', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const result = await getListingPayments('listing-123');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(errorSpy).toHaveBeenCalledWith('Error in getListingPayments:', expect.any(Error));

      errorSpy.mockRestore();
    });

    it('should handle console.error in checkListingPaymentNeeded', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);

      // Mock getListingPaymentInfo to throw an error
      const originalGetListingPaymentInfo = require('./payments').getListingPaymentInfo;
      jest.spyOn(require('./payments'), 'getListingPaymentInfo').mockRejectedValue(new Error('Payment info error'));

      const result = await checkListingPaymentNeeded('listing-123');

      expect(result.needsPayment).toBe(true);
      expect(result.paymentInfo).toBeNull();
      expect(result.reason).toBe('Error checking payment status');
      expect(errorSpy).toHaveBeenCalledWith('Error in checkListingPaymentNeeded:', expect.any(Error));

      errorSpy.mockRestore();
    });

    it('should handle console.error in getUserPayments', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const result = await getUserPayments('user-123');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(errorSpy).toHaveBeenCalledWith('Error in getUserPayments:', expect.any(Error));

      errorSpy.mockRestore();
    });

    it('should handle console.error in getListingPayments', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const result = await getListingPayments('listing-123');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(errorSpy).toHaveBeenCalledWith('Error in getListingPayments:', expect.any(Error));

      errorSpy.mockRestore();
    });
  });
});
