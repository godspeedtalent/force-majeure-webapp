import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Timer, Users, Clock, Info, RotateCcw } from 'lucide-react';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmI18nCommon } from '@/components/common/i18n';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';
import { toast } from 'sonner';
import { logger } from '@/shared';
import {
  QueueConfiguration,
  DEFAULT_QUEUE_CONFIG,
  fetchQueueConfiguration,
  upsertQueueConfiguration,
  deleteQueueConfiguration,
} from '@/services/queueConfigurationService';
import { useCheckoutTimerDefault } from '@/hooks/useAppSettings';

interface EventQueueConfigFormProps {
  eventId: string;
}

export const EventQueueConfigForm = ({ eventId }: EventQueueConfigFormProps) => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const [config, setConfig] = useState<QueueConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Local form state
  const [enableQueue, setEnableQueue] = useState(true);
  const [maxConcurrentUsers, setMaxConcurrentUsers] = useState('50');
  const [checkoutTimeoutMinutes, setCheckoutTimeoutMinutes] = useState('');
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('30');

  // Get global default for display
  const { data: globalDefaultMinutes } = useCheckoutTimerDefault();

  // Fetch existing configuration
  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true);
      try {
        const data = await fetchQueueConfiguration(eventId);
        setConfig(data);

        // Populate form with existing values
        setEnableQueue(data.enable_queue);
        setMaxConcurrentUsers(data.max_concurrent_users.toString());
        // Only set if it's not the default (i.e., there's a custom config)
        if (data.id) {
          setCheckoutTimeoutMinutes(data.checkout_timeout_minutes.toString());
        } else {
          // No custom config - leave empty to use global default
          setCheckoutTimeoutMinutes('');
        }
        setSessionTimeoutMinutes(data.session_timeout_minutes.toString());
      } catch (error) {
        logger.error('Failed to load queue configuration', {
          error: error instanceof Error ? error.message : 'Unknown',
          eventId,
        });
        toast.error(tToast('queue.loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [eventId]);

  const hasCustomConfig = config?.id !== '';

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const checkoutMinutes = checkoutTimeoutMinutes
        ? parseInt(checkoutTimeoutMinutes, 10)
        : undefined;

      await upsertQueueConfiguration({
        event_id: eventId,
        enable_queue: enableQueue,
        max_concurrent_users: parseInt(maxConcurrentUsers, 10) || DEFAULT_QUEUE_CONFIG.max_concurrent_users,
        checkout_timeout_minutes: checkoutMinutes || DEFAULT_QUEUE_CONFIG.checkout_timeout_minutes,
        session_timeout_minutes: parseInt(sessionTimeoutMinutes, 10) || DEFAULT_QUEUE_CONFIG.session_timeout_minutes,
      });

      toast.success(tToast('queue.saved'));

      // Reload config to get the new values
      const updatedConfig = await fetchQueueConfiguration(eventId);
      setConfig(updatedConfig);
    } catch (error) {
      logger.error('Failed to save queue configuration', {
        error: error instanceof Error ? error.message : 'Unknown',
        eventId,
      });
      toast.error(tToast('queue.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetClick = () => {
    if (!hasCustomConfig) {
      toast.info(tToast('queue.alreadyDefault'));
      return;
    }
    setShowResetConfirm(true);
  };

  const handleResetToDefaults = async () => {
    setIsSaving(true);
    try {
      await deleteQueueConfiguration(eventId);
      toast.success(tToast('queue.resetSuccess'));

      // Reload to get defaults
      const defaultConfig = await fetchQueueConfiguration(eventId);
      setConfig(defaultConfig);
      setEnableQueue(defaultConfig.enable_queue);
      setMaxConcurrentUsers(defaultConfig.max_concurrent_users.toString());
      setCheckoutTimeoutMinutes(''); // Clear to show placeholder
      setSessionTimeoutMinutes(defaultConfig.session_timeout_minutes.toString());
      setShowResetConfirm(false);
    } catch (error) {
      logger.error('Failed to reset queue configuration', {
        error: error instanceof Error ? error.message : 'Unknown',
        eventId,
      });
      toast.error(tToast('queue.resetFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <FmCommonCard className='p-6'>
        <FmI18nCommon i18nKey='queue.loading' as='div' className='text-muted-foreground text-sm' />
      </FmCommonCard>
    );
  }

  return (
    <FmCommonCard className='p-6 space-y-6'>
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-2'>
          <Timer className='h-5 w-5 text-fm-gold' />
          <div>
            <FmI18nCommon i18nKey='queue.title' as='h3' className='text-lg font-canela font-semibold' />
            <FmI18nCommon i18nKey='queue.description' as='p' className='text-sm text-muted-foreground' />
          </div>
        </div>
        {hasCustomConfig && (
          <FmCommonButton
            variant='secondary'
            size='sm'
            icon={RotateCcw}
            onClick={handleResetClick}
            disabled={isSaving}
          >
            {t('queue.resetToDefaults')}
          </FmCommonButton>
        )}
      </div>

      {/* Status indicator */}
      <div className='flex items-center gap-2 text-xs'>
        <span className='text-muted-foreground'>{t('queue.configurationLabel')}:</span>
        <span
          className={`px-2 py-0.5 rounded-none ${
            hasCustomConfig
              ? 'bg-fm-gold/20 text-fm-gold'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {hasCustomConfig ? t('queue.customConfig') : t('queue.usingDefaults')}
        </span>
      </div>

      <div className='space-y-4'>
        {/* Enable Queue Toggle */}
        <div className='flex items-center justify-between p-4 bg-muted/20 rounded-none border border-border'>
          <div className='flex items-center gap-3'>
            <Users className='h-5 w-5 text-muted-foreground' />
            <div>
              <span className='font-medium'>{t('queue.enableQueueSystem')}</span>
              <FmI18nCommon i18nKey='queue.enableQueueDescription' as='p' className='text-xs text-muted-foreground' />
            </div>
          </div>
          <FmCommonToggle
            id='enable-queue'
            label={t('queue.enableQueueSystem')}
            checked={enableQueue}
            onCheckedChange={setEnableQueue}
          />
        </div>

        {/* Max Concurrent Users */}
        <div className='p-4 bg-muted/20 rounded-none border border-border space-y-3'>
          <div className='flex items-center gap-2'>
            <Users className='h-4 w-4 text-muted-foreground' />
            <span className='font-medium'>{t('queue.maxConcurrentUsers')}</span>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                </TooltipTrigger>
                <TooltipContent side='right' className='max-w-xs bg-black/95 border-white/20'>
                  <p className='text-sm text-white'>
                    {t('queue.maxConcurrentUsersTooltip')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <FmCommonTextField
            type='number'
            value={maxConcurrentUsers}
            onChange={e => setMaxConcurrentUsers(e.target.value)}
            placeholder={DEFAULT_QUEUE_CONFIG.max_concurrent_users.toString()}
            min={1}
            max={1000}
          />
        </div>

        {/* Checkout Timeout */}
        <div className='p-4 bg-muted/20 rounded-none border border-border space-y-3'>
          <div className='flex items-center gap-2'>
            <Clock className='h-4 w-4 text-muted-foreground' />
            <span className='font-medium'>{t('queue.checkoutTimer')}</span>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                </TooltipTrigger>
                <TooltipContent side='right' className='max-w-xs bg-black/95 border-white/20'>
                  <p className='text-sm text-white'>
                    {t('queue.checkoutTimerTooltip', { minutes: globalDefaultMinutes || 10 })}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <FmCommonTextField
            type='number'
            value={checkoutTimeoutMinutes}
            onChange={e => setCheckoutTimeoutMinutes(e.target.value)}
            placeholder={t('queue.globalDefaultPlaceholder', { minutes: globalDefaultMinutes || 10 })}
            min={1}
            max={60}
          />
        </div>

        {/* Session Timeout */}
        <div className='p-4 bg-muted/20 rounded-none border border-border space-y-3'>
          <div className='flex items-center gap-2'>
            <Timer className='h-4 w-4 text-muted-foreground' />
            <span className='font-medium'>{t('queue.sessionTimeout')}</span>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                </TooltipTrigger>
                <TooltipContent side='right' className='max-w-xs bg-black/95 border-white/20'>
                  <p className='text-sm text-white'>
                    {t('queue.sessionTimeoutTooltip')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <FmCommonTextField
            type='number'
            value={sessionTimeoutMinutes}
            onChange={e => setSessionTimeoutMinutes(e.target.value)}
            placeholder={DEFAULT_QUEUE_CONFIG.session_timeout_minutes.toString()}
            min={1}
            max={120}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className='pt-4 border-t border-border'>
        <FmCommonButton
          onClick={handleSave}
          loading={isSaving}
          variant='gold'
        >
          {t('queue.saveConfiguration')}
        </FmCommonButton>
      </div>

      <FmCommonConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title={t('queue.resetToDefaults')}
        description={t('queue.resetConfirmDescription')}
        confirmText={t('queue.resetToDefaults')}
        onConfirm={handleResetToDefaults}
        variant="destructive"
        isLoading={isSaving}
      />
    </FmCommonCard>
  );
};
