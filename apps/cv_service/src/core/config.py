from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../../.env", env_file_encoding="utf-8", extra="ignore"
    )

    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"
    blur_threshold: float = 80.0
    max_image_dimension: int = 1920
    environment: str = "development"


settings = Settings()
