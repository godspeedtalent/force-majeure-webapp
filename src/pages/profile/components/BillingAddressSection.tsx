/**
 * BillingAddressSection Component
 *
 * Handles billing address form for faster checkout.
 * Uses the normalized addresses table via address hooks.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useProfileBillingAddress, useUpsertProfileBillingAddress } from '@/features/addresses';
import { addressToFormData } from '@/shared/types/address';

export function BillingAddressSection() {
  const { t } = useTranslation('common');
  const { user } = useAuth();

  // Fetch billing address from normalized addresses table
  const { data: billingAddress } = useProfileBillingAddress(user?.id);
  const upsertMutation = useUpsertProfileBillingAddress();

  // Form state
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('US');

  // Populate form when address data loads
  useEffect(() => {
    if (billingAddress) {
      const formData = addressToFormData(billingAddress);
      setLine1(formData.line_1);
      setLine2(formData.line_2);
      setCity(formData.city);
      setState(formData.state);
      setZipCode(formData.zip_code);
      setCountry(formData.country);
    }
  }, [billingAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    upsertMutation.mutate({
      profileId: user.id,
      address: {
        line_1: line1,
        line_2: line2,
        city: city,
        state: state,
        zip_code: zipCode,
        country: country,
      },
    });
  };

  if (!user) return null;

  const isDisabled = !user.email_confirmed_at || upsertMutation.isPending;

  return (
    <FmCommonCard>
      <FmCommonCardContent className='p-8 space-y-6'>
        <div>
          <h2 className='text-xl font-canela font-medium text-foreground mb-2'>
            {t('billingAddress.title')}
          </h2>
          <p className='text-sm text-muted-foreground'>
            {t('billingAddress.description')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='md:col-span-2'>
              <FmCommonTextField
                label={t('billingAddress.streetAddress')}
                id='billingAddress'
                type='text'
                placeholder={t('billingAddress.streetAddressPlaceholder')}
                value={line1}
                onChange={e => setLine1(e.target.value)}
                description={t('labels.optional')}
                disabled={isDisabled}
                              />
            </div>

            <div className='md:col-span-2'>
              <FmCommonTextField
                label={t('billingAddress.addressLine2')}
                id='billingAddressLine2'
                type='text'
                placeholder={t('billingAddress.addressLine2Placeholder')}
                value={line2}
                onChange={e => setLine2(e.target.value)}
                description={t('labels.optional')}
                disabled={isDisabled}
                              />
            </div>

            <FmCommonTextField
              label={t('billingAddress.city')}
              id='billingCity'
              type='text'
              placeholder={t('billingAddress.cityPlaceholder')}
              value={city}
              onChange={e => setCity(e.target.value)}
              description={t('labels.optional')}
              disabled={isDisabled}
                          />

            <FmCommonTextField
              label={t('billingAddress.state')}
              id='billingState'
              type='text'
              placeholder={t('billingAddress.statePlaceholder')}
              value={state}
              onChange={e => setState(e.target.value)}
              description={t('labels.optional')}
              disabled={isDisabled}
                          />

            <FmCommonTextField
              label={t('billingAddress.zipCode')}
              id='billingZip'
              type='text'
              placeholder={t('billingAddress.zipCodePlaceholder')}
              value={zipCode}
              onChange={e => setZipCode(e.target.value)}
              description={t('labels.optional')}
              disabled={isDisabled}
                          />

            <FmCommonTextField
              label={t('billingAddress.country')}
              id='billingCountry'
              type='text'
              placeholder={t('billingAddress.countryPlaceholder')}
              value={country}
              onChange={e => setCountry(e.target.value)}
              description={t('labels.optional')}
              disabled={isDisabled}
                          />
          </div>

          <FmCommonButton
            type='submit'
            variant='default'
            loading={upsertMutation.isPending}
            disabled={isDisabled}
          >
            {t('billingAddress.updateButton')}
          </FmCommonButton>
        </form>
      </FmCommonCardContent>
    </FmCommonCard>
  );
}
