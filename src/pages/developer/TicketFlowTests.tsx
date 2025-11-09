import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardCheck,
  Users,
  ShoppingCart,
  CreditCard,
  Clock,
  CheckCircle,
  Send,
} from 'lucide-react';

import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { Badge } from '@/components/common/shadcn/badge';
import { TestSuiteRunner } from '@/features/testing/components/TestSuiteRunner';
import { queueTestSuite } from './ticket-flow/tests/queueTests';

type TicketFlowScenario =
  | 'queue'
  | 'selection'
  | 'payment'
  | 'timeout'
  | 'confirmation'
  | 'delivery';

interface FmCommonSideNavGroup<T extends string> {
  label: string;
  icon: any;
  items: Array<{
    id: T;
    label: string;
    icon: any;
    description: string;
    badge?: React.ReactNode;
  }>;
}

export default function TicketFlowTests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeScenario =
    (searchParams.get('scenario') as TicketFlowScenario) || 'queue';

  const handleScenarioChange = (scenario: TicketFlowScenario) => {
    setSearchParams({ scenario });
  };

  // Navigation groups for side navbar
  const navGroups: FmCommonSideNavGroup<TicketFlowScenario>[] = [
    {
      label: 'Test Scenarios',
      icon: ClipboardCheck,
      items: [
        {
          id: 'queue',
          label: 'Queue Tests',
          icon: Users,
          description: 'Test checkout queue management and user flow',
          badge: <Badge variant='outline'>6 tests</Badge>,
        },
        {
          id: 'selection',
          label: 'Selection Tests',
          icon: ShoppingCart,
          description: 'Test ticket selection and cart operations',
          badge: <Badge variant='outline'>6 tests</Badge>,
        },
        {
          id: 'payment',
          label: 'Payment Tests',
          icon: CreditCard,
          description: 'Test payment processing and Stripe integration',
          badge: <Badge variant='outline'>6 tests</Badge>,
        },
        {
          id: 'timeout',
          label: 'Timeout Tests',
          icon: Clock,
          description: 'Test timer expiration and session cleanup',
          badge: <Badge variant='outline'>5 tests</Badge>,
        },
        {
          id: 'confirmation',
          label: 'Confirmation Tests',
          icon: CheckCircle,
          description: 'Test order confirmation and record creation',
          badge: <Badge variant='outline'>5 tests</Badge>,
        },
        {
          id: 'delivery',
          label: 'Delivery Tests',
          icon: Send,
          description: 'Test ticket delivery and PDF generation',
          badge: <Badge variant='outline'>5 tests</Badge>,
        },
      ],
    },
  ];

  // Render content based on active scenario
  const renderScenarioContent = () => {
    switch (activeScenario) {
      case 'queue':
        return <QueueTestsContent />;
      case 'selection':
        return <SelectionTestsContent />;
      case 'payment':
        return <PaymentTestsContent />;
      case 'timeout':
        return <TimeoutTestsContent />;
      case 'confirmation':
        return <ConfirmationTestsContent />;
      case 'delivery':
        return <DeliveryTestsContent />;
      default:
        return <QueueTestsContent />;
    }
  };

  return (
    <SideNavbarLayout
      navigationGroups={navGroups}
      activeItem={activeScenario}
      onItemChange={id => handleScenarioChange(id as TicketFlowScenario)}
      backgroundOpacity={0.15}
      showDividers={false}
      defaultOpen={true}
    >
      <div className='space-y-[20px]'>
        <div className='mb-[40px]'>
          <div className='flex items-center gap-[10px] mb-[10px]'>
            <ClipboardCheck className='h-8 w-8 text-fm-gold' />
            <h1 className='text-3xl font-canela text-white'>
              Ticket Flow Smoke Tests
            </h1>
          </div>
          <p className='text-sm text-muted-foreground font-canela'>
            Comprehensive end-to-end testing for the ticketing system
          </p>
        </div>
        {renderScenarioContent()}
      </div>
    </SideNavbarLayout>
  );
}

// Placeholder components for each scenario

function QueueTestsContent() {
  return (
    <TestSuiteRunner
      suite={queueTestSuite}
      icon={Users}
      options={{
        maxConcurrency: 3,
        timeout: 60000,
        retries: 1,
        stopOnError: false,
      }}
    />
  );
}

function SelectionTestsContent() {
  return (
    <div className='space-y-[20px]'>
      <FmCommonCard variant='default' className='p-[40px]'>
        <div className='flex items-start gap-[20px]'>
          <div className='p-[10px] bg-fm-gold/10 rounded-none'>
            <ShoppingCart className='h-6 w-6 text-fm-gold' />
          </div>
          <div className='flex-1'>
            <h2 className='text-xl font-canela text-white mb-[10px]'>
              Ticket selection tests.
            </h2>
            <p className='text-sm text-muted-foreground font-canela mb-[20px]'>
              Test ticket selection flow including adding to cart, updating
              quantities, inventory checks, and cart persistence.
            </p>
            <div className='space-y-[10px]'>
              <h3 className='text-sm font-canela text-fm-gold uppercase'>
                Test cases to implement:
              </h3>
              <ul className='list-disc list-inside space-y-[5px] text-sm text-muted-foreground font-canela'>
                <li>Add single ticket tier to cart</li>
                <li>Add multiple ticket tiers to cart</li>
                <li>Update ticket quantities</li>
                <li>Remove tickets from cart</li>
                <li>Sold out tier handling</li>
                <li>Cart persistence across page refresh</li>
              </ul>
            </div>
          </div>
        </div>
      </FmCommonCard>

      <FmCommonCard variant='outline' className='p-[20px]'>
        <p className='text-xs text-muted-foreground font-canela text-center'>
          Test implementation coming soon. This will validate cart operations and
          inventory management.
        </p>
      </FmCommonCard>
    </div>
  );
}

function PaymentTestsContent() {
  return (
    <div className='space-y-[20px]'>
      <FmCommonCard variant='default' className='p-[40px]'>
        <div className='flex items-start gap-[20px]'>
          <div className='p-[10px] bg-fm-gold/10 rounded-none'>
            <CreditCard className='h-6 w-6 text-fm-gold' />
          </div>
          <div className='flex-1'>
            <h2 className='text-xl font-canela text-white mb-[10px]'>
              Payment processing tests.
            </h2>
            <p className='text-sm text-muted-foreground font-canela mb-[20px]'>
              Test payment flow including successful payments, failures, fee
              calculations, and concurrent transactions.
            </p>
            <div className='space-y-[10px]'>
              <h3 className='text-sm font-canela text-fm-gold uppercase'>
                Test cases to implement:
              </h3>
              <ul className='list-disc list-inside space-y-[5px] text-sm text-muted-foreground font-canela'>
                <li>Successful payment completion</li>
                <li>Failed payment (declined card)</li>
                <li>Payment timeout scenario</li>
                <li>Concurrent payment processing</li>
                <li>Service fee calculation accuracy</li>
                <li>Refund simulation (future)</li>
              </ul>
            </div>
          </div>
        </div>
      </FmCommonCard>

      <FmCommonCard variant='outline' className='p-[20px]'>
        <p className='text-xs text-muted-foreground font-canela text-center'>
          Test implementation coming soon. This will use mock Stripe integration
          for safe testing.
        </p>
      </FmCommonCard>
    </div>
  );
}

function TimeoutTestsContent() {
  return (
    <div className='space-y-[20px]'>
      <FmCommonCard variant='default' className='p-[40px]'>
        <div className='flex items-start gap-[20px]'>
          <div className='p-[10px] bg-fm-gold/10 rounded-none'>
            <Clock className='h-6 w-6 text-fm-gold' />
          </div>
          <div className='flex-1'>
            <h2 className='text-xl font-canela text-white mb-[10px]'>
              Timer and timeout tests.
            </h2>
            <p className='text-sm text-muted-foreground font-canela mb-[20px]'>
              Test timer expiration scenarios including cart timeout, session
              timeout, and proper cleanup.
            </p>
            <div className='space-y-[10px]'>
              <h3 className='text-sm font-canela text-fm-gold uppercase'>
                Test cases to implement:
              </h3>
              <ul className='list-disc list-inside space-y-[5px] text-sm text-muted-foreground font-canela'>
                <li>Cart timer expiration (9 minutes)</li>
                <li>Session timeout (30 minutes)</li>
                <li>Timeout during payment processing</li>
                <li>Queue re-entry after timeout</li>
                <li>Warning notifications (2 min, 10 sec thresholds)</li>
              </ul>
            </div>
          </div>
        </div>
      </FmCommonCard>

      <FmCommonCard variant='outline' className='p-[20px]'>
        <p className='text-xs text-muted-foreground font-canela text-center'>
          Test implementation coming soon. This will validate timer accuracy and
          cleanup behavior.
        </p>
      </FmCommonCard>
    </div>
  );
}

function ConfirmationTestsContent() {
  return (
    <div className='space-y-[20px]'>
      <FmCommonCard variant='default' className='p-[40px]'>
        <div className='flex items-start gap-[20px]'>
          <div className='p-[10px] bg-fm-gold/10 rounded-none'>
            <CheckCircle className='h-6 w-6 text-fm-gold' />
          </div>
          <div className='flex-1'>
            <h2 className='text-xl font-canela text-white mb-[10px]'>
              Order confirmation tests.
            </h2>
            <p className='text-sm text-muted-foreground font-canela mb-[20px]'>
              Test order confirmation flow including record creation, email
              receipts, and inventory updates.
            </p>
            <div className='space-y-[10px]'>
              <h3 className='text-sm font-canela text-fm-gold uppercase'>
                Test cases to implement:
              </h3>
              <ul className='list-disc list-inside space-y-[5px] text-sm text-muted-foreground font-canela'>
                <li>Order confirmation page display</li>
                <li>Email receipt generation (mock)</li>
                <li>Order appears in user history</li>
                <li>Correct ticket allocation to user</li>
                <li>Sold inventory incremented properly</li>
              </ul>
            </div>
          </div>
        </div>
      </FmCommonCard>

      <FmCommonCard variant='outline' className='p-[20px]'>
        <p className='text-xs text-muted-foreground font-canela text-center'>
          Test implementation coming soon. This will verify order completion and
          data integrity.
        </p>
      </FmCommonCard>
    </div>
  );
}

function DeliveryTestsContent() {
  return (
    <div className='space-y-[20px]'>
      <FmCommonCard variant='default' className='p-[40px]'>
        <div className='flex items-start gap-[20px]'>
          <div className='p-[10px] bg-fm-gold/10 rounded-none'>
            <Send className='h-6 w-6 text-fm-gold' />
          </div>
          <div className='flex-1'>
            <h2 className='text-xl font-canela text-white mb-[10px]'>
              Ticket delivery tests.
            </h2>
            <p className='text-sm text-muted-foreground font-canela mb-[20px]'>
              Test ticket delivery mechanisms including PDF generation, QR codes,
              and email delivery.
            </p>
            <div className='space-y-[10px]'>
              <h3 className='text-sm font-canela text-fm-gold uppercase'>
                Test cases to implement:
              </h3>
              <ul className='list-disc list-inside space-y-[5px] text-sm text-muted-foreground font-canela'>
                <li>PDF ticket generation (stubbed)</li>
                <li>QR code creation for tickets</li>
                <li>Email delivery simulation</li>
                <li>Ticket download link generation</li>
                <li>QR code validation and scanning</li>
              </ul>
            </div>
          </div>
        </div>
      </FmCommonCard>

      <FmCommonCard variant='outline' className='p-[20px]'>
        <p className='text-xs text-muted-foreground font-canela text-center'>
          Test implementation coming soon. This will validate ticket generation
          and delivery workflows.
        </p>
      </FmCommonCard>
    </div>
  );
}
