import { Route } from 'react-router-dom';
import OrganizationTools from '@/pages/organization/OrganizationTools';
import TicketScanning from '@/pages/organization/TicketScanning';
import MemberHome from '@/pages/members/MemberHome';

/**
 * Organization routes for org tools and member features.
 */
export const organizationRoutes = (
  <>
    {/* Organization tools */}
    <Route path='/organization/tools' element={<OrganizationTools />} />
    <Route path='/organization/scanning' element={<TicketScanning />} />

    {/* Member home - always available */}
    <Route path='/members/home' element={<MemberHome />} />
  </>
);
