import { MessagePanel } from '@/components/MessagePanel';

interface ConfirmationStepProps {
  email: string;
}

export function ConfirmationStep({ email }: ConfirmationStepProps) {
  return (
    <MessagePanel
      title='Check Your Email'
      description={`We've sent a verification link to ${email}. Click the link to verify your account and claim your reward!`}
    />
  );
}
