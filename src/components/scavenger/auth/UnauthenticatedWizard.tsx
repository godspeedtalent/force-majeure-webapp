import { WizardPanel, useWizardNavigation } from '@/components/WizardPanel';
import { useState } from 'react';
import { ConfirmationStep } from './ConfirmationStep';
import { LoginForm } from './LoginForm';
import { RegistrationForm } from './RegistrationForm';
import { WelcomeStep } from './WelcomeStep';

// Simplified interface - clean and minimal
interface UnauthenticatedWizardProps {
  locationName?: string;
  userDisplayName?: string;
  isAuthenticated?: boolean;
  hasAlreadyClaimed?: boolean;
  isClaimLoading?: boolean;
  onLoginSuccess?: () => void;
  onClaimCheckpoint?: () => void;
}

export function UnauthenticatedWizard({
  locationName,
  onLoginSuccess,
  onClaimCheckpoint,
  userDisplayName,
  isAuthenticated = false,
  hasAlreadyClaimed = false,
  isClaimLoading = false
}: UnauthenticatedWizardProps) {
  const { currentStep, setCurrentStep, nextStep } = useWizardNavigation();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');

  console.log('🔍 UnauthenticatedWizard Debug:', {
    currentStep,
    isLoginMode,
    locationName,
    hasLocationName: !!locationName,
    isAuthenticated,
    hasAlreadyClaimed
  });

  // If user wants to login instead of register
  if (isLoginMode) {
    return (
      <LoginForm
        title="Welcome Back"
        description={locationName
          ? 'Sign in to claim your reward'
          : 'Sign in to continue the scavenger hunt'
        }
        onSuccess={() => {
          console.log('✅ Login successful');
          onLoginSuccess?.();
        }}
        onBack={() => {
          console.log('🔙 Back from login');
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
            console.log('📝 Join clicked, going to registration');
            nextStep();
          }}
          onSignInClick={() => {
            console.log('🔑 Sign in clicked, switching to login mode');
            setIsLoginMode(true);
          }}
          onClaimCheckpoint={onClaimCheckpoint}
          userDisplayName={userDisplayName}
          isAuthenticated={isAuthenticated}
          hasAlreadyClaimed={hasAlreadyClaimed}
          isClaimLoading={isClaimLoading}
        />
      ),
      canGoBack: false,
    },

    // Step 1: Registration
    {
      content: (
        <RegistrationForm
          title="Join the Rave Fam"
          description={locationName
            ? 'Register to claim your reward.'
            : 'Register to claim your free tickets when you find them.'
          }
          onSuccess={(email) => {
            console.log('✅ Registration successful, going to confirmation');
            setRegistrationEmail(email);
            nextStep();
          }}
        />
      ),
      canGoBack: true,
    },

    // Step 2: Confirmation
    {
      content: (
        <ConfirmationStep email={registrationEmail} />
      ),
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