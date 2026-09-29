from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../../.env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    supabase_db_url: str = ""
    database_url: str = "sqlite+aiosqlite:///:memory:"
    cv_service_url: str = "http://localhost:8001"
    environment: str = "development"

    @property
    def async_database_url(self) -> str:
        """Asegura el driver asyncpg para PostgreSQL o mantiene SQLite en tests."""
        if self.supabase_db_url:
            url = self.supabase_db_url
            if url.startswith("postgresql://"):
                return url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return url
        return self.database_url


settings = Settings()
