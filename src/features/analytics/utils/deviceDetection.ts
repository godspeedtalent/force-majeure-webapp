/**
 * Device Detection Utilities
 *
 * Detect device type, browser, and OS from user agent.
 */

export interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * Detect device type from user agent
 */
export function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase();

  // Check for tablets first (they often include mobile keywords too)
  if (/ipad|android(?!.*mobile)|tablet/i.test(ua)) {
    return 'tablet';
  }

  // Check for mobile devices
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Detect browser from user agent
 */
export function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('opera') || ua.includes('opr/')) return 'Opera';
  if (ua.includes('msie') || ua.includes('trident/')) return 'IE';

  return 'Unknown';
}

/**
 * Detect OS from user agent
 */
export function detectOS(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os')) return 'macOS';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('chrome os')) return 'ChromeOS';

  return 'Unknown';
}

/**
 * Get complete device information
 */
export function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent;

  return {
    deviceType: detectDeviceType(userAgent),
    browser: detectBrowser(userAgent),
    os: detectOS(userAgent),
    userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
}
