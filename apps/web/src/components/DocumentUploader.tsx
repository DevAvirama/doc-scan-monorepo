'use client';

import React, { useState, useRef, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import { DocumentDetail } from '@/types/document';
import { formatMetric } from '@/lib/utils';
import {
  UploadCloud,
  FileImage,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface DocumentUploaderProps {
  onScanSuccess: (document: DocumentDetail, previewUrl: string) => void;
}

type ScanStage = 'idle' | 'quality' | 'ocr' | 'persistence' | 'completed' | 'error';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function DocumentUploader({ onScanSuccess }: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [stage, setStage] = useState<ScanStage>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [blurScore, setBlurScore] = useState<number | null>(null);
  const [blurThreshold] = useState<number>(80.0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setStage('idle');
    setErrorMessage(null);
    setBlurScore(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelection = useCallback(
    (selectedFile: File) => {
      setErrorMessage(null);
      setBlurScore(null);

      // Validación de tipo MIME
      if (!ALLOWED_TYPES.includes(selectedFile.type)) {
        setErrorMessage(
          `Formato "${selectedFile.type || 'desconocido'}" no permitido. Usa imágenes JPEG, PNG o WEBP.`
        );
        return;
      }

      // Validación de tamaño (5 MB)
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(
          `El archivo supera el límite de 5 MB (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB).`
        );
        return;
      }

      setPreviewUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return URL.createObjectURL(selectedFile);
      });
      setFile(selectedFile);
      setStage('idle');
    },
    []
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    },
    [handleFileSelection]
  );

  const startScan = async () => {
    if (!file || !previewUrl) return;

    setErrorMessage(null);
    setBlurScore(null);
    setStage('quality');

    // Secuencia visual de etapas mientras se procesa la petición
    const timerQuality = setTimeout(() => {
      setStage('ocr');
    }, 1200);

    const timerOcr = setTimeout(() => {
      setStage('persistence');
    }, 3800);

    try {
      const document = await api.scanDocument(file);
      clearTimeout(timerQuality);
      clearTimeout(timerOcr);
      setStage('completed');
      setTimeout(() => {
        onScanSuccess(document, previewUrl);
      }, 500);
    } catch (err) {
      clearTimeout(timerQuality);
      clearTimeout(timerOcr);
      setStage('error');

      if (err instanceof ApiError) {
        if (err.isBlurryError || err.blurScore !== undefined) {
          setBlurScore(err.blurScore ?? 0);
          setErrorMessage(
            err.message ||
              'La imagen no cumple con los requisitos mínimos de nitidez para procesar el texto.'
          );
        } else {
          setErrorMessage(err.message);
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Ocurrió un error inesperado al procesar el documento.');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Encabezado descriptivo */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Escanear Comprobante Comercial
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Carga un recibo, factura o ticket de compra. Nuestro motor de visión validará la nitidez
          con OpenCV y extraerá datos estructurados con Gemini AI.
        </p>
      </div>

      {/* Alerta de Error / Nitidez */}
      {errorMessage && (
        <div
          className={`p-4 rounded-xl border backdrop-blur-md transition-all ${
            blurScore !== null
              ? 'bg-amber-950/40 border-amber-800 text-amber-200'
              : 'bg-rose-950/40 border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {blurScore !== null ? (
              <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-semibold text-sm">
                  {blurScore !== null
                    ? 'Imagen rechazada por falta de nitidez'
                    : 'Error al procesar el archivo'}
                </span>
                {blurScore !== null && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    IMAGE_TOO_BLURRY
                  </span>
                )}
              </div>
              <p className="text-sm opacity-90">{errorMessage}</p>

              {/* Comparador de Nitidez vs Umbral */}
              {blurScore !== null && (
                <div className="mt-3 p-3 bg-slate-900/80 rounded-lg border border-amber-900/40 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Puntaje obtenido (Laplaciano): </span>
                    <span className="font-bold text-amber-400 text-sm">
                      {formatMetric(blurScore, 1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Umbral mínimo requerido: </span>
                    <span className="font-bold text-emerald-400 text-sm">≥ {formatMetric(blurThreshold, 1)}</span>
                  </div>
                  <div className="text-slate-400 italic">
                    💡 Sugerencia: Enfoca mejor la cámara, limpia el lente y asegura buena iluminación.
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Zona de Drop & Carga */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 transition-all duration-200 text-center ${
          isDragging
            ? 'border-cyan-500 bg-cyan-950/20 scale-[1.01]'
            : file
            ? 'border-slate-700 bg-slate-900/60'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/30 cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelection(e.target.files[0]);
            }
          }}
        />

        {!file ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-cyan-400 shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-200">
                Arrastra y suelta tu comprobante aquí, o{' '}
                <span className="text-cyan-400 hover:underline">explora archivos</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Formatos soportados: JPEG, PNG o WEBP (máximo 5 MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Previsualización en memoria */}
            <div className="relative max-w-sm mx-auto rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl">
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Vista previa del recibo"
                  className="w-full max-h-72 object-contain bg-slate-900"
                />
              )}
              {stage === 'idle' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetState();
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-rose-900 text-slate-300 hover:text-white transition-colors"
                  title="Eliminar archivo seleccionado"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Metadatos del archivo seleccionado */}
            <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
              <FileImage className="w-4 h-4 text-cyan-400" />
              <span className="font-medium text-slate-300 truncate max-w-xs">{file.name}</span>
              <span>•</span>
              <span>{(file.size / 1024).toFixed(1)} KB</span>
            </div>

            {/* Stepper de progreso durante el escaneo */}
            {stage !== 'idle' && (
              <div className="max-w-md mx-auto space-y-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-400">Estado del Procesamiento</span>
                  {stage !== 'error' ? (
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      En progreso
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Fallido
                    </span>
                  )}
                </div>

                {/* Pasos */}
                <div className="space-y-2.5 text-left text-xs">
                  {/* Paso 1: Nitidez */}
                  <div className="flex items-center gap-2.5">
                    {stage === 'quality' ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                    ) : stage === 'ocr' || stage === 'persistence' || stage === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span
                      className={
                        stage === 'quality'
                          ? 'text-cyan-300 font-semibold'
                          : stage === 'ocr' || stage === 'persistence' || stage === 'completed'
                          ? 'text-slate-300'
                          : 'text-slate-500'
                      }
                    >
                      1. Analizando calidad y nitidez de la imagen (OpenCV)...
                    </span>
                  </div>

                  {/* Paso 2: OCR */}
                  <div className="flex items-center gap-2.5">
                    {stage === 'ocr' ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                    ) : stage === 'persistence' || stage === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span
                      className={
                        stage === 'ocr'
                          ? 'text-cyan-300 font-semibold'
                          : stage === 'persistence' || stage === 'completed'
                          ? 'text-slate-300'
                          : 'text-slate-500'
                      }
                    >
                      2. Inferencia OCR y extracción con Gemini AI...
                    </span>
                  </div>

                  {/* Paso 3: Persistencia */}
                  <div className="flex items-center gap-2.5">
                    {stage === 'persistence' ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                    ) : stage === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span
                      className={
                        stage === 'persistence'
                          ? 'text-cyan-300 font-semibold'
                          : stage === 'completed'
                          ? 'text-emerald-400 font-semibold'
                          : 'text-slate-500'
                      }
                    >
                      3. Persistiendo registros en base de datos relacional...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex items-center justify-center gap-3 pt-2">
              {stage === 'idle' || stage === 'error' ? (
                <>
                  <button
                    type="button"
                    onClick={resetState}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm font-medium text-slate-300 transition-colors"
                  >
                    Cambiar Imagen
                  </button>
                  <button
                    type="button"
                    onClick={startScan}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Iniciar Procesamiento</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
