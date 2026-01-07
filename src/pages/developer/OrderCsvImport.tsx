import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { supabase } from '@/shared';
import { logger } from '@/shared/services/logger';
import { toast } from 'sonner';
import { cn } from '@/shared';

// Types for CSV parsing
interface CsvRow {
  [key: string]: string;
}

interface ParsedOrder {
  rowIndex: number;
  customerEmail: string;
  customerName: string;
  eventId: string;
  eventName?: string;
  ticketTierId: string;
  ticketTierName?: string;
  quantity: number;
  unitPriceCents: number;
  unitFeeCents: number;
  totalCents: number;
  orderDate: string;
  status: 'valid' | 'refunded' | 'cancelled';
  externalOrderId?: string; // For deduplication
  // Validation state
  validationErrors: string[];
  existingUserId: string | null;
  isDuplicate: boolean;
}

interface ImportResult {
  orderId: string;
  ticketCount: number;
  email: string;
}

// Column mapping configuration
interface ColumnMapping {
  customerEmail: string;
  customerName: string;
  eventId: string;
  ticketTierId: string;
  quantity: string;
  unitPriceCents: string;
  unitFeeCents: string;
  orderDate: string;
  status: string;
  externalOrderId: string;
}

const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  customerEmail: 'email',
  customerName: 'name',
  eventId: 'event_id',
  ticketTierId: 'ticket_tier_id',
  quantity: 'quantity',
  unitPriceCents: 'unit_price_cents',
  unitFeeCents: 'unit_fee_cents',
  orderDate: 'order_date',
  status: 'status',
  externalOrderId: 'external_order_id',
};

export default function OrderCsvImport() {
  const { t } = useTranslation('common');

  // State
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>(DEFAULT_COLUMN_MAPPING);
  const [parsedOrders, setParsedOrders] = useState<ParsedOrder[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'complete'>('upload');

  // Fetch events for validation and display
  const { data: events } = useQuery({
    queryKey: ['events-for-import'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title')
        .order('start_time', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch ticket tiers for validation and display
  const { data: ticketTiers } = useQuery({
    queryKey: ['ticket-tiers-for-import'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_tiers')
        .select('id, name, event_id');
      if (error) throw error;
      return data || [];
    },
  });

  // Parse CSV file
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        toast.error(t('orderCsvImport.errors.emptyFile'));
        return;
      }

      // Parse headers
      const headers = parseCSVLine(lines[0]);
      setCsvHeaders(headers);

      // Parse data rows
      const rows: CsvRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: CsvRow = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        rows.push(row);
      }
      setCsvData(rows);
      setStep('map');

      // Try to auto-detect column mappings
      autoDetectMappings(headers);
    };

    reader.onerror = () => {
      toast.error(t('orderCsvImport.errors.fileReadError'));
    };

    reader.readAsText(uploadedFile);
  }, [t]);

  // Parse a single CSV line (handling quoted values)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Auto-detect column mappings based on header names
  const autoDetectMappings = (headers: string[]) => {
    const lowerHeaders = headers.map(h => h.toLowerCase().replace(/[_\s-]/g, ''));
    const newMapping = { ...columnMapping };

    const mappingPatterns: Record<keyof ColumnMapping, string[]> = {
      customerEmail: ['email', 'customeremail', 'buyeremail', 'purchaseremail'],
      customerName: ['name', 'customername', 'buyername', 'fullname', 'attendeename'],
      eventId: ['eventid', 'event'],
      ticketTierId: ['tickettierid', 'tierid', 'tickettype', 'tier'],
      quantity: ['quantity', 'qty', 'count', 'tickets'],
      unitPriceCents: ['unitpricecents', 'pricecents', 'unitprice', 'price'],
      unitFeeCents: ['unitfeecents', 'feecents', 'fee', 'servicefee'],
      orderDate: ['orderdate', 'date', 'purchasedate', 'createdat'],
      status: ['status', 'orderstatus', 'ticketstatus'],
      externalOrderId: ['externalorderid', 'orderid', 'referenceid', 'transactionid'],
    };

    Object.entries(mappingPatterns).forEach(([field, patterns]) => {
      const match = headers.find((_header, idx) =>
        patterns.includes(lowerHeaders[idx])
      );
      if (match) {
        (newMapping as Record<string, string>)[field] = match;
      }
    });

    setColumnMapping(newMapping);
  };

  // Validate and parse orders
  const validateOrders = useCallback(async () => {
    if (csvData.length === 0) return;

    setIsValidating(true);
    const parsed: ParsedOrder[] = [];

    try {
      // Fetch all profiles to check for existing users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email');

      const emailToUserId = new Map<string, string>();
      profiles?.forEach(p => {
        if (p.email) {
          emailToUserId.set(p.email.toLowerCase(), p.id);
        }
      });

      // Check for existing external order IDs to prevent duplicates
      const externalIds = csvData
        .map(row => row[columnMapping.externalOrderId])
        .filter(Boolean);

      const existingExternalIds = new Set<string>();
      if (externalIds.length > 0) {
        // We'll need to store external_order_id in orders - for now, skip duplicate check
        // In production, you'd query orders with matching external_order_id
      }

      // Parse each row
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const errors: string[] = [];

        const email = row[columnMapping.customerEmail]?.trim().toLowerCase() || '';
        const name = row[columnMapping.customerName]?.trim() || '';
        const eventId = row[columnMapping.eventId]?.trim() || '';
        const tierId = row[columnMapping.ticketTierId]?.trim() || '';
        const quantityStr = row[columnMapping.quantity]?.trim() || '1';
        const unitPriceStr = row[columnMapping.unitPriceCents]?.trim() || '0';
        const unitFeeStr = row[columnMapping.unitFeeCents]?.trim() || '0';
        const orderDate = row[columnMapping.orderDate]?.trim() || new Date().toISOString();
        const status = (row[columnMapping.status]?.trim().toLowerCase() || 'valid') as 'valid' | 'refunded' | 'cancelled';
        const externalOrderId = row[columnMapping.externalOrderId]?.trim() || '';

        // Validate email
        if (!email || !email.includes('@')) {
          errors.push(t('orderCsvImport.validation.invalidEmail'));
        }

        // Validate event
        const eventExists = events?.some(e => e.id === eventId);
        if (!eventId) {
          errors.push(t('orderCsvImport.validation.missingEventId'));
        } else if (!eventExists) {
          errors.push(t('orderCsvImport.validation.eventNotFound', { eventId }));
        }

        // Validate ticket tier
        const tier = ticketTiers?.find(t => t.id === tierId);
        if (!tierId) {
          errors.push(t('orderCsvImport.validation.missingTicketTierId'));
        } else if (!tier) {
          errors.push(t('orderCsvImport.validation.ticketTierNotFound', { tierId }));
        } else if (tier.event_id !== eventId) {
          errors.push(t('orderCsvImport.validation.tierEventMismatch'));
        }

        // Parse numbers
        const quantity = parseInt(quantityStr, 10) || 1;
        const unitPriceCents = parseInt(unitPriceStr, 10) || 0;
        const unitFeeCents = parseInt(unitFeeStr, 10) || 0;
        const totalCents = quantity * (unitPriceCents + unitFeeCents);

        if (quantity < 1) {
          errors.push(t('orderCsvImport.validation.invalidQuantity'));
        }

        // Check for duplicate
        const isDuplicate = externalOrderId ? existingExternalIds.has(externalOrderId) : false;

        // Look up existing user
        const existingUserId = email ? emailToUserId.get(email) || null : null;

        parsed.push({
          rowIndex: i + 2, // +2 for header row and 0-indexing
          customerEmail: email,
          customerName: name,
          eventId,
          eventName: events?.find(e => e.id === eventId)?.title,
          ticketTierId: tierId,
          ticketTierName: tier?.name,
          quantity,
          unitPriceCents,
          unitFeeCents,
          totalCents,
          orderDate,
          status,
          externalOrderId,
          validationErrors: errors,
          existingUserId,
          isDuplicate,
        });
      }

      setParsedOrders(parsed);
      setStep('preview');
    } catch (error) {
      logger.error('Error validating CSV data', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'OrderCsvImport.validateOrders',
      });
      toast.error(t('orderCsvImport.errors.validationFailed'));
    } finally {
      setIsValidating(false);
    }
  }, [csvData, columnMapping, events, ticketTiers, t]);

  // Import valid orders
  const importOrders = useCallback(async () => {
    const validOrders = parsedOrders.filter(o => o.validationErrors.length === 0 && !o.isDuplicate);

    if (validOrders.length === 0) {
      toast.error(t('orderCsvImport.errors.noValidOrders'));
      return;
    }

    setIsImporting(true);
    const results: ImportResult[] = [];

    try {
      for (const order of validOrders) {
        // Create order
        // Note: customer_email and nullable user_id are added via migration
        // but types haven't been regenerated yet, so we use explicit typing
        const orderInsert = {
          event_id: order.eventId,
          user_id: order.existingUserId || undefined,
          customer_email: order.customerEmail,
          status: order.status === 'valid' ? 'completed' : order.status,
          subtotal_cents: order.quantity * order.unitPriceCents,
          fees_cents: order.quantity * order.unitFeeCents,
          total_cents: order.totalCents,
          currency: 'usd',
          created_at: order.orderDate,
        };

        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert(orderInsert as any)
          .select()
          .single();

        if (orderError) {
          logger.error('Error creating order', {
            error: orderError.message,
            email: order.customerEmail,
            source: 'OrderCsvImport.importOrders',
          });
          continue;
        }

        // Create order item
        const { data: orderItem, error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: newOrder.id,
            item_type: 'ticket',
            ticket_tier_id: order.ticketTierId,
            quantity: order.quantity,
            unit_price_cents: order.unitPriceCents,
            unit_fee_cents: order.unitFeeCents,
          })
          .select()
          .single();

        if (itemError) {
          logger.error('Error creating order item', {
            error: itemError.message,
            orderId: newOrder.id,
            source: 'OrderCsvImport.importOrders',
          });
          continue;
        }

        // Create individual tickets
        const ticketsToCreate = [];
        for (let i = 0; i < order.quantity; i++) {
          ticketsToCreate.push({
            order_id: newOrder.id,
            order_item_id: orderItem.id,
            ticket_tier_id: order.ticketTierId,
            event_id: order.eventId,
            attendee_name: order.customerName,
            attendee_email: order.customerEmail,
            qr_code_data: `IMPORT-${newOrder.id}-${i}-${Date.now()}`,
            status: order.status,
            has_protection: false,
          });
        }

        const { error: ticketsError } = await supabase
          .from('tickets')
          .insert(ticketsToCreate);

        if (ticketsError) {
          logger.error('Error creating tickets', {
            error: ticketsError.message,
            orderId: newOrder.id,
            source: 'OrderCsvImport.importOrders',
          });
        }

        results.push({
          orderId: newOrder.id,
          ticketCount: order.quantity,
          email: order.customerEmail,
        });
      }

      setImportResults(results);
      setStep('complete');
      toast.success(t('orderCsvImport.success', { count: results.length }));
    } catch (error) {
      logger.error('Error importing orders', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'OrderCsvImport.importOrders',
      });
      toast.error(t('orderCsvImport.errors.importFailed'));
    } finally {
      setIsImporting(false);
    }
  }, [parsedOrders, t]);

  // Reset to start over
  const handleReset = () => {
    setCsvHeaders([]);
    setCsvData([]);
    setParsedOrders([]);
    setImportResults([]);
    setStep('upload');
  };

  // Stats for preview
  const stats = useMemo(() => {
    const valid = parsedOrders.filter(o => o.validationErrors.length === 0 && !o.isDuplicate);
    const invalid = parsedOrders.filter(o => o.validationErrors.length > 0);
    const duplicates = parsedOrders.filter(o => o.isDuplicate);
    const withUser = valid.filter(o => o.existingUserId);
    const orphaned = valid.filter(o => !o.existingUserId);
    const totalTickets = valid.reduce((sum, o) => sum + o.quantity, 0);
    const totalRevenue = valid.reduce((sum, o) => sum + o.totalCents, 0);

    return { valid, invalid, duplicates, withUser, orphaned, totalTickets, totalRevenue };
  }, [parsedOrders]);

  return (
    <DemoLayout
      title={t('orderCsvImport.title')}
      description={t('orderCsvImport.description')}
      icon={FileSpreadsheet}
    >
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Step indicator */}
        <div className='flex items-center justify-center gap-2 text-sm'>
          {['upload', 'map', 'preview', 'complete'].map((s, idx) => (
            <React.Fragment key={s}>
              <div className={cn(
                'px-3 py-1 rounded-full border',
                step === s ? 'bg-fm-gold text-black border-fm-gold' :
                  ['upload', 'map', 'preview', 'complete'].indexOf(step) > idx ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-white/5 text-muted-foreground border-white/20'
              )}>
                {t(`orderCsvImport.steps.${s}`)}
              </div>
              {idx < 3 && <div className='w-8 h-px bg-white/20' />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className='border border-dashed border-white/30 rounded-lg p-12 text-center hover:border-fm-gold/50 transition-colors'>
            <Upload className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
            <p className='text-lg mb-4'>{t('orderCsvImport.uploadPrompt')}</p>
            <input
              type='file'
              accept='.csv'
              onChange={handleFileUpload}
              className='hidden'
              id='csv-upload'
            />
            <label
              htmlFor='csv-upload'
              className='inline-block px-6 py-2 bg-fm-gold text-black font-medium cursor-pointer hover:bg-fm-gold/90 transition-colors'
            >
              {t('orderCsvImport.selectFile')}
            </label>
            <p className='text-sm text-muted-foreground mt-4'>
              {t('orderCsvImport.fileRequirements')}
            </p>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'map' && (
          <div className='space-y-6'>
            <div className='bg-white/5 border border-white/10 p-4'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='font-medium'>{t('orderCsvImport.columnMapping')}</h3>
                <button
                  onClick={() => setShowMapping(!showMapping)}
                  className='text-sm text-fm-gold flex items-center gap-1'
                >
                  {showMapping ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
                  {showMapping ? t('orderCsvImport.hideMapping') : t('orderCsvImport.showMapping')}
                </button>
              </div>

              {showMapping && (
                <div className='grid grid-cols-2 gap-4'>
                  {Object.entries(columnMapping).map(([field, value]) => (
                    <div key={field} className='flex items-center gap-2'>
                      <label className='text-sm text-muted-foreground w-32'>
                        {t(`orderCsvImport.fields.${field}`)}
                      </label>
                      <select
                        value={value}
                        onChange={(e) => setColumnMapping(prev => ({ ...prev, [field]: e.target.value }))}
                        className='flex-1 bg-black border border-white/20 px-2 py-1 text-sm focus:border-fm-gold outline-none'
                      >
                        <option value=''>{t('orderCsvImport.selectColumn')}</option>
                        {csvHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className='bg-white/5 border border-white/10 p-4'>
              <h3 className='font-medium mb-2'>{t('orderCsvImport.dataPreview')}</h3>
              <p className='text-sm text-muted-foreground mb-4'>
                {t('orderCsvImport.rowCount', { count: csvData.length })}
              </p>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-white/10'>
                      {csvHeaders.slice(0, 6).map(header => (
                        <th key={header} className='text-left p-2 text-muted-foreground'>{header}</th>
                      ))}
                      {csvHeaders.length > 6 && <th className='p-2 text-muted-foreground'>...</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 3).map((row, idx) => (
                      <tr key={idx} className='border-b border-white/5'>
                        {csvHeaders.slice(0, 6).map(header => (
                          <td key={header} className='p-2 truncate max-w-32'>{row[header]}</td>
                        ))}
                        {csvHeaders.length > 6 && <td className='p-2'>...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className='flex justify-between'>
              <FmCommonButton variant='secondary' onClick={handleReset}>
                {t('orderCsvImport.back')}
              </FmCommonButton>
              <FmCommonButton
                variant='gold'
                onClick={validateOrders}
                disabled={isValidating || !columnMapping.customerEmail || !columnMapping.eventId || !columnMapping.ticketTierId}
              >
                {isValidating ? <FmCommonLoadingSpinner size='sm' /> : t('orderCsvImport.validateData')}
              </FmCommonButton>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Import */}
        {step === 'preview' && (
          <div className='space-y-6'>
            {/* Stats */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='bg-green-500/10 border border-green-500/30 p-4'>
                <div className='text-2xl font-bold text-green-400'>{stats.valid.length}</div>
                <div className='text-sm text-muted-foreground'>{t('orderCsvImport.stats.valid')}</div>
              </div>
              <div className='bg-red-500/10 border border-red-500/30 p-4'>
                <div className='text-2xl font-bold text-red-400'>{stats.invalid.length}</div>
                <div className='text-sm text-muted-foreground'>{t('orderCsvImport.stats.invalid')}</div>
              </div>
              <div className='bg-blue-500/10 border border-blue-500/30 p-4'>
                <div className='text-2xl font-bold text-blue-400'>{stats.withUser.length}</div>
                <div className='text-sm text-muted-foreground'>{t('orderCsvImport.stats.withUser')}</div>
              </div>
              <div className='bg-orange-500/10 border border-orange-500/30 p-4'>
                <div className='text-2xl font-bold text-orange-400'>{stats.orphaned.length}</div>
                <div className='text-sm text-muted-foreground'>{t('orderCsvImport.stats.orphaned')}</div>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='bg-white/5 border border-white/10 p-4'>
                <div className='text-xl font-bold'>{stats.totalTickets}</div>
                <div className='text-sm text-muted-foreground'>{t('orderCsvImport.stats.totalTickets')}</div>
              </div>
              <div className='bg-white/5 border border-white/10 p-4'>
                <div className='text-xl font-bold'>${(stats.totalRevenue / 100).toFixed(2)}</div>
                <div className='text-sm text-muted-foreground'>{t('orderCsvImport.stats.totalRevenue')}</div>
              </div>
            </div>

            {/* Order list */}
            <div className='bg-white/5 border border-white/10 max-h-96 overflow-y-auto'>
              <table className='w-full text-sm'>
                <thead className='sticky top-0 bg-black/90'>
                  <tr className='border-b border-white/10'>
                    <th className='text-left p-2'>{t('orderCsvImport.table.row')}</th>
                    <th className='text-left p-2'>{t('orderCsvImport.table.email')}</th>
                    <th className='text-left p-2'>{t('orderCsvImport.table.event')}</th>
                    <th className='text-left p-2'>{t('orderCsvImport.table.tier')}</th>
                    <th className='text-left p-2'>{t('orderCsvImport.table.qty')}</th>
                    <th className='text-left p-2'>{t('orderCsvImport.table.total')}</th>
                    <th className='text-left p-2'>{t('orderCsvImport.table.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedOrders.map((order) => (
                    <tr
                      key={order.rowIndex}
                      className={cn(
                        'border-b border-white/5',
                        order.validationErrors.length > 0 && 'bg-red-500/10',
                        order.isDuplicate && 'bg-yellow-500/10'
                      )}
                    >
                      <td className='p-2'>{order.rowIndex}</td>
                      <td className='p-2'>
                        <div className='flex items-center gap-1'>
                          {order.customerEmail}
                          {order.existingUserId && (
                            <span title={t('orderCsvImport.userFound')}>
                              <CheckCircle className='h-3 w-3 text-green-400' />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='p-2 truncate max-w-32'>{order.eventName || order.eventId}</td>
                      <td className='p-2'>{order.ticketTierName || order.ticketTierId}</td>
                      <td className='p-2'>{order.quantity}</td>
                      <td className='p-2'>${(order.totalCents / 100).toFixed(2)}</td>
                      <td className='p-2'>
                        {order.validationErrors.length > 0 ? (
                          <div className='flex items-center gap-1 text-red-400'>
                            <AlertCircle className='h-3 w-3' />
                            <span className='text-xs'>{order.validationErrors[0]}</span>
                          </div>
                        ) : order.isDuplicate ? (
                          <span className='text-yellow-400 text-xs'>{t('orderCsvImport.duplicate')}</span>
                        ) : (
                          <span className='text-green-400 text-xs'>{t('orderCsvImport.ready')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className='flex justify-between'>
              <FmCommonButton variant='secondary' onClick={() => setStep('map')}>
                {t('orderCsvImport.back')}
              </FmCommonButton>
              <FmCommonButton
                variant='gold'
                onClick={importOrders}
                disabled={isImporting || stats.valid.length === 0}
              >
                {isImporting ? <FmCommonLoadingSpinner size='sm' /> : t('orderCsvImport.importOrders', { count: stats.valid.length })}
              </FmCommonButton>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className='text-center space-y-6'>
            <CheckCircle className='h-16 w-16 text-green-400 mx-auto' />
            <h2 className='text-2xl font-canela'>{t('orderCsvImport.complete.title')}</h2>
            <p className='text-muted-foreground'>
              {t('orderCsvImport.complete.description', { count: importResults.length })}
            </p>

            <div className='bg-white/5 border border-white/10 p-4 max-h-64 overflow-y-auto text-left'>
              <h3 className='font-medium mb-2'>{t('orderCsvImport.complete.importedOrders')}</h3>
              <ul className='space-y-1 text-sm'>
                {importResults.map((result, idx) => (
                  <li key={idx} className='flex justify-between'>
                    <span>{result.email}</span>
                    <span className='text-muted-foreground'>{result.ticketCount} {t('orderCsvImport.complete.tickets')}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='flex justify-center gap-4'>
              <FmCommonButton variant='secondary' onClick={handleReset}>
                {t('orderCsvImport.importAnother')}
              </FmCommonButton>
            </div>
          </div>
        )}

        {/* Info box */}
        <div className='bg-fm-gold/10 border border-fm-gold/30 p-4 text-sm'>
          <h4 className='font-medium text-fm-gold mb-2'>{t('orderCsvImport.info.title')}</h4>
          <ul className='list-disc list-inside space-y-1 text-muted-foreground'>
            <li>{t('orderCsvImport.info.point1')}</li>
            <li>{t('orderCsvImport.info.point2')}</li>
            <li>{t('orderCsvImport.info.point3')}</li>
            <li>{t('orderCsvImport.info.point4')}</li>
          </ul>
        </div>
      </div>
    </DemoLayout>
  );
}
