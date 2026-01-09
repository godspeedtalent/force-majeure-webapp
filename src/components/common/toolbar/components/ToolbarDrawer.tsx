import React from 'react';
import { X } from 'lucide-react';

import { cn } from '@/shared';
import { Button } from '@/components/common/shadcn/button';
import { ToolbarTab } from '../FmToolbar';

interface ToolbarDrawerProps {
  isOpen: boolean;
  isResizing: boolean;
  drawerWidth: number;
  activeTabData: ToolbarTab | undefined;
  onClose: () => void;
  onResizeStart: (event: React.MouseEvent) => void;
  dragToResizeText: string;
}

/** Renders the toolbar drawer content panel */
export const ToolbarDrawer = ({
  isOpen,
  isResizing,
  drawerWidth,
  activeTabData,
  onClose,
  onResizeStart,
  dragToResizeText,
}: ToolbarDrawerProps) => {
  return (
    <>
      {/* Resize Handle - only show for resizable tabs */}
      {isOpen && activeTabData?.resizable && (
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-1 cursor-ew-resize z-10',
            'hover:bg-fm-gold/50 transition-colors',
            isResizing && 'bg-fm-gold'
          )}
          onMouseDown={onResizeStart}
          title={dragToResizeText}
        />
      )}

      <div
        className={cn(
          'h-screen bg-black/90 backdrop-blur-md border-l border-white/20 transition-opacity duration-300 ease-in-out pointer-events-auto',
          isOpen ? 'opacity-100' : 'opacity-0 w-0'
        )}
        style={{
          width: isOpen ? `${drawerWidth}px` : '0px',
        }}
      >
        {isOpen && (
          <div className='pointer-events-auto h-full flex flex-col'>
            {/* Sticky Header */}
            <div className='sticky top-0 z-10 bg-black/90 backdrop-blur-md pt-8 px-6 pb-4 border-b border-white/10'>
              <Button
                variant='ghost'
                size='icon'
                onClick={onClose}
                className='absolute top-4 right-4 h-8 w-8 text-white/50 hover:text-white hover:bg-white/10'
              >
                <X className='h-4 w-4' />
              </Button>

              {activeTabData && (
                <h2 className='font-canela text-2xl text-white'>
                  {activeTabData.title || activeTabData.label}
                </h2>
              )}
            </div>

            {/* Scrollable Content */}
            {activeTabData && (
              <div className='flex-1 overflow-y-auto px-6 py-4'>
                <div className='space-y-6'>{activeTabData.content}</div>
              </div>
            )}

            {/* Sticky Footer */}
            {activeTabData?.footer && (
              <div className='sticky bottom-0 bg-black/90 backdrop-blur-md px-6 py-4 border-t border-white/10'>
                {activeTabData.footer}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
