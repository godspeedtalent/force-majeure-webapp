import { lazy } from 'react';

// ==================== DEMO PAGES ====================
export const EventCheckout = lazy(() => import('@/pages/demo/EventCheckout'));
export const EventCheckoutConfirmation = lazy(() => import('@/pages/demo/EventCheckoutConfirmation'));
export const EmailTemplateDemo = lazy(() => import('@/pages/demo/EmailTemplateDemo'));
export const StoryDesigner = lazy(() => import('@/pages/demo/StoryDesigner'));
export const SquareSpinnersDemo = lazy(() => import('@/pages/demo/SquareSpinnersDemo'));

// ==================== DEVELOPER PAGES ====================
export const DeveloperHome = lazy(() => import('@/pages/developer/DeveloperHome'));
export const TicketFlowTests = lazy(() => import('@/pages/developer/TicketFlowTests'));
export const DeveloperCreateEventPage = lazy(() => import('@/pages/developer/database/CreateEvent'));
export const DeveloperCreateArtistPage = lazy(() => import('@/pages/developer/database/CreateArtist'));
export const DeveloperCreateVenuePage = lazy(() => import('@/pages/developer/database/CreateVenue'));
export const DeveloperCreateOrganizationPage = lazy(() => import('@/pages/developer/database/CreateOrganization'));
export const ArtistSignupDemo = lazy(() => import('@/pages/developer/ArtistSignupDemo'));

// ==================== STAFF PAGES ====================
export const StaffHome = lazy(() => import('@/pages/staff/StaffHome'));
export const ReviewInterface = lazy(() =>
  import('@/features/artist-screening/components/ReviewInterface').then(mod => ({ default: mod.ReviewInterface }))
);

// ==================== ADMIN PAGES ====================
export const Statistics = lazy(() => import('@/pages/admin/Statistics'));
export const OrganizationDetails = lazy(() => import('@/pages/admin/OrganizationDetails'));
export const UserDetails = lazy(() => import('@/pages/admin/UserDetails'));
export const GalleryManagement = lazy(() => import('@/pages/admin/GalleryManagement'));
export const ProductsManagement = lazy(() => import('@/pages/admin/ProductsManagement'));

// ==================== VENUE & ARTIST PAGES ====================
export const VenueDetails = lazy(() => import('@/pages/venues/VenueDetails'));
export const VenueManagement = lazy(() => import('@/pages/venues/VenueManagement'));
export const ArtistDetails = lazy(() => import('@/pages/artists/ArtistDetails'));
export const ArtistManagement = lazy(() => import('@/pages/artists/ArtistManagement'));
export const OrganizationManagement = lazy(() => import('@/pages/organization/OrganizationManagement'));
export const RecordingDetails = lazy(() => import('@/pages/recordings/RecordingDetails'));

// ==================== USER PAGES ====================
export const PublicUserProfile = lazy(() => import('@/pages/users/PublicUserProfile'));
export const UserProfileEdit = lazy(() => import('@/pages/users/UserProfileEdit'));

// ==================== TESTING PAGES ====================
export const TestingIndex = lazy(() => import('@/pages/testing/TestingIndex'));
export const CheckoutFlowTests = lazy(() => import('@/pages/testing/CheckoutFlowTests'));

// ==================== SPECIAL PAGES ====================
export const SonicGauntlet = lazy(() => import('@/pages/SonicGauntlet'));
export const ClaimTicketPage = lazy(() => import('@/pages/claim-ticket/ClaimTicketPage'));
export const TrackingLinkRedirect = lazy(() => import('@/pages/tracking/TrackingLinkRedirect'));

// ==================== WALLET PAGES ====================
export const Wallet = lazy(() => import('@/pages/wallet/Wallet'));
export const TicketView = lazy(() => import('@/pages/wallet/TicketView'));
export const OrderTickets = lazy(() => import('@/pages/orders/OrderTickets'));
