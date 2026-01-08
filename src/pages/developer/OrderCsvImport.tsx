import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmFileDropzone } from '@/components/common/forms/FmFileDropzone';
import { FmCommonSelect, SelectOption } from '@/components/common/forms/FmCommonSelect';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmCommonStatCard } from '@/components/common/display/FmCommonStatCard';
import { FmEventSearchDropdown } from '@/components/common/search/FmEventSearchDropdown';
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
  quantity: number;
  unitPriceCents: number;
  unitFeeCents: number;
  totalCents: number;
  orderDate: string;
  status: 'completed' | 'refunded' | 'cancelled';
  externalOrderId?: string;
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

// Column mapping configuration - maps Order table fields to CSV columns
// These are the actual database fields we're populating
interface ColumnMapping {
  // Profile/customer fields
  customer_email: string;      // Required: profiles.email lookup / order customer
  customer_name: string;       // Optional: attendee name for tickets
  // Order fields
  subtotal_cents: string;      // Optional: price before fees (can calculate)
  fees_cents: string;          // Optional: service fees
  // Order item fields
  quantity: string;            // Required: number of tickets
  unit_price_cents: string;    // Optional: price per ticket
  unit_fee_cents: string;      // Optional: fee per ticket
  // Metadata
  created_at: string;          // Optional: order date
  status: string;              // Optional: completed/refunded/cancelled
  external_order_id: string;   // Optional: for deduplication
}

const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  customer_email: '',
  customer_name: '',
  subtotal_cents: '',
  fees_cents: '',
  quantity: '',
  unit_price_cents: '',
  unit_fee_cents: '',
  created_at: '',
  status: '',
  external_order_id: '',
};

// Field descriptions for the mapping UI
const FIELD_DESCRIPTIONS: Record<keyof ColumnMapping, { label: string; required: boolean; description: string }> = {
  customer_email: { label: 'Customer Email', required: true, description: 'Email address of the ticket purchaser' },
  customer_name: { label: 'Customer Name', required: false, description: 'Name for ticket attendee' },
  quantity: { label: 'Quantity', required: true, description: 'Number of tickets in this order' },
  unit_price_cents: { label: 'Unit Price (cents)', required: false, description: 'Price per ticket in cents' },
  unit_fee_cents: { label: 'Unit Fee (cents)', required: false, description: 'Fee per ticket in cents' },
  subtotal_cents: { label: 'Subtotal (cents)', required: false, description: 'Total price before fees' },
  fees_cents: { label: 'Fees (cents)', required: false, description: 'Total fees for order' },
  created_at: { label: 'Order Date', required: false, description: 'When the order was placed' },
  status: { label: 'Status', required: false, description: 'Order status (completed/refunded/cancelled)' },
  external_order_id: { label: 'External Order ID', required: false, description: 'Original order ID for deduplication' },
};

/**
 * OrderCsvImportContent - The main content without layout wrapper
 * Used within DeveloperHome as tab content
 */
export function OrderCsvImportContent() {
  const { t } = useTranslation('common');

  // Configuration state - constants for all orders
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedTicketTierId, setSelectedTicketTierId] = useState<string>('');

  // CSV state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>(DEFAULT_COLUMN_MAPPING);
  const [parsedOrders, setParsedOrders] = useState<ParsedOrder[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [showMapping, setShowMapping] = useState(true);
  const [step, setStep] = useState<'configure' | 'upload' | 'map' | 'preview' | 'complete'>('configure');
  // Store selected event object from search dropdown
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; title: string } | null>(null);

  // Fetch ticket tiers for the selected event
  const { data: ticketTiers, isLoading: tiersLoading } = useQuery({
    queryKey: ['ticket-tiers-for-import', selectedEventId],
    queryFn: async () => {
      if (!selectedEventId) return [];
      const { data, error } = await supabase
        .from('ticket_tiers')
        .select('id, name, price_cents')
        .eq('event_id', selectedEventId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedEventId,
  });

  // Get selected tier details
  const selectedTier = ticketTiers?.find(t => t.id === selectedTicketTierId);

  // Ticket tier options for select (only shown after event is selected)
  const tierOptions: SelectOption[] = useMemo(() => {
    if (!ticketTiers || ticketTiers.length === 0) return [];
    return ticketTiers.map(t => ({
      value: t.id,
      label: `${t.name} ($${(t.price_cents / 100).toFixed(2)})`,
    }));
  }, [ticketTiers]);

  // Parse CSV file
  const handleFileUpload = useCallback((file: File) => {
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

    reader.readAsText(file);
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
    const newMapping = { ...DEFAULT_COLUMN_MAPPING };

    const mappingPatterns: Record<keyof ColumnMapping, string[]> = {
      customer_email: ['email', 'customeremail', 'buyeremail', 'purchaseremail', 'attendeeemail'],
      customer_name: ['name', 'customername', 'buyername', 'fullname', 'attendeename'],
      quantity: ['quantity', 'qty', 'count', 'tickets', 'numtickets'],
      unit_price_cents: ['unitpricecents', 'pricecents', 'unitprice', 'ticketprice'],
      unit_fee_cents: ['unitfeecents', 'feecents', 'ticketfee'],
      subtotal_cents: ['subtotalcents', 'subtotal', 'pricetotal'],
      fees_cents: ['feescents', 'totalfees', 'servicefee', 'fee'],
      created_at: ['createdat', 'orderdate', 'date', 'purchasedate', 'ordertime'],
      status: ['status', 'orderstatus', 'ticketstatus', 'state'],
      external_order_id: ['externalorderid', 'orderid', 'referenceid', 'transactionid', 'originalorderid'],
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
        .map(row => row[columnMapping.external_order_id])
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

        const email = row[columnMapping.customer_email]?.trim().toLowerCase() || '';
        const name = row[columnMapping.customer_name]?.trim() || '';
        const quantityStr = row[columnMapping.quantity]?.trim() || '1';
        const unitPriceStr = row[columnMapping.unit_price_cents]?.trim() || '';
        const unitFeeStr = row[columnMapping.unit_fee_cents]?.trim() || '0';
        const orderDate = row[columnMapping.created_at]?.trim() || new Date().toISOString();
        const statusRaw = row[columnMapping.status]?.trim().toLowerCase() || 'completed';
        const externalOrderId = row[columnMapping.external_order_id]?.trim() || '';

        // Normalize status
        let status: 'completed' | 'refunded' | 'cancelled' = 'completed';
        if (statusRaw === 'refunded' || statusRaw === 'refund') status = 'refunded';
        else if (statusRaw === 'cancelled' || statusRaw === 'canceled') status = 'cancelled';

        // Validate email
        if (!email || !email.includes('@')) {
          errors.push('Invalid email address');
        }

        // Parse numbers
        const quantity = parseInt(quantityStr, 10) || 1;
        // Use tier price if unit price not provided
        const unitPriceCents = unitPriceStr ? parseInt(unitPriceStr, 10) : (selectedTier?.price_cents || 0);
        const unitFeeCents = parseInt(unitFeeStr, 10) || 0;
        const totalCents = quantity * (unitPriceCents + unitFeeCents);

        if (quantity < 1) {
          errors.push('Quantity must be at least 1');
        }

        // Check for duplicate
        const isDuplicate = externalOrderId ? existingExternalIds.has(externalOrderId) : false;

        // Look up existing user
        const existingUserId = email ? emailToUserId.get(email) || null : null;

        parsed.push({
          rowIndex: i + 2, // +2 for header row and 0-indexing
          customerEmail: email,
          customerName: name,
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
  }, [csvData, columnMapping, selectedTier, t]);

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
        const orderInsert = {
          event_id: selectedEventId,
          user_id: order.existingUserId || undefined,
          customer_email: order.customerEmail,
          status: order.status,
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
            ticket_tier_id: selectedTicketTierId,
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
            ticket_tier_id: selectedTicketTierId,
            event_id: selectedEventId,
            attendee_name: order.customerName,
            attendee_email: order.customerEmail,
            qr_code_data: `IMPORT-${newOrder.id}-${i}-${Date.now()}`,
            status: order.status === 'completed' ? 'valid' : order.status,
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
  }, [parsedOrders, selectedEventId, selectedTicketTierId, t]);

  // Reset to start over
  const handleReset = () => {
    setCsvHeaders([]);
    setCsvData([]);
    setParsedOrders([]);
    setImportResults([]);
    setColumnMapping(DEFAULT_COLUMN_MAPPING);
    setStep('configure');
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

  const steps = ['configure', 'upload', 'map', 'preview', 'complete'] as const;

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Step indicator */}
      <div className='flex items-center justify-center gap-2 text-sm pt-6'>
        {steps.map((s, idx) => (
          <React.Fragment key={s}>
            <div className={cn(
              'px-3 py-1 rounded-full border',
              step === s ? 'bg-fm-gold text-black border-fm-gold' :
                steps.indexOf(step) > idx ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-white/5 text-muted-foreground border-white/20'
            )}>
              {t(`orderCsvImport.steps.${s}`)}
            </div>
            {idx < steps.length - 1 && <div className='w-8 h-px bg-white/20' />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Configure - Select Event and Ticket Tier */}
      {step === 'configure' && (
        <div className='space-y-6'>
          <FmCommonCard hoverable={false}>
            <FmCommonCardContent className='p-6'>
              <div className='flex items-center gap-2 mb-4'>
                <Settings className='h-5 w-5 text-fm-gold' />
                <h3 className='font-medium text-lg'>Import Configuration</h3>
              </div>
              <p className='text-sm text-muted-foreground mb-6'>
                Select the event and ticket tier that all imported orders will be associated with.
                This ensures data consistency and simplifies the CSV format.
              </p>

              <div className='space-y-4'>
                <div>
                  <label className='text-xs text-muted-foreground uppercase mb-1 block'>Event *</label>
                  <FmEventSearchDropdown
                    value={selectedEventId}
                    onChange={(id, event) => {
                      setSelectedEventId(id || '');
                      setSelectedEvent(event ? { id: event.id, title: event.title } : null);
                      // Reset ticket tier when event changes
                      setSelectedTicketTierId('');
                    }}
                    placeholder='Search for an event...'
                  />
                </div>

                {selectedEventId && tierOptions.length > 0 && (
                  <FmCommonSelect
                    label='Ticket Tier'
                    value={selectedTicketTierId}
                    onChange={setSelectedTicketTierId}
                    options={tierOptions}
                    placeholder='Select a ticket tier...'
                    disabled={tiersLoading}
                  />
                )}

                {selectedEventId && !tiersLoading && tierOptions.length === 0 && (
                  <div className='p-3 bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-400'>
                    No ticket tiers found for this event. Please create ticket tiers first.
                  </div>
                )}

                {selectedEvent && selectedTier && (
                  <div className='mt-4 p-4 bg-green-500/10 border border-green-500/30 text-sm'>
                    <div className='font-medium text-green-400 mb-2'>Configuration Summary</div>
                    <div className='text-muted-foreground space-y-1'>
                      <div>Event: <span className='text-white'>{selectedEvent.title}</span></div>
                      <div>Ticket Tier: <span className='text-white'>{selectedTier.name}</span></div>
                      <div>Default Price: <span className='text-white'>${(selectedTier.price_cents / 100).toFixed(2)}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </FmCommonCardContent>
          </FmCommonCard>

          <div className='flex justify-end'>
            <FmCommonButton
              variant='gold'
              onClick={() => setStep('upload')}
              disabled={!selectedEventId || !selectedTicketTierId}
            >
              Continue to Upload
            </FmCommonButton>
          </div>
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 'upload' && (
        <div className='space-y-6'>
          {/* Show selected config */}
          <FmCommonCard hoverable={false} className='bg-fm-gold/10 border-fm-gold/30'>
            <FmCommonCardContent className='p-4'>
              <div className='text-sm'>
                <span className='text-fm-gold font-medium'>Importing to:</span>{' '}
                <span className='text-white'>{selectedEvent?.title}</span>
                {' '}&bull;{' '}
                <span className='text-white'>{selectedTier?.name}</span>
                <button
                  onClick={() => setStep('configure')}
                  className='ml-4 text-fm-gold underline hover:no-underline'
                >
                  Change
                </button>
              </div>
            </FmCommonCardContent>
          </FmCommonCard>

          <FmFileDropzone
            accept='.csv'
            onFileSelect={handleFileUpload}
            label={t('orderCsvImport.uploadPrompt')}
            helperText={t('orderCsvImport.fileRequirements')}
          />
        </div>
      )}

      {/* Step 3: Column Mapping */}
      {step === 'map' && (
        <div className='space-y-6'>
          {/* Show selected config */}
          <FmCommonCard hoverable={false} className='bg-fm-gold/10 border-fm-gold/30'>
            <FmCommonCardContent className='p-4'>
              <div className='text-sm'>
                <span className='text-fm-gold font-medium'>Importing to:</span>{' '}
                <span className='text-white'>{selectedEvent?.title}</span>
                {' '}&bull;{' '}
                <span className='text-white'>{selectedTier?.name}</span>
              </div>
            </FmCommonCardContent>
          </FmCommonCard>

          <FmCommonCard hoverable={false}>
            <FmCommonCardContent className='p-4'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <h3 className='font-medium'>{t('orderCsvImport.columnMapping')}</h3>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Map your CSV columns to Order table fields. Required fields are marked with *.
                  </p>
                </div>
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
                  {(Object.entries(FIELD_DESCRIPTIONS) as [keyof ColumnMapping, typeof FIELD_DESCRIPTIONS[keyof ColumnMapping]][]).map(([field, info]) => {
                    const headerOptions: SelectOption[] = [
                      { value: '__not_mapped__', label: '-- Not mapped --' },
                      ...csvHeaders.map(header => ({ value: header, label: header }))
                    ];
                    // Convert empty string to placeholder value for display
                    const displayValue = columnMapping[field] || '__not_mapped__';
                    return (
                      <FmCommonSelect
                        key={field}
                        label={`${info.label}${info.required ? ' *' : ''}`}
                        value={displayValue}
                        onChange={(newValue) => {
                          // Convert placeholder back to empty string for storage
                          const storeValue = newValue === '__not_mapped__' ? '' : newValue;
                          setColumnMapping(prev => ({ ...prev, [field]: storeValue }));
                        }}
                        options={headerOptions}
                        placeholder='-- Not mapped --'
                      />
                    );
                  })}
                </div>
              )}
            </FmCommonCardContent>
          </FmCommonCard>

          <FmCommonCard hoverable={false}>
            <FmCommonCardContent className='p-4'>
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
            </FmCommonCardContent>
          </FmCommonCard>

          <div className='flex justify-between'>
            <FmCommonButton variant='secondary' onClick={() => setStep('upload')}>
              {t('orderCsvImport.back')}
            </FmCommonButton>
            <FmCommonButton
              variant='gold'
              onClick={validateOrders}
              disabled={isValidating || !columnMapping.customer_email || !columnMapping.quantity}
            >
              {isValidating ? <FmCommonLoadingSpinner size='sm' /> : t('orderCsvImport.validateData')}
            </FmCommonButton>
          </div>
        </div>
      )}

      {/* Step 4: Preview & Import */}
      {step === 'preview' && (
        <div className='space-y-6'>
          {/* Show selected config */}
          <FmCommonCard hoverable={false} className='bg-fm-gold/10 border-fm-gold/30'>
            <FmCommonCardContent className='p-4'>
              <div className='text-sm'>
                <span className='text-fm-gold font-medium'>Importing to:</span>{' '}
                <span className='text-white'>{selectedEvent?.title}</span>
                {' '}&bull;{' '}
                <span className='text-white'>{selectedTier?.name}</span>
              </div>
            </FmCommonCardContent>
          </FmCommonCard>

          {/* Stats */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <FmCommonStatCard
              value={stats.valid.length}
              label={t('orderCsvImport.stats.valid')}
              size='sm'
              className='bg-green-500/10 border-green-500/30'
            />
            <FmCommonStatCard
              value={stats.invalid.length}
              label={t('orderCsvImport.stats.invalid')}
              size='sm'
              className='bg-red-500/10 border-red-500/30'
            />
            <FmCommonStatCard
              value={stats.withUser.length}
              label={t('orderCsvImport.stats.withUser')}
              size='sm'
              className='bg-blue-500/10 border-blue-500/30'
            />
            <FmCommonStatCard
              value={stats.orphaned.length}
              label={t('orderCsvImport.stats.orphaned')}
              size='sm'
              className='bg-orange-500/10 border-orange-500/30'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <FmCommonStatCard
              value={stats.totalTickets}
              label={t('orderCsvImport.stats.totalTickets')}
              size='sm'
            />
            <FmCommonStatCard
              value={`$${(stats.totalRevenue / 100).toFixed(2)}`}
              label={t('orderCsvImport.stats.totalRevenue')}
              size='sm'
            />
          </div>

          {/* Order list */}
          <FmCommonCard hoverable={false} className='max-h-96 overflow-y-auto'>
            <table className='w-full text-sm'>
              <thead className='sticky top-0 bg-black/90'>
                <tr className='border-b border-white/10'>
                  <th className='text-left p-2'>{t('orderCsvImport.table.row')}</th>
                  <th className='text-left p-2'>{t('orderCsvImport.table.email')}</th>
                  <th className='text-left p-2'>Name</th>
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
                    <td className='p-2 truncate max-w-32'>{order.customerName || '-'}</td>
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
          </FmCommonCard>

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

      {/* Step 5: Complete */}
      {step === 'complete' && (
        <div className='text-center space-y-6'>
          <CheckCircle className='h-16 w-16 text-green-400 mx-auto' />
          <h2 className='text-2xl font-canela'>{t('orderCsvImport.complete.title')}</h2>
          <p className='text-muted-foreground'>
            {t('orderCsvImport.complete.description', { count: importResults.length })}
          </p>

          <FmCommonCard hoverable={false} className='max-h-64 overflow-y-auto text-left'>
            <FmCommonCardContent className='p-4'>
              <h3 className='font-medium mb-2'>{t('orderCsvImport.complete.importedOrders')}</h3>
              <ul className='space-y-1 text-sm'>
                {importResults.map((result, idx) => (
                  <li key={idx} className='flex justify-between'>
                    <span>{result.email}</span>
                    <span className='text-muted-foreground'>{result.ticketCount} {t('orderCsvImport.complete.tickets')}</span>
                  </li>
                ))}
              </ul>
            </FmCommonCardContent>
          </FmCommonCard>

          <div className='flex justify-center gap-4'>
            <FmCommonButton variant='secondary' onClick={handleReset}>
              {t('orderCsvImport.importAnother')}
            </FmCommonButton>
          </div>
        </div>
      )}

      {/* Info box */}
      <FmCommonCard hoverable={false} className='bg-fm-gold/10 border-fm-gold/30'>
        <FmCommonCardContent className='p-4 text-sm'>
          <h4 className='font-medium text-fm-gold mb-2'>{t('orderCsvImport.info.title')}</h4>
          <ul className='list-disc list-inside space-y-1 text-muted-foreground'>
            <li>{t('orderCsvImport.info.point1')}</li>
            <li>{t('orderCsvImport.info.point2')}</li>
            <li>{t('orderCsvImport.info.point3')}</li>
            <li>{t('orderCsvImport.info.point4')}</li>
          </ul>
        </FmCommonCardContent>
      </FmCommonCard>
    </div>
  );
}

/**
 * OrderCsvImport - Full page with DemoLayout wrapper
 * Used as standalone page at /developer/order-import
 */
export default function OrderCsvImport() {
  const { t } = useTranslation('common');

  return (
    <DemoLayout
      title={t('orderCsvImport.title')}
      description={t('orderCsvImport.description')}
      icon={FileSpreadsheet}
    >
      <OrderCsvImportContent />
    </DemoLayout>
  );
}
