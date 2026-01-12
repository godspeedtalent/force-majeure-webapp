/**
 * Activity Log Detail Component
 *
 * Expandable detail panel shown below activity log entries.
 * Displays different content based on event type:
 * - resource_updated: Changed fields with old → new format
 * - resource_created: Key details of new entity
 * - resource_deleted: Key details of deleted entity
 */

import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import { cn } from '@/shared';
import {
  ActivityLog,
  isUpdateMetadata,
  hasBeforeState,
  hasAfterState,
} from '../types';
import {
  getFieldsForResource,
  getFieldConfig,
  getResourceTypeFromCategory,
} from '../config/fieldDisplayConfig';
import {
  formatFieldValue,
  formatChangedField,
  fieldKeyToLabel,
  isFieldHidden,
} from '../utils/fieldFormatters';

interface ActivityLogDetailProps {
  log: ActivityLog;
}

/**
 * Renders the detail panel for a resource update
 * Shows which fields changed with before → after values
 *
 * Note: The database stores changed_fields with only the NEW values.
 * We use before[key] and after[key] to get the actual before/after values.
 */
function UpdateDetail({ log }: ActivityLogDetailProps) {
  const { t } = useTranslation('common');
  const metadata = log.metadata;

  if (!isUpdateMetadata(metadata) || !metadata.changed_fields) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {t('activityLogDetail.noChangesRecorded')}
      </p>
    );
  }

  const changedFieldKeys = Object.keys(metadata.changed_fields);
  const beforeState = (metadata.before ?? {}) as Record<string, unknown>;
  const afterState = (metadata.after ?? {}) as Record<string, unknown>;
  const resourceType = getResourceTypeFromCategory(log.category);
  const fieldConfigs = resourceType ? getFieldsForResource(resourceType) : [];

  // Filter out hidden fields
  const visibleFieldKeys = changedFieldKeys.filter(key => !isFieldHidden(key));

  if (visibleFieldKeys.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {t('activityLogDetail.onlySystemFieldsChanged')}
      </p>
    );
  }

  // Sort by priority if we have field configs
  const sortedFieldKeys = visibleFieldKeys.sort((keyA, keyB) => {
    const configA = fieldConfigs.find(f => f.key === keyA);
    const configB = fieldConfigs.find(f => f.key === keyB);
    return (configA?.priority ?? 99) - (configB?.priority ?? 99);
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Edit3 className="h-3 w-3" />
        <span className="uppercase tracking-wider font-medium">
          {t('activityLogDetail.changes')}
        </span>
      </div>
      <ul className="space-y-2">
        {sortedFieldKeys.map(key => {
          const config = getFieldConfig(resourceType || '', key);
          const label = config?.label || fieldKeyToLabel(key);
          const formatter = config?.formatter;
          const beforeValue = beforeState[key];
          const afterValue = afterState[key];

          return (
            <li
              key={key}
              className="flex items-start gap-2 text-sm"
            >
              <span className="text-muted-foreground min-w-[120px] flex-shrink-0">
                {label}:
              </span>
              <span className="text-white/90">
                {formatChangedField(beforeValue, afterValue, formatter)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Renders the detail panel for a resource creation
 * Shows key details of the newly created entity
 */
function CreateDetail({ log }: ActivityLogDetailProps) {
  const { t } = useTranslation('common');
  const metadata = log.metadata;

  if (!hasAfterState(metadata) || !metadata.after) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {t('activityLogDetail.noDetailsRecorded')}
      </p>
    );
  }

  const resourceType = getResourceTypeFromCategory(log.category);
  const fieldConfigs = resourceType ? getFieldsForResource(resourceType) : [];

  // If no field configs, show raw data (filtered)
  if (fieldConfigs.length === 0) {
    const entries = Object.entries(metadata.after).filter(
      ([key, value]) => !isFieldHidden(key) && value !== null && value !== undefined
    );

    if (entries.length === 0) {
      return (
        <p className="text-xs text-muted-foreground italic">
          {t('activityLogDetail.noDetailsRecorded')}
        </p>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Plus className="h-3 w-3" />
          <span className="uppercase tracking-wider font-medium">
            {t('activityLogDetail.created')}
          </span>
        </div>
        <ul className="space-y-2">
          {entries.slice(0, 8).map(([key, value]) => (
            <li key={key} className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground min-w-[120px] flex-shrink-0">
                {fieldKeyToLabel(key)}:
              </span>
              <span className="text-white/90">{formatFieldValue(value)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Show only configured fields that have values
  const displayFields = fieldConfigs.filter(config => {
    const value = metadata.after[config.key];
    return value !== null && value !== undefined && value !== '';
  });

  if (displayFields.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {t('activityLogDetail.noDetailsRecorded')}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Plus className="h-3 w-3" />
        <span className="uppercase tracking-wider font-medium">
          {t('activityLogDetail.created')}
        </span>
      </div>
      <ul className="space-y-2">
        {displayFields.slice(0, 8).map(config => {
          const value = metadata.after[config.key];
          const formatter = config.formatter || formatFieldValue;

          return (
            <li key={config.key} className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground min-w-[120px] flex-shrink-0">
                {config.label}:
              </span>
              <span className="text-white/90">{formatter(value)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Renders the detail panel for a resource deletion
 * Shows key details of the deleted entity
 */
function DeleteDetail({ log }: ActivityLogDetailProps) {
  const { t } = useTranslation('common');
  const metadata = log.metadata;

  if (!hasBeforeState(metadata) || !metadata.before) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {t('activityLogDetail.noDetailsRecorded')}
      </p>
    );
  }

  const resourceType = getResourceTypeFromCategory(log.category);
  const fieldConfigs = resourceType ? getFieldsForResource(resourceType) : [];

  // If no field configs, show raw data (filtered)
  if (fieldConfigs.length === 0) {
    const entries = Object.entries(metadata.before).filter(
      ([key, value]) => !isFieldHidden(key) && value !== null && value !== undefined
    );

    if (entries.length === 0) {
      return (
        <p className="text-xs text-muted-foreground italic">
          {t('activityLogDetail.noDetailsRecorded')}
        </p>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-destructive mb-3">
          <Trash2 className="h-3 w-3" />
          <span className="uppercase tracking-wider font-medium">
            {t('activityLogDetail.deleted')}
          </span>
        </div>
        <ul className="space-y-2">
          {entries.slice(0, 8).map(([key, value]) => (
            <li key={key} className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground min-w-[120px] flex-shrink-0">
                {fieldKeyToLabel(key)}:
              </span>
              <span className="text-white/50 line-through">
                {formatFieldValue(value)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Show only configured fields that had values
  const displayFields = fieldConfigs.filter(config => {
    const value = metadata.before[config.key];
    return value !== null && value !== undefined && value !== '';
  });

  if (displayFields.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {t('activityLogDetail.noDetailsRecorded')}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-destructive mb-3">
        <Trash2 className="h-3 w-3" />
        <span className="uppercase tracking-wider font-medium">
          {t('activityLogDetail.deleted')}
        </span>
      </div>
      <ul className="space-y-2">
        {displayFields.slice(0, 8).map(config => {
          const value = metadata.before[config.key];
          const formatter = config.formatter || formatFieldValue;

          return (
            <li key={config.key} className="flex items-start gap-2 text-sm">
              <span className="text-muted-foreground min-w-[120px] flex-shrink-0">
                {config.label}:
              </span>
              <span className="text-white/50 line-through">
                {formatter(value)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Renders details for ticket events
 */
function TicketDetail({ log }: ActivityLogDetailProps) {
  const { t } = useTranslation('common');
  const metadata = log.metadata as Record<string, unknown>;

  // Common ticket fields to display
  const displayFields: Array<{ key: string; label: string }> = [
    { key: 'ticket_code', label: t('activityLogDetail.ticketCode') },
    { key: 'tier_name', label: t('activityLogDetail.tierName') },
    { key: 'event_title', label: t('activityLogDetail.event') },
    { key: 'price', label: t('activityLogDetail.price') },
    { key: 'quantity', label: t('activityLogDetail.quantity') },
  ];

  const entries = displayFields.filter(
    field => metadata[field.key] !== null && metadata[field.key] !== undefined
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {entries.map(field => (
          <li key={field.key} className="flex items-start gap-2 text-sm">
            <span className="text-muted-foreground min-w-[120px] flex-shrink-0">
              {field.label}:
            </span>
            <span className="text-white/90">
              {formatFieldValue(metadata[field.key])}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Main ActivityLogDetail component
 * Renders appropriate detail view based on event type
 */
export function ActivityLogDetail({ log }: ActivityLogDetailProps) {
  const metadata = log.metadata;

  // Check if there's any metadata to display
  if (!metadata || Object.keys(metadata).length === 0) {
    return null;
  }

  // Render based on event type
  switch (log.event_type) {
    case 'resource_updated':
      return (
        <div
          className={cn(
            'px-4 py-3 ml-14',
            'bg-black/30 border-l-2 border-fm-gold/40',
            'animate-in fade-in-0 slide-in-from-top-2 duration-200'
          )}
        >
          <UpdateDetail log={log} />
        </div>
      );

    case 'resource_created':
      return (
        <div
          className={cn(
            'px-4 py-3 ml-14',
            'bg-black/30 border-l-2 border-green-500/40',
            'animate-in fade-in-0 slide-in-from-top-2 duration-200'
          )}
        >
          <CreateDetail log={log} />
        </div>
      );

    case 'resource_deleted':
      return (
        <div
          className={cn(
            'px-4 py-3 ml-14',
            'bg-black/30 border-l-2 border-destructive/40',
            'animate-in fade-in-0 slide-in-from-top-2 duration-200'
          )}
        >
          <DeleteDetail log={log} />
        </div>
      );

    case 'ticket_sold':
    case 'ticket_scanned':
    case 'ticket_refunded':
    case 'ticket_cancelled':
      return (
        <div
          className={cn(
            'px-4 py-3 ml-14',
            'bg-black/30 border-l-2 border-fm-gold/40',
            'animate-in fade-in-0 slide-in-from-top-2 duration-200'
          )}
        >
          <TicketDetail log={log} />
        </div>
      );

    default:
      // For other event types, try to display raw metadata if meaningful
      const entries = Object.entries(metadata).filter(
        ([key, value]) =>
          !isFieldHidden(key) && value !== null && value !== undefined
      );

      if (entries.length === 0) {
        return null;
      }

      return (
        <div
          className={cn(
            'px-4 py-3 ml-14',
            'bg-black/30 border-l-2 border-white/20',
            'animate-in fade-in-0 slide-in-from-top-2 duration-200'
          )}
        >
          <ul className="space-y-2">
            {entries.slice(0, 6).map(([key, value]) => (
              <li key={key} className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground min-w-[120px] flex-shrink-0">
                  {fieldKeyToLabel(key)}:
                </span>
                <span className="text-white/90">{formatFieldValue(value)}</span>
              </li>
            ))}
          </ul>
        </div>
      );
  }
}

/**
 * Check if a log has displayable details
 */
export function hasDisplayableDetails(log: ActivityLog): boolean {
  const metadata = log.metadata;

  if (!metadata || Object.keys(metadata).length === 0) {
    return false;
  }

  // Check for update metadata
  if (isUpdateMetadata(metadata) && metadata.changed_fields) {
    const entries = Object.entries(metadata.changed_fields).filter(
      ([key]) => !isFieldHidden(key)
    );
    return entries.length > 0;
  }

  // Check for create/delete metadata
  if (hasAfterState(metadata) || hasBeforeState(metadata)) {
    return true;
  }

  // Check for any non-hidden fields
  const entries = Object.entries(metadata).filter(
    ([key, value]) => !isFieldHidden(key) && value !== null && value !== undefined
  );

  return entries.length > 0;
}
