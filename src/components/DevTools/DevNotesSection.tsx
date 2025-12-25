import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, ArrowUpDown, Filter, X } from 'lucide-react';
import { useAuth } from '@/features/auth/services/AuthContext';
import { CreateDevNoteModal } from './CreateDevNoteModal';
import { DevNoteCard } from './DevNoteCard';
import { useDevNotesFilter } from './hooks/useDevNotesFilter';
import { useDevNotesActions } from './hooks/useDevNotesActions';
import {
  NOTE_TYPE_CONFIG,
  NOTE_STATUS_INDICATOR_CONFIG,
  SORT_FIELD_LABELS,
  PRIORITY_CONFIG,
  getStatusDisplayName,
  getTypeDisplayName,
  getPriorityDisplayName,
  type NoteType,
  type NoteStatus,
  type SortField,
} from './config/devNotesConfig';
import { Input } from '@/components/common/shadcn/input';
import { Separator } from '@/components/common/shadcn/separator';
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
import { cn, useModalState } from '@/shared';
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
  priority: number;
}

export const DevNotesSection = () => {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const [notes, setNotes] = useState<DevNote[]>([]);
  const createModal = useModalState();
  const [expandedNote, setExpandedNote] = useState<DevNote | null>(null);
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterOpen, setFilterOpen] = useState(false);

  // Editing state for expanded note
  const [editedMessage, setEditedMessage] = useState('');
  const [editedStatus, setEditedStatus] = useState<NoteStatus>('TODO');
  const [editedType, setEditedType] = useState<NoteType>('TODO');
  const [editedPriority, setEditedPriority] = useState<number>(3);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use actions hook for CRUD operations
  const { isLoading, loadNotes, updateStatus, updateType, updatePriority, updateMessage, deleteNote } =
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
  } = useDevNotesFilter({ notes, sortField, sortOrder });

  const handleLoadNotes = useCallback(async () => {
    const data = await loadNotes(sortOrder);
    setNotes(data);
  }, [sortOrder]); // Removed loadNotes from deps - it's stable from the hook

  useEffect(() => {
    handleLoadNotes();
  }, [handleLoadNotes]);

  // Filter options for multi-checkbox inputs
  const typeOptions: FmMultiCheckboxOption[] = [
    { value: 'TODO', label: t('devNotes.types.todo'), icon: NOTE_TYPE_CONFIG.TODO.icon },
    { value: 'INFO', label: t('devNotes.types.info'), icon: NOTE_TYPE_CONFIG.INFO.icon },
    { value: 'BUG', label: t('devNotes.types.bug'), icon: NOTE_TYPE_CONFIG.BUG.icon },
    {
      value: 'QUESTION',
      label: t('devNotes.types.question'),
      icon: NOTE_TYPE_CONFIG.QUESTION.icon,
    },
  ];

  const statusOptions: FmMultiCheckboxOption[] = [
    { value: 'TODO', label: t('devNotes.statuses.todo') },
    { value: 'IN_PROGRESS', label: t('devNotes.statuses.inProgress') },
    { value: 'RESOLVED', label: t('devNotes.statuses.resolved') },
    { value: 'ARCHIVED', label: t('devNotes.statuses.archived') },
    { value: 'CANCELLED', label: t('devNotes.statuses.cancelled') },
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
      setEditedType(expandedNote.type);
      setEditedPriority(expandedNote.priority || 3);
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

    if (editedType !== expandedNote.type) {
      promises.push(updateType(expandedNote.id, editedType));
    }

    if (editedPriority !== expandedNote.priority) {
      promises.push(updatePriority(expandedNote.id, editedPriority));
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

  const handleTypeChange = (value: NoteType) => {
    setEditedType(value);
    setHasUnsavedChanges(true);
  };

  const handlePriorityChange = (value: number) => {
    setEditedPriority(value);
    setHasUnsavedChanges(true);
  };

  // Keyboard shortcut for CTRL+Enter to save and close
  useEffect(() => {
    if (!expandedNote) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (hasUnsavedChanges) {
          handleSaveChanges();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedNote, hasUnsavedChanges]);

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
    <div className='space-y-3'>
      {/* Search Row with New Note Button */}
      <div className='flex gap-2 items-center'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder={t('devNotes.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-9 bg-muted border-border text-white rounded-none h-9'
          />
        </div>
        <FmCommonButton
          variant='default'
          size='sm'
          onClick={createModal.open}
          className='h-9 w-9 p-0 border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-white'
          title={t('devNotes.newNote')}
        >
          <Plus className='h-4 w-4' />
        </FmCommonButton>
      </div>

      {/* Filter and Sort Row */}
      <div className='flex gap-2 items-center'>
        {/* Filter Button */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <FmCommonButton
              variant='secondary'
              size='sm'
              className='h-8 px-3 border-white/20 rounded-none hover:border-fm-gold transition-colors text-xs gap-1'
            >
              <Filter className='h-3 w-3' />
              {t('devNotes.filter')}
            </FmCommonButton>
          </PopoverTrigger>
          <PopoverContent
            className='w-[280px] bg-card border-border rounded-none p-0'
            align='start'
          >
            <ScrollArea className='max-h-[50vh] p-3'>
              <div className='space-y-3'>
                <div>
                  <div className='text-xs text-muted-foreground mb-1.5 block'>
                    {t('devNotes.filterLabels.type')}
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
                  <div className='text-xs text-muted-foreground mb-1.5 block'>
                    {t('devNotes.filterLabels.status')}
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
                  <div className='text-xs text-muted-foreground mb-1.5 block'>
                    {t('devNotes.filterLabels.author')}
                  </div>
                  <FmMultiCheckboxInput
                    options={authorOptions}
                    selectedValues={filterAuthors}
                    onSelectionChange={setFilterAuthors}
                  />
                </div>
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Sort Field Dropdown */}
        <Select
          value={sortField}
          onValueChange={(value: SortField) => setSortField(value)}
        >
          <SelectTrigger className='h-8 w-[110px] bg-muted border-white/20 rounded-none hover:border-fm-gold transition-colors text-xs'>
            <SelectValue placeholder={t('devNotes.sortBy')} />
          </SelectTrigger>
          <SelectContent className='bg-card border-border rounded-none'>
            {(Object.keys(SORT_FIELD_LABELS) as SortField[]).map(field => (
              <SelectItem key={field} value={field} className='text-xs'>
                {SORT_FIELD_LABELS[field]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Order Toggle */}
        <FmCommonButton
          variant='secondary'
          size='sm'
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className='h-8 w-8 p-0 border-white/20 rounded-none hover:border-fm-gold transition-colors'
          title={sortOrder === 'asc' ? t('devNotes.ascending') : t('devNotes.descending')}
        >
          <ArrowUpDown className='h-3 w-3' />
        </FmCommonButton>

        {/* Spacer */}
        <div className='flex-1' />

        {/* Count */}
        <span className='text-xs text-muted-foreground'>
          {t('devNotes.notesCount', { count: filteredNotes.length })}
        </span>
      </div>

      {/* Divider */}
      <Separator className='bg-white/10' />

      {/* Notes List */}
      <div>
        <ScrollArea className='h-[calc(100vh-280px)] min-h-[300px] pr-2'>
          {isLoading ? (
            <div className='text-center py-8 text-muted-foreground'>
              {t('devNotes.loading')}
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              {searchQuery ||
              filterTypes.length > 0 ||
              filterStatuses.length > 0 ||
              filterAuthors.length > 0
                ? t('devNotes.noMatchingNotes')
                : t('devNotes.noNotesYet')}
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
        open={createModal.isOpen}
        onOpenChange={createModal.setOpen}
        onNoteCreated={handleLoadNotes}
      />

      {/* Expanded Note Modal - Full Screen */}
      {expandedNote && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
          className='fixed inset-0 bg-black/95 z-[60] flex flex-col'
          onClick={handleCancelChanges}
        >
          {/* Full screen container */}
          <div
            className='flex-1 flex flex-col w-full h-full'
            onClick={e => e.stopPropagation()}
          >
            {/* Header with Type and Status Dropdowns */}
            <div className='flex items-center justify-between p-[20px] border-b border-border bg-card/50'>
              <div className='flex items-center gap-4'>
                {/* Type Icon */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-none border border-border flex items-center justify-center',
                    NOTE_TYPE_CONFIG[editedType].color
                  )}
                >
                  {React.createElement(
                    NOTE_TYPE_CONFIG[editedType].icon,
                    { className: 'h-6 w-6' }
                  )}
                </div>

                {/* Type and Status Dropdowns */}
                <div className='flex flex-col gap-1'>
                  {canEditNote(expandedNote) ? (
                    <Select
                      value={editedType}
                      onValueChange={(value: NoteType) => handleTypeChange(value)}
                    >
                      <SelectTrigger className='h-7 text-sm border-0 bg-transparent hover:bg-muted px-2 py-0 w-auto font-medium'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='bg-card border-border rounded-none z-[70]'>
                        <SelectItem value='BUG' className='text-sm'>
                          {getTypeDisplayName('BUG')}
                        </SelectItem>
                        <SelectItem value='TODO' className='text-sm'>
                          {getTypeDisplayName('TODO')}
                        </SelectItem>
                        <SelectItem value='QUESTION' className='text-sm'>
                          {getTypeDisplayName('QUESTION')}
                        </SelectItem>
                        <SelectItem value='INFO' className='text-sm'>
                          {getTypeDisplayName('INFO')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className='text-sm font-medium text-white px-2'>
                      {getTypeDisplayName(expandedNote.type)}
                    </div>
                  )}

                  {canEditNote(expandedNote) ? (
                    <Select
                      value={editedStatus}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className='h-6 text-xs border-0 bg-transparent hover:bg-muted px-2 py-0 w-auto text-muted-foreground'>
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
                    <div className='text-xs text-muted-foreground px-2'>
                      {getStatusDisplayName(expandedNote.status)}
                    </div>
                  )}
                </div>

                {/* Priority Dropdown */}
                <div className='flex items-center gap-2 ml-4 pl-4 border-l border-border'>
                  <span className='text-xs text-muted-foreground'>{t('devNotes.priority')}:</span>
                  {canEditNote(expandedNote) ? (
                    <Select
                      value={editedPriority.toString()}
                      onValueChange={(value) => handlePriorityChange(parseInt(value, 10))}
                    >
                      <SelectTrigger className={cn(
                        'h-6 text-xs border-0 bg-transparent hover:bg-muted px-2 py-0 w-auto font-medium',
                        PRIORITY_CONFIG[editedPriority]?.color
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='bg-card border-border rounded-none z-[70]'>
                        {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                          <SelectItem
                            key={value}
                            value={value}
                            className={cn('text-xs', config.color)}
                          >
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={cn('text-xs font-medium', PRIORITY_CONFIG[expandedNote.priority || 3]?.color)}>
                      {getPriorityDisplayName(expandedNote.priority || 3)}
                    </span>
                  )}
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleCancelChanges}
                className='p-2 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            {/* Message - Editable (takes remaining space) */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
              className={cn(
                'flex-1 p-[20px] transition-colors overflow-auto',
                canEditNote(expandedNote) && 'cursor-text'
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
                  className='w-full h-full bg-transparent text-white text-base leading-relaxed outline-none resize-none'
                  style={{ fontFamily: 'inherit' }}
                />
              ) : (
                <p className='text-white text-base leading-relaxed whitespace-pre-wrap'>
                  {editedMessage || <span className='text-muted-foreground italic'>{t('devNotes.clickToEdit')}</span>}
                </p>
              )}
            </div>

            {/* Footer with Author, Date, and Actions */}
            <div className='p-[20px] border-t border-border bg-card/50'>
              <div className='flex items-center justify-between'>
                {/* Author and Date */}
                <div className='flex items-center gap-4 text-sm'>
                  <div>
                    <span className='text-muted-foreground'>{t('devNotes.author')}: </span>
                    <span className='text-fm-gold font-medium'>
                      {expandedNote.author_name}
                    </span>
                  </div>
                  <div className='text-muted-foreground'>
                    {formatDate(expandedNote.created_at)}
                  </div>
                </div>

                {/* Action Buttons */}
                {canEditNote(expandedNote) && (
                  <div className='flex items-center gap-2'>
                    {/* Keyboard shortcut hint */}
                    <div className='text-[10px] text-muted-foreground mr-2'>
                      <kbd className='px-1 py-0.5 bg-white/10 rounded text-[9px]'>Ctrl</kbd>
                      {' + '}
                      <kbd className='px-1 py-0.5 bg-white/10 rounded text-[9px]'>Enter</kbd>
                      {' '}{t('devNotes.toSave')}
                    </div>
                    <FmCommonButton
                      variant='secondary'
                      size='sm'
                      onClick={() => {
                        handleDeleteNote(expandedNote.id);
                        setExpandedNote(null);
                      }}
                      className='border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-none'
                    >
                      {t('actions.delete')}
                    </FmCommonButton>
                    <FmCommonButton
                      variant='secondary'
                      size='sm'
                      onClick={handleCancelChanges}
                      className='border-border text-white hover:bg-muted rounded-none'
                    >
                      {t('actions.cancel')}
                    </FmCommonButton>
                    <FmCommonButton
                      variant='default'
                      size='sm'
                      onClick={handleSaveChanges}
                      disabled={!hasUnsavedChanges}
                      className={cn(
                        'rounded-none min-w-[100px]',
                        hasUnsavedChanges
                          ? 'border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-white'
                          : 'border-border text-muted-foreground cursor-not-allowed'
                      )}
                    >
                      {t('actions.save')}
                    </FmCommonButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
