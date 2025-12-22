import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, ArrowUpDown, Filter, X } from 'lucide-react';
import { useAuth } from '@/features/auth/services/AuthContext';
import { CreateDevNoteModal } from './CreateDevNoteModal';
import { DevNoteCard } from './DevNoteCard';
import { useDevNotesFilter } from './hooks/useDevNotesFilter';
import { useDevNotesActions } from './hooks/useDevNotesActions';
import { NOTE_TYPE_CONFIG, NOTE_STATUS_INDICATOR_CONFIG, SORT_FIELD_LABELS, PRIORITY_CONFIG, getStatusDisplayName, getTypeDisplayName, getPriorityDisplayName, } from './config/devNotesConfig';
import { Input } from '@/components/common/shadcn/input';
import { Separator } from '@/components/common/shadcn/separator';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/common/shadcn/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/shadcn/select';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmMultiCheckboxInput, } from '@/components/common/forms/FmMultiCheckboxInput';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';
import { cn } from '@/shared';
import * as React from 'react';
export const DevNotesSection = () => {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const [notes, setNotes] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedNote, setExpandedNote] = useState(null);
    const [focusedNoteId, setFocusedNoteId] = useState(null);
    const [sortField, setSortField] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filterOpen, setFilterOpen] = useState(false);
    // Editing state for expanded note
    const [editedMessage, setEditedMessage] = useState('');
    const [editedStatus, setEditedStatus] = useState('TODO');
    const [editedType, setEditedType] = useState('TODO');
    const [editedPriority, setEditedPriority] = useState(3);
    const [isEditingMessage, setIsEditingMessage] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const textareaRef = useRef(null);
    // Use actions hook for CRUD operations
    const { isLoading, loadNotes, updateStatus, updateType, updatePriority, updateMessage, deleteNote } = useDevNotesActions();
    // Use filter hook
    const { searchQuery, setSearchQuery, filterTypes, setFilterTypes, filterStatuses, setFilterStatuses, filterAuthors, setFilterAuthors, filteredNotes, uniqueAuthors, } = useDevNotesFilter({ notes, sortField, sortOrder });
    const handleLoadNotes = useCallback(async () => {
        const data = await loadNotes(sortOrder);
        setNotes(data);
    }, [sortOrder]); // Removed loadNotes from deps - it's stable from the hook
    useEffect(() => {
        handleLoadNotes();
    }, [handleLoadNotes]);
    // Filter options for multi-checkbox inputs
    const typeOptions = [
        { value: 'TODO', label: t('devNotes.types.todo'), icon: NOTE_TYPE_CONFIG.TODO.icon },
        { value: 'INFO', label: t('devNotes.types.info'), icon: NOTE_TYPE_CONFIG.INFO.icon },
        { value: 'BUG', label: t('devNotes.types.bug'), icon: NOTE_TYPE_CONFIG.BUG.icon },
        {
            value: 'QUESTION',
            label: t('devNotes.types.question'),
            icon: NOTE_TYPE_CONFIG.QUESTION.icon,
        },
    ];
    const statusOptions = [
        { value: 'TODO', label: t('devNotes.statuses.todo') },
        { value: 'IN_PROGRESS', label: t('devNotes.statuses.inProgress') },
        { value: 'RESOLVED', label: t('devNotes.statuses.resolved') },
        { value: 'ARCHIVED', label: t('devNotes.statuses.archived') },
        { value: 'CANCELLED', label: t('devNotes.statuses.cancelled') },
    ];
    const authorOptions = uniqueAuthors.map(author => ({
        value: author,
        label: author,
    }));
    const handleUpdateStatus = async (noteId, newStatus) => {
        await updateStatus(noteId, newStatus);
        handleLoadNotes();
    };
    const handleDeleteNote = async (noteId) => {
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
        if (!expandedNote || !hasUnsavedChanges)
            return;
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
    const handleMessageChange = (value) => {
        setEditedMessage(value);
        setHasUnsavedChanges(true);
    };
    const handleMessageKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            setIsEditingMessage(false);
        }
    };
    const handleMessageBlur = () => {
        setIsEditingMessage(false);
    };
    const handleStatusChange = (value) => {
        setEditedStatus(value);
        setHasUnsavedChanges(true);
    };
    const handleTypeChange = (value) => {
        setEditedType(value);
        setHasUnsavedChanges(true);
    };
    const handlePriorityChange = (value) => {
        setEditedPriority(value);
        setHasUnsavedChanges(true);
    };
    // Keyboard shortcut for CTRL+Enter to save and close
    useEffect(() => {
        if (!expandedNote)
            return;
        const handleKeyDown = (e) => {
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
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const month = (date.getMonth() + 1).toString();
        const day = date.getDate().toString();
        const year = date.getFullYear().toString().slice(-2);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${month}/${day}/${year} ${hours}:${minutes}`;
    };
    const canEditNote = (note) => {
        return user && note.author_id === user.id;
    };
    return (_jsxs("div", { className: 'space-y-3', children: [_jsxs("div", { className: 'flex gap-2 items-center', children: [_jsxs("div", { className: 'relative flex-1', children: [_jsx(Search, { className: 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' }), _jsx(Input, { placeholder: t('devNotes.searchPlaceholder'), value: searchQuery, onChange: e => setSearchQuery(e.target.value), className: 'pl-9 bg-muted border-border text-white rounded-none h-9' })] }), _jsx(FmCommonButton, { variant: 'default', size: 'sm', onClick: () => setIsModalOpen(true), className: 'h-9 w-9 p-0 border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-white', title: t('devNotes.newNote'), children: _jsx(Plus, { className: 'h-4 w-4' }) })] }), _jsxs("div", { className: 'flex gap-2 items-center', children: [_jsxs(Popover, { open: filterOpen, onOpenChange: setFilterOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(FmCommonButton, { variant: 'secondary', size: 'sm', className: 'h-8 px-3 border-white/20 rounded-none hover:border-fm-gold transition-colors text-xs gap-1', children: [_jsx(Filter, { className: 'h-3 w-3' }), t('devNotes.filter')] }) }), _jsx(PopoverContent, { className: 'w-[280px] bg-card border-border rounded-none p-0', align: 'start', children: _jsx(ScrollArea, { className: 'max-h-[50vh] p-3', children: _jsxs("div", { className: 'space-y-3', children: [_jsxs("div", { children: [_jsx("div", { className: 'text-xs text-muted-foreground mb-1.5 block', children: t('devNotes.filterLabels.type') }), _jsx(FmMultiCheckboxInput, { options: typeOptions, selectedValues: filterTypes, onSelectionChange: values => setFilterTypes(values) })] }), _jsx(Separator, { className: 'bg-white/10' }), _jsxs("div", { children: [_jsx("div", { className: 'text-xs text-muted-foreground mb-1.5 block', children: t('devNotes.filterLabels.status') }), _jsx(FmMultiCheckboxInput, { options: statusOptions, selectedValues: filterStatuses, onSelectionChange: values => setFilterStatuses(values) })] }), _jsx(Separator, { className: 'bg-white/10' }), _jsxs("div", { children: [_jsx("div", { className: 'text-xs text-muted-foreground mb-1.5 block', children: t('devNotes.filterLabels.author') }), _jsx(FmMultiCheckboxInput, { options: authorOptions, selectedValues: filterAuthors, onSelectionChange: setFilterAuthors })] })] }) }) })] }), _jsxs(Select, { value: sortField, onValueChange: (value) => setSortField(value), children: [_jsx(SelectTrigger, { className: 'h-8 w-[110px] bg-muted border-white/20 rounded-none hover:border-fm-gold transition-colors text-xs', children: _jsx(SelectValue, { placeholder: t('devNotes.sortBy') }) }), _jsx(SelectContent, { className: 'bg-card border-border rounded-none', children: Object.keys(SORT_FIELD_LABELS).map(field => (_jsx(SelectItem, { value: field, className: 'text-xs', children: SORT_FIELD_LABELS[field] }, field))) })] }), _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', onClick: () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'), className: 'h-8 w-8 p-0 border-white/20 rounded-none hover:border-fm-gold transition-colors', title: sortOrder === 'asc' ? t('devNotes.ascending') : t('devNotes.descending'), children: _jsx(ArrowUpDown, { className: 'h-3 w-3' }) }), _jsx("div", { className: 'flex-1' }), _jsx("span", { className: 'text-xs text-muted-foreground', children: t('devNotes.notesCount', { count: filteredNotes.length }) })] }), _jsx(Separator, { className: 'bg-white/10' }), _jsx("div", { children: _jsx(ScrollArea, { className: 'h-[calc(100vh-280px)] min-h-[300px] pr-2', children: isLoading ? (_jsx("div", { className: 'text-center py-8 text-muted-foreground', children: t('devNotes.loading') })) : filteredNotes.length === 0 ? (_jsx("div", { className: 'text-center py-8 text-muted-foreground', children: searchQuery ||
                            filterTypes.length > 0 ||
                            filterStatuses.length > 0 ||
                            filterAuthors.length > 0
                            ? t('devNotes.noMatchingNotes')
                            : t('devNotes.noNotesYet') })) : (_jsx("div", { className: 'space-y-[2px]', children: filteredNotes.map(note => {
                            const isFocused = focusedNoteId === note.id;
                            return (_jsx(DevNoteCard, { note: note, isFocused: isFocused, canEdit: canEditNote(note) || false, typeConfig: NOTE_TYPE_CONFIG[note.type], statusConfig: NOTE_STATUS_INDICATOR_CONFIG[note.status], onFocus: () => setFocusedNoteId(note.id), onInspect: () => setExpandedNote(note), onDoubleClick: () => setExpandedNote(note), onStatusChange: status => handleUpdateStatus(note.id, status), onDelete: () => handleDeleteNote(note.id), formatDate: formatDate, getStatusDisplayName: getStatusDisplayName }, note.id));
                        }) })) }) }), _jsx(CreateDevNoteModal, { open: isModalOpen, onOpenChange: setIsModalOpen, onNoteCreated: handleLoadNotes }), expandedNote && (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            _jsx("div", { className: 'fixed inset-0 bg-black/95 z-[60] flex flex-col', onClick: handleCancelChanges, children: _jsxs("div", { className: 'flex-1 flex flex-col w-full h-full', onClick: e => e.stopPropagation(), children: [_jsxs("div", { className: 'flex items-center justify-between p-[20px] border-b border-border bg-card/50', children: [_jsxs("div", { className: 'flex items-center gap-4', children: [_jsx("div", { className: cn('w-12 h-12 rounded-none border border-border flex items-center justify-center', NOTE_TYPE_CONFIG[editedType].color), children: React.createElement(NOTE_TYPE_CONFIG[editedType].icon, { className: 'h-6 w-6' }) }), _jsxs("div", { className: 'flex flex-col gap-1', children: [canEditNote(expandedNote) ? (_jsxs(Select, { value: editedType, onValueChange: (value) => handleTypeChange(value), children: [_jsx(SelectTrigger, { className: 'h-7 text-sm border-0 bg-transparent hover:bg-muted px-2 py-0 w-auto font-medium', children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { className: 'bg-card border-border rounded-none z-[70]', children: [_jsx(SelectItem, { value: 'BUG', className: 'text-sm', children: getTypeDisplayName('BUG') }), _jsx(SelectItem, { value: 'TODO', className: 'text-sm', children: getTypeDisplayName('TODO') }), _jsx(SelectItem, { value: 'QUESTION', className: 'text-sm', children: getTypeDisplayName('QUESTION') }), _jsx(SelectItem, { value: 'INFO', className: 'text-sm', children: getTypeDisplayName('INFO') })] })] })) : (_jsx("div", { className: 'text-sm font-medium text-white px-2', children: getTypeDisplayName(expandedNote.type) })), canEditNote(expandedNote) ? (_jsxs(Select, { value: editedStatus, onValueChange: handleStatusChange, children: [_jsx(SelectTrigger, { className: 'h-6 text-xs border-0 bg-transparent hover:bg-muted px-2 py-0 w-auto text-muted-foreground', children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { className: 'bg-card border-border rounded-none z-[70]', children: [_jsx(SelectItem, { value: 'TODO', className: 'text-xs', children: getStatusDisplayName('TODO') }), _jsx(SelectItem, { value: 'IN_PROGRESS', className: 'text-xs', children: getStatusDisplayName('IN_PROGRESS') }), _jsx(SelectItem, { value: 'RESOLVED', className: 'text-xs', children: getStatusDisplayName('RESOLVED') }), _jsx(SelectItem, { value: 'ARCHIVED', className: 'text-xs', children: getStatusDisplayName('ARCHIVED') }), _jsx(SelectItem, { value: 'CANCELLED', className: 'text-xs', children: getStatusDisplayName('CANCELLED') })] })] })) : (_jsx("div", { className: 'text-xs text-muted-foreground px-2', children: getStatusDisplayName(expandedNote.status) }))] }), _jsxs("div", { className: 'flex items-center gap-2 ml-4 pl-4 border-l border-border', children: [_jsxs("span", { className: 'text-xs text-muted-foreground', children: [t('devNotes.priority'), ":"] }), canEditNote(expandedNote) ? (_jsxs(Select, { value: editedPriority.toString(), onValueChange: (value) => handlePriorityChange(parseInt(value, 10)), children: [_jsx(SelectTrigger, { className: cn('h-6 text-xs border-0 bg-transparent hover:bg-muted px-2 py-0 w-auto font-medium', PRIORITY_CONFIG[editedPriority]?.color), children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { className: 'bg-card border-border rounded-none z-[70]', children: Object.entries(PRIORITY_CONFIG).map(([value, config]) => (_jsx(SelectItem, { value: value, className: cn('text-xs', config.color), children: config.label }, value))) })] })) : (_jsx("span", { className: cn('text-xs font-medium', PRIORITY_CONFIG[expandedNote.priority || 3]?.color), children: getPriorityDisplayName(expandedNote.priority || 3) }))] })] }), _jsx("button", { onClick: handleCancelChanges, className: 'p-2 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors', children: _jsx(X, { className: 'h-5 w-5' }) })] }), _jsx("div", { className: cn('flex-1 p-[20px] transition-colors overflow-auto', canEditNote(expandedNote) && 'cursor-text'), onClick: handleMessageClick, children: isEditingMessage ? (_jsx("textarea", { ref: textareaRef, value: editedMessage, onChange: e => handleMessageChange(e.target.value), onKeyDown: handleMessageKeyDown, onBlur: handleMessageBlur, className: 'w-full h-full bg-transparent text-white text-base leading-relaxed outline-none resize-none', style: { fontFamily: 'inherit' } })) : (_jsx("p", { className: 'text-white text-base leading-relaxed whitespace-pre-wrap', children: editedMessage || _jsx("span", { className: 'text-muted-foreground italic', children: t('devNotes.clickToEdit') }) })) }), _jsx("div", { className: 'p-[20px] border-t border-border bg-card/50', children: _jsxs("div", { className: 'flex items-center justify-between', children: [_jsxs("div", { className: 'flex items-center gap-4 text-sm', children: [_jsxs("div", { children: [_jsxs("span", { className: 'text-muted-foreground', children: [t('devNotes.author'), ": "] }), _jsx("span", { className: 'text-fm-gold font-medium', children: expandedNote.author_name })] }), _jsx("div", { className: 'text-muted-foreground', children: formatDate(expandedNote.created_at) })] }), canEditNote(expandedNote) && (_jsxs("div", { className: 'flex items-center gap-2', children: [_jsxs("div", { className: 'text-[10px] text-muted-foreground mr-2', children: [_jsx("kbd", { className: 'px-1 py-0.5 bg-white/10 rounded text-[9px]', children: "Ctrl" }), ' + ', _jsx("kbd", { className: 'px-1 py-0.5 bg-white/10 rounded text-[9px]', children: "Enter" }), ' ', t('devNotes.toSave')] }), _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', onClick: () => {
                                                    handleDeleteNote(expandedNote.id);
                                                    setExpandedNote(null);
                                                }, className: 'border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-none', children: t('actions.delete') }), _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', onClick: handleCancelChanges, className: 'border-border text-white hover:bg-muted rounded-none', children: t('actions.cancel') }), _jsx(FmCommonButton, { variant: 'default', size: 'sm', onClick: handleSaveChanges, disabled: !hasUnsavedChanges, className: cn('rounded-none min-w-[100px]', hasUnsavedChanges
                                                    ? 'border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-white'
                                                    : 'border-border text-muted-foreground cursor-not-allowed'), children: t('actions.save') })] }))] }) })] }) }))] }));
};
