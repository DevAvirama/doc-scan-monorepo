export type DocumentStatus = 'PROCESSED' | 'REVISED' | 'ARCHIVED' | 'FAILED';

export type DocumentType = 'RECEIPT' | 'INVOICE' | 'TICKET' | 'UNKNOWN';

export interface DocumentItem {
  id: string;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  total_price: number | string;
}

export interface DocumentDetail {
  id: string;
  merchant_name: string;
  document_type: DocumentType | string;
  tax_id: string | null;
  document_date: string | null;
  currency: string;
  total_amount: number | string;
  tax_amount: number | string | null;
  confidence_score: number | string;
  blur_score: number | string | null;
  status: DocumentStatus | string;
  items: DocumentItem[];
  created_at: string;
  updated_at?: string;
}

export interface DocumentSummary {
  id: string;
  merchant_name: string;
  document_type: DocumentType | string;
  tax_id: string | null;
  document_date: string | null;
  currency: string;
  total_amount: number | string;
  tax_amount: number | string | null;
  confidence_score: number | string;
  blur_score: number | string | null;
  status: DocumentStatus | string;
  created_at: string;
  updated_at?: string;
  items?: DocumentItem[];
}

export interface PaginatedDocumentsResponse {
  items: DocumentSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface BlurErrorDetail {
  blur_score?: number | string;
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  detail?: BlurErrorDetail | string;
  document_id?: string;
}

export interface HealthResponse {
  status: string;
  service: string;
}
