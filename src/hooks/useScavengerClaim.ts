import { useState } from 'react';
import { claimScavengerReward } from '@/lib/scavengerApi';
import type { ClaimResult } from '@/lib/scavengerApi';

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
      const claimResult = await claimScavengerReward(
        token,
        userEmail,
        displayName,
        showOnLeaderboard
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
