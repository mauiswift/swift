import logging
import os
import secrets
from pathlib import Path
from typing import Any

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"
_PROJECT_ROOT = _BACKEND_DIR.parent
_PROJECT_ENV_FILE = _PROJECT_ROOT / ".env"
SYSTEM_WALLET_ADMIN_TELEGRAM_ID = "7851923260"
KRW_PAYMENT_APPROVAL_TELEGRAM_ID = SYSTEM_WALLET_ADMIN_TELEGRAM_ID


def _get_env_file() -> str | None:
    """Return the most specific supported environment file independent of cwd."""
    configured_file = os.environ.get("SWIFTPAY_ENV_FILE", "").strip()
    if configured_file:
        env_file = Path(configured_file).expanduser()
        if not env_file.is_absolute():
            env_file = _PROJECT_ROOT / env_file
        if env_file.is_file():
            return str(env_file)
        logger.warning("Configured SWIFTPAY_ENV_FILE does not exist: %s", env_file)

    environment = os.environ.get("ENVIRONMENT", "").strip().lower()
    candidates = []
    if environment:
        candidates.extend((
            _BACKEND_DIR / f".env.{environment}",
            _PROJECT_ROOT / f".env.{environment}",
        ))
    candidates.extend((_ENV_FILE, _PROJECT_ENV_FILE))
    for env_file in candidates:
        if env_file.is_file():
            return str(env_file)
    return None

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # Application
    app_name: str = "SwiftPay"
    debug: bool = False
    version: str = "1.0.0"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: str = "sqlite+aiosqlite:///./paybot.db"
    # Public TCP proxy URL for Railway PostgreSQL (e.g. used for local dev when
    # DATABASE_URL points to the private .railway.internal hostname).
    # Example: postgresql://postgres:PASSWORD@gondola.proxy.rlwy.net:45681/railway
    database_public_url: str = ""

    @model_validator(mode="after")
    def prefer_public_db_url(self) -> "Settings":
        """Use DATABASE_PUBLIC_URL when DATABASE_URL points to Railway's internal hostname,
        which is unreachable from outside the private network or misconfigured.
        Also normalises the legacy postgres:// scheme to postgresql:// so that
        SQLAlchemy 2.0 can parse it without errors."""
        # Only switch to the public URL when running OUTSIDE Railway (local dev).
        # Inside Railway containers, the .railway.internal hostname is reachable directly.
        is_on_railway = bool(self.railway_environment or self.railway_project_id)
        if "railway.internal" in self.database_url and not is_on_railway:
            public = self.database_public_url.strip()
            if public:
                logger.debug("Switching DATABASE_URL to DATABASE_PUBLIC_URL (internal hostname detected)")
                self.database_url = public
        # Strip stray whitespace / newlines that can appear in Railway env vars.
        self.database_url = self.database_url.strip()
        # SQLAlchemy 2.0 removed the bare 'postgres' dialect name; Railway still
        # emits URLs with the legacy postgres:// scheme.
        if self.database_url.startswith("postgres://"):
            self.database_url = "postgresql://" + self.database_url[len("postgres://"):]
        # If the URL still has no scheme separator it is not a valid connection string
        # (e.g. a Railway variable that didn't resolve).  Fall back to DATABASE_PUBLIC_URL.
        if "://" not in self.database_url:
            public = self.database_public_url.strip()
            if public:
                if public.startswith("postgres://"):
                    public = "postgresql://" + public[len("postgres://"):]
                logger.warning(
                    "DATABASE_URL appears invalid (no '://'). Falling back to DATABASE_PUBLIC_URL."
                )
                self.database_url = public
        return self

    @model_validator(mode="after")
    def normalize_magpie_base_url(self) -> "Settings":
        """Keep Magpie checkout endpoints on the API host expected by the platform."""
        base_url = (self.magpie_base_url or "").strip().rstrip("/")
        if not base_url:
            self.magpie_base_url = "https://api.pay.magpie.im"
            return self
        if "pay.magpie.im" in base_url:
            self.magpie_base_url = base_url.replace("https://pay.magpie.im", "https://api.pay.magpie.im").replace(
                "http://pay.magpie.im", "http://api.pay.magpie.im"
            )
        elif "api.magpie.im" in base_url and "api.pay.magpie.im" not in base_url:
            self.magpie_base_url = "https://api.pay.magpie.im"
        return self

    # Deployment platform detection (auto-set by each platform)
    railway_environment: str = ""   # set by Railway (e.g. "production")
    railway_project_id: str = ""    # set by Railway
    railway_public_domain: str = "" # set by Railway for the public HTTPS URL
    render: str = ""                # set by Render (e.g. "true")
    environment: str = "production" # general application environment flag
    maintenance_mode: bool = False
    maintenance_region: str = "all"
    maintenance_duration_hours: int = 24
    admin_diagnostics_enabled: bool = False
    bitgo_monitor_interval_minutes: int = 5

    # AWS Lambda Configuration
    is_lambda: bool = False
    lambda_function_name: str = "fastapi-backend"
    aws_region: str = "us-east-1"

    # API Keys - MUST BE SET IN ENVIRONMENT VARIABLES, NOT IN CODE
    telegram_bot_token: str = ""
    telegram_bot_username: str = ""
    telegram_webhook_secret: str = ""
    telegram_mini_app_url: str = ""
    xendit_secret_key: str = ""
    xendit_webhook_secret: str = ""
    xendit_webhook_token: str = ""
    xendit_callback_url: str = ""
    xendit_base_url: str = ""
    xendit_descriptor: str = "Click Store"

    # SwiftPay API
    swiftpay_access_key: str = ""
    swiftpay_secret_key: str = ""
    swiftpay_mode: str = "sandbox"  # "sandbox" or "production"
    swiftpay_base_url: str = ""
    swiftpay_balance_url: str = ""
    swiftpay_callback_url: str = ""

    # Facebook Messenger API
    messenger_app_id: str = ""
    messenger_app_secret: str = ""
    messenger_verify_token: str = ""
    messenger_page_access_token: str = ""

    # PhotonPay API (Alipay / WeChat Pay collection)
    # Credentials from PhotonPay merchant portal (Settings > Developer)
    photonpay_app_id: str = ""
    photonpay_app_secret: str = ""
    # Merchant RSA private key (PKCS#8 PEM) for signing outgoing API requests
    # MUST BE SET IN ENVIRONMENT VARIABLES, NOT IN CODE
    photonpay_rsa_private_key: str = ""
    # PhotonPay platform RSA public key for verifying incoming webhook signatures
    photonpay_rsa_public_key: str = ""
    # Site ID from PhotonPay merchant portal (Collection > Site Management)
    photonpay_site_id: str = ""
    # payMethod strings – adjust based on account type (e.g. "Alipay", "WeChat")
    photonpay_alipay_method: str = "Alipay"
    photonpay_wechat_method: str = "WeChat"
    photonpay_mode: str = "production"  # "production" or "sandbox"
    photonpay_base_url: str = ""        # override API base URL (leave empty to derive from photonpay_mode)
    photonpay_cashier_url: str = ""     # override cashier base URL (leave empty to derive from photonpay_mode)
    photonpay_callback_url: str = ""
    # Optional explicit proxy URL for PhotonPay HTTP requests (e.g. socks5://user:pass@host:port).
    # Use this when the deployment environment routes outbound traffic through a transparent proxy
    # that presents an invalid source IP to PhotonPay (e.g. Railway private networking → 0.0.0.0:0).
    photonpay_proxy_url: str = ""

    # General outbound proxy host and port.  Used as a fallback for any service that needs a
    # proxy when no service-specific proxy URL is configured (e.g. when PHOTONPAY_PROXY_URL is
    # empty, the PhotonPay service will construct "http://<proxy_host>:<proxy_port>" instead).
    # Leave proxy_host empty to disable.  proxy_port defaults to 8080 when proxy_host is set
    # and proxy_port is 0.
    proxy_host: str = ""
    proxy_port: int = 0

    # Public URLs
    frontend_url: str = ""
    public_checkout_host: str = "https://swiftpay.site"
    krw_checkout_host: str = "https://kr.swiftpay.site"
    gcash_hosted_deep_link_host: str = "https://swiftpay.site"

    # Magpie / Checkout integrations
    magpie_public_key: str = ""
    magpie_api_key: str = ""
    magpie_secret_key: str = ""
    magpie_base_url: str = "https://api.pay.magpie.im"
    magpie_mode: str = "production"
    magpie_callback_url: str = ""
    magpie_webhook_secret: str = ""
    magpie_krw_payment_methods: str = "card"
    magpie_circuit_threshold: int = 5
    magpie_circuit_cooldown_seconds: int = 60

    # Paymentwall Widget collection (configured in the Paymentwall merchant area)
    paymentwall_app_key: str = ""
    paymentwall_secret_key: str = ""
    paymentwall_widget_code: str = ""
    paymentwall_sign_version: int = 3

    # SMTP / Email
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "SwiftPay"
    resend_api_key: str = ""
    resend_from_email: str = ""

    # TransFi Checkout API
    transfi_api_key: str = ""
    transfi_mode: str = "production"   # "sandbox" or "production"
    transfi_webhook_secret: str = ""
    transfi_base_url: str = ""         # override base URL (leave empty for default)

    # Zip Payment API (zip.ph)
    zip_api_key: str = ""
    zip_base_url: str = "https://api.zip.ph"

    # Cloudflare Turnstile (server-side CAPTCHA verification)
    # Secret key from https://dash.cloudflare.com → Turnstile → your site → Secret Key
    # When set, protected authentication flows require a valid Turnstile token.
    cloudflare_turnstile_secret_key: str = ""
    cloudflare_turnstile_allowed_hostnames: str = "swiftpay.ph,swiftpay.site,kr.swiftpay.site"

    # USDT TRC20 wallet address for receiving top-up payments
    usdt_trc20_address: str = ""

    # Coins.ph Pro spot trading (keep API withdrawals disabled)
    coinsp_api_key: str = ""
    coinsp_api_secret: str = ""
    coinsp_api_base_url: str = "https://api.pro.coins.ph"
    coinsp_usdt_php_symbol: str = "USDTPHP"

    # SMS Gateway Configuration (Semaphore or Twilio)
    sms_provider: str = "semaphore"  # "semaphore" or "twilio"
    semaphore_api_key: str = ""
    semaphore_api_url: str = "https://api.semaphore.co/api/v4"
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    sms_max_retries: int = 3
    sms_retry_delay_ms: int = 1000
    sms_enable_notifications: bool = True

    # Simple admin authentication
    admin_user_id: str = ""
    admin_user_email: str = ""
    admin_user_password: str = ""
    telegram_admin_ids: str = ""
    google_client_id: str = ""
    passkey_rp_id: str = ""
    # Bot owner: the single Telegram user ID that is the super admin of the bot.
    # Only this user can approve/reject KYB registrations and manage bot admins.
    telegram_bot_owner_id: str = ""

    # SwiftPay platform organization defaults for super admin users.
    platform_organization_id: str = "swiftpay-ph"
    platform_organization_name: str = "SwiftPay Philippines"

    # Wallet withdrawal rules: funds that must remain after a withdrawal.
    # No retained security deposit is required for wallet withdrawals.
    php_security_deposit_min: float = 0.0
    usdt_security_deposit_min: float = 0.0
    krw_security_deposit_min: float = 0.0

    # JWT configuration
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours (increased from 60 mins for better dashboard UX)

    # Session timeout for automatic logout (in minutes)
    # When a user is inactive for this duration, they will be logged out
    session_timeout_minutes: int = 30  # 30 minutes of inactivity

    @field_validator(
        "environment",
        "swiftpay_mode",
        "photonpay_mode",
        "magpie_mode",
        "transfi_mode",
        "sms_provider",
        mode="before",
    )
    @classmethod
    def normalize_configuration_modes(cls, value: Any, info) -> str:
        normalized = str(value or "").strip().lower()
        allowed = {
            "environment": {"development", "dev", "test", "testing", "staging", "production", "prod", "live"},
            "swiftpay_mode": {"sandbox", "production"},
            "photonpay_mode": {"sandbox", "production"},
            "magpie_mode": {"sandbox", "production"},
            "transfi_mode": {"sandbox", "production"},
            "sms_provider": {"semaphore", "twilio"},
        }[info.field_name]
        if normalized not in allowed:
            raise ValueError(
                f"{info.field_name} must be one of: {', '.join(sorted(allowed))}"
            )
        return normalized

    @field_validator(
        "xendit_base_url",
        "swiftpay_base_url",
        "swiftpay_balance_url",
        "magpie_base_url",
        "transfi_base_url",
        "zip_base_url",
        "coinsp_api_base_url",
        "semaphore_api_url",
        "frontend_url",
        "public_checkout_host",
        "krw_checkout_host",
        "gcash_hosted_deep_link_host",
        "telegram_mini_app_url",
        mode="before",
    )
    @classmethod
    def normalize_configuration_urls(cls, value: Any) -> str:
        normalized = str(value or "").strip()
        if normalized and not normalized.startswith(("http://", "https://")):
            raise ValueError("URL settings must start with http:// or https://")
        return normalized.rstrip("/")

    @model_validator(mode="after")
    def validate_configuration_ranges(self) -> "Settings":
        if not 1 <= self.port <= 65535:
            raise ValueError("PORT must be between 1 and 65535")
        if not 1 <= self.smtp_port <= 65535:
            raise ValueError("SMTP_PORT must be between 1 and 65535")
        if self.proxy_port < 0 or self.proxy_port > 65535:
            raise ValueError("PROXY_PORT must be between 0 and 65535")
        if self.jwt_expire_minutes <= 0:
            raise ValueError("JWT_EXPIRE_MINUTES must be greater than zero")
        if self.session_timeout_minutes <= 0:
            raise ValueError("SESSION_TIMEOUT_MINUTES must be greater than zero")
        if not 1 <= self.bitgo_monitor_interval_minutes <= 60:
            raise ValueError("BITGO_MONITOR_INTERVAL_MINUTES must be between 1 and 60")
        return self

    @model_validator(mode="after")
    def strip_token_fields(self) -> "Settings":
        """Strip accidental leading/trailing whitespace from token/key fields.

        Copy-pasting credentials from dashboards (Railway, BotFather, etc.) often
        introduces invisible newlines or spaces that silently break HMAC verification.
        """
        for field in (
            "telegram_bot_token",
            "telegram_bot_username",
            "xendit_secret_key",
            "xendit_webhook_secret",
            "xendit_webhook_token",
            "swiftpay_access_key",
            "swiftpay_secret_key",
            "magpie_api_key",
            "magpie_secret_key",
            "photonpay_app_secret",
            "photonpay_rsa_private_key",
            "jwt_secret_key",
            "zip_api_key",
            "cloudflare_turnstile_secret_key",
            "smtp_password",
        ):
            val = getattr(self, field, None)
            if val:
                object.__setattr__(self, field, val.strip())
        return self

    @model_validator(mode="after")
    def generate_jwt_secret_if_missing(self) -> "Settings":
        """Auto-generate a random JWT secret when the configured value is missing or too short.

        Some deployment platforms create a fresh container on each deploy and do not persist a
        manually configured secret until after the first successful boot. A generated fallback keeps
        the app online and logs a clear warning that a real secret should be set in the deployment
        environment.
        """
        if not self.jwt_secret_key or len(self.jwt_secret_key) < 32:
            self.jwt_secret_key = secrets.token_hex(32)
            logger.warning(
                "JWT_SECRET_KEY is missing or too short. A temporary random secret has been "
                "generated for this deployment. Set a real secret in the environment to keep "
                "JWT tokens stable across restarts."
            )
        return self

    def validate_for_startup(self) -> "Settings":
        """Validate that startup prerequisites are present before the app boots."""
        env_name = (self.environment or "").strip().lower()
        is_production = env_name in {"production", "prod", "live"}

        logger.info(
            "Database configuration loaded: railway_environment=%s railway_project_configured=%s",
            bool(self.railway_environment),
            bool(self.railway_project_id),
        )

        if not self.database_url:
            raise ValueError("DATABASE_URL must be set before startup.")

        if not self.jwt_secret_key or len(self.jwt_secret_key) < 32:
            self.jwt_secret_key = secrets.token_hex(32)
            logger.warning(
                "JWT_SECRET_KEY was missing or too short; a new 32-byte secret has been generated "
                "for this startup. Set a stable secret in production to avoid token invalidation."
            )

        if is_production:
            missing = []
            if not self.telegram_bot_token:
                missing.append("TELEGRAM_BOT_TOKEN")
            if not self.telegram_bot_username:
                missing.append("TELEGRAM_BOT_USERNAME")
            if missing:
                logger.warning(
                    "Production startup continuing without Telegram bot configuration: %s. "
                    "Telegram integrations will stay disabled until these variables are set.",
                    ", ".join(missing),
                )
        else:
            if not self.telegram_bot_token:
                logger.warning(
                    "TELEGRAM_BOT_TOKEN is not configured; Telegram integrations will stay disabled in local mode."
                )

        return self

    @property
    def backend_url(self) -> str:
        """Generate backend URL from host and port."""
        if self.is_lambda:
            # In Lambda environment, return the API Gateway URL
            return os.environ.get(
                "PYTHON_BACKEND_URL", f"https://{self.lambda_function_name}.execute-api.{self.aws_region}.amazonaws.com"
            )
        else:
            # 1. Explicit override (highest priority)
            explicit_url = os.environ.get("PYTHON_BACKEND_URL", "")
            if explicit_url:
                return explicit_url
            # 2. Railway auto-provided public domain (set automatically by Railway)
            if self.railway_public_domain:
                return f"https://{self.railway_public_domain}"
            # 3. Render auto-provided public URL (set automatically by Render)
            render_external_url = os.environ.get("RENDER_EXTERNAL_URL", "")
            if render_external_url:
                return render_external_url
            render_hostname = os.environ.get("RENDER_EXTERNAL_HOSTNAME", "")
            if render_hostname:
                return f"https://{render_hostname}"
            # 4. Fallback to local address
            display_host = "127.0.0.1" if self.host == "0.0.0.0" else self.host
            return f"http://{display_host}:{self.port}"

    model_config = SettingsConfigDict(
        case_sensitive=False,
        extra="ignore",
        env_file=_get_env_file(),
        env_file_encoding="utf-8",
    )

    def __getattr__(self, name: str) -> Any:
        """
        Dynamically read attributes from environment variables.
        For example: settings.opapi_key reads from OPAPI_KEY environment variable.

        Args:
            name: Attribute name (e.g., 'opapi_key')

        Returns:
            Value from environment variable

        Raises:
            AttributeError: If attribute doesn't exist and not found in environment variables
        """
        # Convert attribute name to environment variable name (snake_case -> UPPER_CASE)
        env_var_name = name.upper()

        # Check if environment variable exists
        if env_var_name in os.environ:
            value = os.environ[env_var_name]
            # Cache the value in instance dict to avoid repeated lookups
            self.__dict__[name] = value
            logger.debug(f"Read dynamic attribute {name} from environment variable {env_var_name}")
            return value

        # If not found, raise AttributeError to maintain normal Python behavior
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")


# Global settings instance
settings = Settings()
