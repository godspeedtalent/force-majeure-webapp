import { Route } from 'react-router-dom';

// Non-lazy event pages (frequently accessed)
import EventDetails from '@/pages/EventDetails';
import EventTicketing from '@/pages/event/EventTicketingPage';
import EventManagement from '@/pages/EventManagement';

/**
 * Event-related routes for viewing and managing events.
 */
export const eventRoutes = (
  <>
    <Route path='/event/:id' element={<EventDetails />} />
    <Route path='/event/:id/tickets' element={<EventTicketing />} />
    <Route path='/event/:id/manage' element={<EventManagement />} />
  </>
);
