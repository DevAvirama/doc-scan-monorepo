-- =============================================================================
-- Migración 001: Esquema Inicial para Document Scanner
-- Compatible con PostgreSQL 15+ / Supabase
-- =============================================================================

-- 1. Tabla: documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL DEFAULT 'RECEIPT',
tax_id VARCHAR(50) NULL,
document_date DATE NULL,
currency VARCHAR(3) NOT NULL DEFAULT 'COP',
total_amount NUMERIC(14, 2) NOT NULL,
tax_amount NUMERIC(14, 2) NULL,
confidence_score NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
blur_score NUMERIC(6, 2) NULL,
status VARCHAR(30) NOT NULL DEFAULT 'PROCESSED',
created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
CONSTRAINT chk_documents_total_amount_positive CHECK (total_amount >= 0),
CONSTRAINT chk_documents_tax_amount_positive CHECK (tax_amount IS NULL OR tax_amount >= 0)
);

-- 2. Tabla: document_items
CREATE TABLE IF NOT EXISTS document_items (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
description VARCHAR(255) NOT NULL,
quantity NUMERIC(10, 3) NOT NULL DEFAULT 1.000,
unit_price NUMERIC(14, 2) NOT NULL,
total_price NUMERIC(14, 2) NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
CONSTRAINT chk_document_items_quantity_positive CHECK (quantity > 0),
CONSTRAINT chk_document_items_unit_price_positive CHECK (unit_price >= 0),
CONSTRAINT chk_document_items_total_price_positive CHECK (total_price >= 0)
);

-- 3. Índices de rendimiento para consultas y ordenamiento
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_items_document_id ON document_items(document_id);
