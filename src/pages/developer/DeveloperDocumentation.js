import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { FileText, Search, ChevronRight } from 'lucide-react';
import { Input } from '@/components/common/shadcn/input';
import { ScrollArea } from '@/components/common/shadcn/scroll-area';
import { Badge } from '@/components/common/shadcn/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { logger } from '@/shared';
// List of available documentation files
const DOCUMENTATION_FILES = [
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
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [documentContent, setDocumentContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // Filter documents based on search query
    const filteredDocs = DOCUMENTATION_FILES.filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase()));
    // Group documents by category
    const groupedDocs = filteredDocs.reduce((acc, doc) => {
        if (!acc[doc.category]) {
            acc[doc.category] = [];
        }
        acc[doc.category].push(doc);
        return acc;
    }, {});
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
                logger.error('Error loading document:', error);
                setDocumentContent('# Error Loading Document\n\nUnable to load the requested documentation file.');
                setIsLoading(false);
            });
        }
    }, [selectedDoc]);
    return (_jsx(DemoLayout, { title: 'Documentation Viewer', description: 'Browse and search generated documentation', icon: FileText, children: _jsxs("div", { className: 'grid grid-cols-12 gap-[20px] h-[calc(100vh-300px)]', children: [_jsxs("div", { className: 'col-span-3 border border-border rounded-none bg-card', children: [_jsx("div", { className: 'p-[20px] border-b border-border', children: _jsxs("div", { className: 'relative', children: [_jsx(Search, { className: 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' }), _jsx(Input, { placeholder: 'Search documentation...', value: searchQuery, onChange: e => setSearchQuery(e.target.value), className: 'pl-9 bg-background border-border rounded-none' })] }) }), _jsx(ScrollArea, { className: 'h-[calc(100%-80px)]', children: _jsx("div", { className: 'p-[20px] space-y-[20px]', children: Object.entries(groupedDocs).map(([category, docs]) => (_jsxs("div", { children: [_jsx("h3", { className: 'text-xs font-semibold text-muted-foreground uppercase mb-[10px] tracking-wider', children: category }), _jsx("div", { className: 'space-y-[5px]', children: docs.map(doc => (_jsx("button", { onClick: () => setSelectedDoc(doc), className: `
                          w-full text-left p-[10px] rounded-none border transition-all duration-200
                          ${selectedDoc?.path === doc.path
                                                    ? 'bg-fm-gold/10 border-fm-gold text-white'
                                                    : 'bg-background/40 border-border hover:bg-fm-gold/5 hover:border-fm-gold/50'}
                        `, children: _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(FileText, { className: 'h-4 w-4 flex-shrink-0' }), _jsx("span", { className: 'text-sm truncate', children: doc.name }), selectedDoc?.path === doc.path && (_jsx(ChevronRight, { className: 'h-4 w-4 ml-auto flex-shrink-0' }))] }) }, doc.path))) })] }, category))) }) })] }), _jsx("div", { className: 'col-span-9 border border-border rounded-none bg-card', children: selectedDoc ? (_jsxs(_Fragment, { children: [_jsx("div", { className: 'p-[20px] border-b border-border', children: _jsxs("div", { className: 'flex items-center gap-3', children: [_jsx(FileText, { className: 'h-5 w-5 text-fm-gold' }), _jsx("h2", { className: 'text-2xl font-canela font-semibold', children: selectedDoc.name }), _jsx(Badge, { variant: 'outline', className: 'ml-auto', children: selectedDoc.category })] }) }), _jsx(ScrollArea, { className: 'h-[calc(100%-80px)]', children: _jsx("div", { className: 'p-[40px]', children: isLoading ? (_jsx("div", { className: 'flex items-center justify-center h-[200px]', children: _jsx("div", { className: 'text-muted-foreground', children: "Loading documentation..." }) })) : (_jsx("div", { className: 'prose prose-invert prose-sm max-w-none\r\n                      prose-headings:font-canela prose-headings:text-white\r\n                      prose-h1:text-3xl prose-h1:mb-[20px] prose-h1:text-fm-gold\r\n                      prose-h2:text-2xl prose-h2:mt-[40px] prose-h2:mb-[20px] prose-h2:border-b prose-h2:border-border prose-h2:pb-[10px]\r\n                      prose-h3:text-xl prose-h3:mt-[20px] prose-h3:mb-[10px]\r\n                      prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-[10px]\r\n                      prose-a:text-fm-gold prose-a:no-underline hover:prose-a:underline\r\n                      prose-code:text-fm-gold prose-code:bg-black/40 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm\r\n                      prose-pre:bg-black/60 prose-pre:border prose-pre:border-border prose-pre:rounded-none\r\n                      prose-ul:text-muted-foreground prose-ul:my-[10px]\r\n                      prose-ol:text-muted-foreground prose-ol:my-[10px]\r\n                      prose-li:my-[5px]\r\n                      prose-blockquote:border-l-fm-gold prose-blockquote:text-muted-foreground prose-blockquote:italic\r\n                      prose-strong:text-white prose-strong:font-semibold\r\n                      prose-table:text-sm prose-table:border-collapse\r\n                      prose-th:bg-muted prose-th:border prose-th:border-border prose-th:p-[10px]\r\n                      prose-td:border prose-td:border-border prose-td:p-[10px]\r\n                    ', children: _jsx(ReactMarkdown, { remarkPlugins: [remarkGfm], children: documentContent }) })) }) })] })) : (_jsxs("div", { className: 'flex flex-col items-center justify-center h-full text-center p-[40px]', children: [_jsx(FileText, { className: 'h-16 w-16 text-muted-foreground mb-[20px]' }), _jsx("h3", { className: 'text-xl font-canela font-semibold mb-[10px]', children: "Select a document to view." }), _jsx("p", { className: 'text-muted-foreground max-w-md', children: "Choose from the list on the left to view generated documentation, architecture guides, and setup instructions." })] })) })] }) }));
}
