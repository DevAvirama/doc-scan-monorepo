'use client';

import React, { useState, useMemo } from 'react';
import { DocumentDetail, DocumentItem } from '@/types/document';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import {
  FileText,
  Calendar,
  Building,
  CreditCard,
  Percent,
  CheckCircle2,
  Copy,
  Check,
  Plus,
  Trash2,
  ArrowLeft,
  Sparkles,
  Info,
  Layers,
  Gauge,
  Scan,
} from 'lucide-react';

interface DocumentResultViewProps {
  document: DocumentDetail;
  previewUrl?: string | null;
  onNewScan: () => void;
  onBackToHistory?: () => void;
}

export function DocumentResultView({
  document: initialDocument,
  previewUrl,
  onNewScan,
  onBackToHistory,
}: DocumentResultViewProps) {
  // Estado local para permitir edición de campos y tabla de ítems
  const [doc, setDoc] = useState<DocumentDetail>(initialDocument);
  const [items, setItems] = useState<DocumentItem[]>(initialDocument.items || []);
  const [copiedJson, setCopiedJson] = useState(false);

  // Recálculo reactivo de la suma de ítems
  const computedItemsSum = useMemo(() => {
    return items.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  }, [items]);

  // Validación de tolerancia de redondeo (0.05) idéntica a la entidad Python
  const isSumConsistent = useMemo(() => {
    if (items.length === 0) return true;
    return Math.abs(computedItemsSum - Number(doc.total_amount)) <= 0.05;
  }, [computedItemsSum, doc.total_amount, items.length]);

  const handleItemChange = (index: number, field: keyof DocumentItem, value: string | number) => {
    const updated = [...items];
    const current = { ...updated[index] };

    if (field === 'description') {
      current.description = String(value);
    } else if (field === 'quantity') {
      const q = Math.max(0, parseFloat(String(value)) || 0);
      current.quantity = q;
      current.total_price = Number((q * Number(current.unit_price)).toFixed(2));
    } else if (field === 'unit_price') {
      const p = Math.max(0, parseFloat(String(value)) || 0);
      current.unit_price = p;
      current.total_price = Number((Number(current.quantity) * p).toFixed(2));
    } else if (field === 'total_price') {
      current.total_price = Math.max(0, parseFloat(String(value)) || 0);
    }

    updated[index] = current;
    setItems(updated);
  };

  const addItem = () => {
    const newItem: DocumentItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`,
      description: 'Nuevo concepto',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const copyAsJson = async () => {
    try {
      const payloadToExport = {
        ...doc,
        items,
      };
      await navigator.clipboard.writeText(JSON.stringify(payloadToExport, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Porcentaje de confianza normalizado
  const confidencePercent = Math.min(100, Math.max(0, Math.round(doc.confidence_score * 100)));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Barra superior de acciones */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {onBackToHistory && (
            <button
              onClick={onBackToHistory}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
              title="Volver al historial"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {doc.merchant_name || 'Comprobante Procesado'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
                {doc.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {doc.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={copyAsJson}
            className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-2"
          >
            {copiedJson ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar JSON</span>
              </>
            )}
          </button>
          <button
            onClick={onNewScan}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <Scan className="w-4 h-4" />
            <span>Nuevo Escaneo</span>
          </button>
        </div>
      </div>

      {/* Grid a dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ============================================================== */}
        {/* COLUMNA IZQUIERDA: Imagen y Métricas de Procesamiento          */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Tarjeta de Imagen */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                Comprobante Digitalizado
              </span>
              <span className="text-xs text-slate-500 font-medium">{doc.document_type}</span>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center min-h-[280px] max-h-[420px]">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={`Comprobante de ${doc.merchant_name}`}
                  className="max-h-[380px] w-auto object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-center p-8 space-y-2 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto text-slate-700" />
                  <p className="text-xs">Imagen archivada en almacenamiento</p>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta de Métricas de Calidad e IA */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              Métricas de Calidad e Inferencia
            </h3>

            {/* Score de Desfoque */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Score de Nitidez (Laplaciano)</span>
                <span
                  className={`font-bold ${
                    (doc.blur_score ?? 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {doc.blur_score !== null ? doc.blur_score.toFixed(1) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Umbral mínimo: 80.0</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-medium ${
                    (doc.blur_score ?? 0) >= 80
                      ? 'bg-emerald-950 text-emerald-400'
                      : 'bg-amber-950 text-amber-400'
                  }`}
                >
                  {(doc.blur_score ?? 0) >= 80 ? 'Óptima' : 'Límite'}
                </span>
              </div>
            </div>

            {/* Nivel de Confianza Global */}
            <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Nivel de Confianza (Gemini Vision)</span>
                <span className="font-bold text-cyan-400">{confidencePercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
            </div>

            {/* Tipo de Documento y Estado */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Tipo Clasificado</span>
                <span className="text-xs font-semibold text-slate-200 mt-1 block">
                  {doc.document_type}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Fecha Registro</span>
                <span className="text-xs font-semibold text-slate-200 mt-1 block truncate">
                  {formatDate(doc.document_date || doc.created_at)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Procesado el {formatDateTime(doc.created_at)}</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLUMNA DERECHA: Metadatos del Documento y Tabla Editable     */}
        {/* ============================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tarjeta de Metadatos Principales */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              Metadatos del Comprobante
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Comercio */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Comercio / Establecimiento</label>
                <input
                  type="text"
                  value={doc.merchant_name}
                  onChange={(e) => setDoc({ ...doc, merchant_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* NIT / Tax ID */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">NIT / Identificación Fiscal</label>
                <input
                  type="text"
                  value={doc.tax_id || ''}
                  placeholder="No detectado"
                  onChange={(e) => setDoc({ ...doc, tax_id: e.target.value || null })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Fecha del Documento */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Fecha de Emisión</label>
                <div className="relative">
                  <input
                    type="date"
                    value={doc.document_date || ''}
                    onChange={(e) => setDoc({ ...doc, document_date: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Moneda */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Moneda</label>
                <input
                  type="text"
                  maxLength={3}
                  value={doc.currency}
                  onChange={(e) => setDoc({ ...doc, currency: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-500 uppercase"
                />
              </div>

              {/* Impuesto / IVA */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Impuestos / IVA</label>
                <input
                  type="number"
                  step="0.01"
                  value={doc.tax_amount ?? ''}
                  placeholder="0.00"
                  onChange={(e) =>
                    setDoc({
                      ...doc,
                      tax_amount: e.target.value !== '' ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Total Declarado */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Total Declarado</label>
                <input
                  type="number"
                  step="0.01"
                  value={doc.total_amount}
                  onChange={(e) =>
                    setDoc({ ...doc, total_amount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-bold text-cyan-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Tarjeta de Ítems Detectados (Tabla Editable) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Desglose de Ítems Detectados ({items.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Agregar Ítem</span>
              </button>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-3 py-3 w-24 text-right">Cant.</th>
                    <th className="px-3 py-3 w-32 text-right">Precio Unit.</th>
                    <th className="px-3 py-3 w-32 text-right">Total</th>
                    <th className="px-2 py-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No se detectaron ítems desglosados en el comprobante.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            className="w-full px-2 py-1.5 rounded bg-transparent hover:bg-slate-900 focus:bg-slate-950 border border-transparent hover:border-slate-800 focus:border-cyan-500 text-slate-200 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-20 px-2 py-1.5 rounded text-right bg-transparent hover:bg-slate-900 focus:bg-slate-950 border border-transparent hover:border-slate-800 focus:border-cyan-500 text-slate-200 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                            className="w-28 px-2 py-1.5 rounded text-right bg-transparent hover:bg-slate-900 focus:bg-slate-950 border border-transparent hover:border-slate-800 focus:border-cyan-500 text-slate-200 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-100">
                          {formatCurrency(item.total_price, doc.currency)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-1 rounded hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Resumen Financiero y Validación de Totales */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {isSumConsistent ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Balance exacto: La suma de ítems coincide con el total declarado.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>
                      Diferencia de {formatCurrency(Math.abs(computedItemsSum - doc.total_amount), doc.currency)}{' '}
                      entre ítems ({formatCurrency(computedItemsSum, doc.currency)}) y total declarado ({formatCurrency(doc.total_amount, doc.currency)}).
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-slate-400">Total Final: </span>
                <span className="text-lg font-bold text-white ml-2">
                  {formatCurrency(doc.total_amount, doc.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
