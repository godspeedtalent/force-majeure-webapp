import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileIcon, X, FileSpreadsheet, FileText, FileImage } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { cn } from '@/shared';

interface FmFileDropzoneProps {
  /** Accepted file types (e.g., '.csv', '.pdf', 'image/*') */
  accept?: string;
  /** Callback when a file is selected */
  onFileSelect: (file: File) => void;
  /** Callback when file is cleared */
  onFileClear?: () => void;
  /** Currently selected file (for controlled component) */
  selectedFile?: File | null;
  /** Custom label for the dropzone */
  label?: string;
  /** Helper text shown below the main label */
  helperText?: string;
  /** Whether the component is in a loading/processing state */
  isLoading?: boolean;
  /** Loading text to display */
  loadingText?: string;
  /** Additional CSS classes */
  className?: string;
  /** Icon to display (defaults based on accept type) */
  icon?: React.ReactNode;
  /** Disable the dropzone */
  disabled?: boolean;
}

/**
 * FmFileDropzone Component
 *
 * A drag-and-drop file upload component for any file type.
 *
 * Features:
 * - Drag and drop support
 * - Click to browse
 * - File type validation via accept prop
 * - Selected file preview with clear option
 * - Loading state
 * - Customizable labels and icons
 *
 * @example
 * // CSV upload
 * <FmFileDropzone
 *   accept=".csv"
 *   onFileSelect={(file) => handleFile(file)}
 *   helperText="CSV must include headers"
 * />
 *
 * @example
 * // Image upload
 * <FmFileDropzone
 *   accept="image/*"
 *   onFileSelect={(file) => handleImage(file)}
 *   label="Drop your image here"
 * />
 */
export const FmFileDropzone = ({
  accept,
  onFileSelect,
  onFileClear,
  selectedFile,
  label,
  helperText,
  isLoading = false,
  loadingText,
  className,
  icon,
  disabled = false,
}: FmFileDropzoneProps) => {
  const { t } = useTranslation('common');
  const [dragActive, setDragActive] = useState(false);
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use controlled or uncontrolled file state
  const file = selectedFile !== undefined ? selectedFile : internalFile;

  const handleFile = useCallback(
    (newFile: File) => {
      if (selectedFile === undefined) {
        setInternalFile(newFile);
      }
      onFileSelect(newFile);
    },
    [onFileSelect, selectedFile]
  );

  const handleClear = useCallback(() => {
    if (selectedFile === undefined) {
      setInternalFile(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileClear?.();
  }, [onFileClear, selectedFile]);

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled || isLoading) return;

      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    },
    [disabled, isLoading]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || isLoading) return;

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [disabled, isLoading, handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isLoading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isLoading]);

  // Determine the icon based on accept type
  const getDefaultIcon = () => {
    if (icon) return icon;

    if (accept?.includes('.csv') || accept?.includes('csv')) {
      return <FileSpreadsheet className='h-12 w-12 text-muted-foreground' />;
    }
    if (accept?.includes('image')) {
      return <FileImage className='h-12 w-12 text-muted-foreground' />;
    }
    if (accept?.includes('.pdf') || accept?.includes('pdf')) {
      return <FileText className='h-12 w-12 text-muted-foreground' />;
    }
    return <Upload className='h-12 w-12 text-muted-foreground' />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Default labels
  const defaultLabel = t('fileDropzone.dropFileOr', 'Drop your file here, or');
  const defaultHelperText = accept
    ? t('fileDropzone.acceptedFormats', 'Accepted formats: {{formats}}', {
        formats: accept,
      })
    : undefined;

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type='file'
        accept={accept}
        onChange={handleChange}
        className='hidden'
        disabled={disabled || isLoading}
      />

      {file && !isLoading ? (
        /* Selected file preview */
        <div className='border border-white/30 bg-white/5 p-4'>
          <div className='flex items-center gap-3'>
            <FileIcon className='h-8 w-8 text-fm-gold flex-shrink-0' />
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium truncate'>{file.name}</p>
              <p className='text-xs text-muted-foreground'>
                {formatFileSize(file.size)}
              </p>
            </div>
            <button
              type='button'
              onClick={handleClear}
              className='p-2 text-muted-foreground hover:text-white transition-colors'
              aria-label={t('fileDropzone.clearFile', 'Clear file')}
            >
              <X className='h-4 w-4' />
            </button>
          </div>
          <FmCommonButton
            variant='secondary'
            onClick={handleClick}
            className='w-full mt-3'
            size='sm'
          >
            <Upload className='mr-2 h-4 w-4' />
            {t('fileDropzone.selectDifferentFile', 'Select different file')}
          </FmCommonButton>
        </div>
      ) : (
        /* Upload dropzone */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            'flex flex-col items-center justify-center border-2 border-dashed p-12 transition-colors',
            dragActive
              ? 'border-fm-gold bg-fm-gold/10'
              : 'border-white/30 hover:border-fm-gold/50 hover:bg-white/5',
            (disabled || isLoading) && 'pointer-events-none opacity-50',
            !disabled && !isLoading && 'cursor-pointer'
          )}
        >
          {isLoading ? (
            <>
              <div className='mb-4 h-12 w-12 animate-spin rounded-full border-4 border-fm-gold border-b-transparent' />
              <p className='text-sm text-muted-foreground'>
                {loadingText || t('fileDropzone.processing', 'Processing...')}
              </p>
            </>
          ) : (
            <>
              {getDefaultIcon()}
              <p className='mt-4 mb-2 text-sm'>
                {label || defaultLabel}{' '}
                <span className='text-fm-gold hover:underline'>
                  {t('fileDropzone.browse', 'browse')}
                </span>
              </p>
              {(helperText || defaultHelperText) && (
                <p className='text-xs text-muted-foreground text-center'>
                  {helperText || defaultHelperText}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};