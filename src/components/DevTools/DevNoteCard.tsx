import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreVertical, Eye, CircleDot, Trash2, Circle } from 'lucide-react';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import {
  FmCommonContextMenu,
  ContextMenuAction,
} from '@/components/common/modals/FmCommonContextMenu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import { cn, getDepthClasses, getListItemClasses } from '@/shared';
import { PRIORITY_CONFIG, type DevNote, type NoteStatus } from './config/devNotesConfig';

interface DevNoteCardProps {
  note: DevNote;
  isExpanded: boolean;
  canEdit: boolean;
  isAdmin?: boolean;
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

// Status icon colors for the submenu
const STATUS_COLORS: Record<NoteStatus, string> = {
  TODO: 'text-gray-400',
  IN_PROGRESS: 'text-yellow-400',
  RESOLVED: 'text-green-400',
  ARCHIVED: 'text-blue-400',
  CANCELLED: 'text-red-400',
};

export const DevNoteCard = ({
  note,
  isExpanded,
  canEdit,
  isAdmin = false,
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

  // Build context menu actions
  const contextMenuActions = useMemo((): ContextMenuAction<DevNote>[] => {
    const actions: ContextMenuAction<DevNote>[] = [
      {
        label: t('devNotes.inspect'),
        icon: <Eye className='h-4 w-4' />,
        onClick: () => onDoubleClick(),
      },
    ];

    // Add status submenu for authors and admins
    if (canEdit || isAdmin) {
      actions.push({
        label: t('devNotes.setStatus'),
        icon: <CircleDot className='h-4 w-4' />,
        submenu: [
          {
            label: getStatusDisplayName('TODO'),
            icon: <Circle className={cn('h-3 w-3', STATUS_COLORS.TODO)} />,
            onClick: () => onStatusChange('TODO'),
          },
          {
            label: getStatusDisplayName('IN_PROGRESS'),
            icon: <Circle className={cn('h-3 w-3', STATUS_COLORS.IN_PROGRESS)} />,
            onClick: () => onStatusChange('IN_PROGRESS'),
          },
          {
            label: getStatusDisplayName('RESOLVED'),
            icon: <Circle className={cn('h-3 w-3', STATUS_COLORS.RESOLVED)} />,
            onClick: () => onStatusChange('RESOLVED'),
          },
          {
            label: getStatusDisplayName('ARCHIVED'),
            icon: <Circle className={cn('h-3 w-3', STATUS_COLORS.ARCHIVED)} />,
            onClick: () => onStatusChange('ARCHIVED'),
          },
          {
            label: getStatusDisplayName('CANCELLED'),
            icon: <Circle className={cn('h-3 w-3', STATUS_COLORS.CANCELLED)} />,
            onClick: () => onStatusChange('CANCELLED'),
          },
        ],
      });
    }

    // Add delete for authors only (or admins with the new RLS policy)
    if (canEdit || isAdmin) {
      actions.push({
        label: t('actions.delete'),
        icon: <Trash2 className='h-4 w-4' />,
        onClick: () => onDelete(),
        variant: 'destructive',
        separator: true,
      });
    }

    return actions;
  }, [canEdit, isAdmin, t, onDoubleClick, onStatusChange, onDelete, getStatusDisplayName]);

  return (
    <FmCommonContextMenu actions={contextMenuActions} data={note}>
      <div
        className={cn(
          'cursor-pointer transition-all duration-150 group',
          'border-l-2 hover:bg-white/5',
          // Type-specific border color comes first, then override for expanded state
          typeConfig.borderColor,
          isExpanded && 'bg-white/5 !border-l-fm-gold'
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
            <DropdownMenuContent
              className={cn(
                'w-48',
                getDepthClasses(3),
                'border border-white/20 border-l-[3px] border-l-fm-gold/60 shadow-lg shadow-black/50',
                'p-1'
              )}
            >
              <DropdownMenuItem
                onSelect={() => onDoubleClick()}
                className={cn(
                  'group cursor-pointer rounded-none my-0.5 relative',
                  getListItemClasses(0)
                )}
              >
                <Eye className='h-4 w-4 mr-2' />
                {t('devNotes.inspect')}
              </DropdownMenuItem>
              {(canEdit || isAdmin) && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger
                    className={cn(
                      'group cursor-pointer rounded-none my-0.5 relative',
                      getListItemClasses(1)
                    )}
                  >
                    <CircleDot className='h-4 w-4 mr-2' />
                    {t('devNotes.setStatus')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent
                    className={cn(
                      'w-40',
                      getDepthClasses(3),
                      'border border-white/20 border-l-[3px] border-l-fm-gold/60 shadow-lg shadow-black/50',
                      'p-1'
                    )}
                  >
                    <DropdownMenuItem
                      onSelect={() => onStatusChange('TODO')}
                      className={cn(
                        'group cursor-pointer rounded-none my-0.5 relative',
                        getListItemClasses(0)
                      )}
                    >
                      <Circle className={cn('h-3 w-3 mr-2', STATUS_COLORS.TODO)} />
                      {getStatusDisplayName('TODO')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onStatusChange('IN_PROGRESS')}
                      className={cn(
                        'group cursor-pointer rounded-none my-0.5 relative',
                        getListItemClasses(1)
                      )}
                    >
                      <Circle className={cn('h-3 w-3 mr-2', STATUS_COLORS.IN_PROGRESS)} />
                      {getStatusDisplayName('IN_PROGRESS')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onStatusChange('RESOLVED')}
                      className={cn(
                        'group cursor-pointer rounded-none my-0.5 relative',
                        getListItemClasses(2)
                      )}
                    >
                      <Circle className={cn('h-3 w-3 mr-2', STATUS_COLORS.RESOLVED)} />
                      {getStatusDisplayName('RESOLVED')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onStatusChange('ARCHIVED')}
                      className={cn(
                        'group cursor-pointer rounded-none my-0.5 relative',
                        getListItemClasses(3)
                      )}
                    >
                      <Circle className={cn('h-3 w-3 mr-2', STATUS_COLORS.ARCHIVED)} />
                      {getStatusDisplayName('ARCHIVED')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => onStatusChange('CANCELLED')}
                      className={cn(
                        'group cursor-pointer rounded-none my-0.5 relative',
                        getListItemClasses(4)
                      )}
                    >
                      <Circle className={cn('h-3 w-3 mr-2', STATUS_COLORS.CANCELLED)} />
                      {getStatusDisplayName('CANCELLED')}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              {(canEdit || isAdmin) && (
                <DropdownMenuItem
                  onSelect={onDelete}
                  className={cn(
                    'group cursor-pointer rounded-none my-0.5 relative',
                    'text-destructive hover:bg-destructive/15 hover:text-destructive',
                    getListItemClasses(2)
                  )}
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  {t('actions.delete')}
                </DropdownMenuItem>
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
    </FmCommonContextMenu>
  );
};
