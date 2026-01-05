import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import type { ArtistRegistrationFormData } from '../../types/registration';

interface PerformanceHistoryStepProps {
  formData: ArtistRegistrationFormData;
  onInputChange: (field: keyof ArtistRegistrationFormData, value: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const PAID_SHOW_OPTIONS = [
  { value: '1-5', labelKey: 'paidShowsOptions.1-5' },
  { value: '6-15', labelKey: 'paidShowsOptions.6-15' },
  { value: '15-50', labelKey: 'paidShowsOptions.15-50' },
  { value: '50+', labelKey: 'paidShowsOptions.50+' },
];

export function PerformanceHistoryStep({
  formData,
  onInputChange,
  onNext,
  onPrevious,
}: PerformanceHistoryStepProps) {
  const { t } = useTranslation('common');

  return (
    <div className='h-full flex flex-col p-[20px]'>
      <div className='flex-1 overflow-y-auto px-[5px] pr-[10px]'>
        <div className='flex justify-center items-start'>
          <div className='w-[85vw] sm:w-[80%] space-y-[20px] bg-black/60 backdrop-blur-sm border border-white/10 p-[30px] sm:p-[40px]'>
            <div>
              <h2 className='font-canela text-3xl mb-[10px]'>
                {t('artistRegistration.performanceHistoryTitle')}
              </h2>
              <p className='font-canela text-sm text-muted-foreground'>
                {t('artistRegistration.performanceHistoryDescription')}
              </p>
            </div>

            <div className='w-full h-[1px] bg-gradient-to-r from-fm-gold via-white/30 to-transparent' />

            <div className='space-y-[20px]'>
              {/* Paid Shows Dropdown */}
              <div className='space-y-[5px]'>
                <label className='font-canela text-xs uppercase text-muted-foreground'>
                  {t('artistRegistration.paidShowsLabel')} <span className='text-fm-danger'>*</span>
                </label>
                <Select
                  value={formData.paidShowCountGroup}
                  onValueChange={value => onInputChange('paidShowCountGroup', value)}
                >
                  <SelectTrigger className='w-full bg-transparent border border-white/20 hover:border-fm-gold/50 focus:border-fm-gold focus:border-b-[3px] focus:border-t-0 focus:border-l-0 focus:border-r-0 rounded-none font-canela transition-all duration-300'>
                    <SelectValue placeholder={t('artistRegistration.paidShowsPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className='bg-black/95 backdrop-blur-md border border-white/20 rounded-none'>
                    {PAID_SHOW_OPTIONS.map(option => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className='font-canela hover:bg-fm-gold/10 focus:bg-fm-gold/20 rounded-none cursor-pointer'
                      >
                        {t(`artistRegistration.${option.labelKey}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent' />

              {/* Talent Differentiator */}
              <FmCommonTextField
                label={t('artistRegistration.talentDifferentiatorLabel')}
                required
                value={formData.talentDifferentiator}
                onChange={e => onInputChange('talentDifferentiator', e.target.value)}
                placeholder={t('artistRegistration.talentDifferentiatorPlaceholder')}
                multiline
                autoSize
                minRows={3}
                maxRows={10}
              />

              {/* Crowd Sources */}
              <FmCommonTextField
                label={t('artistRegistration.crowdSourcesLabel')}
                required
                value={formData.crowdSources}
                onChange={e => onInputChange('crowdSources', e.target.value)}
                placeholder={t('artistRegistration.crowdSourcesPlaceholder')}
                multiline
                autoSize
                minRows={3}
                maxRows={10}
              />
            </div>
          </div>
        </div>
      </div>

      <div className='flex justify-between pt-[20px] border-t border-white/10 flex-shrink-0'>
        <FmCommonButton onClick={onPrevious} variant='secondary'>
          <ChevronLeft className='h-4 w-4 mr-[10px]' />
          {t('buttons.previous')}
        </FmCommonButton>
        <FmCommonButton onClick={onNext} variant='default'>
          {t('buttons.next')}
        </FmCommonButton>
      </div>
    </div>
  );
}
