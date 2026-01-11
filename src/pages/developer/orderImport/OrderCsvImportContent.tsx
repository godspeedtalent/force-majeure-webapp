/**
 * OrderCsvImportContent - Refactored Order CSV Import Component
 *
 * This component orchestrates a multi-step wizard for importing orders from CSV.
 * Each step is extracted into its own component for maintainability.
 */

import { useTranslation } from 'react-i18next';
import { useOrderImport } from './useOrderImport';
import {
  StepIndicator,
  HomeStep,
  ConfigureStep,
  UploadStep,
  MapStep,
  PreviewStep,
  CompleteStep,
} from './components';

const STEPS = ['home', 'configure', 'upload', 'map', 'preview', 'complete'] as const;

export function OrderCsvImportContent() {
  const { t } = useTranslation('common');
  const importState = useOrderImport();

  const {
    step,
    setStep,
    selectedEventId,
    setSelectedEventId,
    setSelectedTicketTierId,
    selectedEvent,
    setSelectedEvent,
    csvHeaders,
    columnMapping,
    setColumnMapping,
    lineItems,
    setLineItems,
    parsedOrders,
    importResults,
    previewFilter,
    setPreviewFilter,
    showMapping,
    setShowMapping,
    showLineItems,
    setShowLineItems,
    expandedSections,
    setExpandedSections,
    isValidating,
    isImporting,
    isRollingBack,
    isDeleting,
    historyLoading,
    tiersLoading,
    tierOptions,
    ticketTiers,
    eventDetails,
    stats,
    filteredOrders,
    importHistory,
    unmappedColumns,
    unmappedAssignments,
    setUnmappedAssignments,
    handleFileUpload,
    validateOrders,
    importOrders,
    rollbackProcess,
    deleteProcess,
    setupRerun,
    canRerun,
    isRerunning,
    reset,
    refetchHistory,
  } = importState;

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Step indicator */}
      <StepIndicator
        currentStep={step}
        steps={STEPS}
        onStepClick={(s) => setStep(s as typeof step)}
        t={t}
      />

      {/* STEP 0: HOME */}
      {step === 'home' && (
        <HomeStep
          onStartNew={() => setStep('configure')}
          onRefetchHistory={refetchHistory}
          onRollback={rollbackProcess}
          onDelete={deleteProcess}
          onRerun={setupRerun}
          canRerun={canRerun}
          historyLoading={historyLoading}
          importHistory={importHistory}
          isRollingBack={isRollingBack}
          isDeleting={isDeleting}
          isRerunning={isRerunning}
        />
      )}

      {/* STEP 1: CONFIGURE */}
      {step === 'configure' && (
        <ConfigureStep
          selectedEventId={selectedEventId}
          selectedEvent={selectedEvent}
          ticketTiers={ticketTiers}
          tiersLoading={tiersLoading}
          onEventChange={(id, event) => {
            setSelectedEventId(id || '');
            setSelectedEvent(event);
            setSelectedTicketTierId('');
          }}
          onContinue={() => setStep('upload')}
        />
      )}

      {/* STEP 2: UPLOAD */}
      {step === 'upload' && (
        <UploadStep
          selectedEvent={selectedEvent}
          onBack={() => setStep('configure')}
          onFileSelect={handleFileUpload}
          uploadPromptText={t('orderCsvImport.uploadPrompt')}
          fileRequirementsText={t('orderCsvImport.fileRequirements')}
        />
      )}

      {/* STEP 3: MAP */}
      {step === 'map' && (
        <MapStep
          selectedEvent={selectedEvent}
          csvHeaders={csvHeaders}
          columnMapping={columnMapping}
          setColumnMapping={setColumnMapping}
          lineItems={lineItems}
          setLineItems={setLineItems}
          showMapping={showMapping}
          setShowMapping={setShowMapping}
          showLineItems={showLineItems}
          setShowLineItems={setShowLineItems}
          expandedSections={expandedSections}
          setExpandedSections={setExpandedSections}
          tierOptions={tierOptions}
          eventDetails={eventDetails}
          unmappedColumns={unmappedColumns}
          unmappedAssignments={unmappedAssignments}
          setUnmappedAssignments={setUnmappedAssignments}
          isValidating={isValidating}
          onBack={() => setStep('upload')}
          onValidate={validateOrders}
          columnMappingTitle={t('orderCsvImport.columnMapping')}
          hideMapping={t('orderCsvImport.hideMapping')}
          showMappingText={t('orderCsvImport.showMapping')}
        />
      )}

      {/* STEP 4: PREVIEW */}
      {step === 'preview' && (
        <PreviewStep
          parsedOrders={parsedOrders}
          filteredOrders={filteredOrders}
          stats={stats}
          previewFilter={previewFilter}
          setPreviewFilter={setPreviewFilter}
          isImporting={isImporting}
          importResults={importResults}
          onBack={() => setStep('map')}
          onImport={importOrders}
        />
      )}

      {/* STEP 5: COMPLETE */}
      {step === 'complete' && (
        <CompleteStep
          importResults={importResults}
          onReset={reset}
          onViewHistory={() => setStep('home')}
          onRetry={() => setStep('preview')}
        />
      )}
    </div>
  );
}

export default OrderCsvImportContent;
