import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { useState } from 'react';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useClaimReward, useScavengerLocations, useUserClaims, } from '@/features/scavenger/hooks/useScavenger';
import { useToast } from '@/shared/hooks/use-toast';
export function ScavengerOrchestrator({ children, initialLocationId = null, }) {
    const { t } = useTranslation('common');
    const { toast } = useToast();
    const { user, profile } = useAuth();
    const claimMutation = useClaimReward();
    const { data: locations } = useScavengerLocations();
    const { data: userClaims } = useUserClaims();
    // Local orchestrator state
    const [currentStep, setCurrentStep] = useState('welcome');
    const [locationId, setLocationId] = useState(initialLocationId);
    const [isClaimLoading, setIsClaimLoading] = useState(false);
    // Wizard flow state
    const [wizardStep, setWizardStep] = useState(1);
    const [isLoginMode, setIsLoginMode] = useState(false);
    const [registrationEmail, setRegistrationEmail] = useState('');
    // Generate user display name (prefer full_name, fallback to display_name)
    const userDisplayName = profile?.full_name ||
        profile?.display_name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.display_name ||
        user?.email;
    // Find location data for current locationId
    const location = locationId && locations
        ? (locations.find(loc => loc.id === locationId) ?? null)
        : null;
    // Determine if user has already claimed this location
    const hasAlreadyClaimed = Boolean(locationId && userClaims?.some(claim => claim.location_id === locationId));
    // Build complete state object
    const state = {
        isAuthenticated: Boolean(user),
        user,
        userDisplayName,
        locationId,
        location: location ? {
            id: location.id,
            location_name: location.name,
            tokens_remaining: 0,
            is_active: true,
            validation_count: location.checkin_count,
        } : null,
        hasAlreadyClaimed,
        isClaimLoading,
        currentStep,
        wizardStep,
        isLoginMode,
        registrationEmail,
    };
    // Build complete actions object
    const actions = {
        // Navigation actions
        goToWelcome: () => setCurrentStep('welcome'),
        goToWizard: () => setCurrentStep('unauthenticated-wizard'),
        setWizardStep,
        setLoginMode: setIsLoginMode,
        setRegistrationEmail,
        // Authentication actions
        handleSignIn: () => {
            setIsLoginMode(true);
            setCurrentStep('unauthenticated-wizard');
        },
        handleJoin: () => {
            setIsLoginMode(false);
            setCurrentStep('unauthenticated-wizard');
        },
        // Claim actions
        claimCheckpoint: async () => {
            if (!locationId || !user || !userDisplayName)
                return;
            setIsClaimLoading(true);
            try {
                await claimMutation.mutateAsync({
                    locationId,
                    userEmail: user.email || '',
                    displayName: userDisplayName,
                    showOnLeaderboard: true,
                });
                toast({
                    title: t('scavengerOrchestrator.successTitle'),
                    description: t('scavengerOrchestrator.addedToGuestlist'),
                });
            }
            catch (error) {
                logger.error('Claim error:', error);
                toast({
                    title: t('scavengerOrchestrator.errorTitle'),
                    description: error.message || t('scavengerOrchestrator.claimFailed'),
                    variant: 'destructive',
                });
            }
            finally {
                setIsClaimLoading(false);
            }
        },
        // Location actions
        updateLocationId: (newLocationId) => {
            setLocationId(newLocationId);
        },
    };
    return _jsx(_Fragment, { children: children(state, actions) });
}
