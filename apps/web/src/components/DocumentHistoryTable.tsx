'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import { DocumentSummary } from '@/types/document';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  AlertCircle,
  Inbox,
  Sparkles,
} from 'lucide-react';

interface DocumentHistoryTableProps {
  onSelectDocument: (id: string) => void;
  onNavigateToScan: () => void;
}

export function DocumentHistoryTable({
  onSelectDocument,
  onNavigateToScan,
}: DocumentHistoryTableProps) {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [limit, setLimit] = useState<number>(10);
  const [offset, setOffset] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.listDocuments(limit, offset);
      setDocuments(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('No fue posible cargar el historial de documentos.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handlePrevPage = () => {
    if (offset >= limit) {
      setOffset(offset - limit);
    }
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      setOffset(offset + limit);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Historial de Comprobantes
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Registro consolidado de todos los comprobantes digitalizados en la base de datos relacional.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDocuments}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNavigateToScan}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Escanear Nuevo</span>
          </button>
        </div>
      </div>

      {/* Manejo de Error */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDocuments}
            className="px-3 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-xs font-medium text-white transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Tabla de Resultados */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Fecha</th>
                <th className="px-5 py-3.5">Comercio</th>
                <th className="px-4 py-3.5">Tipo</th>
                <th className="px-4 py-3.5 text-center">Ítems</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-4 py-3.5 text-center">Nitidez / Confianza</th>
                <th className="px-4 py-3.5 text-center">Estado</th>
                <th className="px-5 py-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/20">
              {isLoading ? (
                // Skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="h-3 w-20 bg-slate-800 rounded"></div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-3 w-32 bg-slate-800 rounded"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-16 bg-slate-800 rounded"></div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="h-3 w-8 bg-slate-800 rounded mx-auto"></div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-3 w-20 bg-slate-800 rounded ml-auto"></div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="h-3 w-24 bg-slate-800 rounded mx-auto"></div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="h-4 w-16 bg-slate-800 rounded-full mx-auto"></div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="h-6 w-16 bg-slate-800 rounded mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-3">
                      <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="font-medium text-slate-400">No hay documentos registrados aún</p>
                      <p className="text-xs text-slate-500">
                        Los comprobantes escaneados y validados aparecerán automáticamente en esta lista.
                      </p>
                      <button
                        onClick={onNavigateToScan}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all shadow-md inline-flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Escanear Primer Recibo
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                    onClick={() => onSelectDocument(doc.id)}
                  >
                    {/* Fecha */}
                    <td className="px-5 py-3.5 font-medium text-slate-300 whitespace-nowrap">
                      {formatDate(doc.document_date || doc.created_at)}
                    </td>

                    {/* Comercio */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">
                        {doc.merchant_name}
                      </div>
                      {doc.tax_id && (
                        <div className="text-[11px] text-slate-500">NIT: {doc.tax_id}</div>
                      )}
                    </td>

                    {/* Tipo */}
                    <td className="px-4 py-3.5 text-slate-400 font-medium">
                      {doc.document_type}
                    </td>

                    {/* Cantidad de Ítems */}
                    <td className="px-4 py-3.5 text-center text-slate-300 font-medium">
                      {doc.items ? doc.items.length : '—'}
                    </td>

                    {/* Total */}
                    <td className="px-5 py-3.5 text-right font-bold text-slate-100 whitespace-nowrap">
                      {formatCurrency(doc.total_amount, doc.currency)}
                    </td>

                    {/* Nitidez / Confianza */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 text-[11px]">
                        <span
                          className={`font-semibold ${
                            (doc.blur_score ?? 0) >= 80 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                          title={`Nitidez: ${doc.blur_score?.toFixed(1) ?? 'N/A'}`}
                        >
                          {doc.blur_score !== null ? `${doc.blur_score.toFixed(0)} pts` : '—'}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-cyan-400 font-medium" title="Confianza OCR">
                          {Math.round(doc.confidence_score * 100)}%
                        </span>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          doc.status === 'PROCESSED'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                            : doc.status === 'REVISED'
                            ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDocument(doc.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-cyan-950 hover:border-cyan-800 text-slate-300 hover:text-cyan-400 transition-colors inline-flex items-center gap-1 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ver detalle</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="text-slate-400">
            Mostrando{' '}
            <span className="font-semibold text-slate-200">
              {total === 0 ? 0 : offset + 1}
            </span>{' '}
            -{' '}
            <span className="font-semibold text-slate-200">
              {Math.min(offset + limit, total)}
            </span>{' '}
            de <span className="font-semibold text-slate-200">{total}</span> registros
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Filas:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setOffset(0);
                }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevPage}
                disabled={offset === 0 || isLoading}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={offset + limit >= total || isLoading}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
