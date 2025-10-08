import { MessagePanel } from '@/components/MessagePanel';

export function InvalidTokenView() {
  return (
    <>
      <MessagePanel 
        title="Invalid Code"
        description="This QR code doesn't seem to be valid. Please try scanning it again."
        className="mb-4"
      />
      <div className="text-center space-y-3 text-sm lg:text-base">
        <p className="text-foreground font-canela">
          If you keep having issues, take a photo of the poster with your hand holding up 3 fingers next to it.
        </p>
        <p className="text-foreground font-canela">
          Send that photo in a DM to{' '}
          <a 
            href="https://www.instagram.com/force.majeure.events/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fm-gold hover:underline"
          >
            @force.majeure.events
          </a>
          {' '}on Instagram.
        </p>
      </div>
    </>
  );
}