import { useState } from 'react';
import { claimScavengerReward } from '@/lib/scavengerApi';
import type { ClaimResult } from '@/lib/scavengerApi';

// Create device fingerprint from browser info
const getDeviceFingerprint = (): string => {
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const platform = navigator.platform;
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const colorDepth = window.screen.colorDepth;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return `${userAgent}::${language}::${platform}::${screenResolution}::${colorDepth}::${timezone}`;
};

export const useScavengerClaim = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);

  const claim = async (
    token: string,
    userEmail: string,
    displayName: string,
    showOnLeaderboard: boolean
  ) => {
    setLoading(true);
    try {
      const deviceFingerprint = getDeviceFingerprint();
      const claimResult = await claimScavengerReward(
        token,
        userEmail,
        displayName,
        showOnLeaderboard,
        deviceFingerprint
      );
      setResult(claimResult);
      return claimResult;
    } catch (error) {
      console.error('Claim error:', error);
      const errorResult: ClaimResult = {
        success: false,
        error: 'Failed to claim reward'
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
  };

  return { claim, loading, result, reset };
};
