import { CheckCircle2, Info, Bug, HelpCircle } from 'lucide-react';
/**
 * Configuration for note types with their associated icons and colors
 */
export const NOTE_TYPE_CONFIG = {
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
export const NOTE_STATUS_INDICATOR_CONFIG = {
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
export const SORT_FIELD_LABELS = {
    created_at: 'Date',
    type: 'Priority (Type)',
    status: 'Priority (Status)',
};
/**
 * Get user-friendly display name for a status
 */
export const getStatusDisplayName = (status) => {
    const statusNames = {
        TODO: 'To Do',
        IN_PROGRESS: 'In Progress',
        ARCHIVED: 'Archived',
        RESOLVED: 'Resolved',
        CANCELLED: 'Cancelled',
    };
    return statusNames[status];
};
/**
 * Get the next logical status in the workflow
 */
export const getNextStatus = (currentStatus) => {
    if (currentStatus === 'TODO')
        return 'IN_PROGRESS';
    if (currentStatus === 'IN_PROGRESS')
        return 'RESOLVED';
    return currentStatus;
};
/**
 * Get the button label for status transition
 */
export const getStatusLabel = (status) => {
    if (status === 'TODO')
        return 'In Progress';
    if (status === 'IN_PROGRESS')
        return 'Resolved';
    return status.replace('_', ' ');
};
