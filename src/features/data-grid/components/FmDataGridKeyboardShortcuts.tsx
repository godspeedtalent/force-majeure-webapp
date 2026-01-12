import { useTranslation } from 'react-i18next';
import { Keyboard } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';
import { Button } from '@/components/common/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';

interface ShortcutItem {
  keys: string[];
  description: string;
}

export function FmDataGridKeyboardShortcuts() {
  const { t } = useTranslation('common');

  const shortcuts: ShortcutItem[] = [
    { keys: ['↑', '↓', '←', '→'], description: t('dataGrid.shortcuts.arrowKeys') },
    { keys: ['Enter'], description: t('dataGrid.shortcuts.enter') },
    { keys: ['Escape'], description: t('dataGrid.shortcuts.escape') },
    { keys: ['Space'], description: t('dataGrid.shortcuts.space') },
    { keys: ['Shift', 'Click'], description: t('dataGrid.shortcuts.shiftClick') },
    { keys: ['Ctrl/⌘', 'C'], description: t('dataGrid.shortcuts.copyCell') },
    { keys: ['Tab'], description: t('dataGrid.shortcuts.tab') },
    { keys: ['Shift', 'Tab'], description: t('dataGrid.shortcuts.shiftTab') },
  ];

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8 hover:bg-muted'
              >
                <Keyboard className='h-4 w-4 text-muted-foreground' />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side='bottom'>
            <p className='text-xs'>{t('dataGrid.shortcuts.title')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent align='end' className='w-72 p-3'>
        <div className='space-y-3'>
          <h4 className='font-medium text-sm'>{t('dataGrid.shortcuts.title')}</h4>
          <div className='space-y-2'>
            {shortcuts.map((shortcut, index) => (
              <div key={index} className='flex items-center justify-between text-xs'>
                <div className='flex items-center gap-1'>
                  {shortcut.keys.map((key, keyIndex) => (
                    <span key={keyIndex}>
                      <kbd className='px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono'>
                        {key}
                      </kbd>
                      {keyIndex < shortcut.keys.length - 1 && (
                        <span className='text-muted-foreground mx-0.5'>+</span>
                      )}
                    </span>
                  ))}
                </div>
                <span className='text-muted-foreground'>{shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
