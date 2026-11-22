from datetime import datetime

from sqlalchemy import Column, DateTime, String, Text

from .user import Base


class LoginToken(Base):
    """One-time sign-in link. Only a SHA-256 hash of the token is stored, so a
    database leak can't be used to sign in."""

    __tablename__ = "cf_login_tokens"

    token_hash = Column(String(64), primary_key=True)
    email = Column(Text, nullable=False)
    # The device that asked for the link (or the account a confirm link is for).
    requested_by = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
