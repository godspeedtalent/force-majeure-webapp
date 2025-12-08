import { useState } from 'react';

export function useCatalogState() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadingOverlay, setLoadingOverlay] = useState(false);
  const [formValues, setFormValues] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return {
    confirmOpen,
    setConfirmOpen,
    loadingOverlay,
    setLoadingOverlay,
    formValues,
    setFormValues,
    modalOpen,
    setModalOpen,
  };
}
