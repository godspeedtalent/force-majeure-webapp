import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { FmCommonFormModal } from '@/components/ui/modals/FmCommonFormModal';
import { FmCitySearchDropdown } from '@/components/ui/search/FmCitySearchDropdown';
import { FmCommonLoadingOverlay } from '@/components/common/FmCommonLoadingOverlay';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from '@/components/ui/feedback/FmCommonToast';
import { Edit } from 'lucide-react';

interface FmEditVenueButtonProps {
  venueId: string;
  onVenueUpdated?: () => void;
  trigger?: React.ReactNode;
  autoOpen?: boolean;
}

export const FmEditVenueButton = ({
  venueId,
  onVenueUpdated,
  trigger,
  autoOpen = false,
}: FmEditVenueButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [name, setName] = useState('');
  const [cityId, setCityId] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [website, setWebsite] = useState('');

  // Auto-open modal if autoOpen is true
  useEffect(() => {
    if (autoOpen && venueId) {
      setIsModalOpen(true);
    }
  }, [autoOpen, venueId]);

  // Load venue data when modal opens
  useEffect(() => {
    if (isModalOpen && venueId) {
      loadVenueData();
    }
  }, [isModalOpen, venueId]);

  const loadVenueData = async () => {
    setIsLoadingData(true);
    try {
      const { data: venue, error } = await supabase
        .from('venues' as any)
        .select('*')
        .eq('id', venueId)
        .single();

      if (error) throw error;

      setName((venue as any).name || '');
      setCityId((venue as any).city_id || '');
      setAddress((venue as any).address || '');
      setCapacity((venue as any).capacity || '');
      setWebsite((venue as any).website || '');
    } catch (error) {
      console.error('Error loading venue data:', error);
      toast.error('Failed to load venue data', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const validateForm = (): string | null => {
    if (!name || name.trim() === '') {
      return 'Venue name is required';
    }
    if (capacity !== '' && (capacity < 1 || isNaN(Number(capacity)))) {
      return 'Capacity must be a valid positive number';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error('Validation Error', {
        description: validationError,
      });
      return;
    }

    setIsModalOpen(false);
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('venues' as any)
        .update({
          name: name.trim(),
          city_id: cityId || null,
          address: address.trim() || null,
          capacity: capacity === '' ? null : Number(capacity),
          website: website.trim() || null,
        })
        .eq('id', venueId);

      if (error) throw error;

      onVenueUpdated?.();
      
      setIsLoading(false);
      toast.success('Venue Updated', {
        description: `${name} has been successfully updated!`,
      });
    } catch (error) {
      console.error('Error updating venue:', error);
      setIsLoading(false);
      toast.error('Failed to update venue', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsModalOpen(true)}>{trigger}</div>
      ) : (
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Venue
        </Button>
      )}

      {isLoading && <FmCommonLoadingOverlay message="Updating venue..." />}

      <FmCommonFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Edit Venue"
        description="Update venue information"
        className="max-w-2xl"
        sections={
          isLoadingData
            ? [
                {
                  content: (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <FmCommonLoadingSpinner size="lg" />
                        <p className="text-white/70 text-sm">Loading venue data...</p>
                      </div>
                    </div>
                  ),
                },
              ]
            : [
                {
                  title: 'Venue Details',
                  content: (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Venue Name *</Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter venue name"
                          className="bg-black/40 border-white/20 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">City</Label>
                        <FmCitySearchDropdown
                          value={cityId}
                          onChange={setCityId}
                          placeholder="Search for city..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Address</Label>
                        <Input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Enter venue address"
                          className="bg-black/40 border-white/20 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white">Capacity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="e.g., 500"
                            className="bg-black/40 border-white/20 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Website</Label>
                          <Input
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="https://..."
                            className="bg-black/40 border-white/20 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ),
                },
              ]
        }
        actions={
          !isLoadingData && (
            <div className="flex gap-3">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1 border-white/20 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-fm-gold hover:bg-fm-gold/90 text-black"
              >
                Update Venue
              </Button>
            </div>
          )
        }
      />
    </>
  );
};
