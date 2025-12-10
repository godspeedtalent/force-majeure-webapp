import { MoreVertical } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/common/shadcn/card';
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
import { cn } from '@force-majeure/shared';

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
  const TypeIcon = typeConfig.icon;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          className={cn(
            'bg-muted border-l-[4px] border-t-[1px] cursor-pointer transition-all duration-200 relative text-xs',
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

            <CardContent className='p-[8px] pl-[32px] space-y-[8px]'>
              {/* Three Dots */}
              <div className='flex items-start justify-end -mt-1'>
                <div className='hover:text-fm-gold transition-colors'>
                  <MoreVertical className='h-3 w-3 text-muted-foreground flex-shrink-0' />
                </div>
              </div>

              {/* Message */}
              <p className='text-xs text-white leading-snug line-clamp-3 px-2'>
                {note.message}
              </p>
            </CardContent>

            <Separator className='bg-border/50' />

            <CardFooter className='p-[8px] pl-[32px] pt-[6px] flex items-center justify-between text-[10px] text-muted-foreground'>
              <span className='font-medium text-fm-gold'>
                {note.author_name}
              </span>
              <span>{formatDate(note.created_at)}</span>
            </CardFooter>
        </Card>
      </ContextMenuTrigger>

      <ContextMenuContent className='bg-card border-border rounded-none w-48'>
        <ContextMenuItem
          onSelect={onInspect}
          className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
        >
          Inspect
        </ContextMenuItem>
        {canEdit && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger className='text-white hover:bg-muted focus:bg-muted cursor-pointer'>
                Set Status
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
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
