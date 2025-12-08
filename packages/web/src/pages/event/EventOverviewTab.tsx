import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '@/components/common/shadcn/card';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/common/forms/FmCommonTimePicker';
import { FmImageUpload } from '@/components/common/forms/FmImageUpload';
import { HeroImageFocalPoint } from '@/components/events/overview/HeroImageFocalPoint';

export interface EventOverviewData {
  headlinerId: string;
  venueId: string;
  eventDate?: Date;
  endTime: string;
  isAfterHours: boolean;
  heroImage: string;
  heroImageFocalY: number;
  customTitle: string;
  eventSubtitle: string;
  aboutEvent: string;
}

interface EventOverviewTabProps {
  data: EventOverviewData;
  onDataChange: (updates: Partial<EventOverviewData>) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

export const EventOverviewTab = ({
  data,
  onDataChange,
  onSave,
  isSaving,
}: EventOverviewTabProps) => {
  const {
    headlinerId,
    venueId,
    eventDate,
    endTime,
    isAfterHours,
    heroImage,
    heroImageFocalY,
    customTitle,
    eventSubtitle,
    aboutEvent,
  } = data;

  const handleHeadlinerChange = (value: string) => {
    onDataChange({ headlinerId: value });
  };

  const handleVenueChange = (value: string) => {
    onDataChange({ venueId: value });
  };

  const handleDateChange = (date?: Date) => {
    onDataChange({ eventDate: date });
  };

  const handleTimeChange = (time: string) => {
    if (eventDate) {
      const [hours, minutes] = time.split(':');
      const newDate = new Date(eventDate);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      onDataChange({ eventDate: newDate });
    }
  };

  const handleEndTimeChange = (time: string) => {
    onDataChange({ endTime: time });
  };

  const handleAfterHoursChange = (checked: boolean) => {
    onDataChange({ isAfterHours: checked });
  };

  const handleHeroImageChange = (url: string) => {
    onDataChange({ heroImage: url });
  };

  const handleFocalPointChange = (y: number) => {
    onDataChange({ heroImageFocalY: y });
  };

  const handleTitleChange = (value: string) => {
    onDataChange({ customTitle: value });
  };

  const handleSubtitleChange = (value: string) => {
    onDataChange({ eventSubtitle: value });
  };

  const handleAboutChange = (value: string) => {
    onDataChange({ aboutEvent: value });
  };

  return (
    <Card className='p-8'>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-foreground mb-2'>
              Event Overview
            </h2>
            <p className='text-muted-foreground'>
              Basic event information and details
            </p>
          </div>
          <FmCommonButton onClick={onSave} loading={isSaving} icon={Save}>
            Save Changes
          </FmCommonButton>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Headliner */}
          <div className='space-y-2'>
            <Label htmlFor='headliner'>
              Headliner <span className='text-destructive'>*</span>
            </Label>
            <FmArtistSearchDropdown
              value={headlinerId}
              onChange={handleHeadlinerChange}
              placeholder='Select headliner'
            />
          </div>

          {/* Venue */}
          <div className='space-y-2'>
            <Label htmlFor='venue'>
              Venue <span className='text-destructive'>*</span>
            </Label>
            <FmVenueSearchDropdown
              value={venueId}
              onChange={handleVenueChange}
              placeholder='Select venue'
            />
          </div>

          {/* Event Title & Subtitle */}
          <div className='space-y-2'>
            <Label htmlFor='event-title'>
              Event Title <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='event-title'
              value={customTitle}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder='Enter event title'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='event-subtitle'>Subtitle (Optional)</Label>
            <Input
              id='event-subtitle'
              value={eventSubtitle}
              onChange={e => handleSubtitleChange(e.target.value)}
              placeholder='Enter event subtitle'
            />
          </div>

          {/* About This Event Description */}
          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='about-event'>About This Event (Optional)</Label>
            <textarea
              id='about-event'
              value={aboutEvent}
              onChange={e => handleAboutChange(e.target.value)}
              placeholder='Enter event description...'
              className='w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-foreground resize-y'
              rows={5}
            />
          </div>

          {/* Date & Time */}
          <div className='space-y-2'>
            <Label>
              Event Date & Time <span className='text-destructive'>*</span>
            </Label>
            <div className='flex gap-2'>
              <FmCommonDatePicker value={eventDate} onChange={handleDateChange} />
              <FmCommonTimePicker
                value={eventDate ? format(eventDate, 'HH:mm') : '20:00'}
                onChange={handleTimeChange}
              />
            </div>
          </div>

          {/* End Time */}
          <div className='space-y-2'>
            <Label>End Time</Label>
            <div className='flex items-center gap-4'>
              <FmCommonTimePicker
                value={endTime}
                onChange={handleEndTimeChange}
                disabled={isAfterHours}
              />
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='after-hours'
                  checked={isAfterHours}
                  onCheckedChange={checked => handleAfterHoursChange(!!checked)}
                />
                <Label htmlFor='after-hours' className='cursor-pointer'>
                  After hours
                </Label>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className='space-y-2 md:col-span-2'>
            <Label>Hero Image</Label>
            <FmImageUpload
              value={heroImage}
              onUpload={handleHeroImageChange}
              bucket='event-images'
              folder='heroes'
            />
            {heroImage && (
              <div className='mt-4'>
                <HeroImageFocalPoint
                  imageUrl={heroImage}
                  focalPointY={heroImageFocalY}
                  onFocalPointChange={handleFocalPointChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
