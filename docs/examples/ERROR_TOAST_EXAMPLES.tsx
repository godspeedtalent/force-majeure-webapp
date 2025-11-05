/**
 * FmErrorToast Usage Examples
 * 
 * Enhanced error toast component with developer/admin features
 */

import { showErrorToast } from '@/components/common/feedback/FmErrorToast';
import { useUserRole } from '@/shared/hooks/useUserRole';

// Example 1: Basic error toast
export function BasicErrorExample() {
  const { data: userRole } = useUserRole();
  const isDeveloper = userRole === 'developer' || userRole === 'admin';
  
  const handleError = () => {
    try {
      // Some operation that might fail
      throw new Error('Connection timeout');
    } catch (error) {
      showErrorToast({
        title: 'Upload Failed',
        description: 'Image failed to upload.',
        error: error instanceof Error ? error : undefined,
        isDeveloper,
      });
    }
  };
  
  return <button onClick={handleError}>Trigger Error</button>;
}

// Example 2: Network error with stack trace
export function NetworkErrorExample() {
  const { data: userRole } = useUserRole();
  const isDeveloper = userRole === 'developer' || userRole === 'admin';
  
  const handleNetworkError = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      showErrorToast({
        title: 'Network Error',
        description: 'Failed to fetch data from server.',
        error: error instanceof Error ? error : new Error('Unknown error'),
        isDeveloper,
      });
    }
  };
  
  return <button onClick={handleNetworkError}>Fetch Data</button>;
}

// Example 3: Validation error
export function ValidationErrorExample() {
  const { data: userRole } = useUserRole();
  const isDeveloper = userRole === 'developer' || userRole === 'admin';
  
  const handleValidation = (fileSize: number) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (fileSize > maxSize) {
      const error = new Error(`File size ${fileSize} exceeds limit of ${maxSize} bytes`);
      showErrorToast({
        title: 'File Too Large',
        description: 'File size exceeds 5MB limit.',
        error,
        isDeveloper,
      });
    }
  };
  
  return <input type="file" onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) handleValidation(file.size);
  }} />;
}

// Example 4: Database error
export function DatabaseErrorExample() {
  const { data: userRole } = useUserRole();
  const isDeveloper = userRole === 'developer' || userRole === 'admin';
  
  const handleDatabaseError = async () => {
    try {
      // Supabase query
      const { error } = await supabase
        .from('events')
        .insert({ title: 'Test' });
        
      if (error) throw error;
    } catch (error) {
      showErrorToast({
        title: 'Database Error',
        description: 'Failed to save event.',
        error: error instanceof Error ? error : new Error(String(error)),
        isDeveloper,
      });
    }
  };
  
  return <button onClick={handleDatabaseError}>Save Event</button>;
}

/**
 * What the user sees:
 * 
 * REGULAR USERS:
 * - Title: "Upload Failed" (in crimson)
 * - Description: "An error occurred. Please try again."
 * - No technical details
 * - No copy button
 * - 4 second duration
 * 
 * DEVELOPERS/ADMINS:
 * - Title: "Upload Failed" (in crimson)
 * - Description: "Image failed to upload."
 * - Error message: "Connection timeout" (in monospace)
 * - Copy button (copies full error + stack trace)
 * - 8 second duration (more time to copy)
 * 
 * Copied content (developers only):
 * ```
 * Title: Upload Failed
 * Description: Image failed to upload.
 * Error: Connection timeout
 * 
 * Stack Trace:
 * Error: Connection timeout
 *     at handleFile (FmImageUpload.tsx:85:13)
 *     at async uploadImage (imageUploadService.ts:45:5)
 * ```
 */
