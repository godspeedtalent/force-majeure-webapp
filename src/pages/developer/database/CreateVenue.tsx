import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmCreateVenueButton } from '@/components/common/buttons/FmCreateVenueButton';

const DeveloperCreateVenuePage = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/developer');
  };

  return (
    <DemoLayout
      title='Create Venue'
      description='Register a new venue with capacity and location details.'
      icon={MapPin}
      condensed
    >
      <p className='text-sm text-muted-foreground mb-6'>
        Provide venue metadata so events can reference accurate locations.
        Closing the form will return you to the developer dashboard.
      </p>
      <FmCreateVenueButton mode='standalone' onClose={handleClose} />
    </DemoLayout>
  );
};

export default DeveloperCreateVenuePage;
