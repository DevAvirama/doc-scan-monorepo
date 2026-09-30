from dataclasses import dataclass

import cv2
import numpy as np

from src.domain.schemas import QualityMetrics


class InvalidImageError(Exception):
    """Lanzada cuando el buffer de bytes no corresponde a una imagen válida decodificable."""


@dataclass(frozen=True)
class ProcessedImage:
    image_bytes: bytes
    metrics: QualityMetrics
    width: int
    height: int


class ImageProcessorService:
    def __init__(self, blur_threshold: float = 80.0, max_dimension: int = 1920):
        self.blur_threshold = blur_threshold
        self.max_dimension = max_dimension

    def calculate_blur_score(self, gray_image: np.ndarray) -> float:
        """Calcula la varianza del Laplaciano para determinar la nitidez de la imagen."""
        laplacian = cv2.Laplacian(gray_image, cv2.CV_64F)
        variance = float(laplacian.var())
        return round(variance, 2)

    def process(self, raw_bytes: bytes) -> ProcessedImage:
        # 1. Decodificar bytes en memoria sin escribir en disco
        np_arr = np.frombuffer(raw_bytes, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if image is None:
            raise InvalidImageError("El archivo no es una imagen válida o está dañado.")

        # 2. Análisis de nitidez sobre escala de grises
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blur_score = self.calculate_blur_score(gray)
        is_blurry = blur_score < self.blur_threshold

        metrics = QualityMetrics(is_blurry=is_blurry, blur_score=blur_score)

        # 3. Redimensionar si supera la dimensión máxima manteniendo la relación de aspecto
        h, w = image.shape[:2]
        max_side = max(h, w)

        if max_side > self.max_dimension:
            scaling_factor = self.max_dimension / float(max_side)
            new_w = int(w * scaling_factor)
            new_h = int(h * scaling_factor)
            image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
            h, w = new_h, new_w

        # 4. Re-codificar a JPEG optimizado en memoria
        success, encoded_img = cv2.imencode(".jpg", image, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        if not success:
            raise InvalidImageError("Error al serializar la imagen procesada.")

        return ProcessedImage(image_bytes=encoded_img.tobytes(), metrics=metrics, width=w, height=h)
