import { useState, useEffect } from 'react';
import { Timer, Users, Clock, Info, RotateCcw } from 'lucide-react';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Card } from '@/components/common/shadcn/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';
import { toast } from 'sonner';
import { logger } from '@force-majeure/shared';
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
  const [config, setConfig] = useState<QueueConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
        toast.error('Failed to load queue configuration');
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

      toast.success('Queue configuration saved');

      // Reload config to get the new values
      const updatedConfig = await fetchQueueConfiguration(eventId);
      setConfig(updatedConfig);
    } catch (error) {
      logger.error('Failed to save queue configuration', {
        error: error instanceof Error ? error.message : 'Unknown',
        eventId,
      });
      toast.error('Failed to save queue configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!hasCustomConfig) {
      toast.info('Already using default configuration');
      return;
    }

    const confirmed = window.confirm(
      'This will remove the custom queue configuration for this event and revert to the global defaults. Continue?'
    );

    if (!confirmed) return;

    setIsSaving(true);
    try {
      await deleteQueueConfiguration(eventId);
      toast.success('Reset to default configuration');

      // Reload to get defaults
      const defaultConfig = await fetchQueueConfiguration(eventId);
      setConfig(defaultConfig);
      setEnableQueue(defaultConfig.enable_queue);
      setMaxConcurrentUsers(defaultConfig.max_concurrent_users.toString());
      setCheckoutTimeoutMinutes(''); // Clear to show placeholder
      setSessionTimeoutMinutes(defaultConfig.session_timeout_minutes.toString());
    } catch (error) {
      logger.error('Failed to reset queue configuration', {
        error: error instanceof Error ? error.message : 'Unknown',
        eventId,
      });
      toast.error('Failed to reset configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className='p-6'>
        <div className='text-muted-foreground text-sm'>Loading queue configuration...</div>
      </Card>
    );
  }

  return (
    <Card className='p-6 space-y-6'>
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-2'>
          <Timer className='h-5 w-5 text-fm-gold' />
          <div>
            <h3 className='text-lg font-canela font-semibold'>Queue configuration</h3>
            <p className='text-sm text-muted-foreground'>
              Control checkout behavior for this specific event
            </p>
          </div>
        </div>
        {hasCustomConfig && (
          <FmCommonButton
            variant='secondary'
            size='sm'
            icon={RotateCcw}
            onClick={handleResetToDefaults}
            disabled={isSaving}
          >
            Reset to defaults
          </FmCommonButton>
        )}
      </div>

      {/* Status indicator */}
      <div className='flex items-center gap-2 text-xs'>
        <span className='text-muted-foreground'>Configuration:</span>
        <span
          className={`px-2 py-0.5 rounded-none ${
            hasCustomConfig
              ? 'bg-fm-gold/20 text-fm-gold'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {hasCustomConfig ? 'Custom (event-specific)' : 'Using global defaults'}
        </span>
      </div>

      <div className='space-y-4'>
        {/* Enable Queue Toggle */}
        <div className='flex items-center justify-between p-4 bg-muted/20 rounded-none border border-border'>
          <div className='flex items-center gap-3'>
            <Users className='h-5 w-5 text-muted-foreground' />
            <div>
              <span className='font-medium'>Enable queue system</span>
              <p className='text-xs text-muted-foreground'>
                Control user flow during high-traffic ticket sales
              </p>
            </div>
          </div>
          <FmCommonToggle
            id='enable-queue'
            checked={enableQueue}
            onCheckedChange={setEnableQueue}
          />
        </div>

        {/* Max Concurrent Users */}
        <div className='p-4 bg-muted/20 rounded-none border border-border space-y-3'>
          <div className='flex items-center gap-2'>
            <Users className='h-4 w-4 text-muted-foreground' />
            <span className='font-medium'>Max concurrent users</span>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                </TooltipTrigger>
                <TooltipContent side='right' className='max-w-xs bg-black/95 border-white/20'>
                  <p className='text-sm text-white'>
                    Maximum number of users who can be in the checkout process simultaneously.
                    Others will be queued until a spot opens up.
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
            <span className='font-medium'>Checkout timer (minutes)</span>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                </TooltipTrigger>
                <TooltipContent side='right' className='max-w-xs bg-black/95 border-white/20'>
                  <p className='text-sm text-white'>
                    Time users have to complete checkout. Leave empty to use the global default
                    ({globalDefaultMinutes || 10} minutes).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <FmCommonTextField
            type='number'
            value={checkoutTimeoutMinutes}
            onChange={e => setCheckoutTimeoutMinutes(e.target.value)}
            placeholder={`${globalDefaultMinutes || 10} (global default)`}
            min={1}
            max={60}
            helperText={
              checkoutTimeoutMinutes
                ? undefined
                : `Using global default: ${globalDefaultMinutes || 10} minutes`
            }
          />
        </div>

        {/* Session Timeout */}
        <div className='p-4 bg-muted/20 rounded-none border border-border space-y-3'>
          <div className='flex items-center gap-2'>
            <Timer className='h-4 w-4 text-muted-foreground' />
            <span className='font-medium'>Session timeout (minutes)</span>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                </TooltipTrigger>
                <TooltipContent side='right' className='max-w-xs bg-black/95 border-white/20'>
                  <p className='text-sm text-white'>
                    How long a user's queue session remains valid if they leave and return.
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
          className='bg-fm-gold hover:bg-fm-gold/90 text-black'
        >
          Save Queue Configuration
        </FmCommonButton>
      </div>
    </Card>
  );
};
