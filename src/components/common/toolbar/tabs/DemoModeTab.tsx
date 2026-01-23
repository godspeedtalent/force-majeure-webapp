import { useTranslation } from 'react-i18next';
import { Video, X, AlertTriangle, Clock, Maximize2, Hand } from 'lucide-react';
import { useDemoMode } from '@/shared/contexts/DemoModeContext';
import { cn } from '@/shared';
import { Button } from '@/components/common/shadcn/button';
import { Switch } from '@/components/common/shadcn/switch';
import { Slider } from '@/components/common/shadcn/slider';
import { type IndicatorSize } from '@/features/demo-mode/types';

/**
 * Settings panel content for Demo Mode.
 * Allows users to configure touch visualization options.
 */
export function DemoModeTabContent() {
  const { t } = useTranslation('common');
  const { settings, updateSettings, isActive, enable, disable } = useDemoMode();

  const sizeOptions: { value: IndicatorSize; label: string }[] = [
    { value: 'sm', label: t('demoMode.sizeSmall') },
    { value: 'md', label: t('demoMode.sizeMedium') },
    { value: 'lg', label: t('demoMode.sizeLarge') },
  ];

  return (
    <div className="space-y-4">
      {/* Active Warning Banner */}
      {isActive && (
        <div className="bg-fm-gold/20 border border-fm-gold/50 p-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-fm-gold flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-fm-gold">
              {t('demoMode.enabled')}
            </p>
            <p className="text-xs text-white/70 mt-1">
              {t('demoMode.enabledDescription')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-fm-gold hover:bg-fm-gold/20"
            onClick={disable}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Description */}
      <div>
        <p className="text-xs text-white/50">{t('demoMode.description')}</p>
      </div>

      {/* Main Toggle */}
      <div
        className={cn(
          'border p-3 transition-all duration-200',
          isActive
            ? 'bg-fm-gold/10 border-fm-gold/30'
            : 'bg-white/5 border-white/10'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 transition-colors',
                isActive ? 'bg-fm-gold/30' : 'bg-white/10'
              )}
            >
              <Video
                className={cn(
                  'h-5 w-5',
                  isActive ? 'text-fm-gold' : 'text-white/70'
                )}
              />
            </div>
            <div>
              <p
                className={cn(
                  'text-sm font-medium',
                  isActive ? 'text-fm-gold' : 'text-white'
                )}
              >
                {t('demoMode.toggle')}
              </p>
              <p className="text-xs text-white/50">{t('demoMode.title')}</p>
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={checked => (checked ? enable() : disable())}
          />
        </div>
      </div>

      {/* Settings Section - Only show when enabled */}
      {isActive && (
        <>
          <div className="space-y-3">
            <p className="text-xs text-white/50 uppercase tracking-wider">
              {t('demoMode.settings')}
            </p>

            {/* Action Delay Toggle */}
            <div
              className={cn(
                'border p-3 transition-all duration-200',
                settings.delayEnabled
                  ? 'bg-fm-gold/10 border-fm-gold/30'
                  : 'bg-white/5 border-white/10'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-1.5 transition-colors',
                      settings.delayEnabled ? 'bg-fm-gold/30' : 'bg-white/10'
                    )}
                  >
                    <Clock
                      className={cn(
                        'h-4 w-4',
                        settings.delayEnabled ? 'text-fm-gold' : 'text-white/70'
                      )}
                    />
                  </div>
                  <div>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        settings.delayEnabled ? 'text-fm-gold' : 'text-white'
                      )}
                    >
                      {t('demoMode.actionDelay')}
                    </p>
                    <p className="text-xs text-white/50">
                      {t('demoMode.actionDelayDescription')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.delayEnabled}
                  onCheckedChange={checked =>
                    updateSettings({ delayEnabled: checked })
                  }
                />
              </div>

              {/* Delay Duration Slider */}
              {settings.delayEnabled && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/50">
                      {t('demoMode.delayDuration')}
                    </p>
                    <span className="text-xs text-fm-gold font-mono">
                      {t('demoMode.delayMs', { value: settings.delayDuration })}
                    </span>
                  </div>
                  <Slider
                    value={[settings.delayDuration]}
                    onValueChange={([value]) =>
                      updateSettings({ delayDuration: value })
                    }
                    min={500}
                    max={2000}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-white/30">500ms</span>
                    <span className="text-[10px] text-white/30">2000ms</span>
                  </div>
                </div>
              )}
            </div>

            {/* Indicator Size */}
            <div className="bg-white/5 border border-white/10 p-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 bg-white/10">
                  <Maximize2 className="h-4 w-4 text-white/70" />
                </div>
                <p className="text-sm font-medium text-white">
                  {t('demoMode.indicatorSize')}
                </p>
              </div>
              <div className="flex gap-2">
                {sizeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() =>
                      updateSettings({ indicatorSize: option.value })
                    }
                    className={cn(
                      'flex-1 py-2 px-3 text-xs font-medium transition-all duration-200 border',
                      settings.indicatorSize === option.value
                        ? 'bg-fm-gold text-black border-fm-gold'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Long Press Indicator Toggle */}
            <div
              className={cn(
                'border p-3 transition-all duration-200',
                settings.showLongPressIndicator
                  ? 'bg-fm-gold/10 border-fm-gold/30'
                  : 'bg-white/5 border-white/10'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-1.5 transition-colors',
                      settings.showLongPressIndicator
                        ? 'bg-fm-gold/30'
                        : 'bg-white/10'
                    )}
                  >
                    <Hand
                      className={cn(
                        'h-4 w-4',
                        settings.showLongPressIndicator
                          ? 'text-fm-gold'
                          : 'text-white/70'
                      )}
                    />
                  </div>
                  <div>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        settings.showLongPressIndicator
                          ? 'text-fm-gold'
                          : 'text-white'
                      )}
                    >
                      {t('demoMode.longPressIndicator')}
                    </p>
                    <p className="text-xs text-white/50">
                      {t('demoMode.longPressDescription')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.showLongPressIndicator}
                  onCheckedChange={checked =>
                    updateSettings({ showLongPressIndicator: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Disable Button */}
          <Button
            variant="outline"
            className="w-full border-white/20 hover:bg-white/10"
            onClick={disable}
          >
            <X className="h-4 w-4 mr-2" />
            {t('demoMode.disable')}
          </Button>
        </>
      )}
    </div>
  );
}
