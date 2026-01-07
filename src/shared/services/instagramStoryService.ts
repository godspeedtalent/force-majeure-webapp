import { logger } from '@/shared/services/logger';
import {
  createStoryTemplate,
  StoryData,
  StoryGenerationResult,
} from '@/components/common/sharing/templates/BaseStoryTemplate';

/**
 * Check if the current device is a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Check if Instagram Story sharing is available
 * (Only available on mobile devices)
 */
export function isInstagramStoryAvailable(): boolean {
  return isMobileDevice();
}

/**
 * Generate a story preview image without sharing
 */
export async function generateStoryPreview(
  data: StoryData
): Promise<StoryGenerationResult> {
  logger.info('Generating story preview', {
    entityType: data.entityType,
    title: data.title,
    source: 'instagramStoryService.generateStoryPreview',
  });

  return createStoryTemplate(data);
}

/**
 * Share to Instagram Stories
 *
 * On iOS: Uses instagram-stories:// URL scheme
 * On Android: Uses Web Share API or direct intent
 *
 * Note: The user must have the Instagram app installed for this to work.
 */
export async function shareToInstagramStory(data: StoryData): Promise<boolean> {
  if (!isInstagramStoryAvailable()) {
    logger.warn('Instagram Story sharing not available on this device', {
      source: 'instagramStoryService.shareToInstagramStory',
    });
    return false;
  }

  try {
    logger.info('Starting Instagram Story share', {
      entityType: data.entityType,
      title: data.title,
      source: 'instagramStoryService.shareToInstagramStory',
    });

    // Generate the story image
    const { blob, dataUrl } = await createStoryTemplate(data);

    // Try different sharing methods based on platform capabilities
    const shared = await tryShareMethods(blob, dataUrl, data);

    if (shared) {
      logger.info('Instagram Story share initiated successfully', {
        entityType: data.entityType,
        source: 'instagramStoryService.shareToInstagramStory',
      });
    }

    return shared;
  } catch (error) {
    logger.error('Failed to share to Instagram Story', {
      error: error instanceof Error ? error.message : 'Unknown',
      entityType: data.entityType,
      source: 'instagramStoryService.shareToInstagramStory',
    });
    throw error;
  }
}

/**
 * Try different sharing methods in order of preference
 */
async function tryShareMethods(
  blob: Blob,
  _dataUrl: string,
  data: StoryData
): Promise<boolean> {
  // Method 1: Web Share API (best for Android)
  if (await tryWebShareAPI(blob, data)) {
    return true;
  }

  // Method 2: Instagram URL scheme (iOS fallback)
  if (tryInstagramURLScheme()) {
    return true;
  }

  // Method 3: Download as fallback
  downloadImage(blob, data.title);
  return true;
}

/**
 * Try to share using the Web Share API
 */
async function tryWebShareAPI(blob: Blob, data: StoryData): Promise<boolean> {
  if (!navigator.share || !navigator.canShare) {
    logger.info('Web Share API not available', {
      source: 'instagramStoryService.tryWebShareAPI',
    });
    return false;
  }

  try {
    const file = new File(
      [blob],
      `${sanitizeFilename(data.title)}_story.jpg`,
      { type: 'image/jpeg' }
    );

    const shareData: ShareData = {
      files: [file],
      title: data.title,
    };

    // Check if we can share files
    if (!navigator.canShare(shareData)) {
      logger.info('Cannot share files via Web Share API', {
        source: 'instagramStoryService.tryWebShareAPI',
      });
      return false;
    }

    await navigator.share(shareData);

    logger.info('Shared via Web Share API', {
      source: 'instagramStoryService.tryWebShareAPI',
    });

    return true;
  } catch (error) {
    // User cancelled or error occurred
    if (error instanceof Error && error.name === 'AbortError') {
      logger.info('User cancelled Web Share', {
        source: 'instagramStoryService.tryWebShareAPI',
      });
      return true; // Consider this a "handled" case
    }

    logger.warn('Web Share API failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      source: 'instagramStoryService.tryWebShareAPI',
    });
    return false;
  }
}

/**
 * Try to open Instagram app via URL scheme
 * Note: This is limited in what it can do directly, but can open Instagram
 */
function tryInstagramURLScheme(): boolean {
  try {
    // Try to open Instagram app
    // Note: instagram-stories:// scheme has limited support for direct image passing
    // The most reliable way is to open Instagram and let user share from camera roll
    const instagramURL = 'instagram://app';

    // Create a hidden link and click it
    const link = document.createElement('a');
    link.href = instagramURL;
    link.style.display = 'none';
    document.body.appendChild(link);

    // Use a timeout to detect if Instagram opened
    const startTime = Date.now();

    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);

      // If we're still here after 2 seconds, Instagram probably didn't open
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        logger.info('Instagram URL scheme may have worked', {
          elapsed,
          source: 'instagramStoryService.tryInstagramURLScheme',
        });
      }
    }, 100);

    return true;
  } catch (error) {
    logger.warn('Instagram URL scheme failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      source: 'instagramStoryService.tryInstagramURLScheme',
    });
    return false;
  }
}

/**
 * Download the image as a fallback
 */
function downloadImage(blob: Blob, title: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFilename(title)}_story.jpg`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    logger.info('Downloaded story image as fallback', {
      title,
      source: 'instagramStoryService.downloadImage',
    });
  } catch (error) {
    logger.error('Failed to download story image', {
      error: error instanceof Error ? error.message : 'Unknown',
      source: 'instagramStoryService.downloadImage',
    });
  }
}

/**
 * Sanitize a string for use as a filename
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50);
}

/**
 * Convert data URL to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Open Instagram profile (for fallback scenarios)
 */
export function openInstagramProfile(handle?: string): void {
  const url = handle
    ? `https://instagram.com/${handle.replace('@', '')}`
    : 'https://instagram.com';

  window.open(url, '_blank', 'noopener,noreferrer');
}
