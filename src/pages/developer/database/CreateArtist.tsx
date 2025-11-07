import { Mic2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmCreateArtistButton } from '@/components/common/buttons/FmCreateArtistButton';

const DeveloperCreateArtistPage = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/developer');
  };

  return (
    <DemoLayout
      title='Create Artist'
      description='Add a new artist profile, including imagery and genre metadata.'
      icon={Mic2}
      condensed
    >
      <p className='text-sm text-muted-foreground mb-6'>
        Use this form to create placeholder or production artist records.
        Closing the form will return you to the developer dashboard.
      </p>
      <FmCreateArtistButton mode='standalone' onClose={handleClose} />
    </DemoLayout>
  );
};

export default DeveloperCreateArtistPage;
