import { create } from "zustand";

export const WIZARD_STEPS = [
  { id: "general", label: "General Info", description: "Identity & categorization" },
  { id: "pricing", label: "Pricing & Fee", description: "Base price & storefront fee" },
  { id: "inventory", label: "Stock & Physical", description: "SKU, inventory & weight" },
  { id: "gallery", label: "Clinical Gallery", description: "Product imagery & shot types" },
  { id: "ai", label: "MedAI & Specs", description: "Content generation & technical specs" },
  { id: "review", label: "Review & Publish", description: "Final validation & submission" },
] as const;

export interface WizardState {
  currentStep: number;
  completedSteps: Set<number>;
  primaryImageIndex: number;
  imageShotTypes: Record<number, string>;
  draftProductId: string | null;
  slugEditMode: boolean;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  markStepComplete: (step: number) => void;
  setPrimaryImage: (idx: number) => void;
  setShotType: (idx: number, shotType: string) => void;
  setDraftProductId: (id: string | null) => void;
  setSlugEditMode: (mode: boolean) => void;
  resetWizard: () => void;
}

export const useProductWizardStore = create<WizardState>((set: any) => ({
  currentStep: 0,
  completedSteps: new Set<number>(),
  primaryImageIndex: 0,
  imageShotTypes: {},
  draftProductId: null,
  slugEditMode: false,

  setStep: (step: number) => set({ currentStep: step }),
  nextStep: () =>
    set((state: WizardState) => ({
      completedSteps: new Set([...state.completedSteps, state.currentStep]),
      currentStep: Math.min(state.currentStep + 1, WIZARD_STEPS.length - 1),
    })),
  prevStep: () => set((state: WizardState) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),
  markStepComplete: (step: number) =>
    set((state: WizardState) => ({ completedSteps: new Set([...state.completedSteps, step]) })),
  setPrimaryImage: (idx: number) => set({ primaryImageIndex: idx }),
  setShotType: (idx: number, shotType: string) =>
    set((state: WizardState) => ({ imageShotTypes: { ...state.imageShotTypes, [idx]: shotType } })),
  setDraftProductId: (id: string | null) => set({ draftProductId: id }),
  setSlugEditMode: (mode: boolean) => set({ slugEditMode: mode }),
  resetWizard: () =>
    set({
      currentStep: 0,
      completedSteps: new Set(),
      primaryImageIndex: 0,
      imageShotTypes: {},
      draftProductId: null,
      slugEditMode: false,
    }),
}));
