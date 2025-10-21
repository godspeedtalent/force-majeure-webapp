import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EventCheckout() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    // TODO: Implement checkout flow
    console.log('Checkout initiated');
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link 
          to="/demo" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Demos
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Event Checkout Demo</h1>
          </div>
          <p className="text-muted-foreground">
            Test the complete ticket purchasing flow
          </p>
          <Badge variant="outline" className="mt-2">
            Development Only
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* Event Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select Event</CardTitle>
              <CardDescription>
                Choose an event to test ticket purchasing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Sample Event</h3>
                <p className="text-sm text-muted-foreground">
                  This will be populated with actual events from the database
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Select Tickets</CardTitle>
              <CardDescription>
                Choose ticket tiers and quantities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Ticket tier selection UI will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Review & Checkout</CardTitle>
              <CardDescription>
                Review your order and proceed to payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fees</span>
                  <span>$0.00</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>$0.00</span>
                </div>
              </div>

              <Button 
                onClick={handleCheckout} 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Proceed to Checkout
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Debug Info */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
              <CardDescription>
                Technical details for testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Edge Function:</span>
                  <span>create-checkout-session</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Webhook Handler:</span>
                  <span>handle-stripe-webhook</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hold Duration:</span>
                  <span>10 minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
