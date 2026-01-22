import { useState, useEffect } from 'react';
import { useUserPermissions, useUserRole } from '@/shared/hooks/useUserRole';
import { supabase, logger } from '@/shared';
import { FmSectionHeader } from '@/components/common/display/FmSectionHeader';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Shield, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared';
import { toast } from 'sonner';

interface DiagnosticResult {
  method: string;
  success: boolean;
  data: unknown;
  error?: string;
  duration: number;
}

/**
 * RoleDiagnosticsTab - Diagnostic tool for debugging role fetching
 *
 * Tests multiple methods of fetching roles to identify inconsistencies:
 * 1. useUserRole hook (standard React Query approach)
 * 2. Direct RPC call to get_user_roles()
 * 3. Direct query to user_roles table
 * 4. Direct query to users_complete view
 */
export function RoleDiagnosticsTab() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { data: hookRoles, isLoading: hookLoading } = useUserRole();
  const { getRoles, getPermissions, isAdmin } = useUserPermissions();

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        results.push({
          method: 'Get Current User',
          success: false,
          data: null,
          error: 'No authenticated user',
          duration: 0,
        });
        setDiagnostics(results);
        setIsRunning(false);
        return;
      }

      // Test 1: Direct RPC call to get_user_roles()
      const rpcStart = performance.now();
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_roles', {
          user_id_param: user.id,
        });
        const rpcDuration = performance.now() - rpcStart;

        results.push({
          method: 'RPC: get_user_roles()',
          success: !rpcError,
          data: rpcData,
          error: rpcError?.message,
          duration: rpcDuration,
        });
      } catch (error) {
        results.push({
          method: 'RPC: get_user_roles()',
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: performance.now() - rpcStart,
        });
      }

      // Test 2: Direct query to user_roles table with JOIN
      const joinStart = performance.now();
      try {
        const { data: joinData, error: joinError } = await supabase
          .from('user_roles')
          .select(`
            role_id,
            roles (
              id,
              name,
              display_name,
              permissions
            )
          `)
          .eq('user_id', user.id);
        const joinDuration = performance.now() - joinStart;

        results.push({
          method: 'Direct JOIN: user_roles → roles',
          success: !joinError,
          data: joinData,
          error: joinError?.message,
          duration: joinDuration,
        });
      } catch (error) {
        results.push({
          method: 'Direct JOIN: user_roles → roles',
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: performance.now() - joinStart,
        });
      }

      // Test 3: Query users_complete view
      const viewStart = performance.now();
      try {
        const { data: viewData, error: viewError } = await supabase
          .from('users_complete')
          .select('roles')
          .eq('id', user.id)
          .single();
        const viewDuration = performance.now() - viewStart;

        results.push({
          method: 'View: users_complete',
          success: !viewError,
          data: viewData,
          error: viewError?.message,
          duration: viewDuration,
        });
      } catch (error) {
        results.push({
          method: 'View: users_complete',
          success: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: performance.now() - viewStart,
        });
      }

      // Test 4: React Query hook (already loaded)
      results.push({
        method: 'React Query Hook: useUserRole()',
        success: !hookLoading && !!hookRoles,
        data: hookRoles,
        error: hookLoading ? 'Still loading' : undefined,
        duration: 0,
      });

      setDiagnostics(results);
    } catch (error) {
      logger.error('Diagnostics failed', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'RoleDiagnosticsTab.runDiagnostics',
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-run on mount
  useEffect(() => {
    runDiagnostics();
  }, []);

  const formatData = (data: unknown): string => {
    if (!data) return 'null';
    if (Array.isArray(data) && data.length === 0) return '[] (empty array)';
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="space-y-6">
      <FmSectionHeader
        title="Role Fetching Diagnostics"
        description="Test different methods of fetching user roles to identify inconsistencies"
        icon={Shield}
      />

      {/* Current State Summary */}
      <div className="bg-fm-gold/10 border border-fm-gold/30 p-4">
        <h3 className="text-sm font-medium text-fm-gold mb-3">Current State (via useUserPermissions hook)</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-white/50">Is Admin:</span>
            <span className="ml-2 text-white font-medium">{isAdmin() ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <span className="text-white/50">Roles:</span>
            <span className="ml-2 text-white font-medium">
              {getRoles().length > 0 ? getRoles().join(', ') : 'None'}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-white/50">Permissions:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {getPermissions().length > 0 ? (
                getPermissions().map(perm => (
                  <span
                    key={perm}
                    className={cn(
                      'px-1.5 py-0.5 text-[10px] font-mono border',
                      perm === '*'
                        ? 'bg-fm-gold/30 text-fm-gold border-fm-gold/50'
                        : 'bg-white/10 text-white/60 border-white/20'
                    )}
                  >
                    {perm}
                  </span>
                ))
              ) : (
                <span className="text-white/50 italic">None</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Run Diagnostics Button */}
      <div className="flex justify-end">
        <FmCommonButton
          variant="gold"
          onClick={runDiagnostics}
          disabled={isRunning}
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isRunning && 'animate-spin')} />
          {isRunning ? 'Running Diagnostics...' : 'Re-run Diagnostics'}
        </FmCommonButton>
      </div>

      {/* Diagnostic Results */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/70">Test Results</h3>
        {diagnostics.length === 0 ? (
          <div className="text-center py-8 text-white/50 text-sm">
            No diagnostics run yet. Click "Run Diagnostics" above.
          </div>
        ) : (
          diagnostics.map((result, idx) => (
            <div
              key={idx}
              className={cn(
                'border p-4 transition-all duration-200',
                result.success
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                  <span className="text-sm font-medium text-white">{result.method}</span>
                </div>
                <span className="text-xs text-white/50">
                  {result.duration.toFixed(2)}ms
                </span>
              </div>

              {result.error && (
                <div className="mb-2 flex items-start gap-2 text-xs text-red-400">
                  <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span>{result.error}</span>
                </div>
              )}

              <div className="mt-2">
                <div className="text-xs text-white/50 mb-1">Data returned:</div>
                <pre className="text-[10px] bg-black/30 p-2 overflow-x-auto text-white/70 font-mono max-h-60 overflow-y-auto">
                  {formatData(result.data)}
                </pre>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Analysis */}
      {diagnostics.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 p-4">
          <h3 className="text-sm font-medium text-blue-400 mb-2">Analysis</h3>
          <div className="text-xs text-white/70 space-y-2">
            {diagnostics.every(d => d.success) ? (
              <p className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                All role fetching methods succeeded. Check if they return the same data.
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                Some role fetching methods failed. This indicates an inconsistency issue.
              </p>
            )}

            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-white/50 mb-1">Expected behavior:</p>
              <ul className="list-disc list-inside space-y-1 text-white/60">
                <li>RPC function should return array of objects with role_name, display_name, permission_names</li>
                <li>Direct JOIN should return array with roles property containing role details</li>
                <li>users_complete view should return roles as JSONB array</li>
                <li>React Query hook should match RPC function result</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Raw Data Export - Copy/Paste Friendly */}
      {diagnostics.length > 0 && (
        <div className="bg-black/30 border border-white/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white/70">Raw Diagnostic Results (Copy/Paste)</h3>
            <FmCommonButton
              variant="secondary"
              onClick={() => {
                const dataStr = JSON.stringify(
                  {
                    timestamp: new Date().toISOString(),
                    currentState: {
                      isAdmin: isAdmin(),
                      roles: getRoles(),
                      permissions: getPermissions(),
                    },
                    diagnostics: diagnostics.map(d => ({
                      method: d.method,
                      success: d.success,
                      data: d.data,
                      error: d.error,
                      duration_ms: d.duration,
                    })),
                  },
                  null,
                  2
                );
                navigator.clipboard.writeText(dataStr);
                toast.success('Diagnostic results copied to clipboard');
                logger.info('Diagnostic results copied to clipboard', {
                  source: 'RoleDiagnosticsTab',
                });
              }}
            >
              Copy to Clipboard
            </FmCommonButton>
          </div>
          <pre className="text-[10px] bg-black/50 p-4 overflow-x-auto text-white/70 font-mono border border-white/10 max-h-96 overflow-y-auto">
            {JSON.stringify(
              {
                timestamp: new Date().toISOString(),
                currentState: {
                  isAdmin: isAdmin(),
                  roles: getRoles(),
                  permissions: getPermissions(),
                },
                diagnostics: diagnostics.map(d => ({
                  method: d.method,
                  success: d.success,
                  data: d.data,
                  error: d.error,
                  duration_ms: d.duration,
                })),
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
