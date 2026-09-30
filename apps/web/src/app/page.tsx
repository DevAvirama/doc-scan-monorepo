'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { DocumentUploader } from '@/components/DocumentUploader';
import { DocumentResultView } from '@/components/DocumentResultView';
import { DocumentHistoryTable } from '@/components/DocumentHistoryTable';
import { DocumentDetail } from '@/types/document';
import { api, ApiError } from '@/lib/api';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  const [scannedDocument, setScannedDocument] = useState<DocumentDetail | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const handleScanSuccess = (doc: DocumentDetail, url: string) => {
    setScannedDocument(doc);
    setPreviewUrl(url);
    setActiveTab('scan');
  };

  const handleSelectFromHistory = async (id: string) => {
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const doc = await api.getDocument(id);
      setScannedDocument(doc);
      setPreviewUrl(null); // Documento traído del backend
      setActiveTab('scan');
    } catch (err) {
      if (err instanceof ApiError) {
        setDetailError(err.message);
      } else {
        setDetailError('Error al recuperar los detalles del documento seleccionado.');
      }
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleNewScan = () => {
    setScannedDocument(null);
    setPreviewUrl(null);
    setDetailError(null);
    setActiveTab('scan');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Barra de navegación superior con monitor de salud de core_api */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setDetailError(null);
        }}
      />

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Spinner durante la carga de un detalle */}
        {isLoadingDetail && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">
              Cargando comprobante desde la base de datos relacional...
            </p>
          </div>
        )}

        {/* Error al recuperar detalle */}
        {detailError && !isLoadingDetail && (
          <div className="p-4 mb-6 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-200 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{detailError}</span>
            </div>
            <button
              onClick={() => setDetailError(null)}
              className="text-xs px-2.5 py-1 rounded-md bg-rose-900/60 hover:bg-rose-800 text-white"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Contenido según la pestaña activa */}
        {!isLoadingDetail && (
          <>
            {activeTab === 'scan' ? (
              scannedDocument ? (
                <DocumentResultView
                  document={scannedDocument}
                  previewUrl={previewUrl}
                  onNewScan={handleNewScan}
                  onBackToHistory={() => {
                    setScannedDocument(null);
                    setActiveTab('history');
                  }}
                />
              ) : (
                <DocumentUploader onScanSuccess={handleScanSuccess} />
              )
            ) : (
              <DocumentHistoryTable
                onSelectDocument={handleSelectFromHistory}
                onNavigateToScan={handleNewScan}
              />
            )}
          </>
        )}
      </main>

      {/* Pie de Página */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 DocScan AI. Arquitectura hexagonal monorepo.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>FastAPI Core API (:8000)</span>
            <span>•</span>
            <span>Gemini Vision CV (:8001)</span>
            <span>•</span>
            <span>Next.js Client (:3000)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
