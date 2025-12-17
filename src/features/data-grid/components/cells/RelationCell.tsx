import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface RelationCellProps {
  value: string | null | undefined;
  label?: string;
  href?: string;
  external?: boolean;
  emptyText?: string;
}

/**
 * RelationCell - Displays a related entity with optional link
 *
 * Use for foreign key relationships (venue, organization, etc.)
 */
export function RelationCell({
  value,
  label,
  href,
  external = false,
  emptyText = '—',
}: RelationCellProps) {
  const displayText = label || value;

  if (!displayText) {
    return <span className='text-muted-foreground text-sm'>{emptyText}</span>;
  }

  if (!href) {
    return <span className='text-sm'>{displayText}</span>;
  }

  if (external) {
    return (
      <a
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        className='inline-flex items-center gap-1 text-sm text-fm-gold hover:text-fm-gold/80 transition-colors'
      >
        {displayText}
        <ExternalLink className='h-3 w-3' />
      </a>
    );
  }

  return (
    <Link
      to={href}
      className='text-sm text-fm-gold hover:text-fm-gold/80 transition-colors'
    >
      {displayText}
    </Link>
  );
}
