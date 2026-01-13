import { useTranslation } from 'react-i18next';
import { MoreVertical } from 'lucide-react';
import { FmCommonCard, FmCommonCardContent, FmCommonCardFooter } from '@/components/common/display/FmCommonCard';
import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/common/shadcn/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import { cn } from '@/shared';
import { PRIORITY_CONFIG, type DevNote, type NoteStatus } from './config/devNotesConfig';

interface DevNoteCardProps {
  note: DevNote;
  isFocused: boolean;
  canEdit: boolean;
  typeConfig: {
    icon: any;
    color: string;
    borderColor: string;
  };
  statusConfig: {
    color: string;
    label: string;
  };
  onFocus: () => void;
  onInspect: () => void;
  onDoubleClick: () => void;
  onStatusChange: (status: NoteStatus) => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
  getStatusDisplayName: (status: NoteStatus) => string;
}

export const DevNoteCard = ({
  note,
  isFocused,
  canEdit,
  typeConfig,
  statusConfig,
  onFocus,
  onInspect,
  onDoubleClick,
  onStatusChange,
  onDelete,
  formatDate,
  getStatusDisplayName,
}: DevNoteCardProps) => {
  const { t } = useTranslation('common');
  const TypeIcon = typeConfig.icon;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <FmCommonCard
          className={cn(
            'border-l-[4px] border-t-[1px] cursor-pointer transition-all duration-200 relative text-xs',
            'hover:bg-white/5',
            isFocused
              ? 'border-fm-gold'
              : 'border-border hover:border-fm-gold/50',
            typeConfig.borderColor
          )}
          onClick={onFocus}
          onDoubleClick={onDoubleClick}
        >
            {/* Type Icon - positioned absolutely outside content */}
            <div
              className={cn(
                'absolute left-0 top-0 w-6 h-6 border border-border flex items-center justify-center',
                typeConfig.color
              )}
            >
              <TypeIcon className='h-3 w-3 m-0' />
            </div>

            {/* Status Indicator - small dot next to type icon */}
            <div
              className={cn(
                'absolute left-[22px] top-[2px] w-2 h-2 rounded-full border border-background',
                statusConfig.color
              )}
              title={statusConfig.label}
            />

            <FmCommonCardContent className='p-[10px] pl-[40px] space-y-[10px]'>
              {/* Three Dots Dropdown Menu */}
              <div className='flex items-start justify-end -mt-1'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <FmCommonIconButton
                      icon={MoreVertical}
                      variant='secondary'
                      size='sm'
                      className='h-6 w-6 text-muted-foreground hover:text-fm-gold'
                      onClick={e => e.stopPropagation()}
                      aria-label={t('devNotes.openMenu')}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='bg-card border-border rounded-none w-48'>
                    <DropdownMenuItem
                      onSelect={onInspect}
                      className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                    >
                      {t('devNotes.inspect')}
                    </DropdownMenuItem>
                    {canEdit && (
                      <>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className='text-white hover:bg-muted focus:bg-muted cursor-pointer'>
                            {t('devNotes.setStatus')}
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className='bg-card border-border rounded-none w-40'>
                            <DropdownMenuItem
                              onSelect={() => onStatusChange('TODO')}
                              className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                            >
                              {getStatusDisplayName('TODO')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => onStatusChange('IN_PROGRESS')}
                              className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                            >
                              {getStatusDisplayName('IN_PROGRESS')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => onStatusChange('RESOLVED')}
                              className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                            >
                              {getStatusDisplayName('RESOLVED')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => onStatusChange('ARCHIVED')}
                              className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                            >
                              {getStatusDisplayName('ARCHIVED')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => onStatusChange('CANCELLED')}
                              className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                            >
                              {getStatusDisplayName('CANCELLED')}
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem
                          onSelect={onDelete}
                          className='text-red-400 hover:bg-muted focus:bg-muted cursor-pointer'
                        >
                          {t('actions.delete')}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Title (if exists) */}
              {note.title && (
                <h4 className='text-sm font-medium text-white px-2 line-clamp-1'>
                  {note.title}
                </h4>
              )}

              {/* Message preview */}
              <p className='text-xs text-white/80 leading-snug line-clamp-2 px-2 whitespace-pre-wrap'>
                {note.message}
              </p>
            </FmCommonCardContent>

            <Separator className='bg-border/50' />

            <FmCommonCardFooter className='p-[10px] pl-[40px] pt-[5px] flex items-center justify-between text-[10px] text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <span className='font-medium text-fm-gold'>
                  {note.author_name}
                </span>
                {/* Priority indicator */}
                <span className={cn('text-[9px] font-medium', PRIORITY_CONFIG[note.priority || 3]?.color)}>
                  P{note.priority || 3}
                </span>
              </div>
              <span>{formatDate(note.created_at)}</span>
            </FmCommonCardFooter>
        </FmCommonCard>
      </ContextMenuTrigger>

      <ContextMenuContent className='bg-card border-border rounded-none w-48'>
        <ContextMenuItem
          onSelect={onInspect}
          className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
        >
          {t('devNotes.inspect')}
        </ContextMenuItem>
        {canEdit && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger className='text-white hover:bg-muted focus:bg-muted cursor-pointer'>
                {t('devNotes.setStatus')}
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className='bg-card border-border rounded-none w-40'>
                <ContextMenuItem
                  onSelect={() => onStatusChange('TODO')}
                  className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                >
                  {getStatusDisplayName('TODO')}
                </ContextMenuItem>
                <ContextMenuItem
                  onSelect={() => onStatusChange('IN_PROGRESS')}
                  className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                >
                  {getStatusDisplayName('IN_PROGRESS')}
                </ContextMenuItem>
                <ContextMenuItem
                  onSelect={() => onStatusChange('RESOLVED')}
                  className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                >
                  {getStatusDisplayName('RESOLVED')}
                </ContextMenuItem>
                <ContextMenuItem
                  onSelect={() => onStatusChange('ARCHIVED')}
                  className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                >
                  {getStatusDisplayName('ARCHIVED')}
                </ContextMenuItem>
                <ContextMenuItem
                  onSelect={() => onStatusChange('CANCELLED')}
                  className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                >
                  {getStatusDisplayName('CANCELLED')}
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem
              onSelect={onDelete}
              className='text-red-400 hover:bg-muted focus:bg-muted cursor-pointer'
            >
              {t('actions.delete')}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
