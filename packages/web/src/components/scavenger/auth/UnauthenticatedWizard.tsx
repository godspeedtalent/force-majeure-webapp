import { useState } from 'react';

import { ConfirmationStep } from './ConfirmationStep';
import { LoginForm } from './LoginForm';
import { RegistrationForm } from './RegistrationForm';
import { WelcomeStep } from './WelcomeStep';

import {
  WizardPanel,
  useWizardNavigation,
} from '@/components/feedback/WizardPanel';

// Simplified interface - clean and minimal
interface UnauthenticatedWizardProps {
  locationName?: string;
  userFullName?: string;
  isAuthenticated?: boolean;
  hasAlreadyClaimed?: boolean;
  isClaimLoading?: boolean;
  claimCount?: number;
  onLoginSuccess?: () => void;
  onClaimCheckpoint?: () => void;
  lowClaimLocationsCount?: number;
}

export function UnauthenticatedWizard({
  locationName,
  onLoginSuccess,
  onClaimCheckpoint,
  userFullName,
  isAuthenticated = false,
  hasAlreadyClaimed = false,
  isClaimLoading = false,
  claimCount = 0,
  lowClaimLocationsCount,
}: UnauthenticatedWizardProps) {
  const { currentStep, setCurrentStep, nextStep } = useWizardNavigation();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');

  // If user wants to login instead of register
  if (isLoginMode) {
    return (
      <LoginForm
        title='Welcome Back'
        description={
          locationName
            ? 'Sign in to claim your reward'
            : 'Sign in to continue the scavenger hunt'
        }
        onSuccess={() => {
          onLoginSuccess?.();
        }}
        onBack={() => {
          setIsLoginMode(false);
        }}
      />
    );
  }

  const wizardSteps = [
    // Step 0: Welcome (checkpoint message or general welcome)
    {
      content: (
        <WelcomeStep
          locationName={locationName}
          onJoinClick={() => {
            nextStep();
          }}
          onSignInClick={() => {
            setIsLoginMode(true);
          }}
          onClaimCheckpoint={onClaimCheckpoint}
          userFullName={userFullName}
          isAuthenticated={isAuthenticated}
          hasAlreadyClaimed={hasAlreadyClaimed}
          isClaimLoading={isClaimLoading}
          claimCount={claimCount}
          lowClaimLocationsCount={lowClaimLocationsCount}
        />
      ),
      canGoBack: false,
    },

    // Step 1: Registration
    {
      content: (
        <RegistrationForm
          title='Join the Rave Fam'
          description={
            locationName
              ? 'Register to claim your reward.'
              : 'Register to claim your free tickets when you find them.'
          }
          onSuccess={email => {
            setRegistrationEmail(email);
            nextStep();
          }}
        />
      ),
      canGoBack: true,
    },

    // Step 2: Confirmation
    {
      content: <ConfirmationStep email={registrationEmail} />,
      canGoBack: false,
    },
  ];

  return (
    <WizardPanel
      steps={wizardSteps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
    />
  );
}
