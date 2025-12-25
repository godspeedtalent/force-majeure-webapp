import { useTranslation } from 'react-i18next';
import { MoreVertical } from 'lucide-react';
import { FmCommonCard, FmCommonCardContent, FmCommonCardFooter } from '@/components/common/display/FmCommonCard';
import { Separator } from '@/components/common/shadcn/separator';
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
import { PRIORITY_CONFIG } from './config/devNotesConfig';

type NoteType = 'TODO' | 'INFO' | 'BUG' | 'QUESTION';
type NoteStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'ARCHIVED'
  | 'CANCELLED';

interface DevNote {
  id: string;
  type: NoteType;
  status: NoteStatus;
  message: string;
  author_name: string;
  author_id: string;
  created_at: string;
  priority: number;
}

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
            'hover:bg-[#1a1612]',
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

            <FmCommonCardContent className='p-[8px] pl-[32px] space-y-[8px]'>
              {/* Three Dots Dropdown Menu */}
              <div className='flex items-start justify-end -mt-1'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className='hover:text-fm-gold transition-colors focus:outline-none'
                      onClick={e => e.stopPropagation()}
                    >
                      <MoreVertical className='h-3 w-3 text-muted-foreground flex-shrink-0 hover:text-fm-gold' />
                    </button>
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

              {/* Message */}
              <p className='text-xs text-white leading-snug line-clamp-3 px-2 whitespace-pre-wrap'>
                {note.message}
              </p>
            </FmCommonCardContent>

            <Separator className='bg-border/50' />

            <FmCommonCardFooter className='p-[8px] pl-[32px] pt-[6px] flex items-center justify-between text-[10px] text-muted-foreground'>
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
