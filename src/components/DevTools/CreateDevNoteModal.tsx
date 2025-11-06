import { useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import { FmCommonSelect, SelectOption } from '@/components/common/forms/FmCommonSelect';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/services/AuthContext';
import { toast } from 'sonner';

interface CreateDevNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteCreated: () => void;
}

type NoteType = 'TODO' | 'INFO' | 'BUG' | 'QUESTION';

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'TODO', label: 'TODO' },
  { value: 'INFO', label: 'INFO' },
  { value: 'BUG', label: 'BUG' },
  { value: 'QUESTION', label: 'QUESTION' },
];

export const CreateDevNoteModal = ({ open, onOpenChange, onNoteCreated }: CreateDevNoteModalProps) => {
  const { user, profile } = useAuth();
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NoteType>('TODO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create a note');
      return;
    }

    setIsSubmitting(true);

    try {
      const authorName = profile?.display_name || user.email || 'Unknown';
      
      const { error } = await supabase.from('dev_notes').insert({
        author_id: user.id,
        author_name: authorName,
        message: message.trim(),
        type,
        status: 'TODO', // Always TODO for new notes
      });

      if (error) throw error;

      toast.success('Note created successfully');
      setMessage('');
      setType('TODO');
      onOpenChange(false);
      onNoteCreated();
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-fm-dark-card border-fm-gold/20">
        <DialogHeader>
          <DialogTitle className="text-fm-gold flex items-center justify-between">
            Create Developer Note
            <button
              onClick={() => onOpenChange(false)}
              className="text-white/50 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <FmCommonSelect
            label="Type"
            value={type}
            onChange={(value) => setType(value as NoteType)}
            options={TYPE_OPTIONS}
            required
          />

          <FmCommonTextField
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your note here..."
            multiline
            rows={5}
            required
          />
        </div>

        <DialogFooter>
          <FmCommonButton
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </FmCommonButton>
          <FmCommonButton
            variant="default"
            onClick={handleSubmit}
            disabled={isSubmitting || !message.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create Note'}
          </FmCommonButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
