import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Convierte de forma segura cualquier valor (string, number, null, undefined)
 * a un número primitivo finito válido. Si no es convertible o es NaN/Infinity, retorna el fallback.
 */
export function safeNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Formatea una métrica numérica con un número fijo de decimales de forma segura.
 * Si el valor es null, undefined, vacío o no es un número finito, retorna el fallback especificado.
 */
export function formatMetric(value: unknown, decimals = 1, fallback = 'N/A'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return num.toFixed(decimals);
}

/**
 * Formatea valores monetarios de forma segura, garantizando coerción previa a número.
 */
export function formatCurrency(amount: unknown, currency: string = 'COP'): string {
  const num = safeNumber(amount, 0);
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency || 'COP',
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency || '$'} ${num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Sin fecha';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return 'Sin fecha';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}
