import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';

export default function CheckoutCancel() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden'>
      <TopographicBackground opacity={0.25} />
      <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
      <Card className='w-full max-w-md relative z-10'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center'>
            <XCircle className='h-8 w-8 text-destructive' />
          </div>
          <CardTitle className='text-2xl'>{t('checkoutResult.cancelled.title')}</CardTitle>
          <CardDescription>
            {t('checkoutResult.cancelled.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-sm text-muted-foreground text-center'>
            {t('checkoutResult.cancelled.noCharges')}
          </p>
          <div className='space-y-2'>
            <Button onClick={() => navigate(-1)} className='w-full'>
              {t('checkoutResult.cancelled.tryAgain')}
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant='outline'
              className='w-full'
            >
              {t('checkoutResult.backToHome')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
