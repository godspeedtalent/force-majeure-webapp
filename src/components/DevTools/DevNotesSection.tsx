import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, ArrowUpDown, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/services/AuthContext';
import { toast } from 'sonner';
import { CreateDevNoteModal } from './CreateDevNoteModal';
import { Input } from '@/components/common/shadcn/input';
import { Badge } from '@/components/common/shadcn/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/common/shadcn/context-menu';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';

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

const TYPE_COLORS: Record<NoteType, string> = {
  TODO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  INFO: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  BUG: 'bg-red-500/20 text-red-400 border-red-500/30',
  QUESTION: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const STATUS_COLORS: Record<NoteStatus, string> = {
  TODO: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ARCHIVED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  RESOLVED: 'bg-green-500/20 text-green-400 border-green-500/30',
  CANCELLED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export const DevNotesSection = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<DevNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<NoteType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<NoteStatus | 'ALL'>('ALL');
  const [filterAuthor, setFilterAuthor] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canEditNote = (note: DevNote) => {
    return user && note.author_id === user.id;
  };

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Developer Notes</h3>
        <FmCommonButton
          variant="gold"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Note
        </FmCommonButton>
      </div>

      {/* Filters Section */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-fm-dark border-fm-gold/20 text-white"
          />
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-4 gap-2">
          <Select value={filterType} onValueChange={(value) => setFilterType(value as NoteType | 'ALL')}>
            <SelectTrigger className="bg-fm-dark border-fm-gold/20 text-white text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-fm-dark-card border-fm-gold/20">
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="TODO">TODO</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="BUG">BUG</SelectItem>
              <SelectItem value="QUESTION">QUESTION</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as NoteStatus | 'ALL')}>
            <SelectTrigger className="bg-fm-dark border-fm-gold/20 text-white text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-fm-dark-card border-fm-gold/20">
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="TODO">TODO</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAuthor} onValueChange={setFilterAuthor}>
            <SelectTrigger className="bg-fm-dark border-fm-gold/20 text-white text-xs">
              <SelectValue placeholder="Author" />
            </SelectTrigger>
            <SelectContent className="bg-fm-dark-card border-fm-gold/20">
              <SelectItem value="ALL">All Authors</SelectItem>
              {uniqueAuthors.map((author) => (
                <SelectItem key={author} value={author}>
                  {author}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <FmCommonButton
            variant="secondary"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
          </FmCommonButton>
        </div>
      </div>

      {/* Notes List */}
      <ScrollArea className="h-[500px] pr-4">
        {isLoading ? (
          <div className="text-center py-8 text-white/50">Loading notes...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            {searchQuery || filterType !== 'ALL' || filterStatus !== 'ALL' || filterAuthor !== 'ALL'
              ? 'No notes match your filters'
              : 'No notes yet. Create one to get started!'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotes.map((note) => (
              <ContextMenu key={note.id}>
                <ContextMenuTrigger>
                  <div className="bg-fm-dark-card border border-fm-gold/20 rounded-lg p-3 hover:border-fm-gold/40 transition-colors cursor-context-menu">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs px-2 py-0.5 ${TYPE_COLORS[note.type]}`}>
                          {note.type}
                        </Badge>
                        <Badge className={`text-xs px-2 py-0.5 ${STATUS_COLORS[note.status]}`}>
                          {note.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <MoreVertical className="h-4 w-4 text-white/30 flex-shrink-0" />
                    </div>

                    {/* Message */}
                    <p className="text-sm text-white mb-2 break-words">{note.message}</p>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span className="font-medium text-fm-gold">{note.author_name}</span>
                      <span>{formatDate(note.created_at)}</span>
                    </div>
                  </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="bg-fm-dark-card border-fm-gold/20">
                  <ContextMenuItem
                    onClick={() => handleUpdateStatus(note.id, 'TODO')}
                    disabled={!canEditNote(note)}
                    className="text-white hover:bg-fm-gold/20"
                  >
                    Mark as TODO
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => handleUpdateStatus(note.id, 'IN_PROGRESS')}
                    disabled={!canEditNote(note)}
                    className="text-white hover:bg-fm-gold/20"
                  >
                    Mark as In Progress
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => handleUpdateStatus(note.id, 'RESOLVED')}
                    disabled={!canEditNote(note)}
                    className="text-white hover:bg-fm-gold/20"
                  >
                    Mark as Resolved
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => handleUpdateStatus(note.id, 'ARCHIVED')}
                    disabled={!canEditNote(note)}
                    className="text-white hover:bg-fm-gold/20"
                  >
                    Mark as Archived
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => handleUpdateStatus(note.id, 'CANCELLED')}
                    disabled={!canEditNote(note)}
                    className="text-white hover:bg-fm-gold/20"
                  >
                    Mark as Cancelled
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={!canEditNote(note)}
                    className="text-red-400 hover:bg-red-500/20"
                  >
                    Delete Note
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Create Note Modal */}
      <CreateDevNoteModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onNoteCreated={loadNotes}
      />
    </div>
  );
};
