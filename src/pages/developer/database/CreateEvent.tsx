import { Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmCreateEventButton } from '@/components/common/buttons/FmCreateEventButton';

const DeveloperCreateEventPage = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/developer');
  };

  return (
    <DemoLayout
      title='Create Event'
      description='Configure a new event with headliners, ticket tiers, and venue details.'
      icon={Calendar}
      condensed
    >
      <p className='text-sm text-muted-foreground mb-6'>
        Complete the form to add a new event to the staging database. Closing
        the form will return you to the developer dashboard.
      </p>
      <FmCreateEventButton mode='standalone' onClose={handleClose} />
    </DemoLayout>
  );
};

export default DeveloperCreateEventPage;
