import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, ArrowUpDown, Filter } from 'lucide-react';
import { useAuth } from '@/features/auth/services/AuthContext';
import { CreateDevNoteModal } from './CreateDevNoteModal';
import { DevNoteCard } from './DevNoteCard';
import { useDevNotesFilter } from './hooks/useDevNotesFilter';
import { useDevNotesActions } from './hooks/useDevNotesActions';
import { NOTE_TYPE_CONFIG, NOTE_STATUS_INDICATOR_CONFIG, SORT_FIELD_LABELS, getStatusDisplayName, } from './config/devNotesConfig';
import { Input } from '@/components/common/shadcn/input';
import { Separator } from '@/components/common/shadcn/separator';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/common/shadcn/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/shadcn/select';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmMultiCheckboxInput, } from '@/components/common/forms/FmMultiCheckboxInput';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';
import { cn } from '@/shared';
import * as React from 'react';
export const DevNotesSection = () => {
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
    const [isEditingMessage, setIsEditingMessage] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const textareaRef = useRef(null);
    // Use actions hook for CRUD operations
    const { isLoading, loadNotes, updateStatus, updateMessage, deleteNote } = useDevNotesActions();
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
        { value: 'TODO', label: 'TODO', icon: NOTE_TYPE_CONFIG.TODO.icon },
        { value: 'INFO', label: 'INFO', icon: NOTE_TYPE_CONFIG.INFO.icon },
        { value: 'BUG', label: 'BUG', icon: NOTE_TYPE_CONFIG.BUG.icon },
        {
            value: 'QUESTION',
            label: 'QUESTION',
            icon: NOTE_TYPE_CONFIG.QUESTION.icon,
        },
    ];
    const statusOptions = [
        { value: 'TODO', label: 'TODO' },
        { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
        { value: 'RESOLVED', label: 'RESOLVED' },
        { value: 'ARCHIVED', label: 'ARCHIVED' },
        { value: 'CANCELLED', label: 'CANCELLED' },
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
    return (_jsxs("div", { className: 'space-y-[12px]', children: [_jsx("h3", { className: 'px-[20px] text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2', children: "TOOLS" }), _jsxs("div", { className: 'px-[20px] flex gap-[10px] items-center mb-4', children: [_jsx(FmCommonButton, { variant: 'default', size: 'lg', onClick: () => setIsModalOpen(true), className: 'flex-1 justify-center gap-2 border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-white h-12', children: _jsx(Plus, { className: 'h-5 w-5' }) }), _jsxs(Popover, { open: filterOpen, onOpenChange: setFilterOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', className: 'h-12 w-12 p-0 border-white rounded-none hover:border-fm-gold transition-colors', children: _jsx(Filter, { className: 'h-4 w-4' }) }) }), _jsx(PopoverContent, { className: 'w-[320px] bg-card border-border rounded-none p-0', align: 'end', children: _jsx(ScrollArea, { className: 'max-h-[60vh] p-4', children: _jsxs("div", { className: 'space-y-4', children: [_jsxs("div", { children: [_jsx("div", { className: 'text-xs text-muted-foreground mb-2 block', children: "Type" }), _jsx(FmMultiCheckboxInput, { options: typeOptions, selectedValues: filterTypes, onSelectionChange: values => setFilterTypes(values) })] }), _jsx(Separator, { className: 'bg-white/10' }), _jsxs("div", { children: [_jsx("div", { className: 'text-xs text-muted-foreground mb-2 block', children: "Status" }), _jsx(FmMultiCheckboxInput, { options: statusOptions, selectedValues: filterStatuses, onSelectionChange: values => setFilterStatuses(values) })] }), _jsx(Separator, { className: 'bg-white/10' }), _jsxs("div", { children: [_jsx("div", { className: 'text-xs text-muted-foreground mb-2 block', children: "Author" }), _jsx(FmMultiCheckboxInput, { options: authorOptions, selectedValues: filterAuthors, onSelectionChange: setFilterAuthors })] })] }) }) })] }), _jsxs(Select, { value: sortField, onValueChange: (value) => setSortField(value), children: [_jsx(SelectTrigger, { className: 'h-12 w-[140px] bg-muted border-white rounded-none hover:border-fm-gold transition-colors text-xs', children: _jsx(SelectValue, { placeholder: 'Sort by' }) }), _jsx(SelectContent, { className: 'bg-card border-border rounded-none', children: Object.keys(SORT_FIELD_LABELS).map(field => (_jsx(SelectItem, { value: field, className: 'text-xs', children: SORT_FIELD_LABELS[field] }, field))) })] }), _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', onClick: () => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'), className: 'h-12 w-12 p-0 border-white rounded-none hover:border-fm-gold transition-colors', title: sortOrder === 'asc' ? 'Ascending' : 'Descending', children: _jsx(ArrowUpDown, { className: 'h-4 w-4' }) })] }), _jsx("h3", { className: 'px-[20px] text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2', children: "NOTES" }), _jsx("div", { className: 'px-[20px] mb-2', children: _jsxs("div", { className: 'relative', children: [_jsx(Search, { className: 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' }), _jsx(Input, { placeholder: 'Search notes...', value: searchQuery, onChange: e => setSearchQuery(e.target.value), className: 'pl-9 bg-muted border-border text-white rounded-none h-10' })] }) }), _jsxs("div", { className: 'px-[20px] text-xs text-muted-foreground mb-2', children: ["Sorting by ", SORT_FIELD_LABELS[sortField], " (", sortOrder === 'asc' ? 'ascending' : 'descending', ")"] }), _jsx(Separator, { className: 'bg-white/10 mb-4' }), _jsx("div", { className: 'px-[20px]', children: _jsx(ScrollArea, { className: 'h-[500px] pr-4', children: isLoading ? (_jsx("div", { className: 'text-center py-8 text-muted-foreground', children: "Loading notes..." })) : filteredNotes.length === 0 ? (_jsx("div", { className: 'text-center py-8 text-muted-foreground', children: searchQuery ||
                            filterTypes.length > 0 ||
                            filterStatuses.length > 0 ||
                            filterAuthors.length > 0
                            ? 'No notes match your filters'
                            : 'No notes yet. Create one to get started!' })) : (_jsx("div", { className: 'space-y-[2px]', children: filteredNotes.map(note => {
                            const isFocused = focusedNoteId === note.id;
                            return (_jsx(DevNoteCard, { note: note, isFocused: isFocused, canEdit: canEditNote(note) || false, typeConfig: NOTE_TYPE_CONFIG[note.type], statusConfig: NOTE_STATUS_INDICATOR_CONFIG[note.status], onFocus: () => setFocusedNoteId(note.id), onInspect: () => setExpandedNote(note), onDoubleClick: () => setExpandedNote(note), onStatusChange: status => handleUpdateStatus(note.id, status), onDelete: () => handleDeleteNote(note.id), formatDate: formatDate, getStatusDisplayName: getStatusDisplayName }, note.id));
                        }) })) }) }), _jsx(CreateDevNoteModal, { open: isModalOpen, onOpenChange: setIsModalOpen, onNoteCreated: handleLoadNotes }), expandedNote && (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            _jsx("div", { className: 'fixed inset-0 bg-black/80 z-[60] flex items-center justify-start pl-4', onClick: handleCancelChanges, children: _jsx(Card, { className: 'bg-card border-border rounded-none max-w-5xl w-full ml-0', onClick: e => e.stopPropagation(), children: _jsxs(CardContent, { className: 'p-[20px] space-y-[15px]', children: [_jsxs("div", { className: 'flex items-center justify-between', children: [_jsxs("div", { className: 'flex items-center gap-3', children: [_jsx("div", { className: cn('w-10 h-10 rounded-none border border-border flex items-center justify-center', NOTE_TYPE_CONFIG[expandedNote.type].color), children: React.createElement(NOTE_TYPE_CONFIG[expandedNote.type].icon, { className: 'h-5 w-5' }) }), _jsxs("div", { children: [_jsx("div", { className: 'text-sm text-muted-foreground', children: expandedNote.type }), canEditNote(expandedNote) ? (_jsxs(Select, { value: editedStatus, onValueChange: handleStatusChange, children: [_jsx(SelectTrigger, { className: 'h-6 text-xs border-0 bg-transparent hover:bg-muted px-2 py-0 w-auto', children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { className: 'bg-card border-border rounded-none z-[70]', children: [_jsx(SelectItem, { value: 'TODO', className: 'text-xs', children: getStatusDisplayName('TODO') }), _jsx(SelectItem, { value: 'IN_PROGRESS', className: 'text-xs', children: getStatusDisplayName('IN_PROGRESS') }), _jsx(SelectItem, { value: 'RESOLVED', className: 'text-xs', children: getStatusDisplayName('RESOLVED') }), _jsx(SelectItem, { value: 'ARCHIVED', className: 'text-xs', children: getStatusDisplayName('ARCHIVED') }), _jsx(SelectItem, { value: 'CANCELLED', className: 'text-xs', children: getStatusDisplayName('CANCELLED') })] })] })) : (_jsxs("div", { className: 'text-xs text-muted-foreground', children: ["Status:", ' ', _jsx("span", { className: 'text-white', children: getStatusDisplayName(expandedNote.status) })] }))] })] }), _jsx("button", { onClick: handleCancelChanges, className: 'text-muted-foreground hover:text-white', children: "\u2715" })] }), _jsx("div", { className: cn('bg-muted border rounded-none p-[15px] transition-colors', canEditNote(expandedNote) &&
                                    'cursor-text hover:border-fm-gold/50', isEditingMessage && 'border-fm-gold'), onClick: handleMessageClick, children: isEditingMessage ? (_jsx("textarea", { ref: textareaRef, value: editedMessage, onChange: e => handleMessageChange(e.target.value), onKeyDown: handleMessageKeyDown, onBlur: handleMessageBlur, className: 'w-full bg-transparent text-white text-sm leading-relaxed outline-none resize-none min-h-[100px]', style: { fontFamily: 'inherit' } })) : (_jsx("p", { className: 'text-white text-sm leading-relaxed whitespace-pre-wrap', children: editedMessage })) }), _jsxs("div", { className: 'flex items-center justify-between text-sm', children: [_jsxs("div", { children: [_jsx("span", { className: 'text-muted-foreground', children: "Author: " }), _jsx("span", { className: 'text-fm-gold font-medium', children: expandedNote.author_name })] }), _jsx("div", { className: 'text-muted-foreground', children: formatDate(expandedNote.created_at) })] }), canEditNote(expandedNote) && (_jsxs("div", { className: 'flex gap-2 pt-[10px] border-t border-border', children: [_jsx(FmCommonButton, { variant: 'default', size: 'sm', onClick: handleSaveChanges, disabled: !hasUnsavedChanges, className: cn('flex-1 rounded-none', hasUnsavedChanges
                                            ? 'border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-white'
                                            : 'border-border text-muted-foreground cursor-not-allowed'), children: "Save Changes" }), _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', onClick: handleCancelChanges, className: 'border-border text-white hover:bg-muted rounded-none', children: "Cancel" }), _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', onClick: () => {
                                            handleDeleteNote(expandedNote.id);
                                            setExpandedNote(null);
                                        }, className: 'border-red-500 text-red-400 hover:bg-red-500/10 rounded-none', children: "Delete" })] }))] }) }) }))] }));
};
