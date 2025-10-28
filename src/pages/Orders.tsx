import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import { Separator } from '@/components/ui/shadcn/separator';
import { useOrders } from '@/features/events/hooks/useOrders';
import { LoadingState } from '@/components/common/LoadingState';
import { EmptyState } from '@/components/common/EmptyState';
import { Layout } from '@/components/layout/Layout';
import { format } from 'date-fns';
import { Receipt, Calendar } from 'lucide-react';

export default function Orders() {
  const { data: orders, isLoading } = useOrders();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'failed':
      case 'expired':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <LoadingState />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Receipt className="h-6 w-6 text-fm-gold" />
          <h1 className="text-3xl font-canela font-bold">My Orders</h1>
        </div>
        <p className="text-muted-foreground">
          View your ticket purchases and order history
        </p>
      </div>

      {!orders || orders.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No Orders Yet"
          description="Your ticket purchases will appear here"
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="font-canela">
                      {order.event?.title || 'Event'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {order.event?.date && format(new Date(order.event.date), 'MMM d, yyyy')}
                      </span>
                      {order.event?.time && (
                        <span>at {order.event.time}</span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Separator />
                
                {/* Order Items */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Tickets</h4>
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.ticket_tier?.name || 'Ticket'}
                      </span>
                      <span className="text-fm-gold">
                        ${(item.subtotal_cents / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Order Totals */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${(order.subtotal_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Fees</span>
                    <span>${(order.fees_cents / 100).toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-canela text-base">
                    <span>Total</span>
                    <span className="text-fm-gold">
                      ${(order.total_cents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground pt-2">
                  Order placed {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </Layout>
  );
}
