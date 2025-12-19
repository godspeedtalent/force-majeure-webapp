import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { CheckCircle2, Info, Bug, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from '@/components/common/shadcn/dialog';
import { FmCommonSelect, } from '@/components/common/forms/FmCommonSelect';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { supabase } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { toast } from 'sonner';
const TYPE_OPTIONS = [
    { value: 'TODO', label: 'TODO', icon: CheckCircle2 },
    { value: 'INFO', label: 'INFO', icon: Info },
    { value: 'BUG', label: 'BUG', icon: Bug },
    { value: 'QUESTION', label: 'QUESTION', icon: HelpCircle },
];
export const CreateDevNoteModal = ({ open, onOpenChange, onNoteCreated, }) => {
    const { t } = useTranslation('common');
    const { user, profile } = useAuth();
    const [message, setMessage] = useState('');
    const [type, setType] = useState('TODO');
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Keyboard shortcuts
    useEffect(() => {
        if (!open)
            return;
        const handleKeyDown = (e) => {
            // Ctrl+Enter or Cmd+Enter to submit
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (message.trim() && !isSubmitting) {
                    handleSubmit();
                }
            }
            // Esc to close (handled by Dialog, but we can add custom logic if needed)
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, message, isSubmitting]);
    const handleSubmit = async () => {
        if (!message.trim()) {
            toast.error(t('devTools.notes.enterMessage'));
            return;
        }
        if (!user) {
            toast.error(t('devTools.notes.mustBeLoggedIn'));
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
            if (error)
                throw error;
            toast.success(t('devTools.notes.createSuccess'));
            setMessage('');
            setType('TODO');
            onOpenChange(false);
            onNoteCreated();
        }
        catch (error) {
            logger.error('Failed to create dev note:', error instanceof Error ? { error: error.message } : {});
            toast.error(t('devTools.notes.createError'));
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: 'sm:max-w-[600px] bg-fm-dark-card border-fm-gold/20 relative p-0 gap-0 flex flex-col max-h-[80vh]', style: {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                margin: 0,
            }, children: [_jsx("div", { className: 'absolute inset-0 opacity-[0.03] pointer-events-none z-0', style: {
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    } }), _jsx(DialogHeader, { className: 'relative z-[5] p-6 pb-2 flex-shrink-0', children: _jsx(DialogTitle, { className: 'text-fm-gold', children: t('devTools.notes.createTitle') }) }), _jsxs("div", { className: 'space-y-4 px-6 py-4 relative z-[5] flex-1 overflow-y-auto min-h-0', children: [_jsx(FmCommonSelect, { label: t('labels.type'), value: type, onChange: value => setType(value), options: TYPE_OPTIONS, required: true }), _jsx(FmCommonTextField, { label: t('devTools.notes.messageLabel'), value: message, onChange: e => setMessage(e.target.value), placeholder: t('devTools.notes.messagePlaceholder'), multiline: true, rows: 5, required: true })] }), _jsx(DialogFooter, { className: 'relative z-[5] p-6 pt-2 flex-shrink-0', children: _jsxs("div", { className: 'flex items-center justify-between w-full', children: [_jsxs("div", { className: 'flex flex-col gap-0.5 text-[10px] text-white/40', children: [_jsxs("span", { children: [_jsx("kbd", { className: 'px-1 py-0.5 bg-white/10 rounded text-[9px]', children: "Ctrl" }), ' ', "+", ' ', _jsx("kbd", { className: 'px-1 py-0.5 bg-white/10 rounded text-[9px]', children: "Enter" }), ' ', t('devTools.notes.toSave')] }), _jsxs("span", { children: [_jsx("kbd", { className: 'px-1 py-0.5 bg-white/10 rounded text-[9px]', children: "Esc" }), ' ', t('devTools.notes.toClose')] })] }), _jsxs("div", { className: 'flex gap-2', children: [_jsx(FmCommonButton, { variant: 'secondary', onClick: () => onOpenChange(false), disabled: isSubmitting, children: t('buttons.cancel') }), _jsx(FmCommonButton, { variant: 'default', onClick: handleSubmit, disabled: isSubmitting || !message.trim(), children: isSubmitting ? t('devTools.notes.creating') : t('devTools.notes.createButton') })] })] }) })] }) }));
};
