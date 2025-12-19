import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';

export default function CheckoutSuccess() {
  const { t } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/', { replace: true });
    }
  }, [sessionId, navigate]);

  if (!sessionId) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-[3px] border-fm-gold border-b-transparent' />
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden'>
      <TopographicBackground opacity={0.25} />
      <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
      <Card className='w-full max-w-md relative z-10'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 w-16 h-16 rounded-none bg-success/10 flex items-center justify-center'>
            <CheckCircle2 className='h-8 w-8 text-success' />
          </div>
          <CardTitle className='text-2xl'>{t('checkoutResult.success.title')}</CardTitle>
          <CardDescription>
            {t('checkoutResult.success.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-sm text-muted-foreground text-center'>
            {t('checkoutResult.success.emailNotice')}
          </p>
          <div className='space-y-2'>
            <Button onClick={() => navigate('/profile')} className='w-full'>
              {t('checkoutResult.success.viewTickets')}
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
