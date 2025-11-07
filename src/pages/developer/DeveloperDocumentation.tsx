import { useState, useEffect } from 'react';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { FileText, Search, ChevronRight } from 'lucide-react';
import { Input } from '@/components/common/shadcn/input';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';
import { Badge } from '@/components/common/shadcn/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocumentFile {
  name: string;
  path: string;
  category: string;
}

// List of available documentation files
const DOCUMENTATION_FILES: DocumentFile[] = [
  { name: 'Architecture', path: '/docs/ARCHITECTURE.md', category: 'Core' },
  {
    name: 'Architecture Quick Reference',
    path: '/docs/ARCHITECTURE_QUICK_REFERENCE.md',
    category: 'Core',
  },
  { name: 'Design System', path: '/docs/DESIGN_SYSTEM.md', category: 'Design' },
  {
    name: 'Error Handling Guide',
    path: '/docs/ERROR_HANDLING_GUIDE.md',
    category: 'Development',
  },
  {
    name: 'Error Handling README',
    path: '/docs/ERROR_HANDLING_README.md',
    category: 'Development',
  },
  {
    name: 'Event Views Setup',
    path: '/docs/EVENT_VIEWS_SETUP.md',
    category: 'Features',
  },
  {
    name: 'Feature Flag Guide',
    path: '/docs/FEATURE_FLAG_GUIDE.md',
    category: 'Development',
  },
  {
    name: 'Google OAuth Setup',
    path: '/docs/GOOGLE_OAUTH_SETUP.md',
    category: 'Authentication',
  },
  {
    name: 'Image Upload Setup',
    path: '/docs/IMAGE_UPLOAD_SETUP.md',
    category: 'Features',
  },
  {
    name: 'Migration Checklist',
    path: '/docs/MIGRATION_CHECKLIST.md',
    category: 'Migration',
  },
  {
    name: 'Migration Examples',
    path: '/docs/MIGRATION_EXAMPLES.md',
    category: 'Migration',
  },
  {
    name: 'Migration Summary',
    path: '/docs/MIGRATION_SUMMARY.md',
    category: 'Migration',
  },
  {
    name: 'Permission Management Guide',
    path: '/docs/PERMISSION_MANAGEMENT_GUIDE.md',
    category: 'Authentication',
  },
  {
    name: 'Role Permission Quick Reference',
    path: '/docs/ROLE_PERMISSION_QUICK_REFERENCE.md',
    category: 'Authentication',
  },
];

export default function DeveloperDocumentation() {
  const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [documentContent, setDocumentContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Filter documents based on search query
  const filteredDocs = DOCUMENTATION_FILES.filter(
    doc =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group documents by category
  const groupedDocs = filteredDocs.reduce(
    (acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = [];
      }
      acc[doc.category].push(doc);
      return acc;
    },
    {} as Record<string, DocumentFile[]>
  );

  // Load document content
  useEffect(() => {
    if (selectedDoc) {
      setIsLoading(true);
      fetch(selectedDoc.path)
        .then(res => res.text())
        .then(content => {
          setDocumentContent(content);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error loading document:', error);
          setDocumentContent(
            '# Error Loading Document\n\nUnable to load the requested documentation file.'
          );
          setIsLoading(false);
        });
    }
  }, [selectedDoc]);

  return (
    <DemoLayout
      title='Documentation Viewer'
      description='Browse and search generated documentation'
      icon={FileText}
    >
      <div className='grid grid-cols-12 gap-[20px] h-[calc(100vh-300px)]'>
        {/* Sidebar - Document List */}
        <div className='col-span-3 border border-border rounded-none bg-card'>
          <div className='p-[20px] border-b border-border'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search documentation...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='pl-9 bg-background border-border rounded-none'
              />
            </div>
          </div>

          <ScrollArea className='h-[calc(100%-80px)]'>
            <div className='p-[20px] space-y-[20px]'>
              {Object.entries(groupedDocs).map(([category, docs]) => (
                <div key={category}>
                  <h3 className='text-xs font-semibold text-muted-foreground uppercase mb-[10px] tracking-wider'>
                    {category}
                  </h3>
                  <div className='space-y-[5px]'>
                    {docs.map(doc => (
                      <button
                        key={doc.path}
                        onClick={() => setSelectedDoc(doc)}
                        className={`
                          w-full text-left p-[10px] rounded-none border transition-all duration-200
                          ${
                            selectedDoc?.path === doc.path
                              ? 'bg-fm-gold/10 border-fm-gold text-white'
                              : 'bg-background/40 border-border hover:bg-fm-gold/5 hover:border-fm-gold/50'
                          }
                        `}
                      >
                        <div className='flex items-center gap-2'>
                          <FileText className='h-4 w-4 flex-shrink-0' />
                          <span className='text-sm truncate'>{doc.name}</span>
                          {selectedDoc?.path === doc.path && (
                            <ChevronRight className='h-4 w-4 ml-auto flex-shrink-0' />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content - Document Viewer */}
        <div className='col-span-9 border border-border rounded-none bg-card'>
          {selectedDoc ? (
            <>
              <div className='p-[20px] border-b border-border'>
                <div className='flex items-center gap-3'>
                  <FileText className='h-5 w-5 text-fm-gold' />
                  <h2 className='text-2xl font-canela font-semibold'>
                    {selectedDoc.name}
                  </h2>
                  <Badge variant='outline' className='ml-auto'>
                    {selectedDoc.category}
                  </Badge>
                </div>
              </div>

              <ScrollArea className='h-[calc(100%-80px)]'>
                <div className='p-[40px]'>
                  {isLoading ? (
                    <div className='flex items-center justify-center h-[200px]'>
                      <div className='text-muted-foreground'>
                        Loading documentation...
                      </div>
                    </div>
                  ) : (
                    <div
                      className='prose prose-invert prose-sm max-w-none
                      prose-headings:font-canela prose-headings:text-white
                      prose-h1:text-3xl prose-h1:mb-[20px] prose-h1:text-fm-gold
                      prose-h2:text-2xl prose-h2:mt-[40px] prose-h2:mb-[20px] prose-h2:border-b prose-h2:border-border prose-h2:pb-[10px]
                      prose-h3:text-xl prose-h3:mt-[20px] prose-h3:mb-[10px]
                      prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-[10px]
                      prose-a:text-fm-gold prose-a:no-underline hover:prose-a:underline
                      prose-code:text-fm-gold prose-code:bg-black/40 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm
                      prose-pre:bg-black/60 prose-pre:border prose-pre:border-border prose-pre:rounded-none
                      prose-ul:text-muted-foreground prose-ul:my-[10px]
                      prose-ol:text-muted-foreground prose-ol:my-[10px]
                      prose-li:my-[5px]
                      prose-blockquote:border-l-fm-gold prose-blockquote:text-muted-foreground prose-blockquote:italic
                      prose-strong:text-white prose-strong:font-semibold
                      prose-table:text-sm prose-table:border-collapse
                      prose-th:bg-muted prose-th:border prose-th:border-border prose-th:p-[10px]
                      prose-td:border prose-td:border-border prose-td:p-[10px]
                    '
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {documentContent}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className='flex flex-col items-center justify-center h-full text-center p-[40px]'>
              <FileText className='h-16 w-16 text-muted-foreground mb-[20px]' />
              <h3 className='text-xl font-canela font-semibold mb-[10px]'>
                Select a document to view.
              </h3>
              <p className='text-muted-foreground max-w-md'>
                Choose from the list on the left to view generated
                documentation, architecture guides, and setup instructions.
              </p>
            </div>
          )}
        </div>
      </div>
    </DemoLayout>
  );
}
