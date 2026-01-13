import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, User, Mail, UserPlus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';
import { Input } from '@/components/common/shadcn/input';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonEmailField, isValidEmail } from '@/components/common/forms/FmCommonEmailField';
import { supabase, logger } from '@/shared';
import { cn } from '@/shared';

interface UserSearchResult {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface FmUserSearchEmailProps {
  /** Current email value */
  value: string;
  /** Called when email value changes (either from user search or manual guest input) */
  onChange: (email: string, userId?: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Label for the field */
  label?: string;
}

/**
 * FmUserSearchEmail - Search for users by name/email and return their email
 *
 * Features:
 * - Search users by display name, full name, or email
 * - Show user avatar and name in results
 * - "Send to Guest" option for non-registered users
 * - Falls back to email input when sending to guest
 *
 * @example
 * ```tsx
 * <FmUserSearchEmail
 *   value={recipientEmail}
 *   onChange={(email, userId) => {
 *     setRecipientEmail(email);
 *     setRecipientUserId(userId);
 *   }}
 *   placeholder="Search for a user or enter guest email"
 * />
 * ```
 */
export function FmUserSearchEmail({
  value,
  onChange,
  placeholder,
  disabled = false,
  label,
}: FmUserSearchEmailProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<UserSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isGuestMode, setIsGuestMode] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserSearchResult | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const resolvedPlaceholder = placeholder || t('userSearch.searchOrEnterEmail');

  // Search for users
  React.useEffect(() => {
    if (!open) return;

    const searchDebounce = setTimeout(async () => {
      if (query.length > 0) {
        setLoading(true);
        try {
          // Search by display_name, full_name, or email
          const { data, error } = await supabase
            .from('profiles')
            .select('id, user_id, email, display_name, full_name, avatar_url')
            .or(`display_name.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .not('email', 'is', null)
            .limit(10);

          if (error) throw error;
          setResults((data as UserSearchResult[]) || []);
        } catch (error) {
          logger.error('User search failed', {
            source: 'FmUserSearchEmail',
            error: error instanceof Error ? error.message : 'Unknown',
          });
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [query, open]);

  // Focus input when popover opens
  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    onChange(user.email || '', user.user_id);
    setOpen(false);
    setQuery('');
    setIsGuestMode(false);
  };

  const handleSendToGuest = () => {
    setIsGuestMode(true);
    setSelectedUser(null);
    setOpen(false);
    setQuery('');
  };

  const handleGuestEmailChange = (email: string) => {
    onChange(email, undefined);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    setSelectedUser(null);
    setIsGuestMode(false);
    onChange('', undefined);
  };

  const getUserDisplayName = (user: UserSearchResult) => {
    return user.full_name || user.display_name || user.email || 'Unknown User';
  };

  // If in guest mode, show email input
  if (isGuestMode) {
    return (
      <div className='space-y-2'>
        {label && (
          <label className='text-xs uppercase tracking-wider text-muted-foreground'>
            {label}
          </label>
        )}
        <div className='flex items-center gap-2'>
          <div className='flex-1'>
            <FmCommonEmailField
              value={value}
              onChange={handleGuestEmailChange}
              placeholder='guest@example.com'
              showIcon={false}
            />
          </div>
          <button
            type='button'
            onClick={() => {
              setIsGuestMode(false);
              onChange('', undefined);
            }}
            className='p-2 text-muted-foreground hover:text-white transition-colors'
            aria-label={t('userSearch.backToSearch')}
          >
            <X className='h-4 w-4' />
          </button>
        </div>
        <p className='text-xs text-muted-foreground'>
          {t('userSearch.sendingToGuest')}
        </p>
      </div>
    );
  }

  const triggerButton = (
    <button
      type='button'
      className={cn(
        'w-full flex items-center gap-2 pr-3 py-2 rounded-none',
        'bg-black/40 border border-white/20',
        'text-white text-left font-light',
        'hover:border-fm-gold/50 transition-colors',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className='flex items-center justify-center h-full border-r border-white/20 px-2 flex-shrink-0'>
        <Mail className='h-3 w-3 text-white/70' />
      </div>
      {selectedUser ? (
        <>
          {selectedUser.avatar_url ? (
            <img
              src={selectedUser.avatar_url}
              alt={getUserDisplayName(selectedUser)}
              className='h-6 w-6 rounded-full object-cover ml-1'
            />
          ) : (
            <div className='h-6 w-6 rounded-full bg-white/10 flex items-center justify-center ml-1'>
              <User className='h-3 w-3 text-white/50' />
            </div>
          )}
          <span className='flex-1 truncate font-light text-white'>
            {getUserDisplayName(selectedUser)}
            <span className='text-white/50 ml-2'>({selectedUser.email})</span>
          </span>
        </>
      ) : value && isValidEmail(value) ? (
        <>
          <Mail className='h-4 w-4 text-white/50 ml-1' />
          <span className='flex-1 truncate font-light text-white'>
            {value}
            <span className='text-white/50 ml-2'>(Guest)</span>
          </span>
        </>
      ) : (
        <>
          <Search className='h-3 w-3 text-white/50 ml-1' />
          <span className='flex-1 truncate font-light text-white/40 text-sm'>
            {resolvedPlaceholder}
          </span>
        </>
      )}
      {(selectedUser || value) && (
        <button
          type='button'
          onClick={handleClear}
          className='p-1 hover:bg-white/10 rounded transition-colors'
          aria-label={t('buttons.clear')}
        >
          <X className='h-3 w-3 text-white/50' />
        </button>
      )}
    </button>
  );

  return (
    <div className='space-y-2'>
      {label && (
        <label className='text-xs uppercase tracking-wider text-muted-foreground'>
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          {triggerButton}
        </PopoverTrigger>
        <PopoverContent
          className='w-[400px] p-0 bg-black/90 backdrop-blur-md border border-white/20'
          align='start'
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <div className='p-2 border-b border-white/10'>
            <Input
              ref={inputRef}
              placeholder={t('userSearch.searchByNameOrEmail')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className='bg-black/40 border-white/20 text-white placeholder:text-white/50'
              autoFocus
            />
          </div>
          <div className='max-h-[300px] overflow-y-auto'>
            {loading ? (
              <div className='p-4 flex flex-col items-center gap-2'>
                <FmCommonLoadingSpinner size='md' />
                <span className='text-white/50 text-sm'>{t('userSearch.searching')}</span>
              </div>
            ) : results.length > 0 ? (
              results.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className='w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-left'
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={getUserDisplayName(user)}
                      className='h-8 w-8 rounded-full object-cover'
                    />
                  ) : (
                    <div className='h-8 w-8 rounded-full bg-white/10 flex items-center justify-center'>
                      <User className='h-4 w-4 text-white/50' />
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <div className='text-white font-light truncate'>
                      {getUserDisplayName(user)}
                    </div>
                    <div className='text-white/50 text-xs truncate'>
                      {user.email}
                    </div>
                  </div>
                </button>
              ))
            ) : query.length > 0 ? (
              <div className='p-4 text-center text-white/50'>
                {t('userSearch.noUsersFound')}
              </div>
            ) : (
              <div className='p-4 text-center text-white/50 text-sm'>
                {t('userSearch.startTyping')}
              </div>
            )}
          </div>
          {/* Send to Guest option */}
          <div className='border-t border-fm-gold'>
            <button
              onClick={handleSendToGuest}
              className='w-full flex items-center gap-2 px-3 py-2 hover:bg-fm-gold/10 transition-colors text-fm-gold font-medium text-sm'
            >
              <UserPlus className='h-4 w-4' />
              <span>{t('userSearch.sendToGuest')}</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
