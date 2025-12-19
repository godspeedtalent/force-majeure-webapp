import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Input } from '@/components/common/shadcn/input';
import { Button } from '@/components/common/shadcn/button';
import { Save } from 'lucide-react';
export function FmFilterPresetSave({ onSave, disabled = false }) {
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
        return (_jsxs("div", { className: 'flex gap-2', children: [_jsx(Input, { placeholder: 'Preset name...', value: presetName, onChange: e => setPresetName(e.target.value), onKeyDown: e => {
                        if (e.key === 'Enter')
                            handleSave();
                        if (e.key === 'Escape')
                            setShowInput(false);
                    }, autoFocus: true }), _jsxs(Button, { onClick: handleSave, size: 'sm', children: [_jsx(Save, { className: 'h-4 w-4 mr-2' }), "Save"] }), _jsx(Button, { variant: 'ghost', onClick: () => setShowInput(false), size: 'sm', children: "Cancel" })] }));
    }
    return (_jsxs(Button, { variant: 'outline', size: 'sm', onClick: () => setShowInput(true), className: 'w-full', disabled: disabled, children: [_jsx(Save, { className: 'h-4 w-4 mr-2' }), "Save as Preset"] }));
}
