import { useTranslation } from 'react-i18next';
import { MoreVertical } from 'lucide-react';
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
  isExpanded: boolean;
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
  onToggleExpand: () => void;
  onDoubleClick: () => void;
  onStatusChange: (status: NoteStatus) => void;
  onDelete: () => void;
  getStatusDisplayName: (status: NoteStatus) => string;
}

export const DevNoteCard = ({
  note,
  isExpanded,
  canEdit,
  typeConfig,
  statusConfig,
  onToggleExpand,
  onDoubleClick,
  onStatusChange,
  onDelete,
  getStatusDisplayName,
}: DevNoteCardProps) => {
  const { t } = useTranslation('common');
  const TypeIcon = typeConfig.icon;

  // Relative time format: "2m", "3h", "1d"
  const relativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  // Short date format for expanded view: "Jan 22, 2:30 PM"
  const shortDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${month} ${day}, ${hour12}:${minutes} ${ampm}`;
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            'cursor-pointer transition-all duration-150 group',
            'border-l-2 hover:bg-white/5',
            isExpanded ? 'bg-white/5 border-fm-gold' : 'border-transparent hover:border-fm-gold/50',
            typeConfig.borderColor
          )}
          onClick={onToggleExpand}
          onDoubleClick={e => {
            e.stopPropagation();
            onDoubleClick();
          }}
        >
          {/* Row 1: Main content */}
          <div className='flex items-center gap-1.5 px-1.5 py-1'>
            {/* Type Icon + Status Dot */}
            <div className='relative flex-shrink-0'>
              <div
                className={cn(
                  'w-5 h-5 flex items-center justify-center',
                  typeConfig.color
                )}
              >
                <TypeIcon className='h-3 w-3' />
              </div>
              <div
                className={cn(
                  'absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full',
                  statusConfig.color
                )}
                title={statusConfig.label}
              />
            </div>

            {/* Priority Badge */}
            <span
              className={cn(
                'text-[9px] font-bold flex-shrink-0 w-4 text-center',
                PRIORITY_CONFIG[note.priority || 3]?.color
              )}
            >
              {note.priority || 3}
            </span>

            {/* Title or Message */}
            <span className='flex-1 min-w-0 text-[11px] text-white/90 truncate'>
              {note.title || note.message}
            </span>

            {/* Menu Button - visible on hover */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <FmCommonIconButton
                  icon={MoreVertical}
                  variant='secondary'
                  size='sm'
                  className='h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-fm-gold flex-shrink-0'
                  onClick={e => e.stopPropagation()}
                  aria-label={t('devNotes.openMenu')}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent className='bg-card border-border rounded-none w-48'>
                <DropdownMenuItem
                  onSelect={() => onDoubleClick()}
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

          {/* Row 2: Author name + time */}
          <div className='flex items-center gap-1.5 px-1.5 pb-1 pl-[30px]'>
            <span className='text-[9px] text-fm-gold/80 truncate flex-1'>
              {note.author_name}
            </span>
            <span className='text-[9px] text-muted-foreground flex-shrink-0'>
              {relativeTime(note.created_at)}
            </span>
          </div>

          {/* Expanded Body */}
          {isExpanded && note.message && (
            <div className='px-1.5 pb-2 pl-[30px] border-t border-border/30 pt-1.5 mt-0.5'>
              {/* Full date when expanded */}
              <div className='text-[9px] text-muted-foreground mb-1'>
                {shortDate(note.created_at)}
              </div>
              <p className='text-[10px] text-white/70 leading-relaxed whitespace-pre-wrap'>
                {note.title ? note.message : null}
              </p>
              {!note.title && note.message.length > 60 && (
                <p className='text-[10px] text-white/70 leading-relaxed whitespace-pre-wrap line-clamp-3'>
                  {note.message}
                </p>
              )}
              <div className='mt-1.5 text-[9px] text-muted-foreground'>
                {t('devNotes.doubleClickToEdit')}
              </div>
            </div>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className='bg-card border-border rounded-none w-48'>
        <ContextMenuItem
          onSelect={() => onDoubleClick()}
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
