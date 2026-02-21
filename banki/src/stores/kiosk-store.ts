'use client';

import { create } from 'zustand';
import type { KioskStep, TranscriptEntry, ExtractedIDData, ProductRecommendation } from '@/types';

interface KioskState {
  // Session
  sessionId: string | null;
  customerId: string | null;
  currentStep: KioskStep;
  language: string;

  // Personal info
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  occupation: string;
  monthlyIncome: string;

  // ID verification
  idImageCapture: string | null;
  idExtractedData: ExtractedIDData | null;
  idConfirmed: boolean;

  // Selfie & face
  selfieCapture: string | null;
  faceMatchScore: number | null;
  livenessPass: boolean;

  // Products
  recommendedProducts: ProductRecommendation[];
  selectedProductIds: string[];

  // Conversation
  transcript: TranscriptEntry[];
  isListening: boolean;
  isSpeaking: boolean;
  inputText: string;

  // Actions
  setStep: (step: KioskStep) => void;
  setLanguage: (lang: string) => void;
  setPersonalField: (field: string, value: string) => void;
  setIDCapture: (image: string | null) => void;
  setIDExtracted: (data: ExtractedIDData | null) => void;
  setIDConfirmed: (confirmed: boolean) => void;
  setSelfieCapture: (image: string | null) => void;
  setFaceMatchScore: (score: number | null) => void;
  setLivenessPass: (pass: boolean) => void;
  setRecommendedProducts: (products: ProductRecommendation[]) => void;
  toggleProductSelection: (productId: string) => void;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  setListening: (v: boolean) => void;
  setSpeaking: (v: boolean) => void;
  setInputText: (text: string) => void;
  setSessionId: (id: string) => void;
  setCustomerId: (id: string) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  customerId: null,
  currentStep: 'greeting' as KioskStep,
  language: 'en',
  fullName: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  occupation: '',
  monthlyIncome: '',
  idImageCapture: null,
  idExtractedData: null,
  idConfirmed: false,
  selfieCapture: null,
  faceMatchScore: null,
  livenessPass: false,
  recommendedProducts: [],
  selectedProductIds: [],
  transcript: [],
  isListening: false,
  isSpeaking: false,
  inputText: '',
};

export const useKioskStore = create<KioskState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),
  setLanguage: (lang) => set({ language: lang }),
  setPersonalField: (field, value) => set((state) => ({ ...state, [field]: value })),
  setIDCapture: (image) => set({ idImageCapture: image }),
  setIDExtracted: (data) => set({ idExtractedData: data }),
  setIDConfirmed: (confirmed) => set({ idConfirmed: confirmed }),
  setSelfieCapture: (image) => set({ selfieCapture: image }),
  setFaceMatchScore: (score) => set({ faceMatchScore: score }),
  setLivenessPass: (pass) => set({ livenessPass: pass }),
  setRecommendedProducts: (products) => set({ recommendedProducts: products }),
  toggleProductSelection: (productId) =>
    set((state) => ({
      selectedProductIds: state.selectedProductIds.includes(productId)
        ? state.selectedProductIds.filter((id) => id !== productId)
        : [...state.selectedProductIds, productId],
    })),
  addTranscriptEntry: (entry) =>
    set((state) => ({ transcript: [...state.transcript, entry] })),
  setListening: (v) => set({ isListening: v }),
  setSpeaking: (v) => set({ isSpeaking: v }),
  setInputText: (text) => set({ inputText: text }),
  setSessionId: (id) => set({ sessionId: id }),
  setCustomerId: (id) => set({ customerId: id }),
  reset: () => set(initialState),
}));
