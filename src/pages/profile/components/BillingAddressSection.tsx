/**
 * BillingAddressSection Component
 *
 * Handles billing address form for faster checkout.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { useAuth } from '@/features/auth/services/AuthContext';

export function BillingAddressSection() {
  const { t } = useTranslation('common');
  const { user, profile, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingZip, setBillingZip] = useState('');

  useEffect(() => {
    if (profile) {
      setBillingAddress(profile.billing_address_line_1 || '');
      setBillingCity(profile.billing_city || '');
      setBillingState(profile.billing_state || '');
      setBillingZip(profile.billing_zip_code || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await updateProfile({
      billing_address_line_1: billingAddress || null,
      billing_city: billingCity || null,
      billing_state: billingState || null,
      billing_zip_code: billingZip || null,
    });
    setIsLoading(false);
  };

  if (!user) return null;

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
                value={billingAddress}
                onChange={e => setBillingAddress(e.target.value)}
                description={t('labels.optional')}
                disabled={!user.email_confirmed_at}
              />
            </div>

            <FmCommonTextField
              label={t('billingAddress.city')}
              id='billingCity'
              type='text'
              placeholder={t('billingAddress.cityPlaceholder')}
              value={billingCity}
              onChange={e => setBillingCity(e.target.value)}
              description={t('labels.optional')}
              disabled={!user.email_confirmed_at}
            />

            <FmCommonTextField
              label={t('billingAddress.state')}
              id='billingState'
              type='text'
              placeholder={t('billingAddress.statePlaceholder')}
              value={billingState}
              onChange={e => setBillingState(e.target.value)}
              description={t('labels.optional')}
              disabled={!user.email_confirmed_at}
            />

            <FmCommonTextField
              label={t('billingAddress.zipCode')}
              id='billingZip'
              type='text'
              placeholder={t('billingAddress.zipCodePlaceholder')}
              value={billingZip}
              onChange={e => setBillingZip(e.target.value)}
              description={t('labels.optional')}
              disabled={!user.email_confirmed_at}
            />
          </div>

          <FmCommonButton
            type='submit'
            variant='default'
            loading={isLoading}
            disabled={!user.email_confirmed_at || isLoading}
          >
            {t('billingAddress.updateButton')}
          </FmCommonButton>
        </form>
      </FmCommonCardContent>
    </FmCommonCard>
  );
}
