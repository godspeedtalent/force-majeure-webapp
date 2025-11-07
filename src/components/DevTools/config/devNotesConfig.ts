import { CheckCircle2, Info, Bug, HelpCircle } from 'lucide-react';

export type NoteType = 'TODO' | 'INFO' | 'BUG' | 'QUESTION';
export type NoteStatus = 'TODO' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED' | 'CANCELLED';

/**
 * Configuration for note types with their associated icons and colors
 */
export const NOTE_TYPE_CONFIG: Record<NoteType, { icon: any; color: string; borderColor: string }> = {
  TODO: { 
    icon: CheckCircle2, 
    color: 'bg-blue-500/10 text-blue-400', 
    borderColor: 'border-l-blue-500 border-t-blue-500' 
  },
  INFO: { 
    icon: Info, 
    color: 'bg-cyan-500/10 text-cyan-400', 
    borderColor: 'border-l-cyan-500 border-t-cyan-500' 
  },
  BUG: { 
    icon: Bug, 
    color: 'bg-red-500/10 text-red-400', 
    borderColor: 'border-l-red-500 border-t-red-500' 
  },
  QUESTION: { 
    icon: HelpCircle, 
    color: 'bg-purple-500/10 text-purple-400', 
    borderColor: 'border-l-purple-500 border-t-purple-500' 
  },
};

/**
 * Configuration for note status indicators (colored dots)
 */
export const NOTE_STATUS_INDICATOR_CONFIG: Record<NoteStatus, { color: string; label: string }> = {
  TODO: { 
    color: 'bg-gray-400', 
    label: 'To Do' 
  },
  IN_PROGRESS: { 
    color: 'bg-yellow-400', 
    label: 'In Progress' 
  },
  RESOLVED: { 
    color: 'bg-green-400', 
    label: 'Resolved' 
  },
  ARCHIVED: { 
    color: 'bg-blue-400', 
    label: 'Archived' 
  },
  CANCELLED: { 
    color: 'bg-red-400', 
    label: 'Cancelled' 
  },
};

/**
 * Get user-friendly display name for a status
 */
export const getStatusDisplayName = (status: NoteStatus): string => {
  const statusNames: Record<NoteStatus, string> = {
    'TODO': 'To Do',
    'IN_PROGRESS': 'In Progress',
    'ARCHIVED': 'Archived',
    'RESOLVED': 'Resolved',
    'CANCELLED': 'Cancelled',
  };
  return statusNames[status];
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
