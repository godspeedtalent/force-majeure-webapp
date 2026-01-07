import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { Label } from '@/components/common/shadcn/label';
import { Switch } from '@/components/common/shadcn/switch';
import { Code, Database, ToggleLeft, Info } from 'lucide-react';
import { toast } from 'sonner';

interface DevToolSection {
  id: string;
  labelKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
}

const DEV_TOOL_SECTIONS: DevToolSection[] = [
  {
    id: 'database',
    labelKey: 'devToolsManagement.sections.database.label',
    descriptionKey: 'devToolsManagement.sections.database.description',
    icon: <Database className='h-4 w-4' />,
  },
  {
    id: 'features',
    labelKey: 'devToolsManagement.sections.features.label',
    descriptionKey: 'devToolsManagement.sections.features.description',
    icon: <ToggleLeft className='h-4 w-4' />,
  },
];

const STORAGE_KEY = 'dev_tools_visibility';

export const DevToolsManagement = () => {
  const { t } = useTranslation('common');
  const [visibleSections, setVisibleSections] = useState<
    Record<string, boolean>
  >(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    // Default: all enabled
    return DEV_TOOL_SECTIONS.reduce(
      (acc, section) => {
        acc[section.id] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleSections));
  }, [visibleSections]);

  const handleToggle = (sectionId: string) => {
    setVisibleSections(prev => {
      const newState = { ...prev, [sectionId]: !prev[sectionId] };
      const isEnabled = newState[sectionId];
      const section = DEV_TOOL_SECTIONS.find(s => s.id === sectionId);
      const sectionLabel = section ? t(section.labelKey) : '';

      toast.success(
        isEnabled
          ? t('devToolsManagement.toast.enabled', { section: sectionLabel })
          : t('devToolsManagement.toast.disabled', { section: sectionLabel }),
        { description: t('devToolsManagement.toast.refreshRequired') }
      );

      return newState;
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-start gap-3 p-4 rounded-none border border-border bg-muted/20'>
        <Info className='h-5 w-5 text-fm-gold mt-0.5' />
        <div className='space-y-1'>
          <p className='text-sm font-medium text-foreground'>
            {t('devToolsManagement.title')}
          </p>
          <p className='text-sm text-muted-foreground'>
            {t('devToolsManagement.description')}
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {DEV_TOOL_SECTIONS.map(section => (
          <FmCommonCard key={section.id} className='p-6'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-start gap-3 flex-1'>
                <div className='p-2 rounded-none bg-muted/50 text-fm-gold'>
                  {section.icon}
                </div>
                <div className='flex-1 space-y-1'>
                  <Label
                    htmlFor={`toggle-${section.id}`}
                    className='text-sm font-medium cursor-pointer'
                  >
                    {t(section.labelKey)}
                  </Label>
                  <p className='text-xs text-muted-foreground'>
                    {t(section.descriptionKey)}
                  </p>
                </div>
              </div>
              <Switch
                id={`toggle-${section.id}`}
                checked={visibleSections[section.id] ?? true}
                onCheckedChange={() => handleToggle(section.id)}
              />
            </div>
          </FmCommonCard>
        ))}
      </div>

      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Code className='h-3 w-3' />
        <span>
          {t('devToolsManagement.keyboardShortcut')}
        </span>
      </div>
    </div>
  );
};
