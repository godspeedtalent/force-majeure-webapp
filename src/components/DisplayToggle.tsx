import { Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DisplayToggleProps {
  displayMode: 'grid' | 'row';
  onDisplayModeChange: (mode: 'grid' | 'row') => void;
}

export const DisplayToggle = ({ displayMode, onDisplayModeChange }: DisplayToggleProps) => {
  return (
    <div className="flex items-center gap-1 border border-border rounded-md p-1">
      <Button
        variant={displayMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onDisplayModeChange('grid')}
        className="h-8 w-8 p-0"
      >
        <Grid className="h-4 w-4" />
      </Button>
      <Button
        variant={displayMode === 'row' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onDisplayModeChange('row')}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
};