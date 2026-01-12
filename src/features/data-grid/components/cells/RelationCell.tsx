import { ExternalLink, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface RelationCellProps {
  value: string | null | undefined;
  label?: string;
  href?: string;
  external?: boolean;
  emptyText?: string;
  /** Optional icon to display before the label (used as fallback if no imageUrl) */
  icon?: LucideIcon;
  /** Optional image URL to display instead of the icon */
  imageUrl?: string | null;
}

/**
 * RelationCell - Displays a related entity with optional link and icon
 *
 * Use for foreign key relationships (venue, organization, artist, etc.)
 */
export function RelationCell({
  value,
  label,
  href,
  external = false,
  emptyText = '—',
  icon: Icon,
  imageUrl,
}: RelationCellProps) {
  const displayText = label || value;

  if (!displayText) {
    return <span className='text-muted-foreground text-sm'>{emptyText}</span>;
  }

  // Render image if available, otherwise fall back to icon
  const renderVisual = () => {
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt=''
          className='h-5 w-5 rounded-full object-cover shrink-0'
        />
      );
    }
    if (Icon) {
      return <Icon className='h-3.5 w-3.5 shrink-0' />;
    }
    return null;
  };

  const content = (
    <>
      {renderVisual()}
      <span className='truncate'>{displayText}</span>
    </>
  );

  if (!href) {
    return (
      <span className='inline-flex items-center gap-1.5 text-sm'>
        {content}
      </span>
    );
  }

  if (external) {
    return (
      <a
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        className='inline-flex items-center gap-1.5 text-sm text-fm-gold hover:text-fm-gold/80 transition-colors'
      >
        {content}
        <ExternalLink className='h-3 w-3 shrink-0' />
      </a>
    );
  }

  return (
    <Link
      to={href}
      className='inline-flex items-center gap-1.5 text-sm text-fm-gold hover:text-fm-gold/80 transition-colors'
    >
      {content}
    </Link>
  );
}
