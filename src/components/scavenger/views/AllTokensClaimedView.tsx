import { MessagePanel } from '@/components/MessagePanel';

interface AllTokensClaimedViewProps {
  locationName: string;
}

export function AllTokensClaimedView({ locationName }: AllTokensClaimedViewProps) {
  return (
    <MessagePanel 
      title="All Claimed!"
      description={`All rewards from ${locationName} have been claimed. Try finding another location!`}
      className="mb-4"
    />
  );
}