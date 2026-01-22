/**
 * FmTagMultiSelect - Tag-specific implementation of FmBadgeMultiSelect
 *
 * Wrapper around generic FmBadgeMultiSelect with tag-specific services.
 * Provides a convenient interface for searching, creating, and selecting tags.
 *
 * @example
 * ```tsx
 * <FmTagMultiSelect
 *   selectedTags={selectedTags}
 *   onChange={setSelectedTags}
 *   entityType="submission"
 *   maxTags={10}
 *   label="Tags"
 * />
 * ```
 */

import { useTranslation } from 'react-i18next';
import { FmBadgeMultiSelect, BadgeItem } from '@/components/common/forms/FmBadgeMultiSelect';
import { searchTags, createTag } from '../services/tagService';
import type { Tag, TagEntityType } from '../types';

interface FmTagMultiSelectProps {
  /** Currently selected tags */
  selectedTags: Tag[];
  /** Callback when selection changes */
  onChange: (tags: Tag[]) => void;
  /** Optional entity type filter (null = universal tags only) */
  entityType?: TagEntityType;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Label for the field */
  label?: string;
  /** Required field indicator */
  required?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Tag multi-select component
 *
 * Wraps FmBadgeMultiSelect with tag-specific functionality:
 * - Searches tags using tagService
 * - Creates tags using tagService
 * - Converts between Tag and BadgeItem types
 * - Supports i18n
 */
export function FmTagMultiSelect({
  selectedTags,
  onChange,
  entityType,
  maxTags = 10,
  disabled = false,
  label,
  required = false,
  className,
}: FmTagMultiSelectProps) {
  const { t } = useTranslation('common');

  // Convert Tags to BadgeItems for the base component
  const selectedItems: BadgeItem[] = selectedTags.map(tag => ({
    id: tag.id,
    label: tag.name,
    variant: 'secondary' as const,
    className: tag.color ? `border-[${tag.color}] text-[${tag.color}]` : undefined,
  }));

  // Search function - calls tag service and converts to BadgeItems
  const handleSearch = async (query: string, limit: number): Promise<BadgeItem[]> => {
    const tags = await searchTags(query, entityType, limit);
    return tags.map(tag => ({
      id: tag.id,
      label: tag.name,
      variant: 'secondary' as const,
      className: tag.color ? `border-[${tag.color}] text-[${tag.color}]` : undefined,
    }));
  };

  // Create function - creates tag and converts to BadgeItem
  const handleCreate = async (name: string): Promise<BadgeItem> => {
    const tag = await createTag({ name, entity_type: entityType });
    return {
      id: tag.id,
      label: tag.name,
      variant: 'secondary' as const,
      className: tag.color ? `border-[${tag.color}] text-[${tag.color}]` : undefined,
    };
  };

  // Convert BadgeItems back to Tags when selection changes
  const handleChange = (items: BadgeItem[]) => {
    // Map badge items back to full Tag objects
    // For existing tags, use the original object; for new tags, reconstruct
    const tags = items.map(item => {
      const existingTag = selectedTags.find(t => t.id === item.id);
      if (existingTag) return existingTag;

      // This shouldn't happen in normal flow (new tags are added via onCreate),
      // but handle gracefully just in case
      return {
        id: item.id,
        name: item.label,
        entity_type: entityType ?? null,
        color: null,
        description: null,
        usage_count: 0,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
    onChange(tags);
  };

  return (
    <FmBadgeMultiSelect
      selectedItems={selectedItems}
      onChange={handleChange}
      onSearch={handleSearch}
      onCreate={handleCreate}
      maxItems={maxTags}
      disabled={disabled}
      label={label || t('labels.tags', 'Tags')}
      required={required}
      placeholder={t('tagMultiSelect.searchAndAddTags', 'Search and add tags')}
      searchPlaceholder={t('tagMultiSelect.searchTags', 'Search tags')}
      createNewText={t('tagMultiSelect.createNewTag', '+ Create New Tag')}
      className={className}
    />
  );
}
