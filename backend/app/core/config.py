from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "VisualDB-3D"
    debug: bool = False

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()
