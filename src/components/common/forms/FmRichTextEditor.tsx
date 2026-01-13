import * as React from 'react';
import { useEditor, EditorContent, Editor, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Heading1,
  Heading2,
  Heading3,
  FileCode,
} from 'lucide-react';
import { Label } from '@/components/common/shadcn/label';
import { cn } from '@/shared';

const lowlight = createLowlight(common);

interface FmRichTextEditorProps {
  /** Label displayed below the editor */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Description text */
  description?: string;
  /** Error message */
  error?: string;
  /** Container class name */
  containerClassName?: string;
  /** Editor class name */
  className?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Initial content in TipTap JSON format */
  value?: JSONContent | null;
  /** Callback when content changes */
  onChange?: (content: JSONContent) => void;
  /** Callback when plain text is needed */
  onTextChange?: (text: string) => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Maximum height in pixels */
  maxHeight?: number;
  /** Whether to show the toolbar */
  showToolbar?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

const ToolbarButton = ({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: ToolbarButtonProps) => (
  <button
    type='button'
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'p-1.5 rounded-none transition-all duration-200',
      'hover:bg-fm-gold/20 hover:text-fm-gold',
      'focus:outline-none focus:ring-1 focus:ring-fm-gold/50',
      'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-inherit',
      isActive
        ? 'bg-fm-gold/30 text-fm-gold'
        : 'text-muted-foreground'
    )}
  >
    {children}
  </button>
);

interface ToolbarDividerProps {
  className?: string;
}

const ToolbarDivider = ({ className }: ToolbarDividerProps) => (
  <div className={cn('w-px h-5 bg-border/50 mx-1', className)} />
);

interface EditorToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
}

const EditorToolbar = ({ editor, disabled = false }: EditorToolbarProps) => {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run();
  };

  return (
    <div className='flex flex-wrap items-center gap-0.5 p-2 border-b border-border/50 bg-black/20'>
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        disabled={disabled}
        title='Bold (Ctrl+B)'
      >
        <Bold className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        disabled={disabled}
        title='Italic (Ctrl+I)'
      >
        <Italic className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        disabled={disabled}
        title='Strikethrough'
      >
        <Strikethrough className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        disabled={disabled}
        title='Inline code'
      >
        <Code className='h-4 w-4' />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        disabled={disabled}
        title='Heading 1'
      >
        <Heading1 className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        disabled={disabled}
        title='Heading 2'
      >
        <Heading2 className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        disabled={disabled}
        title='Heading 3'
      >
        <Heading3 className='h-4 w-4' />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        disabled={disabled}
        title='Bullet list'
      >
        <List className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        disabled={disabled}
        title='Numbered list'
      >
        <ListOrdered className='h-4 w-4' />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Blocks */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        disabled={disabled}
        title='Quote'
      >
        <Quote className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        disabled={disabled}
        title='Code block'
      >
        <FileCode className='h-4 w-4' />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Links */}
      <ToolbarButton
        onClick={setLink}
        isActive={editor.isActive('link')}
        disabled={disabled}
        title='Add link'
      >
        <LinkIcon className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={disabled || !editor.isActive('link')}
        title='Remove link'
      >
        <Unlink className='h-4 w-4' />
      </ToolbarButton>

      <ToolbarDivider />

      {/* History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
        title='Undo (Ctrl+Z)'
      >
        <Undo className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
        title='Redo (Ctrl+Y)'
      >
        <Redo className='h-4 w-4' />
      </ToolbarButton>
    </div>
  );
};

/**
 * Rich text editor component using TipTap
 * Styled with FM design system - gold accents, sharp corners, frosted glass
 */
export const FmRichTextEditor = ({
  label,
  required = false,
  description,
  error,
  containerClassName,
  className,
  placeholder = 'Start typing...',
  value,
  onChange,
  onTextChange,
  disabled = false,
  minHeight = 150,
  maxHeight = 400,
  showToolbar = true,
}: FmRichTextEditorProps) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-fm-gold underline hover:text-fm-gold/80',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-black/40 rounded-none p-3 my-2 overflow-x-auto',
        },
      }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange?.(json);
      onTextChange?.(editor.getText());
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-invert prose-sm max-w-none',
          'focus:outline-none',
          'prose-headings:font-canela prose-headings:text-white prose-headings:mt-4 prose-headings:mb-2',
          'prose-p:text-white/90 prose-p:my-2',
          'prose-strong:text-white prose-strong:font-semibold',
          'prose-em:text-white/90',
          'prose-code:text-fm-gold prose-code:bg-black/40 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-none prose-code:before:content-none prose-code:after:content-none',
          'prose-blockquote:border-l-fm-gold prose-blockquote:border-l-2 prose-blockquote:pl-4 prose-blockquote:text-white/70 prose-blockquote:italic',
          'prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6',
          'prose-li:text-white/90 prose-li:my-1',
          'prose-a:text-fm-gold prose-a:no-underline hover:prose-a:underline',
          className
        ),
      },
    },
  });

  // Update editor content when value prop changes
  React.useEffect(() => {
    if (editor && value && !editor.isFocused) {
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(value);
      if (currentContent !== newContent) {
        editor.commands.setContent(value);
      }
    }
  }, [editor, value]);

  // Update editable state when disabled changes
  React.useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  return (
    <div className={cn('space-y-1', containerClassName)}>
      <div
        className={cn(
          'border border-border rounded-none overflow-hidden transition-all duration-300',
          isFocused && !disabled && 'border-fm-gold shadow-[0_0_16px_rgba(207,173,118,0.3)]',
          error && 'border-red-500',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        {showToolbar && <EditorToolbar editor={editor} disabled={disabled} />}
        <div
          className='p-3 overflow-y-auto'
          style={{ minHeight, maxHeight }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {(label || description) && (
        <div>
          {label && (
            <Label
              className={cn(
                'text-xs uppercase tracking-wider transition-colors duration-200',
                isFocused ? 'text-fm-gold' : 'text-muted-foreground'
              )}
            >
              {label} {required && <span className='text-fm-gold'>*</span>}
            </Label>
          )}
          {description && (
            <p className='text-xs text-muted-foreground/70 mt-0.5'>
              {description}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className='text-xs text-red-500 mt-1 animate-in fade-in slide-in-from-top-1 duration-300'>
          {error}
        </p>
      )}

      {/* TipTap placeholder styles */}
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(255, 255, 255, 0.3);
          pointer-events: none;
          height: 0;
        }

        .ProseMirror:focus {
          outline: none;
        }

        .ProseMirror pre {
          background: rgba(0, 0, 0, 0.4);
          color: #dfba7d;
          font-family: 'JetBrainsMono', monospace;
          padding: 0.75rem 1rem;
          border-radius: 0;
        }

        .ProseMirror pre code {
          color: inherit;
          padding: 0;
          background: none;
          font-size: 0.875rem;
        }

        .ProseMirror .hljs-comment,
        .ProseMirror .hljs-quote {
          color: #6a737d;
        }

        .ProseMirror .hljs-variable,
        .ProseMirror .hljs-template-variable,
        .ProseMirror .hljs-attribute,
        .ProseMirror .hljs-tag,
        .ProseMirror .hljs-name,
        .ProseMirror .hljs-regexp,
        .ProseMirror .hljs-link,
        .ProseMirror .hljs-name,
        .ProseMirror .hljs-selector-id,
        .ProseMirror .hljs-selector-class {
          color: #f97583;
        }

        .ProseMirror .hljs-number,
        .ProseMirror .hljs-meta,
        .ProseMirror .hljs-built_in,
        .ProseMirror .hljs-builtin-name,
        .ProseMirror .hljs-literal,
        .ProseMirror .hljs-type,
        .ProseMirror .hljs-params {
          color: #ffab70;
        }

        .ProseMirror .hljs-string,
        .ProseMirror .hljs-symbol,
        .ProseMirror .hljs-bullet {
          color: #9ecbff;
        }

        .ProseMirror .hljs-title,
        .ProseMirror .hljs-section {
          color: #b392f0;
        }

        .ProseMirror .hljs-keyword,
        .ProseMirror .hljs-selector-tag {
          color: #f97583;
        }

        .ProseMirror .hljs-emphasis {
          font-style: italic;
        }

        .ProseMirror .hljs-strong {
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};

FmRichTextEditor.displayName = 'FmRichTextEditor';