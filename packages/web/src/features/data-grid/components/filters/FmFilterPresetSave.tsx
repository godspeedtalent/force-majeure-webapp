import { useState } from 'react';
import { Input } from '@/components/common/shadcn/input';
import { Button } from '@/components/common/shadcn/button';
import { Save } from 'lucide-react';

export interface FmFilterPresetSaveProps {
  onSave: (name: string) => void;
  disabled?: boolean;
}

export function FmFilterPresetSave({ onSave, disabled = false }: FmFilterPresetSaveProps) {
  const [presetName, setPresetName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleSave = () => {
    if (presetName.trim()) {
      onSave(presetName.trim());
      setPresetName('');
      setShowInput(false);
    }
  };

  if (showInput) {
    return (
      <div className='flex gap-2'>
        <Input
          placeholder='Preset name...'
          value={presetName}
          onChange={e => setPresetName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setShowInput(false);
          }}
          autoFocus
        />
        <Button onClick={handleSave} size='sm'>
          <Save className='h-4 w-4 mr-2' />
          Save
        </Button>
        <Button variant='ghost' onClick={() => setShowInput(false)} size='sm'>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={() => setShowInput(true)}
      className='w-full'
      disabled={disabled}
    >
      <Save className='h-4 w-4 mr-2' />
      Save as Preset
    </Button>
  );
}
