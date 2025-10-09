import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase } from '@/shared/api/supabase/client';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { toast } from '@/shared/hooks/use-toast';

// Hook for URL parameter handling and redirection logic
export function useScavengerNavigation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const locationId = searchParams.get('locationId');
  const errorParam = searchParams.get('error');
  const debugMode = searchParams.get('debug') === 'true';
  const [showInvalidToken, setShowInvalidToken] = useState(false);

  // Handle error from validate-location
  useEffect(() => {
    if (errorParam === 'invalid_token') {
      const token = searchParams.get('token');
      setShowInvalidToken(true);

      // Show toast with the invalid token (for debugging)
      toast({
        title: 'Invalid Token',
        description: token || '(no token provided)',
        variant: 'destructive',
      });

      // Clear error param from URL after setting state
      navigate('/scavenger', { replace: true });
    } else if (errorParam) {
      const token = searchParams.get('token');

      // Show toast for other errors
      toast({
        title: `Error: ${errorParam}`,
        description: token || '(no token provided)',
        variant: 'destructive',
      });

      navigate('/scavenger', { replace: true });
    }
  }, [errorParam, navigate, searchParams]);

  return {
    locationId,
    debugMode,
    showInvalidToken,
    navigate,
  };
}

// Hook for claim mutation logic
export function useClaimReward() {
  return useMutation({
    mutationFn: async (params: {
      locationId: string;
      userEmail: string;
      displayName: string;
      showOnLeaderboard: boolean;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('User not authenticated');
      }

      // Check if user already claimed from this location
      const { data: existingClaim } = await supabase
        .from('scavenger_claims')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('location_id', params.locationId)
        .single();

      if (existingClaim) {
        throw new Error('You have already claimed a reward from this location');
      }

      // Get location details to verify it's still active
      const { data: location, error: locationError } = await supabase
        .from('scavenger_locations')
        .select('id, location_name, is_active')
        .eq('id', params.locationId)
        .single();

      if (locationError || !location) {
        throw new Error('Location not found');
      }

      if (!location.is_active) {
        throw new Error('This location is no longer active');
      }

      // Create the claim with required fields
      const { data: claim, error: claimError } = await supabase
        .from('scavenger_claims')
        .insert([{
          user_id: session.user.id,
          location_id: params.locationId,
          show_on_leaderboard: params.showOnLeaderboard,
          claimed_at: new Date().toISOString(),
          claim_position: 1, // Single position per location now
        }] as any)
        .select('id, claim_position')
        .single();

      if (claimError) {
        throw claimError;
      }

      return {
        success: true,
        claimId: claim.id,
        claimPosition: claim.claim_position,
        locationName: location.location_name,
      };
    },
  });
}

// Hook for fetching all scavenger locations
export function useScavengerLocations() {
  return useQuery({
    queryKey: ['scavenger-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scavenger_locations')
        .select('*')
        .eq('is_active', true)
        .order('location_name');

      if (error) throw error;
      return data;
    },
    staleTime: 60000, // 1 minute
  });
}

// Hook for fetching user's claims
export function useUserClaims() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-claims', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('scavenger_claims')
        .select(
          `
          *,
          scavenger_locations!inner(*)
        `
        )
        .eq('user_id', user.id)
        .order('claimed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });
}

// Hook for fetching all claims (for admin purposes)
export function useAllClaims() {
  const { data: userRole } = useUserRole();
  const isAdmin = userRole === 'admin';

  return useQuery({
    queryKey: ['all-claims'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scavenger_claims')
        .select('location_id')
        .order('claimed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
    staleTime: 60000, // 1 minute
  });
}

// Hook for counting claims for a specific location
export function useLocationClaimCount(locationId: string | null) {
  return useQuery({
    queryKey: ['location-claim-count', locationId],
    queryFn: async () => {
      if (!locationId) return 0;

      const { count, error } = await supabase
        .from('scavenger_claims')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', locationId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!locationId,
    staleTime: 30000, // 30 seconds
  });
}

// Auto-scroll hook
export function useAutoScroll() {
  useEffect(() => {
    // Auto-scroll to top on page load
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
}
