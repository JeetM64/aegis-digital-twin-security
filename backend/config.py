import os
import secrets
from datetime import timedelta
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))

load_dotenv()


class Config:
    # ── Core ──────────────────────────────────────────────────────────────────
    SECRET_KEY = os.environ.get("SECRET_KEY") or secrets.token_hex(16)

    # ── Database ──────────────────────────────────────────────────────────────
    # To use PostgreSQL set environment variable:
    # DATABASE_URL=postgresql://user:password@localhost:5432/aegis_db
    # Otherwise falls back to SQLite for development
    _db_url = os.environ.get("DATABASE_URL", "")
    if _db_url.startswith("postgres://"):
        # Fix Heroku-style postgres:// → postgresql://
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_DATABASE_URI = _db_url or \
        'sqlite:///' + os.path.join(basedir, 'digital_twin.db') + '?check_same_thread=False'

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle":  300,
    }

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY              = os.environ.get("JWT_SECRET_KEY") or secrets.token_hex(32)
    JWT_ACCESS_TOKEN_EXPIRES    = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES   = timedelta(days=7)
    JWT_TOKEN_LOCATION          = ["headers"]
    JWT_COOKIE_CSRF_PROTECT     = False
    JWT_COOKIE_SECURE           = False
    JWT_COOKIE_SAMESITE         = os.environ.get("JWT_COOKIE_SAMESITE", "Lax")
    JWT_REFRESH_COOKIE_PATH     = "/api/auth/refresh"

    # ── Email Alerts (Gmail) ──────────────────────────────────────────────────
    # Setup:
    # 1. Enable 2FA on your Gmail account
    # 2. Go to Google Account → Security → App Passwords
    # 3. Generate a 16-character app password
    # 4. Set MAIL_USERNAME=your-email@gmail.com
    #    Set MAIL_PASSWORD=your-16-char-app-password
    #    Set ALERT_EMAIL=email-to-receive-alerts@gmail.com
    MAIL_SERVER         = os.environ.get('MAIL_SERVER',   'smtp.gmail.com')
    MAIL_PORT           = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS        = True
    MAIL_USE_SSL        = False
    MAIL_USERNAME       = os.environ.get('MAIL_USERNAME', '')
    MAIL_PASSWORD       = os.environ.get('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', os.environ.get('MAIL_USERNAME', ''))
    ALERT_EMAIL         = os.environ.get('ALERT_EMAIL',   '')

    # ── Slack ─────────────────────────────────────────────────────────────────
    # Setup:
    # 1. Go to api.slack.com/apps → Create New App
    # 2. Add Bot Token Scopes: chat:write
    # 3. Install App → copy Bot User OAuth Token
    # 4. Set SLACK_BOT_TOKEN=xoxb-your-token
    #    Set SLACK_CHANNEL=#security-alerts
    SLACK_BOT_TOKEN = os.environ.get('SLACK_BOT_TOKEN', '')
    SLACK_CHANNEL   = os.environ.get('SLACK_CHANNEL',   '#security-alerts')

    # ── Scheduler ────────────────────────────────────────────────────────────
    SCHEDULER_ENABLED = os.environ.get('SCHEDULER_ENABLED', 'True') == 'True'

    # ── Timezone ─────────────────────────────────────────────────────────────
    TIMEZONE = 'Asia/Kolkata'