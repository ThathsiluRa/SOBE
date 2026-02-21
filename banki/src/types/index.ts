// ============================================================
// TypeScript Types for BANKI
// ============================================================

export interface ApplicationData {
  id: string;
  customerId: string;
  status: 'in_progress' | 'submitted' | 'approved' | 'rejected';

  // Personal
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  occupation?: string;
  monthlyIncome?: string;
  language: string;

  // ID Document
  idDocumentType?: string;
  idNumber?: string;
  idImagePath?: string;
  idExtractedData?: string;
  idConfidence?: number;

  // Verification
  selfiePath?: string;
  faceMatchScore?: number;
  livenessPass: boolean;

  // Products
  selectedProducts?: string;
  recommendedProducts?: string;

  // Conversation
  transcript?: string;

  // PDF
  pdfPath?: string;

  // Review
  reviewNotes?: string;
  rejectionReason?: string;

  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  type: 'savings' | 'current' | 'credit_card' | 'debit_card' | 'loan' | 'fixed_deposit';
  description: string;
  features: string[];
  interestRate?: number;
  eligibilityRules: EligibilityRules;
  termsConditions?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface EligibilityRules {
  minAge?: number;
  maxAge?: number;
  minIncome?: number;
  maxIncome?: number;
  requiredDocs?: string[];
  allowedOccupations?: string[];
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  isPublished: boolean;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Settings {
  id: string;
  bankName: string;
  geminiApiKey: string;
  faceMatchThreshold: number;
  primaryColor: string;
  logoPath?: string;
}

export interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ExtractedIDData {
  document_type: string;
  document_number: string | null;
  full_name: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | null;
  address: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  is_front: boolean;
  is_back: boolean;
  image_quality: 'good' | 'fair' | 'poor';
  is_legitimate: boolean;
  confidence_score: number;
  issues: string[];
  raw_text: string;
}

export interface ProductRecommendation {
  product_id: string;
  product_name: string;
  reason: string;
  eligible: boolean;
  ineligibility_reason?: string;
}

export interface NICData {
  nicNumber: string;
  format: 'old' | 'new';
  birthYear: number;
  birthDayOfYear: number;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  isValid: boolean;
}

export type KioskStep =
  | 'greeting'
  | 'personal_info'
  | 'id_scan'
  | 'selfie'
  | 'liveness'
  | 'products'
  | 'review'
  | 'complete';
