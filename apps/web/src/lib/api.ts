import {
  ApiErrorResponse,
  BlurErrorDetail,
  DocumentDetail,
  HealthResponse,
  PaginatedDocumentsResponse,
} from '@/types/document';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly detail?: BlurErrorDetail | string;
  readonly blurScore?: number;
  readonly blurThreshold: number = 80.0;
  readonly isBlurryError: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string = 'UNKNOWN_ERROR',
    detail?: BlurErrorDetail | string
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.detail = detail;

    // Detectar puntuación de nitidez desde el objeto detail o regex en el mensaje
    let detectedBlurScore: number | undefined;
    if (
      detail &&
      typeof detail === 'object' &&
      'blur_score' in detail &&
      detail.blur_score !== null &&
      detail.blur_score !== undefined
    ) {
      const parsed = parseFloat(String(detail.blur_score));
      if (!isNaN(parsed)) {
        detectedBlurScore = parsed;
      }
    } else {
      const match = message.match(/(?:nitidez|blur_score)[:\s]+([\d.]+)/i);
      if (match && match[1]) {
        detectedBlurScore = parseFloat(match[1]);
      }
    }

    this.blurScore = detectedBlurScore;
    this.isBlurryError =
      code === 'IMAGE_TOO_BLURRY' ||
      statusCode === 422 ||
      (detectedBlurScore !== undefined && detectedBlurScore < this.blurThreshold) ||
      message.toLowerCase().includes('nitidez') ||
      message.toLowerCase().includes('blur');
  }
}

class ApiClient {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:8000/api/v1';
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
      return (await response.json()) as T;
    }

    let errorData: ApiErrorResponse | null = null;
    let fallbackText = '';

    try {
      const json = await response.json();
      errorData = json as ApiErrorResponse;
    } catch {
      try {
        fallbackText = await response.text();
      } catch {
        fallbackText = 'Error de comunicación con el servidor';
      }
    }

    const code = errorData?.error || `HTTP_${response.status}`;
    const message =
      errorData?.message ||
      fallbackText ||
      `Solicitud fallida con código de estado HTTP ${response.status}`;
    const detail = errorData?.detail;

    throw new ApiError(message, response.status, code, detail);
  }

  async scanDocument(file: File): Promise<DocumentDetail> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.baseUrl}/documents/scan`, {
        method: 'POST',
        body: formData,
      });

      return await this.handleResponse<DocumentDetail>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Error de red o conexión rechazada',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  async getDocument(id: string): Promise<DocumentDetail> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await this.handleResponse<DocumentDetail>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Error de red al consultar el documento',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  async listDocuments(limit: number = 20, offset: number = 0): Promise<PaginatedDocumentsResponse> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`${this.baseUrl}/documents?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await this.handleResponse<PaginatedDocumentsResponse>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Error de red al listar documentos',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        cache: 'no-store',
      });

      return await this.handleResponse<HealthResponse>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('No se pudo contactar el servicio core_api', 0, 'HEALTH_UNREACHABLE');
    }
  }
}

export const api = new ApiClient();
