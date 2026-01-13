import { CheckCircle2, Info, Bug, HelpCircle } from 'lucide-react';
import type { JSONContent } from '@tiptap/react';

export type NoteType = 'TODO' | 'INFO' | 'BUG' | 'QUESTION';
export type NoteStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'ARCHIVED'
  | 'CANCELLED';

export type SortField = 'created_at' | 'type' | 'status' | 'priority';

/**
 * DevNote interface with title and rich text content support
 */
export interface DevNote {
  id: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name: string;
  /** Legacy plain text message (kept for backward compatibility) */
  message: string;
  /** Optional note title */
  title: string | null;
  /** Rich text content in TipTap JSON format */
  content: JSONContent | null;
  type: NoteType;
  status: NoteStatus;
  priority: number;
}

/**
 * Configuration for note types with their associated icons and colors
 */
export const NOTE_TYPE_CONFIG: Record<
  NoteType,
  { icon: any; color: string; borderColor: string; priority: number }
> = {
  BUG: {
    icon: Bug,
    color: 'bg-red-500/10 text-red-400',
    borderColor: 'border-l-red-500 border-t-red-500',
    priority: 1, // Highest priority
  },
  TODO: {
    icon: CheckCircle2,
    color: 'bg-blue-500/10 text-blue-400',
    borderColor: 'border-l-blue-500 border-t-blue-500',
    priority: 2,
  },
  QUESTION: {
    icon: HelpCircle,
    color: 'bg-purple-500/10 text-purple-400',
    borderColor: 'border-l-purple-500 border-t-purple-500',
    priority: 3,
  },
  INFO: {
    icon: Info,
    color: 'bg-cyan-500/10 text-cyan-400',
    borderColor: 'border-l-cyan-500 border-t-cyan-500',
    priority: 4, // Lowest priority
  },
};

/**
 * Configuration for note status indicators (colored dots)
 */
export const NOTE_STATUS_INDICATOR_CONFIG: Record<
  NoteStatus,
  { color: string; label: string; priority: number }
> = {
  IN_PROGRESS: {
    color: 'bg-yellow-400',
    label: 'In Progress',
    priority: 1, // Highest - actively being worked on
  },
  TODO: {
    color: 'bg-gray-400',
    label: 'To Do',
    priority: 2,
  },
  RESOLVED: {
    color: 'bg-green-400',
    label: 'Resolved',
    priority: 3,
  },
  ARCHIVED: {
    color: 'bg-blue-400',
    label: 'Archived',
    priority: 4,
  },
  CANCELLED: {
    color: 'bg-red-400',
    label: 'Cancelled',
    priority: 5, // Lowest
  },
};

/**
 * Sort field display names
 */
export const SORT_FIELD_LABELS: Record<SortField, string> = {
  created_at: 'Date',
  priority: 'Priority',
  type: 'Type',
  status: 'Status',
};

/**
 * Priority level configuration
 */
export const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'Urgent', color: 'text-red-400' },
  2: { label: 'High', color: 'text-orange-400' },
  3: { label: 'Medium', color: 'text-yellow-400' },
  4: { label: 'Low', color: 'text-blue-400' },
  5: { label: 'Lowest', color: 'text-gray-400' },
};

/**
 * Get priority display name
 */
export const getPriorityDisplayName = (priority: number): string => {
  return PRIORITY_CONFIG[priority]?.label || 'Medium';
};

/**
 * Get user-friendly display name for a status
 */
export const getStatusDisplayName = (status: NoteStatus): string => {
  const statusNames: Record<NoteStatus, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    ARCHIVED: 'Archived',
    RESOLVED: 'Resolved',
    CANCELLED: 'Cancelled',
  };
  return statusNames[status];
};

/**
 * Get user-friendly display name for a type
 */
export const getTypeDisplayName = (type: NoteType): string => {
  const typeNames: Record<NoteType, string> = {
    BUG: 'Bug',
    TODO: 'To Do',
    QUESTION: 'Question',
    INFO: 'Info',
  };
  return typeNames[type];
};

/**
 * Get the next logical status in the workflow
 */
export const getNextStatus = (currentStatus: NoteStatus): NoteStatus => {
  if (currentStatus === 'TODO') return 'IN_PROGRESS';
  if (currentStatus === 'IN_PROGRESS') return 'RESOLVED';
  return currentStatus;
};

/**
 * Get the button label for status transition
 */
export const getStatusLabel = (status: NoteStatus): string => {
  if (status === 'TODO') return 'In Progress';
  if (status === 'IN_PROGRESS') return 'Resolved';
  return status.replace('_', ' ');
};
