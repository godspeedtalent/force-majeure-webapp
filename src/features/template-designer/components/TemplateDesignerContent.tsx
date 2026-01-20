/**
 * TemplateDesignerContent Component
 *
 * Main content component for the Template Designer developer tool.
 * Two-column layout with editor controls on the left and live preview on the right.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  FileText,
  Palette,
  Type,
  Maximize,
  ToggleLeft,
  Edit3,
  Download,
  Upload,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmFormSectionHeader } from '@/components/common/display/FmSectionHeader';
import { Tabs, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';

import { useTemplateConfigStore } from '../stores/templateConfigStore';
import { TEMPLATE_METADATA, type EmailTemplateId, type PDFTemplateId } from '../types';

import {
  ColorEditor,
  TypographyEditor,
  SpacingEditor,
  EmailContentEditor,
  PDFContentEditor,
  EmailTogglesEditor,
  PDFTogglesEditor,
  PDFSettingsEditor,
} from './editors';

import { EmailPreview, PDFPreview } from './preview';

// Collapsible section component
interface CollapsibleSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection = ({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className='border-b border-white/10'>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='flex w-full items-center justify-between p-[10px] text-left hover:bg-white/5'
      >
        <div className='flex items-center gap-[10px]'>
          <Icon className='h-4 w-4 text-fm-gold' />
          <span className='text-sm font-medium'>{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className='h-4 w-4 text-muted-foreground' />
        ) : (
          <ChevronRight className='h-4 w-4 text-muted-foreground' />
        )}
      </button>
      {isOpen && <div className='p-[10px] pt-0'>{children}</div>}
    </div>
  );
};

export const TemplateDesignerContent = () => {
  const { t } = useTranslation('pages');
  const [fileInputKey, setFileInputKey] = useState(0);

  const {
    selectedTemplateType,
    selectedEmailId,
    selectedPdfId,
    emailConfigs,
    pdfConfigs,
    setSelectedTemplateType,
    setSelectedEmailId,
    setSelectedPdfId,
    updateEmailColors,
    updateEmailTypography,
    updateEmailSpacing,
    updateEmailContent,
    updateEmailToggles,
    updatePDFColors,
    updatePDFTypography,
    updatePDFSpacing,
    updatePDFContent,
    updatePDFToggles,
    updatePDFConfig,
    resetEmailToDefault,
    resetPDFToDefault,
    exportConfigs,
    importConfigs,
  } = useTemplateConfigStore();

  const currentEmailConfig = emailConfigs[selectedEmailId];
  const currentPDFConfig = pdfConfigs[selectedPdfId];

  // Get templates by type
  const emailTemplates = TEMPLATE_METADATA.filter(t => t.type === 'email');
  const pdfTemplates = TEMPLATE_METADATA.filter(t => t.type === 'pdf');

  // Export handler
  const handleExport = useCallback(() => {
    const json = exportConfigs();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-configs.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('templateDesigner.exportSuccess', 'Configuration exported'));
  }, [exportConfigs, t]);

  // Import handler
  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = event => {
        const json = event.target?.result as string;
        const success = importConfigs(json);
        if (success) {
          toast.success(t('templateDesigner.importSuccess', 'Configuration imported'));
        } else {
          toast.error(t('templateDesigner.importError', 'Invalid configuration file'));
        }
        setFileInputKey(prev => prev + 1);
      };
      reader.readAsText(file);
    },
    [importConfigs, t]
  );

  // Reset handler
  const handleReset = useCallback(() => {
    if (selectedTemplateType === 'email') {
      resetEmailToDefault(selectedEmailId);
    } else {
      resetPDFToDefault(selectedPdfId);
    }
    toast.success(t('templateDesigner.resetSuccess', 'Reset to defaults'));
  }, [selectedTemplateType, selectedEmailId, selectedPdfId, resetEmailToDefault, resetPDFToDefault, t]);

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <FmFormSectionHeader
        title={t('templateDesigner.title', 'Template Designer')}
        description={t(
          'templateDesigner.description',
          'Customize email and PDF templates'
        )}
        icon={Edit3}
      />

      {/* Toolbar */}
      <div className='flex items-center justify-between border-b border-white/20 p-[10px]'>
        <Tabs
          value={selectedTemplateType}
          onValueChange={v => setSelectedTemplateType(v as 'email' | 'pdf')}
        >
          <TabsList className='rounded-none bg-black/40'>
            <TabsTrigger
              value='email'
              className='flex items-center gap-2 rounded-none data-[state=active]:bg-fm-gold/20 data-[state=active]:text-fm-gold'
            >
              <Mail className='h-4 w-4' />
              Email
            </TabsTrigger>
            <TabsTrigger
              value='pdf'
              className='flex items-center gap-2 rounded-none data-[state=active]:bg-fm-gold/20 data-[state=active]:text-fm-gold'
            >
              <FileText className='h-4 w-4' />
              PDF
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className='flex items-center gap-[10px]'>
          <FmCommonButton
            variant='secondary'
            size='sm'
            onClick={handleExport}
          >
            <Download className='mr-2 h-4 w-4' />
            Export
          </FmCommonButton>
          <label className='cursor-pointer'>
            <input
              key={fileInputKey}
              type='file'
              accept='.json'
              onChange={handleImport}
              className='hidden'
            />
            <span className='inline-flex items-center justify-center gap-2 rounded-none border border-white/20 bg-transparent px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/10'>
              <Upload className='h-4 w-4' />
              Import
            </span>
          </label>
          <FmCommonButton
            variant='secondary'
            size='sm'
            onClick={handleReset}
          >
            <RotateCcw className='mr-2 h-4 w-4' />
            Reset
          </FmCommonButton>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Left Panel - Editor */}
        <div className='w-[350px] flex-shrink-0 overflow-y-auto border-r border-white/20 bg-black/20'>
          {/* Template Selector */}
          <div className='border-b border-white/10 p-[10px]'>
            <label className='mb-[5px] block text-xs uppercase text-muted-foreground'>
              Template
            </label>
            <select
              value={
                selectedTemplateType === 'email'
                  ? selectedEmailId
                  : selectedPdfId
              }
              onChange={e => {
                if (selectedTemplateType === 'email') {
                  setSelectedEmailId(e.target.value as EmailTemplateId);
                } else {
                  setSelectedPdfId(e.target.value as PDFTemplateId);
                }
              }}
              className='w-full rounded-none border border-white/20 bg-transparent p-[10px] text-sm focus:border-fm-gold focus:outline-none'
            >
              {(selectedTemplateType === 'email'
                ? emailTemplates
                : pdfTemplates
              ).map(template => (
                <option
                  key={template.id}
                  value={template.id}
                  className='bg-black'
                >
                  {template.name}
                </option>
              ))}
            </select>
            <p className='mt-[5px] text-xs text-muted-foreground'>
              {TEMPLATE_METADATA.find(
                t =>
                  t.id ===
                  (selectedTemplateType === 'email'
                    ? selectedEmailId
                    : selectedPdfId)
              )?.description}
            </p>
          </div>

          {/* Editor Sections */}
          {selectedTemplateType === 'email' && currentEmailConfig && (
            <>
              <CollapsibleSection title='Colors' icon={Palette} defaultOpen>
                <ColorEditor
                  colors={currentEmailConfig.colors}
                  onChange={colors =>
                    updateEmailColors(selectedEmailId, colors)
                  }
                />
              </CollapsibleSection>

              <CollapsibleSection title='Typography' icon={Type}>
                <TypographyEditor
                  typography={currentEmailConfig.typography}
                  onChange={typography =>
                    updateEmailTypography(selectedEmailId, typography)
                  }
                  unit='px'
                />
              </CollapsibleSection>

              <CollapsibleSection title='Spacing' icon={Maximize}>
                <SpacingEditor
                  spacing={currentEmailConfig.spacing}
                  onChange={spacing =>
                    updateEmailSpacing(selectedEmailId, spacing)
                  }
                  unit='px'
                />
              </CollapsibleSection>

              <CollapsibleSection title='Content' icon={Edit3}>
                <EmailContentEditor
                  content={currentEmailConfig.content}
                  onChange={content =>
                    updateEmailContent(selectedEmailId, content)
                  }
                />
              </CollapsibleSection>

              <CollapsibleSection title='Visibility' icon={ToggleLeft}>
                <EmailTogglesEditor
                  toggles={currentEmailConfig.toggles}
                  onChange={toggles =>
                    updateEmailToggles(selectedEmailId, toggles)
                  }
                />
              </CollapsibleSection>
            </>
          )}

          {selectedTemplateType === 'pdf' && currentPDFConfig && (
            <>
              <CollapsibleSection title='Page Settings' icon={Settings} defaultOpen>
                <PDFSettingsEditor
                  config={currentPDFConfig}
                  onChange={updates => updatePDFConfig(selectedPdfId, updates)}
                />
              </CollapsibleSection>

              <CollapsibleSection title='Colors' icon={Palette}>
                <ColorEditor
                  colors={currentPDFConfig.colors}
                  onChange={colors => updatePDFColors(selectedPdfId, colors)}
                />
              </CollapsibleSection>

              <CollapsibleSection title='Typography' icon={Type}>
                <TypographyEditor
                  typography={currentPDFConfig.typography}
                  onChange={typography =>
                    updatePDFTypography(selectedPdfId, typography)
                  }
                  unit='pt'
                />
              </CollapsibleSection>

              <CollapsibleSection title='Spacing' icon={Maximize}>
                <SpacingEditor
                  spacing={currentPDFConfig.spacing}
                  onChange={spacing =>
                    updatePDFSpacing(selectedPdfId, spacing)
                  }
                  unit='mm'
                />
              </CollapsibleSection>

              <CollapsibleSection title='Content' icon={Edit3}>
                <PDFContentEditor
                  content={currentPDFConfig.content}
                  onChange={content =>
                    updatePDFContent(selectedPdfId, content)
                  }
                />
              </CollapsibleSection>

              <CollapsibleSection title='Visibility' icon={ToggleLeft}>
                <PDFTogglesEditor
                  toggles={currentPDFConfig.toggles}
                  onChange={toggles =>
                    updatePDFToggles(selectedPdfId, toggles)
                  }
                />
              </CollapsibleSection>
            </>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className='flex-1 overflow-hidden bg-neutral-900'>
          {selectedTemplateType === 'email' && currentEmailConfig && (
            <EmailPreview config={currentEmailConfig} />
          )}
          {selectedTemplateType === 'pdf' && currentPDFConfig && (
            <PDFPreview config={currentPDFConfig} />
          )}
        </div>
      </div>
    </div>
  );
};
