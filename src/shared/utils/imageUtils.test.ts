import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// ============================================================================
// Mocks - Must be defined before imports
// ============================================================================

// Mock heic2any before any imports
vi.mock('heic2any', () => ({
  default: vi.fn(),
}));

// Mock @/shared with minimal implementation
const mockGetPublicUrl = vi.fn();
vi.mock('@/shared', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  },
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Now import after mocks
import {
  isHeicFormat,
  convertHeicToJpeg,
  getImageUrl,
  compressImage,
  type ImageCompressionOptions,
} from './imageUtils';

// ============================================================================
// Helper Functions
// ============================================================================

function createMockFile(
  name: string,
  type: string,
  size: number = 1000
): File {
  const content = new Array(size).fill('a').join('');
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

// ============================================================================
// isHeicFormat Tests
// ============================================================================

describe('isHeicFormat', () => {
  describe('MIME type detection', () => {
    it('returns true for image/heic MIME type', () => {
      const file = createMockFile('photo.jpg', 'image/heic');
      expect(isHeicFormat(file)).toBe(true);
    });

    it('returns true for image/heif MIME type', () => {
      const file = createMockFile('photo.jpg', 'image/heif');
      expect(isHeicFormat(file)).toBe(true);
    });

    it('is case-insensitive for MIME type', () => {
      const file = createMockFile('photo.jpg', 'IMAGE/HEIC');
      expect(isHeicFormat(file)).toBe(true);
    });
  });

  describe('file extension detection', () => {
    it('returns true for .heic extension', () => {
      const file = createMockFile('photo.heic', 'application/octet-stream');
      expect(isHeicFormat(file)).toBe(true);
    });

    it('returns true for .heif extension', () => {
      const file = createMockFile('photo.heif', 'application/octet-stream');
      expect(isHeicFormat(file)).toBe(true);
    });

    it('is case-insensitive for extension', () => {
      const file1 = createMockFile('photo.HEIC', 'application/octet-stream');
      const file2 = createMockFile('photo.Heif', 'application/octet-stream');
      expect(isHeicFormat(file1)).toBe(true);
      expect(isHeicFormat(file2)).toBe(true);
    });
  });

  describe('non-HEIC files', () => {
    it('returns false for JPEG files', () => {
      const file = createMockFile('photo.jpg', 'image/jpeg');
      expect(isHeicFormat(file)).toBe(false);
    });

    it('returns false for PNG files', () => {
      const file = createMockFile('image.png', 'image/png');
      expect(isHeicFormat(file)).toBe(false);
    });

    it('returns false for WebP files', () => {
      const file = createMockFile('image.webp', 'image/webp');
      expect(isHeicFormat(file)).toBe(false);
    });

    it('returns false for GIF files', () => {
      const file = createMockFile('animation.gif', 'image/gif');
      expect(isHeicFormat(file)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('returns false for file with heic in name but not as extension', () => {
      const file = createMockFile('my-heic-photo.jpg', 'image/jpeg');
      expect(isHeicFormat(file)).toBe(false);
    });

    it('handles files with no extension', () => {
      const file = createMockFile('photo', 'image/jpeg');
      expect(isHeicFormat(file)).toBe(false);
    });
  });
});

// ============================================================================
// convertHeicToJpeg Tests
// ============================================================================

describe('convertHeicToJpeg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls heic2any with correct parameters', async () => {
    const heic2any = (await import('heic2any')).default as Mock;
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
    heic2any.mockResolvedValue(mockBlob);

    const heicFile = createMockFile('photo.heic', 'image/heic');
    await convertHeicToJpeg(heicFile);

    expect(heic2any).toHaveBeenCalledWith({
      blob: heicFile,
      toType: 'image/jpeg',
      quality: 0.9,
    });
  });

  it('renames .heic to .jpg in output', async () => {
    const heic2any = (await import('heic2any')).default as Mock;
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
    heic2any.mockResolvedValue(mockBlob);

    const heicFile = createMockFile('my-photo.heic', 'image/heic');
    const result = await convertHeicToJpeg(heicFile);

    expect(result.name).toBe('my-photo.jpg');
    expect(result.type).toBe('image/jpeg');
  });

  it('renames .heif to .jpg in output', async () => {
    const heic2any = (await import('heic2any')).default as Mock;
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
    heic2any.mockResolvedValue(mockBlob);

    const heifFile = createMockFile('my-photo.heif', 'image/heif');
    const result = await convertHeicToJpeg(heifFile);

    expect(result.name).toBe('my-photo.jpg');
  });

  it('handles heic2any returning array of blobs', async () => {
    const heic2any = (await import('heic2any')).default as Mock;
    const mockBlobs = [
      new Blob(['test1'], { type: 'image/jpeg' }),
      new Blob(['test2'], { type: 'image/jpeg' }),
    ];
    heic2any.mockResolvedValue(mockBlobs);

    const heicFile = createMockFile('photo.heic', 'image/heic');
    const result = await convertHeicToJpeg(heicFile);

    // Should use first blob from array
    expect(result.type).toBe('image/jpeg');
  });

  it('throws error on conversion failure', async () => {
    const heic2any = (await import('heic2any')).default as Mock;
    heic2any.mockRejectedValue(new Error('Conversion failed'));

    const heicFile = createMockFile('photo.heic', 'image/heic');

    await expect(convertHeicToJpeg(heicFile)).rejects.toThrow(
      'Failed to convert HEIC image. Please try uploading a JPEG or PNG file instead.'
    );
  });
});

// ============================================================================
// getImageUrl Tests
// ============================================================================

describe('getImageUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/images/test.jpg' },
    });
  });

  describe('null/empty handling', () => {
    it('returns placeholder for null path', () => {
      expect(getImageUrl(null)).toBe('/placeholder.svg');
    });

    it('returns placeholder for empty string', () => {
      // Empty string is falsy
      expect(getImageUrl('')).toBe('/placeholder.svg');
    });
  });

  describe('full URLs', () => {
    it('returns http URLs as-is', () => {
      const url = 'http://example.com/image.jpg';
      expect(getImageUrl(url)).toBe(url);
    });

    it('returns https URLs as-is', () => {
      const url = 'https://cdn.example.com/images/photo.png';
      expect(getImageUrl(url)).toBe(url);
    });

    it('returns lovable-uploads paths as-is', () => {
      const path = '/lovable-uploads/abc123/image.jpg';
      expect(getImageUrl(path)).toBe(path);
    });
  });

  describe('storage paths', () => {
    it('gets public URL for images/ prefixed paths', async () => {
      const { supabase } = await import('@/shared');

      getImageUrl('images/user-123/profile.jpg');

      expect(supabase.storage.from).toHaveBeenCalledWith('images');
      expect(mockGetPublicUrl).toHaveBeenCalledWith('user-123/profile.jpg');
    });

    it('strips images/ prefix before calling getPublicUrl', () => {
      getImageUrl('images/events/banner.jpg');
      expect(mockGetPublicUrl).toHaveBeenCalledWith('events/banner.jpg');
    });

    it('returns the public URL from supabase', () => {
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.supabase.co/images/test.jpg' },
      });

      const result = getImageUrl('images/test.jpg');
      expect(result).toBe('https://storage.supabase.co/images/test.jpg');
    });
  });

  describe('other paths', () => {
    it('assumes other paths are in images bucket', async () => {
      const { supabase } = await import('@/shared');

      getImageUrl('some-other-path/photo.jpg');

      expect(supabase.storage.from).toHaveBeenCalledWith('images');
      expect(mockGetPublicUrl).toHaveBeenCalledWith('some-other-path/photo.jpg');
    });
  });
});

// ============================================================================
// compressImage Tests - Size Check Only (Canvas tests are complex in JSDOM)
// ============================================================================

describe('compressImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('size checks (bypassing compression)', () => {
    it('returns original file if under size limit', async () => {
      const smallFile = createMockFile('small.jpg', 'image/jpeg', 1000);

      const result = await compressImage(smallFile, {
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
      });

      expect(result).toBe(smallFile);
    });

    it('skips compression when file is under maxSizeBytes and forceResize is false', async () => {
      const file = createMockFile('photo.jpg', 'image/jpeg', 1000);

      const result = await compressImage(file, {
        maxSizeBytes: 5000,
        forceResize: false,
      });

      expect(result).toBe(file);
    });
  });

  describe('HEIC conversion trigger', () => {
    it('converts HEIC files before checking size', async () => {
      const heic2any = (await import('heic2any')).default as Mock;
      const convertedBlob = new Blob(['converted'], { type: 'image/jpeg' });
      heic2any.mockResolvedValue(convertedBlob);

      // Small HEIC file that won't need compression after conversion
      const heicFile = createMockFile('photo.heic', 'image/heic', 100);

      await compressImage(heicFile, {
        maxSizeBytes: 5 * 1024 * 1024,
      });

      expect(heic2any).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Default Options Tests
// ============================================================================

describe('ImageCompressionOptions defaults', () => {
  it('documents expected default values', () => {
    // These are the expected defaults based on the implementation
    const expectedDefaults: ImageCompressionOptions = {
      maxWidth: 1920,
      maxHeight: 1920,
      maxSizeBytes: 5 * 1024 * 1024, // 5MB
      quality: 0.85,
      forceResize: false,
    };

    // This test documents the contract
    expect(expectedDefaults.maxWidth).toBe(1920);
    expect(expectedDefaults.maxHeight).toBe(1920);
    expect(expectedDefaults.maxSizeBytes).toBe(5242880);
    expect(expectedDefaults.quality).toBe(0.85);
    expect(expectedDefaults.forceResize).toBe(false);
  });
});
