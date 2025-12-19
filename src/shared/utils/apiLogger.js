import { supabase } from '@/shared';
export async function logApiError(payload) {
    try {
        await supabase.functions.invoke('log-error', {
            body: {
                level: payload.level ?? 'error',
                source: payload.source ?? 'client',
                endpoint: payload.endpoint,
                method: payload.method,
                status: payload.status,
                message: payload.message,
                details: payload.details,
                request_id: payload.request_id,
            },
        });
    }
    catch (_) {
        // best-effort logging; ignore failures
    }
}
// Generic server-side log for info/warn events
export async function logApi(payload) {
    try {
        await supabase.functions.invoke('log-error', {
            body: {
                level: payload.level ?? 'info',
                source: payload.source ?? 'client',
                endpoint: payload.endpoint,
                method: payload.method,
                status: payload.status,
                message: payload.message,
                details: payload.details,
                request_id: payload.request_id,
            },
        });
    }
    catch (_) {
        // best-effort logging; ignore failures
    }
}
