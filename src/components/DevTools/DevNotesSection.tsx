import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, ArrowUpDown, Filter } from 'lucide-react';
import { useAuth } from '@/features/auth/services/AuthContext';
import { CreateDevNoteModal } from './CreateDevNoteModal';
import { DevNoteCard } from './DevNoteCard';
import { useDevNotesFilter } from './hooks/useDevNotesFilter';
import { useDevNotesActions } from './hooks/useDevNotesActions';
import {
  NOTE_TYPE_CONFIG,
  NOTE_STATUS_INDICATOR_CONFIG,
  getStatusDisplayName,
  type NoteType,
  type NoteStatus,
} from './config/devNotesConfig';
import { Input } from '@/components/common/shadcn/input';
import { Separator } from '@/components/common/shadcn/separator';
import { Card, CardContent } from '@/components/common/shadcn/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import {
  FmMultiCheckboxInput,
  FmMultiCheckboxOption,
} from '@/components/common/forms/FmMultiCheckboxInput';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';
import { cn } from '@/shared/utils/utils';
import * as React from 'react';

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

export const DevNotesSection = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<DevNote[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedNote, setExpandedNote] = useState<DevNote | null>(null);
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterOpen, setFilterOpen] = useState(false);

  // Editing state for expanded note
  const [editedMessage, setEditedMessage] = useState('');
  const [editedStatus, setEditedStatus] = useState<NoteStatus>('TODO');
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use actions hook for CRUD operations
  const { isLoading, loadNotes, updateStatus, updateMessage, deleteNote } =
    useDevNotesActions();

  // Use filter hook
  const {
    searchQuery,
    setSearchQuery,
    filterTypes,
    setFilterTypes,
    filterStatuses,
    setFilterStatuses,
    filterAuthors,
    setFilterAuthors,
    filteredNotes,
    uniqueAuthors,
  } = useDevNotesFilter({ notes });

  const handleLoadNotes = useCallback(async () => {
    const data = await loadNotes(sortOrder);
    setNotes(data);
  }, [sortOrder]); // Removed loadNotes from deps - it's stable from the hook

  useEffect(() => {
    handleLoadNotes();
  }, [handleLoadNotes]);

  // Filter options for multi-checkbox inputs
  const typeOptions: FmMultiCheckboxOption[] = [
    { value: 'TODO', label: 'TODO', icon: NOTE_TYPE_CONFIG.TODO.icon },
    { value: 'INFO', label: 'INFO', icon: NOTE_TYPE_CONFIG.INFO.icon },
    { value: 'BUG', label: 'BUG', icon: NOTE_TYPE_CONFIG.BUG.icon },
    {
      value: 'QUESTION',
      label: 'QUESTION',
      icon: NOTE_TYPE_CONFIG.QUESTION.icon,
    },
  ];

  const statusOptions: FmMultiCheckboxOption[] = [
    { value: 'TODO', label: 'TODO' },
    { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
    { value: 'RESOLVED', label: 'RESOLVED' },
    { value: 'ARCHIVED', label: 'ARCHIVED' },
    { value: 'CANCELLED', label: 'CANCELLED' },
  ];

  const authorOptions: FmMultiCheckboxOption[] = uniqueAuthors.map(author => ({
    value: author,
    label: author,
  }));

  const handleUpdateStatus = async (noteId: string, newStatus: NoteStatus) => {
    await updateStatus(noteId, newStatus);
    handleLoadNotes();
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId);
    handleLoadNotes();
  };

  // Initialize editing state when expanding a note
  useEffect(() => {
    if (expandedNote) {
      setEditedMessage(expandedNote.message);
      setEditedStatus(expandedNote.status);
      setHasUnsavedChanges(false);
    }
  }, [expandedNote]);

  // Handle saving changes to expanded note
  const handleSaveChanges = async () => {
    if (!expandedNote || !hasUnsavedChanges) return;

    const promises = [];

    if (editedMessage !== expandedNote.message) {
      promises.push(updateMessage(expandedNote.id, editedMessage));
    }

    if (editedStatus !== expandedNote.status) {
      promises.push(updateStatus(expandedNote.id, editedStatus));
    }

    if (promises.length > 0) {
      await Promise.all(promises);
      await handleLoadNotes();
      setExpandedNote(null);
      setHasUnsavedChanges(false);
    }
  };

  const handleCancelChanges = () => {
    setExpandedNote(null);
    setIsEditingMessage(false);
    setHasUnsavedChanges(false);
  };

  const handleMessageClick = () => {
    if (expandedNote && canEditNote(expandedNote)) {
      setIsEditingMessage(true);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleMessageChange = (value: string) => {
    setEditedMessage(value);
    setHasUnsavedChanges(true);
  };

  const handleMessageKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditingMessage(false);
    }
  };

  const handleMessageBlur = () => {
    setIsEditingMessage(false);
  };

  const handleStatusChange = (value: NoteStatus) => {
    setEditedStatus(value);
    setHasUnsavedChanges(true);
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
    <div className='space-y-[12px]'>
      {/* Tools Section Label */}
      <h3 className='px-[20px] text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
        TOOLS
      </h3>

      {/* New Note Button Row with Filter and Sort */}
      <div className='px-[20px] flex gap-[10px] items-center mb-4'>
        <FmCommonButton
          variant='default'
          size='lg'
          onClick={() => setIsModalOpen(true)}
          className='flex-1 justify-center gap-2 border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-white h-12'
        >
          <Plus className='h-5 w-5' />
        </FmCommonButton>

        {/* Filter Button */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <FmCommonButton
              variant='secondary'
              size='sm'
              className='h-12 w-12 p-0 border-white rounded-none hover:border-fm-gold transition-colors'
            >
              <Filter className='h-4 w-4' />
            </FmCommonButton>
          </PopoverTrigger>
          <PopoverContent
            className='w-[320px] bg-card border-border rounded-none p-4'
            align='end'
          >
            <div className='space-y-4'>
              <div>
                <div className='text-xs text-muted-foreground mb-2 block'>
                  Type
                </div>
                <FmMultiCheckboxInput
                  options={typeOptions}
                  selectedValues={filterTypes}
                  onSelectionChange={values =>
                    setFilterTypes(values as NoteType[])
                  }
                />
              </div>

              <Separator className='bg-white/10' />

              <div>
                <div className='text-xs text-muted-foreground mb-2 block'>
                  Status
                </div>
                <FmMultiCheckboxInput
                  options={statusOptions}
                  selectedValues={filterStatuses}
                  onSelectionChange={values =>
                    setFilterStatuses(values as NoteStatus[])
                  }
                />
              </div>

              <Separator className='bg-white/10' />

              <div>
                <div className='text-xs text-muted-foreground mb-2 block'>
                  Author
                </div>
                <FmMultiCheckboxInput
                  options={authorOptions}
                  selectedValues={filterAuthors}
                  onSelectionChange={setFilterAuthors}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Toggle */}
        <FmCommonButton
          variant='secondary'
          size='sm'
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className='h-12 w-12 p-0 border-white rounded-none hover:border-fm-gold transition-colors'
          title={sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
        >
          <ArrowUpDown className='h-4 w-4' />
        </FmCommonButton>
      </div>

      {/* Notes Section Label */}
      <h3 className='px-[20px] text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2'>
        NOTES
      </h3>

      {/* Search Row */}
      <div className='px-[20px] mb-2'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search notes...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-9 bg-muted border-border text-white rounded-none h-10'
          />
        </div>
      </div>

      {/* Sorting Footnote */}
      <div className='px-[20px] text-xs text-muted-foreground mb-2'>
        Sorting by created_at {sortOrder === 'asc' ? 'ascending' : 'descending'}
      </div>

      {/* Divider after sorting footnote */}
      <Separator className='bg-white/10 mb-4' />

      {/* Notes List */}
      <div className='px-[20px]'>
        <ScrollArea className='h-[500px] pr-4'>
          {isLoading ? (
            <div className='text-center py-8 text-muted-foreground'>
              Loading notes...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              {searchQuery ||
              filterTypes.length > 0 ||
              filterStatuses.length > 0 ||
              filterAuthors.length > 0
                ? 'No notes match your filters'
                : 'No notes yet. Create one to get started!'}
            </div>
          ) : (
            <div className='space-y-[2px]'>
              {filteredNotes.map(note => {
                const isFocused = focusedNoteId === note.id;

                return (
                  <DevNoteCard
                    key={note.id}
                    note={note}
                    isFocused={isFocused}
                    canEdit={canEditNote(note) || false}
                    typeConfig={NOTE_TYPE_CONFIG[note.type]}
                    statusConfig={NOTE_STATUS_INDICATOR_CONFIG[note.status]}
                    onFocus={() => setFocusedNoteId(note.id)}
                    onInspect={() => setExpandedNote(note)}
                    onDoubleClick={() => setExpandedNote(note)}
                    onStatusChange={status =>
                      handleUpdateStatus(note.id, status)
                    }
                    onDelete={() => handleDeleteNote(note.id)}
                    formatDate={formatDate}
                    getStatusDisplayName={getStatusDisplayName}
                  />
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
        onNoteCreated={handleLoadNotes}
      />

      {/* Expanded Note Modal */}
      {expandedNote && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
          className='fixed inset-0 bg-black/80 z-[60] flex items-center justify-start pl-4'
          onClick={handleCancelChanges}
        >
          <Card
            className='bg-card border-border rounded-none max-w-5xl w-full ml-0'
            onClick={e => e.stopPropagation()}
          >
            <CardContent className='p-[20px] space-y-[15px]'>
              {/* Header with Type and Status Dropdown */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div
                    className={cn(
                      'w-10 h-10 rounded-none border border-border flex items-center justify-center',
                      NOTE_TYPE_CONFIG[expandedNote.type].color
                    )}
                  >
                    {React.createElement(
                      NOTE_TYPE_CONFIG[expandedNote.type].icon,
                      { className: 'h-5 w-5' }
                    )}
                  </div>
                  <div>
                    <div className='text-sm text-muted-foreground'>
                      {expandedNote.type}
                    </div>
                    {canEditNote(expandedNote) ? (
                      <Select
                        value={editedStatus}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className='h-6 text-xs border-0 bg-transparent hover:bg-muted px-2 py-0 w-auto'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='bg-card border-border rounded-none z-[70]'>
                          <SelectItem value='TODO' className='text-xs'>
                            {getStatusDisplayName('TODO')}
                          </SelectItem>
                          <SelectItem value='IN_PROGRESS' className='text-xs'>
                            {getStatusDisplayName('IN_PROGRESS')}
                          </SelectItem>
                          <SelectItem value='RESOLVED' className='text-xs'>
                            {getStatusDisplayName('RESOLVED')}
                          </SelectItem>
                          <SelectItem value='ARCHIVED' className='text-xs'>
                            {getStatusDisplayName('ARCHIVED')}
                          </SelectItem>
                          <SelectItem value='CANCELLED' className='text-xs'>
                            {getStatusDisplayName('CANCELLED')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className='text-xs text-muted-foreground'>
                        Status:{' '}
                        <span className='text-white'>
                          {getStatusDisplayName(expandedNote.status)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCancelChanges}
                  className='text-muted-foreground hover:text-white'
                >
                  ✕
                </button>
              </div>

              {/* Message - Editable */}
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
              <div
                className={cn(
                  'bg-muted border rounded-none p-[15px] transition-colors',
                  canEditNote(expandedNote) &&
                    'cursor-text hover:border-fm-gold/50',
                  isEditingMessage && 'border-fm-gold'
                )}
                onClick={handleMessageClick}
              >
                {isEditingMessage ? (
                  <textarea
                    ref={textareaRef}
                    value={editedMessage}
                    onChange={e => handleMessageChange(e.target.value)}
                    onKeyDown={handleMessageKeyDown}
                    onBlur={handleMessageBlur}
                    className='w-full bg-transparent text-white text-sm leading-relaxed outline-none resize-none min-h-[100px]'
                    style={{ fontFamily: 'inherit' }}
                  />
                ) : (
                  <p className='text-white text-sm leading-relaxed whitespace-pre-wrap'>
                    {editedMessage}
                  </p>
                )}
              </div>

              {/* Footer with Author and Date */}
              <div className='flex items-center justify-between text-sm'>
                <div>
                  <span className='text-muted-foreground'>Author: </span>
                  <span className='text-fm-gold font-medium'>
                    {expandedNote.author_name}
                  </span>
                </div>
                <div className='text-muted-foreground'>
                  {formatDate(expandedNote.created_at)}
                </div>
              </div>

              {/* Actions - Save/Cancel buttons */}
              {canEditNote(expandedNote) && (
                <div className='flex gap-2 pt-[10px] border-t border-border'>
                  <FmCommonButton
                    variant='default'
                    size='sm'
                    onClick={handleSaveChanges}
                    disabled={!hasUnsavedChanges}
                    className={cn(
                      'flex-1 rounded-none',
                      hasUnsavedChanges
                        ? 'border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-white'
                        : 'border-border text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    Save Changes
                  </FmCommonButton>
                  <FmCommonButton
                    variant='secondary'
                    size='sm'
                    onClick={handleCancelChanges}
                    className='border-border text-white hover:bg-muted rounded-none'
                  >
                    Cancel
                  </FmCommonButton>
                  <FmCommonButton
                    variant='secondary'
                    size='sm'
                    onClick={() => {
                      handleDeleteNote(expandedNote.id);
                      setExpandedNote(null);
                    }}
                    className='border-red-500 text-red-400 hover:bg-red-500/10 rounded-none'
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
