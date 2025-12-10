import { useState, useEffect } from 'react';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { Button } from '@/components/common/shadcn/button';
import { RefreshCw, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';
import { FEATURE_FLAGS } from '@force-majeure/shared';
import {
  setFeatureFlagOverride,
  getFeatureFlagOverride,
  clearFeatureFlagOverride,
  clearAllFeatureFlagOverrides,
  hasFeatureFlagOverride,
} from '@force-majeure/shared';
import { useFeatureFlagHelpers } from '@force-majeure/shared';
import { useQueryClient } from '@tanstack/react-query';

export function SessionOverridesTabContent() {
  const { flags } = useFeatureFlagHelpers();
  const queryClient = useQueryClient();
  const [localOverrides, setLocalOverrides] = useState<Record<string, boolean | null>>({});

  // Load current overrides from session storage
  useEffect(() => {
    const overrides: Record<string, boolean | null> = {};
    overrides[FEATURE_FLAGS.COMING_SOON_MODE] = getFeatureFlagOverride(
      FEATURE_FLAGS.COMING_SOON_MODE
    );
    setLocalOverrides(overrides);
  }, []);

  const handleToggle = (flagName: string, newValue: boolean) => {
    setFeatureFlagOverride(flagName, newValue);
    setLocalOverrides(prev => ({ ...prev, [flagName]: newValue }));

    // Invalidate feature flags query to trigger re-fetch
    queryClient.invalidateQueries({ queryKey: ['feature-flags'] });

    toast.success('Session override applied', {
      description: `Override active for this session only`,
    });
  };

  const handleClear = (flagName: string) => {
    clearFeatureFlagOverride(flagName);
    setLocalOverrides(prev => ({ ...prev, [flagName]: null }));

    // Invalidate feature flags query to trigger re-fetch
    queryClient.invalidateQueries({ queryKey: ['feature-flags'] });

    toast.info('Override cleared', {
      description: 'Using database value',
    });
  };

  const handleClearAll = () => {
    clearAllFeatureFlagOverrides();

    const clearedOverrides: Record<string, boolean | null> = {};
    clearedOverrides[FEATURE_FLAGS.COMING_SOON_MODE] = null;
    setLocalOverrides(clearedOverrides);

    // Invalidate feature flags query to trigger re-fetch
    queryClient.invalidateQueries({ queryKey: ['feature-flags'] });

    toast.info('All session overrides cleared');
  };

  const hasAnyOverrides = hasFeatureFlagOverride(FEATURE_FLAGS.COMING_SOON_MODE);

  // Get the current database value for coming_soon_mode
  const databaseValue = flags?.[FEATURE_FLAGS.COMING_SOON_MODE] ?? false;
  const overrideValue = localOverrides[FEATURE_FLAGS.COMING_SOON_MODE];
  const hasOverride = overrideValue !== null;
  const displayValue = hasOverride ? overrideValue : databaseValue;

  return (
    <div className='space-y-4'>
      <div className='mb-4 pb-3 border-b border-white/10'>
        <p className='text-xs text-white/50 mb-2'>
          Session-based overrides for this browser session only. These override database values
          and .env settings.
        </p>
        <div className='flex items-center gap-2 text-xs'>
          <span className='text-white/50'>Active Overrides:</span>
          <span className='font-medium text-fm-gold'>
            {hasAnyOverrides ? '1' : 'None'}
          </span>
        </div>
      </div>

      <div className='space-y-4'>
        {/* Coming Soon Mode Override */}
        <div className='space-y-2'>
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div>
                  <FmCommonToggle
                    id='override-coming-soon-mode'
                    label='Override Coming Soon Mode'
                    icon={EyeOff}
                    checked={displayValue}
                    onCheckedChange={checked =>
                      handleToggle(FEATURE_FLAGS.COMING_SOON_MODE, checked)
                    }
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent
                side='left'
                className='max-w-xs bg-black/95 border-white/20 z-[150]'
              >
                <p className='text-sm text-white'>
                  Temporarily disable Coming Soon mode for your session. Useful for testing the
                  full app while coming_soon_mode is enabled in the database.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Status indicator */}
          <div className='flex items-center gap-2 text-xs ml-10'>
            {hasOverride ? (
              <>
                <span className='text-white/50'>Override active:</span>
                <span className='font-medium text-fm-gold'>
                  {displayValue ? 'Enabled' : 'Disabled'}
                </span>
                <span className='text-white/30'>•</span>
                <span className='text-white/30'>
                  Database: {databaseValue ? 'Enabled' : 'Disabled'}
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleClear(FEATURE_FLAGS.COMING_SOON_MODE)}
                  className='h-6 px-2 text-xs text-white/50 hover:text-white hover:bg-white/10'
                >
                  Clear
                </Button>
              </>
            ) : (
              <>
                <span className='text-white/50'>Using database value:</span>
                <span className='font-medium text-white/70'>
                  {databaseValue ? 'Enabled' : 'Disabled'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Clear All Button */}
      {hasAnyOverrides && (
        <div className='pt-4 border-t border-white/10'>
          <Button
            onClick={handleClearAll}
            variant='outline'
            className='w-full border-white/20 hover:bg-white/10 text-white'
          >
            <RefreshCw className='h-4 w-4 mr-2' />
            Clear All Session Overrides
          </Button>
        </div>
      )}

      {/* Info box */}
      <div className='p-3 rounded-none bg-white/5 border border-white/10'>
        <p className='text-xs text-white/70 leading-relaxed'>
          <strong className='text-white'>How it works:</strong> Session overrides are stored in
          your browser's sessionStorage and only affect your current tab. They override both
          database values and .env settings. Closing the tab will clear all overrides.
        </p>
      </div>
    </div>
  );
}
