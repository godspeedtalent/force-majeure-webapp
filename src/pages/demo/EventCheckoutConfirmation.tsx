import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { Separator } from '@/components/common/shadcn/separator';

export default function EventCheckoutConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const eventId = searchParams.get('eventId') || '';
  const eventName = searchParams.get('eventName') || 'Event';
  const eventDate = searchParams.get('eventDate') || '';
  const email = searchParams.get('email') || '';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <TopographicBackground opacity={0.25} />
      <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
      
      <Card className="w-full max-w-2xl relative z-10 p-8">
        {/* Success Icon */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-6 w-20 h-20 rounded-full bg-fm-gold/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-fm-gold" />
          </div>
          <h1 className="text-3xl font-canela mb-2">Purchase Successful!</h1>
          <p className="text-muted-foreground">
            Your tickets have been confirmed
          </p>
        </div>

        <Separator className="my-6" />

        {/* Event Summary */}
        <div className="space-y-4 mb-8">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Event</h3>
            <p className="text-lg font-canela">{eventName}</p>
          </div>
          {eventDate && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Date</h3>
              <p className="text-lg">{new Date(eventDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</p>
            </div>
          )}
        </div>

        <Separator className="my-6" />

        {/* Email Confirmation Message */}
        <div className="bg-muted/20 p-4 rounded-lg mb-8">
          <p className="text-sm text-center">
            Your tickets have been sent to{' '}
            <span className="font-medium text-fm-gold">{email}</span>
          </p>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Please check your inbox and spam folder
          </p>
        </div>

        {/* Back to Event Button */}
        <Button
          onClick={() => navigate(`/developer/demo/event-checkout?eventId=${eventId}`)}
          className="w-full bg-fm-gold hover:bg-fm-gold/90 text-black"
          size="lg"
        >
          Back to Event
        </Button>
      </Card>
    </div>
  );
}
