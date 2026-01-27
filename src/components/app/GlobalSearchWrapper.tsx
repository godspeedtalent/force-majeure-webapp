import { useGlobalSearch } from '@/contexts/GlobalSearchContext';
import { GlobalResourceSearch } from '@/components/admin/GlobalResourceSearch';

/**
 * Wrapper component that connects the GlobalResourceSearch modal
 * to the global search context state.
 */
export const GlobalSearchWrapper = () => {
  const { isOpen, closeSearch } = useGlobalSearch();
  return <GlobalResourceSearch isOpen={isOpen} onClose={closeSearch} />;
};
