import {
  uploadListingMedia,
  createListing,
  fetchListings,
  debugListings,
  trackListingView,
  getListingStats,
  getListingApplicantCount,
  updateListing,
  getListingById
} from './listings';
import { createClient } from './client';

// Mock the client module
jest.mock('./client', () => ({
  createClient: jest.fn(),
}));

// Mock fetch globally
(global as any).fetch = jest.fn();

// Mock File constructor
(global as any).File = class MockFile {
  name: string;
  size: number;
  type: string;
  
  constructor(bits: any[], name: string, options?: any) {
    this.name = name;
    this.size = bits.length;
    this.type = options?.type || 'text/plain';
  }
} as any;

describe('Listings Utils', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock Supabase client
    mockSupabaseClient = {
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn(),
          getPublicUrl: jest.fn(),
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn(),
      }),
      rpc: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('uploadListingMedia', () => {
    it('should upload files successfully and return public URLs', async () => {
      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];

      const mockStorage = mockSupabaseClient.storage.from('listing-images');
      mockStorage.upload.mockResolvedValue({ error: null });
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/test1.jpg' }
      });

      const result = await uploadListingMedia(mockFiles, 'listing-images');

      expect(result).toEqual([
        'https://example.com/test1.jpg',
        'https://example.com/test1.jpg'
      ]);
      expect(mockStorage.upload).toHaveBeenCalledTimes(2);
    });

    it('should return empty array for empty files array', async () => {
      const result = await uploadListingMedia([], 'listing-images');
      expect(result).toEqual([]);
    });

    it('should throw error for invalid bucket name', async () => {
      const mockFiles = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      await expect(uploadListingMedia(mockFiles, '')).rejects.toThrow('Invalid bucket name provided');
      await expect(uploadListingMedia(mockFiles, null as any)).rejects.toThrow('Invalid bucket name provided');
    });

    it('should handle upload errors', async () => {
      const mockFiles = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      const mockStorage = mockSupabaseClient.storage.from('listing-images');
      mockStorage.upload.mockResolvedValue({ error: new Error('Upload failed') });

      await expect(uploadListingMedia(mockFiles, 'listing-images')).rejects.toThrow('Upload failed');
    });

    it('should skip invalid file objects', async () => {
      const mockFiles = [null, undefined, 'not-a-file'] as any[];
      const mockStorage = mockSupabaseClient.storage.from('listing-images');
      mockStorage.upload.mockResolvedValue({ error: null });

      const result = await uploadListingMedia(mockFiles, 'listing-images');
      expect(result).toEqual([]);
    });

    it('should handle missing public URL', async () => {
      const mockFiles = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      const mockStorage = mockSupabaseClient.storage.from('listing-images');
      mockStorage.upload.mockResolvedValue({ error: null });
      mockStorage.getPublicUrl.mockReturnValue({ data: null });

      const result = await uploadListingMedia(mockFiles, 'listing-images');
      expect(result).toEqual([]);
    });

    it('should handle upload errors with specific file name', async () => {
      const mockFiles = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      const mockStorage = mockSupabaseClient.storage.from('listing-images');
      mockStorage.upload.mockResolvedValue({ error: new Error('Upload failed') });

      await expect(uploadListingMedia(mockFiles, 'listing-images')).rejects.toThrow('Upload failed');
    });

    it('should handle storage errors during upload', async () => {
      const mockFiles = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      const mockStorage = mockSupabaseClient.storage.from('listing-images');
      mockStorage.upload.mockRejectedValue(new Error('Storage error'));

      await expect(uploadListingMedia(mockFiles, 'listing-images')).rejects.toThrow('Storage error');
    });
  });

  describe('createListing', () => {
    it('should create listing successfully with media', async () => {
      const mockListing = { property_name: 'Test Property', address: 'Test Address' };
      const mockImages = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      const mockVideos = [new File(['test'], 'test.mp4', { type: 'video/mp4' })];

      const mockStorage = mockSupabaseClient.storage.from('listing-images');
      mockStorage.upload.mockResolvedValue({ error: null });
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/test.jpg' }
      });

      const mockDb = mockSupabaseClient.from('listings');
      mockDb.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: '123', ...mockListing },
            error: null
          })
        })
      });

      const result = await createListing(mockListing, mockImages, mockVideos);

      expect(result.data).toEqual({ id: '123', ...mockListing });
      expect(result.error).toBeNull();
    });

    it('should create listing without media', async () => {
      const mockListing = { property_name: 'Test Property', address: 'Test Address' };

      const mockDb = mockSupabaseClient.from('listings');
      mockDb.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: '123', ...mockListing },
            error: null
          })
        })
      });

      const result = await createListing(mockListing);

      expect(result.data).toEqual({ id: '123', ...mockListing });
      expect(result.error).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockListing = { property_name: 'Test Property' };

      const mockDb = mockSupabaseClient.from('listings');
      mockDb.insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
          })
        })
      });

      const result = await createListing(mockListing);

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should throw error for missing listing data', async () => {
      await expect(createListing(null as any)).rejects.toThrow('Listing data is required');
    });
  });

  describe('fetchListings', () => {
    it('should fetch active listings successfully', async () => {
      const mockListings = [
        { id: '1', property_name: 'Property 1', active: true },
        { id: '2', property_name: 'Property 2', active: true }
      ];

      const mockDb = mockSupabaseClient.from('listings');
      mockDb.select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockListings,
            error: null
          })
        })
      });

      const result = await fetchListings();

      expect(result.data).toEqual(mockListings);
      expect(result.error).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockDb = mockSupabaseClient.from('listings');
      mockDb.select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
          })
        })
      });

      const result = await fetchListings();

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should return empty array when no listings found', async () => {
      const mockDb = mockSupabaseClient.from('listings');
      mockDb.select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const result = await fetchListings();

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe('debugListings', () => {
    it('should fetch all listings successfully', async () => {
      const mockListings = [
        { id: '1', property_name: 'Property 1' },
        { id: '2', property_name: 'Property 2' }
      ];

      const mockDb = mockSupabaseClient.from('listings');
      mockDb.select.mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockListings,
          error: null
        })
      });

      const result = await debugListings();

      expect(result.success).toBe(true);
      expect(result.listings).toEqual(mockListings);
      expect(result.error).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockDb = mockSupabaseClient.from('listings');
      mockDb.select.mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error')
        })
      });

      const result = await debugListings();

      expect(result.success).toBe(false);
      expect(result.listings).toEqual([]);
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('trackListingView', () => {
    it('should track view successfully', async () => {
      const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({ views_count: 5 }) };
      ((global as any).fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await trackListingView('listing-123');

      expect(result.success).toBe(true);
      expect(result.views_count).toBe(5);
    });

    it('should handle invalid listing ID', async () => {
      const result = await trackListingView('');

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle API errors', async () => {
      const mockResponse = { 
        ok: false, 
        status: 404, 
        text: jest.fn().mockResolvedValue('Not found') 
      };
      ((global as any).fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await trackListingView('listing-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle network errors', async () => {
      ((global as any).fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await trackListingView('listing-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('getListingStats', () => {
    it('should get stats successfully', async () => {
      const mockStats = [{
        applicant_count: 5,
        views_count: 10,
        last_viewed_at: '2023-01-01T00:00:00Z'
      }];

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockStats,
        error: null
      });

      const result = await getListingStats('listing-123');

      expect(result.success).toBe(true);
      expect(result.applicant_count).toBe(5);
      expect(result.views_count).toBe(10);
      expect(result.last_viewed_at).toBe('2023-01-01T00:00:00Z');
    });

    it('should handle invalid listing ID', async () => {
      const result = await getListingStats('');

      expect(result.success).toBe(false);
      expect(result.applicant_count).toBe(0);
      expect(result.views_count).toBe(0);
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle RPC errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: new Error('RPC error')
      });

      const result = await getListingStats('listing-123');

      expect(result.success).toBe(false);
      expect(result.applicant_count).toBe(0);
      expect(result.views_count).toBe(0);
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle empty stats data', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await getListingStats('listing-123');

      expect(result.success).toBe(true);
      expect(result.applicant_count).toBe(0);
      expect(result.views_count).toBe(0);
    });
  });

  describe('getListingApplicantCount', () => {
    it('should get applicant count successfully', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: 5,
        error: null
      });

      const result = await getListingApplicantCount('listing-123');

      expect(result).toBe(5);
    });

    it('should handle invalid listing ID', async () => {
      const result = await getListingApplicantCount('');

      expect(result).toBe(0);
    });

    it('should handle RPC errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: new Error('RPC error')
      });

      const result = await getListingApplicantCount('listing-123');

      expect(result).toBe(0);
    });

    it('should handle null data', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await getListingApplicantCount('listing-123');

      expect(result).toBe(0);
    });
  });

  describe('updateListing', () => {
    it('should update listing successfully with new media', async () => {
      const mockListing = { property_name: 'Updated Property' };
      const mockImages = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      const mockVideos = [new File(['test'], 'test.mp4', { type: 'video/mp4' })];

      // Mock storage operations
      const mockStorage = mockSupabaseClient.storage.from('listing-images');
      mockStorage.upload.mockResolvedValue({ error: null });
      mockStorage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/test.jpg' }
      });

      // Mock existing listing fetch
      const mockDb = mockSupabaseClient.from('listings');
      mockDb.single.mockResolvedValueOnce({
        data: { images: ['existing.jpg'], videos: ['existing.mp4'] },
        error: null
      });

      // Mock update operation
      mockDb.single.mockResolvedValueOnce({
        data: { id: '123', ...mockListing },
        error: null
      });

      const result = await updateListing('listing-123', mockListing, mockImages, mockVideos);

      expect(result.data).toEqual({ id: '123', ...mockListing });
      expect(result.error).toBeNull();
    });

    it('should handle invalid listing ID', async () => {
      const mockListing = { property_name: 'Updated Property' };

      await expect(updateListing('', mockListing)).rejects.toThrow('Invalid listing ID provided');
    });

    it('should handle missing listing data', async () => {
      await expect(updateListing('listing-123', null as any)).rejects.toThrow('Listing data is required');
    });

    it('should handle fetch errors for existing listing', async () => {
      const mockListing = { property_name: 'Updated Property' };

      const mockDb = mockSupabaseClient.from('listings');
      mockDb.single.mockResolvedValue({
        data: null,
        error: new Error('Fetch error')
      });

      const result = await updateListing('listing-123', mockListing);

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle update errors', async () => {
      const mockListing = { property_name: 'Updated Property' };

      const mockDb = mockSupabaseClient.from('listings');
      mockDb.single.mockResolvedValueOnce({
        data: { images: [], videos: [] },
        error: null
      });
      mockDb.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Update error')
      });

      const result = await updateListing('listing-123', mockListing);

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('getListingById', () => {
    it('should get listing by ID successfully', async () => {
      const mockListing = { id: '123', property_name: 'Test Property' };

      const mockDb = mockSupabaseClient.from('listings');
      mockDb.single.mockResolvedValue({
        data: mockListing,
        error: null
      });

      const result = await getListingById('listing-123');

      expect(result.data).toEqual(mockListing);
      expect(result.error).toBeNull();
    });

    it('should handle invalid listing ID', async () => {
      const result = await getListingById('');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle database errors', async () => {
      const mockDb = mockSupabaseClient.from('listings');
      mockDb.single.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });

      const result = await getListingById('listing-123');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle createListing with unexpected errors', async () => {
      const mockListing = { property_name: 'Test Property', address: 'Test Address' };
      const mockImages = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];

      const mockStorage = mockSupabaseClient.storage.from('listing-images');
      mockStorage.upload.mockRejectedValue(new Error('Storage error'));

      const result = await createListing(mockListing, mockImages);

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle fetchListings with unexpected errors', async () => {
      const mockDb = mockSupabaseClient.from('listings');
      mockDb.select.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const result = await fetchListings();

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle debugListings with unexpected errors', async () => {
      const mockDb = mockSupabaseClient.from('listings');
      mockDb.select.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const result = await debugListings();

      expect(result.success).toBe(false);
      expect(result.listings).toEqual([]);
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle getListingStats with unexpected errors', async () => {
      mockSupabaseClient.rpc.mockImplementation(() => {
        throw new Error('Unexpected RPC error');
      });

      const result = await getListingStats('listing-123');

      expect(result.success).toBe(false);
      expect(result.applicant_count).toBe(0);
      expect(result.views_count).toBe(0);
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle getListingApplicantCount with unexpected errors', async () => {
      mockSupabaseClient.rpc.mockImplementation(() => {
        throw new Error('Unexpected RPC error');
      });

      const result = await getListingApplicantCount('listing-123');

      expect(result).toBe(0);
    });

    it('should handle updateListing with unexpected errors', async () => {
      const mockListing = { property_name: 'Updated Property' };

      const mockDb = mockSupabaseClient.from('listings');
      mockDb.select.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const result = await updateListing('listing-123', mockListing);

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });

    it('should handle getListingById with unexpected errors', async () => {
      const mockDb = mockSupabaseClient.from('listings');
      mockDb.select.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const result = await getListingById('listing-123');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });
});
