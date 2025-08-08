import { 
  getSupabaseImageUrl, 
  getListingImages, 
  extractFilePathFromUrl, 
  deleteStorageFiles, 
  cleanupOrphanedStorageFiles 
} from './storage';

// Mock the client module
jest.mock('./client', () => ({
  createClient: jest.fn()
}));

// Mock environment variables
const originalEnv = process.env;

describe('Storage Utils', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockSupabaseClient = {
      storage: {
        from: jest.fn()
      },
      from: jest.fn()
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getSupabaseImageUrl', () => {
    it('should return valid Supabase URL when all parameters are valid', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      
      const result = getSupabaseImageUrl('test-image.jpg', 'test-bucket');
      
      expect(result).toBe('https://test.supabase.co/storage/v1/object/public/test-bucket/test-image.jpg');
    });

    it('should use default bucket when bucket is not provided', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      
      const result = getSupabaseImageUrl('test-image.jpg');
      
      expect(result).toBe('https://test.supabase.co/storage/v1/object/public/listing-images/test-image.jpg');
    });

    it('should return placeholder when NEXT_PUBLIC_SUPABASE_URL is not set', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      const result = getSupabaseImageUrl('test-image.jpg');
      
      expect(result).toBe('/placeholder.svg');
    });

    it('should return placeholder when path is invalid', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      
      const result = getSupabaseImageUrl('', 'test-bucket');
      
      expect(result).toBe('/placeholder.svg');
    });

    it('should return placeholder when path is null', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      
      const result = getSupabaseImageUrl(null as any, 'test-bucket');
      
      expect(result).toBe('/placeholder.svg');
    });

    it('should use default bucket when bucket is invalid', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      
      const result = getSupabaseImageUrl('test-image.jpg', '');
      
      expect(result).toBe('https://test.supabase.co/storage/v1/object/public/listing-images/test-image.jpg');
    });

    it('should handle error in URL construction', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      
      // Mock the template literal to throw an error by making the environment variable invalid
      const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_URL = null as any;
      
      const result = getSupabaseImageUrl('test.jpg');
      
      expect(result).toBe('/placeholder.svg');
      
      // Restore original environment variable
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv;
    });

    it('should handle error in URL construction with undefined environment variable', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      const result = getSupabaseImageUrl('test.jpg');
      
      expect(result).toBe('/placeholder.svg');
      
      // Restore original environment variable
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv;
    });

    it('should handle error in URL construction with empty environment variable', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      
      const result = getSupabaseImageUrl('test.jpg');
      
      expect(result).toBe('/placeholder.svg');
      
      // Restore original environment variable
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv;
    });

    it('should handle error in image processing with specific error types', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      
      // Test with array containing various invalid types
      const images = ['valid.jpg', 123, true, {}, [], null, undefined, ''];
      const result = getListingImages(images);
      
      // Should return default image for invalid items
      expect(result).toEqual([
        'https://test.supabase.co/storage/v1/object/public/listing-images/valid.jpg',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG'
      ]);
    });

    it('should handle error in image processing with complex invalid types', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      
      // Test with array containing complex invalid types
      const images = [
        'valid.jpg',
        new Date(),
        new Error('test error'),
        new Map(),
        new Set(),
        new WeakMap(),
        new WeakSet(),
        new ArrayBuffer(8),
        new Uint8Array([1, 2, 3]),
        new DataView(new ArrayBuffer(8))
      ];
      const result = getListingImages(images);
      
      // Should return default image for invalid items
      expect(result).toEqual([
        'https://test.supabase.co/storage/v1/object/public/listing-images/valid.jpg',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG'
      ]);
    });

    it('should handle error in URL construction with malformed environment variable', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-valid-url';
      
      const result = getSupabaseImageUrl('test.jpg');
      
      expect(result).toBe('not-a-valid-url/storage/v1/object/public/listing-images/test.jpg');
      
      // Restore original environment variable
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv;
    });
  });

  describe('getListingImages', () => {
    it('should return processed images when valid array is provided', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      
      const images = ['image1.jpg', 'https://external.com/image2.jpg'];
      const result = getListingImages(images);
      
      expect(result).toEqual([
        'https://test.supabase.co/storage/v1/object/public/listing-images/image1.jpg',
        'https://external.com/image2.jpg'
      ]);
    });

    it('should return default image when images is null', () => {
      const result = getListingImages(null);
      
      expect(result).toEqual(['https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG']);
    });

    it('should return default image when images is undefined', () => {
      const result = getListingImages(undefined);
      
      expect(result).toEqual(['https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG']);
    });

    it('should return default image when images is empty array', () => {
      const result = getListingImages([]);
      
      expect(result).toEqual(['https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG']);
    });

    it('should return default image when images is not an array', () => {
      const result = getListingImages('not-an-array' as any);
      
      expect(result).toEqual(['https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG']);
    });

    it('should handle invalid image URLs in array', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      
      const images = ['valid.jpg', null, undefined, '', 'https://external.com/valid.jpg'];
      const result = getListingImages(images);
      
      expect(result).toEqual([
        'https://test.supabase.co/storage/v1/object/public/listing-images/valid.jpg',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://external.com/valid.jpg'
      ]);
    });


  });

  describe('extractFilePathFromUrl', () => {
    it('should extract bucket and path from valid Supabase URL', () => {
      const url = 'https://test.supabase.co/storage/v1/object/public/test-bucket/path/to/file.jpg';
      
      const result = extractFilePathFromUrl(url);
      
      expect(result).toEqual({
        bucket: 'test-bucket',
        path: 'path/to/file.jpg'
      });
    });

    it('should return null when URL is null', () => {
      const result = extractFilePathFromUrl(null as any);
      
      expect(result).toBeNull();
    });

    it('should return null when URL is empty', () => {
      const result = extractFilePathFromUrl('');
      
      expect(result).toBeNull();
    });

    it('should return null when URL is not a string', () => {
      const result = extractFilePathFromUrl(123 as any);
      
      expect(result).toBeNull();
    });

    it('should return null when URL is not a Supabase storage URL', () => {
      const result = extractFilePathFromUrl('https://example.com/image.jpg');
      
      expect(result).toBeNull();
    });

    it('should return null when URL has invalid format', () => {
      const result = extractFilePathFromUrl('https://test.supabase.co/invalid/format');
      
      expect(result).toBeNull();
    });

    it('should return null when bucket is missing', () => {
      const result = extractFilePathFromUrl('https://test.supabase.co/storage/v1/object/public/');
      
      expect(result).toBeNull();
    });

    it('should return null when path is missing', () => {
      const result = extractFilePathFromUrl('https://test.supabase.co/storage/v1/object/public/bucket/');
      
      expect(result).toEqual({ bucket: 'bucket', path: '' });
    });

    it('should handle error in URL parsing', () => {
      // Mock the split method to throw an error
      const originalSplit = String.prototype.split;
      String.prototype.split = jest.fn().mockImplementation(() => {
        throw new Error('Split error');
      });
      
      const url = 'https://test.supabase.co/storage/v1/object/public/bucket/file.jpg';
      const result = extractFilePathFromUrl(url);
      
      expect(result).toBeNull();
      
      // Restore original method
      String.prototype.split = originalSplit;
    });

    it('should handle error in bucket and path parsing', () => {
      // Mock the split method to throw an error on the second call
      const originalSplit = String.prototype.split;
      let callCount = 0;
      String.prototype.split = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Second split error');
        }
        return originalSplit.apply(this, arguments);
      });
      
      const url = 'https://test.supabase.co/storage/v1/object/public/bucket/file.jpg';
      const result = extractFilePathFromUrl(url);
      
      expect(result).toBeNull();
      
      // Restore original method
      String.prototype.split = originalSplit;
    });
  });

  describe('deleteStorageFiles', () => {
    beforeEach(() => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);
    });

    it('should delete files successfully', async () => {
      const filePaths = ['file1.jpg', 'file2.jpg'];
      const mockResponse = { error: null };
      
      const mockStorageChain = {
        remove: jest.fn().mockResolvedValue(mockResponse)
      };
      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);

      const result = await deleteStorageFiles(filePaths, 'test-bucket');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('test-bucket');
      expect(mockStorageChain.remove).toHaveBeenCalledWith(filePaths);
    });

    it('should return success when filePaths is empty', async () => {
      const result = await deleteStorageFiles([], 'test-bucket');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should return error when filePaths is null', async () => {
      const result = await deleteStorageFiles(null as any, 'test-bucket');

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Invalid file paths provided');
    });

    it('should return error when filePaths is not an array', async () => {
      const result = await deleteStorageFiles('not-an-array' as any, 'test-bucket');

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Invalid file paths provided');
    });

    it('should use default bucket when bucket is invalid', async () => {
      const filePaths = ['file1.jpg'];
      const mockResponse = { error: null };
      
      const mockStorageChain = {
        remove: jest.fn().mockResolvedValue(mockResponse)
      };
      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);

      const result = await deleteStorageFiles(filePaths, '');

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('listing-images');
    });

    it('should handle storage error', async () => {
      const filePaths = ['file1.jpg'];
      const mockError = new Error('Storage error');
      const mockResponse = { error: mockError };
      
      const mockStorageChain = {
        remove: jest.fn().mockResolvedValue(mockResponse)
      };
      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);

      const result = await deleteStorageFiles(filePaths, 'test-bucket');

      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError);
    });

    it('should handle client creation failure', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      const result = await deleteStorageFiles(['file1.jpg'], 'test-bucket');

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Failed to create Supabase client');
    });

    it('should handle exception during deletion', async () => {
      const filePaths = ['file1.jpg'];
      const mockError = new Error('Network error');
      
      const mockStorageChain = {
        remove: jest.fn().mockRejectedValue(mockError)
      };
      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);

      const result = await deleteStorageFiles(filePaths, 'test-bucket');

      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError);
    });
  });

  describe('cleanupOrphanedStorageFiles', () => {
    beforeEach(() => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(mockSupabaseClient);
    });

    it('should cleanup orphaned files successfully', async () => {
      const mockImageFiles = [
        { name: 'referenced1.jpg' },
        { name: 'orphaned1.jpg' },
        { name: 'orphaned2.jpg' }
      ];
      const mockVideoFiles = [
        { name: 'referenced1.mp4' },
        { name: 'orphaned1.mp4' }
      ];
      const mockListings = [
        {
          images: ['https://test.supabase.co/storage/v1/object/public/listing-images/referenced1.jpg'],
          videos: ['https://test.supabase.co/storage/v1/object/public/listing-videos/referenced1.mp4']
        }
      ];

      const mockStorageChain = {
        list: jest.fn()
          .mockResolvedValueOnce({ data: mockImageFiles, error: null })
          .mockResolvedValueOnce({ data: mockVideoFiles, error: null })
      };
      const mockDbChain = {
        select: jest.fn().mockResolvedValue({ data: mockListings, error: null })
      };

      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);
      mockSupabaseClient.from.mockReturnValue(mockDbChain);

      // Mock deleteStorageFiles to return success
      jest.spyOn(require('./storage'), 'deleteStorageFiles').mockResolvedValue({ success: true, error: null });

      const result = await cleanupOrphanedStorageFiles();

      expect(result).toEqual({
        orphanedImages: 2,
        orphanedVideos: 1
      });
    });

    it('should handle client creation failure', async () => {
      const { createClient } = require('./client');
      createClient.mockReturnValue(null);

      await expect(cleanupOrphanedStorageFiles()).rejects.toThrow('Failed to create Supabase client');
    });

    it('should handle image listing error', async () => {
      const mockError = new Error('Image listing error');
      const mockStorageChain = {
        list: jest.fn().mockResolvedValue({ data: null, error: mockError })
      };

      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);

      await expect(cleanupOrphanedStorageFiles()).rejects.toThrow('Image listing error');
    });

    it('should handle video listing error', async () => {
      const mockImageFiles = [{ name: 'test.jpg' }];
      const mockError = new Error('Video listing error');
      
      const mockStorageChain = {
        list: jest.fn()
          .mockResolvedValueOnce({ data: mockImageFiles, error: null })
          .mockResolvedValueOnce({ data: null, error: mockError })
      };

      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);

      await expect(cleanupOrphanedStorageFiles()).rejects.toThrow('Video listing error');
    });

    it('should handle listings fetch error', async () => {
      const mockImageFiles = [{ name: 'test.jpg' }];
      const mockVideoFiles = [{ name: 'test.mp4' }];
      const mockError = new Error('Listings fetch error');
      
      const mockStorageChain = {
        list: jest.fn()
          .mockResolvedValueOnce({ data: mockImageFiles, error: null })
          .mockResolvedValueOnce({ data: mockVideoFiles, error: null })
      };
      const mockDbChain = {
        select: jest.fn().mockResolvedValue({ data: null, error: mockError })
      };

      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);
      mockSupabaseClient.from.mockReturnValue(mockDbChain);

      await expect(cleanupOrphanedStorageFiles()).rejects.toThrow('Listings fetch error');
    });

    it('should handle empty listings', async () => {
      const mockImageFiles = [{ name: 'orphaned1.jpg' }];
      const mockVideoFiles = [{ name: 'orphaned1.mp4' }];
      
      const mockStorageChain = {
        list: jest.fn()
          .mockResolvedValueOnce({ data: mockImageFiles, error: null })
          .mockResolvedValueOnce({ data: mockVideoFiles, error: null })
      };
      const mockDbChain = {
        select: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      mockSupabaseClient.storage.from.mockReturnValue(mockStorageChain);
      mockSupabaseClient.from.mockReturnValue(mockDbChain);

      // Mock deleteStorageFiles to return success
      jest.spyOn(require('./storage'), 'deleteStorageFiles').mockResolvedValue({ success: true, error: null });

      const result = await cleanupOrphanedStorageFiles();

      expect(result).toEqual({
        orphanedImages: 1,
        orphanedVideos: 1
      });
    });



    it('should handle console.warn in getListingImages for invalid images parameter', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = getListingImages('not-an-array' as any);
      
      expect(result).toEqual(['https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG']);
      expect(warnSpy).toHaveBeenCalledWith('Invalid images parameter provided to getListingImages:', 'not-an-array');
      
      warnSpy.mockRestore();
    });

    it('should handle console.warn in getListingImages for invalid image URL', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = getListingImages(['valid.jpg', null, 'another-valid.jpg']);
      
      expect(result).toEqual([
        'https://test.supabase.co/storage/v1/object/public/listing-images/valid.jpg',
        'https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG',
        'https://test.supabase.co/storage/v1/object/public/listing-images/another-valid.jpg'
      ]);
      expect(warnSpy).toHaveBeenCalledWith('Invalid image URL in array:', null);
      
      warnSpy.mockRestore();
    });

    it('should handle console.error in getListingImages', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock a scenario that would cause an error in image processing
      const originalMap = Array.prototype.map;
      Array.prototype.map = function() {
        throw new Error('Map error');
      };
      
      const result = getListingImages(['image1.jpg', 'image2.jpg']);
      
      expect(result).toEqual(['https://test.supabase.co/storage/v1/object/public/listing-images/bedroom.PNG']);
      expect(errorSpy).toHaveBeenCalledWith('Error processing listing images:', expect.any(Error));
      
      Array.prototype.map = originalMap;
      errorSpy.mockRestore();
    });

    it('should handle console.error in extractFilePathFromUrl', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock a scenario that would cause an error in URL parsing
      const originalSplit = String.prototype.split;
      String.prototype.split = function() {
        throw new Error('Split error');
      };
      
      const result = extractFilePathFromUrl('https://test.supabase.co/storage/v1/object/public/bucket/file.jpg');
      
      expect(result).toBeNull();
      expect(errorSpy).toHaveBeenCalledWith('Error extracting file path from URL:', expect.any(Error));
      
      String.prototype.split = originalSplit;
      errorSpy.mockRestore();
    });


  });
});
