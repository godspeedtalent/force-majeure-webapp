/**
 * Template Configuration Store
 *
 * Zustand store with localStorage persistence for template configurations.
 * Allows developers to customize templates and preview changes.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  EmailTemplateConfig,
  PDFTemplateConfig,
  EmailTemplateId,
  PDFTemplateId,
} from '../types';
import {
  DEFAULT_EMAIL_CONFIGS,
  DEFAULT_PDF_CONFIGS,
} from '../config/defaults';

interface TemplateConfigState {
  // Current configurations
  emailConfigs: Record<EmailTemplateId, EmailTemplateConfig>;
  pdfConfigs: Record<PDFTemplateId, PDFTemplateConfig>;

  // Selected template for editing
  selectedTemplateType: 'email' | 'pdf';
  selectedEmailId: EmailTemplateId;
  selectedPdfId: PDFTemplateId;

  // Actions
  setSelectedTemplateType: (type: 'email' | 'pdf') => void;
  setSelectedEmailId: (id: EmailTemplateId) => void;
  setSelectedPdfId: (id: PDFTemplateId) => void;

  // Email config updates
  updateEmailConfig: (
    id: EmailTemplateId,
    updates: Partial<EmailTemplateConfig>
  ) => void;
  updateEmailColors: (
    id: EmailTemplateId,
    colors: Partial<EmailTemplateConfig['colors']>
  ) => void;
  updateEmailTypography: (
    id: EmailTemplateId,
    typography: Partial<EmailTemplateConfig['typography']>
  ) => void;
  updateEmailSpacing: (
    id: EmailTemplateId,
    spacing: Partial<EmailTemplateConfig['spacing']>
  ) => void;
  updateEmailContent: (
    id: EmailTemplateId,
    content: Partial<EmailTemplateConfig['content']>
  ) => void;
  updateEmailToggles: (
    id: EmailTemplateId,
    toggles: Partial<EmailTemplateConfig['toggles']>
  ) => void;

  // PDF config updates
  updatePDFConfig: (
    id: PDFTemplateId,
    updates: Partial<PDFTemplateConfig>
  ) => void;
  updatePDFColors: (
    id: PDFTemplateId,
    colors: Partial<PDFTemplateConfig['colors']>
  ) => void;
  updatePDFTypography: (
    id: PDFTemplateId,
    typography: Partial<PDFTemplateConfig['typography']>
  ) => void;
  updatePDFSpacing: (
    id: PDFTemplateId,
    spacing: Partial<PDFTemplateConfig['spacing']>
  ) => void;
  updatePDFContent: (
    id: PDFTemplateId,
    content: Partial<PDFTemplateConfig['content']>
  ) => void;
  updatePDFToggles: (
    id: PDFTemplateId,
    toggles: Partial<PDFTemplateConfig['toggles']>
  ) => void;

  // Utility actions
  resetToDefaults: () => void;
  resetEmailToDefault: (id: EmailTemplateId) => void;
  resetPDFToDefault: (id: PDFTemplateId) => void;
  exportConfigs: () => string;
  importConfigs: (json: string) => boolean;

  // Getters
  getCurrentEmailConfig: () => EmailTemplateConfig;
  getCurrentPDFConfig: () => PDFTemplateConfig;
}

export const useTemplateConfigStore = create<TemplateConfigState>()(
  persist(
    (set, get) => ({
      // Initial state
      emailConfigs: DEFAULT_EMAIL_CONFIGS as Record<
        EmailTemplateId,
        EmailTemplateConfig
      >,
      pdfConfigs: DEFAULT_PDF_CONFIGS as Record<PDFTemplateId, PDFTemplateConfig>,
      selectedTemplateType: 'email',
      selectedEmailId: 'order-receipt',
      selectedPdfId: 'ticket',

      // Selection actions
      setSelectedTemplateType: type =>
        set({ selectedTemplateType: type }),
      setSelectedEmailId: id => set({ selectedEmailId: id }),
      setSelectedPdfId: id => set({ selectedPdfId: id }),

      // Email config updates
      updateEmailConfig: (id, updates) =>
        set(state => ({
          emailConfigs: {
            ...state.emailConfigs,
            [id]: { ...state.emailConfigs[id], ...updates },
          },
        })),

      updateEmailColors: (id, colors) =>
        set(state => ({
          emailConfigs: {
            ...state.emailConfigs,
            [id]: {
              ...state.emailConfigs[id],
              colors: { ...state.emailConfigs[id].colors, ...colors },
            },
          },
        })),

      updateEmailTypography: (id, typography) =>
        set(state => ({
          emailConfigs: {
            ...state.emailConfigs,
            [id]: {
              ...state.emailConfigs[id],
              typography: {
                ...state.emailConfigs[id].typography,
                ...typography,
              },
            },
          },
        })),

      updateEmailSpacing: (id, spacing) =>
        set(state => ({
          emailConfigs: {
            ...state.emailConfigs,
            [id]: {
              ...state.emailConfigs[id],
              spacing: { ...state.emailConfigs[id].spacing, ...spacing },
            },
          },
        })),

      updateEmailContent: (id, content) =>
        set(state => ({
          emailConfigs: {
            ...state.emailConfigs,
            [id]: {
              ...state.emailConfigs[id],
              content: { ...state.emailConfigs[id].content, ...content },
            },
          },
        })),

      updateEmailToggles: (id, toggles) =>
        set(state => ({
          emailConfigs: {
            ...state.emailConfigs,
            [id]: {
              ...state.emailConfigs[id],
              toggles: { ...state.emailConfigs[id].toggles, ...toggles },
            },
          },
        })),

      // PDF config updates
      updatePDFConfig: (id, updates) =>
        set(state => ({
          pdfConfigs: {
            ...state.pdfConfigs,
            [id]: { ...state.pdfConfigs[id], ...updates },
          },
        })),

      updatePDFColors: (id, colors) =>
        set(state => ({
          pdfConfigs: {
            ...state.pdfConfigs,
            [id]: {
              ...state.pdfConfigs[id],
              colors: { ...state.pdfConfigs[id].colors, ...colors },
            },
          },
        })),

      updatePDFTypography: (id, typography) =>
        set(state => ({
          pdfConfigs: {
            ...state.pdfConfigs,
            [id]: {
              ...state.pdfConfigs[id],
              typography: {
                ...state.pdfConfigs[id].typography,
                ...typography,
              },
            },
          },
        })),

      updatePDFSpacing: (id, spacing) =>
        set(state => ({
          pdfConfigs: {
            ...state.pdfConfigs,
            [id]: {
              ...state.pdfConfigs[id],
              spacing: { ...state.pdfConfigs[id].spacing, ...spacing },
            },
          },
        })),

      updatePDFContent: (id, content) =>
        set(state => ({
          pdfConfigs: {
            ...state.pdfConfigs,
            [id]: {
              ...state.pdfConfigs[id],
              content: { ...state.pdfConfigs[id].content, ...content },
            },
          },
        })),

      updatePDFToggles: (id, toggles) =>
        set(state => ({
          pdfConfigs: {
            ...state.pdfConfigs,
            [id]: {
              ...state.pdfConfigs[id],
              toggles: { ...state.pdfConfigs[id].toggles, ...toggles },
            },
          },
        })),

      // Utility actions
      resetToDefaults: () =>
        set({
          emailConfigs: DEFAULT_EMAIL_CONFIGS as Record<
            EmailTemplateId,
            EmailTemplateConfig
          >,
          pdfConfigs: DEFAULT_PDF_CONFIGS as Record<
            PDFTemplateId,
            PDFTemplateConfig
          >,
        }),

      resetEmailToDefault: id =>
        set(state => ({
          emailConfigs: {
            ...state.emailConfigs,
            [id]: DEFAULT_EMAIL_CONFIGS[id],
          },
        })),

      resetPDFToDefault: id =>
        set(state => ({
          pdfConfigs: {
            ...state.pdfConfigs,
            [id]: DEFAULT_PDF_CONFIGS[id],
          },
        })),

      exportConfigs: () => {
        const state = get();
        return JSON.stringify(
          {
            emailConfigs: state.emailConfigs,
            pdfConfigs: state.pdfConfigs,
          },
          null,
          2
        );
      },

      importConfigs: json => {
        try {
          const parsed = JSON.parse(json);
          if (parsed.emailConfigs && parsed.pdfConfigs) {
            set({
              emailConfigs: parsed.emailConfigs,
              pdfConfigs: parsed.pdfConfigs,
            });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      // Getters
      getCurrentEmailConfig: () => {
        const state = get();
        return state.emailConfigs[state.selectedEmailId];
      },

      getCurrentPDFConfig: () => {
        const state = get();
        return state.pdfConfigs[state.selectedPdfId];
      },
    }),
    {
      name: 'template-designer-storage',
      partialize: state => ({
        emailConfigs: state.emailConfigs,
        pdfConfigs: state.pdfConfigs,
      }),
    }
  )
);
