from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from models.user import Base

class RecoveryToken(Base):
    """One-time magic-link token for restoring an anonymous account on a new
    device. Only the SHA-256 of the token is stored."""
    __tablename__ = 'cf_recovery_tokens'

    token_hash = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey('cf_users.user_id'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
