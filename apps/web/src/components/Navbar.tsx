'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  FileText,
  ScanLine,
  History,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'scan' | 'history';
  onTabChange: (tab: 'scan' | 'history') => void;
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [serviceName, setServiceName] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const checkBackendHealth = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await api.checkHealth();
      if (res.status === 'ok') {
        setHealthStatus('healthy');
        setServiceName(res.service || 'core_api');
      } else {
        setHealthStatus('unhealthy');
      }
    } catch {
      setHealthStatus('unhealthy');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000); // Polling cada 30s
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ScanLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">DocScan AI</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 font-medium">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Plataforma de Extracción y Validación de Documentos
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onTabChange('scan')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === 'scan'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Nuevo Escaneo</span>
            </button>
            <button
              onClick={() => onTabChange('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Historial de Recibos</span>
            </button>
          </nav>

          {/* Health Status Indicator */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                healthStatus === 'healthy'
                  ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400'
                  : healthStatus === 'unhealthy'
                  ? 'bg-rose-950/60 border-rose-800/60 text-rose-400'
                  : 'bg-amber-950/60 border-amber-800/60 text-amber-400'
              }`}
              title={
                healthStatus === 'healthy'
                  ? `Servicio conectado: ${serviceName}`
                  : healthStatus === 'unhealthy'
                  ? 'No se puede conectar con core_api (http://localhost:8000/api/v1)'
                  : 'Comprobando estado del backend...'
              }
            >
              {healthStatus === 'healthy' ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">API Conectada</span>
                </>
              ) : healthStatus === 'unhealthy' ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  <XCircle className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">API Desconectada</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span className="hidden md:inline">Verificando...</span>
                </>
              )}
            </div>

            <button
              onClick={checkBackendHealth}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Actualizar estado de conexión"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
