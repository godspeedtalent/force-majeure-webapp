import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSearchParams } from 'react-router-dom';
import { ClipboardCheck, Users, ShoppingCart, CreditCard, Clock, CheckCircle, Send, } from 'lucide-react';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { MobileHorizontalTabs } from '@/components/mobile';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { Badge } from '@/components/common/shadcn/badge';
import { TestSuiteRunner } from '@/features/testing/components/TestSuiteRunner';
import { queueTestSuite } from './ticket-flow/tests/queueTests';
export default function TicketFlowTests() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeScenario = searchParams.get('scenario') || 'queue';
    const handleScenarioChange = (scenario) => {
        setSearchParams({ scenario });
    };
    // Navigation groups for side navbar
    const navGroups = [
        {
            label: 'Test Scenarios',
            icon: ClipboardCheck,
            items: [
                {
                    id: 'queue',
                    label: 'Queue Tests',
                    icon: Users,
                    description: 'Test checkout queue management and user flow',
                    badge: _jsx(Badge, { variant: 'outline', children: "6 tests" }),
                },
                {
                    id: 'selection',
                    label: 'Selection Tests',
                    icon: ShoppingCart,
                    description: 'Test ticket selection and cart operations',
                    badge: _jsx(Badge, { variant: 'outline', children: "6 tests" }),
                },
                {
                    id: 'payment',
                    label: 'Payment Tests',
                    icon: CreditCard,
                    description: 'Test payment processing and Stripe integration',
                    badge: _jsx(Badge, { variant: 'outline', children: "6 tests" }),
                },
                {
                    id: 'timeout',
                    label: 'Timeout Tests',
                    icon: Clock,
                    description: 'Test timer expiration and session cleanup',
                    badge: _jsx(Badge, { variant: 'outline', children: "5 tests" }),
                },
                {
                    id: 'confirmation',
                    label: 'Confirmation Tests',
                    icon: CheckCircle,
                    description: 'Test order confirmation and record creation',
                    badge: _jsx(Badge, { variant: 'outline', children: "5 tests" }),
                },
                {
                    id: 'delivery',
                    label: 'Delivery Tests',
                    icon: Send,
                    description: 'Test ticket delivery and PDF generation',
                    badge: _jsx(Badge, { variant: 'outline', children: "5 tests" }),
                },
            ],
        },
    ];
    // Render content based on active scenario
    const renderScenarioContent = () => {
        switch (activeScenario) {
            case 'queue':
                return _jsx(QueueTestsContent, {});
            case 'selection':
                return _jsx(SelectionTestsContent, {});
            case 'payment':
                return _jsx(PaymentTestsContent, {});
            case 'timeout':
                return _jsx(TimeoutTestsContent, {});
            case 'confirmation':
                return _jsx(ConfirmationTestsContent, {});
            case 'delivery':
                return _jsx(DeliveryTestsContent, {});
            default:
                return _jsx(QueueTestsContent, {});
        }
    };
    // Mobile horizontal tabs
    const mobileTabs = [
        { id: 'queue', label: 'Queue', icon: Users },
        { id: 'selection', label: 'Selection', icon: ShoppingCart },
        { id: 'payment', label: 'Payment', icon: CreditCard },
        { id: 'timeout', label: 'Timeout', icon: Clock },
        { id: 'confirmation', label: 'Confirm', icon: CheckCircle },
        { id: 'delivery', label: 'Delivery', icon: Send },
    ];
    return (_jsxs(SideNavbarLayout, { navigationGroups: navGroups, activeItem: activeScenario, onItemChange: id => handleScenarioChange(id), backgroundOpacity: 0.15, showDividers: false, defaultOpen: true, children: [_jsx(MobileHorizontalTabs, { tabs: mobileTabs, activeTab: activeScenario, onTabChange: tab => handleScenarioChange(tab) }), _jsxs("div", { className: 'space-y-[20px]', children: [_jsxs("div", { className: 'mb-[40px]', children: [_jsxs("div", { className: 'flex items-center gap-[10px] mb-[10px]', children: [_jsx(ClipboardCheck, { className: 'h-8 w-8 text-fm-gold' }), _jsx("h1", { className: 'text-3xl font-canela text-white', children: "Ticket Flow Smoke Tests" })] }), _jsx("p", { className: 'text-sm text-muted-foreground font-canela', children: "Comprehensive end-to-end testing for the ticketing system" })] }), renderScenarioContent()] })] }));
}
// Placeholder components for each scenario
function QueueTestsContent() {
    return (_jsx(TestSuiteRunner, { suite: queueTestSuite, icon: Users, options: {
            maxConcurrency: 3,
            timeout: 60000,
            retries: 1,
            stopOnError: false,
        } }));
}
function SelectionTestsContent() {
    return (_jsxs("div", { className: 'space-y-[20px]', children: [_jsx(FmCommonCard, { variant: 'default', className: 'p-[40px]', children: _jsxs("div", { className: 'flex items-start gap-[20px]', children: [_jsx("div", { className: 'p-[10px] bg-fm-gold/10 rounded-none', children: _jsx(ShoppingCart, { className: 'h-6 w-6 text-fm-gold' }) }), _jsxs("div", { className: 'flex-1', children: [_jsx("h2", { className: 'text-xl font-canela text-white mb-[10px]', children: "Ticket selection tests." }), _jsx("p", { className: 'text-sm text-muted-foreground font-canela mb-[20px]', children: "Test ticket selection flow including adding to cart, updating quantities, inventory checks, and cart persistence." }), _jsxs("div", { className: 'space-y-[10px]', children: [_jsx("h3", { className: 'text-sm font-canela text-fm-gold uppercase', children: "Test cases to implement:" }), _jsxs("ul", { className: 'list-disc list-inside space-y-[5px] text-sm text-muted-foreground font-canela', children: [_jsx("li", { children: "Add single ticket tier to cart" }), _jsx("li", { children: "Add multiple ticket tiers to cart" }), _jsx("li", { children: "Update ticket quantities" }), _jsx("li", { children: "Remove tickets from cart" }), _jsx("li", { children: "Sold out tier handling" }), _jsx("li", { children: "Cart persistence across page refresh" })] })] })] })] }) }), _jsx(FmCommonCard, { variant: 'outline', className: 'p-[20px]', children: _jsx("p", { className: 'text-xs text-muted-foreground font-canela text-center', children: "Test implementation coming soon. This will validate cart operations and inventory management." }) })] }));
}
function PaymentTestsContent() {
    return (_jsxs("div", { className: 'space-y-[20px]', children: [_jsx(FmCommonCard, { variant: 'default', className: 'p-[40px]', children: _jsxs("div", { className: 'flex items-start gap-[20px]', children: [_jsx("div", { className: 'p-[10px] bg-fm-gold/10 rounded-none', children: _jsx(CreditCard, { className: 'h-6 w-6 text-fm-gold' }) }), _jsxs("div", { className: 'flex-1', children: [_jsx("h2", { className: 'text-xl font-canela text-white mb-[10px]', children: "Payment processing tests." }), _jsx("p", { className: 'text-sm text-muted-foreground font-canela mb-[20px]', children: "Test payment flow including successful payments, failures, fee calculations, and concurrent transactions." }), _jsxs("div", { className: 'space-y-[10px]', children: [_jsx("h3", { className: 'text-sm font-canela text-fm-gold uppercase', children: "Test cases to implement:" }), _jsxs("ul", { className: 'list-disc list-inside space-y-[5px] text-sm text-muted-foreground font-canela', children: [_jsx("li", { children: "Successful payment completion" }), _jsx("li", { children: "Failed payment (declined card)" }), _jsx("li", { children: "Payment timeout scenario" }), _jsx("li", { children: "Concurrent payment processing" }), _jsx("li", { children: "Service fee calculation accuracy" }), _jsx("li", { children: "Refund simulation (future)" })] })] })] })] }) }), _jsx(FmCommonCard, { variant: 'outline', className: 'p-[20px]', children: _jsx("p", { className: 'text-xs text-muted-foreground font-canela text-center', children: "Test implementation coming soon. This will use mock Stripe integration for safe testing." }) })] }));
}
function TimeoutTestsContent() {
    return (_jsxs("div", { className: 'space-y-[20px]', children: [_jsx(FmCommonCard, { variant: 'default', className: 'p-[40px]', children: _jsxs("div", { className: 'flex items-start gap-[20px]', children: [_jsx("div", { className: 'p-[10px] bg-fm-gold/10 rounded-none', children: _jsx(Clock, { className: 'h-6 w-6 text-fm-gold' }) }), _jsxs("div", { className: 'flex-1', children: [_jsx("h2", { className: 'text-xl font-canela text-white mb-[10px]', children: "Timer and timeout tests." }), _jsx("p", { className: 'text-sm text-muted-foreground font-canela mb-[20px]', children: "Test timer expiration scenarios including cart timeout, session timeout, and proper cleanup." }), _jsxs("div", { className: 'space-y-[10px]', children: [_jsx("h3", { className: 'text-sm font-canela text-fm-gold uppercase', children: "Test cases to implement:" }), _jsxs("ul", { className: 'list-disc list-inside space-y-[5px] text-sm text-muted-foreground font-canela', children: [_jsx("li", { children: "Cart timer expiration (9 minutes)" }), _jsx("li", { children: "Session timeout (30 minutes)" }), _jsx("li", { children: "Timeout during payment processing" }), _jsx("li", { children: "Queue re-entry after timeout" }), _jsx("li", { children: "Warning notifications (2 min, 10 sec thresholds)" })] })] })] })] }) }), _jsx(FmCommonCard, { variant: 'outline', className: 'p-[20px]', children: _jsx("p", { className: 'text-xs text-muted-foreground font-canela text-center', children: "Test implementation coming soon. This will validate timer accuracy and cleanup behavior." }) })] }));
}
function ConfirmationTestsContent() {
    return (_jsxs("div", { className: 'space-y-[20px]', children: [_jsx(FmCommonCard, { variant: 'default', className: 'p-[40px]', children: _jsxs("div", { className: 'flex items-start gap-[20px]', children: [_jsx("div", { className: 'p-[10px] bg-fm-gold/10 rounded-none', children: _jsx(CheckCircle, { className: 'h-6 w-6 text-fm-gold' }) }), _jsxs("div", { className: 'flex-1', children: [_jsx("h2", { className: 'text-xl font-canela text-white mb-[10px]', children: "Order confirmation tests." }), _jsx("p", { className: 'text-sm text-muted-foreground font-canela mb-[20px]', children: "Test order confirmation flow including record creation, email receipts, and inventory updates." }), _jsxs("div", { className: 'space-y-[10px]', children: [_jsx("h3", { className: 'text-sm font-canela text-fm-gold uppercase', children: "Test cases to implement:" }), _jsxs("ul", { className: 'list-disc list-inside space-y-[5px] text-sm text-muted-foreground font-canela', children: [_jsx("li", { children: "Order confirmation page display" }), _jsx("li", { children: "Email receipt generation (mock)" }), _jsx("li", { children: "Order appears in user history" }), _jsx("li", { children: "Correct ticket allocation to user" }), _jsx("li", { children: "Sold inventory incremented properly" })] })] })] })] }) }), _jsx(FmCommonCard, { variant: 'outline', className: 'p-[20px]', children: _jsx("p", { className: 'text-xs text-muted-foreground font-canela text-center', children: "Test implementation coming soon. This will verify order completion and data integrity." }) })] }));
}
function DeliveryTestsContent() {
    return (_jsxs("div", { className: 'space-y-[20px]', children: [_jsx(FmCommonCard, { variant: 'default', className: 'p-[40px]', children: _jsxs("div", { className: 'flex items-start gap-[20px]', children: [_jsx("div", { className: 'p-[10px] bg-fm-gold/10 rounded-none', children: _jsx(Send, { className: 'h-6 w-6 text-fm-gold' }) }), _jsxs("div", { className: 'flex-1', children: [_jsx("h2", { className: 'text-xl font-canela text-white mb-[10px]', children: "Ticket delivery tests." }), _jsx("p", { className: 'text-sm text-muted-foreground font-canela mb-[20px]', children: "Test ticket delivery mechanisms including PDF generation, QR codes, and email delivery." }), _jsxs("div", { className: 'space-y-[10px]', children: [_jsx("h3", { className: 'text-sm font-canela text-fm-gold uppercase', children: "Test cases to implement:" }), _jsxs("ul", { className: 'list-disc list-inside space-y-[5px] text-sm text-muted-foreground font-canela', children: [_jsx("li", { children: "PDF ticket generation (stubbed)" }), _jsx("li", { children: "QR code creation for tickets" }), _jsx("li", { children: "Email delivery simulation" }), _jsx("li", { children: "Ticket download link generation" }), _jsx("li", { children: "QR code validation and scanning" })] })] })] })] }) }), _jsx(FmCommonCard, { variant: 'outline', className: 'p-[20px]', children: _jsx("p", { className: 'text-xs text-muted-foreground font-canela text-center', children: "Test implementation coming soon. This will validate ticket generation and delivery workflows." }) })] }));
}
