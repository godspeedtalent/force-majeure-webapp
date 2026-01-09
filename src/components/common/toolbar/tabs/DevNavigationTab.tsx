import { useMemo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Home, Database, Mail, Bookmark, BookmarkPlus, X, Loader2, Pencil, Check } from 'lucide-react';
import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { Input } from '@/components/common/shadcn/input';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { Label } from '@/components/common/shadcn/label';
import {
  FmResponsiveGroupLayout,
  ResponsiveGroup,
} from '@/components/common/layout/FmResponsiveGroupLayout';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/common/shadcn/context-menu';
import { useDevBookmarks, DevBookmark } from '@/shared/hooks/useDevBookmarks';

interface DevNavigationTabContentProps {
  onNavigate: (path: string) => void;
  isAdmin: boolean;
}

// Helper to generate label from path
function generateLabelFromPath(path: string): string {
  const pathSegments = path.split('/').filter(Boolean);
  return pathSegments.length > 0
    ? pathSegments[pathSegments.length - 1]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Home';
}

export function DevNavigationTabContent({ onNavigate, isAdmin: _isAdmin }: DevNavigationTabContentProps) {
  const { t } = useTranslation('common');
  const location = useLocation();
  const { bookmarks, addBookmark, removeBookmark, updateBookmarkLabel, isBookmarked, isLoading, isAdding } = useDevBookmarks();

  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [bookmarkToRemove, setBookmarkToRemove] = useState<DevBookmark | null>(null);

  // Inline add bookmark state
  const [newBookmarkLabel, setNewBookmarkLabel] = useState('');
  const [includeQuerystring, setIncludeQuerystring] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Inline rename state
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [renameLabel, setRenameLabel] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const currentPath = location.pathname;
  const currentSearch = location.search;
  const fullPath = includeQuerystring && currentSearch ? `${currentPath}${currentSearch}` : currentPath;
  const currentPageBookmarked = isBookmarked(fullPath);

  // Focus rename input when editing starts
  useEffect(() => {
    if (editingBookmarkId && renameInputRef.current) {
      setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 0);
    }
  }, [editingBookmarkId]);

  // Helper to open Supabase dashboard
  const openSupabaseDashboard = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    if (supabaseUrl) {
      const isLocal = supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');

      if (isLocal) {
        window.open('http://localhost:54323', '_blank');
      } else if (projectId) {
        window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank');
      } else {
        const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
        if (projectRef) {
          window.open(`https://supabase.com/dashboard/project/${projectRef}`, '_blank');
        }
      }
    }
  };

  const handleAddBookmark = async () => {
    const label = newBookmarkLabel.trim() || generateLabelFromPath(currentPath);
    await addBookmark(fullPath, label);
    setNewBookmarkLabel('');
  };

  const handleRemoveBookmark = (bookmark: DevBookmark) => {
    setBookmarkToRemove(bookmark);
    setConfirmRemoveOpen(true);
  };

  const confirmRemoveBookmark = async () => {
    if (bookmarkToRemove) {
      await removeBookmark(bookmarkToRemove.id);
      setBookmarkToRemove(null);
    }
  };

  const startRenaming = (bookmark: DevBookmark) => {
    setEditingBookmarkId(bookmark.id);
    setRenameLabel(bookmark.label);
  };

  const handleRenameBookmark = async () => {
    if (editingBookmarkId && renameLabel.trim()) {
      await updateBookmarkLabel(editingBookmarkId, renameLabel.trim());
      setEditingBookmarkId(null);
      setRenameLabel('');
    }
  };

  const cancelRename = () => {
    setEditingBookmarkId(null);
    setRenameLabel('');
  };

  const groups: ResponsiveGroup[] = useMemo(() => [
    {
      id: 'bookmarks',
      title: t('devNavigation.bookmarks'),
      icon: Bookmark,
      count: bookmarks.length,
      children: (
        <div className='flex flex-col gap-2'>
          {/* Current page info and add bookmark */}
          <div className='p-2 border border-white/10 bg-white/5 space-y-2'>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-muted-foreground flex-1 truncate'>
                {t('devNavigation.currentPage')}: {fullPath}
              </span>
              <FmCommonIconButton
                icon={isAdding ? Loader2 : BookmarkPlus}
                variant={currentPageBookmarked ? 'gold' : 'default'}
                size='sm'
                onClick={handleAddBookmark}
                disabled={currentPageBookmarked || isAdding}
                aria-label={t('devNavigation.addBookmark')}
                className={isAdding ? 'animate-spin' : ''}
              />
            </div>
            {/* Inline name input and querystring toggle */}
            {!currentPageBookmarked && (
              <>
                <Input
                  ref={addInputRef}
                  value={newBookmarkLabel}
                  onChange={(e) => setNewBookmarkLabel(e.target.value)}
                  placeholder={generateLabelFromPath(currentPath)}
                  className='h-7 text-xs bg-background/50 border-white/10'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddBookmark();
                    }
                  }}
                />
                {currentSearch && (
                  <div className='flex items-center gap-2'>
                    <Checkbox
                      id='include-querystring'
                      checked={includeQuerystring}
                      onCheckedChange={(checked) => setIncludeQuerystring(checked === true)}
                      className='h-3 w-3'
                    />
                    <Label
                      htmlFor='include-querystring'
                      className='text-xs text-muted-foreground cursor-pointer'
                    >
                      {t('devNavigation.includeQuerystring')}
                    </Label>
                  </div>
                )}
              </>
            )}
          </div>

          {isLoading ? (
            <div className='flex items-center justify-center py-4'>
              <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
            </div>
          ) : bookmarks.length === 0 ? (
            <p className='text-sm text-muted-foreground text-center py-4'>
              {t('devNavigation.noBookmarks')}
            </p>
          ) : (
            bookmarks.map(bookmark => (
              <ContextMenu key={bookmark.id}>
                <ContextMenuTrigger asChild>
                  <div className='flex items-center gap-1'>
                    {editingBookmarkId === bookmark.id ? (
                      // Inline rename mode
                      <div className='flex-1 flex items-center gap-1'>
                        <Input
                          ref={renameInputRef}
                          value={renameLabel}
                          onChange={(e) => setRenameLabel(e.target.value)}
                          className='h-8 text-sm bg-background/50 border-white/10'
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameBookmark();
                            } else if (e.key === 'Escape') {
                              cancelRename();
                            }
                          }}
                          onBlur={() => {
                            // Small delay to allow click on save button
                            setTimeout(() => {
                              if (editingBookmarkId === bookmark.id) {
                                cancelRename();
                              }
                            }, 150);
                          }}
                        />
                        <FmCommonIconButton
                          icon={Check}
                          variant='gold'
                          size='sm'
                          onClick={handleRenameBookmark}
                          aria-label={t('common.save')}
                        />
                      </div>
                    ) : (
                      // Normal display mode
                      <>
                        <FmCommonButton
                          variant='default'
                          icon={Bookmark}
                          iconPosition='left'
                          onClick={() => onNavigate(bookmark.path)}
                          className='flex-1 justify-start'
                        >
                          {bookmark.label}
                        </FmCommonButton>
                        <FmCommonIconButton
                          icon={X}
                          variant='secondary'
                          size='sm'
                          onClick={() => handleRemoveBookmark(bookmark)}
                          aria-label={t('devNavigation.removeBookmark')}
                        />
                      </>
                    )}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className='bg-card border-border rounded-none w-40'>
                  <ContextMenuItem
                    onClick={() => onNavigate(bookmark.path)}
                    className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                  >
                    {t('devNavigation.goTo')}
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => startRenaming(bookmark)}
                    className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
                  >
                    <Pencil className='h-4 w-4 mr-2' />
                    {t('devNavigation.renameBookmark')}
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => handleRemoveBookmark(bookmark)}
                    className='text-destructive hover:bg-muted focus:bg-muted cursor-pointer'
                  >
                    {t('devNavigation.removeBookmark')}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))
          )}
        </div>
      ),
    },
    {
      id: 'core',
      title: t('devNavigation.core'),
      icon: Home,
      count: 1,
      children: (
        <div className='flex flex-col gap-2'>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div>
                <FmCommonButton
                  variant='default'
                  icon={Home}
                  iconPosition='left'
                  onClick={() => onNavigate('/developer')}
                  className='w-full justify-start'
                >
                  {t('devNavigation.developerHome')}
                </FmCommonButton>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className='bg-card border-border rounded-none w-40'>
              <ContextMenuItem
                onClick={() => onNavigate('/developer')}
                className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
              >
                {t('devNavigation.goTo')}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      ),
    },
    {
      id: 'supabase',
      title: t('devNavigation.supabase'),
      icon: Database,
      children: (
        <div className='flex flex-col gap-2'>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div>
                <FmCommonButton
                  variant='default'
                  icon={Database}
                  iconPosition='left'
                  onClick={openSupabaseDashboard}
                  className='w-full justify-start'
                >
                  {t('devNavigation.supabaseDashboard')}
                </FmCommonButton>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className='bg-card border-border rounded-none w-40'>
              <ContextMenuItem
                onClick={openSupabaseDashboard}
                className='text-white hover:bg-muted focus:bg-muted cursor-pointer'
              >
                {t('devNavigation.open')}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          {/* Mailpit link - only shown in dev environment */}
          {import.meta.env.VITE_ENVIRONMENT === 'dev' && (
            <FmCommonButton
              variant='default'
              icon={Mail}
              iconPosition='left'
              onClick={() => {
                window.open('http://localhost:55324', '_blank');
              }}
              className='w-full justify-start'
            >
              {t('devNavigation.mailpit')}
            </FmCommonButton>
          )}
        </div>
      ),
    },
  ], [t, onNavigate, bookmarks, currentPath, currentSearch, fullPath, currentPageBookmarked, isLoading, isAdding, newBookmarkLabel, includeQuerystring, editingBookmarkId, renameLabel]);

  return (
    <div className='space-y-4'>
      <Separator className='bg-white/10' />
      <FmResponsiveGroupLayout groups={groups} />

      <FmCommonConfirmDialog
        open={confirmRemoveOpen}
        onOpenChange={setConfirmRemoveOpen}
        title={t('devNavigation.confirmRemove')}
        description={t('devNavigation.confirmRemoveDescription', { label: bookmarkToRemove?.label })}
        onConfirm={confirmRemoveBookmark}
        variant='destructive'
      />
    </div>
  );
}
