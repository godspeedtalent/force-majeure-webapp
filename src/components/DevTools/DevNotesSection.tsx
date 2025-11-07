import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, ArrowUpDown, MoreVertical, CheckCircle2, Info, Bug, HelpCircle, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/services/AuthContext';
import { toast } from 'sonner';
import { CreateDevNoteModal } from './CreateDevNoteModal';
import { Input } from '@/components/common/shadcn/input';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/common/shadcn/card';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/common/shadcn/context-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';
import { cn } from '@/shared/utils/utils';
import * as React from 'react';

type NoteType = 'TODO' | 'INFO' | 'BUG' | 'QUESTION';
type NoteStatus = 'TODO' | 'IN_PROGRESS' | 'ARCHIVED' | 'RESOLVED' | 'CANCELLED';

interface DevNote {
  id: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name: string;
  message: string;
  type: NoteType;
  status: NoteStatus;
}

const TYPE_CONFIG: Record<NoteType, { icon: any; color: string; borderColor: string }> = {
  TODO: { icon: CheckCircle2, color: 'bg-blue-500/10 text-blue-400', borderColor: 'border-t-blue-500' },
  INFO: { icon: Info, color: 'bg-cyan-500/10 text-cyan-400', borderColor: 'border-t-cyan-500' },
  BUG: { icon: Bug, color: 'bg-red-500/10 text-red-400', borderColor: 'border-t-red-500' },
  QUESTION: { icon: HelpCircle, color: 'bg-purple-500/10 text-purple-400', borderColor: 'border-t-purple-500' },
};

const getNextStatus = (currentStatus: NoteStatus): NoteStatus => {
  if (currentStatus === 'TODO') return 'IN_PROGRESS';
  if (currentStatus === 'IN_PROGRESS') return 'RESOLVED';
  return currentStatus;
};

const getStatusLabel = (status: NoteStatus): string => {
  if (status === 'TODO') return 'In Progress';
  if (status === 'IN_PROGRESS') return 'Resolved';
  return status.replace('_', ' ');
};

export const DevNotesSection = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<DevNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedNote, setExpandedNote] = useState<DevNote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<NoteType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<NoteStatus | 'ALL'>('ALL');
  const [filterAuthor, setFilterAuthor] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterOpen, setFilterOpen] = useState(false);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dev_notes')
        .select('*')
        .order('created_at', { ascending: sortOrder === 'asc' });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [sortOrder]);

  const uniqueAuthors = useMemo(() => {
    const authors = new Set(notes.map((note) => note.author_name));
    return Array.from(authors).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Search filter
      if (searchQuery && !note.message.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filterType !== 'ALL' && note.type !== filterType) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'ALL' && note.status !== filterStatus) {
        return false;
      }

      // Author filter
      if (filterAuthor !== 'ALL' && note.author_name !== filterAuthor) {
        return false;
      }

      return true;
    });
  }, [notes, searchQuery, filterType, filterStatus, filterAuthor]);

  const handleUpdateStatus = async (noteId: string, newStatus: NoteStatus) => {
    try {
      const { error } = await supabase
        .from('dev_notes')
        .update({ status: newStatus })
        .eq('id', noteId);

      if (error) throw error;

      toast.success('Status updated');
      loadNotes();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from('dev_notes').delete().eq('id', noteId);

      if (error) throw error;

      toast.success('Note deleted');
      loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString();
    const day = date.getDate().toString();
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  };

  const canEditNote = (note: DevNote) => {
    return user && note.author_id === user.id;
  };

  return (
    <div className="space-y-[20px]">
      {/* Header */}
      <div className="flex items-center justify-between px-[20px]">
        <h2 className="text-2xl font-bold text-white">Dev Notes</h2>
      </div>

      {/* New Note Button Row */}
      <div className="px-[20px]">
        <FmCommonButton
          variant="default"
          size="lg"
          onClick={() => setIsModalOpen(true)}
          className="w-full justify-center gap-2 border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-white h-12"
        >
          <Plus className="h-5 w-5" />
        </FmCommonButton>
      </div>

      {/* Search and Filter Row */}
      <div className="px-[20px] flex gap-[10px] items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted border-border text-white rounded-none h-10"
          />
        </div>
        
        {/* Filter Button */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <FmCommonButton
              variant="secondary"
              size="sm"
              className="h-10 w-10 p-0 border-border rounded-none"
            >
              <Filter className="h-4 w-4" />
            </FmCommonButton>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] bg-card border-border rounded-none p-4" align="end">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['ALL', 'TODO', 'INFO', 'BUG', 'QUESTION'].map((type) => (
                    <FmCommonButton
                      key={type}
                      variant={filterType === type ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setFilterType(type as NoteType | 'ALL')}
                      className={cn(
                        'text-xs rounded-none',
                        filterType === type && 'bg-fm-gold text-white'
                      )}
                    >
                      {type}
                    </FmCommonButton>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['ALL', 'TODO', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED', 'CANCELLED'].map((status) => (
                    <FmCommonButton
                      key={status}
                      variant={filterStatus === status ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setFilterStatus(status as NoteStatus | 'ALL')}
                      className={cn(
                        'text-xs rounded-none',
                        filterStatus === status && 'bg-fm-gold text-white'
                      )}
                    >
                      {status === 'IN_PROGRESS' ? 'IN PROG' : status}
                    </FmCommonButton>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Author</label>
                <div className="grid grid-cols-2 gap-2">
                  <FmCommonButton
                    variant={filterAuthor === 'ALL' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setFilterAuthor('ALL')}
                    className={cn(
                      'text-xs rounded-none',
                      filterAuthor === 'ALL' && 'bg-fm-gold text-white'
                    )}
                  >
                    ALL
                  </FmCommonButton>
                  {uniqueAuthors.map((author) => (
                    <FmCommonButton
                      key={author}
                      variant={filterAuthor === author ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => setFilterAuthor(author)}
                      className={cn(
                        'text-xs rounded-none truncate',
                        filterAuthor === author && 'bg-fm-gold text-white'
                      )}
                    >
                      {author}
                    </FmCommonButton>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Toggle */}
        <FmCommonButton
          variant="secondary"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="h-10 w-10 p-0 border-border rounded-none"
          title={sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
        >
          <ArrowUpDown className="h-4 w-4" />
        </FmCommonButton>
      </div>

      {/* Notes List */}
      <div className="px-[20px]">
        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading notes...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || filterType !== 'ALL' || filterStatus !== 'ALL' || filterAuthor !== 'ALL'
                ? 'No notes match your filters'
                : 'No notes yet. Create one to get started!'}
            </div>
          ) : (
            <div className="space-y-[10px]">
              {filteredNotes.map((note) => {
                const TypeIcon = TYPE_CONFIG[note.type].icon;
                const nextStatus = getNextStatus(note.status);
                const statusLabel = getStatusLabel(note.status);

                return (
                  <ContextMenu key={note.id}>
                    <ContextMenuTrigger>
                      <Card
                        className={cn(
                          'bg-muted border-border rounded-none border-t-[3px] cursor-pointer hover:border-fm-gold transition-colors',
                          TYPE_CONFIG[note.type].borderColor
                        )}
                        onClick={() => setExpandedNote(note)}
                      >
                        <CardContent className="p-[15px] space-y-[10px]">
                          {/* Type Icon and Dots */}
                          <div className="flex items-start justify-between gap-2">
                            <div className={cn(
                              'w-8 h-8 rounded-none border border-border flex items-center justify-center',
                              TYPE_CONFIG[note.type].color
                            )}>
                              <TypeIcon className="h-4 w-4" />
                            </div>
                            <MoreVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>

                          {/* Message */}
                          <p className="text-sm text-white leading-relaxed line-clamp-3">{note.message}</p>
                        </CardContent>

                        <CardFooter className="p-[15px] pt-0 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium text-fm-gold">{note.author_name}</span>
                          <span>{formatDate(note.created_at)}</span>
                        </CardFooter>
                      </Card>
                    </ContextMenuTrigger>

                    <ContextMenuContent className="bg-card border-border rounded-none">
                      <ContextMenuItem
                        onClick={() => setExpandedNote(note)}
                        className="text-white hover:bg-muted focus:bg-muted"
                      >
                        Expand
                      </ContextMenuItem>
                      {canEditNote(note) && (
                        <>
                          <ContextMenuItem
                            onClick={() => handleUpdateStatus(note.id, nextStatus)}
                            className="text-white hover:bg-muted focus:bg-muted"
                          >
                            Mark as {statusLabel}
                          </ContextMenuItem>
                          <ContextMenuItem
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
                          >
                            Delete
                          </ContextMenuItem>
                        </>
                      )}
                      <ContextMenuItem
                        onClick={() => {}}
                        className="text-muted-foreground hover:bg-muted focus:bg-muted"
                      >
                        Cancel
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Create Note Modal */}
      <CreateDevNoteModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onNoteCreated={loadNotes}
      />

      {/* Expanded Note Modal */}
      {expandedNote && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedNote(null)}
        >
          <Card
            className="bg-card border-border rounded-none max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-[20px] space-y-[15px]">
              {/* Header with Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-none border border-border flex items-center justify-center',
                    TYPE_CONFIG[expandedNote.type].color
                  )}>
                    {React.createElement(TYPE_CONFIG[expandedNote.type].icon, { className: 'h-5 w-5' })}
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{expandedNote.type}</div>
                    <div className="text-xs text-muted-foreground">
                      Status: <span className="text-white">{expandedNote.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedNote(null)}
                  className="text-muted-foreground hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Message */}
              <div className="bg-muted border border-border rounded-none p-[15px]">
                <p className="text-white leading-relaxed whitespace-pre-wrap">{expandedNote.message}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Author: </span>
                  <span className="text-fm-gold font-medium">{expandedNote.author_name}</span>
                </div>
                <div className="text-muted-foreground">
                  {formatDate(expandedNote.created_at)}
                </div>
              </div>

              {/* Actions */}
              {canEditNote(expandedNote) && (
                <div className="flex gap-2 pt-[10px] border-t border-border">
                  <FmCommonButton
                    variant="default"
                    size="sm"
                    onClick={() => {
                      const nextStatus = getNextStatus(expandedNote.status);
                      handleUpdateStatus(expandedNote.id, nextStatus);
                      setExpandedNote(null);
                    }}
                    className="flex-1 border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-white rounded-none"
                  >
                    Mark as {getStatusLabel(expandedNote.status)}
                  </FmCommonButton>
                  <FmCommonButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      handleDeleteNote(expandedNote.id);
                      setExpandedNote(null);
                    }}
                    className="border-red-500 text-red-400 hover:bg-red-500/10 rounded-none"
                  >
                    Delete
                  </FmCommonButton>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
